"""Versioned inference from fitted research pipelines and calibrated estimators."""

from __future__ import annotations

import hashlib
import json
import math
import sys
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import pennylane as qml
import sklearn

DISCLAIMER = "Research-use prototype; the model output is not a medical diagnosis or treatment recommendation."
FEATURES_FHS = (
    "SEX", "AGE", "EDUC", "CURSMOKE", "CIGPDAY", "BPMEDS", "PREVSTRK",
    "PREVHYP", "DIABETES", "TOTCHOL", "SYSBP", "DIABP", "BMI", "HEARTRTE", "GLUCOSE",
)
FEATURES_UCI = (
    "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg", "thalach",
    "exang", "oldpeak", "slope", "ca", "thal",
)

# The Framingham bounds are the observed min/max in the audited eligible teaching cohort.
# They are input compatibility bounds, not clinical reference intervals.
FHS_FIELDS = (
    ("SEX", "Sex code", "code", 1, 2, "1 or 2"),
    ("AGE", "Age", "years", 32, 70, None),
    ("EDUC", "Education code", "code", 1, 4, "1 to 4"),
    ("CURSMOKE", "Current smoking", "0/1", 0, 1, "0 or 1"),
    ("CIGPDAY", "Cigarettes per day", "cigarettes/day", 0, 70, None),
    ("BPMEDS", "Blood pressure medication", "0/1", 0, 1, "0 or 1"),
    ("PREVSTRK", "Prior stroke", "0/1", 0, 1, "0 or 1"),
    ("PREVHYP", "Prior hypertension", "0/1", 0, 1, "0 or 1"),
    ("DIABETES", "Diabetes", "0/1", 0, 1, "0 or 1"),
    ("TOTCHOL", "Total cholesterol", "mg/dL", 113, 696, None),
    ("SYSBP", "Systolic blood pressure", "mmHg", 83.5, 295, None),
    ("DIABP", "Diastolic blood pressure", "mmHg", 50, 142.5, None),
    ("BMI", "Body mass index", "kg/m²", 15.54, 56.8, None),
    ("HEARTRTE", "Heart rate", "beats/min", 44, 143, None),
    ("GLUCOSE", "Glucose", "mg/dL", 40, 394, None),
)
UCI_FIELDS = (
    ("age", "Age", "years", 18, 100, None),
    ("sex", "Sex code", "0/1", 0, 1, "0 or 1"),
    ("cp", "Chest pain category", "code", 1, 4, "1 to 4"),
    ("trestbps", "Resting blood pressure", "mmHg", 70, 260, None),
    ("chol", "Serum cholesterol", "mg/dL", 80, 700, None),
    ("fbs", "Fasting blood sugar flag", "0/1", 0, 1, "0 or 1"),
    ("restecg", "Resting ECG category", "code", 0, 2, "0 to 2"),
    ("thalach", "Maximum heart rate", "beats/min", 50, 250, None),
    ("exang", "Exercise-induced angina", "0/1", 0, 1, "0 or 1"),
    ("oldpeak", "Exercise ST depression", "mm", -3, 10, None),
    ("slope", "ST slope category", "code", 1, 3, "1 to 3"),
    ("ca", "Major vessels count", "count", 0, 4, "0 to 4"),
    ("thal", "Thalassemia code", "code", 0, 7, "dataset code 0 to 7"),
)
FHS_DEMO = {
    "SEX": 2, "AGE": 48, "EDUC": 2, "CURSMOKE": 0, "CIGPDAY": 0,
    "BPMEDS": 0, "PREVSTRK": 0, "PREVHYP": 0, "DIABETES": 0,
    "TOTCHOL": 234, "SYSBP": 128, "DIABP": 82, "BMI": 25.41,
    "HEARTRTE": 75, "GLUCOSE": 78,
}
UCI_DEMO = {
    "age": 54, "sex": 1, "cp": 2, "trestbps": 130, "chol": 240,
    "fbs": 0, "restecg": 0, "thalach": 150, "exang": 0, "oldpeak": 1.0,
    "slope": 2, "ca": 0, "thal": 3,
}
MODELS = {
    "framingham-logistic-pca2": {
        "name": "Matched logistic regression", "workflow": "framingham",
        "type": "classical", "research_model": "logistic_pca2", "recommended": True,
        "limitation": "Teaching-data future-CHD benchmark; not clinical validation.",
    },
    "framingham-angle-qksvm-pca2": {
        "name": "Angle quantum-kernel SVM", "workflow": "framingham",
        "type": "quantum_kernel", "research_model": "angle_qksvm_pca2", "recommended": False,
        "limitation": "Exact simulator states and classical fidelity; no QPU execution or quantum speedup.",
    },
    "uci-rbf-svm": {
        "name": "Cleveland RBF SVM", "workflow": "uci",
        "type": "classical", "research_model": "rbf_svm", "recommended": True,
        "limitation": "Single-seed diagnostic smoke benchmark; no future-event or clinical validation.",
    },
}


class InvalidInput(ValueError):
    pass


class ArtifactError(RuntimeError):
    pass


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def schema(model_id: str) -> dict[str, Any]:
    if model_id not in MODELS:
        raise KeyError(model_id)
    workflow = MODELS[model_id]["workflow"]
    fields = FHS_FIELDS if workflow == "framingham" else UCI_FIELDS
    return {
        "modelId": model_id,
        "workflow": workflow,
        "fields": [
            {"name": name, "label": label, "unit": unit, "min": low, "max": high,
             "allowedCodes": allowed, "required": True, "nullable": workflow == "framingham"}
            for name, label, unit, low, high, allowed in fields
        ],
        "demo": dict(FHS_DEMO if workflow == "framingham" else UCI_DEMO),
        "demoLabel": "Synthetic teaching example; not a patient record",
        "rangeNote": "Framingham limits are observed teaching-cohort bounds, not medical reference ranges."
        if workflow == "framingham" else "UCI limits follow the research prediction validator.",
        "disclaimer": DISCLAIMER,
    }


def validate(model_id: str, features: Any) -> pd.DataFrame:
    if model_id not in MODELS:
        raise KeyError(model_id)
    if not isinstance(features, dict):
        raise InvalidInput("features must be a JSON object")
    fields = FHS_FIELDS if MODELS[model_id]["workflow"] == "framingham" else UCI_FIELDS
    names = {field[0] for field in fields}
    missing = names - set(features)
    unknown = set(features) - names
    if missing:
        raise InvalidInput(f"Missing fields: {', '.join(sorted(missing))}")
    if unknown:
        raise InvalidInput(f"Unknown or outcome fields: {', '.join(sorted(unknown))}")
    values = {}
    for name, _, _, low, high, allowed in fields:
        item = features[name]
        if item is None and MODELS[model_id]["workflow"] == "framingham":
            values[name] = np.nan
            continue
        if isinstance(item, bool):
            raise InvalidInput(f"{name} must be numeric")
        try:
            value = float(item)
        except (TypeError, ValueError) as exc:
            raise InvalidInput(f"{name} must be numeric") from exc
        if not math.isfinite(value) or not low <= value <= high:
            raise InvalidInput(f"{name} must be a finite number between {low} and {high}")
        if allowed is not None and value != int(value):
            raise InvalidInput(f"{name} must be an integer code")
        values[name] = value
    return pd.DataFrame([values], columns=[field[0] for field in fields])


class ModelStore:
    def __init__(self, root: Path):
        self.root = root.resolve()
        manifest_path = self.root / "manifest.json"
        evidence_path = self.root / "evidence.json"
        self.manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        self.evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
        if self.manifest.get("schemaVersion") != 1 or self.evidence.get("schemaVersion") != 1:
            raise ArtifactError("Unsupported QML artifact schema")
        if f"{sys.version_info.major}.{sys.version_info.minor}" != self.manifest["python"]:
            raise ArtifactError("Python version differs from the fitted bundle")
        if np.__version__ != self.manifest["researchEnvironment"]["numpy"]:
            raise ArtifactError("NumPy version differs from the fitted bundle")
        if sklearn.__version__ != self.manifest["researchEnvironment"]["sklearn"]:
            raise ArtifactError("scikit-learn version differs from the fitted bundle")
        if qml.__version__ != self.manifest["researchEnvironment"]["pennylane"]:
            raise ArtifactError("PennyLane version differs from the fitted bundle")
        for relative, entry in self.manifest["files"].items():
            path = (self.root / relative).resolve()
            if not path.is_relative_to(self.root) or not path.is_file() or _sha256(path) != entry["sha256"]:
                raise ArtifactError(f"Missing or corrupt QML artifact: {relative}")
        self.fhs_pipeline = joblib.load(self.root / "framingham/pca2_pipeline.joblib")
        if list(self.fhs_pipeline.feature_names_in_) != list(FEATURES_FHS):
            raise ArtifactError("Framingham preprocessing feature order mismatch")
        self.fhs_qsvm = joblib.load(self.root / "framingham/angle_qksvm_pca2/svm.joblib")
        self.fhs_qcal = joblib.load(self.root / "framingham/angle_qksvm_pca2/calibrator.joblib")
        with np.load(self.root / "framingham/angle_qksvm_pca2/training_states.npz", allow_pickle=False) as data:
            self.fhs_training_states = np.array(data["states"])
        if self.fhs_training_states.shape != (self.fhs_qsvm.n_features_in_, 4):
            raise ArtifactError("Quantum kernel training state shape mismatch")
        self.fhs_logistic = joblib.load(self.root / "framingham/logistic_pca2/model.joblib")
        self.fhs_lcal = joblib.load(self.root / "framingham/logistic_pca2/calibrator.joblib")
        self.uci_pipeline = joblib.load(self.root / "uci/selected_pipeline.joblib")
        if not isinstance(self.uci_pipeline, dict) or self.uci_pipeline.get("schemaVersion") != 1:
            raise ArtifactError("Unsupported UCI preprocessing bundle")
        self.uci_feature_order = list(self.uci_pipeline.get("featureOrder", ()))
        if self.uci_feature_order != ["thal", "cp", "thalach", "ca"]:
            raise ArtifactError("UCI preprocessing selected-feature order mismatch")
        if not {"imputer", "standardScaler"}.issubset(self.uci_pipeline):
            raise ArtifactError("UCI preprocessing bundle is incomplete")
        self.uci_rbf = joblib.load(self.root / "uci/rbf_svm.joblib")
        self.uci_cal = joblib.load(self.root / "uci/rbf_svm_platt.joblib")
        self._metrics = {
            "framingham-angle-qksvm-pca2": self._fhs_metric("angle_qksvm_pca2"),
            "framingham-logistic-pca2": self._fhs_metric("logistic_pca2"),
            "uci-rbf-svm": next(item for item in self.evidence["uci"]["models"] if item["model"] == "rbf_svm"),
        }
        self._device = qml.device("default.qubit", wires=2)

        @qml.qnode(self._device)
        def state(x):
            qml.AngleEmbedding(x, wires=range(2), rotation="Y")
            return qml.state()

        self._state = state

    def _fhs_metric(self, model: str) -> dict:
        return next(item for item in self.evidence["framingham"]["perSeed"]
                    if item["model"] == model and item["seed"] == self.manifest["framinghamSeed"])

    def models(self) -> list[dict]:
        return [{"id": model_id, **metadata, "version": self.manifest["version"], "ready": True}
                for model_id, metadata in MODELS.items()]

    def evidence_for(self, model_id: str) -> dict:
        if model_id not in MODELS:
            raise KeyError(model_id)
        return {"modelId": model_id, "selectedRun": self._metrics[model_id],
                "comparisons": self.evidence, "disclaimer": DISCLAIMER}

    def predict(self, model_id: str, features: Any) -> dict:
        frame = validate(model_id, features)
        meta = MODELS[model_id]
        if meta["workflow"] == "framingham":
            reduced = self.fhs_pipeline.transform(frame)
            if meta["type"] == "quantum_kernel":
                state = np.asarray(self._state(reduced[0]))
                kernel = np.clip(np.abs(state.conj() @ self.fhs_training_states.T) ** 2, 0, 1).reshape(1, -1)
                score = float(self.fhs_qsvm.decision_function(kernel)[0])
                calibration = self.fhs_qcal
                backend = {"type": "ideal_simulator", "name": "PennyLane default.qubit + classical cached-state fidelity"}
                resources = {"qubits": 2, "shots": None, "circuitDepth": None,
                             "circuitExecutionsThisPrediction": 1}
            else:
                score = float(self.fhs_logistic.decision_function(reduced)[0])
                calibration = self.fhs_lcal
                backend = {"type": "classical", "name": "scikit-learn"}
                resources = {"qubits": None, "shots": None, "circuitDepth": None}
            transformed = {"PCA component 1": float(reduced[0, 0]), "PCA component 2": float(reduced[0, 1])}
            run_id = self.manifest["framinghamRun"]
        else:
            selected = frame.loc[:, self.uci_feature_order]
            imputed = self.uci_pipeline["imputer"].transform(selected)
            reduced = np.asarray(self.uci_pipeline["standardScaler"].transform(imputed), dtype=float)
            score = float(self.uci_rbf.decision_function(reduced)[0])
            calibration = self.uci_cal
            backend = {"type": "classical", "name": "scikit-learn"}
            resources = {"qubits": None, "shots": None, "circuitDepth": None}
            transformed = {name: float(frame.iloc[0][name]) for name in self.uci_feature_order}
            run_id = self.manifest["uciRun"]
        probability = float(calibration.predict_proba(np.array([[score]]))[0, 1])
        threshold = float(self._metrics[model_id].get("selected_threshold", self._metrics[model_id].get("threshold")))
        elevated = bool(probability >= threshold)
        return {
            "prediction": "elevated research risk score" if elevated else "lower research risk score",
            "predictedClass": int(elevated), "score": score,
            "scoreType": "decision_value", "calibratedProbability": probability,
            "threshold": threshold,
            "model": {"id": model_id, "name": meta["name"], "version": self.manifest["version"], "type": meta["type"]},
            "preprocessingVersion": self.manifest["files"]["framingham/pca2_pipeline.joblib" if meta["workflow"] == "framingham" else "uci/selected_pipeline.joblib"]["sha256"],
            "researchRunId": run_id,
            "researchSeed": self.manifest["framinghamSeed"] if meta["workflow"] == "framingham" else 7,
            "backend": backend, "resources": resources,
            "inputFeatures": {key: (None if pd.isna(value) else float(value)) for key, value in frame.iloc[0].items()},
            "transformedFeatures": transformed,
            "warnings": [meta["limitation"], "Benchmark intervals describe groups, not confidence in this individual result."],
            "disclaimer": DISCLAIMER,
        }

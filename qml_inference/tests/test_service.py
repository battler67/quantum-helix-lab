from __future__ import annotations

import json
import shutil
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from qml_inference.model import ArtifactError, InvalidInput, ModelStore, schema, validate
from qml_inference.server import create_handler


BUNDLE = Path(__file__).resolve().parents[1] / "artifacts/v1"


class BundleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.store = ModelStore(BUNDLE)

    def test_all_promoted_models_run_synthetic_examples(self):
        for item in self.store.models():
            with self.subTest(item=item["id"]):
                output = self.store.predict(item["id"], schema(item["id"])["demo"])
                self.assertEqual(output["model"]["id"], item["id"])
                self.assertEqual(len(output["preprocessingVersion"]), 64)
                self.assertGreaterEqual(output["calibratedProbability"], 0)
                self.assertLessEqual(output["calibratedProbability"], 1)
                self.assertIn("not a medical diagnosis", output["disclaimer"])

    def test_schema_rejects_unknown_outcome_missing_and_bad_codes(self):
        item = schema("framingham-angle-qksvm-pca2")["demo"]
        with self.assertRaisesRegex(InvalidInput, "Unknown or outcome"):
            validate("framingham-angle-qksvm-pca2", {**item, "TIMECHD": 1})
        with self.assertRaisesRegex(InvalidInput, "Missing fields"):
            validate("framingham-angle-qksvm-pca2", {k: v for k, v in item.items() if k != "AGE"})
        with self.assertRaisesRegex(InvalidInput, "integer code"):
            validate("framingham-angle-qksvm-pca2", {**item, "SEX": 1.5})

    def test_corrupt_artifact_blocks_startup(self):
        with tempfile.TemporaryDirectory() as directory:
            copy = Path(directory) / "bundle"
            shutil.copytree(BUNDLE, copy)
            (copy / "framingham/pca2_pipeline.joblib").write_bytes(b"broken")
            with self.assertRaisesRegex(ArtifactError, "corrupt"):
                ModelStore(copy)

    def test_saved_demo_scores_remain_stable(self):
        expected = {
            "framingham-angle-qksvm-pca2": 0.056141051440025694,
            "framingham-logistic-pca2": 0.04850663739573488,
            "uci-rbf-svm": 0.25860280113179784,
        }
        for model_id, probability in expected.items():
            with self.subTest(model_id=model_id):
                value = self.store.predict(model_id, schema(model_id)["demo"])["calibratedProbability"]
                self.assertAlmostEqual(value, probability, places=8)


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.store = ModelStore(BUNDLE)
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), create_handler(cls.store, {"http://127.0.0.1:8080"}))
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}/api/qml/v1"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def call(self, path: str, body: dict | None = None):
        request = Request(
            self.base + path,
            data=json.dumps(body).encode("utf-8") if body is not None else None,
            headers={"Content-Type": "application/json", "Origin": "http://127.0.0.1:8080"},
        )
        try:
            with urlopen(request, timeout=10) as response:
                return response.status, dict(response.headers), json.load(response)
        except HTTPError as exc:
            return exc.code, dict(exc.headers), json.load(exc)

    def test_demo_journey_models_schema_predict_evidence_report(self):
        status, _, models = self.call("/models")
        self.assertEqual(status, 200)
        self.assertEqual(len(models["models"]), 3)
        model_id = "framingham-angle-qksvm-pca2"
        status, _, input_schema = self.call(f"/models/{model_id}/schema")
        self.assertEqual(status, 200)
        request = {"modelId": model_id, "features": input_schema["demo"]}
        status, headers, prediction = self.call("/predict", request)
        self.assertEqual(status, 200)
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.assertEqual(prediction["backend"]["type"], "ideal_simulator")
        status, _, evidence = self.call(f"/models/{model_id}/evidence")
        self.assertEqual(status, 200)
        self.assertEqual(evidence["selectedRun"]["model"], "angle_qksvm_pca2")
        status, _, report = self.call("/report", request)
        self.assertEqual(status, 200)
        self.assertEqual(report["prediction"]["preprocessingVersion"], prediction["preprocessingVersion"])
        self.assertIn("not a medical diagnosis", report["disclaimer"])

    def test_invalid_input_and_cors(self):
        example = schema("framingham-angle-qksvm-pca2")["demo"]
        status, _, response = self.call("/predict", {"modelId": "framingham-angle-qksvm-pca2", "features": {**example, "RANDID": 123}})
        self.assertEqual(status, 422)
        self.assertNotIn("123", json.dumps(response))
        denied = Request(self.base + "/models", headers={"Origin": "https://not-allowed.example"})
        with self.assertRaises(HTTPError) as caught:
            urlopen(denied, timeout=10)
        self.assertEqual(caught.exception.code, 403)


if __name__ == "__main__":
    unittest.main()

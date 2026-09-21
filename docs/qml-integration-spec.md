# QML portal integration specification

Status: implementation approved through the subsequent model-consolidation request and deployment choices. Target: portal `main`, via isolated branch `feature/qml-model-consolidation`. The original portal checkout and sibling `qml-research/` retain their pre-existing changes.

## Architecture and scope

The portal is React 19/TanStack Start with Tailwind, Radix components, Recharts and dark emerald styling. FastAPI/Qiskit in `quantum_search_api/` owns the existing genomic, NCBI, noise, hardware and report workflows. There is no suitable health-data account or storage pattern. Research artifacts require Python 3.12 while the existing backend uses Python 3.13, so a small separate local inference service follows the user's selected deployment layout. It runs only trusted, checksummed bundles and has no external provider calls or persisted history.

## Research inventory and selection

`docs/qml-model-inventory.json` lists **all 213** local serialized artifacts by source path, role, size and SHA-256, plus 72 recorded runs. The 213 include repeated seed artifacts and 26 tracked raw kernel matrices, not 213 deployable estimators. The inventory covers Framingham (141), EHR/UCI (40), QCNN (6) and raw kernel matrices (26). Research branches `qml-research-phase1`, `feature/qcnn-breast-cancer`, `feature/ehr-ihd-qml`, and `feature/framingham-dataset-audit` remain because each represents useful experiment history. None of the earlier branch tips tracks a complete fitted serving pipeline. No raw data, per-person predictions or full results tree is promoted.

| Candidate | Evidence | Decision |
| --- | --- | --- |
| Framingham Angle QKSVM PCA-2 | Completed audited three-seed teaching benchmark; mean AUROC 0.670, AUPRC 0.179, balanced accuracy 0.626. Fitted PCA-2 pipeline, SVM, 256 cached training states, calibrator and threshold load and replay. | Live educational quantum model, predeclared seed 11; two-qubit ideal state simulation and classical fidelity. |
| Framingham logistic PCA-2 | Same representation and matched 256-row training condition; mean AUROC 0.708, AUPRC 0.208, balanced accuracy 0.639. Bundle replays. | Live recommended matched classical comparator. |
| Framingham full-feature RBF SVM | Mean AUROC 0.760, with a larger full-feature training set. | Evidence only; separate full-training reference, never framed as matched. |
| Cleveland UCI RBF SVM | Best saved classical AUPRC in the single-seed diagnostic smoke run; fitted feature selector, estimator and calibrator replay. | Live **research demo** with explicit small-run limitation. |
| UCI OQSVM/HQMLP, WDBC QKSVM, QCNN/BreastMNIST, other Framingham quantum runs | Smoke/checkpoint or less stable evidence, incompatible image schema, absent verified serving bundle, or higher runtime/circuit cost. | Catalogued and evidence-only. No VQC/QCNN presented as production ready. |

The audited Framingham status and recomputation verification say completed; an older research narrative still says results pending. The completion state is taken from the saved status and verification files, and that documentation conflict is disclosed. The data are teaching/diagnostic benchmarks, not clinical validation. The QKSVM is neither QPU execution nor quantum speedup.

## Pages, journey and API

`/qml` introduces workflows and models; `/qml/analyze` has model-specific schema, synthetic example, manual entry and one-row CSV; `/qml/results` shows output and provenance; `/qml/evidence` compares saved results; `/qml/models/$modelId` explains model details. Existing landing/dashboard navigation links into the lab. Journey: lab → workflow/model → schema and input → validation → inference → result → evidence → local JSON report. Cards, typography, buttons, layout and responsive rules use the current design system; no new component library. Empty, loading, invalid-input, service-unavailable and report-failure states are explicit.

Versioned service endpoints: `GET /api/qml/v1/health`, `/models`, `/models/{id}/schema`, `/models/{id}/evidence`, `/evidence`; `POST /predict`, `/report`. Responses include model/bundle version, preprocessing hash, research run and seed, backend, available circuit resources, input/transformed features, calibrated probability, saved threshold, warnings and disclaimer. Unknown values remain null or unavailable. The report adds a timestamp and ephemeral ID; it is not stored.

Framingham requires the exact 15 ordered baseline fields (`SEX, AGE, EDUC, CURSMOKE, CIGPDAY, BPMEDS, PREVSTRK, PREVHYP, DIABETES, TOTCHOL, SYSBP, DIABP, BMI, HEARTRTE, GLUCOSE`). UCI requires its 13 recorded Cleveland fields. Outcome, participant and time columns are rejected. Schemas state units and bounds; Framingham bounds are observed cohort bounds, not medical reference intervals. Its saved median imputer accepts explicit null cells, but omitted keys are errors. CSV accepts one record with exact headers. Raw DNA has no compatible adapter.

At service startup, SHA-256, feature order, bundle/schema and Python library versions are checked before trusted joblib deserialization. The fitted imputer/scaler/PCA or selected-feature pipeline is reused without fitting. QKSVM performs one two-qubit state preparation, cached-state fidelity, SVM decision, saved calibration and threshold. No training runs in the API. Origin allowlist, bounded JSON, no request-body logs and `no-store` headers limit exposure. No external quantum, NCBI or AI report submission occurs.

## Verification and documentation

Verify exact replay against research held-out predictions, schema and corrupt-bundle failures, API shape/CORS/report, all synthetic model examples, existing backend suites, frontend build/lint, route and browser smoke flow, and narrow/mobile layout. Aggregate charts read deidentified saved evidence, with matched/full-training and ideal/noisy/hardware conditions distinguished. User instructions belong in `docs/qml-pages-user-guide.md`; README covers setup, dependencies, bundle location, tests and deployment. Expected files: `qml_inference/`, `scripts/qml_inventory.py`, `scripts/promote_qml_models.py`, `docs/qml-*`, `src/routes/qml*`, QML components/client/context, route tree and landing/dashboard navigation.

Assumptions: local CPU simulation, no authentication or persistence, no clinical use, no genomic adapter. Future model promotion requires a verified fitted preprocessing bundle, replay test and evidence review. The separate Python 3.12 service requires an exact frontend origin allowlist and a reachable service URL in deployment.

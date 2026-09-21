# QML Clinical Lab user guide

Open **QML Clinical Lab** from the portal landing page or dashboard, or visit `/qml`. The lab is a research-use interface for saved models. It does not diagnose disease, estimate a person's clinical prognosis, or recommend treatment.

## Supported workflows

| Workflow | Live models | What the label means |
| --- | --- | --- |
| Framingham teaching benchmark | Angle quantum-kernel SVM (PCA-2); matched logistic regression (recommended) | Educational 10-year incident CHD benchmark. The audited teaching mirror is not clinically validated. |
| Cleveland heart disease presence | Classical RBF SVM | Diagnostic dataset, single small smoke run. It does not measure future disease onset. |

Other UCI, WDBC, QCNN, BreastMNIST and Framingham experiments appear in the evidence/catalogue only. No raw DNA sequence is accepted by these tabular models. The portal's genomic analysis remains a separate workflow.

## Run an analysis

1. Choose **Analyze**, then the workflow and model. Only models with a verified serving bundle can be selected.
2. Click **Load synthetic demo** for a visibly labelled fabricated example, type all field values, or upload a one-row CSV. The CSV needs a header containing exactly the field names shown by the form. Empty Framingham cells use the model's saved median imputer; omitted columns and UCI empty cells are rejected.
3. Check the units and dataset code descriptions beside each field. Enter values within the shown compatibility bounds. These are dataset bounds, **not** healthy or clinical reference ranges.
4. Click **Run analysis**. A loading state appears while the local model runs. A validation or service error states what needs attention; no result is invented on failure.
5. The result page shows the research class, calibrated model probability, saved decision threshold and decision value, ordered inputs, transformed features, bundle/preprocessing provenance and backend. **Generate report** creates an ephemeral local JSON report with the same evidence and disclaimer; **Download JSON** saves it on your device. No history is stored by the portal.

The Framingham field names are `SEX, AGE, EDUC, CURSMOKE, CIGPDAY, BPMEDS, PREVSTRK, PREVHYP, DIABETES, TOTCHOL, SYSBP, DIABP, BMI, HEARTRTE, GLUCOSE`. The form displays age in years; cigarettes per day; total cholesterol and glucose in mg/dL; blood pressure in mmHg; BMI in kg/m²; heart rate in beats/min; and numeric dataset codes for the remaining fields. The Cleveland form displays its 13 exact fields and units. Use the labels/codes from the selected research dataset; do not substitute a different coding scheme.

## Read the output and comparison

The class is determined by a **model-specific saved threshold**. A calibrated model probability is a transformation of that model's score on research data, not a measured chance of disease for an individual. The decision value is the estimator's raw margin. PCA components are mathematical reductions, not identified biomarkers. An empty uncertainty field means individual uncertainty was not validated. Aggregate seed spread or confidence intervals describe benchmark variation and must not be read as confidence in a particular result.

On **Evidence**, compare the saved quantum and matched-feature classical Framingham results first. The full-feature RBF SVM used a larger training set, so its numbers are a separate reference. UCI and QCNN values come from smoke/checkpoint runs and are labelled accordingly. AUROC measures ranking across thresholds; AUPRC summarizes precision and recall for the positive class and is useful when positives are uncommon. Sensitivity is the fraction of positives identified, specificity the fraction of negatives identified. Balanced accuracy averages sensitivity and specificity. These population metrics do not validate an individual result.

The Angle QKSVM uses an **ideal two-qubit simulator** to prepare a state and classical calculations against cached training states. A noisy simulator would add a noise model or finite shots; a real-hardware result would require actual QPU execution. No live model here sends data to a QPU, and the evidence does not establish a general quantum advantage.

## Common problems

- **Service unavailable:** start the Python 3.12 QML inference service and check `/api/qml/v1/health`. The frontend needs `VITE_QML_API_BASE_URL` pointing to it.
- **Invalid CSV:** provide one data row with exact model-specific column names, no outcome column, numeric codes and values, and a file under the upload size limit.
- **Missing or out-of-range value:** fill every required key and use the bounds shown in the form. An explicit blank Framingham cell is handled by its saved imputer; an omitted column is not.
- **Bundle unavailable/corrupt:** an operator must restore the verified versioned bundle. The service refuses startup if its hashes or versions fail.
- **Result disappeared after refresh:** results and reports are deliberately held only in the current page session. Run the synthetic/manual input again; download a report if you need to retain it locally.

Use synthetic examples for demonstrations. Do not enter identifiable patient data into a research prototype. No QML input is sent to NCBI, an AI report provider or a quantum cloud backend by this workflow.

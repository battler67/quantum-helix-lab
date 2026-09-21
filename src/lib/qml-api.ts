export const QML_API_BASE = import.meta.env.VITE_QML_API_BASE_URL || "http://127.0.0.1:8010";
const PREFIX = "/api/qml/v1";

export type QmlField = {
  name: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  allowedCodes: string | null;
  required: boolean;
  nullable: boolean;
};
export type QmlSchema = {
  modelId: string;
  workflow: string;
  fields: QmlField[];
  demo: Record<string, number>;
  demoLabel: string;
  rangeNote: string;
  disclaimer: string;
};
export type QmlModel = {
  id: string;
  name: string;
  workflow: "framingham" | "uci";
  type: "classical" | "quantum_kernel";
  research_model: string;
  recommended: boolean;
  limitation: string;
  version: string;
  ready: boolean;
};
export type QmlPrediction = {
  prediction: string;
  predictedClass: number;
  score: number;
  scoreType: string;
  calibratedProbability: number;
  threshold: number;
  model: { id: string; name: string; version: string; type: string };
  preprocessingVersion: string;
  researchRunId: string;
  researchSeed: number;
  backend: { type: string; name: string };
  resources: {
    qubits: number | null;
    shots: number | null;
    circuitDepth: number | null;
    circuitExecutionsThisPrediction?: number;
  };
  inputFeatures: Record<string, number | null>;
  transformedFeatures: Record<string, number>;
  warnings: string[];
  disclaimer: string;
};
export type QmlRequest = { modelId: string; features: Record<string, number | null> };
export type QmlReport = {
  reportId: string;
  generatedAt: string;
  prediction: QmlPrediction;
  benchmark: Record<string, unknown>;
  disclaimer: string;
};
export type QmlEvidenceMetric = {
  model: string;
  auroc?: number;
  auprc?: number;
  balanced_accuracy?: number;
  recall_sensitivity?: number;
  sensitivity?: number;
  specificity?: number;
  f1?: number;
  mcc?: number;
  training_time_seconds?: number;
  qubits?: number;
};
export type QmlEvidence = {
  framingham: { summary: QmlEvidenceMetric[]; perSeed: QmlEvidenceMetric[]; limitation: string };
  uci: { models: QmlEvidenceMetric[]; limitation: string };
  qcnn: {
    runs: { runId: string; dataset: string; model: string; metrics: QmlEvidenceMetric }[];
    limitation: string;
  };
};
export type QmlModelEvidence = {
  modelId: string;
  selectedRun: QmlEvidenceMetric;
  comparisons: QmlEvidence;
  disclaimer: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${QML_API_BASE}${PREFIX}${path}`, { cache: "no-store", ...options });
  } catch {
    throw new Error(
      "QML inference service is unavailable. Start the Python 3.12 service and retry.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `QML request failed (${response.status})`);
  return data as T;
}

export const qmlApi = {
  health: () => request<{ status: string; bundleVersion: string }>("/health"),
  models: () => request<{ models: QmlModel[] }>("/models"),
  schema: (id: string) => request<QmlSchema>(`/models/${encodeURIComponent(id)}/schema`),
  evidence: () => request<QmlEvidence>("/evidence"),
  modelEvidence: (id: string) =>
    request<QmlModelEvidence>(`/models/${encodeURIComponent(id)}/evidence`),
  predict: (body: QmlRequest) =>
    request<QmlPrediction>("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  report: (body: QmlRequest) =>
    request<QmlReport>("/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
};

/** Single-row CSV with quoted fields. It never leaves the browser until prediction. */
export function parseQmlCsv(text: string, expected: string[]): Record<string, number | null> {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const normalized = text.replace(/\r\n/g, "\n").trim();
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (char === '"') {
      if (quoted && normalized[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if (char === "\n" && !quoted) {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (quoted) throw new Error("CSV has an unclosed quoted value.");
  row.push(cell.trim());
  rows.push(row);
  if (rows.length !== 2) throw new Error("Upload exactly one data row with a header.");
  const [header, values] = rows;
  if (
    header.length !== expected.length ||
    values.length !== header.length ||
    new Set(header).size !== header.length ||
    expected.some((name) => !header.includes(name))
  ) {
    throw new Error(`CSV must contain exactly these headers: ${expected.join(", ")}`);
  }
  return Object.fromEntries(
    header.map((name, i) => {
      if (values[i] === "") return [name, null];
      const numeric = Number(values[i]);
      if (!Number.isFinite(numeric)) throw new Error(`${name} must be numeric.`);
      return [name, numeric];
    }),
  );
}

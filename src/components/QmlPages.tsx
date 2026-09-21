import { lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Atom,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Download,
  FileText,
  FlaskConical,
  HeartPulse,
  Loader2,
  Microscope,
  Upload,
} from "lucide-react";
import { BackgroundFX } from "@/components/BackgroundFX";
import {
  qmlApi,
  parseQmlCsv,
  type QmlEvidence as QmlEvidenceData,
  type QmlEvidenceMetric,
  type QmlModel,
  type QmlModelEvidence,
  type QmlReport,
  type QmlSchema,
} from "@/lib/qml-api";
import { useQmlSession } from "@/lib/qml-context";

const QmlEvidenceChart = lazy(() => import("@/components/QmlEvidenceChart"));

const NOTICE =
  "Research-use prototype. Outputs are educational model scores, not a diagnosis or treatment recommendation.";
const panel =
  "rounded-2xl border border-white/10 bg-card/70 p-5 shadow-xl shadow-black/10 backdrop-blur-sm";
const button =
  "inline-flex items-center justify-center gap-2 rounded-full bg-emerald px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald disabled:cursor-not-allowed disabled:opacity-50";
const subtleButton =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald";

function Shell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundFX />
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 py-5">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald to-cyan-glow text-background">
              <Atom size={19} />
            </span>{" "}
            QDNA <span className="text-sm font-normal text-muted-foreground">/ Clinical Lab</span>
          </Link>
          <nav aria-label="QML navigation" className="flex flex-wrap items-center gap-2 text-sm">
            <Link to="/qml" className={subtleButton}>
              Overview
            </Link>
            <Link to="/qml/analyze" className={subtleButton}>
              Analyze
            </Link>
            <Link to="/qml/evidence" className={subtleButton}>
              Evidence
            </Link>
            <Link to="/quantum-search" className={subtleButton}>
              Genomic Lab
            </Link>
          </nav>
        </header>
        <main id="main-content" className="py-9">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald">
              {eyebrow}
            </p>
            <h1 className="mt-2 max-w-4xl font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              {title}
            </h1>
          </div>
          {children}
        </main>
        <footer className="border-t border-white/10 py-5 text-xs text-muted-foreground">
          {NOTICE}
        </footer>
      </div>
    </div>
  );
}

function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <div
      role={error ? "alert" : "note"}
      className={`flex gap-3 rounded-xl border p-4 text-sm ${error ? "border-red-400/30 bg-red-400/10 text-red-100" : "border-emerald/25 bg-emerald/10 text-muted-foreground"}`}
    >
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
      {children}
    </div>
  );
}

function useModels() {
  const [models, setModels] = useState<QmlModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    qmlApi
      .models()
      .then((result) => {
        if (active) setModels(result.models);
      })
      .catch((reason) => {
        if (active) setError(reason.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return { models, loading, error };
}

export function QmlLanding() {
  const { models, loading, error } = useModels();
  return (
    <Shell
      eyebrow="Hybrid model workspace"
      title="Explore disease-risk models with evidence in view."
    >
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className={`${panel} relative overflow-hidden p-7 sm:p-9`}>
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald/15 blur-3xl" />
          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1 text-xs text-emerald">
              <FlaskConical size={14} /> Local simulator · versioned research artifacts
            </div>
            <h2 className="max-w-2xl font-display text-2xl font-semibold sm:text-3xl">
              A guided, transparent QML teaching workflow
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              Compare a two-qubit quantum-kernel model with a matched classical model on audited
              Framingham teaching data. Explore a separate Cleveland diagnostic benchmark. Every
              score comes from a saved model and its fitted preprocessing.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/qml/analyze" className={button}>
                Start analysis <ArrowRight size={16} />
              </Link>
              <Link to="/qml/evidence" className={subtleButton}>
                Review evidence <BarChart3 size={16} />
              </Link>
            </div>
          </div>
        </section>
        <aside className={`${panel} flex flex-col justify-between`}>
          <HeartPulse className="text-emerald" size={30} />
          <div>
            <h2 className="mt-5 font-display text-xl font-semibold">Research boundaries</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Framingham estimates an educational future-CHD class from baseline measurements.
              Cleveland is a diagnostic presence benchmark. Neither accepts raw DNA or establishes
              clinical readiness.
            </p>
          </div>
          <Notice>
            Input stays in this browser session and the local inference service. The QML workflow
            does not send it to an external quantum backend.
          </Notice>
        </aside>
      </div>
      <section className="mt-9">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">Available models</h2>
          <span className="text-xs text-muted-foreground">QML + classical comparison</span>
        </div>
        {loading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="animate-spin" size={16} /> Checking model readiness…
          </p>
        )}
        {error && <Notice error>{error}</Notice>}
        {!loading && !error && models.length === 0 && (
          <Notice>No verified models are available.</Notice>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          {models.map((model) => (
            <article key={model.id} className={panel}>
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-emerald/10 px-2.5 py-1 text-xs text-emerald">
                  {model.type === "quantum_kernel" ? "Quantum kernel" : "Classical"}
                </span>
                {model.recommended && <span className="text-xs text-cyan-glow">Recommended</span>}
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold">{model.name}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{model.limitation}</p>
              <div className="mt-5 flex gap-3 text-sm">
                <Link to="/qml/analyze" className="text-emerald hover:underline">
                  Use model
                </Link>
                <Link
                  to="/qml/models/$modelId"
                  params={{ modelId: model.id }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Model details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <div className="mt-8">
        <Notice>
          QCNN, VQC, hybrid QMLP and other research runs are included in the evidence catalogue.
          Smoke or incomplete runs are not available for live prediction.
        </Notice>
      </div>
    </Shell>
  );
}

export function QmlAnalyze() {
  const navigate = useNavigate();
  const { setCurrent } = useQmlSession();
  const { models, loading, error: modelsError } = useModels();
  const [workflow, setWorkflow] = useState<"framingham" | "uci">("framingham");
  const [modelId, setModelId] = useState("");
  const [schema, setSchema] = useState<QmlSchema | null>(null);
  const [values, setValues] = useState<Record<string, number | null>>({});
  const [source, setSource] = useState<"manual" | "synthetic demo" | "uploaded CSV">("manual");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const available = useMemo(
    () => models.filter((model) => model.workflow === workflow),
    [models, workflow],
  );
  useEffect(() => {
    const next = available.find((model) => model.recommended) || available[0];
    if (next) setModelId(next.id);
  }, [available]);
  useEffect(() => {
    if (!modelId) return;
    let active = true;
    setSchema(null);
    setValues({});
    qmlApi
      .schema(modelId)
      .then((result) => {
        if (active) setSchema(result);
      })
      .catch((reason) => {
        if (active) setMessage(reason.message);
      });
    return () => {
      active = false;
    };
  }, [modelId]);
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 16_384) {
      setMessage("CSV must be 16 KB or smaller.");
      return;
    }
    try {
      if (!schema) throw new Error("Wait for the model schema to load.");
      setValues(
        parseQmlCsv(
          await file.text(),
          schema.fields.map((field) => field.name),
        ),
      );
      setSource("uploaded CSV");
      setMessage("");
    } catch (reason) {
      setMessage((reason as Error).message);
    }
  }
  async function submit() {
    if (!schema) return;
    setMessage("");
    const missing = schema.fields.filter((field) => !(field.name in values));
    if (missing.length) {
      setMessage(
        `Enter or load all required fields: ${missing.map((field) => field.name).join(", ")}`,
      );
      return;
    }
    for (const field of schema.fields) {
      const value = values[field.name];
      if (value === null && field.nullable) continue;
      if (
        value === null ||
        !Number.isFinite(value) ||
        value < field.min ||
        value > field.max ||
        (field.allowedCodes && !Number.isInteger(value))
      ) {
        setMessage(
          `${field.label} must be between ${field.min} and ${field.max}${field.allowedCodes ? " and use an integer code" : ""}.`,
        );
        return;
      }
    }
    const request = { modelId, features: values };
    setBusy(true);
    try {
      const prediction = await qmlApi.predict(request);
      setCurrent({ request, prediction });
      await navigate({ to: "/qml/results" });
    } catch (reason) {
      setMessage((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell
      eyebrow="Step 01 · Prepare input"
      title="Run a model with exactly the features it expects."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.7fr]">
        <aside className="space-y-5">
          <section className={panel}>
            <h2 className="font-display text-lg font-semibold">Choose a workflow</h2>
            <div className="mt-4 grid gap-2">
              {(["framingham", "uci"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setWorkflow(item);
                    setMessage("");
                  }}
                  className={`rounded-xl border p-4 text-left transition ${workflow === item ? "border-emerald/60 bg-emerald/10" : "border-white/10 hover:bg-white/5"}`}
                >
                  <span className="block font-medium">
                    {item === "framingham"
                      ? "Future CHD teaching benchmark"
                      : "Cleveland heart disease presence"}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {item === "framingham"
                      ? "15 baseline features · educational 10-year endpoint"
                      : "13 clinical features · diagnostic smoke run"}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className={panel}>
            <label htmlFor="qml-model" className="block font-display text-lg font-semibold">
              Select model
            </label>
            <select
              id="qml-model"
              value={modelId}
              onChange={(event) => setModelId(event.target.value)}
              className="mt-3 w-full rounded-xl border border-white/15 bg-background p-3 text-sm"
              disabled={loading || busy}
            >
              {available.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                  {model.recommended ? " · recommended" : ""}
                </option>
              ))}
            </select>
            <p className="mt-3 text-xs text-muted-foreground">
              {available.find((model) => model.id === modelId)?.limitation}
            </p>
          </section>
          <Notice>{NOTICE}</Notice>
        </aside>
        <section className={panel}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold">Measurements</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use a synthetic example, enter values or upload a one-row CSV.
              </p>
            </div>
            <span className="rounded-full border border-emerald/25 bg-emerald/10 px-3 py-1 text-xs text-emerald">
              {source}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className={subtleButton}
              disabled={!schema || busy}
              onClick={() => {
                if (schema) {
                  setValues(schema.demo);
                  setSource("synthetic demo");
                  setMessage("");
                }
              }}
            >
              <FlaskConical size={15} /> Load synthetic demo
            </button>
            <label className={`${subtleButton} cursor-pointer`}>
              <Upload size={15} /> Upload CSV
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => void upload(event.target.files?.[0])}
              />
            </label>
            <button
              type="button"
              className={subtleButton}
              onClick={() => {
                setValues({});
                setSource("manual");
              }}
            >
              <ArrowLeft size={15} /> Clear
            </button>
          </div>
          {schema && (
            <p className="mt-4 text-xs text-muted-foreground">
              {schema.rangeNote} Empty Framingham cells use the fitted median imputer.
            </p>
          )}
          {!schema && !modelsError && (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="animate-spin" size={16} /> Loading input schema…
            </p>
          )}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {schema?.fields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={`qml-${field.name}`}
                  className="flex items-center justify-between gap-2 text-sm font-medium"
                >
                  <span>{field.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">{field.unit}</span>
                </label>
                <input
                  id={`qml-${field.name}`}
                  type="number"
                  min={field.min}
                  max={field.max}
                  step="any"
                  value={values[field.name] ?? ""}
                  onChange={(event) => {
                    setSource("manual");
                    setValues((prior) => ({
                      ...prior,
                      [field.name]: event.target.value === "" ? null : Number(event.target.value),
                    }));
                  }}
                  placeholder={`${field.min}–${field.max}`}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-emerald/60 focus:ring-2 focus:ring-emerald/15"
                  aria-describedby={`qml-hint-${field.name}`}
                />
                <p id={`qml-hint-${field.name}`} className="mt-1 text-xs text-muted-foreground">
                  {field.name} · {field.allowedCodes || `${field.min} to ${field.max}`}
                </p>
              </div>
            ))}
          </div>
          {(message || modelsError) && (
            <div className="mt-5">
              <Notice error>{message || modelsError}</Notice>
            </div>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!schema || busy}
              className={button}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
              {busy ? "Calculating with saved model…" : "Run analysis"}
            </button>
            <span className="text-xs text-muted-foreground">No analysis history is stored.</span>
          </div>
        </section>
      </div>
    </Shell>
  );
}

function formatMetric(value: unknown, percent = true) {
  return typeof value === "number" && Number.isFinite(value)
    ? percent
      ? `${(value * 100).toFixed(1)}%`
      : value.toFixed(3)
    : "Unavailable";
}

export function QmlResults() {
  const { current } = useQmlSession();
  const [report, setReport] = useState<QmlReport | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [error, setError] = useState("");
  if (!current)
    return (
      <Shell eyebrow="Step 02 · Result" title="No analysis is open.">
        <Notice>
          Results live only in this browser session. Start a new analysis to view a result.
        </Notice>
        <Link to="/qml/analyze" className={`${button} mt-5`}>
          Start analysis
        </Link>
      </Shell>
    );
  const { prediction, request } = current;
  async function makeReport() {
    setReportBusy(true);
    setError("");
    try {
      setReport(await qmlApi.report(request));
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setReportBusy(false);
    }
  }
  function download() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `qml-report-${report.reportId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Shell eyebrow="Step 02 · Result" title="A research score, with its provenance attached.">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className={`${panel} p-7`}>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1 text-xs text-emerald">
            <CheckCircle2 size={14} /> Analysis complete
          </span>
          <h2 className="mt-6 font-display text-3xl font-semibold">{prediction.prediction}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The class follows the saved, model-specific decision threshold. It is not a clinical
            risk estimate for an individual.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-xs text-muted-foreground">Calibrated model probability</div>
              <div className="mt-1 font-display text-2xl">
                {formatMetric(prediction.calibratedProbability)}
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-xs text-muted-foreground">Decision threshold</div>
              <div className="mt-1 font-display text-2xl">{formatMetric(prediction.threshold)}</div>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-xs text-muted-foreground">Decision value</div>
              <div className="mt-1 font-display text-2xl">
                {formatMetric(prediction.score, false)}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Notice>{prediction.disclaimer}</Notice>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/qml/evidence" className={subtleButton}>
              <BarChart3 size={15} /> Compare evidence
            </Link>
            <Link
              to="/qml/models/$modelId"
              params={{ modelId: prediction.model.id }}
              className={subtleButton}
            >
              <Atom size={15} /> Model details
            </Link>
          </div>
        </section>
        <aside className="space-y-5">
          <section className={panel}>
            <h2 className="font-display text-lg font-semibold">Model provenance</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Model", prediction.model.name],
                ["Bundle version", prediction.model.version],
                ["Research run", prediction.researchRunId],
                ["Seed", prediction.researchSeed],
                ["Preprocessing SHA-256", `${prediction.preprocessingVersion.slice(0, 16)}…`],
                ["Backend", prediction.backend.name],
                ["Qubits", prediction.resources.qubits ?? "Not applicable"],
                ["Shots", prediction.resources.shots ?? "Analytic / not applicable"],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex justify-between gap-4 border-b border-white/5 pb-2"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="max-w-[60%] break-words text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section className={panel}>
            <h2 className="font-display text-lg font-semibold">Report</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A local structured report includes this output, the saved benchmark record, timestamp
              and disclaimer.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void makeReport()}
                disabled={reportBusy}
                className={button}
              >
                {reportBusy ? (
                  <Loader2 className="animate-spin" size={15} />
                ) : (
                  <FileText size={15} />
                )}{" "}
                Generate report
              </button>
              {report && (
                <button type="button" onClick={download} className={subtleButton}>
                  <Download size={15} /> Download JSON
                </button>
              )}
            </div>
            {report && (
              <p className="mt-3 text-xs text-emerald">
                Report {report.reportId.slice(0, 12)} ·{" "}
                {new Date(report.generatedAt).toLocaleString()}
              </p>
            )}
            {error && (
              <div className="mt-3">
                <Notice error>{error}</Notice>
              </div>
            )}
          </section>
        </aside>
      </div>
      <section className={`${panel} mt-6`}>
        <h2 className="font-display text-xl font-semibold">Inputs and transformed features</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          PCA components are mathematical reductions, not individual biomarker importance.
        </p>
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-emerald">Measurements used</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {Object.entries(prediction.inputFeatures).map(([name, value]) => (
                <div
                  key={name}
                  className="flex justify-between gap-2 rounded-lg bg-white/5 px-3 py-2"
                >
                  <span className="text-muted-foreground">{name}</span>
                  <span>{value ?? "Imputed"}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-cyan-glow">Saved preprocessing output</h3>
            <div className="mt-3 space-y-2 text-sm">
              {Object.entries(prediction.transformedFeatures).map(([name, value]) => (
                <div
                  key={name}
                  className="flex justify-between gap-3 rounded-lg bg-white/5 px-3 py-2"
                >
                  <span className="text-muted-foreground">{name}</span>
                  <span>{value.toFixed(3)}</span>
                </div>
              ))}
            </div>
            <ul className="mt-5 list-disc space-y-2 pl-5 text-xs text-muted-foreground">
              {prediction.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </Shell>
  );
}

export function QmlEvidence() {
  const [data, setData] = useState<QmlEvidenceData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    qmlApi
      .evidence()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((reason) => {
        if (active) setError(reason.message);
      });
    return () => {
      active = false;
    };
  }, []);
  const summary: QmlEvidenceMetric[] = Array.isArray(data?.framingham?.summary)
    ? data.framingham.summary
    : [];
  const selected = summary.filter((row) =>
    ["angle_qksvm_pca2", "logistic_pca2", "rbf_svm_full"].includes(row.model),
  );
  const chart = selected.map((row) => ({
    model: row.model.replaceAll("_", " "),
    AUROC: row.auroc,
    AUPRC: row.auprc,
    "Balanced accuracy": row.balanced_accuracy,
  }));
  return (
    <Shell eyebrow="Step 03 · Compare" title="See the evidence before trusting a score.">
      {error && <Notice error>{error}</Notice>}
      {!data && !error && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="animate-spin" size={16} /> Loading saved benchmark evidence…
        </p>
      )}
      {data && (
        <>
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <section className={panel}>
              <h2 className="font-display text-xl font-semibold">Audited Framingham comparison</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Three repeated seeds. Quantum and PCA-2 logistic models use 256 matched training
                rows. The full-feature RBF model uses a larger training set and is a separate
                reference.
              </p>
              <div
                role="img"
                aria-label="Saved Framingham AUROC, AUPRC and balanced accuracy by model"
                className="mt-5 h-72"
              >
                <Suspense
                  fallback={<p className="p-5 text-sm text-muted-foreground">Loading chart…</p>}
                >
                  <QmlEvidenceChart data={chart} />
                </Suspense>
              </div>
            </section>
            <aside className={`${panel} flex flex-col justify-center`}>
              <Microscope size={30} className="text-emerald" />
              <h2 className="mt-5 font-display text-xl font-semibold">What this evidence means</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                AUROC measures ranking across thresholds. AUPRC highlights positive-case retrieval,
                especially when cases are uncommon. Sensitivity is the share of positives detected;
                specificity is the share of negatives correctly rejected. None is an individual
                confidence score.
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                The quantum kernel used exact simulated states and classical fidelity. No real
                hardware or general quantum advantage is claimed.
              </p>
            </aside>
          </div>
          <section className={`${panel} mt-6 overflow-x-auto`}>
            <h2 className="font-display text-xl font-semibold">Measured aggregate metrics</h2>
            <table className="mt-4 min-w-[760px] w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {[
                    "Model",
                    "AUROC",
                    "AUPRC",
                    "Balanced accuracy",
                    "Sensitivity",
                    "Specificity",
                    "F1",
                    "Fit time",
                  ].map((head) => (
                    <th key={head} className="px-3 py-3 font-medium">
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selected.map((row) => (
                  <tr key={row.model} className="border-b border-white/5">
                    <td className="px-3 py-3 font-medium">
                      {row.model.replaceAll("_", " ")}
                      {row.model === "rbf_svm_full" && (
                        <span className="block text-xs text-cyan-glow">
                          Full-training reference
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">{formatMetric(row.auroc)}</td>
                    <td className="px-3 py-3">{formatMetric(row.auprc)}</td>
                    <td className="px-3 py-3">{formatMetric(row.balanced_accuracy)}</td>
                    <td className="px-3 py-3">{formatMetric(row.recall_sensitivity)}</td>
                    <td className="px-3 py-3">{formatMetric(row.specificity)}</td>
                    <td className="px-3 py-3">{formatMetric(row.f1)}</td>
                    <td className="px-3 py-3">
                      {typeof row.training_time_seconds === "number"
                        ? `${row.training_time_seconds.toFixed(3)} s`
                        : "Unavailable"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-muted-foreground">
              The repeated test splits overlap; their spread is descriptive. Scores are from
              educational data and do not establish clinical performance.
            </p>
          </section>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <section className={panel}>
              <h2 className="font-display text-xl font-semibold">Cleveland UCI smoke run</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                One small diagnostic test split. Classical RBF SVM is available for a research
                demonstration; Pauli OQSVM and hybrid QMLP remain evidence only.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {data.uci.models.map((row) => (
                  <li
                    key={row.model}
                    className="flex justify-between gap-2 border-b border-white/5 py-2"
                  >
                    <span>{row.model.replaceAll("_", " ")}</span>
                    <span className="text-emerald">AUPRC {formatMetric(row.auprc)}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className={panel}>
              <h2 className="font-display text-xl font-semibold">QCNN and image experiments</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                All ten recorded runs are catalogued. These are smoke/checkpoint experiments; WDBC
                is diagnostic and BreastMNIST uses image inputs.
              </p>
              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto text-sm">
                {data.qcnn.runs.map((row) => (
                  <div
                    key={row.runId}
                    className="flex justify-between gap-3 border-b border-white/5 py-2"
                  >
                    <span>
                      {row.dataset} · {row.model.replaceAll("_", " ")}
                    </span>
                    <span className="shrink-0 text-cyan-glow">
                      AUROC {formatMetric(row.metrics.auroc)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="mt-6">
            <Notice>
              Only verified serving bundles appear on the analysis page. The complete local artifact
              inventory records every serialized research file and its SHA-256 without publishing
              raw records or patient-level predictions.
            </Notice>
          </div>
        </>
      )}
    </Shell>
  );
}

export function QmlModelDetails({ modelId }: { modelId: string }) {
  const [model, setModel] = useState<QmlModel | null>(null);
  const [evidence, setEvidence] = useState<QmlModelEvidence | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([qmlApi.models(), qmlApi.modelEvidence(modelId)])
      .then(([models, result]) => {
        if (active) {
          setModel(models.models.find((item) => item.id === modelId) || null);
          setEvidence(result);
        }
      })
      .catch((reason) => {
        if (active) setError(reason.message);
      });
    return () => {
      active = false;
    };
  }, [modelId]);
  return (
    <Shell eyebrow="Model file · provenance" title={model?.name || "Model details"}>
      {error && <Notice error>{error}</Notice>}
      {!model && !error && (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Loader2 size={16} className="animate-spin" /> Loading model details…
        </p>
      )}
      {model && evidence && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className={panel}>
            <div className="flex items-center gap-2 text-emerald">
              <Atom size={20} />
              <span className="text-xs uppercase tracking-widest">
                {model.type.replace("_", " ")}
              </span>
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">How it works</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {model.type === "quantum_kernel"
                ? "Fifteen ordered baseline inputs pass through the exact fitted median imputer, standardizer, two-component PCA and angle scaler. Two rotation-Y qubits encode those components. A simulated state is compared with saved training states through classical fidelity, then the saved SVM, calibrator and threshold produce the output."
                : model.workflow === "framingham"
                  ? "The same fitted two-component PCA representation feeds a saved logistic regression model, followed by its own calibration and threshold. It is the matched classical comparison for the two-qubit quantum kernel."
                  : "Thirteen Cleveland fields are validated, then the saved four-feature selector and preprocessing pipeline feed an RBF SVM. Its calibration and threshold were fitted on validation data."}
            </p>
            <div className="mt-5">
              <Notice>{model.limitation}</Notice>
            </div>
          </section>
          <section className={panel}>
            <h2 className="font-display text-xl font-semibold">Saved configuration</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Model version", model.version],
                ["Research model", model.research_model],
                [
                  "Backend",
                  model.type === "quantum_kernel"
                    ? "Ideal local simulator + classical fidelity"
                    : "Classical CPU",
                ],
                ["Qubits", model.type === "quantum_kernel" ? "2" : "Not applicable"],
                [
                  "Trainable circuit parameters",
                  model.type === "quantum_kernel" ? "0" : "Not applicable",
                ],
                [
                  "Training fit",
                  model.workflow === "framingham" ? "256 matched rows" : "Single-seed smoke run",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between gap-4 border-b border-white/5 pb-2"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right">{value}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-6 font-semibold">Selected test evidence</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                ["AUROC", evidence.selectedRun.auroc],
                ["AUPRC", evidence.selectedRun.auprc],
                [
                  "Sensitivity",
                  evidence.selectedRun.recall_sensitivity ?? evidence.selectedRun.sensitivity,
                ],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-lg bg-white/5 p-3">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="mt-1 font-display text-lg">{formatMetric(value)}</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              These are benchmark group metrics, not confidence for one prediction.
            </p>
          </section>
          <Link to="/qml/analyze" className={button}>
            Use this workflow <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </Shell>
  );
}

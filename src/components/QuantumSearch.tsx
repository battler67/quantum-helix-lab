import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion, type Variants } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Cpu,
  Database,
  Dna,
  Download,
  FileJson,
  FileText,
  FlaskConical,
  Loader2,
  Play,
  Search,
  Upload,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BackgroundFX } from "@/components/BackgroundFX";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const API_BASE = import.meta.env.VITE_QUANTUM_API_BASE_URL || "http://127.0.0.1:8000";

type Algorithm = "frqi" | "grover" | "hybrid";
type Scope =
  | "refseq_reference"
  | "refseq_representative"
  | "genbank_gca"
  | "refseq_gcf"
  | "organism_assemblies"
  | "taxonomy_assemblies"
  | "exact_assembly"
  | "exact_genomic_nucleotide"
  | "gene_on_assembly"
  | "uploaded_fasta"
  | "pasted_sequence";

type Estimate = {
  recordCount: number;
  totalBases: number;
  totalWindows: number;
  acceptedWindows: number;
  skippedWindows: number;
  ambiguousBases: number;
  estimatedQuantumRuns: number;
  estimatedShots: number;
  estimatedLogicalQubits: number;
  estimatedGroverIterations: number;
  exceedsSimulatorLimits: boolean;
  samplingOrTruncation: boolean;
  warnings: string[];
  quantumAlphabet: "ACGT";
};

type SearchResult = {
  jobId: string;
  algorithm: string;
  quantumAlphabet: "ACGT";
  retrieval: { provider: string; recordCount: number; totalBases: number; retrievedAt: string };
  pipeline: { retrieval: string; prefilter: string; quantumStage: string; validation: string };
  hits: Array<{
    rank: number;
    accession: string;
    recordTitle: string;
    organism?: string;
    taxId?: string;
    sourceDatabase?: string;
    chromosome?: string;
    strand: string;
    start: number;
    end: number;
    matchedWindow: string;
    querySequence: string;
    quantumScore: number;
    algorithm: string;
    classicalValidation?: { matches: boolean; positionsWithinWindow: number[] };
    quantumDetails: Record<string, unknown>;
  }>;
  quantumMetrics: Record<string, unknown>;
  blastCheck?: BlastCheck;
  warnings: string[];
  truncation: { occurred: boolean; reason: string | null };
};

type BlastCheck = {
  queryLength: number;
  database: string;
  entrezQuery: string;
  maxRecords: number;
  records: Array<{
    accession: string;
    recordTitle: string;
    organismName: string;
    source: string;
    sequenceLength: number;
    percentIdentity: number;
    alignmentLength: number;
    eValue: string;
    bitScore: string;
    alsoReturnedByQuantum?: boolean;
  }>;
  organisms: Array<{
    organismName: string;
    recordCount: number;
    bestPercentIdentity: number;
    records: Array<{ accession: string; recordTitle: string; percentIdentity: number }>;
  }>;
  quantumAccessionsChecked: string[];
  matchingQuantumAccessions: string[];
};

type JobStatusSnapshot = {
  jobId: string;
  status: string;
  progress?: Array<{ status: string; message: string; percent?: string }>;
  progressPercent?: number;
  elapsedSeconds?: number;
  estimatedRemainingSeconds?: number | null;
  error?: string | null;
};

type AnalysisImport = {
  accession: string;
  recordTitle: string;
  organismName: string;
  geneName: string;
  moleculeType: string;
  sequenceLength: number;
  sequence: string;
  unsupportedBases: Array<{ base: string; count: number; firstPositions: number[] }>;
  atgcRegions: Array<{ start: number; end: number; length: number }>;
  warnings: string[];
};

const executionSteps = [
  {
    label: "Retrieving genomic records",
    reachedBy: ["retrieving_records", "preprocessing", "estimating_resources", "building_circuit", "simulating", "completed"],
    completeBy: ["preprocessing", "estimating_resources", "building_circuit", "simulating", "completed"],
    activeBy: ["queued", "retrieving_records"],
  },
  {
    label: "Normalizing sequences",
    reachedBy: ["preprocessing", "estimating_resources", "building_circuit", "simulating", "completed"],
    completeBy: ["estimating_resources", "building_circuit", "simulating", "completed"],
    activeBy: ["preprocessing"],
  },
  {
    label: "Generating windows",
    reachedBy: ["estimating_resources", "building_circuit", "simulating", "completed"],
    completeBy: ["estimating_resources", "building_circuit", "simulating", "completed"],
    activeBy: ["preprocessing", "estimating_resources"],
  },
  {
    label: "Building quantum circuit",
    reachedBy: ["building_circuit", "simulating", "completed"],
    completeBy: ["simulating", "completed"],
    activeBy: ["building_circuit"],
  },
  {
    label: "Running simulator",
    reachedBy: ["simulating", "completed"],
    completeBy: ["completed"],
    activeBy: ["simulating"],
  },
];

const scopes: Array<{ value: Scope; label: string; detail: string }> = [
  {
    value: "refseq_reference",
    label: "RefSeq reference assemblies",
    detail: "Reference GCF genomic FASTA only",
  },
  {
    value: "refseq_representative",
    label: "RefSeq representative assemblies",
    detail: "Representative/reference GCF genomes",
  },
  { value: "genbank_gca", label: "GenBank GCA assemblies", detail: "GenBank genome assemblies" },
  { value: "refseq_gcf", label: "RefSeq GCF assemblies", detail: "RefSeq genome assemblies" },
  {
    value: "organism_assemblies",
    label: "Organism assemblies",
    detail: "Datasets Genome by organism",
  },
  {
    value: "taxonomy_assemblies",
    label: "Taxonomy ID assemblies",
    detail: "Datasets Genome by taxon",
  },
  {
    value: "exact_assembly",
    label: "Exact GCA/GCF accessions",
    detail: "Selected assembly accessions",
  },
  {
    value: "exact_genomic_nucleotide",
    label: "Exact genomic nucleotide accessions",
    detail: "Entrez with biomol_genomic",
  },
  {
    value: "gene_on_assembly",
    label: "Gene on selected assembly",
    detail: "Disabled until genomic region resolution is enabled",
  },
  {
    value: "uploaded_fasta",
    label: "Uploaded genomic FASTA",
    detail: "Local genomic nucleotide FASTA",
  },
  { value: "pasted_sequence", label: "Pasted genomic DNA", detail: "Local pasted target sequence" },
];

const algorithmCards = [
  {
    value: "frqi" as Algorithm,
    title: "FRQI Similarity",
    detail: "Ranks bounded genomic windows with the existing FRQI strip-qubit similarity circuit.",
  },
  {
    value: "grover" as Algorithm,
    title: "Grover Search",
    detail: "Uses the existing QGSA exact-pattern circuit over ACGT-compatible windows.",
  },
  {
    value: "hybrid" as Algorithm,
    title: "Hybrid Search",
    detail: "Selectable research field only in this build; execution is not enabled yet.",
  },
];

export function QuantumSearch() {
  const navigate = useNavigate();
  const [querySource, setQuerySource] = useState<"pasted" | "uploaded_fasta" | "ncbi_accession">(
    "pasted",
  );
  const [querySequence, setQuerySequence] = useState("ACGT");
  const [uploadedFasta, setUploadedFasta] = useState("");
  const [queryAccession, setQueryAccession] = useState("");
  const [algorithm, setAlgorithm] = useState<Algorithm>("grover");
  const [scope, setScope] = useState<Scope>("genbank_gca");
  const [organism, setOrganism] = useState("Escherichia coli");
  const [gene, setGene] = useState("");
  const [taxId, setTaxId] = useState("");
  const [assemblyAccessions, setAssemblyAccessions] = useState("");
  const [nucleotideAccessions, setNucleotideAccessions] = useState("");
  const [shots, setShots] = useState(1024);
  const [maxRecords, setMaxRecords] = useState(25);
  const [maxWindows, setMaxWindows] = useState(16);
  const [maxQueryLength, setMaxQueryLength] = useState(32);
  const [stride, setStride] = useState(1);
  const [strand, setStrand] = useState<"forward" | "both">("both");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [status, setStatus] = useState("");
  const [jobStatus, setJobStatus] = useState<JobStatusSnapshot | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [limitDialog, setLimitDialog] = useState<{ title: string; message: string } | null>(null);
  const [analysisImport, setAnalysisImport] = useState<AnalysisImport | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [regionStart, setRegionStart] = useState(1);
  const [regionEnd, setRegionEnd] = useState(1);
  const [validatingCandidates, setValidatingCandidates] = useState(false);
  const didMount = useRef(false);

  const activeQuery = querySource === "uploaded_fasta" ? uploadedFasta : querySequence;
  const sequencePreview = useMemo(
    () => activeQuery.replace(/^>.*$/gm, "").replace(/\s/g, "").toUpperCase(),
    [activeQuery],
  );
  const queryValid = /^[ACGT]*$/.test(sequencePreview) && sequencePreview.length > 0;
  const queryWithinLength = sequencePreview.length <= maxQueryLength;
  const largeScope = maxRecords > 10 || maxWindows > 64;
  const jobStageStatuses = new Set([
    ...(jobStatus?.progress?.map((entry) => entry.status) ?? []),
    ...(jobStatus?.status ? [jobStatus.status] : []),
    ...(result ? ["completed"] : []),
  ]);
  const reachedStepCount = executionSteps.filter((step) =>
    step.reachedBy.some((status) => jobStageStatuses.has(status)),
  ).length;
  const workflowHasProgress = Boolean(result) || reachedStepCount > 0;
  const displayedStepCount = result
    ? executionSteps.length
    : Math.min(reachedStepCount, executionSteps.length - 1);
  const jobProgressPercent = workflowHasProgress
    ? Math.round((displayedStepCount / executionSteps.length) * 100)
    : 0;

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    setEstimate(null);
    setResult(null);
    setJobStatus(null);
    setStatus("Configuration changed; run a new estimate before execution");
  }, [
    querySource,
    querySequence,
    uploadedFasta,
    queryAccession,
    algorithm,
    scope,
    organism,
    gene,
    taxId,
    assemblyAccessions,
    nucleotideAccessions,
    shots,
    maxRecords,
    maxWindows,
    maxQueryLength,
    stride,
    strand,
  ]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accession = params.get("analysisAccession");
    if (!accession) return;
    let ignore = false;
    async function loadAnalysisImport() {
      setAnalysisLoading(true);
      setAnalysisError("");
      try {
        const response = await fetch(
          `${API_BASE}/api/ncbi/entrez/records/${encodeURIComponent(accession)}/analysis`,
        );
        const body = await response.json().catch(() => ({ detail: response.statusText }));
        if (!response.ok) throw new Error(String(body.detail || response.statusText));
        if (ignore) return;
        const imported = body as AnalysisImport;
        setAnalysisImport(imported);
        const firstRegion = imported.atgcRegions[0];
        if (firstRegion) {
          const end = Math.min(firstRegion.end, firstRegion.start + maxQueryLength - 1);
          setRegionStart(firstRegion.start);
          setRegionEnd(end);
          setQuerySource("pasted");
          setQuerySequence(imported.sequence.slice(firstRegion.start - 1, end));
        }
      } catch (err) {
        if (!ignore) {
          setAnalysisError(err instanceof Error ? err.message : "Could not fetch NCBI sequence");
        }
      } finally {
        if (!ignore) setAnalysisLoading(false);
      }
    }
    loadAnalysisImport();
    return () => {
      ignore = true;
    };
  }, [maxQueryLength]);

  const showNumberLimitDialog = (
    label: string,
    attemptedValue: number,
    min: number,
    max: number,
    appliedValue: number,
  ) => {
    setLimitDialog({
      title: `${label} limit exceeded`,
      message: `${label} must be between ${min} and ${max}. You entered ${attemptedValue}; the field was reset to ${appliedValue}.`,
    });
  };

  const showQueryLengthDialog = (limit = maxQueryLength) => {
    setLimitDialog({
      title: "Query length limit exceeded",
      message: `The active query is ${sequencePreview.length} bases long. This form currently allows up to ${limit} bases; the portal maximum is 128 bases.`,
    });
  };

  const handleMaxQueryLengthChange = (value: number) => {
    setMaxQueryLength(value);
    if (sequencePreview.length > value) {
      showQueryLengthDialog(value);
    }
  };

  const applyAnalysisRegion = () => {
    if (!analysisImport) return;
    const start = Math.max(1, Math.min(regionStart, analysisImport.sequenceLength));
    const end = Math.max(start, Math.min(regionEnd, analysisImport.sequenceLength));
    const selectedRegion = analysisImport.sequence.slice(start - 1, end).toUpperCase();
    if (selectedRegion.length > maxQueryLength) {
      showQueryLengthDialog(maxQueryLength);
      return;
    }
    if (!/^[ACGT]+$/.test(selectedRegion)) {
      setLimitDialog({
        title: "Unsupported bases in selected region",
        message: "The selected region contains bases outside A, T, G and C. Choose one of the detected ATGC-only regions before analysis.",
      });
      return;
    }
    setQuerySource("pasted");
    setQuerySequence(selectedRegion);
    setUploadedFasta("");
    setResult(null);
    setEstimate(null);
    setStatus(`Imported ${analysisImport.accession}:${start}-${end}`);
  };

  const requestPayload = () => ({
    querySource,
    querySequence: querySource === "pasted" ? querySequence : null,
    uploadedFasta:
      querySource === "uploaded_fasta"
        ? uploadedFasta
        : scope === "uploaded_fasta"
          ? uploadedFasta
          : null,
    queryAccession: querySource === "ncbi_accession" ? queryAccession : null,
    algorithm,
    databaseScope: scope,
    organism: organism || null,
    gene: gene || null,
    taxId: taxId || null,
    assemblyAccessions: splitList(assemblyAccessions),
    nucleotideAccessions: splitList(nucleotideAccessions),
    maxRecords,
    maxBasesPerRecord: 10000,
    maxTotalBases: 50000,
    maxWindows,
    maxQueryLength,
    strand,
    windowStride: stride,
    shots,
    simulator: "aer",
    mismatchThreshold: 0,
    enableClassicalValidation: false,
    enableBlastBaseline: false,
  });

  async function postJson<T>(path: string, payload: unknown): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error(
        `Cannot reach the quantum search API at ${API_BASE}. Start the backend with: python -m uvicorn quantum_search_api.app:app --reload --port 8000`,
      );
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(formatApiError(body, response.statusText));
    }
    return response.json();
  }

  async function handleEstimate() {
    if (!queryWithinLength) {
      showQueryLengthDialog();
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    setStatus("Estimating resources");
    try {
      const data = await postJson<Estimate>("/api/quantum-search/estimate", requestPayload());
      setEstimate(data);
      setStatus("Estimate ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Estimate failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleRun() {
    if (!queryWithinLength) {
      showQueryLengthDialog();
      return;
    }
    if (!estimate) {
      setLimitDialog({
        title: "New estimate required",
        message: "Search settings changed after the last estimate. Run Estimate again before starting execution.",
      });
      setStatus("Run a new estimate before execution");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    setJobStatus(null);
    setStatus("Submitting quantum search job");
    try {
      const job = await postJson<{ jobId: string; status: string }>(
        "/api/quantum-search/jobs",
        requestPayload(),
      );
      setJobStatus({ jobId: job.jobId, status: job.status, progressPercent: 0 });
      void navigate({ to: "/quantum-search-results", search: { jobId: job.jobId } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setBusy(false);
    }
  }

  async function pollJob(jobId: string) {
    for (let i = 0; i < 240; i += 1) {
      let jobResponse: Response;
      try {
        jobResponse = await fetch(`${API_BASE}/api/quantum-search/jobs/${jobId}`);
      } catch {
        throw new Error(`Cannot poll quantum search job ${jobId}; the API at ${API_BASE} is unreachable.`);
      }
      const jobBody = await jobResponse.json().catch(() => ({ detail: jobResponse.statusText }));
      if (!jobResponse.ok) {
        throw new Error(formatApiError(jobBody, `Could not poll quantum search job ${jobId}`));
      }
      const job = jobBody as JobStatusSnapshot;
      setJobStatus(job);
      setStatus(job.progress?.at(-1)?.message || job.status);
      if (job.status === "completed") {
        const resultResponse = await fetch(`${API_BASE}/api/quantum-search/jobs/${jobId}/results`);
        const resultBody = await resultResponse.json().catch(() => ({ detail: resultResponse.statusText }));
        if (!resultResponse.ok) {
          throw new Error(formatApiError(resultBody, `Could not fetch quantum search results for ${jobId}`));
        }
        setResult(resultBody as SearchResult);
        setJobStatus({ ...job, progressPercent: 100, estimatedRemainingSeconds: 0 });
        setStatus("Results ready");
        setBusy(false);
        return;
      }
      if (job.status === "failed" || job.status === "cancelled") {
        throw new Error(job.error || `Job ${job.status}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error("Search timed out while polling job status");
  }

  async function handleValidateCandidates() {
    if (!result?.jobId) return;
    setValidatingCandidates(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/quantum-search/jobs/${result.jobId}/validate`, {
        method: "POST",
      });
      const body = await response.json().catch(() => ({ detail: response.statusText }));
      if (!response.ok) throw new Error(String(body.detail || response.statusText));
      setResult(body);
      setStatus("Results ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Candidate validation failed");
    } finally {
      setValidatingCandidates(false);
    }
  }

  const probabilityData = useMemo(() => {
    const first = result?.hits?.[0]?.quantumDetails;
    const probs = first?.indexProbabilities || first?.counts;
    if (!probs) return [];
    return Object.entries(probs).map(([index, probability]) => ({
      index,
      probability: Number(probability),
    }));
  }, [result]);

  return (
    <div className="relative min-h-screen">
      <BackgroundFX />
      <header className="sticky top-0 z-30 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-emerald to-cyan-glow glow-emerald">
              <Dna className="absolute inset-0 m-auto h-4 w-4 text-background" />
            </div>
            <span className="font-display text-lg font-semibold">QDNA Genomic Search</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/ncbi/search"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground"
            >
              <Search className="h-4 w-4" /> NCBI Search
            </Link>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] space-y-6 p-6 lg:p-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <div className="text-xs uppercase tracking-widest text-emerald">
              Nucleotide sequence search
            </div>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
              NCBI genomic DNA quantum search
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              NCBI retrieves bounded genomic FASTA records; FRQI or Grover processes ACGT-compatible
              windows only.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleEstimate}
              disabled={busy || !queryValid || algorithm === "hybrid"}
              variant="outline"
              className="rounded-full border-white/10 bg-white/5"
            >
              <BarChart3 className="h-4 w-4" /> Estimate
            </Button>
            <Button
              onClick={handleRun}
              disabled={
                busy || !estimate || estimate.exceedsSimulatorLimits || algorithm === "hybrid"
              }
              className="rounded-full bg-emerald text-primary-foreground glow-emerald"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}{" "}
              Run Search
            </Button>
          </div>
        </motion.div>

        {(largeScope || algorithm === "hybrid") && (
          <div className="glass rounded-2xl p-4 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
              <span>
                {algorithm === "hybrid"
                  ? "Hybrid is available as a user field only in this build; run FRQI or Grover for execution."
                  : "Large database searches use staged retrieval and bounded quantum processing. The entire GenBank database is not loaded into the quantum circuit."}
              </span>
            </div>
          </div>
        )}

        {(analysisLoading || analysisImport || analysisError) && (
          <Panel title="NCBI Sequence Analysis" eyebrow="Imported accession" icon={Dna}>
            {analysisLoading && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin text-emerald" /> Fetching nucleotide sequence from NCBI
              </div>
            )}
            {analysisError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {analysisError}
              </div>
            )}
            {analysisImport && (
              <div className="space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-4">
                  <Metric label="Accession" value={analysisImport.accession} />
                  <Metric label="Organism" value={analysisImport.organismName || "Unknown"} />
                  <Metric label="Length" value={analysisImport.sequenceLength} />
                  <Metric label="Molecule" value={analysisImport.moleculeType || "DNA"} />
                </div>
                {analysisImport.unsupportedBases.length > 0 ? (
                  <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/10 p-3 text-xs text-yellow-100">
                    Unsupported bases detected:{" "}
                    {analysisImport.unsupportedBases
                      .map((item) => `${item.base} (${item.count})`)
                      .join(", ")}
                    . They are not removed automatically.
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald/20 bg-emerald/10 p-3 text-xs text-emerald">
                    No unsupported bases detected in the fetched sequence.
                  </div>
                )}
                <div className="grid gap-3 md:grid-cols-[1fr_0.6fr_0.6fr_auto]">
                  <select
                    value={`${regionStart}-${regionEnd}`}
                    onChange={(event) => {
                      const [start, end] = event.target.value.split("-").map(Number);
                      setRegionStart(start);
                      setRegionEnd(Math.min(end, start + maxQueryLength - 1));
                    }}
                    className="theme-select rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  >
                    {analysisImport.atgcRegions.map((region) => (
                      <option key={`${region.start}-${region.end}`} value={`${region.start}-${region.end}`}>
                        ATGC region {region.start}-{region.end} ({region.length} bp)
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    max={analysisImport.sequenceLength}
                    value={regionStart}
                    onChange={(event) => setRegionStart(Number(event.target.value))}
                    className="border-white/10 bg-black/30"
                  />
                  <Input
                    type="number"
                    min={regionStart}
                    max={analysisImport.sequenceLength}
                    value={regionEnd}
                    onChange={(event) => setRegionEnd(Number(event.target.value))}
                    className="border-white/10 bg-black/30"
                  />
                  <Button onClick={applyAnalysisRegion} className="rounded-full bg-emerald text-primary-foreground">
                    Apply Region
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Choose FRQI comparison or Grover sequence search below, then run an estimate before execution.
                </p>
              </div>
            )}
          </Panel>
        )}

        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Query DNA Sequence" eyebrow="What to search for" icon={Upload}>
            <p className="mb-3 text-xs text-muted-foreground">
              Query is the DNA sequence you want to find. Reference/Search Set below is where the portal searches for it.
            </p>
            <div className="mb-3 grid gap-2 sm:grid-cols-3">
              {(["pasted", "uploaded_fasta", "ncbi_accession"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setQuerySource(item)}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    querySource === item
                      ? "border-emerald/40 bg-emerald/15 text-emerald"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.replace("_", " ")}
                </button>
              ))}
            </div>
            {querySource === "ncbi_accession" ? (
              <Input
                value={queryAccession}
                onChange={(event) => setQueryAccession(event.target.value)}
                placeholder="NC_000913.3"
                className="border-white/10 bg-black/30"
              />
            ) : (
              <Textarea
                value={querySource === "uploaded_fasta" ? uploadedFasta : querySequence}
                onChange={(event) =>
                  querySource === "uploaded_fasta"
                    ? setUploadedFasta(event.target.value)
                    : setQuerySequence(event.target.value)
                }
                placeholder={querySource === "uploaded_fasta" ? ">query\nACGTACGT" : "ACGTACGT"}
                className="h-32 resize-none border-white/10 bg-black/30 font-mono text-xs"
              />
            )}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="font-mono text-muted-foreground">
                {sequencePreview.slice(0, 40) || "No sequence"}
              </div>
              <div className={queryValid && queryWithinLength ? "text-emerald" : "text-red-400"}>
                {queryValid && queryWithinLength ? (
                  <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                ) : (
                  <XCircle className="mr-1 inline h-3.5 w-3.5" />
                )}
                {sequencePreview.length} bases · ACGT only
              </div>
            </div>
          </Panel>

          <Panel title="Reference / Search Set" eyebrow="Where to search" icon={Database}>
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value as Scope)}
              className="theme-select w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm focus:border-emerald/40 focus:outline-none"
            >
              {scopes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">
              {scopes.find((item) => item.value === scope)?.detail}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                value={gene}
                onChange={(event) => setGene(event.target.value)}
                placeholder="Gene name, e.g. lacZ or BRCA1"
                className="border-white/10 bg-black/30"
              />
              <Input
                value={organism}
                onChange={(event) => setOrganism(event.target.value)}
                placeholder="Species / organism, e.g. Escherichia coli"
                className="border-white/10 bg-black/30"
              />
              <Input
                value={taxId}
                onChange={(event) => setTaxId(event.target.value)}
                placeholder="Taxonomy ID"
                className="border-white/10 bg-black/30"
              />
              <Input
                value={assemblyAccessions}
                onChange={(event) => setAssemblyAccessions(event.target.value)}
                placeholder="GCF_..., GCA_..."
                className="border-white/10 bg-black/30 sm:col-span-2"
              />
              <Input
                value={nucleotideAccessions}
                onChange={(event) => setNucleotideAccessions(event.target.value)}
                placeholder="Exact genomic nucleotide accessions"
                className="border-white/10 bg-black/30 sm:col-span-2"
              />
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {algorithmCards.map((item) => (
            <button
              key={item.value}
              onClick={() => setAlgorithm(item.value)}
              className={`glass rounded-2xl p-5 text-left transition hover:-translate-y-0.5 ${
                algorithm === item.value ? "border-emerald/50 bg-emerald/10" : ""
              }`}
            >
              <Cpu className="mb-3 h-5 w-5 text-emerald" />
              <div className="font-display text-lg font-semibold">{item.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Search Configuration" eyebrow={algorithm} icon={FlaskConical}>
            <div className="grid gap-3">
              <LabelledNumber
                label="Shots"
                value={shots}
                setValue={setShots}
                min={1}
                max={8192}
                onLimitExceeded={showNumberLimitDialog}
              />
              <LabelledNumber
                label="Maximum query length"
                value={maxQueryLength}
                setValue={handleMaxQueryLengthChange}
                min={1}
                max={128}
                onLimitExceeded={showNumberLimitDialog}
              />
              <LabelledNumber
                label="Maximum reference records"
                value={maxRecords}
                setValue={setMaxRecords}
                min={1}
                max={100}
                onLimitExceeded={showNumberLimitDialog}
              />
              <LabelledNumber
                label="Maximum windows"
                value={maxWindows}
                setValue={setMaxWindows}
                min={1}
                max={512}
                onLimitExceeded={showNumberLimitDialog}
              />
              <LabelledNumber
                label="Window stride"
                value={stride}
                setValue={setStride}
                min={1}
                max={1000}
                onLimitExceeded={showNumberLimitDialog}
              />
              <select
                value={strand}
                onChange={(event) => setStrand(event.target.value as "forward" | "both")}
                className="theme-select rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
              >
                <option value="forward">Forward strand</option>
                <option value="both">Both strands</option>
              </select>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-muted-foreground">
                Mismatch threshold is fixed at 0 because the current Grover oracle supports exact
                matching only.
              </div>
            </div>
          </Panel>

          <Panel title="Resource Estimate" eyebrow="Before execution" icon={BarChart3}>
            {estimate ? (
              <>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Metric label="Records" value={estimate.recordCount} />
                  <Metric label="Bases" value={estimate.totalBases} />
                  <Metric label="Windows" value={estimate.acceptedWindows} />
                  <Metric label="Skipped" value={estimate.skippedWindows} />
                  <Metric label="Qubits" value={estimate.estimatedLogicalQubits} />
                  <Metric label="Shots" value={estimate.estimatedShots} />
                  <Metric label="Grover iter." value={estimate.estimatedGroverIterations} />
                  <Metric label="Alphabet" value={estimate.quantumAlphabet} />
                </div>
                {estimate.exceedsSimulatorLimits && (
                  <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                    This request exceeds local simulator limits. Reduce the query/window length or
                    switch to FRQI similarity before running.
                  </div>
                )}
                {estimate.warnings.length > 0 && (
                  <div className="mt-3 rounded-lg border border-yellow-400/20 bg-yellow-400/10 p-3 text-xs text-yellow-100">
                    {estimate.warnings.join(" ")}
                  </div>
                )}
              </>
            ) : (
              <EmptyState text="Run an estimate before simulation." />
            )}
          </Panel>

          <Panel title="Execution Progress" eyebrow="Job status" icon={Search}>
            <div className="space-y-3">
              {executionSteps.map((step) => {
                const complete = step.completeBy.some((status) => jobStageStatuses.has(status));
                const active =
                  busy &&
                  !result &&
                  step.activeBy.some((status) => jobStageStatuses.has(status));
                return (
                  <div key={step.label} className="flex items-center gap-2 text-sm">
                    {active ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald" />
                    ) : (
                      <span
                        className={`h-2 w-2 rounded-full ${complete ? "bg-emerald" : "bg-white/15"}`}
                      />
                    )}
                    <span className={active ? "text-foreground" : "text-muted-foreground"}>
                      {step.label}
                    </span>
                </div>
                );
              })}
              <div className="rounded-lg bg-black/30 p-3 text-xs text-muted-foreground">
                {status || "Idle"}
              </div>
              {workflowHasProgress && (
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {displayedStepCount} of {executionSteps.length} steps started
                    </span>
                    <span>
                      {result || jobStatus?.status === "completed"
                        ? "Complete"
                        : jobStatus?.estimatedRemainingSeconds != null &&
                            jobStatus.estimatedRemainingSeconds > 0
                          ? `${formatDuration(jobStatus.estimatedRemainingSeconds)} left`
                          : "Estimating time left"}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/40">
                    <div
                      className="h-full rounded-full bg-emerald transition-all duration-500"
                      style={{ width: `${jobProgressPercent}%` }}
                    />
                  </div>
                  {jobStatus?.elapsedSeconds != null && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Elapsed {formatDuration(jobStatus.elapsedSeconds)}
                    </div>
                  )}
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                  {error}
                </div>
              )}
            </div>
          </Panel>
        </div>

        <Dialog open={limitDialog !== null} onOpenChange={(open) => !open && setLimitDialog(null)}>
          <DialogContent className="border-yellow-400/20 bg-background">
            <DialogHeader>
              <DialogTitle>{limitDialog?.title}</DialogTitle>
              <DialogDescription>{limitDialog?.message}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setLimitDialog(null)} className="bg-emerald text-primary-foreground">
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export function QuantumSearchResultsPage({ jobId }: { jobId: string }) {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatusSnapshot | null>(null);
  const [status, setStatus] = useState(jobId ? "Loading search job" : "Missing job ID");
  const [error, setError] = useState("");
  const [validatingCandidates, setValidatingCandidates] = useState(false);
  const [blastLoading, setBlastLoading] = useState(false);
  const [blastMaxRecords, setBlastMaxRecords] = useState(25);

  const probabilityData = useMemo(() => {
    const first = result?.hits?.[0]?.quantumDetails;
    const probs = first?.indexProbabilities || first?.counts;
    if (!probs) return [];
    return Object.entries(probs).map(([index, probability]) => ({
      index,
      probability: Number(probability),
    }));
  }, [result]);

  const organismGroups = useMemo(() => {
    if (!result) return [];
    const groups = new Map<
      string,
      {
        organism: string;
        taxId: string;
        records: Set<string>;
        hitCount: number;
        exactMatches: number;
        sourceDatabases: Set<string>;
      }
    >();
    result.hits.forEach((hit) => {
      const organism = hit.organism || "Unknown organism";
      const taxId = hit.taxId || "";
      const key = taxId || organism;
      const group =
        groups.get(key) ||
        {
          organism,
          taxId,
          records: new Set<string>(),
          hitCount: 0,
          exactMatches: 0,
          sourceDatabases: new Set<string>(),
        };
      group.records.add(hit.accession);
      group.hitCount += 1;
      if (hit.classicalValidation?.matches) group.exactMatches += 1;
      if (hit.sourceDatabase) group.sourceDatabases.add(hit.sourceDatabase);
      groups.set(key, group);
    });
    return Array.from(groups.values()).sort((a, b) => b.exactMatches - a.exactMatches || b.hitCount - a.hitCount);
  }, [result]);

  useEffect(() => {
    if (!jobId) return;
    let ignore = false;

    async function fetchResults() {
      setError("");
      for (let i = 0; i < 240; i += 1) {
        let jobResponse: Response;
        try {
          jobResponse = await fetch(`${API_BASE}/api/quantum-search/jobs/${jobId}`);
        } catch {
          throw new Error(`Cannot poll quantum search job ${jobId}; the API at ${API_BASE} is unreachable.`);
        }
        const jobBody = await jobResponse.json().catch(() => ({ detail: jobResponse.statusText }));
        if (!jobResponse.ok) {
          throw new Error(formatApiError(jobBody, `Could not poll quantum search job ${jobId}`));
        }
        if (ignore) return;
        const job = jobBody as JobStatusSnapshot;
        setJobStatus(job);
        setStatus(job.progress?.at(-1)?.message || job.status);
        if (job.status === "completed") {
          const resultResponse = await fetch(`${API_BASE}/api/quantum-search/jobs/${jobId}/results`);
          const resultBody = await resultResponse.json().catch(() => ({ detail: resultResponse.statusText }));
          if (!resultResponse.ok) {
            throw new Error(formatApiError(resultBody, `Could not fetch quantum search results for ${jobId}`));
          }
          if (ignore) return;
          setResult(resultBody as SearchResult);
          setJobStatus({ ...job, progressPercent: 100, estimatedRemainingSeconds: 0 });
          setStatus("Results ready");
          return;
        }
        if (job.status === "failed" || job.status === "cancelled") {
          throw new Error(job.error || `Job ${job.status}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      throw new Error("Search timed out while polling job status");
    }

    fetchResults().catch((err) => {
      if (!ignore) setError(err instanceof Error ? err.message : "Search failed");
    });

    return () => {
      ignore = true;
    };
  }, [jobId]);

  async function handleValidateCandidates() {
    if (!result?.jobId) return;
    setValidatingCandidates(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/quantum-search/jobs/${result.jobId}/validate`, {
        method: "POST",
      });
      const body = await response.json().catch(() => ({ detail: response.statusText }));
      if (!response.ok) throw new Error(formatApiError(body, response.statusText));
      setResult(body as SearchResult);
      setStatus("Results ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Candidate validation failed");
    } finally {
      setValidatingCandidates(false);
    }
  }

  async function handleBlastCheck() {
    if (!result?.jobId) return;
    setBlastLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE}/api/quantum-search/jobs/${result.jobId}/blast-check?max_records=${blastMaxRecords}`,
        { method: "POST" },
      );
      const body = await response.json().catch(() => ({ detail: response.statusText }));
      if (!response.ok) throw new Error(formatApiError(body, response.statusText));
      setResult({ ...result, blastCheck: body as BlastCheck });
    } catch (err) {
      setError(err instanceof Error ? err.message : "BLAST truth check failed");
    } finally {
      setBlastLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      <BackgroundFX />
      <header className="sticky top-0 z-30 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Link
            to="/quantum-search"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Search
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-emerald to-cyan-glow glow-emerald">
              <Dna className="absolute inset-0 m-auto h-4 w-4 text-background" />
            </div>
            <span className="font-display text-lg font-semibold">QDNA Genomic Search Results</span>
          </div>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-6 px-6 py-8">
        <Panel title="Results" eyebrow="Actual returned data" icon={FileJson}>
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </div>
          )}
          {!jobId ? (
            <EmptyState text="No search job was provided. Run a quantum search first." />
          ) : result ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric label="Algorithm" value={result.algorithm} />
                <Metric label="Provider" value={result.retrieval.provider} />
                <Metric label="Hits" value={result.hits.length} />
                <Metric label="Alphabet" value={result.quantumAlphabet} />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                <div className="text-xs text-muted-foreground">
                  Job {jobId} {jobStatus?.elapsedSeconds != null ? `- elapsed ${formatDuration(jobStatus.elapsedSeconds)}` : ""}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    BLAST records
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={blastMaxRecords}
                      onChange={(event) => setBlastMaxRecords(Math.min(100, Math.max(1, Number(event.target.value) || 25)))}
                      className="h-9 w-20 border-white/10 bg-black/30"
                    />
                  </label>
                  <Button
                    onClick={handleBlastCheck}
                    disabled={blastLoading || result.hits.length === 0}
                    variant="outline"
                    className="rounded-full border-white/10 bg-white/5"
                  >
                    {blastLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    BLAST Truth Check
                  </Button>
                  <Button
                    onClick={handleValidateCandidates}
                    disabled={validatingCandidates || result.hits.length === 0}
                    variant="outline"
                    className="rounded-full border-white/10 bg-white/5"
                  >
                    {validatingCandidates ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Validate Candidates
                  </Button>
                </div>
              </div>
              {organismGroups.length > 0 && (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs uppercase tracking-widest text-emerald">Organisms from processed records</div>
                    <h2 className="mt-1 font-display text-lg font-semibold">Relevant organisms containing returned windows</h2>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-2">
                    {organismGroups.map((group) => (
                      <div key={`${group.taxId}-${group.organism}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-display text-base font-semibold">{group.organism}</h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {group.records.size} records - {group.hitCount} windows - {group.exactMatches} exact matches
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {Array.from(group.sourceDatabases).join(", ") || "Source not specified"}
                            </p>
                          </div>
                          {group.taxId ? (
                            <a
                              href={`/ncbi/organism/${encodeURIComponent(group.taxId)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                            >
                              View Organism Details
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.blastCheck && (
                <div className="rounded-xl border border-emerald/20 bg-emerald/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-emerald">BLAST truth check</div>
                      <h2 className="mt-1 font-display text-lg font-semibold">GenBank genomic BLAST comparison</h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {result.blastCheck.records.length} BLAST records across {result.blastCheck.organisms.length} organisms.
                        {result.blastCheck.matchingQuantumAccessions.length} quantum accessions also appeared in BLAST results.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Entrez filter: {result.blastCheck.entrezQuery}
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald/30 bg-black/20 px-3 py-1 text-xs text-emerald">
                      nt / GenBank genomic
                    </span>
                  </div>
                  {result.blastCheck.organisms.length > 0 && (
                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      {result.blastCheck.organisms.slice(0, 8).map((organism) => (
                        <div key={organism.organismName} className="rounded-lg border border-white/10 bg-black/20 p-3">
                          <div className="font-display text-sm font-semibold">{organism.organismName}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {organism.recordCount} records - best identity {organism.bestPercentIdentity}%
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3">Rank</th>
                      <th className="px-3 py-3">Accession</th>
                      <th className="px-3 py-3">Strand</th>
                      <th className="px-3 py-3">Coordinates</th>
                      <th className="px-3 py-3">Quantum score</th>
                      <th className="px-3 py-3">Validation</th>
                      <th className="px-3 py-3">Window</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.hits.map((hit) => (
                      <tr key={`${hit.rank}-${hit.accession}-${hit.start}`} className="border-t border-white/5">
                        <td className="px-3 py-3 font-mono text-emerald">{hit.rank}</td>
                        <td className="px-3 py-3">{hit.accession}</td>
                        <td className="px-3 py-3">{hit.strand}</td>
                        <td className="px-3 py-3 font-mono">
                          {hit.start}-{hit.end}
                        </td>
                        <td className="px-3 py-3 font-mono">{Number(hit.quantumScore).toFixed(4)}</td>
                        <td className="px-3 py-3">
                          {hit.classicalValidation
                            ? hit.classicalValidation.matches
                              ? "exact match"
                              : "no exact match"
                            : "not validated"}
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-muted-foreground">
                          {hit.matchedWindow}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {probabilityData.length > 0 && (
                <div className="h-64 rounded-xl bg-black/30 p-4">
                  <ResponsiveContainer>
                    <BarChart data={probabilityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="index" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#0b1a15",
                          border: "1px solid rgba(16,185,129,0.3)",
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="probability" fill="#10B981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <DownloadButton
                  label="JSON"
                  icon={FileJson}
                  data={JSON.stringify(result, null, 2)}
                  filename="quantum-search-result.json"
                />
                <DownloadButton
                  label="CSV"
                  icon={FileText}
                  data={toCsv(result)}
                  filename="quantum-search-hits.csv"
                />
                <DownloadButton
                  label="FASTA"
                  icon={Dna}
                  data={toFasta(result)}
                  filename="quantum-search-windows.fasta"
                />
              </div>
            </div>
          ) : (
            <EmptyState text={status || "Completed searches will show ranked quantum hits, real probabilities, circuit metrics, and downloads."} />
          )}
        </Panel>

        <Panel title="Methodology" eyebrow="Scientific boundaries" icon={AlertTriangle}>
          <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            <p>
              NCBI performs genomic sequence discovery and retrieval; the selected quantum circuit
              processes bounded ACGT windows only.
            </p>
            <p>
              Classical validation is available after the quantum result is generated and runs only
              when the user requests candidate validation.
            </p>
            <p>The complete GenBank database is not loaded into a quantum circuit.</p>
            <p>
              Simulator execution is not equivalent to execution on fault-tolerant quantum hardware.
            </p>
          </div>
        </Panel>
      </main>
    </div>
  );
}

function Panel({
  title,
  eyebrow,
  icon: Icon,
  children,
}: {
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="show"
      className="glass min-w-0 overflow-hidden rounded-2xl p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-emerald">{eyebrow}</div>
          <h2 className="mt-1 font-display text-xl font-semibold">{title}</h2>
        </div>
        <Icon className="h-5 w-5 text-emerald" />
      </div>
      {children}
    </motion.section>
  );
}

function formatApiError(body: unknown, fallback: string) {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail?: unknown }).detail;
    if (Array.isArray(detail)) {
      return detail.map(formatValidationIssue).join("; ");
    }
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object") return formatValidationIssue(detail);
  }
  return fallback;
}

function formatValidationIssue(issue: unknown) {
  if (!issue || typeof issue !== "object") return String(issue);
  const item = issue as { loc?: unknown[]; msg?: unknown; type?: unknown };
  const field = Array.isArray(item.loc) ? item.loc.filter((part) => part !== "body").join(".") : "";
  const message = typeof item.msg === "string" ? item.msg : String(item.type || "Invalid request");
  return field ? `${field}: ${message}` : message;
}

function LabelledNumber({
  label,
  value,
  setValue,
  min,
  max,
  onLimitExceeded,
}: {
  label: string;
  value: number;
  setValue: (value: number) => void;
  min: number;
  max: number;
  onLimitExceeded?: (
    label: string,
    attemptedValue: number,
    min: number,
    max: number,
    appliedValue: number,
  ) => void;
}) {
  return (
    <label className="grid gap-1 text-xs text-muted-foreground">
      {label}
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isNaN(next)) return;
          const bounded = Math.min(max, Math.max(min, next));
          if (bounded !== next) {
            onLimitExceeded?.(label, next, min, max, bounded);
          }
          setValue(bounded);
        }}
        className="border-white/10 bg-black/30 text-foreground"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-sm text-emerald">{value}</div>
    </div>
  );
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function DownloadButton({
  label,
  icon: Icon,
  data,
  filename,
}: {
  label: string;
  icon: LucideIcon;
  data: string;
  filename: string;
}) {
  const href = `data:text/plain;charset=utf-8,${encodeURIComponent(data)}`;
  return (
    <a
      href={href}
      download={filename}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
    >
      <Icon className="h-4 w-4" /> {label}
    </a>
  );
}

function splitList(value: string) {
  return value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toCsv(result: SearchResult) {
  const rows = ["rank,accession,strand,start,end,algorithm,quantumScore,matchedWindow"];
  result.hits.forEach((hit) => {
    rows.push(
      [
        hit.rank,
        hit.accession,
        hit.strand,
        hit.start,
        hit.end,
        hit.algorithm,
        hit.quantumScore,
        hit.matchedWindow,
      ].join(","),
    );
  });
  return rows.join("\n");
}

function toFasta(result: SearchResult) {
  return result.hits
    .map(
      (hit) =>
        `>${hit.accession}|rank=${hit.rank}|${hit.strand}|${hit.start}-${hit.end}|algorithm=${hit.algorithm}\n${hit.matchedWindow}`,
    )
    .join("\n");
}

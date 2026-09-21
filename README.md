# Quantum Helix Lab

Quantum Helix Lab is a full-stack genomic DNA portal with a React/TanStack frontend,
a FastAPI backend, bounded NCBI genomic retrieval, and local Qiskit Aer implementations
of FRQI similarity, QGSA/Grover exact-pattern search, and hybrid fixed-point search.

The repository intentionally contains source code and tests, not local environments,
downloaded dependencies, credentials, build folders, or generated experiment outputs.

See [docs/AI_REPORT_GENERATOR.md](docs/AI_REPORT_GENERATOR.md) for the optional,
backend-only OpenAI report generator and PDF download workflow.

See
[docs/CLASSICAL_QUANTUM_SCALING.md](docs/CLASSICAL_QUANTUM_SCALING.md) for the
Hybrid/Grover theoretical scaling form, formulas, timing assumptions, and
limitations.

The [QML Clinical Lab user guide](docs/qml-pages-user-guide.md) explains the
research disease-risk pages and limitations. The [integration specification](docs/qml-integration-spec.md)
and [complete local artifact inventory](docs/qml-model-inventory.json) record
model selection and provenance.

## Repository layout

```text
.
|-- src/                    React/TanStack frontend
|-- public/                 Frontend assets
|-- quantum_search_api/     FastAPI application and portal search orchestration
|-- qgsa_grover/            QGSA/Grover exact-pattern circuit package
|-- frqi_dna/               FRQI DNA comparison package
|-- quantum_dna/            Standalone and hybrid quantum experiments
|-- qml_inference/          Separate Python 3.12 QML inference service and small serving bundle
|-- docs/                   Implementation documentation
|-- specs/                  Change specifications and verification records
`-- scripts/                Windows setup and startup helpers
```

## Prerequisites

- Git
- Python 3.13
- Python 3.12 for the separate QML inference service
- Bun 1.3
- Internet access for the initial dependency installation and NCBI-backed searches

The default portal workflow uses local Qiskit Aer simulation. An explicit,
confirmation-gated real-hardware path can submit one representative bounded
window to a resource-matched qBraid or IBM QPU when backend-only credentials
are configured.

## Windows quick start

Clone the private repository and enter it:

```powershell
git clone https://github.com/battler67/quantum-helix-lab.git
cd quantum-helix-lab
```

Install Python and frontend dependencies:

```powershell
.\scripts\setup.ps1
```

Open `quantum_search_api\.env` and replace the placeholder email. Add your own NCBI
API key if available:

```env
NCBI_API_KEY=your_ncbi_api_key
NCBI_TOOL_NAME=quantum_helix_lab
NCBI_DEVELOPER_EMAIL=your_email@example.com
```

Start the backend in terminal 1:

```powershell
.\scripts\start-backend.ps1
```

Start the frontend in terminal 2:

```powershell
.\scripts\start-frontend.ps1
```

Open:

```text
http://127.0.0.1:8080
```

The backend health endpoint is:

```text
http://127.0.0.1:8000/api/health
```

## QML Clinical Lab setup

The QML pages are under `/qml`; the original genomic backend remains on port
8000. Start the separate, CPU-only Python 3.12 service in another terminal:

```powershell
py -3.12 -m venv .venv-qml
.\.venv-qml\Scripts\python.exe -m pip install -r qml_inference\requirements.txt
.\.venv-qml\Scripts\python.exe -m qml_inference.server
```

Its default address is `http://127.0.0.1:8010`, with readiness at
`/api/qml/v1/health`. The frontend defaults to this local address. For another
address, set `VITE_QML_API_BASE_URL` (public service origin, no secret) when
building the frontend. `QML_HOST` and `QML_PORT` (or platform `PORT`) control
the service listener; `QML_CORS_ORIGINS` is a comma-separated list of exact
frontend origins. `QML_BUNDLE_DIR` can point to a versioned, trusted bundle;
otherwise `qml_inference/artifacts/v1` is used. The service checks hashes and
library versions at startup and never trains or downloads a model.

The committed serving bundle contains only nine fitted artifacts, a
manifest and deidentified benchmark evidence. `docs/qml-model-inventory.json`
catalogues all 213 serialized files found in the sibling `qml-research/` tree,
including research-only and duplicate files, with hashes. To re-audit or
promote from the local sibling repository, inspect `scripts/qml_inventory.py`
and `scripts/promote_qml_models.py`; they check source hashes. Never run
promotion on untrusted serialized files. Promotion converts the custom UCI
feature pipeline into a portable dictionary of fitted scikit-learn objects, so
the service does not import the research package. Do not add raw datasets or
participant-level predictions to the portal. Future models need a fitted
preprocessing pipeline, estimator/calibrator/threshold, schema, recorded
benchmark evidence, versioned manifest and an exact replay test before they
appear in `/api/qml/v1/models`.

QML checks:

```powershell
.\.venv-qml\Scripts\python.exe -m unittest qml_inference.tests.test_service -v
bun run build
bunx eslint src/components/QmlPages.tsx src/components/QmlEvidenceChart.tsx src/lib/qml-api.ts src/lib/qml-context.tsx src/routes/qml*.tsx
```

Deployment: use a Python 3.12 service for `qml_inference.server`, reserve
memory for PennyLane and the fitted bundle, restrict `QML_CORS_ORIGINS` to the
exact frontend origin, expose HTTPS to the browser, and set
`VITE_QML_API_BASE_URL` on the frontend deployment. Do not send health rows to
the genomic backend, AI report generator or external quantum providers. There
is no authentication or persistent history; the pages are research-use only.

## Manual setup

From the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
bun install --frozen-lockfile
Copy-Item .env.example .env.local
Copy-Item quantum_search_api\.env.example quantum_search_api\.env
```

The root `requirements.txt` installs the backend dependencies and the local
`qgsa_grover` package in editable mode.

## Verification

Backend:

```powershell
.\.venv\Scripts\python.exe -m pytest quantum_search_api\tests -q --disable-warnings
```

Frontend:

```powershell
bunx eslint src/components/QuantumSearch.tsx
bun run build
```

Optional standalone suites:

```powershell
.\.venv\Scripts\python.exe -m pytest frqi_dna\tests -q --disable-warnings
.\.venv\Scripts\python.exe -m pytest qgsa_grover\tests -q --disable-warnings
.\.venv\Scripts\python.exe -m pytest quantum_dna\tests -q --disable-warnings
```

## Functionality

- Landing page and quantum bioinformatics dashboard
- NCBI Entrez genomic record search and record details
- Taxonomy and organism views
- Pasted, uploaded FASTA, accession, assembly, organism, and taxonomy search inputs
- Pasted and FASTA query/reference inputs up to 100,000 bases with explicitly
  bounded quantum windows
- Metadata-only resource estimation
- Bounded reference retrieval with partial-result handling
- Forward and reverse-complement reference windows
- FRQI similarity, Grover exact matching, and hybrid fixed-point processing
- On-demand configurable noise comparisons
- Quota-safe qBraid/IBM real-hardware execution with best-fit device mapping
- Optional classical candidate validation and BLAST checks

NCBI content and response times depend on the external NCBI services. Quantum circuit
size is deliberately bounded for local simulation.

## Configuration and security

- Never commit `.env`, `.env.local`, tokens, API keys, or personal credentials.
- `VITE_*` variables are visible in the browser and must never contain secrets.
- Each collaborator should use their own NCBI contact email and API key.
- Generated experiment artifacts are written under package `outputs/` directories,
  which are ignored by Git.
- Real-hardware credentials belong only in `quantum_search_api/.env`; see
  [`docs/REAL_HARDWARE_EXECUTION.md`](docs/REAL_HARDWARE_EXECUTION.md).
- For a Vercel frontend, set `VITE_QUANTUM_API_BASE_URL` in Vercel to the
  Render service URL. Set `QDNA_CORS_ORIGINS` in Render to the exact Vercel
  origin, such as `https://your-project.vercel.app` (without a trailing slash).

## Development notes

- Run backend commands from the repository root so sibling packages resolve correctly.
- The frontend defaults to `http://127.0.0.1:8000` for the API.
- Search jobs are currently stored in backend memory; restarting FastAPI clears them.
- Real hardware requires separate provider credentials and explicit confirmation.
  Automated tests never submit provider jobs.

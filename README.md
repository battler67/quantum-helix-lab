# Quantum Helix Lab

Quantum Helix Lab is a full-stack genomic DNA portal with a React/TanStack frontend,
a FastAPI backend, bounded NCBI genomic retrieval, and local Qiskit Aer implementations
of FRQI similarity, QGSA/Grover exact-pattern search, and hybrid fixed-point search.

The repository intentionally contains source code and tests, not local environments,
downloaded dependencies, credentials, build folders, or generated experiment outputs.

## Repository layout

```text
.
|-- src/                    React/TanStack frontend
|-- public/                 Frontend assets
|-- quantum_search_api/     FastAPI application and portal search orchestration
|-- qgsa_grover/            QGSA/Grover exact-pattern circuit package
|-- frqi_dna/               FRQI DNA comparison package
|-- quantum_dna/            Standalone and hybrid quantum experiments
|-- docs/                   Implementation documentation
|-- specs/                  Change specifications and verification records
`-- scripts/                Windows setup and startup helpers
```

## Prerequisites

- Git
- Python 3.13
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

## Development notes

- Run backend commands from the repository root so sibling packages resolve correctly.
- The frontend defaults to `http://127.0.0.1:8000` for the API.
- Search jobs are currently stored in backend memory; restarting FastAPI clears them.
- Real hardware requires separate provider credentials and explicit confirmation.
  Automated tests never submit provider jobs.

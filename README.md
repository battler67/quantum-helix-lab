# Quantum Helix Lab

A React/TanStack Start frontend for quantum-assisted genomic search, NCBI nucleotide record exploration, taxonomy-tree browsing, and DNA sequence analysis workflows.

Live demo:

```text
https://quantum-helix-lab.lovable.app
```

## Features

- Cinematic landing page with a live rotating 3D DNA helix.
- Quantum bioinformatics dashboard.
- NCBI Entrez nucleotide search with gene, organism, source, and sequence-length filters.
- NCBI record details pages with metadata, FASTA display, selective downloads, and sequence-analysis handoff.
- Genome Data Viewer-style taxonomy panel with selected organism highlighting.
- Wikimedia/Wikipedia organism image lookup with a no-image fallback.
- Quantum search workflow pages for FRQI/Grover-backed genomic DNA analysis.
- Responsive dark UI built with Tailwind CSS and Radix/shadcn-style components.

## Stack

- React 19
- TypeScript
- TanStack Start / TanStack Router
- Vite
- Tailwind CSS 4
- Radix UI components
- React Query
- Three.js / React Three Fiber
- Framer Motion
- Recharts

## Local Setup

Install dependencies:

```bash
bun install
```

Run the frontend on the expected local port:

```bash
bun run dev -- --host 127.0.0.1 --port 8080
```

The frontend will be available at:

```text
http://localhost:8080
```

Build for production:

```bash
bun run build
```

Preview a production build:

```bash
bun run preview
```

## Backend API

The NCBI and quantum-search pages call a FastAPI backend. By default the frontend expects:

```text
http://localhost:8000
```

Set this environment variable if the backend runs elsewhere:

```bash
VITE_QUANTUM_API_BASE_URL=http://localhost:8000
```

NCBI API configuration belongs on the backend, not in the frontend bundle:

```bash
NCBI_API_KEY=
NCBI_TOOL_NAME=quantum_dna_search
NCBI_DEVELOPER_EMAIL=
```

## Routes

- `/` - Landing page
- `/dashboard` - Quantum bioinformatics dashboard
- `/quantum-search` - NCBI genomic DNA quantum search setup
- `/quantum-search-results` - Search job result viewer
- `/ncbi/search` - NCBI Entrez gene/nucleotide search with right-side taxonomy tree panel
- `/ncbi/record/:accession` - NCBI record details, organism image, taxonomy tree, downloads, and analysis handoff
- `/ncbi/organism/:taxId` - NCBI organism taxonomy details

## Git Ignore Notes

The repository intentionally ignores local dependencies, generated builds, and runtime logs:

```text
node_modules/
.output/
.wrangler/
.tanstack/
*.log
```

## Notes

- The frontend does not expose NCBI API keys.
- Organism images are looked up from free Wikimedia/Wikipedia metadata when available.
- If no free image is available, the UI shows a no-image state.
- The Genome Data Viewer panel is dynamic and data-driven; it is not a static image copy.

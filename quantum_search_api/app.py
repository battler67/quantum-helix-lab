from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from quantum_search_api.services.ncbi.datasets_provider import NcbiDatasetsProvider
from quantum_search_api.services.ncbi.entrez_workflow import NcbiEntrezWorkflow
from quantum_search_api.services.ncbi.entrez_provider import NcbiEntrezProvider
from quantum_search_api.services.ncbi.exceptions import NcbiError, NcbiUnavailableError, NcbiValidationError
from quantum_search_api.services.ncbi.models import SearchRequest
from quantum_search_api.services.hardware import HardwareJobService, HardwareSubmissionRequest
from quantum_search_api.services.hardware.providers import HardwareProviderError
from quantum_search_api.services.noise.config import NoiseSettings
from quantum_search_api.services.search.job_service import InMemoryJobService
from quantum_search_api.services.search.search_orchestrator import SearchOrchestrator


load_dotenv(Path(__file__).with_name(".env"))

app = FastAPI(title="QDNA Genomic Quantum Search API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

orchestrator = SearchOrchestrator()
jobs = InMemoryJobService(orchestrator)
hardware_jobs = HardwareJobService()
entrez_workflow = NcbiEntrezWorkflow()


def ncbi_http_error(exc: NcbiError) -> HTTPException:
    if isinstance(exc, NcbiUnavailableError):
        return HTTPException(status_code=503, detail=str(exc))
    if isinstance(exc, NcbiValidationError):
        return HTTPException(status_code=400, detail=str(exc))
    return HTTPException(status_code=400, detail=str(exc))


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "quantum-search-api"}


@app.post("/api/quantum-search/estimate")
def estimate(request: SearchRequest) -> dict:
    try:
        return orchestrator.estimate(request).model_dump(by_alias=True)
    except (ValueError, NcbiError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/quantum-search/jobs")
def create_job(request: SearchRequest) -> dict:
    try:
        job = jobs.create_job(request)
        return job.to_dict()
    except (ValueError, NcbiError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/quantum-search/jobs/{job_id}")
def get_job(job_id: str) -> dict:
    job = jobs.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.to_dict()


@app.get("/api/quantum-search/jobs/{job_id}/results")
def get_results(job_id: str) -> dict:
    job = jobs.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "completed" or job.result is None:
        raise HTTPException(status_code=409, detail=f"Job is {job.status}")
    return job.result


@app.post("/api/quantum-search/jobs/{job_id}/noise")
def add_noise_to_job(job_id: str, settings: NoiseSettings | None = None) -> dict:
    try:
        result = jobs.add_noise(job_id, settings)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if result is None:
        raise HTTPException(status_code=404, detail="Completed job results were not found")
    return result


@app.post("/api/quantum-search/jobs/{job_id}/validate")
def validate_job_candidates(job_id: str) -> dict:
    result = jobs.validate_candidates(job_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Completed job results were not found")
    return result


@app.post("/api/quantum-search/jobs/{job_id}/blast-check")
def blast_check_job(job_id: str, max_records: int = 25, entrez_query: str | None = None) -> dict:
    try:
        result = jobs.blast_check(job_id, max_records=max_records, entrez_query=entrez_query)
    except NcbiError as exc:
        raise ncbi_http_error(exc) from exc
    if result is None:
        raise HTTPException(status_code=404, detail="Completed job results were not found")
    return result


@app.delete("/api/quantum-search/jobs/{job_id}")
def cancel_job(job_id: str) -> dict:
    if not jobs.cancel_job(job_id):
        raise HTTPException(status_code=404, detail="Job not found")
    return {"jobId": job_id, "status": "cancelled"}


@app.post("/api/quantum-search/hardware/preview")
def preview_hardware(request: SearchRequest) -> dict:
    """Discover a best-fit device without submitting a provider job."""

    try:
        return hardware_jobs.preview(request)
    except (ValueError, NcbiError, HardwareProviderError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/quantum-search/hardware/jobs")
def create_hardware_job(request: HardwareSubmissionRequest) -> dict:
    """Queue one explicitly confirmed representative-window QPU submission."""

    try:
        job = hardware_jobs.create_job(request)
        return job.to_dict()
    except (ValueError, NcbiError, HardwareProviderError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/quantum-search/hardware/jobs/{job_id}")
def get_hardware_job(job_id: str) -> dict:
    job = hardware_jobs.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Hardware job not found")
    return job.to_dict()


@app.get("/api/quantum-search/hardware/jobs/{job_id}/results")
def get_hardware_results(job_id: str) -> dict:
    job = hardware_jobs.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Hardware job not found")
    if job.status != "completed" or job.result is None:
        raise HTTPException(status_code=409, detail=f"Hardware job is {job.status}")
    return job.result


@app.get("/api/ncbi/search")
def ncbi_search(scope: str, organism: str | None = None, tax_id: str | None = None, max_records: int = 10) -> dict:
    request = SearchRequest(
        querySource="pasted",
        querySequence="ACGT",
        algorithm="grover",
        databaseScope=scope,
        organism=organism,
        taxId=tax_id,
        maxRecords=max_records,
    )
    try:
        records = orchestrator.datasets_provider.search_records(request)
        return {"records": [item.model_dump(by_alias=True) for item in records]}
    except (ValueError, NcbiError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/ncbi/entrez/search")
def ncbi_entrez_gene_search(
    gene: str,
    organism: str | None = None,
    source: str = "all",
    min_length: int | None = None,
    max_length: int | None = None,
    page: int = 1,
    page_size: int = 10,
) -> dict:
    try:
        return entrez_workflow.search_gene(
            gene=gene,
            organism=organism,
            source=source,
            min_length=min_length,
            max_length=max_length,
            page=page,
            page_size=page_size,
        )
    except NcbiError as exc:
        raise ncbi_http_error(exc) from exc


@app.get("/api/ncbi/entrez/records/{accession}")
def ncbi_entrez_record(accession: str) -> dict:
    try:
        return entrez_workflow.record_details(accession)
    except NcbiError as exc:
        raise ncbi_http_error(exc) from exc


@app.get("/api/ncbi/entrez/records/{accession}/analysis")
def ncbi_entrez_analysis_sequence(accession: str) -> dict:
    try:
        return entrez_workflow.analysis_sequence(accession)
    except NcbiError as exc:
        raise ncbi_http_error(exc) from exc


@app.get("/api/ncbi/organisms/{tax_id}")
def ncbi_organism_details(tax_id: str) -> dict:
    try:
        return entrez_workflow.organism_details(tax_id)
    except NcbiError as exc:
        raise ncbi_http_error(exc) from exc


@app.get("/api/ncbi/organisms/{tax_id}/genome-viewer")
def ncbi_organism_genome_viewer(tax_id: str) -> dict:
    try:
        return entrez_workflow.organism_genome_viewer(tax_id)
    except NcbiError as exc:
        raise ncbi_http_error(exc) from exc


@app.get("/api/ncbi/records/{accession}")
def ncbi_record(accession: str) -> dict:
    provider = NcbiEntrezProvider()
    request = SearchRequest(
        querySource="pasted",
        querySequence="ACGT",
        algorithm="grover",
        databaseScope="exact_genomic_nucleotide",
        nucleotideAccessions=[accession],
    )
    try:
        records = provider.fetch_sequences([accession], request)
        return {"records": [item.model_dump(by_alias=True, exclude={"sequence"}) for item in records]}
    except NcbiError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/ncbi/records/batch")
def ncbi_records_batch(accessions: list[str]) -> dict:
    provider = NcbiEntrezProvider()
    request = SearchRequest(
        querySource="pasted",
        querySequence="ACGT",
        algorithm="grover",
        databaseScope="exact_genomic_nucleotide",
        nucleotideAccessions=accessions,
    )
    try:
        records = provider.fetch_sequences(accessions, request)
        return {"records": [item.model_dump(by_alias=True, exclude={"sequence"}) for item in records]}
    except NcbiError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/ncbi/assemblies/search")
def assemblies_search(scope: str, organism: str | None = None, tax_id: str | None = None, max_records: int = 10) -> dict:
    return ncbi_search(scope=scope, organism=organism, tax_id=tax_id, max_records=max_records)


@app.get("/api/ncbi/taxa/search")
def taxa_search(query: str, limit: int = 10) -> dict:
    try:
        return entrez_workflow.search_taxa(query, limit=limit)
    except NcbiError as exc:
        raise ncbi_http_error(exc) from exc

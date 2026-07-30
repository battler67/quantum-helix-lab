import time

from fastapi.testclient import TestClient

from quantum_search_api.app import app, jobs


def test_health_endpoint():
    client = TestClient(app)
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_estimate_endpoint_with_local_fixture():
    client = TestClient(app)
    response = client.post(
        "/api/quantum-search/estimate",
        json={
            "querySource": "pasted",
            "querySequence": "ACGT",
            "algorithm": "grover",
            "databaseScope": "uploaded_fasta",
            "uploadedFasta": ">demo\nACGTNNACGT\n",
            "maxWindows": 4,
            "shots": 16,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["quantumAlphabet"] == "ACGT"
    assert body["estimateMode"] == "metadata_only"
    assert body["estimatedEndToEndSecondsMax"] >= body["estimatedSimulationSecondsMax"]


def test_estimate_endpoint_accepts_one_hundred_thousand_base_fasta_strings():
    sequence = "ACGT" * 25_000
    client = TestClient(app)

    response = client.post(
        "/api/quantum-search/estimate",
        json={
            "querySource": "pasted",
            "querySequence": f">query length=100000 seed=42\n{sequence}",
            "referenceSequence": (
                f">reference_sequence length=100000 seed=42\n{sequence}"
            ),
            "algorithm": "frqi",
            "databaseScope": "pasted_sequence",
            "maxQueryLength": 32,
            "maxBasesPerRecord": 100_000,
            "maxTotalBases": 100_000,
            "maxWindows": 1,
            "shots": 138,
            "strand": "forward",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["inputQueryLength"] == 100_000
    assert body["quantumWindowLength"] == 32
    assert body["inputTruncatedForQuantum"] is True
    assert body["hardwareEligible"] is True


def test_candidate_validation_is_on_demand():
    client = TestClient(app)
    create_response = client.post(
        "/api/quantum-search/jobs",
        json={
            "querySource": "pasted",
            "querySequence": "A",
            "algorithm": "grover",
            "databaseScope": "uploaded_fasta",
            "uploadedFasta": ">demo\nA\n",
            "maxWindows": 1,
            "shots": 16,
            "strand": "forward",
            "enableClassicalValidation": False,
        },
    )
    assert create_response.status_code == 200
    job_id = create_response.json()["jobId"]

    result_response = None
    for _ in range(50):
        result_response = client.get(f"/api/quantum-search/jobs/{job_id}/results")
        if result_response.status_code == 200:
            break
        time.sleep(0.05)
    assert result_response is not None
    assert result_response.status_code == 200
    assert result_response.json()["hits"][0]["classicalValidation"] is None

    validate_response = client.post(f"/api/quantum-search/jobs/{job_id}/validate")
    assert validate_response.status_code == 200
    assert validate_response.json()["hits"][0]["classicalValidation"]["doesNotReplaceQuantumResult"] is True


def test_noise_endpoint_returns_cached_comparison_without_replacing_result():
    client = TestClient(app)
    create_response = client.post(
        "/api/quantum-search/jobs",
        json={
            "querySource": "pasted",
            "querySequence": "A",
            "algorithm": "frqi",
            "databaseScope": "uploaded_fasta",
            "uploadedFasta": ">demo\nA\n",
            "maxWindows": 1,
            "shots": 32,
            "strand": "forward",
        },
    )
    job_id = create_response.json()["jobId"]
    original = None
    for _ in range(100):
        response = client.get(f"/api/quantum-search/jobs/{job_id}/results")
        if response.status_code == 200:
            original = response.json()
            break
        time.sleep(0.05)
    assert original is not None

    noisy = client.post(f"/api/quantum-search/jobs/{job_id}/noise")
    assert noisy.status_code == 200
    assert noisy.json()["algorithm"] == "frqi"
    assert all(key in noisy.json() for key in ("ideal", "noisy", "mitigated"))

    cached = client.post(f"/api/quantum-search/jobs/{job_id}/noise")
    assert cached.json() == noisy.json()

    custom = client.post(
        f"/api/quantum-search/jobs/{job_id}/noise",
        json={"singleQubitError": 0.01, "twoQubitError": 0.02},
    )
    assert custom.status_code == 200
    assert custom.json()["noiseParameters"]["singleQubitError"] == 0.01
    assert custom.json()["noiseParameters"]["twoQubitError"] == 0.02
    assert custom.json()["noiseParameters"] != noisy.json()["noiseParameters"]
    assert len(jobs.get_job(job_id).noise_results) == 2

    invalid = client.post(
        f"/api/quantum-search/jobs/{job_id}/noise",
        json={"singleQubitError": 0.6},
    )
    assert invalid.status_code == 422
    assert client.get(f"/api/quantum-search/jobs/{job_id}/results").json() == original

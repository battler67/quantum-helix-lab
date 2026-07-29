$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$pythonPath = Join-Path $repoRoot ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $pythonPath)) {
    throw "Run scripts\setup.ps1 first."
}

Push-Location $repoRoot
try {
    & $pythonPath -m uvicorn quantum_search_api.app:app --reload --host 127.0.0.1 --port 8000
}
finally {
    Pop-Location
}

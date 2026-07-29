$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $repoRoot
try {
    bun run dev -- --host 127.0.0.1 --port 8080
}
finally {
    Pop-Location
}

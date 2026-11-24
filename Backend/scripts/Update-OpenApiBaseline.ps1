<#
.SYNOPSIS
    Updates the runtime OpenAPI route baseline files in Backend/docs.
.DESCRIPTION
    Launches the standalone baseline generator console tool in isolated test mode
    to capture the current OpenAPI route schema from ZhongWenHub.Api and writes:
      - Backend/docs/RUNTIME_OPENAPI_ROUTES_BASELINE.json
      - Backend/docs/RUNTIME_OPENAPI_ROUTES_BASELINE.txt
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path "$ScriptDir/../.."
$GeneratorProject = "$RepoRoot/Backend/tools/OpenApiBaselineGenerator/OpenApiBaselineGenerator.csproj"

Write-Host "==> Running standalone OpenAPI Baseline Generator tool..." -ForegroundColor Cyan
dotnet run --project $GeneratorProject

if ($LASTEXITCODE -eq 0) {
    Write-Host "==> OpenAPI baseline successfully updated in Backend/docs/" -ForegroundColor Green
} else {
    Write-Error "Failed to generate OpenAPI baseline."
}

<#
.SYNOPSIS
    Updates the runtime OpenAPI route baseline files in Backend/docs.
.DESCRIPTION
    Launches the baseline generator in isolated test mode to capture the current
    OpenAPI route schema from ZhongWenHub.Api and writes:
      - Backend/docs/RUNTIME_OPENAPI_ROUTES_BASELINE.json
      - Backend/docs/RUNTIME_OPENAPI_ROUTES_BASELINE.txt
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path "$ScriptDir/../.."
$IntegrationProject = "$RepoRoot/Backend/tests/ZhongWenHub.IntegrationTests/ZhongWenHub.IntegrationTests.csproj"

Write-Host "==> Building and generating OpenAPI Baseline..." -ForegroundColor Cyan
dotnet test $IntegrationProject --filter "Category=BaselineGenerator" -v minimal

if ($LASTEXITCODE -eq 0) {
    Write-Host "==> OpenAPI baseline successfully updated in Backend/docs/" -ForegroundColor Green
} else {
    Write-Error "Failed to generate OpenAPI baseline."
}

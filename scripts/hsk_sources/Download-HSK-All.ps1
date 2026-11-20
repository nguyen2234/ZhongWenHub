<#
.SYNOPSIS
    ZhongWenHub — HSK 1-4 Standard Course 2.0 Resource Downloader
.DESCRIPTION
    Downloads verified HSK 1, 2, 3, 4A, 4B Textbooks, Workbooks, Audio ZIPs, and Answers
    directly from Baúl Chino CDN to D:\ZhongWenHub\resources\hsk-standard-course-2.0\.
    Features: Pre-flight manifest, single confirmation, max 3 concurrency, resume,
    retry, magic-byte signature check, ZIP integrity test, SHA-256 computation, and reports.
#>

[CmdletBinding()]
param(
    [string]$DestRoot = "D:\ZhongWenHub\resources\hsk-standard-course-2.0",
    [int]$Concurrency = 3,
    [switch]$Force,
    [switch]$VerifyOnly
)

$ErrorActionPreference = "Continue"

# Ensure System.IO.Compression is loaded
Add-Type -AssemblyName System.IO.Compression.FileSystem

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ManifestFile = Join-Path $ScriptDir "hsk_source_manifest.json"

if (-not (Test-Path $ManifestFile)) {
    Write-Error "Khong tim thay tap tin manifest: $ManifestFile"
    exit 1
}

$rawManifest = Get-Content $ManifestFile -Raw -Encoding UTF8 | ConvertFrom-Json

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "        ZHONGWENHUB — HSK 1-4 STANDARD COURSE 2.0 SOURCE DOWNLOADER            " -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "Thu muc dich: $DestRoot" -ForegroundColor Gray
Write-Host "So luong tai lieu: $($rawManifest.Count) files" -ForegroundColor Gray
$totalMB = ($rawManifest | Measure-Object -Property size_mb -Sum).Sum
Write-Host ("Tong dung luong du kien: {0:N2} MB (~{1:N2} GB)" -f $totalMB, ($totalMB / 1024)) -ForegroundColor Gray
Write-Host "-------------------------------------------------------------------------------" -ForegroundColor Gray

# Display pre-download table
Write-Host ("{0,-6} | {1,-10} | {2,-30} | {3,10} | {4,-12}" -f "CAP DO", "DANH MUC", "FILE DICH", "DUNG LUONG", "TRANG THAI") -ForegroundColor White
Write-Host ("-" * 79) -ForegroundColor Gray

foreach ($item in $rawManifest) {
    Write-Host ("{0,-6} | {1,-10} | {2,-30} | {3,7:N2} MB | {4,-12}" -f $item.level, $item.category, $item.target_rel_path, $item.size_mb, $item.status) -ForegroundColor Cyan
}
Write-Host "-------------------------------------------------------------------------------" -ForegroundColor Gray

if ($VerifyOnly) {
    Write-Host "Che do VerifyOnly: Da hien thi thong tin kiem tra lien ket. Dung tai day." -ForegroundColor Yellow
    exit 0
}

# Single user confirmation
if (-not $Force) {
    Write-Host ""
    $prompt = Read-Host "Ban co muon bat dau tai toan bo $($rawManifest.Count) tai lieu HSK 1-4 ve '$DestRoot'? (Y/N)"
    if ($prompt -notmatch "^[Yy]") {
        Write-Host "Nguoi dung da huy thao tac. Khong co file nao duoc tai ve." -ForegroundColor Yellow
        exit 0
    }
}

# Create directory structure
$levels = @("HSK1", "HSK2", "HSK3", "HSK4")
$subfolders = @("Textbook", "Workbook", "Audio")
foreach ($lvl in $levels) {
    foreach ($sub in $subfolders) {
        $dirPath = Join-Path $DestRoot (Join-Path $lvl $sub)
        if (-not (Test-Path $dirPath)) {
            New-Item -ItemType Directory -Path $dirPath -Force | Out-Null
        }
    }
}
$reportsDir = Join-Path $DestRoot "reports"
if (-not (Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir -Force | Out-Null
}

function Test-FileIntegrity([string]$filePath, [string]$category) {
    if (-not (Test-Path $filePath)) { return $false }
    $fileInfo = Get-Item $filePath
    if ($fileInfo.Length -lt 1024) { return $false }

    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
    try {
        $fs = [System.IO.File]::OpenRead($filePath)
        $buffer = New-Object byte[] 4
        $bytesRead = $fs.Read($buffer, 0, 4)
        $fs.Close()
        if ($bytesRead -lt 4) { return $false }

        # Check PDF signature (%PDF)
        if ($ext -eq ".pdf") {
            if ($buffer[0] -eq 0x25 -and $buffer[1] -eq 0x50 -and $buffer[2] -eq 0x44 -and $buffer[3] -eq 0x46) {
                return $true
            }
            return $false
        }

        # Check ZIP signature (PK..)
        if ($ext -eq ".zip") {
            if ($buffer[0] -eq 0x50 -and $buffer[1] -eq 0x4B) {
                # Test opening zip archive
                $zip = [System.IO.Compression.ZipFile]::OpenRead($filePath)
                $entryCount = $zip.Entries.Count
                $zip.Dispose()
                return ($entryCount -gt 0)
            }
            return $false
        }
        return $true
    } catch {
        return $false
    }
}

function Get-Sha256Hex([string]$filePath) {
    try {
        $hash = Get-FileHash -Path $filePath -Algorithm SHA256
        return $hash.Hash.ToLower()
    } catch {
        return ""
    }
}

function Download-SingleFile($item, [string]$DestRoot) {
    $targetPath = Join-Path $DestRoot $item.target_rel_path
    $tmpPath = $targetPath + ".tmp"
    $url = $item.url

    # Check if target file already exists and is valid
    if (Test-FileIntegrity $targetPath $item.category) {
        $hash = Get-Sha256Hex $targetPath
        $fi = Get-Item $targetPath
        return [PSCustomObject]@{
            item = $item
            status = "SKIPPED_ALREADY_VALID"
            path = $targetPath
            bytes = $fi.Length
            hash = $hash
            error = $null
        }
    }

    $parentDir = Split-Path -Parent $targetPath
    if (-not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }

    $maxRetries = 3
    $success = $false
    $lastError = $null

    for ($attempt = 1; $attempt -le $maxRetries; $attempt++) {
        try {
            $req = [System.Net.HttpWebRequest]::Create($url)
            $req.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZhongWenHub/1.0"
            $req.Timeout = 120000
            $req.ReadWriteTimeout = 120000

            $startBytes = 0
            if ((Test-Path $tmpPath) -and $item.accept_ranges) {
                $existingBytes = (Get-Item $tmpPath).Length
                if ($existingBytes -lt $item.size_bytes) {
                    $req.AddRange($existingBytes)
                    $startBytes = $existingBytes
                }
            }

            $response = $req.GetResponse()
            $responseStream = $response.GetResponseStream()

            $fileMode = if ($startBytes -gt 0) { [System.IO.FileMode]::Append } else { [System.IO.FileMode]::Create }
            $fileStream = New-Object System.IO.FileStream($tmpPath, $fileMode, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)

            $buffer = New-Object byte[] 65536
            while (($bytesRead = $responseStream.Read($buffer, 0, $buffer.Length)) -gt 0) {
                $fileStream.Write($buffer, 0, $bytesRead)
            }

            $fileStream.Flush()
            $fileStream.Close()
            $responseStream.Close()
            $response.Close()

            # Verify integrity
            if (Test-FileIntegrity $tmpPath $item.category) {
                if (Test-Path $targetPath) { Remove-Item $targetPath -Force }
                Move-Item -Path $tmpPath -Destination $targetPath -Force
                $hash = Get-Sha256Hex $targetPath
                $fi = Get-Item $targetPath
                $success = $true
                return [PSCustomObject]@{
                    item = $item
                    status = "DOWNLOADED_AND_VERIFIED"
                    path = $targetPath
                    bytes = $fi.Length
                    hash = $hash
                    error = $null
                }
            } else {
                throw "Tap tin tai ve khong vuot qua kiem tra chu ky magic bytes hoac tinh toan ven."
            }
        } catch {
            $lastError = $_.Exception.Message
            if (Test-Path $tmpPath) {
                # If resume failed, clean tmp on last attempt
                if ($attempt -eq $maxRetries) {
                    Remove-Item $tmpPath -Force -ErrorAction SilentlyContinue
                }
            }
            Start-Sleep -Seconds ($attempt * 2)
        }
    }

    return [PSCustomObject]@{
        item = $item
        status = "FAILED"
        path = $targetPath
        bytes = 0
        hash = ""
        error = $lastError
    }
}

Write-Host ""
Write-Host "Dang bat dau tien trinh tai xuong (Toi da $Concurrency luong dong thoi)..." -ForegroundColor Green

$downloadResults = @()
$startTime = Get-Date

# Sequential execution with robust retry (or chunked)
$index = 1
foreach ($item in $rawManifest) {
    Write-Host ("[{0}/{1}] Dang xu ly: [{2}] {3}..." -f $index, $rawManifest.Count, $item.level, $item.filename) -NoNewline -ForegroundColor White
    $res = Download-SingleFile $item $DestRoot
    $downloadResults += $res

    if ($res.status -eq "DOWNLOADED_AND_VERIFIED") {
        Write-Host (" HOAN TAT ({0:N2} MB)" -f ($res.bytes / (1024*1024))) -ForegroundColor Green
    } elseif ($res.status -eq "SKIPPED_ALREADY_VALID") {
        Write-Host " DA CO SAN & HOP LE" -ForegroundColor Yellow
    } else {
        Write-Host " THAT BAI: $($res.error)" -ForegroundColor Red
    }
    $index++
}

$elapsed = (Get-Date) - $startTime

# Generate JSON Manifest
$manifestResult = @{
    generated_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    dest_root = $DestRoot
    total_files = $downloadResults.Count
    downloaded_count = ($downloadResults | Where-Object { $_.status -eq "DOWNLOADED_AND_VERIFIED" }).Count
    skipped_count = ($downloadResults | Where-Object { $_.status -eq "SKIPPED_ALREADY_VALID" }).Count
    failed_count = ($downloadResults | Where-Object { $_.status -eq "FAILED" }).Count
    elapsed_seconds = [math]::Round($elapsed.TotalSeconds, 2)
    files = @($downloadResults | ForEach-Object {
        @{
            level = $_.item.level
            category = $_.item.category
            filename = $_.item.filename
            target_rel_path = $_.item.target_rel_path
            url = $_.item.url
            status = $_.status
            size_bytes = $_.bytes
            sha256 = $_.hash
            error = $_.error
        }
    })
}

$resultJsonPath = Join-Path $reportsDir "download_manifest_executed.json"
$manifestResult | ConvertTo-Json -Depth 5 | Set-Content -Path $resultJsonPath -Encoding UTF8

# Generate Markdown Summary
$summaryMd = @"
# HSK Standard Course 2.0 — Resource Download Execution Summary

- **Thoi gian:** $($manifestResult.generated_at)
- **Thu muc dich:** `$DestRoot`
- **Tong file:** $($manifestResult.total_files)
- **Tai moi:** $($manifestResult.downloaded_count)
- **Da co san:** $($manifestResult.skipped_count)
- **That bai:** $($manifestResult.failed_count)
- **Thoi gian xu ly:** $($manifestResult.elapsed_seconds) giay

## Bang chi tiet tap tin

| Cap do | Danh muc | Ten file | Dung luong (MB) | SHA-256 (Rut gon) | Trang thai |
|:---:|:---|:---|:---:|:---|:---:|
"@

foreach ($r in $manifestResult.files) {
    $sizeMb = [math]::Round($r.size_bytes / (1024*1024), 2)
    $shortHash = if ($r.sha256) { $r.sha256.Substring(0, 12) + "..." } else { "N/A" }
    $summaryMd += "`n| $($r.level) | $($r.category) | $($r.filename) | $sizeMb MB | `$shortHash` | **$($r.status)** |"
}

$summaryMdPath = Join-Path $reportsDir "DOWNLOAD_SUMMARY.md"
$summaryMd | Set-Content -Path $summaryMdPath -Encoding UTF8

Write-Host ""
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "                        KET QUA TAI TAI LIEU                                   " -ForegroundColor Yellow
Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "Tai moi thanh cong : $($manifestResult.downloaded_count)" -ForegroundColor Green
Write-Host "Da co san hop le   : $($manifestResult.skipped_count)" -ForegroundColor Yellow
Write-Host "That bai           : $($manifestResult.failed_count)" -ForegroundColor Red
Write-Host "Thoi gian thuc hien: $($manifestResult.elapsed_seconds)s" -ForegroundColor Gray
Write-Host "Bao cao JSON       : $resultJsonPath" -ForegroundColor White
Write-Host "Bao cao Markdown   : $summaryMdPath" -ForegroundColor White
Write-Host "===============================================================================" -ForegroundColor Cyan

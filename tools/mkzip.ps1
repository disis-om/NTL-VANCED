# Build the NTL VANCED release zip with SPEC-CORRECT forward-slash entry names.
# PowerShell 5.1's Compress-Archive writes "s\a_angel.webp" (backslash). Chrome on
# desktop tolerates it, but the Android extension loader reads that as one flat
# filename, so every chrome-extension://<id>/s/*.webp request 404s -> NTL's sprite
# atlas never builds -> D7() never passes -> Settings / Skin / Play look dead.
param(
  [string]$Src = (Split-Path $PSScriptRoot -Parent),   # the repo root (this script lives in tools/)
  [string]$Out
)
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$manifest = Get-Content (Join-Path $Src "manifest.json") -Raw | ConvertFrom-Json
$ver = $manifest.version_name
if (-not $Out) { $Out = Join-Path (Split-Path $Src -Parent) ("NTL-VANCED-v" + $ver + ".zip") }   # zips land next to the repo folder, never inside it
if (Test-Path $Out) { Remove-Item $Out -Force }

$srcFull = (Resolve-Path $Src).Path.TrimEnd('\') + '\'
$files = Get-ChildItem -Path $Src -Recurse -File -Force | Where-Object {
  $rel = $_.FullName.Substring($srcFull.Length)
  ($rel -notlike "_metadata\*") -and ($rel -notlike ".git\*") -and ($rel -notlike "tools\*") -and ($rel -notlike "updates\*") -and ($rel -notlike ".github\*") -and ($_.Name -ne ".gitignore") -and ($_.Extension -ne ".md") -and ($_.Extension -ne ".zip")
}

$zip = [System.IO.Compression.ZipFile]::Open($Out, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($f in $files) {
    $rel = $f.FullName.Substring($srcFull.Length).Replace('\', '/')   # <-- the fix
    $entry = $zip.CreateEntry($rel, [System.IO.Compression.CompressionLevel]::Optimal)
    $es = $entry.Open()
    try { $fs = [System.IO.File]::OpenRead($f.FullName); try { $fs.CopyTo($es) } finally { $fs.Dispose() } }
    finally { $es.Dispose() }
  }
} finally { $zip.Dispose() }

# verify: no backslash anywhere, and a known s/ file is addressable
$check = [System.IO.Compression.ZipFile]::OpenRead($Out)
try {
  $bad = @($check.Entries | Where-Object { $_.FullName -like "*\*" }).Count
  $hasS = @($check.Entries | Where-Object { $_.FullName -eq "s/prev3.webp" }).Count
  $n = $check.Entries.Count
} finally { $check.Dispose() }

"zip      : $Out"
"version  : $ver"
"files    : $n"
"backslash: $bad   (must be 0)"
"s/prev3  : $hasS   (must be 1)"
if ($bad -ne 0 -or $hasS -ne 1) { throw "ZIP VERIFICATION FAILED" }
"size     : {0:N1} MB" -f ((Get-Item $Out).Length / 1MB)

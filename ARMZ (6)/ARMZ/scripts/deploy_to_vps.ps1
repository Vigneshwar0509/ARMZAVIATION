<#
PowerShell deploy script: build zip, upload to VPS, backup, extract, restart Docker, show backend logs.
Usage example:

powershell -ExecutionPolicy Bypass -File .\scripts\deploy_to_vps.ps1 -VpsIp "1.2.3.4" -SshPort 22 -SshUser root -LocalPath "D:\Armz finall Test\ARMZ (6)\ARMZ" -RemotePath "/root/ARMZAVIATION/ARMZ (6)/ARMZ"

Notes:
- This script excludes common sensitive/large folders from the upload (.git, .env, db.sqlite3, .venv, node_modules).
- It uploads the archive as "armz_update.zip" on the VPS.
- On the VPS it will install unzip/rsync if missing (tries apt-get then yum), stop containers, backup current project to backups/, copy new files (excluding .env/db.sqlite3), then rebuild and start containers.
- Review the script before running and test on a non-production copy first.
#>
param(
    [Parameter(Mandatory=$true)][string]$VpsIp,
    [int]$SshPort = 22,
    [string]$SshUser = "root",
    [string]$LocalPath = (Get-Location).Path,
    [string]$RemotePath = "/root/ARMZAVIATION/ARMZ (6)/ARMZ",
    [string]$BackupParent = "/root/ARMZAVIATION/backups",
    [switch]$KeepLocalZip
)

function Write-ErrAndExit($msg){ Write-Host $msg -ForegroundColor Red; exit 1 }

if (-not (Get-Command scp -ErrorAction SilentlyContinue)) { Write-Host "Warning: 'scp' not found in PATH. Ensure OpenSSH is installed." }
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) { Write-Host "Warning: 'ssh' not found in PATH. Ensure OpenSSH is installed." }

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$localZipName = "armz_update_$timestamp.zip"
$localZipPath = Join-Path -Path $env:TEMP -ChildPath $localZipName

Write-Host "Creating archive from '$LocalPath' -> $localZipPath"
Push-Location -LiteralPath $LocalPath
try {
    $excludeNames = @('.git','.env','db.sqlite3','.venv','backend\\.venv','node_modules','frontend\\node_modules')
    $items = Get-ChildItem -Force | Where-Object { $excludeNames -notcontains $_.Name }
    if ($items.Count -eq 0) { Write-ErrAndExit "No files found to archive in $LocalPath" }
    $paths = $items | ForEach-Object { $_.FullName }
    Compress-Archive -LiteralPath $paths -DestinationPath $localZipPath -Force
} catch {
    Pop-Location
    Write-ErrAndExit "Failed to create zip: $_"
}
Pop-Location

# Upload to VPS as fixed name armz_update.zip to simplify extraction
$remoteUploadTarget = "${SshUser}@${VpsIp}:'${RemotePath}/armz_update.zip'"
Write-Host "Uploading archive to $remoteUploadTarget"
$scpArgs = @('-P', $SshPort.ToString(), $localZipPath, $remoteUploadTarget)
$scpResult = & scp @scpArgs
if ($LASTEXITCODE -ne 0) { Write-ErrAndExit "scp failed with exit code $LASTEXITCODE" }

# Remote script to run on VPS
$remoteScript = @"
set -e
REMOTE='${RemotePath}'
BACKUP_PARENT='${BackupParent}'
TIMESTAMP='${timestamp}'
TMPDIR="/root/armz_update_${timestamp}_tmp"
mkdir -p "$BACKUP_PARENT"
mkdir -p "$TMPDIR"
# Ensure unzip and rsync are available
if ! command -v unzip >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update && apt-get install -y unzip rsync || true
  elif command -v yum >/dev/null 2>&1; then
    yum install -y unzip rsync || true
  fi
fi
# Extract uploaded archive into temp dir
if [ -f "${RemotePath}/armz_update.zip" ]; then
  unzip -o "${RemotePath}/armz_update.zip" -d "$TMPDIR"
else
  echo "Uploaded archive not found: ${RemotePath}/armz_update.zip"
  exit 2
fi
# Move into project dir and stop containers
if [ -d "$REMOTE" ]; then
  cd "$REMOTE"
else
  mkdir -p "$REMOTE"
  cd "$REMOTE"
fi
# Stop containers (best-effort)
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose down || true
elif command -v docker >/dev/null 2>&1 && [ -f docker-compose.yml ]; then
  docker compose down || true
fi
# Create backup of current project excluding secrets and large files
BACKUP_DIR="$BACKUP_PARENT/armz_${timestamp}"
mkdir -p "$BACKUP_DIR"
# Use rsync if available to preserve permissions
if command -v rsync >/dev/null 2>&1; then
  rsync -a --exclude='.env' --exclude='db.sqlite3' --exclude='media' --exclude='venv' --exclude='.venv' ./ "$BACKUP_DIR"/
else
  # fallback copy (may include everything)
  cp -a . "$BACKUP_DIR" || true
fi
# Sync new files into place but keep existing .env and db.sqlite3
if command -v rsync >/dev/null 2>&1; then
  rsync -a --exclude='.env' --exclude='db.sqlite3' --exclude='media' --exclude='venv' --exclude='.venv' "$TMPDIR"/ ./
else
  # basic fallback: copy files from tmp to remote (may overwrite .env/db if present in archive)
  cp -a "$TMPDIR"/. ./
fi
# Clean up uploaded archive and temp
rm -f "${RemotePath}/armz_update.zip"
rm -rf "$TMPDIR"
# Start containers and build
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose up -d --build
elif command -v docker >/dev/null 2>&1 && [ -f docker-compose.yml ]; then
  docker compose up -d --build
else
  echo "docker-compose not found; please start containers manually"
  exit 3
fi
# Wait briefly then show backend logs
sleep 2
if command -v docker-compose >/dev/null 2>&1; then
  docker-compose logs --no-log-prefix --tail=200 backend || docker-compose logs --tail=200
else
  docker compose logs --no-log-prefix --tail=200 backend || docker compose logs --tail=200
fi
"@

Write-Host "Executing remote deploy script on $SshUser@$VpsIp"
$sshArgs = @('-p', $SshPort.ToString(), "$SshUser@$VpsIp", 'bash -s')
$remoteScript | & ssh @sshArgs
if ($LASTEXITCODE -ne 0) { Write-ErrAndExit "Remote deploy script failed with exit code $LASTEXITCODE" }

if (-not $KeepLocalZip) {
    Remove-Item -Path $localZipPath -Force -ErrorAction SilentlyContinue
    Write-Host "Removed local archive $localZipPath"
} else {
    Write-Host "Kept local archive: $localZipPath"
}

Write-Host "Deployment finished successfully. Backup stored at $BackupParent/armz_$timestamp on VPS." -ForegroundColor Green

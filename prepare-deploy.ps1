# Baut das Frontend lokal (liest .env.production automatisch, siehe Vite-
# Mode-Doku) und stellt einen copy-paste-fertigen deploy/-Ordner fuer den
# Upload aufs NAS zusammen - analog zu otherApp/UPDATE_DEPLOYMENT.md.
# KEINE .env hier drin: die NAS-.env (VITE_POCKETBASE_URL braucht es nicht
# mehr, wohl aber die Netcup-DynDNS-Zugangsdaten) bleibt ausschliesslich auf
# dem NAS liegen und wird nie ueberschrieben.

$ErrorActionPreference = "Stop"

npm run build

$deployDir = Join-Path $PSScriptRoot "deploy"
if (Test-Path $deployDir) {
    Remove-Item $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir | Out-Null

Copy-Item (Join-Path $PSScriptRoot "dist") (Join-Path $deployDir "dist") -Recurse
Copy-Item (Join-Path $PSScriptRoot "Dockerfile") $deployDir
Copy-Item (Join-Path $PSScriptRoot "docker-compose.yml") $deployDir
Copy-Item (Join-Path $PSScriptRoot "nginx.conf") $deployDir
Copy-Item (Join-Path $PSScriptRoot "pocketbase") (Join-Path $deployDir "pocketbase") -Recurse

Write-Host "Fertig: '$deployDir' kann jetzt aufs NAS hochgeladen werden (Inhalt ueberschreiben, pb_data/.env NICHT anfassen)."

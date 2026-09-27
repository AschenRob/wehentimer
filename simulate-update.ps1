$ErrorActionPreference = "Stop"
# Stellt ein Update lokal nach: neuester Prod-JSON-Export (backups/) + alte Migrationen -> neue Version, Vergleich vorher/nachher.
$root = $PSScriptRoot
$exe = Join-Path $root "pocketbase\pocketbase.exe"
$export = Get-ChildItem (Join-Path $root "backups\prod-export-*.json") | Sort-Object Name | Select-Object -Last 1
$data = Get-Content $export.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
$scratch = Join-Path $env:TEMP "pb_sim_prod"
$oldMig = Join-Path $env:TEMP "pb_sim_oldmig"
foreach ($d in @($scratch, $oldMig)) { if (Test-Path $d) { Remove-Item $d -Recurse -Force } }
New-Item -ItemType Directory $oldMig | Out-Null
Copy-Item (Join-Path $root "pocketbase\pb_migrations\1790000000_create_contractions.js") $oldMig
Copy-Item (Join-Path $root "pocketbase\pb_migrations\1790000010_create_settings.js") $oldMig

function Start-Pb($migDir) {
  $p = Start-Process -FilePath $exe -ArgumentList "serve", "--http=127.0.0.1:8198", "--dir=$scratch", "--migrationsDir=$migDir" -PassThru -WindowStyle Hidden
  Start-Sleep -Seconds 3
  return $p
}
function Get-Fingerprint {
  $items = (Invoke-RestMethod -Uri "http://127.0.0.1:8198/api/collections/contractions/records?perPage=500&sort=start").items
  $text = ($items | ForEach-Object { "$($_.id)|$($_.start)|$($_.end)|$($_.duration_sec)|$($_.intensity)|$($_.note)|$($_.is_manual)" }) -join "`n"
  $hash = [System.BitConverter]::ToString([System.Security.Cryptography.SHA256]::Create().ComputeHash([System.Text.Encoding]::UTF8.GetBytes($text)))
  $s = (Invoke-RestMethod -Uri "http://127.0.0.1:8198/api/collections/settings/records").items[0]
  return "count=$($items.Count) sha=$($hash.Substring(0,23)) settings=$($s.interval_minutes)/$($s.duration_minutes)/$($s.sustained_minutes) tol=$($s.tolerance_count)"
}

# 1) Stand wie in PROD: nur die zwei alten Migrationen + Produktivdaten
& $exe migrate up --dir=$scratch --migrationsDir=$oldMig | Out-Null
$p = Start-Pb $oldMig
foreach ($c in $data.contractions) {
  $body = @{ id = $c.id; start = $c.start; end = $c.end; duration_sec = $c.duration_sec; intensity = $c.intensity; note = $c.note; is_manual = $c.is_manual } | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8198/api/collections/contractions/records" -Body $body -ContentType "application/json; charset=utf-8" | Out-Null
}
$ps = $data.settings[0]
$sid = (Invoke-RestMethod -Uri "http://127.0.0.1:8198/api/collections/settings/records").items[0].id
Invoke-RestMethod -Method Patch -Uri "http://127.0.0.1:8198/api/collections/settings/records/$sid" -Body (@{ interval_minutes = $ps.interval_minutes; duration_minutes = $ps.duration_minutes; sustained_minutes = $ps.sustained_minutes } | ConvertTo-Json) -ContentType "application/json" | Out-Null
$before = Get-Fingerprint
Stop-Process -Id $p.Id; Start-Sleep -Seconds 2

# 2) Neue Version starten (wendet 1790000020 + 1790000030 an, wie der Container beim Update)
$p = Start-Pb (Join-Path $root "pocketbase\pb_migrations")
$after = Get-Fingerprint
$feedings = (Invoke-RestMethod -Uri "http://127.0.0.1:8198/api/collections/feedings/records").totalItems
Stop-Process -Id $p.Id; Start-Sleep -Seconds 2

"PROD-Export: $($data.contractions.Count) Wehen"
"VORHER:  $before"
"NACHHER: $after"
"feedings-Collection vorhanden, Eintraege: $feedings"
foreach ($d in @($scratch, $oldMig)) { Remove-Item $d -Recurse -Force }

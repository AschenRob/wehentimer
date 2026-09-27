# DEPLOYMENT.md — Update einer neuen Version aufs NAS

> Die Ersteinrichtung (DNS, nginx Proxy Manager, Compose-Projekt) ist erledigt,
> siehe [INITIAL_DEPLOYMENT.md](INITIAL_DEPLOYMENT.md). **Dieses Dokument ist
> ab jetzt der relevante Ablauf** für jede neue Version.

## Wo liegen die Daten?

Alle Wehen/Mahlzeiten/Einstellungen liegen in PocketBase im **benannten
Docker-Volume `pb_data`** (im Container unter `/pb/pb_data`). Der Container
Manager legt es als `<Projektname>_pb_data` an (z. B. `wehentimer_pb_data`).

- Das Volume ist **nicht** Teil des hochgeladenen Projektordners. Hochladen,
  Neu-Bauen und Neustarten der Container lassen es unberührt.
- Verloren gehen die Daten nur, wenn das **Volume gelöscht** wird
  (`docker compose down -v`, „Projekt löschen“ mit Häkchen bei Volumes) oder
  das Projekt unter **anderem Namen** neu angelegt wird. Dann entsteht ein neues,
  leeres Volume; das alte bleibt zwar erhalten, ist aber nicht mehr eingebunden.
- Migrationen in `pb_migrations/` laufen beim Start automatisch. Bereits
  angewendete werden übersprungen. Die Migrationen dieses Projekts fügen nur
  Felder/Collections hinzu, sie löschen oder ändern keine bestehenden Wehen.

## Ablauf

### 1. Vorher: Stand notieren und Backup ziehen (Pflicht)

1. **Anzahl der Wehen notieren** (öffentliche API, nur lesend):
   ```powershell
   (Invoke-RestMethod "https://wehen-api.familieaschenbrenner.de/api/collections/contractions/records?perPage=1").totalItems
   ```
2. **PocketBase-Backup erstellen und herunterladen:** Adminpanel
   (`http://<NAS-LAN-IP>:8092/_/`, nur im Heimnetz) → **Settings → Backups**
   → **„Initialize new backup“** → danach die ZIP-Datei über das
   Download-Symbol **auf den PC herunterladen**. Das Backup liegt sonst nur im
   selben Volume wie die Daten selbst.
3. **Zweites Sicherheitsnetz:** JSON-Export aller Wehen + Einstellungen in den
   lokalen, gitignorierten Ordner `backups/`:
   ```powershell
   New-Item -ItemType Directory -Force backups | Out-Null; $ts = Get-Date -Format "yyyyMMdd-HHmm"; $c = Invoke-RestMethod "https://wehen-api.familieaschenbrenner.de/api/collections/contractions/records?perPage=500&sort=start"; $s = Invoke-RestMethod "https://wehen-api.familieaschenbrenner.de/api/collections/settings/records"; @{ exported = (Get-Date).ToString("o"); contractions = $c.items; settings = $s.items } | ConvertTo-Json -Depth 5 | Set-Content -Encoding UTF8 "backups/prod-export-$ts.json"
   ```
   (Bei mehr als 500 Wehen `perPage`/`page` anpassen.)
4. Optional, wenn die Version **neue Migrationen** enthält: Mit
   `.\simulate-update.ps1` lokal nachstellen, dass das Update die
   Produktivdaten unverändert lässt. Das Skript lädt den neuesten JSON-Export
   in eine Test-Instanz mit den alten Migrationen, startet dann die neue
   Version und vergleicht vorher/nachher einen Fingerabdruck.

### 2. Deploy-Ordner lokal bauen

```powershell
.\prepare-deploy.ps1
```

Erzeugt `deploy/` mit `dist/`, `Dockerfile`, `docker-compose.yml`,
`nginx.conf` und `pocketbase/` (nur `Dockerfile` + `pb_migrations/`). Die
lokale Dev-Datenbank (`pocketbase/pb_data`) und `pocketbase.exe` sind
**bewusst nicht** enthalten.

### 3. Hochladen

Inhalt von `deploy/` in den bestehenden Projektordner auf dem NAS kopieren
(gleichnamige Dateien/Ordner überschreiben).

- **`.env` auf dem NAS nicht anfassen.** Sie enthält die netcup-Zugangsdaten
  für DynDNS und liegt nicht in `deploy/`.
- **Nicht** das Compose-Projekt löschen oder unter neuem Namen anlegen, siehe oben.

### 4. Neu bauen und starten

Im Container Manager das **bestehende** Projekt **neu bauen** (Build/Rebuild,
nicht nur Neustart, sonst landet das neue `dist/` nicht im Frontend-Image) und
starten. Im Log von `wehentimer-pocketbase` sollten neue Migrationen als
`Applied …` erscheinen.

> Kurz vorher sicherstellen, dass auf keinem Handy gerade ein Timer läuft.
> Ab dieser Version überlebt ein laufender Timer das Neuladen; in der alten
> Version steckt er nur im Arbeitsspeicher und geht beim Neuladen verloren.

### 5. Nachher prüfen

1. Anzahl der Wehen erneut abfragen (Befehl aus 1.1). Sie muss **gleich**
   sein wie vorher.
2. App öffnen (ggf. zweimal neu laden, damit der Service Worker die neue
   Version übernimmt) und die neuen Funktionen kurz testen.
3. Bei Auffälligkeiten: `docker compose logs wehentimer-pocketbase` bzw.
   Container-Logs im Container Manager ansehen.

## Notfall: Daten wiederherstellen

- **PocketBase-Backup:** Adminpanel → Settings → Backups → ZIP hochladen →
  „Restore“. PocketBase startet danach mit dem gesicherten Stand neu.
- **Leeres Volume nach versehentlichem Neuanlegen:** Im Container Manager
  unter Volumes nach dem alten `…_pb_data` schauen. Es existiert meist noch
  und kann wieder eingebunden werden. Alternativ das heruntergeladene
  Backup wie oben einspielen.

## Stand der Migrationen

| Datei | Inhalt | Wirkung auf bestehende Daten |
|---|---|---|
| `1790000000_create_contractions.js` | Collection `contractions` | – (Ersteinrichtung) |
| `1790000010_create_settings.js` | Collection `settings` + Singleton | – (Ersteinrichtung) |
| `1790000020_add_tolerance_to_settings.js` | Feld `settings.tolerance_count`, Wert 1 | 5-1-1-Werte bleiben unverändert |
| `1790000030_create_feedings.js` | Neue Collection `feedings` (Stilltracker) | keine |

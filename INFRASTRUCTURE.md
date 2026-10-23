# INFRASTRUCTURE.md — Hard- und Software-Stack für neue Projekte

> Zweck: Beim Anlegen eines neuen Projekts ist sofort klar, **worauf** und **wie** es
> betrieben wird. Fachlichkeit steht nicht hier. Platzhalter: `<app>` (Projektname, klein),
> `<sub>` (Subdomain). Neue Werte immer mit dem Nutzer bestätigen, nicht raten.

## 1. Umgebung

| Ebene | Stand |
|---|---|
| Entwicklung | Windows, PowerShell 5.1 (kein `&&`, Befehle mit `;` in **einer Zeile**), VS Code, Node.js |
| Server | NAS mit Docker („Container Manager“), **kein SSH** — nur GUI + SFTP/File-Station. Ältere Apps liefen evtl. auf einem zweiten (Synology-)NAS → **immer so planen, als wäre es dasselbe NAS** |
| Reverse Proxy | nginx Proxy Manager (NPM) auf dem NAS: SSL (Let's Encrypt), Weiterleitung auf `NAS-LAN-IP:Port`. **Container wird nie angefasst, bestehende Hosts nie bearbeitet/neu angelegt** (Advanced-Regeln gingen verloren) |
| Domain / DNS | `familieaschenbrenner.de` bei **netcup (CloudDNS)**; Anschluss mit wechselnder öffentlicher IP → DynDNS-Container je Projekt |
| Mail | Brevo als SMTP-Relay (nur wenn ein Projekt Mails braucht), Absender-Domain muss in Brevo/netcup authentifiziert sein |
| Deployment | Lokal bauen → Ordner `deploy/` per SFTP aufs NAS → Container Manager „neu bauen“. Kein Git-Deployment |

## 2. Architektur pro Projekt

```
Browser ──HTTPS──> NPM ─┬─ <sub>.familieaschenbrenner.de      -> NAS:<FE-Port>  <app>-frontend   (nginx, statisches Vite-Build)
                        └─ <sub>-api.familieaschenbrenner.de  -> NAS:<PB-Port>  <app>-pocketbase (PocketBase + SQLite)
<app>-dyndns ──> netcup CloudDNS (hält A-Records von <sub>, <sub>-api aktuell)
```

- Drei Container je Projekt, **eindeutige Namen** mit Präfix `<app>-`.
- Frontend wird **lokal** gebaut (kein `npm` im Docker-Build; vermeidet 403-Rechteprobleme).
  Frontend-Image: `nginx` + `COPY dist/` + `chmod -R a+rX`.
- Backend: PocketBase, **gepinnte Version** (aktuell `0.39.10`, nie `:latest`), Migrationen
  (`pb_migrations/`) und ggf. Hooks (`pb_hooks/`) per `COPY` ins Image, Daten im benannten
  Volume `pb_data`.
- Compose-/Container-Manager-**Projektname = `<app>`**, einmal festlegen, nie ändern
  (bestimmt die Volume-Namen `<app>_pb_data`; gleicher Name = fremde Daten übernommen).

## 3. Technologie-Stack (bewährt, zusammen getestet)

- **Frontend:** Vite 8, React 19, TypeScript ~6, Tailwind CSS v4 (`@tailwindcss/vite`),
  shadcn/ui mit **Base UI** (Preset „nova“, `npx shadcn@latest init -t vite -b base -p nova -y`),
  Lucide Icons, Geist-Schrift lokal (`@fontsource-variable/geist`), `sonner` (Toasts),
  Recharts (Diagramme), date-fns, `react-router-dom` v7 falls Routing nötig.
- **PWA:** `vite-plugin-pwa` (`autoUpdate`) + `@vite-pwa/assets-generator` (Icons aus `public/Icon.png`).
- **Backend-Client:** `pocketbase` JS-SDK ^0.28, zentrale Instanz in `src/lib/pocketbase.ts`.
- **Tooling:** `oxlint`; `npm run build` = `tsc -b && vite build`; Alias `@` → `src`;
  Formatierung: Single Quotes, keine Semikolons, 2 Spaces, Breite 100.
- Kein Next.js/SSR. Texte/UI deutsch (`lang="de"`), Code-Bezeichner englisch.

## 4. Port-Register (aktuell belegt)

Vor jedem neuen Projekt **hier prüfen und den neuen Eintrag ergänzen**. Container-intern
lauscht PocketBase immer auf 8090, nginx auf 80 — relevant ist nur der **Host-Port**.

| Projekt | Vite Dev | PocketBase Dev | NAS Frontend | NAS PocketBase | Scratch-Tests (PB / Vite) |
|---|---|---|---|---|---|
| Proviantplaner (otherApp) | 5173 | 8090 | 8080 | 8090 | – |
| Wehentimer | 5174 | 8091 | 8082 | 8092 | 8198, 8199 / 5199 |
| Sudoku (geplant) | 5175 | 8093 | 8083 | 8094 | 8299 / 5299 |
| NPM (nicht anfassen) | | | 80, 81, 443 | | |

Regeln für neue Ports:
- Muster fortsetzen: Vite `517x`, Dev-PocketBase `809x`, NAS-Frontend `808x`, NAS-PocketBase
  `809x` — jeder Wert **in der gesamten Tabelle einmalig**, auch zwischen Dev-PC und NAS.
- Die Ports sind auf dem NAS **nicht automatisch geprüft**: vor dem ersten Start im Container
  Manager nachsehen, ob sie frei sind (z. B. Standardports von NAS-Diensten wie 5000/5001/9999
  meiden).
- Belegte DNS-Namen: `wehen`, `wehen-api`, `proviantplaner.de` (+ `www`, `api`), `sudoku`,
  `sudoku-api`. Weitere Einträge ebenfalls hier ergänzen.

## 5. Konfliktfreiheit (Checkliste für jedes neue Projekt)

- Eigenes Präfix `<app>` für Container, Compose-Projekt, Volumes, localStorage-Keys (`<app>.`).
- Eigener DynDNS-Container mit **nur** den eigenen Hosts und **eigenem** netcup-CloudDNS-API-Key;
  `@`, `www` und fremde Hosts bleiben unberührt. Zugangsdaten nur in der `.env` **auf dem NAS**.
- NPM: nur **neue** Proxy Hosts anlegen. HSTS an, **`includeSubDomains` aus** (sonst HTTPS-Zwang
  für alle Subdomains der Domain). Force SSL per `curl -I http://…` nachmessen (erwartet 301).
- Eigene PocketBase-Instanz je Projekt: keine geteilte Datenbank, keine geteilten Nutzerkonten.
- Neue DNS-Einträge (z. B. Mail) nur **hinzufügen**; je Name nur **ein** SPF-TXT → zusammenführen.
- Lokal: eigenes Repo-`pb_data`, eigene `.env`, nie die Daten eines anderen Projekts benutzen.

## 6. Domains & DNS (netcup)

- Je Projekt zwei Subdomains: `<sub>` (Frontend) und `<sub>-api` (PocketBase).
- netcup kennt **zwei inkompatible DNS-APIs**: „Legacy“ (Kundennr. + Key + Passwort) und
  **CloudDNS** (ein API-Key, kein Passwort). Die genutzten Domains liegen auf **CloudDNS**
  (CCP → Domains → Lupe → Tab „CloudDNS“). Die Legacy-API meldet bei CloudDNS-Zonen irreführend
  Statuscode 5029 („zone contains no records“).
- DynDNS-Image: `stecklars/dynamic-dns-netcup-api:v7.0.0`. Konfiguration:
  `CUSTOMERNR`, `CLOUDDNS_DYNDNS_APIKEY` (aus NAS-`.env`),
  `DOMAINLIST_CLOUDDNS_DYNDNS: "familieaschenbrenner.de: <sub>, <sub>-api"`,
  `CRON_SCHEDULE: "*/5 * * * *"`, `USE_IPV4: "true"`, `USE_IPV6: "false"`, `TZ: "Europe/Berlin"`,
  Volume `dyndns-data:/app/data`. Fehlende A-Records legt der Container selbst an (TTL 300 s).
  Kein generisches Tool (`ddns-updater` o. Ä.) verwenden — es kann nur die Legacy-API.
- Auf dem Apex-Namen ist kein CNAME möglich; bei wechselnder IP bleibt nur DynDNS.
- Bei „Domain geht nicht“ zuerst den lokalen DNS-Cache verdächtigen
  (`nslookup <name> 8.8.8.8`, `nslookup <name> netcup.firstns.cc`).
- Hairpin-NAT: Von zuhause über die öffentliche Domain sieht nginx die öffentliche statt der
  LAN-IP — IP-Sperren (z. B. für `/_/`) greifen dann nicht; Admin direkt per `http://<NAS-LAN-IP>:<PB-Port>/_/`.

## 7. Container-Vorlagen (Kern)

`docker-compose.yml`:
```yaml
services:
  <app>-frontend:
    build: { context: ., dockerfile: Dockerfile }
    container_name: <app>-frontend
    restart: unless-stopped
    ports: ["<FE-Port>:80"]
  <app>-pocketbase:
    build: { context: ./pocketbase, dockerfile: Dockerfile, args: { PB_VERSION: 0.39.10 } }
    container_name: <app>-pocketbase
    restart: unless-stopped
    volumes: ["pb_data:/pb/pb_data"]
    ports: ["<PB-Port>:8090"]
  <app>-dyndns:
    image: stecklars/dynamic-dns-netcup-api:v7.0.0
    container_name: <app>-dyndns
    restart: unless-stopped
    environment:
      CUSTOMERNR: ${NETCUP_CUSTOMERNR}
      CLOUDDNS_DYNDNS_APIKEY: ${NETCUP_CLOUDDNS_APIKEY}
      DOMAINLIST_CLOUDDNS_DYNDNS: "familieaschenbrenner.de: <sub>, <sub>-api"
      CRON_SCHEDULE: "*/5 * * * *"
      USE_IPV4: "true"
      USE_IPV6: "false"
      TZ: "Europe/Berlin"
    volumes: ["dyndns-data:/app/data"]
volumes: { pb_data: {}, dyndns-data: {} }
```

`pocketbase/Dockerfile` (lädt gepinntes Release für amd64/arm64):
```dockerfile
FROM alpine:3.20 AS fetch
ARG PB_VERSION=0.39.10
ARG TARGETARCH
RUN apk add --no-cache unzip ca-certificates curl \
  && ARCH=$(if [ "$TARGETARCH" = "arm64" ]; then echo arm64; else echo amd64; fi) \
  && curl -fL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${ARCH}.zip" -o /tmp/pb.zip \
  && unzip /tmp/pb.zip -d /pb && rm /tmp/pb.zip
FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=fetch /pb/pocketbase /pb/pocketbase
COPY pb_migrations /pb/pb_migrations
EXPOSE 8090
VOLUME ["/pb/pb_data"]
ENTRYPOINT ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
```
(Mit Hooks zusätzlich `COPY pb_hooks /pb/pb_hooks`.)

`nginx.conf` (Frontend):
```nginx
server {
    listen 80; server_name _; root /usr/share/nginx/html; index index.html;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), camera=(), microphone=()" always;
    add_header Content-Security-Policy "default-src 'self'; connect-src 'self' https://<sub>-api.familieaschenbrenner.de; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; base-uri 'self'; frame-ancestors 'none'" always;
    gzip on; gzip_types text/css application/javascript application/json image/svg+xml;
    location / { try_files $uri $uri/ /index.html; }
    location /assets/ { expires 30d; }
    location = /sw.js { expires -1; }
    location = /manifest.webmanifest { expires -1; }
}
```
- **In `location`-Blöcken nur `expires`, nie `add_header`** (verwirft die geerbten Sicherheits-Header).
- `connect-src` muss die **eigene** API-Domain enthalten. Neue CSP-Quellen erst als
  `Content-Security-Policy-Report-Only` in **Chrome/Edge** testen (Firefox meldet nichts).
- **Env-Dateien:** `.env` (lokal, gitignored): `VITE_POCKETBASE_URL=http://127.0.0.1:<PB-Dev-Port>`;
  `.env.production` (committet): `VITE_POCKETBASE_URL=https://<sub>-api.familieaschenbrenner.de`
  (wird beim Build fest ins Bundle gebrannt). NAS-`.env`: nur die netcup-Variablen.
- **`.gitignore`:** `node_modules`, `dist`, `deploy`, `.env`, `.env.local`,
  `pocketbase/pocketbase(.exe)`, `pocketbase/pb_data/`, `backups/`.

## 8. Deployment-Ablauf

**Erst-Deployment**
1. netcup: CloudDNS-API-Key (CCP → Meine Daten → API → *API-Keys*, nicht „Legacy“) + Kundennummer.
2. Lokal `prepare-deploy.ps1` (baut, kopiert `dist/`, `Dockerfile`, `docker-compose.yml`,
   `nginx.conf`, `pocketbase/{Dockerfile,pb_migrations[,pb_hooks]}` nach `deploy/`; **nie**
   `pb_data` oder `pocketbase.exe`).
3. `deploy/` per SFTP nach `/volume1/docker/<app>/`, dort **neue** `.env` mit den netcup-Werten.
4. Container Manager: Projekt `<app>` aus dem Ordner erstellen (Build + Start); Log prüfen
   (Migrationen „Applied …“); `<app>-dyndns`-Log prüfen.
5. NPM: zwei neue Proxy Hosts (`http`, `NAS-LAN-IP:<Port>`), Let's Encrypt, Force SSL, HTTP/2,
   HSTS ohne `includeSubDomains`. Beim API-Host im Advanced-Tab `/_/` aufs Heimnetz beschränken
   (`allow 192.168.0.0/16; deny all;` + `proxy_pass`/Header-Block).
6. PocketBase-Adminpanel (nur Heimnetz): Superuser anlegen, Rate-Limiting aktivieren,
   ggf. Application URL und Mail-Einstellungen setzen (liegen nur in `pb_data`, nicht in Migrationen).
7. Test: Funktion, Realtime auf zweitem Gerät, PWA-Installation.

**Update**
1. Vorher: Datensatzanzahl notieren; PocketBase-Backup (Adminpanel → Settings → Backups) erzeugen
   und **auf den PC herunterladen**; optional JSON-Export nach `backups/`.
2. `prepare-deploy.ps1` → `deploy/` aufs NAS (überschreiben; **`.env` und `pb_data` nie anfassen**).
3. Container Manager: Projekt **neu bauen** (nicht nur Neustart), starten; Log auf neue
   Migrationen und Hook-Fehler (`ReferenceError`, „failed to execute …pb.js“) prüfen.
4. Nachher: Datensatzanzahl gleich? App zweimal neu laden (Service Worker).

Daten liegen ausschließlich im Volume `<app>_pb_data`. Verlust nur durch `down -v`, „Projekt
löschen“ mit Volume oder ein **neu benanntes** Projekt. Pb-Upgrade nur als eigener Schritt mit
vorherigem Backup (Pin in Dockerfile **und** Compose **und** lokalem Binary gemeinsam).

## 9. Lokale Entwicklung

```powershell
.\pocketbase\pocketbase.exe serve --http=0.0.0.0:<PB-Dev-Port>   # Terminal 1
npm run dev                                                     # Terminal 2 (Vite: host: true, Port <Dev-Port>)
```
- PocketBase-Binary (gleiche Version wie im Dockerfile) liegt gitignored in `pocketbase/`;
  Migrationen laufen beim Start automatisch. Admin: `http://127.0.0.1:<PB-Dev-Port>/_/`.
- Smartphone-Test im WLAN: `VITE_POCKETBASE_URL` auf die LAN-IP des PCs, Vite neu starten,
  ggf. Windows-Firewall freigeben. **Funktioniert REST, aber nicht die UI → zuerst `.env` prüfen.**
- **Secure-Context-Falle:** Über LAN-HTTP fehlen `crypto.randomUUID`, `crypto.subtle`,
  `navigator.clipboard`. Nie ohne Fallback verwenden (sonst „tut nichts“ ohne Fehlermeldung);
  ID-Fallback: `` `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}` ``.
  Immer auch einmal am Handy per LAN-IP testen.

## 10. PocketBase — wichtigste Regeln

- **Migrationen:** neue Collection → Felder als **plain objects mit `type`-String**
  (`{ name: "x", type: "number" }`), **nicht** `new NumberField(...)` (sonst „Applied“ ohne
  Fehler, aber nur das Feld `id` existiert). Felder zu bestehender Collection:
  `collection.fields.add(new XField({...}))`; bestehende ändern über
  `fields.getByName(...)`. `created`/`updated` (autodate) explizit anlegen. Jede neue Migration
  gegen eine **Scratch-Instanz** prüfen (`migrate up --dir=<scratch> --migrationsDir=...`,
  Collection per REST kontrollieren), Scratch danach löschen. Migrationen müssen für
  Bestandsdaten sicher sein.
- **Regeln:** `""` = öffentlich, `null` = nur Superuser. Besitzer erzwingen
  (`@request.body.owner = @request.auth.id`). Unbekannte Query-Parameter werden vom SDK
  durchgereicht (`getOne(id, { token })` → `@request.query.token`).
- **Hooks** (`pb_hooks/*.pb.js`): Handler laufen **isoliert** — Funktionen/Konstanten außerhalb
  des Handlers sind unsichtbar. Jeder Pfad eines Request-/Model-Hooks endet mit `throw` oder
  `return e.next()`, sonst `200 OK` ohne Wirkung. Server-Hooks hängen an `$app`
  (`$app.onServe()`). CORS nicht per `routerUse` nachbauen (Default-`*` genügt). Echte
  Fehlermeldungen stehen in `pb_data/auxiliary.db` → `_logs`.
- **Client:** `pb.filter('f = {:p}', { p })` für Nutzerwerte; `requestKey: null` bei parallelen
  Requests/StrictMode; Realtime `subscribe('*', cb, { filter })` mit `isCancelled`-Flag im
  Cleanup, State per `id` mergen (SSE-Echo kann **vor** der HTTP-Antwort kommen → Duplikate
  vermeiden), optimistische Updates mit Rollback.
- Auth-Collections: `email` ist für Fremde ausgeblendet (auch in Client-Filtern);
  Passwortlänge max. 71; Relationen auf `users` mit `cascadeDelete: false` blockieren das Löschen.
- `findRecordsByFilter(..., limit)`: `limit <= 0` heißt **unbegrenzt**.
- Dateiuploads: nginx/NPM-Standard `client_max_body_size 1m` im Proxy Host erhöhen; HEIC wird
  nicht thumb-/browserfähig → clientseitig nach JPEG wandeln.

## 11. Frontend — wichtigste Regeln

- **Base UI `Select`:** `items={{ wert: 'Label' }}` am Root übergeben, sonst zeigt der Trigger den
  rohen Wert. In `<form>` Buttons mit `type="button"`.
- Sichtbare Zahlen/Zeiten nur über eine zentrale `src/lib/format.ts` (nie `toFixed()`/
  `toLocaleString()` verstreut; deutsche Formate).
- Reine Berechnungslogik als reine Funktionen in `src/lib/`. Geräte-lokale Einstellungen via
  `usePersistentState` (localStorage, Präfix `<app>.`); geteilte/nutzerbezogene Daten in PocketBase.
- Charts: Zeitachsen-Ticks auf lokale Mitternächte; feste Farben für Statuskategorien.
- Mobile First, Touch-tauglich. Bekannte, akzeptierte `oxlint`-Warnungen in generiertem
  shadcn-Code (`only-export-components`) ignorieren; `npm run build` muss sauber laufen.

## 12. Sicherheit (Basis)

- Gepinnte Image-Tags, PocketBase-Rate-Limiting an (hinter NPM zusätzlich `trustedProxy` mit
  `X-Forwarded-For`, `useLeftmostIP = false`, sonst teilen sich alle Nutzer ein Limit).
- `/_/` nie öffentlich; Security-Header + CSP (Abschnitt 7); keine Secrets im Bundle
  (alles mit `VITE_` ist öffentlich); keine externen CDNs/Fonts.
- Offene API-Regeln (`""`) nur als bewusste, dokumentierte Entscheidung je Collection.
- Mail aus Hooks: Nutzerdaten immer HTML-escapen, Betreffzeilen von Zeilenumbrüchen befreien,
  Mailfehler in `AfterSuccess`-Hooks nie per `throw` weitergeben. Brevo-SMTP-Schlüssel verfallen
  nach 90 Tagen Nichtnutzung; Kopien der Produktions-`pb_data` enthalten die echten
  SMTP-Zugangsdaten (vor Tests SMTP abschalten, Kopie löschen).
- Backups (Adminpanel-ZIP, `backups/`) enthalten personenbezogene Daten und Hashes: nie committen,
  nicht nur auf demselben NAS ablegen.

## 13. Arbeitsweise & Doku

- Kommunikation deutsch; der Nutzer hat wenig Programmiererfahrung → kleine, überprüfbare Schritte,
  Klickanleitungen nummeriert, bei UI-Strukturfragen die einfachere Variante vorschlagen.
- Destruktives (Volumes, `down -v`, Prod-Daten, Projektnamen ändern) nur nach Rückfrage.
- Während der Nutzer testet, keine Dateien speichern (Hot-Reload erzeugt Scheinfehler).
- Pro Projekt je **eine** Datei: `PROJECT_BRIEF.md` (Spezifikation), `PROJECT_STATUS.md`
  (Stand, Übergabe, Lessons Learned, „noch nicht deployt“ + neue Migrationen),
  `INITIAL_DEPLOYMENT.md` (Erst-Deployment), `DEPLOYMENT.md` (Updates). Status bei jeder größeren
  Änderung aktualisieren.
- Nach jeder Codeänderung: `npm run build` und `npm run lint`.

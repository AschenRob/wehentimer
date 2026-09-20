# Projektstatus & Übergabe für die nächste KI-Session

> Lies dieses Dokument zuerst. Die vollständige fachliche/technische Spezifikation
> steht in [PROJECT_BRIEF.md](PROJECT_BRIEF.md), die Deployment-Schritte in
> [INITIAL_DEPLOYMENT.md](INITIAL_DEPLOYMENT.md).

## 1. Aktueller Stand

Die App ist **vollständig implementiert und produktiv im Einsatz** unter
`https://wehen.familieaschenbrenner.de` (API unter
`https://wehen-api.familieaschenbrenner.de`). Ersteinrichtung (2026-09-20)
abgeschlossen gemäß [INITIAL_DEPLOYMENT.md](INITIAL_DEPLOYMENT.md) — drei
Container (`wehentimer-frontend`, `wehentimer-pocketbase`,
`wehentimer-dyndns`) laufen auf dem ugreen-NAS, DNS/SSL/Rate-Limiting/
Superuser sind eingerichtet.

Umgesetzt:
- Tab „Erfassung“: Start/Stop-Live-Timer (großer runder Button), manuelle
  Erfassung über Plus-Dialog (Start + Dauer/Ende gegenseitig verknüpft,
  optional Intensität 1–5 und Notiz), Liste aller Wehen mit Bearbeiten/Löschen.
- Tab „Auswertung“: Ampel-Status der 5-1-1-Regel samt Fortschrittsbalken und
  KPIs (Ø Abstand/Dauer, Wehen im Muster, Zeit seit letzter Wehe, Wehen letzte
  Stunde), Verlaufsdiagramm (Abstand & Dauer mit Schwellenwert-Referenzlinien)
  und Zeitleiste (Balken je Wehe, im aktuellen Muster hervorgehoben).
- Einstellungen-Dialog (Zahnrad oben rechts) zum Anpassen der drei
  5-1-1-Schwellenwerte, geräteübergreifend über die `settings`-Collection.
- PocketBase-Backend ohne Login, Realtime-Sync für `contractions` und
  `settings` (mehrere Geräte sehen Änderungen sofort).
- PWA installierbar (Icons aus `Icon.png` generiert), Docker-Setup für
  Frontend + PocketBase mit eindeutigen Container-Namen/Ports (kein Konflikt
  mit `otherApp`).

## 2. Lokal starten

Zwei Terminals, **bewusst andere Ports als otherApp** (dort 5173/8090):

```powershell
# Terminal 1: PocketBase (Binary separat herunterladen, siehe unten)
.\pocketbase\pocketbase.exe serve --http=0.0.0.0:8091

# Terminal 2: Frontend
npm run dev
```

Frontend: `http://localhost:5174`. PocketBase-Adminpanel: `http://127.0.0.1:8091/_/`
(beim ersten Start Superuser anlegen).

- `pocketbase.exe`/`pocketbase` und `pocketbase/pb_data/` sind **gitignored**
  und müssen lokal separat besorgt werden (Version **0.39.10** von
  https://github.com/pocketbase/pocketbase/releases, passend zum
  `pocketbase/Dockerfile`). Migrationen in `pocketbase/pb_migrations/` werden
  beim ersten Start automatisch angewendet.
- `.env` (lokal, gitignored) zeigt auf die LAN-IP des Dev-Rechners (siehe
  unten), NICHT auf `127.0.0.1` — sonst kann das Smartphone PocketBase nicht
  erreichen.

### Vom Smartphone aus erreichbar machen

Beide Dienste müssen auf allen Netzwerk-Interfaces lauschen, nicht nur auf
`127.0.0.1`, UND das Frontend muss PocketBase über die LAN-IP statt
`127.0.0.1` ansprechen:

1. PocketBase mit `--http=0.0.0.0:8091` starten (s.o., nicht `127.0.0.1`).
2. `vite.config.ts` setzt bereits `server.host = true` /
   `preview.host = true` — Vite bindet damit ebenfalls auf `0.0.0.0` und
   zeigt beim Start die LAN-URL an (`➜ Network: http://<LAN-IP>:5174/`).
3. `.env` auf die LAN-IP des Dev-Rechners zeigen lassen, z.B.
   `VITE_POCKETBASE_URL=http://192.168.178.20:8091` (IP per `ipconfig`/
   `Get-NetIPAddress` ermitteln — ändert sich ggf. nach Router-Neustart/DHCP,
   dann `.env` erneut anpassen und `npm run dev` neu starten).
4. Auf dem Smartphone (im **selben WLAN**) die vom Vite-Terminal angezeigte
   Network-URL öffnen, z.B. `http://192.168.178.20:5174`.
5. Falls die Seite auf dem Handy nicht lädt: Windows-Firewall kann private
   Netzwerk-Zugriffe auf `node.exe`/`pocketbase.exe` blockieren — beim
   Verbindungsaufbau erscheint normalerweise ein Zulassen-Dialog; falls
   nicht, manuell eine Eingehende Regel für die Ports 5174/8091 im privaten
   Profil freigeben.

**Wichtige Falle dabei (siehe Abschnitt 5):** `crypto.randomUUID()` ist nur
in "secure contexts" (HTTPS oder `localhost`) verfügbar. Der Zugriff per
LAN-IP über einfaches HTTP ist **kein** secure context — ohne den Fallback
in `useContractions.ts` würde das Anlegen einer Wehe dort sofort mit einem
unbehandelten Fehler fehlschlagen (bereits gefixt, s.u.).

## 3. Tech-Stack

- Vite 8 + React 19 + TypeScript, Tailwind CSS v4, shadcn/ui (Preset "nova",
  Base UI-Primitives, Lucide Icons, Geist Font) — wie `otherApp`.
- Kein React-Router (zwei Tabs auf einer Seite reichen), keine
  Auth-Collection (kein Login, siehe PROJECT_BRIEF.md Abschnitt 6).
- Recharts fürs Verlaufsdiagramm; die Zeitleiste ist bewusst eine
  handgebaute leichte Komponente (keine Recharts-Gantt-Klimmzüge nötig, da
  sich Wehen zeitlich nie überlappen).
- PocketBase (self-hosted, Docker) als einzige Datenquelle, JS-SDK mit
  `autoCancellation(false)` (keine Auth, keine Autocomplete-Suche — Risiko
  von "autocancelled" bei parallelen Requests ist hier unnötig).
- `vite-plugin-pwa` + `@vite-pwa/assets-generator` (Quelle: `public/Icon.png`,
  bei Bedarf per `npm run generate-pwa-assets` neu erzeugen).
- oxlint (nicht eslint) als Linter — vom Vite-Scaffold vorgegeben.

## 4. Bekannte, akzeptierte Lint-Warnungen

`npm run lint` zeigt 6 Warnungen, keine Fehler:
- 3× `only-export-components` in generierten shadcn-Dateien (`ui/button.tsx`,
  `ui/badge.tsx`, `ui/tabs.tsx`) — nicht selbst geschrieben, ignorieren.
- 3× `set-state-in-effect` in `ContractionForm.tsx`, `SettingsDialog.tsx` und
  `useElapsedSeconds.ts` — bewusstes "Formular beim Öffnen zurücksetzen"
  bzw. "Timer sekündlich ticken" Muster, kein Bug.

`npm run build` (tsc -b && vite build) läuft sauber durch.

## 5. Lessons Learned

- **KRITISCH (secure context / `crypto.randomUUID`):** `crypto.randomUUID()`
  existiert nur in "secure contexts" (HTTPS oder `localhost`). Der für
  Smartphone-Tests nötige Zugriff per LAN-IP über einfaches HTTP ist **kein**
  secure context — `crypto.randomUUID` ist dort schlicht `undefined`. Da der
  Aufruf in `useContractions.createContraction` (Erzeugung der optimistischen
  Platzhalter-ID) VOR dem eigentlichen API-Request lag, ist die gesamte
  Funktion dort synchron mit `TypeError: crypto.randomUUID is not a function`
  gescheitert — **bevor überhaupt ein Request rausging**. Symptom: Start/Stop-
  Button und der manuelle "+"-Dialog haben scheinbar gar nichts gemacht,
  ohne sichtbare Fehlermeldung (kein Toast, da der Fehler nie ins catch lief).
  Nur über die Browser-Konsole beim Testen per LAN-IP entdeckt — bei
  `localhost` unauffällig, weil dort automatisch secure context gilt. Fix:
  eigener `randomId()`-Fallback ohne Web-Crypto-Abhängigkeit.
- **Race Condition (Realtime vs. optimistisches Update):** Die
  Realtime-Subscription kann ein `create`-Event per SSE schneller liefern als
  die HTTP-Antwort des eigenen `create()`-Aufrufs zurückkommt. Wurde das
  nicht abgefangen, entstand ein Duplikat: der Platzhalter UND der per
  Realtime bereits eingefügte echte Datensatz blieben beide in der Liste,
  weil die Auflösung des `create()`-Aufrufs den Platzhalter blind durch den
  Datensatz ersetzt hat statt zu prüfen, ob er schon vorhanden ist. Fix in
  `useContractions.ts`: vor dem Ersetzen prüfen, ob die ID bereits in der
  Liste steckt — falls ja, nur den Platzhalter entfernen statt zusätzlich zu
  ersetzen.
- **KRITISCH (PocketBase-Migrationen):** Neue Felder in
  `new Collection({fields: [...]})` müssen als **plain objects mit
  `type: "..."`-String** angegeben werden (`{name: "x", type: "number", ...}`),
  NICHT als `new NumberField({...})`/`new TextField({...})`/etc. — diese
  typisierten Konstruktoren sind fürs Mutieren BESTEHENDER Felder gedacht.
  Bei falscher Verwendung meldet die Migration "Applied" **ohne Fehler**,
  aber die Collection landet nur mit dem System-Feld `id` in der Datenbank
  (eigene Felder + ein Teil der Regeln fehlen lautlos). Passiert, direkt
  lokal gegen ein Scratch-Verzeichnis nachgemessen und korrigiert — siehe
  aktuelle `pocketbase/pb_migrations/*.js` für die korrekte Schreibweise.
  **Bei jeder neuen Migration mit einem Scratch-`pocketbase.exe migrate up`
  verifizieren und die Collection per REST als Superuser gegenchecken.**
- Mehrzeilige PowerShell-Befehle im Terminal-Tool waren unzuverlässig
  (abgeschnittener Output) — zusammengesetzte Befehle als eine Zeile mit `;`
  ausführen.
- shadcn-CLI-Version hier (`shadcn@4.21.0`) nutzt Base UI + Preset "nova" als
  Standard (`npx shadcn@latest init -t vite -b base -p nova -y`), passend zu
  `otherApp`s eigener Wahl.

## 6. Offene Punkte

- Kein automatisiertes Test-Setup (bewusst, kurzlebige Kleinst-App) — Kernlogik
  (`src/lib/rule511.ts`) ist aber als reine, leicht manuell nachvollziehbare
  Funktion gehalten.
- **NAT-Hairpin-Falle beim `/_/`-Heimnetz-Schutz:** Ruft man die öffentliche
  Domain von zuhause auf, sieht nginx als Client-IP die eigene (dynamische)
  öffentliche IP statt der LAN-IP — die `allow`-Regel im NPM-Proxy-Host für
  `wehen-api` muss diese IP zusätzlich enthalten und nach einem IP-Wechsel
  ggf. manuell nachgezogen werden (per `nslookup` prüfen). Alternativ direkt
  über `http://<NAS-LAN-IP>:8092/_/` erreichbar (umgeht NPM/Hairpin).
- Für Updates nach der Ersteinrichtung: `prepare-deploy.ps1` ausführen,
  `deploy/`-Inhalt aufs NAS hochladen (siehe INITIAL_DEPLOYMENT.md
  Abschnitt 10).

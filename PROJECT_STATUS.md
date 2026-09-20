# Projektstatus & Übergabe für die nächste KI-Session

> Lies dieses Dokument zuerst. Die vollständige fachliche/technische Spezifikation
> steht in [PROJECT_BRIEF.md](PROJECT_BRIEF.md), die Deployment-Schritte in
> [INITIAL_DEPLOYMENT.md](INITIAL_DEPLOYMENT.md).

## 1. Aktueller Stand

Die App ist **vollständig implementiert und lokal gebaut/gelinted, aber noch
nicht auf dem NAS deployt**. Nächster Schritt ist die Ersteinrichtung gemäß
[INITIAL_DEPLOYMENT.md](INITIAL_DEPLOYMENT.md).

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
.\pocketbase\pocketbase.exe serve --http=127.0.0.1:8091

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
- `.env` (lokal, gitignored) zeigt bereits auf `http://127.0.0.1:8091`.

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

- Erst-Deployment auf dem ugreen-NAS steht noch aus (siehe
  [INITIAL_DEPLOYMENT.md](INITIAL_DEPLOYMENT.md)).
- Rate-Limiting in PocketBase ist **nicht** per Migration gesetzt (bewusst,
  um keine möglicherweise falsche Settings-API zu raten) — als manueller
  Schritt in INITIAL_DEPLOYMENT.md Abschnitt 7 dokumentiert.
- Kein automatisiertes Test-Setup (bewusst, kurzlebige Kleinst-App) — Kernlogik
  (`src/lib/rule511.ts`) ist aber als reine, leicht manuell nachvollziehbare
  Funktion gehalten.

# PROJECT_BRIEF.md — Wehentimer (Web-App)

> Diese Datei ist die fachliche & technische Spezifikation dieses Projekts —
> analog zu `otherApp/copilot-instructions.md`, von dort wurden die
> Best-Practices übernommen (siehe Abschnitt 8). `PROJECT_STATUS.md` (sobald
> vorhanden) beschreibt den aktuellen Umsetzungsstand und dient als
> Übergabedokument für weitere KI-Sessions.

## 1. Zweck & Rahmenbedingungen

Eine **kurzlebige** Web-App zur Erfassung und Auswertung von Wehen während der
späten Schwangerschaft/Geburt. Zugriff ausschließlich über
`https://wehen.familieaschenbrenner.de`, **kein Login** (die App ist nur für
einen Zeitraum von wenigen Tagen im Einsatz und wird danach wieder
abgeschaltet). Da mehrere Personen (z. B. beide Elternteile auf getrennten
Handys) gleichzeitig mitverfolgen sollen, synchronisiert die App **in
Echtzeit über alle Geräte**, die auf der Domain geöffnet sind — ganz ohne
Konto/Login, jedes Gerät sieht dieselben Daten sofort.

**Bewusster Sicherheits-Trade-off:** Ohne Login ist jeder mit Kenntnis der URL
lese- und schreibberechtigt. Das ist hier akzeptiert, weil (a) die Domain nicht
verlinkt/beworben wird, (b) die App nach wenigen Tagen komplett abgeschaltet
wird und (c) die Daten keinen langfristigen Wert für Dritte haben. Siehe
Abschnitt 6 für die trotzdem umgesetzten Mindest-Absicherungen.

## 2. Tech-Stack & Architektur

Übernommen von `otherApp` (bewährtes Setup), mit Vereinfachungen wo passend
für den kleineren Funktionsumfang dieser App:

- **Frontend:** React 19 + TypeScript, gebootstrappt über Vite 5.
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`).
- **UI-Komponenten:** shadcn/ui (Radix-Primitives), Lucide Icons.
- **Diagramme:** Recharts (KPIs/Charts der Auswertung).
- **PWA:** `vite-plugin-pwa` — Homescreen-Installation, App-Icon, Standalone-
  Fenster (Assets über `@vite-pwa/assets-generator` aus einer SVG-Quelle
  erzeugt).
- **Backend & Datenbank:** PocketBase (Self-Hosted im Docker, SQLite),
  komplett ohne Auth-Collection — alle Collection-Regeln sind bewusst
  öffentlich (`""`), siehe Abschnitt 5.
- **API Communication:** PocketBase JS Client SDK (`pocketbase`).
- **Realtime Sync:** PocketBase Realtime Subscriptions (SSE) für
  `contractions` und `settings` — jedes geöffnete Gerät bekommt Änderungen
  anderer Geräte sofort angezeigt.
- **Kein React-Router:** Die App ist eine einzige Seite mit zwei Tabs
  (shadcn `Tabs`-Komponente), kein Deep-Linking/Routing nötig — bewusste
  Abweichung von `otherApp`, weil hier keine Mehrseiten-Navigation existiert.
- **Kein Nutzer-/Törn-Datenmodell, keine Auth-Collection** — bewusste
  Vereinfachung gegenüber `otherApp`, weil es hier keine Nutzerkonten gibt.

Projektstruktur (Repo-Root = Vite-App-Root, analog `otherApp`):

```
/                       Vite-App (package.json, src/, index.html, ...)
  src/
    components/         UI-Komponenten (inkl. shadcn/ui in components/ui/)
    hooks/              useContractions, useSettings, useElapsedTimer
    lib/                pocketbase.ts, format.ts, rule511.ts, utils.ts
    types/              contraction.ts, settings.ts
  pocketbase/
    pb_migrations/      Schema-as-Code (contractions, settings Collections)
    Dockerfile          Baut ein Image mit gepinnter PocketBase-Version
  docker-compose.yml    Services: frontend, pocketbase
  Dockerfile            Frontend Multi-Stage-Build (Vite build -> nginx)
  nginx.conf            Container-interne nginx-Konfiguration (SPA + Header)
  PROJECT_BRIEF.md       Diese Datei
  PROJECT_STATUS.md      Umsetzungsstand & Übergabe (nach Fertigstellung)
  INITIAL_DEPLOYMENT.md  Ausführliche Schritt-für-Schritt Deployment-Anleitung
```

## 3. Kernfunktionalitäten

### Tab 1 — Erfassung

- Großer runder **Start**-Button oben. Klick startet die Echtzeiterfassung:
  ein Timer läuft hochzählend (MM:SS bzw. H:MM:SS), der Button wird zu
  **Stop**. Klick auf Stop speichert die Wehe (Start-/Endzeitpunkt, Dauer)
  in `contractions` und stoppt den Timer.
- **Manuelle Erfassung** über einen Plus-Button (öffnet Dialog): Pflichtfelder
  sind **Startzeitpunkt** und **Dauer bzw. Endzeitpunkt** — je nachdem, welches
  der beiden Felder zuletzt bearbeitet wurde, wird das jeweils andere live
  berechnet (Start + Dauer = Ende, bzw. Ende − Start = Dauer). Optional:
  **Intensität** (Skala 1–5, Slider) und **Notiz** (Freitext). Einträge sind
  nachträglich bearbeit- und löschbar.
- Darunter eine **Liste aller erfassten Wehen** (neueste zuerst) mit Startzeit,
  Dauer, Abstand zur vorherigen Wehe, Intensität (falls gesetzt), Notiz und
  einem Badge, ob der Eintrag live per Timer oder manuell erfasst wurde.
- Alle Änderungen werden per Realtime-Subscription sofort auf allen offenen
  Geräten sichtbar (kein manuelles Neuladen nötig).

### Tab 2 — Auswertung

- **KPI-Kacheln:** aktueller Ampel-Status der 5-1-1-Regel, Zeit seit letzter
  Wehe, Ø-Abstand & Ø-Dauer der letzten Wehen, Anzahl Wehen der letzten Stunde,
  Fortschrittsbalken Richtung "1 Stunde durchgehend im Muster".
  Farbcodierung: hier gelten dieselben Grundsätze wie bei `otherApp`s
  Kategoriefarben — der Ampel-Status hat **fest zugeordnete** Farben
  (grün/gelb/rot), keine rotierenden Chart-Farben.
- **Diagramm 1 (Verlauf):** Liniendiagramm von Abstand & Dauer je Wehe über
  die Zeit, mit Referenzlinien für die aktuell eingestellten 5-1-1-Schwellen —
  macht sichtbar, wie nah der Verlauf an die kritische Zone heranrückt.
- **Diagramm 2 (Zeitleiste):** Balken je Wehe auf einer Zeitachse (Start +
  Breite = Dauer), zeigt die Taktung/Häufung auf einen Blick.
- **Schwellenwerte einstellbar:** Über einen Einstellungen-Dialog lassen sich
  die drei 5-1-1-Parameter (Minuten-Abstand, Mindestdauer, Dauer des
  Musters) anpassen — z. B. für die 4-1-1-Variante bei Mehrgebärenden. Die
  Einstellung liegt in der `settings`-Collection und gilt **geräteübergreifend**
  (Realtime-Sync), damit alle dieselbe Bewertung sehen.

## 4. Die 5-1-1-Regel — Logik

Klassische Faustregel der Geburtshilfe: Ab die Klinik fahren, wenn Wehen
**alle 5 Minuten** (Start zu Start), **je 1 Minute** anhaltend, **über
mindestens 1 Stunde durchgehend** auftreten. Alle drei Zahlen sind in dieser
App über `settings` einstellbar (Standardwerte 5 / 1 / 60 Minuten).

Reine Berechnungsfunktion `evaluate511()` in `src/lib/rule511.ts`:

1. Wehen chronologisch sortieren, von der jüngsten rückwärts eine **Streak**
   aufbauen: Eine Wehe zählt zur Streak, wenn ihre eigene Dauer ≥
   Mindestdauer **und** der Abstand zur nachfolgenden Wehe ≤ Minuten-Abstand
   ist. Die Streak bricht beim ersten Nichterfüllen ab.
2. Ist die letzte Wehe bereits länger her als der eingestellte
   Minuten-Abstand, gilt das Muster als **aktuell unterbrochen** (Streak wird
   für die Statusanzeige auf 0 zurückgesetzt) — die Bewertung bezieht sich
   immer auf ein **gerade laufendes** Muster, nicht auf einen historischen,
   inzwischen abgerissenen Verlauf.
3. Statusstufen: `idle` (keine/zu wenig Daten oder Muster gerade unterbrochen),
   `observing` (weniger als 2 aufeinanderfolgende qualifizierende Wehen),
   `approaching` (Streak läuft, aber noch nicht lange genug durchgehalten),
   `critical` (Streak-Dauer ≥ eingestellte Musterdauer → **ins Krankenhaus
   fahren**).
4. Fortschritt = Streak-Dauer / eingestellte Musterdauer (für die
   Fortschrittsanzeige, auf 0–1 begrenzt).

Diese Funktion ist reine, testbare Logik ohne Seiteneffekte — nimmt
Wehenliste + Schwellenwerte + `now` entgegen, gibt ein Status-Objekt zurück.
Die Auswertungs-Seite ruft sie mit einem Live-Ticker (alle ~30s) erneut auf,
damit der Status auch **ohne neue Eingabe** aktuell bleibt (Zeit vergeht ja
weiter).

## 5. Datenmodell (PocketBase Collections)

1. **`contractions`**
   - `start` (Date, required) — Startzeitpunkt der Wehe
   - `end` (Date, required) — Endzeitpunkt der Wehe
   - `duration_sec` (Number, required) — Dauer in Sekunden (redundant zu
     `end - start` gespeichert, für einfaches Sortieren/Charting ohne
     Neuberechnung)
   - `intensity` (Number, optional, 1–5) — subjektive Stärke
   - `note` (Text, optional, max. 500 Zeichen)
   - `is_manual` (Bool, default `false`) — `true` = über den Plus-Dialog
     nachgetragen, `false` = live per Start/Stop-Timer erfasst
   - `created`/`updated` (Autodate)
   - Regeln: `listRule`/`viewRule`/`createRule`/`updateRule`/`deleteRule`
     alle `""` (öffentlich, kein Login) — siehe Abschnitt 6.

2. **`settings`** — genau **ein** Datensatz (Singleton), hält die
   geräteübergreifend geltenden 5-1-1-Schwellenwerte:
   - `interval_minutes` (Number, required, default `5`)
   - `duration_minutes` (Number, required, default `1`)
   - `sustained_minutes` (Number, required, default `60`)
   - `updated` (Autodate)
   - Regeln: `listRule`/`viewRule`/`updateRule` = `""` (öffentlich lesbar &
     änderbar), `createRule`/`deleteRule` = `null` (nur Superuser) — der
     Datensatz wird einmalig per Migration angelegt, das Frontend darf ihn nur
     aktualisieren, nicht neu erstellen oder löschen (verhindert versehentlich
     mehrere Settings-Zeilen).

## 6. Sicherheit & Absicherung (trotz "kein Login")

- PocketBase-Rate-Limiting aktivieren (analog `otherApp`), um Missbrauch der
  offenen Schreibrechte zumindest zu bremsen.
- PocketBase-Adminpanel (`/_/`) **nicht** öffentlich über die Domain
  freigeben — im nginx Proxy Manager per Access-List/IP-Beschränkung
  absichern (analog `otherApp`s "Heimnetz-Sperre für `/_/`"), siehe
  `INITIAL_DEPLOYMENT.md`.
- Docker-Image-Tag für PocketBase **pinnen** (keine `:latest`), siehe
  `otherApp`-Lektion dazu.
- CORS: Default-Wildcard-CORS von PocketBase genügt (keine Cookies, kein
  Auth-Token nötig).
- Kein Tracking, keine personenbezogenen Klardaten außer dem, was aktiv in
  Notizfeldern eingetragen wird — Nutzer entsprechend zurückhaltend im
  Notizfeld informieren (kein Login = keine Zugriffskontrolle).

## 7. Deployment-Überblick

Docker-Compose-Stack mit zwei Services (`wehentimer-frontend`,
`wehentimer-pocketbase` — bewusst eindeutig benannt, um auf demselben NAS
nicht mit `otherApp`-Containern zu kollidieren) auf einem ugreen-NAS,
dahinter ein bereits laufender **nginx Proxy Manager**, der SSL terminiert
und zwei Hostnamen auf die Container verteilt (über ein gemeinsames
Docker-Netzwerk, ohne Host-Ports zu publizieren):

- `wehen.familieaschenbrenner.de` → `wehentimer-frontend`-Container (Port 80,
  statisches Vite-Build via nginx ausgeliefert)
- `wehen-api.familieaschenbrenner.de` → `wehentimer-pocketbase`-Container
  (Port 8090)

Die vollständige, ausführliche Schritt-für-Schritt-Anleitung (DNS, NAS,
Docker-Compose hochladen, nginx Proxy Manager Hosts anlegen, SSL, Test) steht
in **[INITIAL_DEPLOYMENT.md](INITIAL_DEPLOYMENT.md)**.

## 8. Übernommene Best-Practices aus `otherApp`

- Schema-as-Code: `pb_migrations/` versioniert, `pb_data/`/Binaries
  gitignored.
- Docker-Image-Tags pinnen statt `:latest`.
- `nginx`: In `location`-Blöcken nur `expires` statt eigenem `add_header`
  verwenden, um vererbte Sicherheits-Kopfzeilen nicht zu verwerfen.
- CSP erst als `Content-Security-Policy-Report-Only` scharf schalten, in
  Chrome/Edge (nicht Firefox — protokolliert Report-Only ohne `report-uri`
  nicht) prüfen, danach erzwingen.
- Realtime-Subscriptions mit `filter`-Option statt ganze Collection zu
  abonnieren; lokalen State per `id` mergen (Duplikate durch eigene
  Optimistic-Updates vermeiden).
- `requestKey: null` bei parallelen/mehrfachen Requests an denselben
  Endpunkt (React StrictMode Doppel-Mount, Promise.all).
- Sichtbare Zahlen/Zeiten über eine zentrale `format.ts` statt verstreutem
  `toFixed()`/`toLocaleString()`.
- Force-SSL/HSTS im nginx Proxy Manager nachmessen (`curl -I`), nicht der
  UI-Anzeige vertrauen.

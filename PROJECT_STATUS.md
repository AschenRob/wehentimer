# Projektstatus & Übergabe für die nächste KI-Session

> Lies dieses Dokument zuerst. Die vollständige fachliche/technische Spezifikation
> steht in [PROJECT_BRIEF.md](PROJECT_BRIEF.md), die Ersteinrichtung in
> [INITIAL_DEPLOYMENT.md](INITIAL_DEPLOYMENT.md), **Updates inkl. Backup in
> [DEPLOYMENT.md](DEPLOYMENT.md)**.

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

Erweiterung 2026-09-27 (noch nicht deployt):
- **Toleranz** für die 5-1-1-Serie (`settings.tolerance_count`,
  geräteübergreifend, Standard 1): bis zu X Ausreißer-Wehen (zu kurz ODER
  Abstand zu groß, Lücke beliebig groß) zählen insgesamt pro Serie als
  „innerhalb“; der X+1-te beendet die Serie. Eine Serie beginnt nie mit einem
  Ausreißer. Migration `1790000020` setzt den bestehenden Datensatz auf 1.
- Wehen-Auswertung: ein gemeinsamer Zeitraum für alle Charts, Y-Achsen-Max
  (Auto/10/15/20/30/60 Min) im Verlaufsdiagramm, Zeitleisten-Balken nach Stärke
  gefärbt (1 grün → 5 rot, ohne Stärke grau), laufendes Muster als blaue
  Linie unter der Zeitleiste.
- **Stilltracker** als zweite Ansicht (Umschalter im Einstellungsdialog):
  Collection `feedings` (Migration `1790000030`), Start/Stop-Timer → nach Stop
  Dialog mit Standardwerten (aufgewacht ja, Zufütterung als Dropdown
  Muttermilch/Ersatzmilch + Menge 100 ml, gespeichert in
  `supplement_mm_ml`/`supplement_em_ml`; Urin/Stuhl nein; Gewicht = letzter
  Eintrag, beim allerersten 3.500 g); gespeichert wird erst beim Bestätigen, Verwerfen
  nur nach Warnung. Liste mit Bearbeiten/Löschen, manuelles Nachtragen.
  Auswertung: KPI-Karte (letzte 24 Std.), Tagesrhythmus (0–24 Uhr je Tag),
  Pro Tag (Mahlzeiten/Angelegt/Zufütterung/Windeln/Aufwachen), Verlauf je
  Mahlzeit, Nach Tageszeit, Gewichtsverlauf — jeweils mit Dropdowns, plus
  gemeinsamer Zeitraum.
- **Pro Gerät im localStorage** (`usePersistentState`, Präfix `wehentimer.`):
  gewählte Ansicht, alle Chart-Zeiträume/-Dropdowns, laufender Wehen- und
  Still-Timer sowie ein gestoppter, noch nicht gespeicherter Still-Eintrag —
  überleben Neuladen/App-Schließen.
- Code-Struktur: `App.tsx` = Kopf + Ansichtswahl, Inhalte in
  `src/views/WehenView.tsx`/`StillView.tsx`; gemeinsamer Realtime-Hook
  `useRealtimeCollection` (von `useContractions`/`useFeedings` genutzt).

Erweiterung 2026-10-02 (noch nicht deployt, neue Migrationen `1790000040`/`50`/`60`):
- **Mehrere Babys:** Collection `babies`, Relation `baby` (required, cascadeDelete)
  an `contractions`/`feedings`; bestehende Daten gehören nach der Migration zu
  „Baby 1“. Aktives Baby pro Gerät (`wehentimer.babyId`), Verwaltung
  (anlegen/umbenennen/löschen/wechseln) nur im Einstellungsdialog; Views werden per
  `key` je Baby neu gemountet, Timer-Keys im localStorage enthalten die Baby-ID.
  5-1-1-Einstellungen bleiben global. `backups/seed-dev.ps1` setzt das erste Baby.
- **Passcode (4-stellig, Standard 1111):** reine UI-Sperre, SHA-256 in
  `settings.passcode_hash` (`src/lib/passcode.ts`, eigene Implementierung wegen
  fehlendem `crypto.subtle` per LAN-HTTP; muss zum Hash in Migration `1790000060`
  passen). Gerät bleibt entsperrt (`wehentimer.unlockedHash`), bis „Jetzt sperren“;
  nach Code-Änderung müssen andere Geräte neu entsperren. API bleibt technisch offen.
- **Stillen:** Brust je Mahlzeit (`breast_first` links/rechts, `breast_second`
  links/rechts/keine; Standard links/keine, leer bei Altdaten; Badge „Letzte Brust“
  in der Liste + KPI-Karte), Zufütterung MM und EM getrennt (Standard 0 ml),
  Abstand überall ab **Ende** der vorherigen Mahlzeit, KPI-Karte bezieht sich auf
  **gestern 00:00–23:59** (ohne MM/EM-Summen), Zeitraum „Ganzer letzter Tag“,
  Listen-Badges ohne Gewicht/Timer/aufgewacht, Urin ocker/Stuhl dunkelbraun.
- **Charts:** Brust in „Pro Tag“ (1. Brust) und Tagesrhythmus (Farbe), grüner
  Zielbereich 8–12 in „Pro Tag“ (Mahlzeiten), „Verlauf je Mahlzeit“ mit Y-Max-Dropdown
  und gestrichelter Soll-Linie (Standard 3 Std, Einstellungen → Stillen, pro Gerät
  `wehentimer.still.targetIntervalHours`, 0 = aus; nur Kennzahl „Abstand“).
  Zeitachsen (Verlauf/Gewicht) nutzen Ticks auf lokalen Mitternächten (`dayTicks`) —
  Ursache des ungleichmäßigen Tagesabstands (30.09./01.10.): Standard-Ticks lagen
  nicht auf Tagesgrenzen, daher doppelte/ungleich verteilte Tageslabels.
- **Dropdowns (`OptionSelect`):** bei geöffnetem Dropdown wechseln Pfeil hoch/runter und
  Scrollrad die Auswahl live, Enter schließt (TV-Fernbedienung).
- **Layout „Desktop / TV“** (Einstellungen, pro Gerät): volle Breite, Charts der
  Still-Auswertung zweispaltig, KPI-Karte gestreckt.

Erweiterung 2026-10-04 (noch nicht deployt, neue Migrationen `1790000080`/`90`):
- **Babys global mit Profil:** `babies` hat `due_date` (ET), `birth_date`, `gender`. Migration
  `1790000080` macht das älteste Baby (nach `created`, nicht nach Name) zu „Stella“ (geb.
  28.09.2026, ET 27.09.2026, w) und löscht alle anderen Babys (dazu existieren keine Einträge).
  Einstellungen: Name, ET, Geschlecht (Geburtsdatum hat bewusst keine UI). Kopfzeile: Burger-Menü
  (Moduswahl, `ModeMenu`) links; unter dem Untertitel steht
  „Nächster Sprung in X Wochen, Y Tage“. Die Sprung-Zeitleiste zeigt Kalenderdaten ab ET. „Krümelchen“-Texte → Babyname (`ourLittle()` in `types/baby.ts`).
- **Stillen:** „Zeit seit der letzten Mahlzeit H:MM“ unter dem Button, Brust-Sticker
  („Brust: Beide, zuletzt Links“), Tagesrhythmus mit Farbmodus Windeln und hellblauer Nachtzeit
  23–5 Uhr, Gewichtsverlauf: obere Y-Zahl nicht mehr abgeschnitten (mehr Top-Margin).
- **Sprünge und Schlaf** (`views/SleepView.tsx`): Prognose (`lib/jumps.ts`, `components/jumps/*`),
  Erfassung (`SleepTimer`/`SleepForm`/`SleepList`, Collection `sleeps`, Migration `1790000090`),
  Statistik (`lib/sleepStats.ts`, `components/sleep/*`). Sprung-Zeiträume (stormStart/stormEnd) sind
  geschätzte Richtwerte aus dem Modell, nicht aus einer abrufbaren Quelle verifiziert — bei Bedarf in
  `lib/jumps.ts` nachjustieren. Migrationen lokal gegen Scratch-PocketBase verifiziert.

Erweiterung 2026-10-13 (noch nicht deployt, keine Migration):
- **Gewichtsverlauf mit WHO-Kurven:** `lib/whoWeight.ts` (WHO Child Growth Standards Gewicht-für-Alter,
  wochenweise aus den LMS-Tabellen berechnet, 0–24 Monate, nach Geschlecht). Im Chart zusätzlich
  Normgewicht (P50, durchgezogen) sowie unterer/oberer Grenzwert (P3/P97, gestrichelt) über den
  sichtbaren Zeitraum. Alter ab `birth_date`, ersatzweise `due_date`; ohne Geschlecht keine Kurven.
- **Y-Skala-Dropdown im Gewichtsverlauf** (pro Gerät `wehentimer.still.weightYScale`): Auto (inkl.
  Normbereich, Standard), „Nur Gewichte“ (Skala wie vor den WHO-Kurven, Kurven werden abgeschnitten)
  oder fester Bereich 2–5/2–8/2–12/0–15 kg (`WEIGHT_Y_SCALE_*` in `lib/chartRange.ts`).

Erweiterung 2026-10-23 (noch nicht deployt, neue Migration `1790000100`):
- **Größe:** `feedings.height_cm` (0 = keine Angabe), Feld im Mahlzeit-Dialog (wie Gewicht mit letztem
  Wert vorbelegt, erstmals 50 cm; `latestHeight()`). **Größenverlauf** (`still/HeightChart.tsx`) analog
  Gewichtsverlauf: Darstellung „Jede Änderung“/„Pro Tag“, Y-Skala-Dropdown (`HEIGHT_Y_SCALE_*`,
  pro Gerät `wehentimer.still.heightYScale`), WHO-Kurven P3/P50/P97 (`lib/whoHeight.ts`, Length-for-age
  0–24 Monate, wöchentlich aus den offiziellen LMS-Tabellen berechnet; Interpolation gemeinsam mit
  Gewicht über `interpolateWhoRows` in `lib/whoWeight.ts`). KPI-Karte zeigt aktuelle Größe.
- **Eintragsart:** `feedings.kind` (meal/measurement; leer = Mahlzeit, `isMeal()` in `types/feeding.ts`).
  Plus-Button (`AddEntryButton`) fragt Mahlzeit vs. Größe/Gewicht; Letzteres öffnet `MeasurementForm`
  (Zeitpunkt, Größe, Gewicht, Notiz; Start = Ende). Liste: Icon links (Milk = Mahlzeit, Ruler =
  Messung), Überschrift „Erfasste Einträge“. **Messungen werden in `StillView` aus allen Mahlzeiten-Charts
  und in `computeFeedingKpis` aus Mahlzeit-Summen/Abständen herausgefiltert**, fließen aber in
  Gewicht/Größe ein; Abstand in der Liste bezieht sich auf die vorherige *Mahlzeit*; „Zeit seit letzter
  Mahlzeit“ ignoriert Messungen. Neue Auswertungen, die Mahlzeiten zählen, müssen `isMeal` filtern.
- UI-Umbenennung: „Urin“ → „Pipi“, „Stuhl“ → „Kaka“ (nur Beschriftungen; Felder `urine`/`stool` und
  CSS-Variablen unverändert). Migration lokal gegen Scratch-PocketBase verifiziert.

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

`npm run lint` zeigt 7 Warnungen, keine Fehler:
- 3× `only-export-components` in generierten shadcn-Dateien (`ui/button.tsx`,
  `ui/badge.tsx`, `ui/tabs.tsx`) — nicht selbst geschrieben, ignorieren.
- 4× `set-state-in-effect` in `ContractionForm.tsx`, `FeedingForm.tsx`,
  `SettingsDialog.tsx` und
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
  Abschnitt 10). Die neuen Migrationen (`1790000020` bis `1790000100`) laufen
  beim Neustart des PocketBase-Containers automatisch (vorher Backup, siehe
  DEPLOYMENT.md; `1790000050` ordnet alle Altdaten „Baby 1“ zu).

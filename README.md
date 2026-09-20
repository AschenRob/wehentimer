# Wehentimer

Kurzlebige Web-App zur Erfassung und Auswertung von Wehen (5-1-1-Regel),
ohne Login. Siehe [PROJECT_BRIEF.md](PROJECT_BRIEF.md) für die vollständige
Spezifikation, [PROJECT_STATUS.md](PROJECT_STATUS.md) für den aktuellen Stand
und [INITIAL_DEPLOYMENT.md](INITIAL_DEPLOYMENT.md) für das Deployment auf dem
NAS.

## Lokal starten

```powershell
# Terminal 1: PocketBase (Binary v0.39.10 separat herunterladen, pocketbase.exe im pocketbase/-Ordner)
.\pocketbase\pocketbase.exe serve --http=127.0.0.1:8091

# Terminal 2: Frontend
npm install
npm run dev
```

Frontend: http://localhost:5174 · PocketBase-Adminpanel: http://127.0.0.1:8091/_/

## Tech-Stack

Vite + React + TypeScript, Tailwind CSS v4, shadcn/ui, PocketBase (Docker,
self-hosted, kein Login), Recharts, vite-plugin-pwa.

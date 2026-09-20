# Frontend-Image: liefert das lokal vorgebaute dist/ (per prepare-deploy.ps1,
# siehe INITIAL_DEPLOYMENT.md) über nginx aus. Kein npm-Build im Container -
# vermeidet Datei-Rechte-Probleme beim Kopieren von NAS-hochgeladenen
# dist/-Dateien (siehe otherApp-Lessons-Learned, 403 Forbidden).
FROM nginx:1.27-alpine
COPY dist/ /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN chmod -R a+rX /usr/share/nginx/html

EXPOSE 80

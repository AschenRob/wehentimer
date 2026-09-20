# Frontend-Image: baut die Vite-App und liefert das Ergebnis über nginx aus.
# Node-Version gepinnt (kein :latest, siehe PROJECT_BRIEF.md Abschnitt 6).
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Wird zur Build-Zeit fest in das JS-Bundle einkompiliert (Vite/statische SPA).
ARG VITE_POCKETBASE_URL
ENV VITE_POCKETBASE_URL=${VITE_POCKETBASE_URL}

RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

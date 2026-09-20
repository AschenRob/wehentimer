# Lädt ein gepinntes PocketBase-Release (kein :latest, siehe PROJECT_BRIEF.md
# Abschnitt 6) und liefert es mit den Migrationen aus diesem Repo aus.
FROM alpine:3.20 AS fetch

ARG PB_VERSION=0.39.10
ARG TARGETARCH

RUN apk add --no-cache unzip ca-certificates curl \
  && ARCH=$(if [ "$TARGETARCH" = "arm64" ]; then echo "arm64"; else echo "amd64"; fi) \
  && curl -fL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${ARCH}.zip" -o /tmp/pb.zip \
  && unzip /tmp/pb.zip -d /pb \
  && rm /tmp/pb.zip

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=fetch /pb/pocketbase /pb/pocketbase
COPY pb_migrations /pb/pb_migrations

EXPOSE 8090
VOLUME ["/pb/pb_data"]

ENTRYPOINT ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]

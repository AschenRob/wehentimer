/// <reference path="../pb_data/types.d.ts" />

// Collection "contractions": eine erfasste Wehe. Bewusst öffentliche Regeln
// (kein Login in dieser App, siehe PROJECT_BRIEF.md Abschnitt 6).
migrate((app) => {
  const collection = new Collection({
    type: "base",
    name: "contractions",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { name: "start", type: "date", required: true },
      { name: "end", type: "date", required: true },
      { name: "duration_sec", type: "number", required: true, min: 0 },
      { name: "intensity", type: "number", min: 1, max: 5 },
      { name: "note", type: "text", max: 500 },
      { name: "is_manual", type: "bool" },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE INDEX idx_contractions_start ON contractions (start)"],
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("contractions");
  return app.delete(collection);
});

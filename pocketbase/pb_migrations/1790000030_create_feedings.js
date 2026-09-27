/// <reference path="../pb_data/types.d.ts" />

// Collection "feedings": eine Mahlzeit im Stilltracker (Spalten analog zum
// Still-Protokoll der Hebamme). Bewusst öffentliche Regeln wie "contractions".
migrate((app) => {
  const collection = new Collection({
    type: "base",
    name: "feedings",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { name: "start", type: "date", required: true },
      { name: "end", type: "date", required: true },
      { name: "latch_minutes", type: "number", min: 0 },
      { name: "woke_self", type: "bool" },
      { name: "supplement_mm_ml", type: "number", min: 0 },
      { name: "supplement_em_ml", type: "number", min: 0 },
      { name: "urine", type: "bool" },
      { name: "stool", type: "bool" },
      { name: "weight_g", type: "number", min: 0 },
      { name: "note", type: "text", max: 500 },
      { name: "is_manual", type: "bool" },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE INDEX idx_feedings_start ON feedings (start)"],
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("feedings");
  return app.delete(collection);
});

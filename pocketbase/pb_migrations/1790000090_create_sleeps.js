/// <reference path="../pb_data/types.d.ts" />

// Collection "sleeps": Schlaferfassung inkl. Schlafzyklus-Messung (Entspannung,
// Tiefschlaf per Armtest, REM-Beginn). Öffentliche Regeln wie die übrigen Collections.
// Minuten-Felder: 0 = keine Angabe.
migrate((app) => {
  const babies = app.findCollectionByNameOrId("babies");
  const collection = new Collection({
    type: "base",
    name: "sleeps",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { name: "baby", type: "relation", required: true, collectionId: babies.id, maxSelect: 1, cascadeDelete: true },
      { name: "start", type: "date", required: true },
      { name: "end", type: "date", required: true },
      { name: "relax_minutes", type: "number", min: 0 },
      { name: "deep_minutes", type: "number", min: 0 },
      { name: "rem_minutes", type: "number", min: 0 },
      { name: "after_rem", type: "select", maxSelect: 1, values: ["woke", "next_cycle"] },
      { name: "method", type: "select", maxSelect: 1, values: ["nursing", "carried", "bed", "stroller", "car", "other"] },
      { name: "note", type: "text", max: 500 },
      { name: "is_manual", type: "bool" },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: [
      "CREATE INDEX idx_sleeps_start ON sleeps (start)",
      "CREATE INDEX idx_sleeps_baby ON sleeps (baby)",
    ],
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("sleeps");
  return app.delete(collection);
});

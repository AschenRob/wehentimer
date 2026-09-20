/// <reference path="../pb_data/types.d.ts" />

// Collection "settings": genau EIN Datensatz mit den geräteübergreifend
// geltenden 5-1-1-Schwellenwerten. createRule/deleteRule bewusst nur für
// Superuser (null) - das Frontend darf den Singleton nur aktualisieren,
// nie neu anlegen oder löschen.
migrate((app) => {
  const collection = new Collection({
    type: "base",
    name: "settings",
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: "",
    deleteRule: null,
    fields: [
      { name: "interval_minutes", type: "number", required: true, min: 1 },
      { name: "duration_minutes", type: "number", required: true, min: 0.1 },
      { name: "sustained_minutes", type: "number", required: true, min: 1 },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
  });

  app.save(collection);

  const record = new Record(collection, {
    interval_minutes: 5,
    duration_minutes: 1,
    sustained_minutes: 60,
  });
  return app.save(record);
}, (app) => {
  const collection = app.findCollectionByNameOrId("settings");
  return app.delete(collection);
});

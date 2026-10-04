/// <reference path="../pb_data/types.d.ts" />

// Brust je Mahlzeit: 1. Brust (links/rechts), 2. Brust (links/rechts/keine).
// Leer = nicht erfasst (Einträge vor dieser Migration).
migrate((app) => {
  const collection = app.findCollectionByNameOrId("feedings");
  collection.fields.add(
    new SelectField({ name: "breast_first", values: ["left", "right"], maxSelect: 1 }),
  );
  collection.fields.add(
    new SelectField({ name: "breast_second", values: ["left", "right", "none"], maxSelect: 1 }),
  );
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("feedings");
  collection.fields.removeByName("breast_first");
  collection.fields.removeByName("breast_second");
  return app.save(collection);
});

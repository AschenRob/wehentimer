/// <reference path="../pb_data/types.d.ts" />

// Toleranz für die 5-1-1-Serie: so viele Ausreißer-Wehen dürfen in einer
// Serie liegen, ohne sie abzubrechen. Standardwert 1.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("settings");
  collection.fields.add(new NumberField({ name: "tolerance_count", min: 0, onlyInt: true }));
  app.save(collection);

  for (const record of app.findAllRecords("settings")) {
    record.set("tolerance_count", 1);
    app.save(record);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("settings");
  collection.fields.removeByName("tolerance_count");
  return app.save(collection);
});

/// <reference path="../pb_data/types.d.ts" />

// Größe (cm, 0 = keine Angabe) und Eintragsart: leer/meal = Mahlzeit, measurement = nur Größe/Gewicht.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("feedings");
  collection.fields.add(new NumberField({ name: "height_cm", min: 0 }));
  collection.fields.add(
    new SelectField({ name: "kind", values: ["meal", "measurement"], maxSelect: 1 }),
  );
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("feedings");
  collection.fields.removeByName("height_cm");
  collection.fields.removeByName("kind");
  return app.save(collection);
});

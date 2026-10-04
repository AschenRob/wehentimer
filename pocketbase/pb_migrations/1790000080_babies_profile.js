/// <reference path="../pb_data/types.d.ts" />

// Babys global mit Profil: errechneter Termin (ET), Geburtsdatum, Geschlecht.
// Das älteste Baby wird zu "Stella"; alle anderen Babys werden gelöscht
// (dazu existieren keine Einträge, cascadeDelete räumt sonst mit auf).
migrate((app) => {
  const collection = app.findCollectionByNameOrId("babies");
  collection.fields.add(new DateField({ name: "birth_date" }));
  collection.fields.add(new DateField({ name: "due_date" }));
  collection.fields.add(new SelectField({ name: "gender", maxSelect: 1, values: ["female", "male"] }));
  app.save(collection);

  const babies = app.findRecordsByFilter("babies", "", "created", 0, 0);
  if (babies.length === 0) return;

  const first = babies[0];
  first.set("name", "Stella");
  first.set("birth_date", "2026-09-28 00:00:00.000Z");
  first.set("due_date", "2026-09-27 00:00:00.000Z");
  first.set("gender", "female");
  app.save(first);

  for (const other of babies.slice(1)) {
    app.delete(other);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("babies");
  collection.fields.removeByName("birth_date");
  collection.fields.removeByName("due_date");
  collection.fields.removeByName("gender");
  app.save(collection);
});

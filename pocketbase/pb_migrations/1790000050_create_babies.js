/// <reference path="../pb_data/types.d.ts" />

// Collection "babies" + Relation `baby` an contractions/feedings. Bestehende
// Einträge werden dem ersten Baby ("Baby 1") zugeordnet. Beim Löschen eines
// Babys werden dessen Einträge per cascadeDelete mitgelöscht.
migrate((app) => {
  const babies = new Collection({
    type: "base",
    name: "babies",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: "",
    deleteRule: "",
    fields: [
      { name: "name", type: "text", required: true, max: 60 },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
  });
  app.save(babies);

  const first = new Record(babies, { name: "Baby 1" });
  app.save(first);

  for (const name of ["contractions", "feedings"]) {
    const collection = app.findCollectionByNameOrId(name);
    collection.fields.add(
      new RelationField({ name: "baby", collectionId: babies.id, maxSelect: 1, cascadeDelete: true }),
    );
    app.save(collection);

    for (const record of app.findAllRecords(name)) {
      record.set("baby", first.id);
      app.save(record);
    }

    const saved = app.findCollectionByNameOrId(name);
    saved.fields.getByName("baby").required = true;
    saved.indexes = saved.indexes.concat([`CREATE INDEX idx_${name}_baby ON ${name} (baby)`]);
    app.save(saved);
  }
}, (app) => {
  for (const name of ["contractions", "feedings"]) {
    const collection = app.findCollectionByNameOrId(name);
    collection.indexes = collection.indexes.filter((sql) => !sql.includes(`idx_${name}_baby`));
    collection.fields.removeByName("baby");
    app.save(collection);
  }
  app.delete(app.findCollectionByNameOrId("babies"));
});

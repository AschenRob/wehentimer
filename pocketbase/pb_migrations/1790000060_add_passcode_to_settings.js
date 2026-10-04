/// <reference path="../pb_data/types.d.ts" />

// App-Passcode (nur UI-Sperre): SHA-256-Hex von "wehentimer:<Code>", Standard 1111.
// Muss zu `hashPasscode()` in src/lib/passcode.ts passen.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("settings");
  collection.fields.add(new TextField({ name: "passcode_hash", max: 128 }));
  app.save(collection);

  for (const record of app.findAllRecords("settings")) {
    record.set("passcode_hash", $security.sha256("wehentimer:1111"));
    app.save(record);
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("settings");
  collection.fields.removeByName("passcode_hash");
  return app.save(collection);
});

/// <reference path="../pb_data/types.d.ts" />

// 1. Brust darf ebenfalls "keine" sein.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("feedings");
  collection.fields.getByName("breast_first").values = ["left", "right", "none"];
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("feedings");
  collection.fields.getByName("breast_first").values = ["left", "right"];
  return app.save(collection);
});

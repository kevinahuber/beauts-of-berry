var fs = require("fs");
var path = require("path");

var photosDir = path.join(__dirname, "..", "photos");
var outPath = path.join(__dirname, "..", "photos.json");

var files = fs.readdirSync(photosDir).filter(function (f) {
  return f.endsWith(".json");
});

var photos = files.map(function (f) {
  return JSON.parse(fs.readFileSync(path.join(photosDir, f), "utf8"));
});

photos.sort(function (a, b) {
  return new Date(b.date) - new Date(a.date);
});

fs.writeFileSync(outPath, JSON.stringify(photos, null, 2));
console.log("Built photos.json with " + photos.length + " photos");

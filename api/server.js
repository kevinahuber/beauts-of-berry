import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { randomBytes } from "crypto";
import { parseUpload, validate } from "./upload.js";
import { processImage } from "./image.js";
import { createPhotoPR } from "./github.js";

var allowedOrigin = process.env.ALLOWED_ORIGIN || "https://berry.kevcreates.art";

var app = express();

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["POST"],
  })
);

app.set("trust proxy", 1);

var uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many uploads. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: function () {
    return process.env.NODE_ENV === "test";
  },
  keyGenerator: function (req) {
    return req.ip;
  },
});

app.get("/health", function (_req, res) {
  res.json({ status: "ok" });
});

app.post("/upload", uploadLimiter, async function (req, res) {
  try {
    await parseUpload(req, res);
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }

  var error = validate(req);
  if (error) {
    return res.status(400).json({ success: false, message: error });
  }

  var name = req.body.name.trim();
  var caption = req.body.caption.trim();

  try {
    var processed = await processImage(req.file.buffer);
    var id = randomBytes(2).toString("hex");
    var today = new Date().toISOString().slice(0, 10);
    var filename = "berry-" + today + "-" + id + processed.ext;

    await createPhotoPR({
      imageBuffer: processed.buffer,
      filename: filename,
      name: name,
      caption: caption,
      date: today,
    });

    res.json({
      success: true,
      message: "Thanks! Your photo of Berry will appear after review.",
    });
  } catch (err) {
    console.error("Upload failed:", err);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

var port = process.env.PORT || 3100;

function start() {
  app.listen(port, function () {
    console.log("Beauts of Berry API listening on port " + port);
  });
}

// Only start the server if this file is run directly (not imported by tests)
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  start();
}

export { app, uploadLimiter };

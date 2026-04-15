import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { parseUpload, validate } from "./upload.js";

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

  // Image processing and GitHub PR creation will be wired in Task 10
  res.json({
    success: true,
    message: "Thanks! Your photo of Berry will appear after review.",
  });
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

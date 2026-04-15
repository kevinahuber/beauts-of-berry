import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

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
  keyGenerator: function (req) {
    return req.ip;
  },
});

app.get("/health", function (_req, res) {
  res.json({ status: "ok" });
});

// Upload route will be added in a later task

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

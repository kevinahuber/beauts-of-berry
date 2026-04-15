import multer from "multer";

var ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
var MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760", 10);

var storage = multer.memoryStorage();

var upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: function (_req, file, cb) {
    if (ALLOWED_TYPES.indexOf(file.mimetype) === -1) {
      return cb(new Error("Please upload a JPEG, PNG, or WebP image."));
    }
    cb(null, true);
  },
}).single("image");

function parseUpload(req, res) {
  return new Promise(function (resolve, reject) {
    upload(req, res, function (err) {
      if (err) {
        if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
          return reject({ status: 400, message: "Image must be under 10MB." });
        }
        return reject({ status: 400, message: err.message });
      }
      resolve();
    });
  });
}

function validate(req) {
  if (!req.file) {
    return "Please include an image.";
  }

  var name = (req.body.name || "").trim();
  var caption = (req.body.caption || "").trim();

  if (!name) {
    return "Please enter your name.";
  }
  if (name.length > 100) {
    return "Name must be 100 characters or fewer.";
  }
  if (!caption) {
    return "Please enter a caption.";
  }
  if (caption.length > 280) {
    return "Caption must be 280 characters or fewer.";
  }

  return null;
}

export { parseUpload, validate };

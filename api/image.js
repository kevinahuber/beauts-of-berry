import sharp from "sharp";

var MAX_WIDTH = 2000;

async function processImage(inputBuffer) {
  var meta = await sharp(inputBuffer).metadata();
  var pipeline = sharp(inputBuffer);

  if (meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize(MAX_WIDTH);
  }

  var buffer = await pipeline
    .rotate() // auto-rotate based on EXIF
    .jpeg({ quality: 85 })
    .toBuffer();

  return { buffer: buffer, ext: ".jpg" };
}

export { processImage };

import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { processImage } from "../image.js";

async function makeTestImage(width, height, format) {
  return sharp({
    create: {
      width: width,
      height: height,
      channels: 3,
      background: { r: 200, g: 150, b: 255 },
    },
  })
    .toFormat(format || "jpeg")
    .toBuffer();
}

describe("processImage", () => {
  it("returns a buffer", async () => {
    var input = await makeTestImage(100, 100);
    var result = await processImage(input);
    expect(Buffer.isBuffer(result.buffer)).toBe(true);
  });

  it("preserves images smaller than 2000px wide", async () => {
    var input = await makeTestImage(800, 600);
    var result = await processImage(input);
    var meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBe(800);
    expect(meta.height).toBe(600);
  });

  it("resizes images wider than 2000px", async () => {
    var input = await makeTestImage(4000, 3000);
    var result = await processImage(input);
    var meta = await sharp(result.buffer).metadata();
    expect(meta.width).toBe(2000);
    expect(meta.height).toBe(1500);
  });

  it("outputs JPEG", async () => {
    var input = await makeTestImage(100, 100, "png");
    var result = await processImage(input);
    var meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe("jpeg");
  });

  it("returns .jpg extension", async () => {
    var input = await makeTestImage(100, 100);
    var result = await processImage(input);
    expect(result.ext).toBe(".jpg");
  });
});

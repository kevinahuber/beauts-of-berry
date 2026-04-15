import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFileSync, mkdirSync, rmSync } from "fs";

var __dirname = dirname(fileURLToPath(import.meta.url));
var fixturesDir = join(__dirname, "fixtures");

function createTestImage(name, sizeBytes) {
  mkdirSync(fixturesDir, { recursive: true });
  var path = join(fixturesDir, name);
  var jpegHeader = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ]);
  if (sizeBytes && sizeBytes > jpegHeader.length) {
    var padding = Buffer.alloc(sizeBytes - jpegHeader.length);
    writeFileSync(path, Buffer.concat([jpegHeader.slice(0, -2), padding, jpegHeader.slice(-2)]));
  } else {
    writeFileSync(path, jpegHeader);
  }
  return path;
}

function cleanup() {
  try {
    rmSync(fixturesDir, { recursive: true });
  } catch (_e) {
    // ignore
  }
}

describe("POST /upload", () => {
  it("rejects request with no image", async () => {
    var res = await request(app)
      .post("/upload")
      .field("name", "Test")
      .field("caption", "A caption");
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/image/i);
  });

  it("rejects non-image file", async () => {
    mkdirSync(fixturesDir, { recursive: true });
    var txtPath = join(fixturesDir, "test.txt");
    writeFileSync(txtPath, "not an image");
    var res = await request(app)
      .post("/upload")
      .attach("image", txtPath)
      .field("name", "Test")
      .field("caption", "A caption");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/JPEG|PNG|WebP/i);
    cleanup();
  });

  it("rejects request with no name", async () => {
    var testImagePath = createTestImage("test.jpg");
    var res = await request(app)
      .post("/upload")
      .attach("image", testImagePath)
      .field("name", "")
      .field("caption", "A caption");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name/i);
    cleanup();
  });

  it("rejects request with no caption", async () => {
    var testImagePath = createTestImage("test.jpg");
    var res = await request(app)
      .post("/upload")
      .attach("image", testImagePath)
      .field("name", "Test")
      .field("caption", "");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/caption/i);
    cleanup();
  });

  it("rejects name over 100 characters", async () => {
    var testImagePath = createTestImage("test.jpg");
    var res = await request(app)
      .post("/upload")
      .attach("image", testImagePath)
      .field("name", "a".repeat(101))
      .field("caption", "A caption");
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/name/i);
    cleanup();
  });

  it("rejects caption over 280 characters", async () => {
    var testImagePath = createTestImage("test.jpg");
    var res = await request(app)
      .post("/upload")
      .attach("image", testImagePath)
      .field("name", "Test")
      .field("caption", "a".repeat(281));
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/caption/i);
    cleanup();
  });
});

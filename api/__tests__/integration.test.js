import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../server.js";
import sharp from "sharp";

// Mock the github module so we don't hit the real API
vi.mock("../github.js", () => ({
  createPhotoPR: vi.fn().mockResolvedValue({
    number: 1,
    html_url: "https://github.com/test/test/pull/1",
  }),
}));

import { createPhotoPR } from "../github.js";

async function makeValidJpeg() {
  return sharp({
    create: { width: 100, height: 100, channels: 3, background: { r: 200, g: 150, b: 255 } },
  })
    .jpeg()
    .toBuffer();
}

describe("GET /health", () => {
  it("returns 200 with ok status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("POST /upload - full flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_TOKEN = "test-token";
    process.env.GITHUB_REPO = "testuser/testrepo";
  });

  it("accepts valid upload and returns success", async () => {
    var jpegBuffer = await makeValidJpeg();
    var res = await request(app)
      .post("/upload")
      .attach("image", jpegBuffer, "photo.jpg")
      .field("name", "Test User")
      .field("caption", "Berry is cute");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/review/i);
    expect(createPhotoPR).toHaveBeenCalledTimes(1);

    var callArg = createPhotoPR.mock.calls[0][0];
    expect(callArg.name).toBe("Test User");
    expect(callArg.caption).toBe("Berry is cute");
    expect(callArg.filename).toMatch(/^berry-\d{4}-\d{2}-\d{2}-[a-f0-9]{4}\.jpg$/);
    expect(Buffer.isBuffer(callArg.imageBuffer)).toBe(true);
  });

  it("returns 500 if GitHub PR creation fails", async () => {
    createPhotoPR.mockRejectedValueOnce(new Error("GitHub API error"));
    var jpegBuffer = await makeValidJpeg();
    var res = await request(app)
      .post("/upload")
      .attach("image", jpegBuffer, "photo.jpg")
      .field("name", "Test User")
      .field("caption", "Berry is cute");

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/something went wrong/i);
  });
});

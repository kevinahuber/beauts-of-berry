import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPhotoPR } from "../github.js";

var mockOctokit = {
  git: {
    getRef: vi.fn(),
    createRef: vi.fn(),
  },
  repos: {
    createOrUpdateFileContents: vi.fn(),
  },
  pulls: {
    create: vi.fn(),
  },
};

vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn(() => mockOctokit),
}));

describe("createPhotoPR", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GITHUB_TOKEN = "test-token";
    process.env.GITHUB_REPO = "testuser/testrepo";

    mockOctokit.git.getRef.mockResolvedValue({
      data: { object: { sha: "abc123" } },
    });
    mockOctokit.git.createRef.mockResolvedValue({ data: {} });
    mockOctokit.repos.createOrUpdateFileContents.mockResolvedValue({ data: {} });
    mockOctokit.pulls.create.mockResolvedValue({
      data: { number: 42, html_url: "https://github.com/testuser/testrepo/pull/42" },
    });
  });

  var input = {
    imageBuffer: Buffer.from("fake-image-data"),
    filename: "berry-2026-04-15-a3f2.jpg",
    name: "Sarah",
    caption: "Berry doing a blep",
    date: "2026-04-15",
  };

  it("gets the main branch SHA", async () => {
    await createPhotoPR(input);
    expect(mockOctokit.git.getRef).toHaveBeenCalledWith({
      owner: "testuser",
      repo: "testrepo",
      ref: "heads/main",
    });
  });

  it("creates a branch named upload/<filename-stem>", async () => {
    await createPhotoPR(input);
    expect(mockOctokit.git.createRef).toHaveBeenCalledWith({
      owner: "testuser",
      repo: "testrepo",
      ref: "refs/heads/upload/berry-2026-04-15-a3f2",
      sha: "abc123",
    });
  });

  it("commits the image to images/", async () => {
    await createPhotoPR(input);
    var calls = mockOctokit.repos.createOrUpdateFileContents.mock.calls;
    var imageCall = calls.find(function (c) {
      return c[0].path.startsWith("images/");
    });
    expect(imageCall).toBeTruthy();
    expect(imageCall[0].path).toBe("images/berry-2026-04-15-a3f2.jpg");
    expect(imageCall[0].content).toBe(Buffer.from("fake-image-data").toString("base64"));
  });

  it("commits the metadata JSON to photos/", async () => {
    await createPhotoPR(input);
    var calls = mockOctokit.repos.createOrUpdateFileContents.mock.calls;
    var metaCall = calls.find(function (c) {
      return c[0].path.startsWith("photos/");
    });
    expect(metaCall).toBeTruthy();
    expect(metaCall[0].path).toBe("photos/berry-2026-04-15-a3f2.json");
    var content = JSON.parse(Buffer.from(metaCall[0].content, "base64").toString());
    expect(content).toEqual({
      filename: "berry-2026-04-15-a3f2.jpg",
      name: "Sarah",
      caption: "Berry doing a blep",
      date: "2026-04-15",
    });
  });

  it("creates a PR with correct title and body", async () => {
    await createPhotoPR(input);
    expect(mockOctokit.pulls.create).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "testuser",
        repo: "testrepo",
        title: "Photo from Sarah: Berry doing a blep",
        head: "upload/berry-2026-04-15-a3f2",
        base: "main",
      })
    );
  });

  it("returns the PR data", async () => {
    var result = await createPhotoPR(input);
    expect(result.number).toBe(42);
    expect(result.html_url).toBe("https://github.com/testuser/testrepo/pull/42");
  });
});

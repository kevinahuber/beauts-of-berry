import { Octokit } from "@octokit/rest";

async function createPhotoPR({ imageBuffer, filename, name, caption, date }) {
  var octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  var parts = process.env.GITHUB_REPO.split("/");
  var owner = parts[0];
  var repo = parts[1];
  var stem = filename.replace(/\.[^.]+$/, "");
  var branch = "upload/" + stem;

  // 1. Get main branch SHA
  var refData = await octokit.git.getRef({ owner: owner, repo: repo, ref: "heads/main" });
  var mainSha = refData.data.object.sha;

  // 2. Create branch
  await octokit.git.createRef({
    owner: owner,
    repo: repo,
    ref: "refs/heads/" + branch,
    sha: mainSha,
  });

  // 3. Commit image
  await octokit.repos.createOrUpdateFileContents({
    owner: owner,
    repo: repo,
    branch: branch,
    path: "images/" + filename,
    message: "Add photo: " + filename,
    content: imageBuffer.toString("base64"),
  });

  // 4. Commit metadata
  var metadata = JSON.stringify(
    { filename: filename, name: name, caption: caption, date: date },
    null,
    2
  );
  await octokit.repos.createOrUpdateFileContents({
    owner: owner,
    repo: repo,
    branch: branch,
    path: "photos/" + stem + ".json",
    message: "Add metadata for " + filename,
    content: Buffer.from(metadata).toString("base64"),
  });

  // 5. Create PR
  var pr = await octokit.pulls.create({
    owner: owner,
    repo: repo,
    title: "Photo from " + name + ": " + caption,
    body:
      "**Contributor:** " + name + "\n" +
      "**Caption:** " + caption + "\n\n" +
      "![" + caption + "](https://raw.githubusercontent.com/" +
      owner + "/" + repo + "/" + branch + "/images/" + filename + ")",
    head: branch,
    base: "main",
  });

  return pr.data;
}

export { createPhotoPR };

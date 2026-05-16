const { Octokit } = require("@octokit/rest");

function getOctokit() {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

async function postPRComment(owner, repo, prNumber, body) {
  const octokit = getOctokit();
  const response = await octokit.issues.createComment({
    owner, repo, issue_number: prNumber, body,
  });
  console.log(`Comment posted on PR #${prNumber}`);
  return response.data;
}

async function getPRDiff(owner, repo, prNumber) {
  const octokit = getOctokit();
  const response = await octokit.pulls.get({
    owner, repo, pull_number: prNumber,
    mediaType: { format: "diff" },
  });
  return response.data;
}

async function getPRFiles(owner, repo, prNumber) {
  const octokit = getOctokit();
  const response = await octokit.pulls.listFiles({
    owner, repo, pull_number: prNumber,
  });
  return response.data;
}

async function getFileContent(owner, repo, path, branch) {
  const octokit = getOctokit();
  try {
    const response = await octokit.repos.getContent({
      owner, repo, path, ref: branch,
    });
    if (response.data.encoding === "base64") {
      return Buffer.from(response.data.content, "base64").toString("utf8");
    }
    return null;
  } catch (e) {
    return null;
  }
}

module.exports = { postPRComment, getPRDiff, getPRFiles, getFileContent };
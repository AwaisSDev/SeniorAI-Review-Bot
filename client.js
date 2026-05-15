const { Octokit } = require("@octokit/rest");

function getOctokit() {
  return new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });
}

// Post a comment on a PR
async function postPRComment(owner, repo, prNumber, body) {
  const octokit = getOctokit();

  const response = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body,
  });

  console.log(`✅ Comment posted on PR #${prNumber}`);
  return response.data;
}

// Fetch the diff of a PR
async function getPRDiff(owner, repo, prNumber) {
  const octokit = getOctokit();

  const response = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: { format: "diff" },
  });

  return response.data;
}

// Get list of files changed in a PR
async function getPRFiles(owner, repo, prNumber) {
  const octokit = getOctokit();

  const response = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
  });

  return response.data;
}

module.exports = { postPRComment, getPRDiff, getPRFiles };

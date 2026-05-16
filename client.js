// Get file content from a specific branch
async function getFileContent(owner, repo, path, branch) {
  const octokit = getOctokit();

  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
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
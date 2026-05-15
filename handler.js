const { postPRComment, getPRFiles } = require("./client");

async function handlePREvent(payload) {
  const { pull_request, repository } = payload;

  const owner = repository.owner.login;
  const repo = repository.name;
  const prNumber = pull_request.number;
  const prTitle = pull_request.title;
  const prAuthor = pull_request.user.login;

  try {
    // Get files changed in this PR
    const files = await getPRFiles(owner, repo, prNumber);
    const fileList = files.map((f) => `- \`${f.filename}\` (+${f.additions} / -${f.deletions})`).join("\n");

    // For now: post a basic acknowledgement comment
    // Week 2: this is where AI review goes
    const comment = buildComment(prTitle, prAuthor, files, fileList);
    await postPRComment(owner, repo, prNumber, comment);

  } catch (err) {
    console.error("❌ Error handling PR event:", err.message);
  }
}

function buildComment(prTitle, author, files, fileList) {
  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  return `## 🤖 AI PR Reviewer

Hey @${author}! I'm reviewing **"${prTitle}"** now.

### 📂 Files Changed (${files.length})
${fileList}

### 📊 Stats
| | Count |
|---|---|
| Lines added | +${totalAdditions} |
| Lines removed | -${totalDeletions} |
| Files touched | ${files.length} |

---
⏳ *Full AI review coming in a few seconds...*

> Powered by AI PR Reviewer Bot`;
}

module.exports = { handlePREvent };

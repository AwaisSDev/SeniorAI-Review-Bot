const { postPRComment, getPRFiles, getPRDiff, getFileContent } = require("./client");
const { runRulesEngine, formatFindings, getRulesSummary } = require("./rules");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function handlePREvent(payload) {
  const { pull_request, repository } = payload;

  const owner = repository.owner.login;
  const repo = repository.name;
  const prNumber = pull_request.number;
  const prTitle = pull_request.title;
  const prAuthor = pull_request.user.login;
  const baseBranch = pull_request.base.ref;
  const headBranch = pull_request.head.ref;
  const prDescription = pull_request.body || "No description provided";

  try {
    const files = await getPRFiles(owner, repo, prNumber);
    const diff = await getPRDiff(owner, repo, prNumber);

    const relevantFiles = files.filter(f =>
      !f.filename.includes("lock") &&
      !f.filename.includes(".png") &&
      !f.filename.includes(".jpg") &&
      !f.filename.includes(".svg")
    );

    // Fetch base branch content for top 3 changed files
    const baseContents = [];
    for (const file of relevantFiles.slice(0, 3)) {
      try {
        const content = await getFileContent(owner, repo, file.filename, baseBranch);
        if (content) baseContents.push({ filename: file.filename, content });
      } catch (e) {
        // File might be new, skip
      }
    }

    const findings = runRulesEngine(diff, relevantFiles);
    const summary = getRulesSummary(findings);

    const fileList = relevantFiles
      .map(f => {
        const status = f.status === "added" ? "🆕" : f.status === "removed" ? "🗑️" : "✏️";
        return `- ${status} \`${f.filename}\` (+${f.additions} / -${f.deletions})`;
      })
      .join("\n");

    const totalAdditions = relevantFiles.reduce((sum, f) => sum + f.additions, 0);
    const totalDeletions = relevantFiles.reduce((sum, f) => sum + f.deletions, 0);

    const aiReview = await getAIReview(
      prTitle, prDescription, relevantFiles,
      diff, findings, baseContents,
      baseBranch, headBranch
    );

    const comment = buildFullComment(
      prAuthor, prTitle, relevantFiles,
      fileList, totalAdditions, totalDeletions,
      findings, summary, aiReview,
      baseBranch, headBranch
    );

    await postPRComment(owner, repo, prNumber, comment);

  } catch (err) {
    console.error("Error handling PR event:", err.message);
  }
}

async function getAIReview(prTitle, prDescription, files, diff, ruleFindings, baseContents, baseBranch, headBranch) {
  const fileNames = files.map(f => f.filename).join(", ");
  const truncatedDiff = diff.length > 4000 ? diff.substring(0, 4000) + "\n...(truncated)" : diff;

  const rulesContext = ruleFindings.length > 0
    ? `Rules engine already flagged: ${ruleFindings.map(f => f.id).join(", ")}. Don't repeat these.`
    : "Rules engine found no obvious issues.";

  const baseContext = baseContents.length > 0
    ? baseContents.map(f => `\n--- BASE (${f.filename}) ---\n${f.content.substring(0, 800)}`).join("\n")
    : "No base content available.";

  const prompt = `You are a senior engineer reviewing a pull request for a hackathon team. Be fast, direct, and clear.

PR: "${prTitle}"
Description: "${prDescription}"
Merging: ${headBranch} → ${baseBranch}
Files: ${fileNames}
${rulesContext}

EXISTING CODE IN BASE BRANCH:
${baseContext}

CHANGES (diff):
\`\`\`
${truncatedDiff}
\`\`\`

Provide a FAST review with these sections:

## 🚦 Merge Safety
Is this safe to merge? Any conflicts with existing base code? Breaking changes?

## 🐛 Bugs & Logic Errors
Any bugs in the new code not caught by rules?

## ⚡ Quick Wins
Top 2-3 improvements they can make fast (hackathon context).

## ✅ What's Good
What they did well.

## 🏆 Overall Score: X/10
One line verdict.

Keep it under 350 words. Hackathon team needs fast answers.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 700,
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}

function buildFullComment(author, prTitle, files, fileList, additions, deletions, findings, summary, aiReview, baseBranch, headBranch) {
  const hasCritical = summary.CRITICAL > 0;
  const hasHigh = summary.HIGH > 0;
  const statusEmoji = hasCritical ? "🚨" : hasHigh ? "⚠️" : "✅";
  const statusText = hasCritical ? "Critical issues — review before merge" : hasHigh ? "Issues found" : "Looks good to merge";

  return `## 🤖 SeniorAI Review — ${statusEmoji} ${statusText}

**@${author}** | \`${headBranch}\` → \`${baseBranch}\`

---

### 📂 Files Changed (${files.length})
${fileList}

| Metric | Count |
|---|---|
| Lines added | +${additions} |
| Lines removed | -${deletions} |
| Files touched | ${files.length} |

---

### 🔍 Rules Engine
${formatFindings(findings)}

${summary.CRITICAL > 0 ? `> ⛔ **${summary.CRITICAL} critical issue(s) — fix before merging.**` : ""}

---

### 🧠 AI Analysis
${aiReview}

---
*SeniorAI Review Bot — built for speed*`;
}

module.exports = { handlePREvent };
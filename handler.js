const { postPRComment, getPRFiles, getPRDiff } = require("./client");
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

  try {
    const files = await getPRFiles(owner, repo, prNumber);
    const diff = await getPRDiff(owner, repo, prNumber);

    const relevantFiles = files.filter(f =>
      !f.filename.includes("lock") &&
      !f.filename.includes(".png") &&
      !f.filename.includes(".jpg") &&
      !f.filename.includes(".svg")
    );

    const findings = runRulesEngine(diff, relevantFiles);
    const summary = getRulesSummary(findings);

    const fileList = relevantFiles
      .map(f => `- \`${f.filename}\` (+${f.additions} / -${f.deletions})`)
      .join("\n");

    const totalAdditions = relevantFiles.reduce((sum, f) => sum + f.additions, 0);
    const totalDeletions = relevantFiles.reduce((sum, f) => sum + f.deletions, 0);

    const aiReview = await getAIReview(prTitle, relevantFiles, diff, findings);

    const comment = buildFullComment(
      prAuthor, prTitle, relevantFiles,
      fileList, totalAdditions, totalDeletions,
      findings, summary, aiReview
    );

    await postPRComment(owner, repo, prNumber, comment);

  } catch (err) {
    console.error("Error handling PR event:", err.message);
  }
}

async function getAIReview(prTitle, files, diff, ruleFindings) {
  const fileNames = files.map(f => f.filename).join(", ");
  const truncatedDiff = diff.length > 5000 ? diff.substring(0, 5000) + "\n...(truncated)" : diff;

  const rulesContext = ruleFindings.length > 0
    ? `Rules engine already flagged: ${ruleFindings.map(f => f.id).join(", ")}. Don't repeat these.`
    : "Rules engine found no obvious issues.";

  const prompt = `You are a senior software engineer doing a code review. Be direct and concise.

PR: "${prTitle}"
Files: ${fileNames}
${rulesContext}

Diff:
\`\`\`
${truncatedDiff}
\`\`\`

Provide:
1. Bugs or logic errors (not already flagged)
2. Architecture or design issues
3. What was done well
4. Overall score /10

Keep it under 300 words. Use markdown.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 600,
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}

function buildFullComment(author, prTitle, files, fileList, additions, deletions, findings, summary, aiReview) {
  const hasCritical = summary.CRITICAL > 0;
  const hasHigh = summary.HIGH > 0;
  const statusEmoji = hasCritical ? "🚨" : hasHigh ? "⚠️" : "✅";
  const statusText = hasCritical ? "Critical issues found" : hasHigh ? "Issues found" : "Looks good";

  return `## 🤖 SeniorAI Code Review — ${statusEmoji} ${statusText}

Hey @${author}! Here's my review of **"${prTitle}"**

---

### 📂 Files Changed (${files.length})
${fileList}

| | Count |
|---|---|
| Lines added | +${additions} |
| Lines removed | -${deletions} |

---

### 🔍 Rules Engine Results
${formatFindings(findings)}

${summary.CRITICAL > 0 ? `> ⛔ **${summary.CRITICAL} critical issue(s) must be fixed before merging.**` : ""}

---

### 🧠 AI Analysis
${aiReview}

---
*Powered by SeniorAI Review Bot*`;
}

module.exports = { handlePREvent };

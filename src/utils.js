export function cleanAiResponse(text) {
  if (!text) return "";
  return text
    .replace(/^```(\w+)?\n?/g, "") // Remove opening ```git
    .replace(/```\n?$/g, "")       // Remove closing ```
    .trim();
}

export function generateRuleBasedCommitMessage(diffText) {
  if (!diffText) return "feat: Update workspace\n\nThis commit:\n- Minor updates to multiple files.";

  const fileDiffs = diffText.split(/^diff --git/m).filter(Boolean);
  const changedFiles = [];

  fileDiffs.forEach(fileDiff => {
    const match = fileDiff.match(/a\/(.+?) b\//);
    if (match) {
      const fileName = match[1];
      const additions = (fileDiff.match(/^\+/gm) || []).length;
      const deletions = (fileDiff.match(/^-/gm) || []).length;
      changedFiles.push({ name: fileName, additions, deletions });
    }
  });

  if (changedFiles.length === 0) {
    return "feat: Update workspace\n\nThis commit:\n- Minor updates to multiple files.";
  }

  // Helper for human-like variety
  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // Determine Prefix
  let prefix = "feat";
  const allNames = changedFiles.map(f => f.name.toLowerCase());
  if (allNames.every(n => n.includes("test") || n.includes("spec"))) prefix = "test";
  else if (allNames.every(n => n.endsWith(".md") || n.endsWith(".txt"))) prefix = "docs";
  else if (allNames.every(n => n.includes("package.json") || n.includes("config") || n.startsWith("."))) prefix = "chore";
  else if (diffText.toLowerCase().match(/fix|bug|issue|error/)) prefix = "fix";

  // Build Humanized Subject
  const primaryFile = changedFiles.reduce((prev, current) => 
    (prev.additions + prev.deletions > current.additions + current.deletions) ? prev : current
  );

  const subjectVerbs = ["Refining", "Updating", "Polishing", "Streamlining", "Enhancing", "Adjusting"];
  const chosenVerb = getRandom(subjectVerbs);
  const subject = `${prefix}: ${chosenVerb} \`${primaryFile.name}\`${changedFiles.length > 1 ? ` and ${changedFiles.length - 1} related files` : ""}`;

  // Build Humanized Body
  const bodyLines = changedFiles.slice(0, 5).map(file => {
    let action = "Modified";
    const total = file.additions + file.deletions;

    if (file.additions > file.deletions * 3) action = "Expanded functionality in";
    else if (file.deletions > file.additions * 3) action = "Streamlined and pruned";
    else if (total > 50) action = "Reworked significant logic in";
    else action = getRandom(["Cleaned up", "Refined the code in", "Updated", "Applied minor tweaks to"]);

    return `- ${action} \`${file.name}\` (${total} line changes).`;
  });

  if (changedFiles.length > 5) {
    bodyLines.push(`- Plus ${changedFiles.length - 5} additional files touched during this update.`);
  }

  return `${subject}\n\nThis commit:\n${bodyLines.join("\n")}`;
}
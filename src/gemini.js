import axios from "axios";
import * as vscode from "vscode";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export const tonePrompts = {
  "Bollywood Drama": "Write the commit message in the style of an over-the-top Bollywood movie dialogue.",
  "Star Wars": "Write the commit message using Jedi wisdom, Sith absolutes, or Droid speak.",
  "Film Noir": "Write the commit message in the style of a gritty, cynical detective narrating a rainy night.",
  "Marvel": "Write the commit message using heroic MCU one-liners or Thanos-style inevitability.",
  "The Godfather": "Write the commit message in the style of a respectful but threatening Mafia boss.",
  "Anime Shonen": "Write the commit message with high energy, screaming, and the power of friendship.",
  "Anime Tsundere": "Write the commit message acting cold and hostile at first, but secretly helpful.",
  "Pirate": "Write the commit message using nautical pirate slang and aggressive enthusiasm.",
  "Medieval": "Write the commit message in Old English as a chivalrous knight.",
  "Cyberpunk": "Write the commit message using technobabble, neon-noir slang, and edgy hacker terms.",
  "Robot": "Write the commit message as a cold, logical AI devoid of emotion.",
  "Shakespearean": "Write the commit message in Iambic pentameter with archaic vocabulary.",
  "Haiku": "Write the commit message strictly as a Haiku (5-7-5 syllables).",
  "Passive Aggressive": "Write the commit message in a passive-aggressive tone, implying the previous code was bad."
};

async function getApiKey() {
  // 1. Try from settings
  let apiKey = vscode.workspace
    .getConfiguration("commitMessageGenerator")
    .get("apiKey");

  // 3. If still missing → prompt user
  if (!apiKey) {
    const input = await vscode.window.showInputBox({
      prompt: "Enter your Gemini API Key",
      ignoreFocusOut: true, // keeps the input open if focus changes
      password: true, // hides the key while typing
    });

    if (!input) {
      throw new Error("Gemini API key is required to generate commit messages.");
    }

    // Save to settings so they don’t need to enter again
    await vscode.workspace
      .getConfiguration("commitMessageGenerator")
      .update("apiKey", input, vscode.ConfigurationTarget.Global);

    apiKey = input;
  }

  return apiKey;
}

export async function generateCommitMessage(diffText) {
  const apiKey = await getApiKey();
  const config = vscode.workspace.getConfiguration("commitMessageGenerator");
  const tone = config.get("tone");
  const useCustomPrompt = config.get("useCustomPrompt");
  const customPrompt = config.get("customPrompt");

  const filteredDiff = diffText
    .split(/\n(?=diff --git|\n)/)
    .filter(chunk => !/package-lock\.json/.test(chunk))
    .join("\n");

  let styleInstruction = "Generate a concise git commit message.";
  if (useCustomPrompt && customPrompt) {
    styleInstruction = `${customPrompt}\n\n(Note: The output format MUST still follow the required structure below.)`;
  } else if (tone !== "Professional" && tonePrompts && tonePrompts[tone]) {
    styleInstruction = `${tonePrompts[tone]}\n\n(Formatting requirements below still apply.)`;
  }

  const formatInstruction = `
STRICT OUTPUT FORMAT:
feat: <Subject>

This commit:
- <Detail 1>
- <Detail 2>

Requirements:
1. Start with "feat: ".
2. Ensure there is a blank line after the "feat: <Subject>" line.
3. Use 2–5 hyphenated bullets.
4. Wrap file paths/names in single backticks (e.g., \`src/index.js\`).
5. No markdown code blocks (no \`\`\`).
`;

  const prompt = `${styleInstruction}\n${formatInstruction}\n\nDiff:\n${filteredDiff}`;

  const response = await axios.post(
    GEMINI_URL,
    { contents: [{ parts: [{ text: prompt }] }] },
    { params: { key: apiKey } }
  );

  let rawText = response.data.candidates[0].content.parts[0].text || "";

  // 1. Remove markdown code fences if the model ignored the instruction
  rawText = rawText.replace(/^```(git-commit|text)?\n/g, '').replace(/\n```$/g, '').trim();

  let lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return "feat: Update\n\nThis commit:\n- Minor updates.";

  // 2. Fix merged Subject + Introduction line
  // If line 0 starts with feat: but contains "This commit:", split it.
  if (/^feat:.*This commit:/i.test(lines[0])) {
    const splitMatch = lines[0].match(/^(feat:.*?)(This commit:.*)$/i);
    if (splitMatch) {
      lines.splice(0, 1, splitMatch[1].trim(), splitMatch[2].trim());
    }
  }

  // 3. Ensure line 0 starts with feat:
  if (!/^feat:/i.test(lines[0])) {
    lines[0] = `feat: ${lines[0]}`;
  }

  // 4. Sanitize and Format lines
  const finalLines = [];
  let foundBodyStart = false;

  lines.forEach((line, idx) => {
    // Keep the subject line as is (it's idx 0 now)
    if (idx === 0) {
      finalLines.push(line);
      finalLines.push(""); // Force the empty line after subject
      return;
    }

    // Clean up bullet points and fix filename backticks
    if (line.startsWith("-") || line.match(/^[0-9]+\./)) {
      let bulletContent = line.replace(/^-+\s*/, "").trim();

      // Fix broken backticks: 
      // This regex looks for path-like strings and wraps them ONLY if they aren't already wrapped.
      // It avoids splitting on hyphens inside paths.
      bulletContent = bulletContent.replace(/(?<![`])(\b[\w\-\/]+\.(?:js|ts|json|md|css|html|jsx|tsx|py|java|go|c|cpp)\b)(?![`])/g, '`$1`');

      finalLines.push(`- ${bulletContent}`);
      foundBodyStart = true;
    } else if (line.toLowerCase().includes("this commit")) {
      // Ensure "This commit:" is on its own line
      finalLines.push("This commit:");
      foundBodyStart = true;
    }
  });

  return finalLines.join("\n");
}


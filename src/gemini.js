import axios from "axios";
import * as vscode from "vscode";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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
  // keep existing settings available but we will FORCE the output format below
  const tone = config.get("tone");
  const useCustomPrompt = config.get("useCustomPrompt");
  const customPrompt = config.get("customPrompt");

  // Remove any diff hunks that only touch package-lock.json — do not let package-lock.json drive the message.
  // This simply strips file sections that mention package-lock.json so the prompt the model sees won't include them.
  const filteredDiff = diffText
    .split(/\n(?=diff --git|\n)/) // crude split by diff headers (keeps headers)
    .filter(chunk => !/package-lock\.json/.test(chunk))
    .join("\n");

  // 1. Base instruction (we allow a custom prompt override for content preferences,
  //    but the output FORMAT will always be strictly enforced below)
  let styleInstruction = "Generate a concise git commit message.";
  if (useCustomPrompt && customPrompt) {
    styleInstruction = `${customPrompt}\n\n(IGNORE the formatting rules below is NOT allowed — the output format MUST still follow the required structure.)`;
  } else if (tone !== "Professional" && tonePrompts && tonePrompts[tone]) {
    // keep tone prompts informative for content, but not for format
    styleInstruction = `${tonePrompts[tone]}\n\n(Formatting requirements below still apply.)`;
  }

  // 2. STRICT structure we MUST enforce for every output.
  //    The assistant must follow this EXACT structure (no extra headings, no explanations).
  //    - Always use `feat:` as the commit type (prefix the subject with `feat:`).
  //    - Output either:
  //        A) For feature-like changes: use the sentence "This commit introduces the following features:"
  //        B) For general changes: use "This commit:" and then a concise explanatory sentence followed by bullets
  //    - Bullets must be hyphen-prefixed lines (e.g. "- Allows users...").
  //    - When mentioning filenames, code symbols, functions or file paths, wrap them in backticks (e.g. `extension.js`, `commands.js`).
  //    - Bullets must explain WHAT changed and WHY it was changed (no filler).
  //
  //    EXACT output pattern (the model must not output extra text before/after):
  //
  //    feat: <Subject>
  //    This commit introduces the following features:
  //    - <what and why, filename(s) wrapped in backticks if present>
  //    - <what and why>
  //    - <what and why>
  //
  //    OR (if not a feature list, still MUST begin with feat: and then:)
  //
  //    feat: <Subject>
  //    This commit:
  //    - <what and why, filename(s) wrapped in backticks if present>
  //    - <what and why>
  //    - <what and why>
  //
  //    Additional hard rules:
  //    * Do NOT include any other headings, metadata, diff snippets, or commentary.
  //    * Use 2–5 bullet points. Prefer 3 bullets when possible.
  //    * Do NOT use backtick code fences (```); single backticks for filenames/identifiers are allowed and required when present.
  const formatInstruction = `
Strictly follow this EXACT output format (choose the first block for feature-style messages or the second for general changes):

feat: <Subject>
\nThis commit introduces the following features:
- <Detail about change 1 — explain WHAT and WHY; wrap filenames or code in backticks like \`file.js\` when mentioned>
- <Detail about change 2 — explain WHAT and WHY>
- <Detail about change 3 — explain WHAT and WHY>

OR

feat: <Subject>
\nThis commit:
- <Detail about change 1 — explain WHAT and WHY; wrap filenames or code in backticks like \`file.js\` when mentioned>
- <Detail about change 2 — explain WHAT and WHY>
- <Detail about change 3 — explain WHAT and WHY>

Hard requirements:
- Use 2–5 hyphen bullets. Prefer 3 bullets.
- Wrap filenames, file paths, function names or other code identifiers in single backticks.
- Do NOT include conversational filler, extra headings, signatures, or markdown code fences.
- If the diff includes only changes to \`package-lock.json\` (which we filtered out above), return a one-line feat subject describing dependency lock updates and a single bullet explaining that \`package-lock.json\` was excluded from the message.
`;

  // 3. Specific constraint to ensure bullets explain what and why and filenames are backticked
  const constraints = "Ensure each bullet explains WHAT changed and WHY it was changed. Wrap filenames and code identifiers in backticks. Do not add any extra narrative, analysis, or headings.";

  // Combine instructions and the filtered diff (we send the filtered diff so package-lock.json-only changes are ignored)
  const prompt = `${styleInstruction}\n${formatInstruction}\n${constraints}\n\nDiff (package-lock.json diffs have been excluded):\n${filteredDiff}`;

  // Send request to the model
  const response = await axios.post(
    GEMINI_URL,
    {
      contents: [{ parts: [{ text: prompt }] }],
    },
    {
      params: { key: apiKey },
    }
  );

  // Extract and clean result
  let rawText = response.data.candidates[0].content.parts[0].text || "";

  // If the model mistakenly returned fenced code blocks, strip them (but keep inline backticks)
  rawText = rawText.replace(/^```(git-commit|text)?\n/, '').replace(/\n```$/, '');

  // Ensure the output begins with "feat:" — if not, coerce the first line (best-effort fallback)
  const lines = rawText.split("\n").filter(Boolean);
  if (lines.length === 0) return "feat: Update\nThis commit:\n- Minor updates (unable to parse diff).";

  if (!/^feat:\s+/i.test(lines[0])) {
    // Prepend a safe subject if the model didn't follow the rule
    const subject = lines[0].slice(0, 72).trim();
    lines.unshift(`feat: ${subject || "Update"}`);
  }

  // Guarantee bullets are hyphen-starting lines and filenames have backticks (best-effort sanitisation)
  // We will not attempt heavy re-writing, just ensure bullets start with '-' and wrap obvious filenames.
  const sanitized = lines.map((line, idx) => {
    // Ensure second line is either "This commit:" or "This commit introduces..."
    if (idx === 1 && !/^This commit(:| introduces)/i.test(line)) {
      // leave as-is if it already looks like a descriptive sentence, otherwise replace
      if (line.length < 6) return "This commit:";
      return line;
    }

    // For bullet lines: ensure they start with "- "
    if (line.trim().startsWith("-")) {
      // Wrap plain-looking filenames (very small heuristic): words that contain '.' and end with common ext
      return line.replace(/([^\`]\b[\w\-/.]+\.(js|ts|json|md|css|html|jsx|tsx|py|java|go)\b[^\`]?)/g, (m) => {
        // avoid double-wrapping if already in backticks
        if (/`/.test(m)) return m;
        return m.replace(/(^\s*-\s*)?(.+)/, (_, p1, name) => `${p1 || "- "}\`${name.trim()}\``);
      });
    }

    return line;
  });

  const finalText = sanitized.join("\n");

  return finalText;
}


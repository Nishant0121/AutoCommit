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
  const useConventional = config.get("useConventionalCommits");
  const tone = config.get("tone");
  const useCustomPrompt = config.get("useCustomPrompt");
  const customPrompt = config.get("customPrompt");

  // 1. Base instruction based on Tone/Custom settings
  let styleInstruction = "Generate a concise git commit message.";

  if (useCustomPrompt && customPrompt) {
    styleInstruction = customPrompt;
  } else if (tone !== "Professional" && tonePrompts[tone]) {
    styleInstruction = tonePrompts[tone];
  }

  // 2. Define the STRICT structure
  // We explicitly tell the AI to use the format: Subject -> "This commit:" -> Bullets
  let formatInstruction = `
    Strictly output the result in the following format : 

    <Type>: <Subject>
    This commit:
    * <Detail about change 1>
    * <Detail about change 2>
    * <Detail about change 3>
  `;

  if (useConventional) {
    formatInstruction += " Ensure the <Type> follows Conventional Commits (feat, fix, chore, docs, etc.).";
  }

  // 3. specific constraint to ensure the description lines (bullets) are generated
  const constraints = "Ensure the bullet points explain 'what' and 'why' based on the diff provided. Do not include conversational filler.";

  // Combine instructions
  const prompt = `${styleInstruction}\n${formatInstruction}\n${constraints}\n\nDiff:\n${diffText}`;

  const response = await axios.post(
    GEMINI_URL,
    {
      contents: [{ parts: [{ text: prompt }] }],
    },
    {
      params: { key: apiKey },
    }
  );

  // Clean up any potential markdown code blocks (```) if the AI slips up
  let rawText = response.data.candidates[0].content.parts[0].text;
  return rawText.replace(/^```(git-commit|text)?\n/, '').replace(/\n```$/, '');
}

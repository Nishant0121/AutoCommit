const axios = require("axios");
const vscode = require("vscode");

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const tonePrompts = {
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

async function generateCommitMessage(diffText) {
  const apiKey = await getApiKey();

  const config = vscode.workspace.getConfiguration("commitMessageGenerator");
  const useConventional = config.get("useConventionalCommits");
  const tone = config.get("tone");
  const useCustomPrompt = config.get("useCustomPrompt");
  const customPrompt = config.get("customPrompt");

  let instruction = "Generate a concise git commit message.";

  if (useCustomPrompt && customPrompt) {
    instruction = customPrompt;
  } else if (tone !== "Professional" && tonePrompts[tone]) {
    instruction = tonePrompts[tone];
  }

  if (useConventional) {
    instruction += " Use the Conventional Commits format (e.g., feat:, fix:, chore:, docs:).";
  }

  const prompt = `${instruction}\n${diffText}`;

  const response = await axios.post(
    GEMINI_URL,
    {
      contents: [{ parts: [{ text: prompt }] }],
    },
    {
      params: { key: apiKey },
    }
  );

  return response.data.candidates[0].content.parts[0].text;
}

module.exports = { generateCommitMessage, tonePrompts };

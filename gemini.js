const axios = require("axios");
const vscode = require("vscode");

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

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

  const prompt = `Generate a concise git commit message for the following code diff:\n${diffText}`;

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

module.exports = { generateCommitMessage };

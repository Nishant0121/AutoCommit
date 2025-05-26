const axios = require("axios");

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function generateCommitMessage(diffText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const prompt = `Generate a concise git commit message for the following code diff:\n${diffText}`;

  const response = await axios.post(
    GEMINI_URL,
    {
      contents: [{ parts: [{ text: prompt }] }],
    },
    {
      params: {
        key: apiKey,
      },
    }
  );

  return response.data.candidates[0].content.parts[0].text;
}

module.exports = { generateCommitMessage };

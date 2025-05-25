const axios = require("axios");

// const API_KEY = "AIzaSyDOky3a0Mpbe13I6Zo4t-RZ-pt4F8NbG5I";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
  API_KEY;

async function generateCommitMessage(diffText) {
  const prompt = `Generate a concise git commit message for the following code diff:\n${diffText}`;

  const response = await axios.post(GEMINI_URL, {
    contents: [{ parts: [{ text: prompt }] }],
  });

  return response.data.candidates[0].content.parts[0].text;
}

module.exports = { generateCommitMessage };

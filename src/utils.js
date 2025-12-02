export function cleanAiResponse(text) {
  if (!text) return "";
  return text
    .replace(/^```(\w+)?\n?/g, "") // Remove opening ```git
    .replace(/```\n?$/g, "")       // Remove closing ```
    .trim();
}
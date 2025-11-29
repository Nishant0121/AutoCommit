# AutoCommit - AI-Powered Commit Message Generator

**AutoCommit** is a VS Code extension that uses **Gemini 2.0 Flash** to analyze your git changes and generate intelligent, context-aware commit messages instantly. It streamlines your workflow by writing clear, meaningful commit messages for you.

## 🚀 Features

* **Context-Aware Analysis:** Reads your staged (and unstaged) `git diff` to understand exactly what changed.
* **Secure API Key Storage:** Your Gemini API key is stored safely in your local configuration.
* **Interactive Review:** Review, regenerate, or edit the message before committing (toggleable).
* **Multiple Personalities:** Choose from various "Tones" to spice up your commit logs.
* **Conventional Commits:** Optional support for standard conventional commit formats (e.g., `feat:`, `fix:`).

## 🛠️ Configuration Settings

You can customize AutoCommit in VS Code Settings (`Ctrl+,` or `Cmd+,`):

| Setting | Default | Description |
| :--- | :--- | :--- |
| `commitMessageGenerator.apiKey` | (Empty) | Your Gemini API key. You will be prompted to enter this on first use. |
| `commitMessageGenerator.crossCheck` | `true` | Enables the **Interactive Menu** (Accept / Regenerate / Copy) before finalizing the message. |
| `commitMessageGenerator.autoFill` | `true` | If `crossCheck` is disabled (or after accepting), automatically populates the Source Control input box. |
| `commitMessageGenerator.useConventionalCommits` | `false` | Enforces the [Conventional Commits](https://www.conventionalcommits.org/) standard. |
| `commitMessageGenerator.tone` | `Professional` | Sets the personality of the AI (see Tones below). |
| `commitMessageGenerator.useCustomPrompt` | `false` | Enable to use your own custom system instruction. |
| `commitMessageGenerator.customPrompt` | (Empty) | Your custom instruction text (overrides Tone). |

## 🎭 Commit Tones

Why be boring? Switch up the style of your commit messages with these built-in modes:

* **Professional:** (Default) Clean, concise, and business-like.
* **Bollywood Drama:** Over-the-top dialogue style.
* **Star Wars:** Jedi wisdom or Sith absolutes.
* **Film Noir:** Gritty detective narration.
* **Marvel:** Heroic one-liners.
* **The Godfather:** Respectful mafia boss style.
* **Anime Shonen:** High energy and power of friendship.
* **Anime Tsundere:** Cold at first, but helpful.
* **Pirate:** Nautical slang and aggression.
* **Medieval:** Old English chivalry.
* **Cyberpunk:** Technobabble and neon-noir slang.
* **Robot:** Cold, logical, and emotionless.
* **Shakespearean:** Iambic pentameter.
* **Haiku:** Strictly 5-7-5 syllables.
* **Passive Aggressive:** implies the previous code was bad.

## 🕹️ Commands

Access these from the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

* `AutoCommit : Generate Git Commit Message` - Triggers the generation process.
* `AutoCommit : Toggle Commit Cross-Check` - Turn the interactive review menu on/off.
* `AutoCommit : Toggle Conventional Commits` - Switch between standard and conventional formats.
* `AutoCommit : Set Commit Tone` - Select a new personality from the list.
* `AutoCommit : Toggle Auto Fill Commit Message` - Enable/Disable auto-filling the git input box.
* `AutoCommit : Set Custom Prompt` - Enter a custom instruction for the AI.
* `AutoCommit : Toggle Custom Prompt` - Enable/Disable the custom prompt.

## 📝 How to Use

1. **Stage your changes** in VS Code (or via terminal).
2. Open the Command Palette and run **`AutoCommit : Generate Git Commit Message`**.
3. (If first run) Enter your Gemini API Key.
4. **Interactive Mode (Default):** A menu will appear at the top:
    * **Accept:** Populates the commit box.
    * **Regenerate:** Tries again for a different result.
    * **Copy:** Copies the text to your clipboard.
5. **Commit!**

---
**Publisher:** Nishant0121
**License:** MIT

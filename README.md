# AutoCommit Message Generator

![AutoCommit Logo](https://res.cloudinary.com/dvmsssno2/image/upload/v1763905225/AutoCommit_Logo_ghvuj7.png)

A VS Code extension that generates concise, intelligent git commit messages based on your staged or working file changes using Google's **Gemini 2.0 Flash** AI.

## Features

* **Smart Analysis:** Analyzes your current `git diff` to understand context.
* **Priority Handling:** Prioritizes **staged** changes. If nothing is staged, it falls back to **unstaged** changes.
* **Gemini 2.0 Powered:** Utilizes the speed of the Gemini 2.0 Flash model for near-instant results.
* **Clipboard Ready:** Automatically cleans up markdown formatting and copies the message to your clipboard.
* **Secure Configuration:** Prompts for your API key once and saves it securely in your VS Code Global Settings.

## Getting Started

To use this extension, you need a free Google Gemini API Key.

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create a new API Key.
3. Run the extension command (see Usage below). You will be prompted to enter this key the first time you run it.

## Usage

1. Make changes to your code.
2. (Optional) Stage the files you want to commit (`git add .`).
3. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on Mac).
4. Type and select: **`Generate Commit Message`**.
5. The extension will generate a message and copy it to your clipboard.
6. Paste it into your Git commit box!

## Extension Settings

This extension contributes the following settings:

* `commitMessageGenerator.apiKey`: Your Google Gemini API Key.
  * *Note: This is usually set automatically via the input box upon first use, but you can modify it manually in your User Settings if needed.*

## Requirements

* **Git**: Must be installed and available in your system PATH.
* **Repository**: You must be opening a folder that is initialized as a Git repository.

## Known Issues

* Very large diffs might exceed the token limit for the AI model (though unlikely with typical commits).

---

**Made with ❤️ by Nishant Patil**

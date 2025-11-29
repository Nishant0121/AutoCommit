### 1\. The Workflow Coordinator (`extension.js`)

This file is the entry point of your extension. It handles the logic of interacting with VS Code and the Git command line.

* **Activation:** When the extension loads, it registers a command called `extension.generateCommitMessage`. This is what runs when the user triggers the extension (e.g., via the Command Palette).
* **Getting the Changes (`getGitDiff` function):**
  * It first checks if the current folder is a Git repository.
  * **Priority on Staged:** It tries to get the "staged" changes first (`git diff --cached`). These are files you have already added with `git add`.
  * **Fallback to Unstaged:** If you haven't staged anything yet, it falls back to getting the "unstaged" changes (`git diff`).
  *
* **Cleaning the Output:** AI models often wrap their response in Markdown code blocks (like \`\`\`). The code includes a regex cleaner:

    ````javascript
    message.replace(/^```(\w+)?\n?/g, "").replace(/```\n?$/g, "").trim();
    ````

    This ensures you get just the text message, not the formatting symbols.
* **Final Action:** It writes the cleaned message to your **clipboard** and shows a success notification.

### 2\. The AI Brain (`gemini.js`)

This file handles the communication with the Google Gemini API.

* **Authentication (`getApiKey` function):**
  * It checks VS Code settings (`commitMessageGenerator.apiKey`) to see if an API key is already saved.
  * **Interactive Prompt:** If no key is found, it uses `vscode.window.showInputBox` to create a popup input field asking the user for their Gemini API Key.
  * **Persistence:** Once the user enters the key, it saves it globally (`vscode.ConfigurationTarget.Global`) so the user doesn't have to enter it again.
* **Generating Content:**
  * It uses the `gemini-2.0-flash` model (a very fast, efficient model).
  * It sends a prompt: *"Generate a concise git commit message for the following code diff..."* along with the diff text retrieved from the previous step.
  * It uses the `axios` library to make the HTTP POST request to Google.

### 3\. The Manifest (`package.json`)

This is the configuration file that tells VS Code how to treat your extension.

* **Metadata:** Sets the name, publisher (`nishant0121`), and icon.
* **Activation Events:** `onCommand:extension.generateCommitMessage` tells VS Code to only load your extension code when this specific command is run (this saves memory).
* **Configuration Schema:**

    ```json
    "configuration": {
      "title": "Commit Message Generator",
      "properties": {
        "commitMessageGenerator.apiKey": { ... }
      }
    }
    ```

    This creates a section in the **VS Code Settings UI** where the user can manually update or delete their API Key if needed.

-----

### Summary of the User Experience

1. User makes code changes.
2. User runs command "Generate Git Commit Message".
3. **System:** Checks for staged changes -\> checks for unstaged changes.
4. **System:** Checks for API Key (asks user if missing).
5. **System:** Sends code to Gemini -\> receives message.
6. **System:** Cleans text -\> Copies to Clipboard.
7. User pastes the message into the Source Control commit box.

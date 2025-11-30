### 1\. The Workflow Coordinator (`extension.js`)

This file is the entry point of your extension. It orchestrates the logic of interacting with VS Code and Git, managing user preferences, and presenting the AI-generated output.

* **Activation:** When the extension loads, it registers several commands that can be triggered by the user (e.g., via the Command Palette).
* **Generating a Commit Message (`extension.generateCommitMessage`):**
  * **Progress Notification:** Displays a progress bar in VS Code, informing the user about the current stage (scanning changes, drafting message).
  * **Getting the Changes (`getGitDiff` function):**
    * It first checks if the current folder is a Git repository.
    * **Priority on Staged:** It tries to get the "staged" changes first (`git diff --cached`). These are files you have already added with `git add`.
    * **Fallback to Unstaged:** If you haven't staged anything yet, it falls back to getting the "unstaged" changes (`git diff`).
    * **Exclusions:** It explicitly excludes `package-lock.json` from the diff.
    * **Diff Truncation:** To prevent overwhelming the AI, large diffs are truncated to a maximum length (8000 characters).
  * **Cleaning the Output:** AI models often wrap their response in Markdown code blocks (like \`\`\`). The code includes a regex cleaner:

        ````javascript
        message.replace(/^```(\w+)?\n?/g, "").replace(/```\n?$/g, "").trim();
        ````

        This ensures you get just the text message, not the formatting symbols.
  * **Interactive Menu (Cross-Check):** If the `crossCheck` setting is enabled, after generating a message, an interactive QuickPick menu appears, allowing the user to:
    * **Accept:** Directly apply the message to the Git SCM input box.
    * **Regenerate:** Request a new commit message.
    * **Copy:** Copy the message to the clipboard.
  * **Auto-Fill Commit Message:** If `autoFill` is enabled, the generated message is automatically placed into the Git Source Control input box.
  * **Copy to Clipboard:** If `autoFill` is disabled and `crossCheck` is not active, the cleaned message is copied to the user's clipboard, and a success notification is shown.
* **Additional Configuration Commands:** The extension provides several commands for users to customize its behavior:
  * `extension.toggleConventionalCommits`: Toggles whether the generated commit messages should adhere to the Conventional Commits specification.
  * `extension.toggleAutoFill`: Toggles automatic population of the Git SCM input box.
  * `extension.setCommitTone`: Allows users to choose a specific "personality" or tone for the AI-generated commit messages (e.g., Professional, Star Wars, Pirate).
  * `extension.setCustomPrompt`: Enables users to define a custom system instruction that overrides the default tone and conventional commit settings, giving full control over the AI's behavior.
  * `extension.toggleCustomPrompt`: Toggles the use of the custom prompt.
  * `extension.toggleCrossCheck`: Toggles the interactive menu for accepting, regenerating, or copying the message.

### 2\. The AI Brain (`gemini.js`)

This file handles the communication with the Google Gemini API, including authentication and intelligent prompt construction.

* **Authentication (`getApiKey` function):**
  * It checks VS Code settings (`commitMessageGenerator.apiKey`) to see if an API key is already saved.
  * **Interactive Prompt:** If no key is found, it uses `vscode.window.showInputBox` to create a popup input field asking the user for their Gemini API Key.
  * **Persistence:** Once the user enters the key, it saves it globally (`vscode.ConfigurationTarget.Global`) so the user doesn't have to enter it again.
* **Dynamic Prompt Generation:**
  * The extension constructs a highly customizable prompt for the Gemini model based on user settings:
    * **Custom Prompt:** If `useCustomPrompt` is enabled and a `customPrompt` is defined, this takes precedence, allowing users to define their own system instructions.
    * **Commit Tone:** If no custom prompt is used, and a `tone` (e.g., "Star Wars", "Pirate") is selected, the prompt incorporates specific instructions from the `tonePrompts` object to generate messages with that personality.
    * **Conventional Commits:** If `useConventionalCommits` is enabled, the prompt explicitly instructs the AI to use Conventional Commits types (e.g., `feat`, `fix`, `chore`).
  * **Strict Output Format:** The prompt strictly defines the desired output format: `Type: Subject` followed by bullet points detailing "what" and "why" based on the provided diff.
* **Generating Content:**
  * It uses the `gemini-2.0-flash` model (a very fast, efficient model).
  * It uses the `axios` library to make the HTTP POST request to Google.

### 3\. The Manifest (`package.json`)

This is the configuration file that tells VS Code how to treat your extension and defines its configurable settings.

* **Metadata:** Sets the name, publisher (`nishant0121`), and icon.

* **Activation Events:** `onCommand:extension.generateCommitMessage` (and other registered commands) tells VS Code to only load your extension code when these specific commands are run (this saves memory).

* **Configuration Schema:**

    ```json

    "configuration": {

      "title": "AutoCommit",

      "properties": {

        "commitMessageGenerator.apiKey": {

          "type": "string",

          "description": "Your Google Gemini API Key. Get one at https://ai.google.dev/",

          "markdownDescription": "Your Google Gemini API Key. Get one at [Google AI Studio](https://ai.google.dev/).",

          "scope": "window",

          "default": ""

        },

        "commitMessageGenerator.useConventionalCommits": {

          "type": "boolean",

          "description": "Generate commit messages using Conventional Commits specification.",

          "default": true

        },

        "commitMessageGenerator.tone": {

          "type": "string",

          "description": "Set the personality/tone for generated commit messages.",

          "default": "Professional",

          "enum": [

            "Professional",

            "Bollywood Drama",

            "Star Wars",

            "Film Noir",

            "Marvel",

            "The Godfather",

            "Anime Shonen",

            "Anime Tsundere",

            "Pirate",

            "Medieval",

            "Cyberpunk",

            "Robot",

            "Shakespearean",

            "Haiku",

            "Passive Aggressive"

          ]

        },

        "commitMessageGenerator.customPrompt": {

          "type": "string",

          "description": "A custom system instruction for generating commit messages (overrides tone/conventional commits if 'useCustomPrompt' is true).",

          "default": ""

        },

        "commitMessageGenerator.useCustomPrompt": {

          "type": "boolean",

          "description": "Use the custom prompt defined above instead of tone/conventional commits settings.",

          "default": false

        },

        "commitMessageGenerator.autoFill": {

          "type": "boolean",

          "description": "Automatically fill the Git SCM input box with the generated message.",

          "default": false

        },

        "commitMessageGenerator.crossCheck": {

          "type": "boolean",

          "description": "Show an interactive menu to accept, regenerate, or copy the commit message.",

          "default": true

        }

      }

    }

    ```

    This creates a section in the **VS Code Settings UI** where the user can configure these options.

-----

### Summary of the User Experience

1. User makes code changes and stages them (or leaves them unstaged).
2. User runs command "AutoCommit: Generate Commit Message" (or other configuration commands).
3. **System:** Displays a progress bar:
    * Checks for staged changes -> checks for unstaged changes (excluding `package-lock.json`, truncating large diffs).
    * Checks for API Key (asks user if missing).
    * Constructs a dynamic prompt based on user settings (Conventional Commits, Tone, Custom Prompt).
    * Sends code diff to Gemini -> receives message.
    * Cleans text.
4. **System (if `crossCheck` is enabled):** Presents an interactive menu with the generated message, offering "Accept," "Regenerate," or "Copy" options.
    * If "Accept" is chosen, or if `crossCheck` is disabled and `autoFill` is enabled, the message is automatically filled into the Git SCM input box.
    * If "Copy" is chosen, or if `crossCheck` and `autoFill` are disabled, the message is copied to the clipboard.
5. User reviews/modifies the message in the Git SCM input box (if auto-filled) or pastes it (if copied).
6. User commits their changes.

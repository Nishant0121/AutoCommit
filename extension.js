const { generateCommitMessage, tonePrompts } = require("./gemini");
const vscode = require("vscode");

function cleanAiResponse(text) {
  if (!text) return "";
  return text
    .replace(/^```(\w+)?\n?/g, "") // Remove opening ```git
    .replace(/```\n?$/g, "")       // Remove closing ```
    .trim();
}

function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "extension.generateCommitMessage",
    async function () {
      let action = "Regenerate";

      while (action === "Regenerate") {
        let finalMessage = null;
        let errorOccurred = false;

        // Professional UI: Progress bar with generic "AI" text
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "AutoCommit",
            cancellable: false,
          },
          async (progress) => {
            try {
              // Step 1: Scan for changes
              progress.report({ message: "Scanning workspace changes..." });
              const gitDiff = await getGitDiff();

              if (!gitDiff) {
                vscode.window.showWarningMessage("No staged or unstaged changes detected.");
                errorOccurred = true;
                return;
              }

              // Step 2: Generate Message (Generic text)
              progress.report({ message: "Drafting commit message..." });
              const rawMessage = await generateCommitMessage(gitDiff);

              // Step 3: Clean
              finalMessage = cleanAiResponse(rawMessage);
            } catch (error) {
              vscode.window.showErrorMessage(
                "Unable to generate message: " + error.message
              );
              errorOccurred = true;
            }
          }
        );

        if (errorOccurred || !finalMessage) {
          break;
        }

        const config = vscode.workspace.getConfiguration("commitMessageGenerator");

        if (!config.get("crossCheck")) {
          if (config.get("autoFill")) {
            await setCommitMessage(finalMessage);
            vscode.window.showInformationMessage(
              "Commit message generated!"
            );
          } else {
            await vscode.env.clipboard.writeText(finalMessage);

            vscode.window.showInformationMessage(
              "Commit message generated and copied to clipboard!"
            );
          }
          break;
        }

        // Interactive Menu
        const selection = await vscode.window.showQuickPick(
          [
            { label: "$(check) Accept", description: "Use this message", value: finalMessage },
            { label: "$(sync) Regenerate", description: "Try again" },
            { label: "$(copy) Copy", description: "Copy to clipboard", value: finalMessage }
          ],
          {
            placeHolder: finalMessage,
            ignoreFocusOut: true
          }
        );

        if (!selection) {
          break; // User dismissed menu
        }

        if (selection.label.includes("Accept")) {
          await setCommitMessage(finalMessage);
          break;
        } else if (selection.label.includes("Copy")) {
          await vscode.env.clipboard.writeText(finalMessage);
          vscode.window.showInformationMessage("Copied to clipboard!");
          break;
        } else if (selection.label.includes("Regenerate")) {
          action = "Regenerate";
        }
      }
    }
  );

  let toggleConventionalCommitsDisposable = vscode.commands.registerCommand(
    "extension.toggleConventionalCommits",
    async function () {
      const config = vscode.workspace.getConfiguration("commitMessageGenerator");
      const currentValue = config.get("useConventionalCommits");
      await config.update("useConventionalCommits", !currentValue, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(
        `Conventional Commits are now ${!currentValue ? "Enabled" : "Disabled"}`
      );
    }
  );

  let toggleAutoFillDisposable = vscode.commands.registerCommand(
    "extension.toggleAutoFill",
    async function () {
      const config = vscode.workspace.getConfiguration("commitMessageGenerator");
      const currentValue = config.get("autoFill");
      await config.update("autoFill", !currentValue, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(
        `Auto Fill Commit Message is now ${!currentValue ? "Enabled" : "Disabled"}`
      );
    }
  );

  let setCommitToneDisposable = vscode.commands.registerCommand(
    "extension.setCommitTone",
    async function () {
      const tones = ["Professional", ...Object.keys(tonePrompts)];
      const selectedTone = await vscode.window.showQuickPick(tones, {
        placeHolder: "Select a personality for your commit messages",
      });

      if (selectedTone) {
        await vscode.workspace
          .getConfiguration("commitMessageGenerator")
          .update("tone", selectedTone, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Commit Tone set to: ${selectedTone}`);
      }
    }
  );

  let setCustomPromptDisposable = vscode.commands.registerCommand(
    "extension.setCustomPrompt",
    async function () {
      const config = vscode.workspace.getConfiguration("commitMessageGenerator");
      const currentPrompt = config.get("customPrompt");

      const input = await vscode.window.showInputBox({
        prompt: "Enter your custom system instruction for generating commit messages.",
        value: currentPrompt,
        placeHolder: "e.g., Generate detailed messages with bullet points.",
        ignoreFocusOut: true
      });

      if (input !== undefined) {
        await config.update("customPrompt", input, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Custom Prompt updated.`);
      }
    }
  );

  let toggleCustomPromptDisposable = vscode.commands.registerCommand(
    "extension.toggleCustomPrompt",
    async function () {
      const config = vscode.workspace.getConfiguration("commitMessageGenerator");
      const currentValue = config.get("useCustomPrompt");
      await config.update("useCustomPrompt", !currentValue, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(
        `Custom Prompt is now ${!currentValue ? "Enabled" : "Disabled"}`
      );
    }
  );

  let toggleCrossCheckDisposable = vscode.commands.registerCommand(
    "extension.toggleCrossCheck",
    async function () {
      const config = vscode.workspace.getConfiguration("commitMessageGenerator");
      const currentValue = config.get("crossCheck");
      await config.update("crossCheck", !currentValue, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(
        `Commit Cross-Check is now ${!currentValue ? "Enabled" : "Disabled"}`
      );
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(toggleConventionalCommitsDisposable);
  context.subscriptions.push(toggleAutoFillDisposable);
  context.subscriptions.push(setCommitToneDisposable);
  context.subscriptions.push(setCustomPromptDisposable);
  context.subscriptions.push(toggleCustomPromptDisposable);
  context.subscriptions.push(toggleCrossCheckDisposable);
}
exports.activate = activate;

async function getGitDiff() {
  const exec = require("util").promisify(require("child_process").exec);
  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!cwd) {
    throw new Error("No workspace folder found.");
  }

  const MAX_DIFF_LENGTH = 8000;
  const EXEC_OPTIONS = { cwd, maxBuffer: 1024 * 1024 * 5 };

  try {
    await exec("git rev-parse --is-inside-work-tree", EXEC_OPTIONS);

    let { stdout } = await exec("git diff --cached -- \":(exclude)package-lock.json\"", EXEC_OPTIONS);

    if (!stdout.trim()) {
      ({ stdout } = await exec("git diff -- \":(exclude)package-lock.json\"", EXEC_OPTIONS));
    }

    const diff = stdout.trim();

    if (!diff) {
      return "";
    }

    if (diff.length > MAX_DIFF_LENGTH) {
      console.log(`Diff is too large (${diff.length} chars). Truncating...`);
      return diff.substring(0, MAX_DIFF_LENGTH) + "\n...[Diff truncated due to length]...";
    }

    return diff;
  } catch (error) {
    console.log(error)
    throw new Error("Not inside a Git repository.", error);
  }
}

async function setCommitMessage(message) {
  const gitExtension = vscode.extensions.getExtension('vscode.git');
  if (gitExtension) {
    const git = gitExtension.exports.getAPI(1);
    const repo = git.repositories[0]; // Get the first open repository
    if (repo) {
      repo.inputBox.value = message; // Populates the box
    }
  }
}
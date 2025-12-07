import * as vscode from "vscode";
import { generateCommitMessage, tonePrompts } from "./gemini.js";
import { getGitDiff, setCommitMessage } from "./git.js";
import { cleanAiResponse } from "./utils.js";

export async function generateCommitMessageHandler() {
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
          if (error.response && error.response.status === 429) {
            vscode.window.showErrorMessage(
              "Gemini API rate limit exceeded. Please wait a moment and try again."
            );
          } else {
            vscode.window.showErrorMessage(
              "Unable to generate message: " + error.message
            );
          }
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

export async function toggleConventionalCommitsHandler() {
  const config = vscode.workspace.getConfiguration("commitMessageGenerator");
  const currentValue = config.get("useConventionalCommits");
  await config.update("useConventionalCommits", !currentValue, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(
    `Conventional Commits are now ${!currentValue ? "Enabled" : "Disabled"}`
  );
}

export async function toggleAutoFillHandler() {
  const config = vscode.workspace.getConfiguration("commitMessageGenerator");
  const currentValue = config.get("autoFill");
  await config.update("autoFill", !currentValue, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(
    `Auto Fill Commit Message is now ${!currentValue ? "Enabled" : "Disabled"}`
  );
}

export async function setCommitToneHandler() {
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

export async function setCustomPromptHandler() {
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

export async function toggleCustomPromptHandler() {
  const config = vscode.workspace.getConfiguration("commitMessageGenerator");
  const currentValue = config.get("useCustomPrompt");
  await config.update("useCustomPrompt", !currentValue, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(
    `Custom Prompt is now ${!currentValue ? "Enabled" : "Disabled"}`
  );
}

export async function toggleCrossCheckHandler() {
  const config = vscode.workspace.getConfiguration("commitMessageGenerator");
  const currentValue = config.get("crossCheck");
  await config.update("crossCheck", !currentValue, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(
    `Commit Cross-Check is now ${!currentValue ? "Enabled" : "Disabled"}`
  );
}

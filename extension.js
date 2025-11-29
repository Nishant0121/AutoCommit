const { generateCommitMessage } = require("./gemini");
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
              return;
            }

            // Step 2: Generate Message (Generic text)
            progress.report({ message: "Drafting commit message..." });
            const rawMessage = await generateCommitMessage(gitDiff);

            // Step 3: Clean and Copy
            const finalMessage = cleanAiResponse(rawMessage);

            await vscode.env.clipboard.writeText(finalMessage);

            vscode.window.showInformationMessage(
              "Commit message copied to clipboard!"
            );

          } catch (error) {
            vscode.window.showErrorMessage(
              "Unable to generate message: " + error.message
            );
          }
        }
      );
    }
  );

  context.subscriptions.push(disposable);
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

    let { stdout } = await exec("git diff --cached", EXEC_OPTIONS);

    if (!stdout.trim()) {
      ({ stdout } = await exec("git diff", EXEC_OPTIONS));
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
    throw new Error("Not inside a Git repository.");
  }
}
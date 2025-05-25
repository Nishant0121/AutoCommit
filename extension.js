const { generateCommitMessage } = require("./gemini");
const vscode = require("vscode");

function activate(context) {
  let disposable = vscode.commands.registerCommand(
    "extension.generateCommitMessage",
    async function () {
      try {
        const gitDiff = await getGitDiff();
        const message = await generateCommitMessage(gitDiff);

        await vscode.env.clipboard.writeText(message);
        vscode.window.showInformationMessage(
          "Generated commit message copied to clipboard!"
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          "Failed to generate commit message: " + error.message
        );
      }
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

  try {
    // Confirm it's a Git repo
    await exec("git rev-parse --is-inside-work-tree", { cwd });

    // Get staged diff
    let { stdout } = await exec("git diff --cached", { cwd });

    // If nothing staged, fallback to unstaged
    if (!stdout.trim()) {
      ({ stdout } = await exec("git diff", { cwd }));
    }

    return stdout;
  } catch (error) {
    throw new Error("Not inside a Git repository.");
  }
}

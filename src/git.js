import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function getGitDiff() {
  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!cwd) {
    throw new Error("No workspace folder found.");
  }

  const MAX_DIFF_LENGTH = 8000;
  const EXEC_OPTIONS = { cwd, maxBuffer: 1024 * 1024 * 5 };

  try {
    await execPromise("git rev-parse --is-inside-work-tree", EXEC_OPTIONS);

    let { stdout } = await execPromise('git diff --cached -- ":(exclude)package-lock.json"', EXEC_OPTIONS);

    if (!stdout.trim()) {
      ({ stdout } = await execPromise('git diff -- ":(exclude)package-lock.json"', EXEC_OPTIONS));
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

export async function setCommitMessage(message) {
  const gitExtension = vscode.extensions.getExtension('vscode.git');
  if (gitExtension) {
    const git = gitExtension.exports.getAPI(1);
    const repo = git.repositories[0]; // Get the first open repository
    if (repo) {
      repo.inputBox.value = message; // Populates the box
    }
  }
}

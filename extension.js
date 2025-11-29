const vscode = require("vscode");
const {
  generateCommitMessageCommand,
  toggleConventionalCommitsCommand,
  toggleAutoFillCommand,
  setCommitToneCommand,
  setCustomPromptCommand,
  toggleCustomPromptCommand,
  toggleCrossCheckCommand
} = require("./commands");

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.generateCommitMessage", generateCommitMessageCommand),
    vscode.commands.registerCommand("extension.toggleConventionalCommits", toggleConventionalCommitsCommand),
    vscode.commands.registerCommand("extension.toggleAutoFill", toggleAutoFillCommand),
    vscode.commands.registerCommand("extension.setCommitTone", setCommitToneCommand),
    vscode.commands.registerCommand("extension.setCustomPrompt", setCustomPromptCommand),
    vscode.commands.registerCommand("extension.toggleCustomPrompt", toggleCustomPromptCommand),
    vscode.commands.registerCommand("extension.toggleCrossCheck", toggleCrossCheckCommand)
  );
}

exports.activate = activate;

import * as vscode from "vscode";
import {
  generateCommitMessageHandler,
  toggleConventionalCommitsHandler,
  toggleAutoFillHandler,
  setCommitToneHandler,
  setCustomPromptHandler,
  toggleCustomPromptHandler,
  toggleCrossCheckHandler
} from "./src/commands.js";

export function activate(context) {
  const commands = [
    { id: "extension.generateCommitMessage", handler: generateCommitMessageHandler },
    { id: "extension.toggleConventionalCommits", handler: toggleConventionalCommitsHandler },
    { id: "extension.toggleAutoFill", handler: toggleAutoFillHandler },
    { id: "extension.setCommitTone", handler: setCommitToneHandler },
    { id: "extension.setCustomPrompt", handler: setCustomPromptHandler },
    { id: "extension.toggleCustomPrompt", handler: toggleCustomPromptHandler },
    { id: "extension.toggleCrossCheck", handler: toggleCrossCheckHandler }
  ];

  commands.forEach(command => {
    let disposable = vscode.commands.registerCommand(command.id, command.handler);
    context.subscriptions.push(disposable);
  });
}

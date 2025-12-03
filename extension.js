import * as vscode from "vscode";
import { SidebarProvider } from "./src/sidebarProvider.js";
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
  const sidebarProvider = new SidebarProvider();
  vscode.window.registerTreeDataProvider("autocommit.sidebar", sidebarProvider);

  // Auto-refresh Sidebar on Settings Change
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("commitMessageGenerator")) {
        sidebarProvider.refresh();
      }
    })
  );

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

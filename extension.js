import * as vscode from "vscode";
import { SidebarProvider } from "./src/sidebarProvider.js";
import { handleInlineCodeEdit } from "./src/inlineEdit.js";
import { inlineEditCodeLensProvider } from "./src/codeLensProvider.js";
import { inlineEditState } from "./src/inlineEditState.js";
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

  // Register CodeLens Provider for all languages
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider({ scheme: 'file' }, inlineEditCodeLensProvider)
  );

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
    { id: "extension.toggleCrossCheck", handler: toggleCrossCheckHandler },
    { id: "extension.inlineCodeEdit", handler: handleInlineCodeEdit }
  ];

  commands.forEach(command => {
    let disposable = vscode.commands.registerCommand(command.id, command.handler);
    context.subscriptions.push(disposable);
  });

  // Register Accept/Reject commands for Inline Edit
  context.subscriptions.push(
    vscode.commands.registerCommand('autocommit.acceptInlineEdit', async () => {
      const { editor, originalRange } = inlineEditState;
      if (editor && originalRange) {
        // Accept: Delete the original text (Red), keeping the new text (Green)
        await editor.edit(editBuilder => {
          editBuilder.delete(originalRange);
        });
      }
      inlineEditState.clear();
      inlineEditCodeLensProvider.refresh();
    }),
    vscode.commands.registerCommand('autocommit.rejectInlineEdit', async () => {
      const { editor, newRange } = inlineEditState;
      if (editor && newRange) {
        // Reject: Delete the new text (Green), keeping the original text (Red)
        await editor.edit(editBuilder => {
          editBuilder.delete(newRange);
        });
      }
      inlineEditState.clear();
      inlineEditCodeLensProvider.refresh();
    })
  );
}

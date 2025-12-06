import * as vscode from "vscode";

const _onDidChangeTreeData = new vscode.EventEmitter();

function createSidebarItem(label, commandId, iconName, description = "") {
  const item = new vscode.TreeItem(label, vscode.TreeItemCollapsibleState.None);
  item.command = {
    command: commandId,
    title: label
  };
  item.iconPath = new vscode.ThemeIcon(iconName);
  item.description = description;
  return item;
}

export const sidebarProvider = {
  onDidChangeTreeData: _onDidChangeTreeData.event,

  refresh() {
    _onDidChangeTreeData.fire();
  },

  getTreeItem(element) {
    return element;
  },

  getChildren() {
    const config = vscode.workspace.getConfiguration("commitMessageGenerator");

    const tone = config.get("tone");
    const useConventional = config.get("useConventionalCommits");
    const autoFill = config.get("autoFill");
    const crossCheck = config.get("crossCheck");
    const useCustomPrompt = config.get("useCustomPrompt");
    const customPromptText = config.get("customPrompt");

    return [
      createSidebarItem(
        "Generate Commit Message",
        "extension.generateCommitMessage",
        "sparkle",
        "AI Powered"
      ),
      createSidebarItem(
        "Set Tone",
        "extension.setCommitTone",
        "color-mode",
        useCustomPrompt ? "Ignored (Custom Prompt Active)" : `Current: ${tone}`
      ),
      createSidebarItem(
        "Set Custom Prompt",
        "extension.setCustomPrompt",
        "edit",
        useCustomPrompt ? "Active" : (customPromptText ? "Configured (Inactive)" : "Not configured")
      ),
      createSidebarItem(
        "Conventional Commits",
        "extension.toggleConventionalCommits",
        useConventional ? "check" : "circle-outline",
        useConventional ? "Enabled" : "Disabled"
      ),
      createSidebarItem(
        "Auto Fill",
        "extension.toggleAutoFill",
        autoFill ? "check" : "circle-outline",
        autoFill ? "Enabled" : "Disabled"
      ),
      createSidebarItem(
        "Cross-Check",
        "extension.toggleCrossCheck",
        crossCheck ? "check" : "circle-outline",
        crossCheck ? "Enabled" : "Disabled"
      )
    ];
  }
};

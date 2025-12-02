import * as vscode from "vscode";

export class SidebarProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element) {
    return element;
  }

  getChildren() {
    const config = vscode.workspace.getConfiguration("commitMessageGenerator");

    const tone = config.get("tone");
    const useConventional = config.get("useConventionalCommits");
    const autoFill = config.get("autoFill");
    const crossCheck = config.get("crossCheck");
    const useCustomPrompt = config.get("useCustomPrompt");
    const customPromptText = config.get("customPrompt");

    return [
      new SidebarItem(
        "Generate Commit Message",
        "extension.generateCommitMessage",
        "sparkle",
        "AI Powered"
      ),
      new SidebarItem(
        "Set Tone",
        "extension.setCommitTone",
        "color-mode",
        useCustomPrompt ? "Ignored (Custom Prompt Active)" : `Current: ${tone}`
      ),
      new SidebarItem(
        "Set Custom Prompt",
        "extension.setCustomPrompt",
        "edit",
        useCustomPrompt ? "Active" : (customPromptText ? "Configured (Inactive)" : "Not configured")
      ),
      new SidebarItem(
        "Conventional Commits",
        "extension.toggleConventionalCommits",
        useConventional ? "check" : "circle-outline",
        useConventional ? "Enabled" : "Disabled"
      ),
      new SidebarItem(
        "Auto Fill",
        "extension.toggleAutoFill",
        autoFill ? "check" : "circle-outline",
        autoFill ? "Enabled" : "Disabled"
      ),
      new SidebarItem(
        "Cross-Check",
        "extension.toggleCrossCheck",
        crossCheck ? "check" : "circle-outline",
        crossCheck ? "Enabled" : "Disabled"
      )
    ];
  }
}

class SidebarItem extends vscode.TreeItem {
  constructor(label, commandId, iconName, description = "") {
    super(label, vscode.TreeItemCollapsibleState.None);
    this.command = {
      command: commandId,
      title: label
    };
    this.iconPath = new vscode.ThemeIcon(iconName);
    this.description = description;
  }
}
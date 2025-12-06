import * as vscode from 'vscode';

class InlineEditState {
    constructor() {
        this.editor = null;
        this.originalRange = null; // Range of the original text (to be deleted on Accept)
        this.newRange = null;      // Range of the new text (to be deleted on Reject)
        this.isPending = false;

        // Green decoration for new code
        this.greenDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(0, 255, 0, 0.2)',
            isWholeLine: false,
            overviewRulerColor: 'rgba(0, 255, 0, 0.8)',
            overviewRulerLane: vscode.OverviewRulerLane.Full
        });

        // Red decoration for old code
        this.redDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(255, 0, 0, 0.2)',
            textDecoration: 'line-through', // optional strikethrough
            isWholeLine: false,
            overviewRulerColor: 'rgba(255, 0, 0, 0.8)',
            overviewRulerLane: vscode.OverviewRulerLane.Full
        });
    }

    setPendingState(editor, originalRange, newRange) {
        this.editor = editor;
        this.originalRange = originalRange;
        this.newRange = newRange;
        this.isPending = true;
    }

    clear() {
        if (this.editor) {
            this.editor.setDecorations(this.greenDecorationType, []);
            this.editor.setDecorations(this.redDecorationType, []);
        }
        this.editor = null;
        this.originalRange = null;
        this.newRange = null;
        this.isPending = false;
    }
}

export const inlineEditState = new InlineEditState();
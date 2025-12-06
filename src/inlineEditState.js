import * as vscode from 'vscode';

let editor = null;
let originalRange = null;
let newRange = null;
let isPending = false;

// Decorations
const greenDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
    isWholeLine: false,
    overviewRulerColor: 'rgba(0, 255, 0, 0.8)',
    overviewRulerLane: vscode.OverviewRulerLane.Full
});

const redDecorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    textDecoration: 'line-through', // optional strikethrough
    isWholeLine: false,
    overviewRulerColor: 'rgba(255, 0, 0, 0.8)',
    overviewRulerLane: vscode.OverviewRulerLane.Full
});

export const inlineEditState = {
    get editor() { return editor; },
    get originalRange() { return originalRange; },
    get newRange() { return newRange; },
    get isPending() { return isPending; },
    get greenDecorationType() { return greenDecorationType; },
    get redDecorationType() { return redDecorationType; },

    setPendingState(newEditor, newOriginalRange, newNewRange) {
        editor = newEditor;
        originalRange = newOriginalRange;
        newRange = newNewRange;
        isPending = true;
    },

    clear() {
        if (editor) {
            editor.setDecorations(greenDecorationType, []);
            editor.setDecorations(redDecorationType, []);
        }
        editor = null;
        originalRange = null;
        newRange = null;
        isPending = false;
    }
};

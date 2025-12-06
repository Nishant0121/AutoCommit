import * as vscode from 'vscode';
import { inlineEditState } from './inlineEditState.js';

export class InlineEditCodeLensProvider {
    constructor() {
        this._onDidChangeCodeLenses = new vscode.EventEmitter();
        this.onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;
    }

    refresh() {
        this._onDidChangeCodeLenses.fire();
    }

    provideCodeLenses(document, token) {
        if (!inlineEditState.isPending || !inlineEditState.editor) {
            return [];
        }

        // Only show lenses for the document where the edit happened
        if (document.uri.toString() !== inlineEditState.editor.document.uri.toString()) {
            return [];
        }

        const lenses = [];
        const { originalRange, newRange } = inlineEditState;

        const createLenses = (range) => {
            if (!range) return [];
            const lensRange = new vscode.Range(range.start, range.start);
            
            return [
                new vscode.CodeLens(lensRange, {
                    title: "$(check) Accept Change",
                    command: "autocommit.acceptInlineEdit"
                }),
                new vscode.CodeLens(lensRange, {
                    title: "$(x) Reject Change",
                    command: "autocommit.rejectInlineEdit"
                })
            ];
        };

        // Add lenses for the Original (Red) block
        if (originalRange) {
            lenses.push(...createLenses(originalRange));
        }

        // Add lenses for the New (Green) block
        // We check to ensure we don't duplicate lenses if the ranges start at the exact same position 
        // (though structurally they shouldn't, as New starts where Old ends)
        // We also check if they are on the same line to avoid clutter for small inline edits, 
        // but if the user wants them "before both", we should provide them.
        // However, for single-line replacements, VS Code might stack them: Accept Reject Accept Reject.
        // A safe bet is to show them if the lines are different.
        if (newRange && originalRange && newRange.start.line !== originalRange.start.line) {
             lenses.push(...createLenses(newRange));
        } else if (newRange && !originalRange) {
            // Edge case: only new range exists?
            lenses.push(...createLenses(newRange));
        }

        return lenses;
    }
}

export const inlineEditCodeLensProvider = new InlineEditCodeLensProvider();
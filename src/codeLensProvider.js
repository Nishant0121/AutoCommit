import * as vscode from 'vscode';
import { inlineEditState } from './inlineEditState.js';

const _onDidChangeCodeLenses = new vscode.EventEmitter();

export const inlineEditCodeLensProvider = {
    onDidChangeCodeLenses: _onDidChangeCodeLenses.event,

    refresh() {
        _onDidChangeCodeLenses.fire();
    },

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
        if (newRange && originalRange && newRange.start.line !== originalRange.start.line) {
             lenses.push(...createLenses(newRange));
        } else if (newRange && !originalRange) {
            lenses.push(...createLenses(newRange));
        }

        return lenses;
    }
};

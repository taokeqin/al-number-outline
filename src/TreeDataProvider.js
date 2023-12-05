const vscode = require("vscode");
const fs = require('fs');

class TreeDataProvider {
    constructor(treeData) {
        this.treeData = treeData;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }

    getTreeItem(element) {
        return {
            label: element.label,
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            command: {
                command: 'extension.openFile',
                title: 'Open File',
                arguments: [element],
            },
        };
    }

    getChildren(element) {
        if (!element) {
            return Promise.resolve(this.treeData);
        }

        return Promise.resolve(element.keywordsWithFile.map(item => ({ label: item.keyword, fsPath: item.fsPath })));
    }

    async refresh() {
        const treeData = await this.generateTree();
        this.updateTreeData(treeData);
        this._onDidChangeTreeData.fire();
    }

    updateTreeData(treeData) {
        this.treeData = treeData;
    }

    extractObjectDefinition(content, keyword) {
        const numberRegex = new RegExp(`^${keyword} ([^\n]+)`, "g");
        const matches = content.match(numberRegex);

        return matches ? matches.map(match => match.trim()) : [];
    }

    async generateTree() {
        const rootPath = vscode.workspace.rootPath;

        if (!rootPath) {
            vscode.window.showErrorMessage('No workspace opened.');
            return;
        }

        const files = await vscode.workspace.findFiles(new vscode.RelativePattern(rootPath, '**/*.{al}'));
        const treeData = this.parseFiles(files);
        return treeData;
    }

    parseFiles(files) {
        const documentTypes = ['codeunit', 'pageextension', 'tableextension', 'enumextension', 'permissionset', 'page', 'table', 'report', 'query', 'xmlport', 'enum']
        const treeData = [];
        let matchedObjects = {};
        files.forEach(file => {
            const content = fs.readFileSync(file.fsPath, 'utf-8');
            for (const documentType of documentTypes) {
                const keywords = this.extractObjectDefinition(content, documentType);
                if (keywords.length > 0) {
                    const keywordsWithFile = keywords.map(keyword => { return { keyword, 'fsPath': file.fsPath } });
                    matchedObjects[documentType] = matchedObjects[documentType] || [];
                    matchedObjects[documentType] = matchedObjects[documentType].concat(keywordsWithFile);
                }
            }
        });
        for (const documentType of documentTypes.sort()) {
            if (!matchedObjects[documentType]) {
                continue;
            }
            treeData.push({
                label: documentType,
                keywordsWithFile: matchedObjects[documentType].sort((a, b) => a.keyword.localeCompare(b.keyword)).reverse()
            });
        }

        return treeData;
    }
}

module.exports = TreeDataProvider;
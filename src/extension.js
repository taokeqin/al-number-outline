const vscode = require("vscode");

const TreeDataProvider = require('./TreeDataProvider');

function initTreeView() {
  vscode.window.createTreeView('treeView', { treeDataProvider });

  vscode.commands.registerCommand('extension.refreshTree', () => {
    treeDataProvider.refresh();
  });

  // Register a command to handle item click
  vscode.commands.registerCommand('extension.openFile', (resource) => {
    if (resource.fsPath) {
      vscode.workspace.openTextDocument(resource.fsPath).then(doc => {
        vscode.window.showTextDocument(doc);
      });
    }
  });
}

const treeDataProvider = new TreeDataProvider([]);


async function activate() {
  initTreeView();
  vscode.workspace.onDidSaveTextDocument(async (document) => {
    if (document.fileName.includes('src') && document.languageId === 'al') {
      await treeDataProvider.refresh();
    }
  });

  await treeDataProvider.refresh();
}

function deactivate() { }

module.exports = {
  activate,
  deactivate,
};

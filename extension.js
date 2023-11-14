const shelljs = require("shelljs");
const os = require("os");
const vscode = require("vscode");

const settingsDIR = `${os.homedir()}/.local/share/code-server/User`;
const config = vscode.workspace.getConfiguration("sync");
const gistsID = config.get("GistsID");
const githubToken = config.get("GithubToken");

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

async function downloadSettings() {
  const gistsURL = `https://gist.githubusercontent.com/yokowasis/${gistsID}/raw/settings.json`;
  const s = await (await fetch(gistsURL)).text();
  shelljs.ShellString(s).to(`${settingsDIR}/settings.json`);
}

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "sync" is now active!');

  console.log(gistsID);
  console.log(githubToken);

  // console.log(shelljs.cat(`${settingsDIR}/settings.json`));

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    "sync.helloWorld",
    function () {
      // The code you place here will be executed every time your command is executed

      // Display a message box to the user
      vscode.window.showInformationMessage("Hello World from sync!");
    }
  );

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

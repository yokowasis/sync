// @ts-check
/** @typedef {import("./types").GistsGetResponse} GistsGetResponse */
// @ts-ignore
/** @typedef {import("ky").KyInstance} KyInstance */

const shelljs = require("shelljs");
const os = require("os");
const vscode = require("vscode");

const settingsDIR = `${os.homedir()}/.local/share/code-server/User`;
const config = vscode.workspace.getConfiguration("sync");
const gistsID = config.get("GistsID");
const githubToken = config.get("GithubToken");

/** @type {KyInstance} */
let ky;

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

async function updateGists() {
  const url = `https://api.github.com/gists/${gistsID}`;
  console.log(gistsID);
  console.log(githubToken);

  const settings = shelljs.cat(`${settingsDIR}/settings.json`);
  const keybindings = shelljs.cat(`${settingsDIR}/keybindings.json`);
  const snippets = shelljs.cat(`${settingsDIR}/snippets/global.code-snippets`);
  const extensions = getAllExtension();

  const res = await ky
    .patch(url, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
        Accept: "application/vnd.github+json",
      },
      json: {
        description: "An updated gist description",
        files: {
          "settings.json": { content: settings },
          "snippets.json": { content: snippets },
          "keybindings.json": { content: keybindings },
          "extensions.json": { content: JSON.stringify(extensions) },
        },
      },
    })
    .json();
  console.log(res);
}

async function downloadSettings() {
  /** @type {GistsGetResponse} */
  const gists = await ky
    .get(`https://api.github.com/gists/${gistsID}`, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${githubToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    })
    .json();

  const files = gists.files;

  const settings = files["settings.json"].content;
  const keybindings = files["keybindings.json"].content;
  const snippets = files["snippets.json"].content;
  const extensions = JSON.parse(files["extensions.json"].content);

  shelljs.ShellString(settings).to(`${settingsDIR}/settings.json`);
  shelljs.ShellString(keybindings).to(`${settingsDIR}/keybindings.json`);
  shelljs.mkdir(`${settingsDIR}/snippets`);
  shelljs
    .ShellString(snippets)
    .to(`${settingsDIR}/snippets/global.code-snippets`);

  for (const extension of extensions) {
    installExtension(extension);
  }
}

function getAllExtension() {
  const allExtensions = vscode.extensions.all;

  /** @type {string[]} */
  const extensions = [];

  for (const ex of allExtensions) {
    if (
      ex.packageJSON.publisher === "vscode" ||
      ex.packageJSON.publisher === "ms-vscode"
    )
      continue;
    extensions.push(`${ex.packageJSON.publisher}.${ex.packageJSON.name}`);
  }
  return extensions;
}

/**
 *
 * @param {string} extensionId
 */
async function installExtension(extensionId) {
  try {
    // Trigger the 'workbench.extensions.installExtension' command
    await vscode.commands.executeCommand(
      "workbench.extensions.installExtension",
      extensionId
    );
    console.log(`Extension ${extensionId} installed successfully.`);
  } catch (error) {
    console.error(`Error installing extension ${extensionId}: ${error}`);
  }
}

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  console.log('Congratulations,aaa your extension "sync" is now active!');
  ky = (await import("ky")).default;

  //   downloadSettings();
  //   updateGists();

  // console.log(gistsID);
  // console.log(githubToken);

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

// @ts-check
/** @typedef {import("./types").GistsGetResponse} GistsGetResponse */

const f = require("./fetch");
const shelljs = require("shelljs");
const os = require("os");
const currentOS = os.platform();
const vscode = require("vscode");

const outputChannel = vscode.window.createOutputChannel("Code-Server Sync");

let settingsDIR = "";
if (currentOS === "win32") {
  settingsDIR = `${os.homedir()}\\AppData\\Local\\code-server\\Data\\User`;
} else {
  settingsDIR = `${os.homedir()}/.local/share/code-server/User`;
}
const config = vscode.workspace.getConfiguration("sync");
const gistsID = config.get("GistsID");
const githubToken = config.get("GithubToken");

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

async function updateGists() {
  const url = `https://api.github.com/gists/${gistsID}`;
  outputChannel.appendLine(url);
  outputChannel.appendLine(gistsID);
  outputChannel.appendLine(githubToken);

  const settings = shelljs.cat(`${settingsDIR}/settings.json`);
  const keybindings = shelljs.cat(`${settingsDIR}/keybindings.json`);
  const snippets = shelljs.cat(`${settingsDIR}/snippets/global.code-snippets`);
  const extensions = getAllExtension();

  const res = await (
    await f.fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        description: "An updated gist description",
        files: {
          "settings.json": { content: settings },
          "snippets.json": { content: snippets },
          "keybindings.json": { content: keybindings },
          "extensions.json": { content: JSON.stringify(extensions) },
        },
      }),
    })
  ).json();

  outputChannel.appendLine(JSON.stringify(res, null, 2));

  vscode.window.showInformationMessage("Settings uploaded successfully");
}

async function downloadSettings() {
  /** @type {GistsGetResponse} */
  const gists = /** @type {*} */ (
    await (
      await f.fetch(`https://api.github.com/gists/${gistsID}`, {
        method: "GET",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${githubToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
      })
    ).json()
  );

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

  const promises = [];

  for (const extension of extensions) {
    promises.push(installExtension(extension));
  }

  Promise.allSettled(promises).then(() => {
    vscode.window.showInformationMessage("Settings downloaded successfully");
  });
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

  let command1 = vscode.commands.registerCommand(
    "sync.downloadSettings",
    downloadSettings
  );

  let command2 = vscode.commands.registerCommand(
    "sync.uploadSettings",
    updateGists
  );

  context.subscriptions.push(command1);
  context.subscriptions.push(command2);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

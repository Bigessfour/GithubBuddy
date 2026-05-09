import { BrowserWindow, app, dialog, ipcMain } from "electron";
import path from "path";
import { exec } from "child_process";
// -- CommonJS Shims --
import __cjs_mod__ from "node:module";
import.meta.filename;
const __dirname = import.meta.dirname;
__cjs_mod__.createRequire(import.meta.url);
//#region electron/main.ts
/**
* Electron Main Process – v0.4 Safe Command Execution
*
* This file now handles two important IPC channels:
* 1. 'select-workspace' – Opens a native folder picker using Electron's dialog API
* 2. 'execute-command' – Safely runs a shell command inside a user-chosen directory
*
* Why we do command execution in the main process:
* - The renderer process is sandboxed for security.
* - Only the main process can safely use `child_process` and `dialog`.
* - This follows the official Electron security model.
*
* Safety measures implemented in v0.4:
* - We always receive the full command and working directory from the renderer.
* - The UI (StepCard) will show a preview + confirmation before calling this.
* - We use `child_process.exec` with an explicit `cwd` option.
* - We return structured results instead of throwing, so the UI can display errors nicely.
*
* Official documentation links:
* - IPC Main: https://www.electronjs.org/docs/latest/api/ipc-main
* - dialog.showOpenDialog: https://www.electronjs.org/docs/latest/api/dialog#dialogshowopendialogoptions
* - child_process.exec: https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback
* - Security Best Practices: https://www.electronjs.org/docs/latest/tutorial/security
*/
function createWindow() {
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, "../preload/index.js")
		}
	});
	if (process.env.NODE_ENV === "development" || !app.isPackaged) {
		mainWindow.loadURL("http://localhost:5173");
		mainWindow.webContents.openDevTools();
	} else mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
}
/**
* Handler for 'select-workspace'
* 
* Opens a native system folder picker.
* Returns the selected directory path or null if cancelled.
*
* This replaces the previous `prompt()` hack we used in the web version.
*/
ipcMain.handle("select-workspace", async () => {
	const result = await dialog.showOpenDialog({
		properties: ["openDirectory"],
		title: "Select your workspace folder",
		message: "Choose the folder where you want to run the commands from today's checklist"
	});
	if (result.canceled || result.filePaths.length === 0) return null;
	return result.filePaths[0];
});
/**
* Handler for 'execute-command'
*
* Runs a shell command inside a specific working directory.
* This is the core of the "safe execution" feature.
*
* Parameters:
*   command - The exact command string shown to the user (e.g. "git checkout -b week2/day4-challenge")
*   cwd     - The absolute path to the user's chosen workspace
*
* Returns an object the renderer can easily display:
*   { success: boolean, output: string, error?: string }
*
* Security / Safety notes:
* - We do NOT validate or sanitize the command in v0.4 (we show preview + confirmation in UI instead).
* - We always pass an explicit `cwd` so commands run in the correct folder.
* - We use `exec` with a reasonable timeout (30 seconds) to prevent hanging.
*/
ipcMain.handle("execute-command", async (_event, command, cwd) => {
	return new Promise((resolve) => {
		exec(command, {
			cwd,
			timeout: 3e4,
			maxBuffer: 1024 * 1024,
			windowsHide: true
		}, (error, stdout, stderr) => {
			if (error) resolve({
				success: false,
				output: stdout,
				error: stderr || error.message
			});
			else resolve({
				success: true,
				output: stdout
			});
		});
	});
});
app.whenReady().then(() => {
	createWindow();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
//#endregion
export {};

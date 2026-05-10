#!/usr/bin/env node
/**
 * Ensures the platform Electron binary exists under node_modules/electron/dist.
 *
 * electron-vite throws `Error: Electron uninstall` when node_modules/electron/path.txt
 * is missing — common after `npm install --ignore-scripts`, a failed postinstall, or a
 * partial copy of node_modules. This script re-runs the official electron/install.js
 * when needed (idempotent when already installed).
 *
 * @see https://www.electronjs.org/docs/latest/tutorial/installation
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const electronDir = path.join(root, "node_modules", "electron");
const pathTxt = path.join(electronDir, "path.txt");

function readRelativeExecutable() {
  if (!fs.existsSync(pathTxt)) return "";
  return fs.readFileSync(pathTxt, "utf8").trim();
}

function hasExecutable() {
  const rel = readRelativeExecutable();
  if (!rel) return false;
  const exe = path.join(electronDir, "dist", rel);
  return fs.existsSync(exe);
}

function runElectronInstall() {
  const installJs = path.join(electronDir, "install.js");
  if (!fs.existsSync(installJs)) {
    console.error(
      "[ensure-electron] Missing node_modules/electron/install.js. Run `npm install` from the project root.",
    );
    process.exit(1);
  }
  console.log(
    "[ensure-electron] Electron binary missing or incomplete; running install.js (download)…",
  );
  const result = spawnSync(process.execPath, [installJs], {
    cwd: electronDir,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  if (!hasExecutable()) {
    console.error(
      "[ensure-electron] Binary still missing after install. Check network, disk space, and corporate proxies.",
    );
    process.exit(1);
  }
}

if (!fs.existsSync(electronDir)) {
  console.error(
    "[ensure-electron] node_modules/electron not found. Run `npm install` (use `npm install --legacy-peer-deps` if npm reports peer conflicts).",
  );
  process.exit(1);
}

if (!hasExecutable()) {
  runElectronInstall();
}

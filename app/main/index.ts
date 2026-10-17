// Must stay the first import: keeps the settings folder at its original
// location now that the app has a Chinese name.
import "./lib/user-data-path";
import { app } from "electron";
import electronDebug from "electron-debug";
import log from "electron-log";
import { refreshAutoLaunch, setAutoLauch } from "./lib/auto-launch";
import { initBreaks } from "./lib/breaks";
import "./lib/ipc";
import { blockNetworkBeforeReady, blockNetworkRequests } from "./lib/offline";
import {
  getAppInitialized,
  getLoginItemRefreshed,
  getSettings,
  setLoginItemRefreshed,
} from "./lib/store";
import { initTray } from "./lib/tray";
import { createSettingsWindow, createSoundsWindow } from "./lib/windows";

blockNetworkBeforeReady();

const gotTheLock = app.requestSingleInstanceLock();

app.on("second-instance", (event, commandLine, workingDirectory) => {
  log.info("Second instance detected, opening settings window");
  log.info(`Command line: ${commandLine}`);
  log.info(`Working directory: ${workingDirectory}`);
  createSettingsWindow();
});

app.on("activate", () => {
  log.info("App activated, opening settings window");
  createSettingsWindow();
});

if (!gotTheLock) {
  log.info("App already running");
  app.exit();
}

// Chinese fork: automatic updates are intentionally removed. Updating from the
// upstream release feed would silently replace this build with the English
// original and would be the app's only network access.

if (process.env.NODE_ENV === "production") {
  const sourceMapSupport = require("source-map-support");
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === "development" ||
  process.env.DEBUG_PROD === "true"
) {
  electronDebug();
}

// function installExtensions() {
//   const installer = require('electron-devtools-installer')
//   const forceDownload = !!process.env.UPGRADE_EXTENSIONS
//   const extensions = ['REACT_DEVELOPER_TOOLS']
//
//   return Promise.all(
//     extensions.map(name => installer.default(installer[name], forceDownload))
//   ).catch(console.log)
// }

// Don't exit on close all windows - live in tray
app.on("window-all-closed", () => {
  // Pass
});

app.on("ready", async () => {
  blockNetworkRequests();

  if (
    process.env.NODE_ENV === "development" ||
    process.env.DEBUG_PROD === "true"
  ) {
    // Extensions are broken on electron 10
    // await installExtensions()
  }

  // Required for notifications to work on windows
  if (process.platform === "win32") {
    app.setAppUserModelId("com.tomjwatson.breaktimer");
  }

  if (process.platform === "darwin") {
    app.dock?.hide();
  }

  const appInitialized = getAppInitialized();

  if (!appInitialized) {
    if (process.env.NODE_ENV !== "development") {
      setAutoLauch(true);
      // A fresh install creates its login item here; nothing to refresh.
      setLoginItemRefreshed();
    }
    // Show settings window on first launch instead of notification
    createSettingsWindow();
    // Don't set app as initialized yet - we'll do that after the user dismisses the modal
  } else if (
    process.env.NODE_ENV !== "development" &&
    getSettings().autoLaunch &&
    !getLoginItemRefreshed() &&
    app.isInApplicationsFolder()
  ) {
    // App has been initialized before, don't show settings automatically.
    // Chinese fork: the app was renamed (BreakTimer.app → 番茄钟.app), so the
    // existing login item points at the old app. Re-create it once it has
    // worked; if the user declines the permission prompt, try again next time.
    refreshAutoLaunch()
      .then(() => setLoginItemRefreshed())
      .catch((error) => log.warn(`Could not refresh login item: ${error}`));
  }

  initBreaks();
  initTray();
  createSoundsWindow();
});

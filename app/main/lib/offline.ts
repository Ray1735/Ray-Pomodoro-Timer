import { app, session } from "electron";
import log from "electron-log";

// Chinese fork: this build is meant to stay completely offline.
//
// The app itself has no network features any more (auto-update was removed),
// and these guards also shut the door at the browser-engine level, in case any
// code ever tried to reach the network:
// - every hostname lookup fails, so no server address can be resolved;
// - every http(s) / ws(s) request from any window is cancelled and logged;
// - the spellchecker is off, so it never downloads dictionaries.
//
// Development mode is left alone because it loads pages from a local dev
// server (localhost:1212).
const isDevelopment = process.env.NODE_ENV === "development";

// Must run before the app is ready (command-line switches are read at startup).
export function blockNetworkBeforeReady(): void {
  if (isDevelopment) return;
  app.commandLine.appendSwitch("host-resolver-rules", "MAP * ~NOTFOUND");
}

// Must run once the app is ready, before any window is created.
export function blockNetworkRequests(): void {
  if (isDevelopment) return;

  const ses = session.defaultSession;
  ses.setSpellCheckerEnabled(false);
  ses.webRequest.onBeforeRequest(
    { urls: ["http://*/*", "https://*/*", "ws://*/*", "wss://*/*"] },
    (details, callback) => {
      log.warn(`Blocked network request: ${details.url}`);
      callback({ cancel: true });
    },
  );
}

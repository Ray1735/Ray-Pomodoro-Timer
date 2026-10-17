import { app, session } from "electron";
import log from "electron-log";
import { disableNodeNetworking } from "./offline-node";

// Chinese fork: this build is meant to stay completely offline.
//
// The app has no network features (auto-update was removed). On top of that,
// every network path the app's code could use is closed:
//
// Browser engine (renderer windows and Electron's `net` module):
// - every hostname lookup fails, so no server address can be resolved;
// - all traffic is forced through a proxy at 127.0.0.1:9 where nothing
//   listens, so even requests to a raw IP address go nowhere (loopback
//   included, via "<-loopback>");
// - WebRTC may not send UDP outside that (dead) proxy;
// - every http(s) / ws(s) request is cancelled and logged;
// - the spellchecker is off, so it never downloads dictionaries.
//
// Node.js (main process): TCP, UDP, DNS and fetch are disabled, see
// offline-node.ts.
//
// Development mode is left alone because it loads pages from a local dev
// server (localhost:1212).
const isDevelopment = process.env.NODE_ENV === "development";

function reportBlocked(kind: string, detail: string): void {
  log.warn(`Blocked network request: ${kind} ${detail}`);
}

// Must run before the app is ready (command-line switches are read at startup).
export function blockNetworkBeforeReady(): void {
  if (isDevelopment) return;

  disableNodeNetworking(reportBlocked);

  app.commandLine.appendSwitch("host-resolver-rules", "MAP * ~NOTFOUND");
  app.commandLine.appendSwitch("proxy-server", "127.0.0.1:9");
  app.commandLine.appendSwitch("proxy-bypass-list", "<-loopback>");
  app.commandLine.appendSwitch(
    "force-webrtc-ip-handling-policy",
    "disable_non_proxied_udp",
  );
}

// Must run once the app is ready, before any window is created.
export function blockNetworkRequests(): void {
  if (isDevelopment) return;

  const ses = session.defaultSession;
  ses.setSpellCheckerEnabled(false);
  ses.webRequest.onBeforeRequest(
    { urls: ["http://*/*", "https://*/*", "ws://*/*", "wss://*/*"] },
    (details, callback) => {
      reportBlocked("web", details.url);
      callback({ cancel: true });
    },
  );
}

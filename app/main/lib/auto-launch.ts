import AutoLaunch from "auto-launch";

let app = { name: "BreakTimer" };

if (process.env.APPIMAGE) {
  app = Object.assign(app, { path: process.env.APPIMAGE });
}

const AppLauncher = new AutoLaunch(app);

// Chinese fork: delete the existing login item (it may point at the old
// BreakTimer.app) and add it again for the current app location.
export async function refreshAutoLaunch(): Promise<void> {
  if (process.env.NODE_ENV === "development") return;
  try {
    await AppLauncher.disable();
  } catch {
    // No existing login item to remove.
  }
  await AppLauncher.enable();
}

export function setAutoLauch(autoLaunch: boolean): void {
  if (process.env.NODE_ENV !== "development") {
    if (autoLaunch) {
      AppLauncher.enable();
    } else {
      AppLauncher.disable();
    }
  }
}

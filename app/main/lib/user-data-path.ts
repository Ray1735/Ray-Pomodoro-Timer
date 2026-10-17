import { app } from "electron";
import path from "path";

// Chinese fork: the app is now called "番茄钟", which would move its data
// folder to ~/Library/Application Support/番茄钟 and leave existing settings
// behind. Keep using the original "BreakTimer" folder instead.
//
// This runs on import, so it must be the first thing index.ts imports, before
// any module that opens the settings store.
app.setPath("userData", path.join(app.getPath("appData"), "BreakTimer"));

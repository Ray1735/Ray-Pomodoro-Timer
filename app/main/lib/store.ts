import Store from "electron-store";
import { defaultSettings, Settings } from "../../types/settings";
import { setAutoLauch } from "./auto-launch";
import { initBreaks, resetTimeSinceLastBreak } from "./breaks";

interface Migration {
  version: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrate: (settings: any) => any;
}

const migrations: Migration[] = [
  {
    version: 1,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    migrate: (settings: any) => {
      // Working hours migration
      if (
        settings.workingHoursMonday &&
        typeof settings.workingHoursMonday === "boolean"
      ) {
        console.log("Migrating working hours settings to new format");

        const oldToNew = (from: Date, to: Date) => ({
          fromMinutes: from.getHours() * 60 + from.getMinutes(),
          toMinutes: to.getHours() * 60 + to.getMinutes(),
        });

        const defaultRange = oldToNew(
          new Date(settings.workingHoursFrom),
          new Date(settings.workingHoursTo),
        );

        [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ].forEach((day) => {
          const key = `workingHours${day}`;
          settings[key] = {
            enabled: settings[key],
            ranges: [defaultRange],
          };
        });

        delete settings.workingHoursFrom;
        delete settings.workingHoursTo;
      }
      return settings;
    },
  },
  {
    version: 2,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    migrate: (settings: any) => {
      // Date to seconds migration
      if (settings.breakFrequency && !settings.breakFrequencySeconds) {
        console.log("Migrating date-based settings to seconds");

        const extractSeconds = (dateValue: string | Date): number => {
          const date = new Date(dateValue);
          const hours = date.getHours();
          const minutes = date.getMinutes();
          const seconds = date.getSeconds();
          return hours * 3600 + minutes * 60 + seconds;
        };

        // Convert Date objects to seconds
        if (settings.breakFrequency) {
          settings.breakFrequencySeconds = extractSeconds(
            settings.breakFrequency,
          );
          delete settings.breakFrequency;
        }

        if (settings.breakLength) {
          settings.breakLengthSeconds = extractSeconds(settings.breakLength);
          delete settings.breakLength;
        }

        if (settings.postponeLength) {
          settings.postponeLengthSeconds = extractSeconds(
            settings.postponeLength,
          );
          delete settings.postponeLength;
        }

        if (settings.idleResetLength) {
          settings.idleResetLengthSeconds = extractSeconds(
            settings.idleResetLength,
          );
          delete settings.idleResetLength;
        }
      }
      return settings;
    },
  },
];

const store = new Store({
  defaults: {
    settings: defaultSettings,
    appInitialized: false,
    settingsVersion: 0,
    disableEndTime: null,
    // Chinese fork bookkeeping, kept apart from the original settingsVersion so
    // future upstream migrations don't collide with ours.
    zhSettingsVersion: 0,
    zhLoginItemRefreshed: false,
  },
});

// Chinese fork: one-time adjustments for people upgrading from earlier builds.
const ZH_SETTINGS_VERSION = 1;

function applyForkMigrations(): void {
  const version = store.get("zhSettingsVersion") as number;
  if (version >= ZH_SETTINGS_VERSION) return;

  const settings = store.get("settings") as Partial<Settings>;
  store.set("settings", {
    ...settings,
    // The menu bar now shows a progress ring instead of minutes by default.
    trayTextEnabled: false,
    // Breaks now cover the whole screen: upgrade the old 70% default.
    backdropOpacity:
      settings.backdropOpacity === 0.7 ? 1 : settings.backdropOpacity,
  } as Settings);
  store.set("zhSettingsVersion", ZH_SETTINGS_VERSION);
}

applyForkMigrations();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateSettings(settings: any): Settings {
  let currentVersion = store.get("settingsVersion") as number;
  const pendingMigrations = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  if (pendingMigrations.length > 0) {
    console.log(
      `Running migrations from version ${currentVersion} to ${
        pendingMigrations[pendingMigrations.length - 1].version
      }`,
    );

    let migratedSettings = { ...settings };

    for (const migration of pendingMigrations) {
      try {
        console.log(`Applying migration version ${migration.version}`);
        migratedSettings = migration.migrate(migratedSettings);
        currentVersion = migration.version;
      } catch (error) {
        console.error(
          `Failed to apply migration version ${migration.version}:`,
          error,
        );
        break;
      }
    }

    // Save migrated settings and update version
    store.set("settings", migratedSettings);
    store.set("settingsVersion", currentVersion);

    console.log(`Migrations completed. New version: ${currentVersion}`);
    return migratedSettings;
  }

  return settings;
}

// Chinese fork: people switching from the English build still have the old
// English default title/message saved. Show the Chinese defaults instead,
// but leave any text the user wrote themselves untouched.
const LEGACY_ENGLISH_BREAK_TITLES = ["Time for a break.", "Time for a break!"];
const LEGACY_ENGLISH_BREAK_MESSAGES = [
  "Rest your eyes.\nStretch your legs.\nBreathe. Relax.",
  "Rest your eyes. Stretch your legs. Breathe. Relax.",
];

function localizeLegacyDefaults(settings: Settings): Settings {
  return {
    ...settings,
    breakTitle: LEGACY_ENGLISH_BREAK_TITLES.includes(settings.breakTitle)
      ? defaultSettings.breakTitle
      : settings.breakTitle,
    breakMessage: LEGACY_ENGLISH_BREAK_MESSAGES.includes(settings.breakMessage)
      ? defaultSettings.breakMessage
      : settings.breakMessage,
  };
}

export function getSettings(): Settings {
  const settings = store.get("settings");
  const migratedSettings = migrateSettings(settings);
  return localizeLegacyDefaults(
    Object.assign({}, defaultSettings, migratedSettings) as Settings,
  );
}

export function setSettings(settings: Settings, resetBreaks = true): void {
  const currentSettings = getSettings();

  if (currentSettings.autoLaunch !== settings.autoLaunch) {
    setAutoLauch(settings.autoLaunch);
  }

  store.set({ settings });

  if (!currentSettings.breaksEnabled && settings.breaksEnabled) {
    resetTimeSinceLastBreak("Reset time since last break [enable]");
  }

  if (resetBreaks) {
    initBreaks();
  }
}

export function getAppInitialized(): boolean {
  return store.get("appInitialized") as boolean;
}

export function setAppInitialized(): void {
  store.set({ appInitialized: true });
}

export function getLoginItemRefreshed(): boolean {
  return store.get("zhLoginItemRefreshed") as boolean;
}

export function setLoginItemRefreshed(): void {
  store.set({ zhLoginItemRefreshed: true });
}

export function setBreaksEnabled(breaksEnabled: boolean): void {
  const settings: Settings = getSettings();
  setSettings({ ...settings, breaksEnabled }, false);
}

export function setDisableEndTime(endTime: number | null): void {
  store.set("disableEndTime", endTime);
}

export function getDisableEndTime(): number | null {
  return store.get("disableEndTime");
}

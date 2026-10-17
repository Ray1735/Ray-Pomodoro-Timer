import type { PowerMonitor } from "electron";
import moment from "moment";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  defaultSettings,
  NotificationType,
  Settings,
} from "../../types/settings";

const harness = vi.hoisted(() => ({
  buildTray: vi.fn(),
  createBreakWindows: vi.fn(),
  getSystemIdleState: vi.fn<PowerMonitor["getSystemIdleState"]>(() => "active"),
  powerMonitor: {} as Pick<PowerMonitor, "getSystemIdleState">,
  settings: {} as Settings,
}));

vi.mock("electron", () => ({}));
vi.mock("electron-log", () => ({ default: { info: vi.fn() } }));
vi.mock("./ipc", () => ({ sendIpc: vi.fn() }));
vi.mock("./notifications", () => ({ showNotification: vi.fn() }));
vi.mock("./store", () => ({ getSettings: () => harness.settings }));
vi.mock("./tray", () => ({ buildTray: harness.buildTray }));
vi.mock("./windows", () => ({
  createBreakWindows: harness.createBreakWindows,
}));

describe("manual breaks", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    harness.settings = {
      ...defaultSettings,
      notificationType: NotificationType.Popup,
    };
  });

  it("starts immediately without waiting for the automatic scheduler", async () => {
    const breaks = await import("./breaks.js");

    breaks.startBreakNow();

    expect(harness.createBreakWindows).toHaveBeenCalledOnce();
    expect(breaks.isHavingBreak()).toBe(true);
    expect(breaks.wasStartedFromTray()).toBe(true);
    expect(
      Math.abs(breaks.getBreakTime()?.diff(moment()) ?? Infinity),
    ).toBeLessThan(1000);
  });
});

describe("system suspension", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-24T09:00:00Z"));
    vi.resetModules();
    vi.clearAllMocks();
    harness.getSystemIdleState.mockReturnValue("active");
    harness.powerMonitor = {
      getSystemIdleState: harness.getSystemIdleState,
    };
    harness.settings = {
      ...defaultSettings,
      breakFrequencySeconds: 60,
      idleResetLengthSeconds: 5,
      workingHoursEnabled: false,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not count a long suspension as active time", async () => {
    const breaks = await import("./breaks.js");
    breaks.initBreaks(harness.powerMonitor);
    vi.advanceTimersByTime(1000);

    vi.setSystemTime(new Date("2026-08-24T09:02:00Z"));
    vi.advanceTimersByTime(1000);

    expect(breaks.getTimeSinceLastCompletedBreak()).toBe(0);
    expect(breaks.getBreakTime()?.diff(moment(), "seconds")).toBe(60);
  });

  it("detects suspension even if the machine was already locked", async () => {
    harness.getSystemIdleState.mockReturnValue("locked");
    const breaks = await import("./breaks.js");
    breaks.initBreaks(harness.powerMonitor);
    vi.advanceTimersByTime(1000);

    vi.setSystemTime(new Date("2026-08-24T09:02:00Z"));
    vi.advanceTimersByTime(1000);

    expect(breaks.getTimeSinceLastCompletedBreak()).toBe(0);
  });
});

// Chinese fork: snoozing with a chosen length ("推迟更久").
describe("snooze length", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-24T09:00:00Z"));
    vi.resetModules();
    vi.clearAllMocks();
    harness.settings = {
      ...defaultSettings,
      notificationType: NotificationType.Popup,
      postponeLengthSeconds: 180,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the normal snooze length when none is given", async () => {
    const breaks = await import("./breaks.js");
    breaks.postponeBreak("snoozed");
    expect(breaks.getBreakTime()?.diff(moment(), "seconds")).toBe(180);
  });

  it("uses the chosen length for a longer snooze", async () => {
    const breaks = await import("./breaks.js");
    breaks.postponeBreak("snoozed", 600);
    expect(breaks.getBreakTime()?.diff(moment(), "seconds")).toBe(600);
    expect(breaks.getBreakScheduledAt()?.diff(moment(), "seconds")).toBe(0);
  });

  it("falls back to the normal length for invalid values", async () => {
    for (const bad of [0, -60, Number.NaN, Infinity, 2 * 86400, "600", {}]) {
      vi.resetModules();
      const breaks = await import("./breaks.js");
      breaks.postponeBreak("snoozed", bad);
      expect(breaks.getBreakTime()?.diff(moment(), "seconds")).toBe(180);
    }
  });

  it("ends a running break without counting it as completed", async () => {
    const breaks = await import("./breaks.js");
    breaks.startBreakNow();
    breaks.startBreakTracking();
    const before = breaks.getTimeSinceLastCompletedBreak();

    vi.advanceTimersByTime(90_000);
    breaks.postponeBreak("snoozed", 900);
    breaks.endPopupBreak();

    expect(breaks.isHavingBreak()).toBe(false);
    expect(breaks.getBreakTime()?.diff(moment(), "seconds")).toBe(900);
    // Still counting from before the break: the snoozed break didn't count.
    expect(breaks.getTimeSinceLastCompletedBreak()).toBe((before ?? 0) + 90);
  });

  it("ignores the length for a skip", async () => {
    harness.settings = { ...harness.settings, breakFrequencySeconds: 1500 };
    const breaks = await import("./breaks.js");
    breaks.postponeBreak("skipped", 600);
    expect(breaks.getBreakTime()?.diff(moment(), "seconds")).toBe(1500);
  });
});

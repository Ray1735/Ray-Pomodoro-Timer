import { describe, expect, it } from "vitest";
import {
  formatDuration,
  formatSnoozeLabel,
  formatTimeSinceLastBreak,
} from "./utils";

describe("formatSnoozeLabel", () => {
  it("shows whole minutes", () => {
    expect(formatSnoozeLabel(3 * 60)).toBe("推迟 3 分钟");
    expect(formatSnoozeLabel(5 * 60)).toBe("推迟 5 分钟");
  });

  it("shows seconds-only and mixed lengths", () => {
    expect(formatSnoozeLabel(30)).toBe("推迟 30 秒");
    expect(formatSnoozeLabel(90)).toBe("推迟 1 分钟 30 秒");
  });

  it("shows hours", () => {
    expect(formatSnoozeLabel(3600)).toBe("推迟 1 小时");
    expect(formatSnoozeLabel(5400)).toBe("推迟 1 小时 30 分钟");
  });

  it("falls back to a bare label for zero", () => {
    expect(formatSnoozeLabel(0)).toBe("推迟");
  });
});

describe("formatTimeSinceLastBreak", () => {
  it("formats in Chinese", () => {
    expect(formatTimeSinceLastBreak(30)).toBe("距上次休息不到 1 分钟");
    expect(formatTimeSinceLastBreak(25 * 60)).toBe("距上次休息已过 25 分钟");
    expect(formatTimeSinceLastBreak(3600)).toBe("距上次休息已过 1 小时");
    expect(formatTimeSinceLastBreak(3600 + 5 * 60)).toBe(
      "距上次休息已过 1 小时 5 分钟",
    );
  });
});

describe("formatDuration", () => {
  it("formats the longer snooze choices", () => {
    expect(formatDuration(5 * 60)).toBe("5 分钟");
    expect(formatDuration(10 * 60)).toBe("10 分钟");
    expect(formatDuration(15 * 60)).toBe("15 分钟");
    expect(formatDuration(90 * 60)).toBe("1 小时 30 分钟");
    expect(formatDuration(0)).toBe("");
  });
});

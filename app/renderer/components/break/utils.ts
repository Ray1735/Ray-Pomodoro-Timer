export function formatTimeSinceLastBreak(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `距上次休息已过 ${hours} 小时${minutes > 0 ? ` ${minutes} 分钟` : ""}`;
  } else if (minutes > 0) {
    return `距上次休息已过 ${minutes} 分钟`;
  } else {
    return "距上次休息不到 1 分钟";
  }
}

// Label for the snooze button, e.g. "推迟 3 分钟", so the button always shows
// the postpone length configured in settings.
export function formatSnoozeLabel(seconds: number): string {
  const duration = formatDuration(seconds);
  return duration ? `推迟 ${duration}` : "推迟";
}

// e.g. "5 分钟", "1 小时 30 分钟", "30 秒"; empty for zero.
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} 小时`);
  if (minutes > 0) parts.push(`${minutes} 分钟`);
  if (secs > 0) parts.push(`${secs} 秒`);

  return parts.join(" ");
}

export function createRgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function createDarkerRgba(hex: string, a: number) {
  const r = Math.floor(parseInt(hex.slice(1, 3), 16) * 0.3);
  const g = Math.floor(parseInt(hex.slice(3, 5), 16) * 0.3);
  const b = Math.floor(parseInt(hex.slice(5, 7), 16) * 0.3);

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
}

export enum NotificationType {
  Notification = "NOTIFICATION",
  Popup = "POPUP",
}

export interface WorkingHoursRange {
  fromMinutes: number;
  toMinutes: number;
}

export interface WorkingHours {
  enabled: boolean;
  ranges: WorkingHoursRange[];
}

export enum SoundType {
  None = "NONE",
  Gong = "GONG",
  Blip = "BLIP",
  Bloop = "BLOOP",
  Ping = "PING",
  Scifi = "SCIFI",
}

export enum TrayTextMode {
  TimeToNextBreak = "TIME_TO_NEXT_BREAK",
  TimeSinceLastBreak = "TIME_SINCE_LAST_BREAK",
}

export interface Settings {
  autoLaunch: boolean;
  breaksEnabled: boolean;
  trayTextEnabled: boolean;
  trayTextMode: TrayTextMode;
  // Chinese fork: draw a shrinking progress ring as the menu bar icon.
  trayProgressEnabled: boolean;
  notificationType: NotificationType;
  breakFrequencySeconds: number;
  breakLengthSeconds: number;
  postponeLengthSeconds: number;
  postponeLimit: number;
  workingHoursEnabled: boolean;
  workingHoursMonday: WorkingHours;
  workingHoursTuesday: WorkingHours;
  workingHoursWednesday: WorkingHours;
  workingHoursThursday: WorkingHours;
  workingHoursFriday: WorkingHours;
  workingHoursSaturday: WorkingHours;
  workingHoursSunday: WorkingHours;
  idleResetEnabled: boolean;
  idleResetLengthSeconds: number;
  idleResetNotification: boolean;
  soundType: SoundType;
  breakSoundVolume: number;
  breakTitle: string;
  breakMessage: string;
  backgroundColor: string;
  textColor: string;
  showBackdrop: boolean;
  backdropOpacity: number;
  endBreakEnabled: boolean;
  skipBreakEnabled: boolean;
  postponeBreakEnabled: boolean;
  immediatelyStartBreaks: boolean;
}

export const defaultWorkingRange: WorkingHoursRange = {
  fromMinutes: 9 * 60, // 09:00
  toMinutes: 18 * 60, // 18:00
};

export const defaultSettings: Settings = {
  autoLaunch: true,
  breaksEnabled: true,
  trayTextEnabled: false,
  trayTextMode: TrayTextMode.TimeToNextBreak,
  trayProgressEnabled: true,
  notificationType: NotificationType.Popup,
  breakFrequencySeconds: 28 * 60,
  breakLengthSeconds: 2 * 60,
  postponeLengthSeconds: 3 * 60,
  postponeLimit: 0,
  workingHoursEnabled: true,
  workingHoursMonday: {
    enabled: true,
    ranges: [defaultWorkingRange],
  },
  workingHoursTuesday: {
    enabled: true,
    ranges: [defaultWorkingRange],
  },
  workingHoursWednesday: {
    enabled: true,
    ranges: [defaultWorkingRange],
  },
  workingHoursThursday: {
    enabled: true,
    ranges: [defaultWorkingRange],
  },
  workingHoursFriday: {
    enabled: true,
    ranges: [defaultWorkingRange],
  },
  workingHoursSaturday: {
    enabled: false,
    ranges: [defaultWorkingRange],
  },
  workingHoursSunday: {
    enabled: false,
    ranges: [defaultWorkingRange],
  },
  idleResetEnabled: true,
  idleResetLengthSeconds: 5 * 60,
  idleResetNotification: false,
  soundType: SoundType.Gong,
  breakSoundVolume: 1,
  breakTitle: "该休息了。",
  breakMessage: "让眼睛休息一下。\n站起来活动活动。\n深呼吸，放松。",
  backgroundColor: "#16a085",
  textColor: "#ffffff",
  showBackdrop: true,
  backdropOpacity: 1,
  endBreakEnabled: true,
  skipBreakEnabled: false,
  postponeBreakEnabled: true,
  immediatelyStartBreaks: false,
};

export interface DayConfig {
  key:
    | "workingHoursMonday"
    | "workingHoursTuesday"
    | "workingHoursWednesday"
    | "workingHoursThursday"
    | "workingHoursFriday"
    | "workingHoursSaturday"
    | "workingHoursSunday";
  label: string;
}

export const daysConfig: DayConfig[] = [
  { key: "workingHoursMonday", label: "星期一" },
  { key: "workingHoursTuesday", label: "星期二" },
  { key: "workingHoursWednesday", label: "星期三" },
  { key: "workingHoursThursday", label: "星期四" },
  { key: "workingHoursFriday", label: "星期五" },
  { key: "workingHoursSaturday", label: "星期六" },
  { key: "workingHoursSunday", label: "星期日" },
];

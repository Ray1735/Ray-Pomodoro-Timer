import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import moment from "moment";
import { useEffect, useMemo, useRef, useState } from "react";
import { Settings, SoundType } from "../../../types/settings";
import { formatSnoozeLabel, TimeRemaining } from "./utils";

const BREAK_BUTTON_CLASS =
  "!bg-transparent hover:!bg-black/10 active:!bg-black/20 border-white/20";
const BREAK_BUTTON_BORDER = "rgba(255, 255, 255, 0.2)";

interface BreakProgressProps {
  breakMessage: string;
  breakTitle: string;
  endBreakEnabled: boolean;
  onEndBreak: () => void;
  // Chinese fork: snooze buttons on the full-screen break.
  postponeBreakEnabled: boolean;
  postponeLengthSeconds: number;
  onPostponeBreak: () => void;
  extraPostponeSeconds: number[];
  onPostponeBreakFor: (seconds: number) => void;
  settings: Settings;
  textColor: string;
  isClosing?: boolean;
  sharedBreakEndTime?: number | null;
}

export function BreakProgress({
  breakMessage,
  breakTitle,
  endBreakEnabled,
  onEndBreak,
  postponeBreakEnabled,
  postponeLengthSeconds,
  onPostponeBreak,
  extraPostponeSeconds,
  onPostponeBreakFor,
  settings,
  textColor,
  isClosing = false,
  sharedBreakEndTime = null,
}: BreakProgressProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(
    null,
  );
  // Chinese fork: whether the "推迟更久" choices are shown.
  const [showMoreSnooze, setShowMoreSnooze] = useState(false);
  const moreSnoozeChoices = (extraPostponeSeconds ?? []).filter(
    (seconds) => seconds > 0,
  );
  const [progress, setProgress] = useState<number | null>(null);
  const [breakStartTime] = useState(new Date());
  const soundPlayedRef = useRef(false);
  const isClosingRef = useRef(isClosing);
  isClosingRef.current = isClosing;

  const isPrimaryWindow = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const windowId = urlParams.get("windowId");
    return windowId === "0" || windowId === null;
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // Only play start sound from primary window and only once per break
    if (
      isPrimaryWindow &&
      settings.soundType !== SoundType.None &&
      !soundPlayedRef.current
    ) {
      soundPlayedRef.current = true;
      ipcRenderer.invokeStartSound(
        settings.soundType,
        settings.breakSoundVolume,
      );
    }

    (async () => {
      // Use shared end time if available (from synchronized break start), otherwise calculate it
      let breakEndTime: moment.Moment;
      if (sharedBreakEndTime) {
        breakEndTime = moment(sharedBreakEndTime);
      } else {
        const lengthSeconds = await ipcRenderer.invokeGetBreakLength();
        breakEndTime = moment().add(lengthSeconds, "seconds");
      }

      const startMsRemaining = moment(breakEndTime).diff(
        moment(),
        "milliseconds",
      );

      const tick = () => {
        const now = moment();

        if (now > moment(breakEndTime)) {
          // Always track break completion, regardless of which window triggers it
          const breakDurationMs =
            new Date().getTime() - breakStartTime.getTime();
          ipcRenderer.invokeCompleteBreakTracking(breakDurationMs);

          onEndBreak();
          return;
        }

        const msRemaining = moment(breakEndTime).diff(now, "milliseconds");
        setProgress(1 - msRemaining / startMsRemaining);
        setTimeRemaining({
          hours: Math.floor(msRemaining / 1000 / 3600),
          minutes: Math.floor(msRemaining / 1000 / 60),
          seconds: (msRemaining / 1000) % 60,
        });

        if (!isClosingRef.current) {
          timeoutId = setTimeout(tick, 50);
        }
      };

      tick();
    })();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    onEndBreak,
    settings,
    breakStartTime,
    isPrimaryWindow,
    sharedBreakEndTime,
  ]);

  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.8, delay: 0.5 },
  };

  if (timeRemaining === null || progress === null) {
    return null;
  }

  const progressPercentage = (progress || 0) * 100;

  return (
    <motion.div
      className="flex flex-col h-full w-full z-10 relative space-y-6"
      {...fadeIn}
    >
      {/* Title and button row */}
      <div className="flex items-center justify-between">
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ color: textColor }}
        >
          {breakTitle}
        </h1>
        {endBreakEnabled && (
          <Button
            className={BREAK_BUTTON_CLASS}
            onClick={onEndBreak}
            variant="outline"
            style={{ color: textColor, borderColor: BREAK_BUTTON_BORDER }}
          >
            {progress < 0.5 ? "取消休息" : "结束休息"}
          </Button>
        )}
      </div>

      {/* Break message */}
      <div
        className="text-lg opacity-80 font-medium whitespace-pre-line"
        style={{ color: textColor }}
      >
        {breakMessage}
      </div>

      {/* Chinese fork: snooze buttons. "推迟更久" reveals a second row with
          the longer choices (5 / 10 / 15 minutes by default, set in Settings). */}
      {postponeBreakEnabled && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Button
              className={BREAK_BUTTON_CLASS}
              onClick={onPostponeBreak}
              variant="outline"
              style={{ color: textColor, borderColor: BREAK_BUTTON_BORDER }}
            >
              {formatSnoozeLabel(postponeLengthSeconds)}
            </Button>
            {moreSnoozeChoices.length > 0 && (
              <Button
                className={BREAK_BUTTON_CLASS}
                onClick={() => setShowMoreSnooze((shown) => !shown)}
                variant="outline"
                aria-expanded={showMoreSnooze}
                style={{ color: textColor, borderColor: BREAK_BUTTON_BORDER }}
              >
                推迟更久
                {showMoreSnooze ? <ChevronUp /> : <ChevronDown />}
              </Button>
            )}
          </div>
          {showMoreSnooze && moreSnoozeChoices.length > 0 && (
            <div className="flex items-center gap-3">
              {moreSnoozeChoices.map((seconds, index) => (
                <Button
                  key={`${index}-${seconds}`}
                  className={BREAK_BUTTON_CLASS}
                  onClick={() => onPostponeBreakFor(seconds)}
                  variant="outline"
                  style={{ color: textColor, borderColor: BREAK_BUTTON_BORDER }}
                >
                  {formatSnoozeLabel(seconds)}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="w-full">
        <div className="flex justify-end items-center mb-2">
          <div
            className="text-sm font-medium opacity-60 flex-shrink-0 tabular-nums flex items-center gap-0.5"
            style={{ color: textColor }}
          >
            <span style={{ color: textColor }}>
              {String(
                Math.floor(timeRemaining.hours * 60 + timeRemaining.minutes),
              ).padStart(2, "0")}{" "}
            </span>
            <span style={{ color: textColor }}>:</span>
            <span style={{ color: textColor }}>
              {String(Math.floor(timeRemaining.seconds)).padStart(2, "0")}
            </span>
          </div>
        </div>
        <div
          className="w-full h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
        >
          <div
            className="h-full transition-all duration-75 ease-out"
            style={{
              backgroundColor: textColor,
              width: `${progressPercentage}%`,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

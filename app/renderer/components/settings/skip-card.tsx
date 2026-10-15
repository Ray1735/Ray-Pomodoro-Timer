import SettingsCard from "./settings-card";
import { Settings } from "../../../types/settings";

interface SkipCardProps {
  settingsDraft: Settings;
  onSwitchChange: (field: string, checked: boolean) => void;
}

export default function SkipCard({
  settingsDraft,
  onSwitchChange,
}: SkipCardProps) {
  return (
    <SettingsCard
      title="跳过"
      helperText="允许直接跳过这次休息，不再顺延。"
      toggle={{
        checked:
          settingsDraft.skipBreakEnabled &&
          !settingsDraft.immediatelyStartBreaks,
        onCheckedChange: (checked) =>
          onSwitchChange("skipBreakEnabled", checked),
        disabled: settingsDraft.immediatelyStartBreaks,
      }}
    />
  );
}

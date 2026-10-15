import SettingsCard from "./settings-card";
import { Settings } from "../../../types/settings";

interface StartupCardProps {
  settingsDraft: Settings;
  onSwitchChange: (field: string, checked: boolean) => void;
}

export default function StartupCard({
  settingsDraft,
  onSwitchChange,
}: StartupCardProps) {
  return (
    <SettingsCard
      title="开机自动启动"
      helperText="登录电脑时自动启动 BreakTimer。"
      toggle={{
        checked: settingsDraft.autoLaunch,
        onCheckedChange: (checked) => onSwitchChange("autoLaunch", checked),
      }}
    />
  );
}

import { Settings } from "../../../types/settings";
import SettingsCard from "./settings-card";

interface TrayProgressCardProps {
  settingsDraft: Settings;
  onSwitchChange: (field: string, checked: boolean) => void;
}

// Chinese fork: toggle for the menu bar progress ring.
export default function TrayProgressCard({
  settingsDraft,
  onSwitchChange,
}: TrayProgressCardProps) {
  return (
    <SettingsCard
      title="菜单栏进度圈"
      helperText="番茄钟计时中，菜单栏图标会变成一个圆圈，随时间慢慢减少，一眼看出大概还剩多少。休息中、暂停时或不在工作时间，显示原来的图标。"
      toggle={{
        checked: settingsDraft.trayProgressEnabled,
        onCheckedChange: (checked) =>
          onSwitchChange("trayProgressEnabled", checked),
      }}
    />
  );
}

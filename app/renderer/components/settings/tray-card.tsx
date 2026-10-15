import { FormGroup } from "@/components/ui/form-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, TrayTextMode } from "../../../types/settings";
import SettingsCard from "./settings-card";

interface TrayCardProps {
  settingsDraft: Settings;
  onSwitchChange: (field: string, checked: boolean) => void;
  onTrayTextModeChange: (value: string) => void;
}

export default function TrayCard({
  settingsDraft,
  onSwitchChange,
  onTrayTextModeChange,
}: TrayCardProps) {
  return (
    <SettingsCard
      title="菜单栏文字"
      helperText="在菜单栏图标旁边显示时间。"
      toggle={{
        checked: settingsDraft.trayTextEnabled,
        onCheckedChange: (checked) =>
          onSwitchChange("trayTextEnabled", checked),
      }}
    >
      <FormGroup label="显示内容">
        <Select
          value={settingsDraft.trayTextMode}
          disabled={!settingsDraft.trayTextEnabled}
          onValueChange={onTrayTextModeChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TrayTextMode.TimeToNextBreak}>
              距下次休息还有多久
            </SelectItem>
            <SelectItem value={TrayTextMode.TimeSinceLastBreak}>
              距上次休息过了多久
            </SelectItem>
          </SelectContent>
        </Select>
      </FormGroup>
    </SettingsCard>
  );
}

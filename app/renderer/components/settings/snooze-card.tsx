import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SettingsCard from "./settings-card";
import TimeInput from "./time-input";
import { Settings } from "../../../types/settings";

interface SnoozeCardProps {
  settingsDraft: Settings;
  onSwitchChange: (field: string, checked: boolean) => void;
  onDateChange: (fieldName: string, newVal: Date) => void;
  onPostponeLimitChange: (value: string) => void;
}

export default function SnoozeCard({
  settingsDraft,
  onSwitchChange,
  onDateChange,
  onPostponeLimitChange,
}: SnoozeCardProps) {
  return (
    <SettingsCard
      title="推迟"
      helperText="忙的时候可以把休息往后推。休息前的提醒条和全屏休息画面上都有“推迟”按钮。"
      toggle={{
        checked: settingsDraft.postponeBreakEnabled,
        onCheckedChange: (checked) =>
          onSwitchChange("postponeBreakEnabled", checked),
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">推迟时长</Label>
          <TimeInput
            precision="seconds"
            value={settingsDraft.postponeLengthSeconds}
            onChange={(seconds) => {
              const date = new Date();
              date.setHours(Math.floor(seconds / 3600));
              date.setMinutes(Math.floor((seconds % 3600) / 60));
              date.setSeconds(seconds % 60);
              onDateChange("postponeLength", date);
            }}
            disabled={!settingsDraft.postponeBreakEnabled}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">最多连续推迟</Label>
          <Select
            value={settingsDraft.postponeLimit.toString()}
            onValueChange={onPostponeLimitChange}
            disabled={!settingsDraft.postponeBreakEnabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 次</SelectItem>
              <SelectItem value="2">2 次</SelectItem>
              <SelectItem value="3">3 次</SelectItem>
              <SelectItem value="4">4 次</SelectItem>
              <SelectItem value="5">5 次</SelectItem>
              <SelectItem value="0">不限</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </SettingsCard>
  );
}

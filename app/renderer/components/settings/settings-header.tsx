import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  handleSave: () => void;
  showSave: boolean;
}

export default function SettingsHeader(props: Props) {
  const { handleSave, showSave } = props;

  return (
    <div className="border-b border-border bg-background">
      <nav className="flex items-center justify-between p-4 h-16 min-h-16">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-foreground">设置</h1>
        </div>
        {showSave && (
          <div className="flex items-center">
            <Button variant="outline" onClick={handleSave}>
              保存
            </Button>
          </div>
        )}
      </nav>
      <div className="px-4 pb-4">
        <TabsList
          className={`grid w-full ${
            processEnv.SNAP === undefined ? "grid-cols-4" : "grid-cols-3"
          }`}
        >
          <TabsTrigger value="break-settings">常规</TabsTrigger>
          <TabsTrigger value="working-hours">工作时间</TabsTrigger>
          <TabsTrigger value="customization">外观</TabsTrigger>
          {processEnv.SNAP === undefined && (
            <TabsTrigger value="system">系统</TabsTrigger>
          )}
        </TabsList>
      </div>
    </div>
  );
}

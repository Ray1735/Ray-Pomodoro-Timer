import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const handleUnderstood = () => {
    // Mark app as initialized when user dismisses the modal
    ipcRenderer.invokeSetAppInitialized();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-[400px] w-[400px]"
        showCloseButton={false}
      >
        <DialogHeader className="text-left">
          <DialogTitle>BreakTimer 在后台运行</DialogTitle>
          <DialogDescription className="text-base leading-relaxed text-balance pt-2">
            点击屏幕顶部菜单栏里的图标，就能打开它。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleUnderstood} className="w-full">
            知道了，开始使用
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

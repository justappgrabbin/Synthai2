import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { closeFlyUp, useFlyUp, type FlyUpId } from "@/lib/flyUps";

// Full-screen fly-up: slides up from the bottom (vaul translateY transform), X at top slides it back down.
export function FlyUpScreen({ id, title, description, icon, children, testId }: {
  id: Exclude<FlyUpId, null>; title: string; description: string; icon?: ReactNode; children: ReactNode; testId: string;
}) {
  const open = useFlyUp() === id;
  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) closeFlyUp(); }}>
      <DrawerContent data-testid={testId} className="z-[220] mt-0 flex h-[100dvh] max-h-none flex-col overflow-hidden rounded-none p-0">
        <DrawerHeader className="flex items-start justify-between gap-4 border-b px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-left">
          <div className="min-w-0">
            <DrawerTitle className="flex items-center gap-2">{icon}{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </div>
          <button type="button" aria-label={`Close ${title}`} data-testid={`${testId}-close`}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={closeFlyUp}>
            <X className="h-5 w-5" />
          </button>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}

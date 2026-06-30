import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Orbit } from "lucide-react";
import { AgenticRealityLab } from "@/components/AgenticRealityLab";

export function MakerStudioPanel() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          className="fixed bottom-24 left-4 z-[150] h-12 rounded-full border bg-background/95 px-4 text-foreground shadow-lg backdrop-blur hover:bg-primary hover:text-primary-foreground md:bottom-6"
          variant="outline"
          data-testid="button-open-maker-studio"
        >
          <Orbit className="mr-2 h-4 w-4" />
          Verse
        </Button>
      </DrawerTrigger>
      <DrawerContent className="z-[220] max-h-[88vh] overflow-hidden p-0">
        <DrawerHeader className="border-b px-4 py-3 text-left">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div>
              <DrawerTitle>YOU-N-I-VERSE</DrawerTitle>
              <DrawerDescription>
                Agentic reality bridge recovered from the YOU-N-I-VERSE browser source.
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        <AgenticRealityLab />
      </DrawerContent>
    </Drawer>
  );
}

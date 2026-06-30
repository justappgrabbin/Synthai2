import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Maximize2, Orbit } from "lucide-react";

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
                Agentic reality layer mounted from the YOU-N-I-VERSE source interface.
              </DrawerDescription>
            </div>
            <a
              href="/verse/youniverse-interface.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted"
            >
              <Maximize2 className="mr-2 h-4 w-4" />
              Open Full
            </a>
          </div>
        </DrawerHeader>
        <iframe
          src="/verse/youniverse-interface.html"
          title="YOU-N-I-VERSE Agentic Reality"
          className="h-[76vh] w-full border-0 bg-black"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </DrawerContent>
    </Drawer>
  );
}

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Maximize2, Orbit, Sparkles, Store, Workflow } from "lucide-react";

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
                Agentic reality layer. This is the always-available verse panel that will host worlds, agents, tools, and mounted experiences.
              </DrawerDescription>
            </div>
            <a
              href="/maker-studio/index.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted"
            >
              <Maximize2 className="mr-2 h-4 w-4" />
              Raw Source
            </a>
          </div>
        </DrawerHeader>
        <div className="grid gap-4 overflow-auto p-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <Sparkles className="mb-3 h-6 w-6 text-primary" />
            <p className="font-semibold">Agentic Reality</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The Verse is the living layer where people, places, things, apps, and agents become navigable nodes.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <Workflow className="mb-3 h-6 w-6 text-primary" />
            <p className="font-semibold">Addressed Mounting</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Mounted tools should enter through the registry first, then appear here when the mesh knows where they belong.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <Store className="mb-3 h-6 w-6 text-primary" />
            <p className="font-semibold">Source Vault</p>
            <p className="mt-1 text-sm text-muted-foreground">
              MakerStudio and older YOU-N-I-VERSE files are preserved as source material until they are adapted into this panel.
            </p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

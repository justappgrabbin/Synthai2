import { useLayoutEffect, useRef } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Home, Code2, Gamepad2, Layers, Moon, Sun, MessageSquare, Orbit, Upload, List } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { openFlyUp } from "@/lib/flyUps";
import { PROGRAM_GROUPS, programAt, programsIn } from "@/lib/programNavigation";

const MOBILE_DOCK_ITEMS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/ide", icon: Code2, label: "IDE" },
  { path: "/ingest", icon: Upload, label: "Ingest" },
  { path: "/game-creator", icon: Gamepad2, label: "Games" },
  { path: "/worlds", icon: Layers, label: "Worlds" },
];

export function GlobalNav() {
  const [location] = useLocation();
  const headerRef = useRef<HTMLElement>(null);
  const dockRef = useRef<HTMLElement>(null);
  const search = useSearch();
  const { theme, toggleTheme } = useTheme();
  const current = programAt(location + (search ? "?" + search : ""));
  const group = PROGRAM_GROUPS.find(item => item.id === current?.group);
  const members = group ? programsIn(group.id) : [];

  useLayoutEffect(() => {
    const update = () => {
      document.documentElement.style.setProperty("--workspace-navigation-height", `${headerRef.current?.getBoundingClientRect().height || 0}px`);
      document.documentElement.style.setProperty("--workspace-dock-height", `${dockRef.current?.getBoundingClientRect().height || 0}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    if (headerRef.current) observer.observe(headerRef.current);
    if (dockRef.current) observer.observe(dockRef.current);
    return () => observer.disconnect();
  }, [location, group?.id]);

  return <>
    <header ref={headerRef} className="relative z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="flex min-h-14 items-center gap-2 px-3 sm:px-4">
        <Link href="/" aria-label="Dashboard" className={buttonVariants({ variant: location === "/" ? "secondary" : "ghost", size: "icon" })}>
          <Home className="h-4 w-4" />
        </Link>
        <nav aria-label="Program groups" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-2">
          {PROGRAM_GROUPS.map(item => <Link key={item.id} href={item.path}
            aria-current={group?.id === item.id ? "true" : undefined}
            className={buttonVariants({ variant: group?.id === item.id ? "secondary" : "ghost", size: "sm" }) + " shrink-0"}
            data-testid={`group-${item.id}`}>{item.label}</Link>)}
        </nav>
        <Link href="/programs" aria-label="All programs" title="All programs"
          aria-current={location === "/programs" ? "page" : undefined}
          className={buttonVariants({ variant: location === "/programs" ? "secondary" : "ghost", size: "icon" })}>
          <List className="h-4 w-4" />
        </Link>
        <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-toggle-theme"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
      {members.length > 0 && <nav aria-label={`${group!.label} programs`} className="flex items-center gap-1 overflow-x-auto border-t px-3 py-1 sm:px-4">
        {members.map(item => <Link key={item.path} href={item.path}
          aria-current={current?.path === item.path ? "page" : undefined}
          className={buttonVariants({ variant: current?.path === item.path ? "default" : "ghost", size: "sm" }) + " shrink-0"}
          data-testid={`program-${item.path.slice(1).replace(/[^a-z0-9-]/g, "-")}`}>{item.label}</Link>)}
      </nav>}
    </header>
    {location !== "/" && <nav ref={dockRef} className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur md:hidden" aria-label="Mobile dock">
      <div className="grid grid-cols-7 gap-1 px-2 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        {MOBILE_DOCK_ITEMS.map(item => {
          const Icon = item.icon;
          const active = item.path === "/worlds" ? current?.group === "worlds" : location === item.path;
          return <Link key={item.path} href={item.path} aria-current={active ? "page" : undefined}
            className={buttonVariants({ variant: active ? "default" : "ghost", size: "sm" }) + " h-12 w-full flex-col gap-1 px-1 text-[11px]"}
            data-testid={`mobile-nav-${item.label.toLowerCase()}`}><Icon className="h-4 w-4" />{item.label}</Link>;
        })}
        {([
          { id: "verse" as const, icon: Orbit, label: "Verse" },
          { id: "agent" as const, icon: MessageSquare, label: "Agent" },
        ]).map(item => <Button key={item.id} variant="ghost" size="sm" className="h-12 w-full flex-col gap-1 px-1 text-[11px]"
          onClick={() => openFlyUp(item.id)} data-testid={`mobile-nav-${item.id}`}><item.icon className="h-4 w-4" />{item.label}</Button>)}
      </div>
    </nav>}
  </>;
}

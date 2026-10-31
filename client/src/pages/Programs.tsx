import { useState } from "react";
import { Link } from "wouter";
import { PROGRAM_GROUPS, programsIn } from "@/lib/programNavigation";
import { AppRegistry } from "@/lib/appRegistry";
import { Input } from "@/components/ui/input";

export default function Programs() {
  const [query, setQuery] = useState("");
  const [installed] = useState(() => AppRegistry.getInstalledApps());
  const matches = (label: string) => label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  const builtInPaths = new Set(PROGRAM_GROUPS.flatMap(group => programsIn(group.id).map(program => program.path)));
  const additions = installed.filter(app => !builtInPaths.has(app.path) && matches(app.name));
  const groups = PROGRAM_GROUPS.map(group => ({ ...group, programs: programsIn(group.id).filter(program => matches(program.label)) }));

  return <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 pb-28" data-testid="program-index">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-2xl font-semibold">All programs</h1>
      <div className="w-full sm:w-72">
        <label htmlFor="program-search" className="mb-1 block text-sm">Find a program</label>
        <Input id="program-search" type="search" value={query} onChange={event => setQuery(event.target.value)} />
      </div>
    </header>
    <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
      {groups.filter(group => group.programs.length > 0).map(group => <section key={group.id} aria-labelledby={`program-group-${group.id}`}>
        <h2 id={`program-group-${group.id}`} className="border-b pb-2 text-lg font-semibold">{group.label}</h2>
        <ul className="divide-y">
          {group.programs.map(program => <li key={program.path}>
            <Link href={program.path} className="block rounded-sm px-1 py-3 text-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{program.label}</Link>
          </li>)}
        </ul>
      </section>)}
      {additions.length > 0 && <section aria-labelledby="installed-programs">
        <h2 id="installed-programs" className="border-b pb-2 text-lg font-semibold">Installed apps</h2>
        <ul className="divide-y">{additions.map(app => <li key={app.id}>
          <Link href={app.path} className="block rounded-sm px-1 py-3 text-sm hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{app.name}</Link>
        </li>)}</ul>
      </section>}
    </div>
    {!groups.some(group => group.programs.length > 0) && additions.length === 0 && <p role="status" className="text-sm text-muted-foreground">No programs match “{query}”.</p>}
  </main>;
}

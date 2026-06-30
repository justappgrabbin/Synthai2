/**
 * GrimoirePanel — mounts the confirmed Grimoire v4 notebook.
 * The source is preserved as standalone HTML so its notebook/Jupyter/builder
 * behavior survives until it is deliberately ported into React.
 */

export function GrimoirePanel() {
  return (
    <iframe
      src="/grimoire/grimoire_v4.html"
      title="The Grimoire Notebook v4"
      className="h-full w-full border-0 bg-black"
      sandbox="allow-scripts allow-same-origin allow-forms allow-downloads"
    />
  );
}

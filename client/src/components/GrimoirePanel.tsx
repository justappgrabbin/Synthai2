/**
 * GrimoirePanel — thin wrapper mounting NotebookInterface
 * Grimoire 2.0: Jupyter × Obsidian × MorphOS v29 notebook
 * Self-contained, no external deps beyond what NotebookInterface mocks.
 */
import { NotebookInterface } from "./NotebookInterface";

export function GrimoirePanel() {
  return (
    <div className="h-full overflow-hidden">
      <NotebookInterface />
    </div>
  );
}

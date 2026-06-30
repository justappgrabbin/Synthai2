/**
 * BodyView — HD body visualization hub
 * Tab 1: BodyGraphWidget (multi-system Tropical/Sidereal/Fagan/Draconic zones)
 * Tab 2: BodyInterface (canvas bodygraph with mesh node circulation)
 * Both adapted to phone-first shell.
 */
import { useState } from "react";
import BodyGraphWidget from "./BodyGraphWidget";
import { BodyInterface } from "./BodyInterface";

const T = {
  bg:     "hsl(240 10% 5%)",
  surface:"hsl(240 8% 10%)",
  border: "hsl(240 6% 16%)",
  violet: "#c084fc",
  emerald:"#10d474",
  text:   "hsl(240 5% 90%)",
  muted:  "hsl(240 5% 45%)",
};

type Tab = "widget" | "canvas";

export function BodyView() {
  const [tab, setTab] = useState<Tab>("widget");

  return (
    <div className="flex flex-col h-full" style={{ background: T.bg }}>
      {/* Tab bar */}
      <div className="flex shrink-0 px-4 pt-3 pb-0 gap-2"
        style={{ borderBottom: `1px solid ${T.border}` }}>
        {([
          { id: "widget" as Tab, label: "Body Graph",  color: T.violet  },
          { id: "canvas" as Tab, label: "Body Map",    color: T.emerald },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 text-xs font-semibold rounded-t-lg transition-all"
            style={{
              background: tab === t.id ? `${t.color}18` : "transparent",
              color: tab === t.id ? t.color : T.muted,
              borderBottom: tab === t.id ? `2px solid ${t.color}` : "2px solid transparent",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "widget" && (
          <div className="h-full overflow-y-auto p-3">
            <BodyGraphWidget />
          </div>
        )}
        {tab === "canvas" && (
          <div className="h-full">
            <BodyInterface />
          </div>
        )}
      </div>
    </div>
  );
}

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { X, Minus, Grip, MessageSquare, FileArchive, Terminal as TerminalIcon, Eye, Download, Save, FolderPlus, Hammer } from "lucide-react";
import { setAssistantOpen } from "@/lib/assistantDock";

interface Props {
  fileName: string | null;
  fileCount: number;
  lineCount: number;
  onTerminal: () => void;
  onPreview: () => void;
  onExportZip: () => void;
  onSave: () => void;
  onNewFile: () => void;
  onZipManager: () => void;
  onBuilder: () => void;
}
export function UNOToolDock({
  fileName, fileCount, lineCount, onTerminal, onPreview, onExportZip,
  onSave, onNewFile, onZipManager, onBuilder
}: Props) {
  const [open,setOpen] = useState(false);
  const [minimized,setMinimized] = useState(false);
  const [position,setPosition] = useState({x:12,y:95});
  const drag = useRef<{pointerId:number,dx:number,dy:number}|null>(null);
  function down(event:ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button')) return;
    drag.current={pointerId:event.pointerId,dx:event.clientX-position.x,dy:event.clientY-position.y};
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event:ReactPointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId!==event.pointerId) return;
    const width=Math.min(350,window.innerWidth-24);
    setPosition({x:Math.max(4,Math.min(window.innerWidth-width-4,event.clientX-drag.current.dx)),
      y:Math.max(8,Math.min(window.innerHeight-72,event.clientY-drag.current.dy))});
  }
  function up(event:ReactPointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId===event.pointerId) drag.current=null;
  }
  const tiles = [
    {label:"AI chat · GPT Dash",icon:MessageSquare,run:()=>setAssistantOpen(true)},
    {label:"Real IDE terminal",icon:TerminalIcon,run:onTerminal},
    {label:"Execute HTML preview",icon:Eye,run:onPreview},
    {label:"ZIP manager / player",icon:FileArchive,run:onZipManager},
    {label:"Export actual project ZIP",icon:Download,run:onExportZip},
    {label:"Open existing build tools",icon:Hammer,run:onBuilder},
    {label:"Create new file",icon:FolderPlus,run:onNewFile},
    {label:"Save selected file",icon:Save,run:onSave},
  ];
  return <>
    <Button data-testid="button-uno-dash" size="sm" variant="outline" title="Existing real IDE tools, draggable" onClick={()=>{setOpen(o=>!o);setMinimized(false);}}>
      <Grip className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">UNO Dash</span><span className="sm:hidden">UNO</span>
    </Button>
    {open && <section
      aria-label="UNO IDE floating tool dock"
      data-testid="uno-floating-tools"
      className="fixed rounded-xl border border-purple-500/50 bg-slate-950 text-slate-100 shadow-2xl"
      style={{zIndex:91,left:position.x,top:position.y,width:"min(350px,calc(100vw - 24px))",maxHeight:"min(72dvh,680px)",overflowY:"auto"}}>
      <div className="flex items-center justify-between rounded-t-xl border-b border-purple-500/30 bg-gradient-to-r from-purple-950 to-slate-900 p-2 cursor-move select-none touch-none"
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <strong className="text-sm">✧ UNO Dash · live tools</strong>
        <div className="flex gap-1">
          <button aria-label="Minimize UNO Dash" className="rounded p-2" onClick={()=>setMinimized(m=>!m)}><Minus className="h-4 w-4"/></button>
          <button aria-label="Close UNO Dash" className="rounded p-2" onClick={()=>setOpen(false)}><X className="h-4 w-4"/></button>
        </div>
      </div>
      {!minimized && <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border border-slate-700 p-2">Files <strong>{fileCount}</strong></div>
          <div className="rounded border border-slate-700 p-2">Editor lines <strong>{lineCount}</strong></div>
        </div>
        <p className="text-xs text-slate-300 truncate">Current: {fileName || "No file selected"}</p>
        <div className="grid grid-cols-2 gap-2">
          {tiles.map(item => <Button key={item.label} size="sm" variant="outline"
            className="h-auto min-h-12 whitespace-normal text-left justify-start gap-2 text-xs"
            onClick={item.run}>
            <item.icon className="h-4 w-4 shrink-0"/>{item.label}
          </Button>)}
        </div>
        <p className="text-xs text-slate-400">Buttons call the existing IDE features. ZIP→APK, external deployment and Arduino flashing are not simulated. Use existing build integrations only after real tools report success.</p>
      </div>}
    </section>}
  </>;
}

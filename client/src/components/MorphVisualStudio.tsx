import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Download, Film, Image as ImageIcon, Layers, Play, RefreshCw, Sparkles, Upload, Wand2, X } from "lucide-react";
import { publishMeshEvent } from "@/lib/meshEvents";

/** The Morph visual surface. Images are never inserted into the persisted Morph GNN store. */
type ImageEntry = { id: string; src: string; prompt: string; edited?: boolean };
type Branch = "start" | "left" | "right";
const KEYWORDS: Record<string, string[]> = {
  "Voice & emotion": ["Emotional Micro-Expression", "Zero-Shot Vocal Persona", "Micro-Inhalation Capture", "Sub-Harmonic Echo", "Expressive Singing Synthesis"],
  "Cinematic": ["Volumetric Light Ray", "85mm Cinematic Depth", "Macro Surface Microtexture", "Physical Consistency Engine", "60fps Motion Capture"],
  "Worlds": ["AR-HUD Navigation Overlay", "Driver Telemetry Hologram", "Space-Acoustic Cabin Illumination", "Multi-Zone Luminescent Interface"],
  "Materials": ["Quantized Poly-Mesh Texture", "K-V Cache Fluid Synthesis", "Sub-Second Streaming Render", "Multi-Tenant Cloud Array"],
};
const IDEAS = [
  { name: "A living forest", prompt: "An enchanted forest with towering trees, iridescent moss and two luminous pathways, cinematic volumetric light" },
  { name: "AR cockpit", prompt: "A futuristic panoramic vehicle cockpit, luminous navigation HUD, realistic glass and titanium surfaces" },
  { name: "Synesthetic portrait", prompt: "Cinematic portrait of a driver expressing serene awe, zero-shot vocal persona and 85mm cinematic depth, warm golden-hour lighting and rich skin texture" },
  { name: "Quantum supercar", prompt: "A futuristic supercar drifting on a high-speed neon track, physical tire smoke, aerodynamic wind trails and high-contrast digital art" },
  { name: "World entrance", prompt: "A vast open gateway to a floating island world, paths branching to mysterious destinations, wide cinematic composition" },
];
const LIMIT_BYTES = 5 * 1024 * 1024;

function download(name: string, href: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
function imageFromFile(file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return Promise.reject(new Error("Choose a PNG, JPEG or WebP image."));
  if (file.size > LIMIT_BYTES) return Promise.reject(new Error("Choose an image under 5 MB."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, time: number, motion: string) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, w, h);
  const zoom = motion === "zoom" ? 1.05 + 0.11 * (0.5 + 0.5 * Math.sin(time / 2000)) : 1.07;
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const sw = img.naturalWidth * scale, sh = img.naturalHeight * scale;
  const drift = motion === "pan" ? Math.sin(time / 2200) * 0.035 : motion === "float" ? Math.sin(time / 1400) * 0.012 : 0;
  ctx.drawImage(img, (w - sw) / 2 + drift * w, (h - sh) / 2 + Math.cos(time / 1700) * (motion === "float" ? 10 : 3), sw, sh);
}
function drawOverlay(ctx: CanvasRenderingContext2D, caption: string) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  const gradient = ctx.createLinearGradient(0, h * 0.58, 0, h);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.76)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, h * 0.58, w, h * 0.42);
  ctx.font = "bold 30px sans-serif";
  ctx.fillStyle = "#fff";
  ctx.fillText(caption.slice(0, 58), 30, h - 35, w - 60);
}
function exportWorld(src: string, choices: { left: string; right: string; intro: string; leftText: string; rightText: string }) {
  const payload = JSON.stringify({ src, ...choices }).replace(/</g, "\\u003c");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Morph Interactive World</title><style>
  *{box-sizing:border-box}body{margin:0;background:#020617;color:white;font:16px system-ui}main{min-height:100dvh;display:grid;place-content:center;padding:18px}
  #stage{width:min(94vw,1050px);aspect-ratio:16/9;position:relative;overflow:hidden;border-radius:22px;background:#10182a}
  #image{width:100%;height:100%;object-fit:cover;animation:drift 10s ease-in-out infinite alternate}
  @keyframes drift{from{transform:scale(1.06) translateX(-1%)}to{transform:scale(1.2) translateX(1%)}}
  #shade{position:absolute;inset:40% 0 0;background:linear-gradient(transparent,#000b);pointer-events:none}
  #text{position:absolute;bottom:105px;left:22px;right:22px;font-size:clamp(17px,3vw,30px);font-weight:700;text-shadow:0 2px 8px #000}
  #actions{position:absolute;bottom:20px;left:20px;right:20px;display:flex;flex-wrap:wrap;gap:12px}
  button{cursor:pointer;background:#0f766e;color:#fff;border:1px solid #5eead4;border-radius:14px;padding:12px 20px;font-size:16px}
  button:focus-visible{outline:3px solid #fff}#back{display:none;background:#334155}
  </style></head><body><main><section id="stage" aria-label="Interactive animated scene"><img id="image" alt="Visual world"><div id="shade"></div><div id="text"></div><div id="actions"><button id="left"></button><button id="right"></button><button id="back">Start again</button></div></section></main>
  <script>const world=${payload};document.getElementById("image").src=world.src;const text=document.getElementById("text"),left=document.getElementById("left"),right=document.getElementById("right"),back=document.getElementById("back");
  function show(side){text.textContent=side==="start"?world.intro:side==="left"?world.leftText:world.rightText;left.hidden=side!=="start";right.hidden=side!=="start";back.style.display=side==="start"?"none":"block"}
  left.textContent=world.left;right.textContent=world.right;left.onclick=()=>show("left");right.onclick=()=>show("right");back.onclick=()=>show("start");show("start");</script></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  download("morph-interactive-world.html", url);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function MorphVisualStudio() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"generate" | "edit">("generate");
  const [prompt, setPrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [src, setSrc] = useState<string | null>(null);
  const [history, setHistory] = useState<ImageEntry[]>([]);
  const [model, setModel] = useState("gemini-3.1-flash-lite-image");
  const [ratio, setRatio] = useState("16:9");
  const [size, setSize] = useState("1K");
  const [style, setStyle] = useState("cinematic");
  const [provider, setProvider] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [motion, setMotion] = useState("float");
  const [playing, setPlaying] = useState(true);
  const [branch, setBranch] = useState<Branch>("start");
  const [intro, setIntro] = useState("You enter a new world. Where will you go?");
  const [left, setLeft] = useState("Explore the left path");
  const [right, setRight] = useState("Explore the right path");
  const [leftText, setLeftText] = useState("The first path opens into a new experience.");
  const [rightText, setRightText] = useState("A different world unfolds on this path.");
  const [recording, setRecording] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const image = useRef<HTMLImageElement | null>(null);
  const frame = useRef<number>(0);
  const clock = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const [lastVideo, setLastVideo] = useState<string | null>(null);

  useEffect(() => { if (!open) return;
    fetch("/api/morph/image-status").then(r => r.json()).then(d => setProvider(Boolean(d.configured))).catch(() => setProvider(false));
  }, [open]);
  useEffect(() => {
    if (!src) { image.current = null; return; }
    const img = new Image();
    img.onload = () => { image.current = img; };
    img.onerror = () => { setError("Unable to display the selected image."); image.current = null; };
    img.src = src;
    return () => { img.onload = null; img.onerror = null; };
  }, [src]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    const render = (time: number) => {
      if (!active) return;
      const ctx = canvas.current?.getContext("2d");
      if (ctx && image.current) {
        if (playing) clock.current = time;
        drawCover(ctx, image.current, clock.current, motion);
        drawOverlay(ctx, branch === "left" ? leftText : branch === "right" ? rightText : intro);
      }
      frame.current = requestAnimationFrame(render);
    };
    frame.current = requestAnimationFrame(render);
    return () => { active = false; cancelAnimationFrame(frame.current); };
  }, [open, playing, motion, src, branch, intro, leftText, rightText]);
  useEffect(() => () => { if (lastVideo) URL.revokeObjectURL(lastVideo); }, [lastVideo]);

  const useImage = useCallback((next: string, label: string, edited = false) => {
    setSrc(next);
    setBranch("start");
    setHistory(prev => [{ id: String(Date.now()) + Math.random().toString(36).slice(2), src: next, prompt: label, edited }, ...prev].slice(0, 8));
    setError("");
    void publishMeshEvent({
      source: "morph-visual-studio", type: "morph.image.selected", topic: "visual-morph",
      payload: { label: label.slice(0, 160), edited, imageType: next.substring(0, 40).split(";")[0], persisted: false },
    });
  }, []);

  async function loadFile(file?: File) {
    if (!file) return;
    try { useImage(await imageFromFile(file), file.name); setTab("edit"); }
    catch (e) { setError(e instanceof Error ? e.message : "File import failed."); }
  }
  async function requestImage(kind: "generate" | "edit") {
    const text = kind === "generate" ? prompt : editPrompt;
    if (!text.trim()) { setError("Describe the image first."); return; }
    if (kind === "edit" && !src) { setError("Select or upload a base image first."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/morph/${kind === "generate" ? "generate-image" : "edit-image"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text, model, aspectRatio: ratio, imageSize: size, ...(kind === "edit" ? { image: src } : {}) }),
      });
      const data = await response.json();
      if (!response.ok || typeof data.imageUrl !== "string") throw new Error(data.error || "Image provider returned no image.");
      useImage(data.imageUrl, text, kind === "edit");
    } catch (e) { setError(e instanceof Error ? e.message : "Image request failed."); }
    finally { setBusy(false); }
  }
  async function enhance() {
    const text = tab === "generate" ? prompt : editPrompt;
    if (!text.trim()) { setError("Enter a prompt to enhance."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/morph/enhance-prompt", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: text, style }) });
      const data = await response.json();
      if (!response.ok || typeof data.enhancedPrompt !== "string") throw new Error(data.error || "Prompt enhancement unavailable.");
      if (tab === "generate") setPrompt(data.enhancedPrompt); else setEditPrompt(data.enhancedPrompt);
    } catch (e) { setError(e instanceof Error ? e.message : "Prompt enhancement failed."); }
    finally { setBusy(false); }
  }
  async function record() {
    if (!canvas.current || !image.current) { setError("Choose an image before recording."); return; }
    if (!("MediaRecorder" in window) || typeof canvas.current.captureStream !== "function") {
      setError("This browser cannot record canvas video. The interactive HTML world is still available."); return;
    }
    const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(MediaRecorder.isTypeSupported);
    if (!mimeType) { setError("WebM recording is unsupported on this device."); return; }
    setRecording(true); setError(""); setPlaying(true);
    const stream = canvas.current.captureStream(24);
    const chunks: BlobPart[] = [];
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onerror = () => { setRecording(false); setError("Video recording failed."); };
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        setRecording(false);
        if (!chunks.length) { setError("No video frames were captured."); return; }
        const url = URL.createObjectURL(new Blob(chunks, { type: mimeType }));
        setLastVideo(url);
        download("morph-scene.webm", url);
        void publishMeshEvent({ source: "morph-visual-studio", type: "morph.video.recorded", topic: "visual-morph", payload: { format: "webm", durationSeconds: 6 } });
      };
      recorder.start(1000);
      setTimeout(() => { if (recorder.state !== "inactive") recorder.stop(); }, 6000);
    } catch { stream.getTracks().forEach(track => track.stop()); setRecording(false); setError("The browser could not start recording."); }
  }
  const choices = { left, right, intro, leftText, rightText };
  const inputClass = "w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-white placeholder:text-slate-500";
  const btnClass = "rounded-lg border border-teal-700 bg-teal-950 px-3 py-2 text-xs font-semibold text-teal-100 disabled:opacity-40";
  const caption = branch === "start" ? intro : branch === "left" ? leftText : rightText;

  return (
    <>
      <button type="button" data-testid="open-morph-visual" onClick={() => setOpen(value => !value)}
        className="fixed right-3 top-16 z-30 rounded-xl border border-teal-600 bg-slate-950 px-4 py-3 text-sm font-semibold text-teal-200 shadow-xl shadow-black/50">
        <span className="inline-flex items-center gap-2"><Film className="h-4 w-4" /> Visual Morph</span>
      </button>
      {open && <section role="dialog" aria-modal="true" aria-label="Morph image and interactive video studio"
        data-testid="morph-visual-studio"
        className="fixed inset-x-2 bottom-2 top-28 z-30 mx-auto max-w-6xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-3 text-slate-100 shadow-2xl sm:inset-x-5 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div><h2 className="text-lg font-bold text-teal-300">Morph • Image to Living Scene</h2>
            <p className="text-xs text-slate-400">Create or upload an image, animate it, and define playable paths.</p></div>
          <button type="button" aria-label="Close Visual Morph" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-slate-800"><X /></button>
        </div>
        {error && <div role="alert" className="mb-3 rounded-lg border border-rose-700 p-3 text-sm text-rose-300">{error} <button className="ml-2 underline" onClick={() => setError("")}>Dismiss</button></div>}
        <div className="grid gap-4 lg:grid-cols-[minmax(240px,0.85fr)_minmax(300px,1.2fr)]">
          <div className="space-y-3">
            <div className="flex gap-2">
              <button className={btnClass} aria-pressed={tab === "generate"} onClick={() => setTab("generate")}><Sparkles className="mr-1 inline h-3 w-3" />Generate</button>
              <button className={btnClass} aria-pressed={tab === "edit"} onClick={() => setTab("edit")}><ImageIcon className="mr-1 inline h-3 w-3" />Refine</button>
              <button className={btnClass} onClick={() => fileRef.current?.click()}><Upload className="mr-1 inline h-3 w-3" />Upload</button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => {void loadFile(e.currentTarget.files?.[0]);e.currentTarget.value="";}} />
            </div>
            <p className="text-xs text-slate-400">Image engine: {provider === null ? "checking" : provider ? "server configured" : "not configured • local upload works"}</p>
            <textarea className={inputClass} rows={3} aria-label={tab === "generate" ? "Image prompt" : "Image edit instructions"}
              placeholder={tab === "generate" ? "Describe your world..." : "Describe what to change in this image..."}
              value={tab === "generate" ? prompt : editPrompt}
              onChange={e => tab === "generate" ? setPrompt(e.target.value) : setEditPrompt(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              {Object.entries(KEYWORDS).map(([category, words]) =>
                <details key={category} className="rounded-lg bg-slate-950 p-2 text-xs"><summary className="cursor-pointer">{category}</summary>
                  <div className="mt-2 grid gap-1">{words.map(word =>
                    <button type="button" key={word} className="text-left text-teal-300 hover:underline" onClick={() => tab === "generate" ? setPrompt(v => v ? v + ", " + word : word) : setEditPrompt(v => v ? v + ", " + word : word)}>+ {word}</button>
                  )}</div></details>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {IDEAS.map(idea => <button type="button" key={idea.name} className="rounded-md bg-slate-800 px-2 py-1 text-xs" onClick={() => {setTab("generate");setPrompt(idea.prompt);}}>{idea.name}</button>)}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs">Image model<select className={inputClass} value={model} onChange={e => setModel(e.target.value)}>
                <option value="gemini-3.1-flash-lite-image">Gemini Flash Lite</option><option value="gemini-3.1-flash-image">Gemini Flash Image</option>
              </select></label>
              <label className="text-xs">Aspect ratio<select className={inputClass} value={ratio} onChange={e => setRatio(e.target.value)}>
                {["16:9","9:16","1:1","3:4","4:3"].map(v => <option key={v}>{v}</option>)}
              </select></label>
              <label className="text-xs">Detail<select className={inputClass} value={size} onChange={e => setSize(e.target.value)} disabled={model.includes("lite")}>
                {["1K","2K","4K"].map(v => <option key={v}>{v}</option>)}
              </select></label>
              <label className="text-xs">Prompt style<select className={inputClass} value={style} onChange={e => setStyle(e.target.value)}>
                {["cinematic","cyberpunk","anime","automotive-ui","digital-art"].map(v => <option key={v}>{v}</option>)}
              </select></label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className={btnClass} disabled={busy || !provider} onClick={() => void requestImage(tab)}><Wand2 className="mr-1 inline h-4 w-4" />{busy ? "Processing..." : tab === "generate" ? "Create image" : "Refine image"}</button>
              <button className={btnClass} disabled={busy || !provider} onClick={() => void enhance()}><Sparkles className="mr-1 inline h-4 w-4" />Enhance prompt</button>
            </div>
            <div className="space-y-2 border-t border-slate-700 pt-3">
              <h3 className="text-sm font-semibold">Interactive decisions</h3>
              <input className={inputClass} aria-label="Scene introduction" value={intro} onChange={e => setIntro(e.target.value)} />
              <input className={inputClass} aria-label="Left choice" value={left} onChange={e => setLeft(e.target.value)} />
              <input className={inputClass} aria-label="Left outcome" value={leftText} onChange={e => setLeftText(e.target.value)} />
              <input className={inputClass} aria-label="Right choice" value={right} onChange={e => setRight(e.target.value)} />
              <input className={inputClass} aria-label="Right outcome" value={rightText} onChange={e => setRightText(e.target.value)} />
            </div>
            {history.length > 0 && <div className="border-t border-slate-700 pt-3">
              <h3 className="mb-2 text-sm">Recent images (this session)</h3>
              <div className="grid grid-cols-5 gap-2">{history.map(item =>
                <button key={item.id} onClick={() => {setSrc(item.src);setBranch("start");}} title={item.prompt}
                  className="aspect-square overflow-hidden rounded border border-slate-600"><img src={item.src} alt={item.edited ? "Refined image" : "Created image"} className="h-full w-full object-cover" /></button>)}</div>
            </div>}
          </div>
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
              <canvas ref={canvas} width={960} height={540} aria-label="Animated scene preview" className="block aspect-video w-full" />
              {!src && <button type="button" className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-slate-400" onClick={() => fileRef.current?.click()}>
                <Camera className="h-10 w-10" />Upload an image or generate a world to begin</button>}
              {src && <div className="absolute bottom-2 left-2 right-2 rounded-xl bg-slate-950/70 p-2 text-xs">
                <p className="mb-2 font-semibold">{caption}</p>
                {branch === "start" ? <div className="flex flex-wrap gap-2">
                  <button className={btnClass} onClick={() => {setBranch("left");void publishMeshEvent({source:"morph-visual-studio",type:"morph.scene.choice",topic:"visual-morph",payload:{choice:"left"}});}}>{left}</button>
                  <button className={btnClass} onClick={() => {setBranch("right");void publishMeshEvent({source:"morph-visual-studio",type:"morph.scene.choice",topic:"visual-morph",payload:{choice:"right"}});}}>{right}</button>
                </div> : <button className={btnClass} onClick={() => setBranch("start")}><RefreshCw className="mr-1 inline h-3 w-3" />Start again</button>}
              </div>}
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs">Scene motion<select className={inputClass} value={motion} onChange={e => setMotion(e.target.value)}>
                <option value="float">Floating camera</option><option value="pan">Pan left/right</option><option value="zoom">Slow zoom</option>
              </select></label>
              <button className={btnClass} onClick={() => setPlaying(v => !v)} disabled={!src}><Play className="mr-1 inline h-3 w-3" />{playing ? "Pause" : "Play"}</button>
              <button className={btnClass} onClick={() => void record()} disabled={!src || recording}><Film className="mr-1 inline h-3 w-3" />{recording ? "Recording 6s..." : "Record WebM"}</button>
              <button className={btnClass} onClick={() => src && exportWorld(src, choices)} disabled={!src}><Layers className="mr-1 inline h-3 w-3" />Export interactive world</button>
              <button className={btnClass} onClick={() => src && download("morph-source-image.png", src)} disabled={!src}><Download className="mr-1 inline h-3 w-3" />Save image</button>
            </div>
            <p className="text-xs leading-5 text-slate-400">The live scene and exported HTML have clickable branches. WebM is a six-second non-interactive recording of the animated scene. This is animated 2D imagery, not AI-generated character or object motion.</p>
          </div>
        </div>
      </section>}
    </>
  );
}

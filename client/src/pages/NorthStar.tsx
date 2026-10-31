import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Compass, Network, Database, Rocket, Copy, Send, RefreshCcw, ShieldCheck } from "lucide-react";

type Status = {
  ok: boolean;
  hosting: string;
  ontology: { writeEnabled: boolean; addressFields: string[] };
  autoapp: { status: string; launchUrl: string | null };
  p2p: { mode: string; iceUrls: string[] };
};
const fields = ["planetary","dimension","gate","line","color","tone","base","degree","minute","second","arc","zodiac","house"] as const;
const numeric = new Set(["gate","line","color","tone","base","degree","minute","second","house"]);
type Address = Record<string, string>;
const emptyAddress = Object.fromEntries(fields.map(field => [field, ""])) as Address;
type EntityResult = { id: string; kind: string; ref: string; name: string; address: Record<string, unknown>; source: string };
type PeerMessage = { from: string; text: string; received: boolean };
function createConnection(iceUrls: string[]) {
  return new RTCPeerConnection({ iceServers: iceUrls.map(url => ({ urls: url })) });
}
function gathered(pc: RTCPeerConnection): Promise<string> {
  return new Promise((resolve, reject) => {
    if (pc.iceGatheringState === "complete") { resolve(JSON.stringify(pc.localDescription)); return; }
    const timeout = window.setTimeout(() => { pc.removeEventListener("icegatheringstatechange", onChange); reject(new Error("ICE gathering timed out; check your device and connection")); }, 20000);
    function onChange() {
      if (pc.iceGatheringState !== "complete") return;
      window.clearTimeout(timeout);
      pc.removeEventListener("icegatheringstatechange", onChange);
      resolve(JSON.stringify(pc.localDescription));
    }
    pc.addEventListener("icegatheringstatechange", onChange);
  });
}
const pane = "rounded-3xl border border-fuchsia-200/15 bg-[#151125]/90 p-5 shadow-2xl";
const input = "min-w-0 w-full rounded-xl border border-white/15 bg-[#0b0b19] px-3 py-2 text-sm text-fuchsia-50 placeholder:text-slate-500 outline-none focus:border-fuchsia-400";
const btn = "rounded-xl border border-fuchsia-300/25 bg-[#392142] px-4 py-2 text-sm font-semibold text-fuchsia-50 hover:bg-[#56305c] disabled:opacity-40";

export default function NorthStar() {
  const [status, setStatus] = useState<Status | null>(null);
  const [problem, setProblem] = useState("");
  const [token, setToken] = useState("");
  const [kind, setKind] = useState("thing");
  const [name, setName] = useState("");
  const [ref, setRef] = useState("");
  const [source, setSource] = useState("");
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [saved, setSaved] = useState<EntityResult | null>(null);
  const [entityStatus, setEntityStatus] = useState("");
  const [signal, setSignal] = useState("");
  const [remote, setRemote] = useState("");
  const [p2pStatus, setP2pStatus] = useState("Not connected");
  const [peerText, setPeerText] = useState("");
  const [messages, setMessages] = useState<PeerMessage[]>([]);
  const connection = useRef<RTCPeerConnection | null>(null);
  const channel = useRef<RTCDataChannel | null>(null);

  async function refresh() {
    try {
      const response = await fetch("/api/north-star/status", { cache: "no-store" });
      if (!response.ok) throw new Error("North Star backend not available");
      setStatus(await response.json());
      setProblem("");
    } catch (error) { setProblem(String(error)); }
  }
  useEffect(() => { void refresh(); return () => { connection.current?.close(); }; }, []);

  async function admit() {
    setSaved(null);
    setEntityStatus("");
    const coordinates = Object.fromEntries(fields.map(key => [key, numeric.has(key) ? Number(address[key]) : address[key]]));
    if (fields.some(key => address[key].trim() === "")) { setEntityStatus("All 13 source-supported coordinates are required. Nothing has been assigned automatically."); return; }
    try {
      const response = await fetch("/api/north-star/entities", {
        method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + token },
        body: JSON.stringify({ kind, name, ref, source, address: coordinates }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Admission rejected");
      setSaved(result.entity);
      setEntityStatus("Admitted with explicit ontological address and source.");
    } catch (error) { setEntityStatus(String(error)); }
  }
  function attach(pc: RTCPeerConnection, data: RTCDataChannel) {
    channel.current = data;
    data.onopen = () => setP2pStatus("Direct data channel connected");
    data.onclose = () => setP2pStatus("Peer channel closed");
    data.onmessage = (event) => {
      try {
        const text = JSON.parse(event.data);
        if (typeof text?.text === "string" && text.text.length <= 5000) {
          setMessages(prev => [...prev.slice(-99), { from: "Other device (not yet admitted to the shared ontology)", text: text.text, received: true }]);
        }
      } catch { /* Ignore invalid peer messages */ }
    };
    pc.onconnectionstatechange = () => setP2pStatus("WebRTC: " + pc.connectionState);
  }
  function resetPeer() {
    channel.current?.close();
    connection.current?.close();
    channel.current = null;
    connection.current = null;
    setSignal("");
    setP2pStatus("Not connected");
    setMessages([]);
  }
  async function makeOffer() {
    if (!saved || saved.kind !== "person") { setP2pStatus("First admit your own person record with a complete, sourced address."); return; }
    try {
      resetPeer();
      const pc = createConnection(status?.p2p.iceUrls || []);
      connection.current = pc;
      attach(pc, pc.createDataChannel("synthai2-p2p"));
      await pc.setLocalDescription(await pc.createOffer());
      setSignal(await gathered(pc));
      setP2pStatus("Offer ready. Copy it to the other device and paste its answer below.");
    } catch (error) { setP2pStatus(String(error)); }
  }
  async function makeAnswer() {
    if (!saved || saved.kind !== "person") { setP2pStatus("First admit your own person record with a complete, sourced address."); return; }
    try {
      resetPeer();
      const offer = JSON.parse(remote);
      if (offer.type !== "offer" || typeof offer.sdp !== "string") throw new Error("Paste a valid WebRTC offer");
      const pc = createConnection(status?.p2p.iceUrls || []);
      connection.current = pc;
      pc.ondatachannel = event => attach(pc, event.channel);
      await pc.setRemoteDescription(offer);
      await pc.setLocalDescription(await pc.createAnswer());
      setSignal(await gathered(pc));
      setP2pStatus("Answer ready. Send it to the device that created the offer.");
    } catch (error) { setP2pStatus(String(error)); }
  }
  async function applyAnswer() {
    try {
      if (!connection.current) throw new Error("Create an offer first");
      const answer = JSON.parse(remote);
      if (answer.type !== "answer" || typeof answer.sdp !== "string") throw new Error("Paste a valid WebRTC answer");
      await connection.current.setRemoteDescription(answer);
      setP2pStatus("Answer applied. Waiting for a direct connection.");
    } catch (error) { setP2pStatus(String(error)); }
  }
  function sendPeerText() {
    if (!saved || saved.kind !== "person") { setP2pStatus("A sourced person address is required before sending"); return; }
    if (!peerText.trim() || channel.current?.readyState !== "open") return;
    channel.current.send(JSON.stringify({ type: "message", text: peerText.slice(0, 5000) }));
    setMessages(prev => [...prev.slice(-99), { from: saved.name, text: peerText, received: false }]);
    setPeerText("");
  }
  return (
    <main className="min-h-screen bg-[#080b17] px-3 py-8 text-[#f8edff] md:px-8" style={{ backgroundImage: "radial-gradient(circle at 52% 12%, #462449 0, transparent 36%), radial-gradient(circle at 95% 32%, #113b44 0, transparent 28%)" }}>
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/"><span className="inline-flex cursor-pointer items-center gap-2 text-sm text-fuchsia-200"><ArrowLeft size={16}/> Back to Synthai2</span></Link>
        <header className={pane}>
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">Synthai2 · Self-hosted computer</p>
              <h1 className="text-4xl font-semibold tracking-wide md:text-5xl">✧ North Star</h1>
              <p className="max-w-xl text-sm leading-6 text-slate-300">People, places, things, tools, and worlds connected by explicit positions and observed relationships. No invented coordinates. No rainbow overlay.</p>
            </div>
            <svg width="260" height="240" viewBox="0 0 260 240" role="img" aria-label="North Star linked by circular fields to people, places, things and applications">
              <defs><radialGradient id="starGlow"><stop stopColor="#fcd8ed"/><stop offset="1" stopColor="#f472b6" stopOpacity="0"/></radialGradient></defs>
              {[42,76,105].map(radius => <circle key={radius} cx="130" cy="120" r={radius} stroke="#dbb6eb" strokeOpacity=".27" fill="none" strokeWidth="1.5"/>)}
              {[[130,20],[233,120],[130,225],[27,120]].map(([x,y],i) => <g key={i}><line x1="130" y1="120" x2={x} y2={y} stroke="#5eead4" strokeOpacity=".55"/><circle cx={x} cy={y} r="17" fill="#24172c" stroke="#dba8e9" strokeWidth="1.8"/><circle cx={x} cy={y} r="4" fill="#7dd3fc"/></g>)}
              <circle cx="130" cy="120" r="35" fill="url(#starGlow)"/>
              <path d="M130 78L136 113L171 120L136 126L130 162L123 126L89 120L123 113Z" fill="#ffe9ba"/>
              <circle cx="130" cy="120" r="10" fill="#fff"/>
            </svg>
          </div>
        </header>
        <section className="grid gap-5 lg:grid-cols-3">
          <div className={pane}>
            <div className="mb-3 flex items-center gap-2"><Compass className="text-fuchsia-300"/><h2 className="font-semibold">Self-hosted services</h2></div>
            <p className="text-xs leading-5 text-slate-300">The Linux container hosts the backend. The tablet can connect over a reachable local or private network address.</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt>North Star API</dt><dd>{status ? "Responding" : "Unknown"}</dd></div>
              <div className="flex justify-between"><dt>AutoApp backend</dt><dd>{status?.autoapp.status || "Unknown"}</dd></div>
              <div className="flex justify-between"><dt>Ontology writes</dt><dd>{status?.ontology.writeEnabled ? "Configured" : "Not configured"}</dd></div>
              <div className="flex justify-between"><dt>P2P transport</dt><dd>Manual WebRTC</dd></div>
            </dl>
            {problem && <p className="mt-3 text-sm text-rose-300">{problem}</p>}
            <button className={btn + " mt-4 flex items-center gap-2"} onClick={() => void refresh()}><RefreshCcw size={15}/> Refresh actual status</button>
          </div>
          <div className={pane}>
            <div className="mb-3 flex items-center gap-2"><Rocket className="text-cyan-300"/><h2 className="font-semibold">AutoApp builder</h2></div>
            <p className="text-sm leading-6 text-slate-300">The original AutoApp code stays separate. Host its platform inside Linux, then set <code>SYNTHAI_AUTOAPP_URL</code> and a tablet-reachable <code>SYNTHAI_AUTOAPP_PUBLIC_URL</code>.</p>
            {status?.autoapp.launchUrl ?
              <a href={status.autoapp.launchUrl} target="_blank" rel="noopener noreferrer" className={btn + " mt-4 inline-block"}>Open hosted AutoApp</a> :
              <p className="mt-4 rounded-xl border border-amber-300/25 p-3 text-xs text-amber-200">Not launchable yet. This panel intentionally does not pretend the remote builder is running.</p>}
          </div>
          <div className={pane}>
            <div className="mb-3 flex items-center gap-2"><ShieldCheck className="text-teal-200"/><h2 className="font-semibold">What is preserved</h2></div>
            <p className="text-sm leading-6 text-slate-300">Your complete 13-position ontology, original programs, real source provenance, existing IDE, and app registry. Internal record keys are not substitutes for ontological positions.</p>
            <p className="mt-3 text-xs text-slate-400">Only entities admitted through this new gateway are protected by its address rule. Legacy intake paths require a separate migration and audit.</p>
          </div>
        </section>
        <section className={pane}>
          <div className="mb-3 flex items-center gap-2"><Database className="text-fuchsia-300"/><h2 className="text-lg font-semibold">Admit a person, place, or thing</h2></div>
          <p className="mb-4 text-sm text-slate-300">An entity cannot enter this gateway without its complete source-backed address. Missing fields stay unresolved rather than being filled with fabricated positions. Your admin token stays in this page's memory only.</p>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="space-y-1 text-xs">Kind<select className={input} value={kind} onChange={e => setKind(e.target.value)}>{["person","place","thing","app","tool","file","agent","world","project"].map(value => <option key={value}>{value}</option>)}</select></label>
            <label className="space-y-1 text-xs">Name<input className={input} value={name} onChange={e => setName(e.target.value)} placeholder="Actual name"/></label>
            <label className="space-y-1 text-xs">Stable reference<input className={input} value={ref} onChange={e => setRef(e.target.value)} placeholder="person/participant-1"/></label>
            <label className="space-y-1 text-xs">Provenance / source<input className={input} value={source} onChange={e => setSource(e.target.value)} placeholder="Source record or calculation"/></label>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {fields.map(field => <label key={field} className="space-y-1 text-xs"><span className="capitalize">{field}</span>{field === "dimension" ?
              <select className={input} value={address.dimension} onChange={e => setAddress(prev => ({ ...prev, dimension: e.target.value }))}><option value="">Unresolved</option>{["Movement","Evolution","Being","Design","Space"].map(v => <option key={v}>{v}</option>)}</select> :
              <input className={input} type={numeric.has(field) ? "number" : "text"} value={address[field]} placeholder="Unresolved" onChange={e => setAddress(prev => ({ ...prev, [field]: e.target.value }))}/>}</label>)}
          </div>
          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
            <label className="flex-1 space-y-1 text-xs">Local administrator token<input className={input} type="password" autoComplete="off" value={token} onChange={e => setToken(e.target.value)} placeholder="From your Linux container environment"/></label>
            <button className={btn} onClick={() => void admit()}>Admit with address</button>
          </div>
          {entityStatus && <p className="mt-3 text-sm text-fuchsia-200" role="status">{entityStatus}</p>}
          {saved && <p className="mt-2 break-all text-xs text-teal-200">Admitted: {saved.id} · {fields.map(field => String(saved.address[field])).join(".")}</p>}
        </section>
        <section className={pane}>
          <div className="mb-3 flex items-center gap-2"><Network className="text-teal-200"/><h2 className="text-lg font-semibold">P2P · Device-to-device connection</h2></div>
          <p className="mb-4 text-sm leading-6 text-slate-300">Real browser WebRTC data channels, with manual offer/answer exchange. No third-party signaling server. On different networks, a self-hosted STUN/TURN service or reachable peer path may be needed. This is a transport test, not yet a verified social identity or matching service.</p>
          <p className="mb-3 text-xs text-teal-200">Your person record must first be admitted above. Remote peers are not automatically trusted or inserted into the ontology.</p>
          <div className="flex flex-wrap gap-2">
            <button className={btn} onClick={() => void makeOffer()}>1 · Create offer</button>
            <button className={btn} onClick={() => void makeAnswer()}>2 · Accept offer and make answer</button>
            <button className={btn} onClick={() => void applyAnswer()}>3 · Apply received answer</button>
            <button className={btn} onClick={resetPeer}>Reset</button>
          </div>
          <p className="my-3 text-sm text-cyan-200" role="status">{p2pStatus}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2 text-xs">Your signal — copy to other device<textarea className={input} rows={5} readOnly value={signal}/><button className={btn + " flex items-center gap-1"} disabled={!signal} onClick={() => void navigator.clipboard.writeText(signal)}><Copy size={14}/> Copy signal</button></label>
            <label className="space-y-2 text-xs">Signal from other device<textarea className={input} rows={5} value={remote} onChange={e => setRemote(e.target.value)} placeholder="Paste an offer or answer received from the other device"/></label>
          </div>
          <div className="mt-4 max-h-44 space-y-2 overflow-auto rounded-xl border border-white/10 p-3">
            {messages.length ? messages.map((msg,i) => <p key={i} className="text-sm"><strong className={msg.received ? "text-cyan-300" : "text-fuchsia-300"}>{msg.from}: </strong>{msg.text}</p>) : <p className="text-xs text-slate-500">No P2P messages yet.</p>}
          </div>
          <div className="mt-3 flex gap-2"><input className={input} value={peerText} onChange={e => setPeerText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendPeerText(); }} placeholder="Message your connected device"/><button className={btn} disabled={channel.current?.readyState !== "open"} onClick={sendPeerText}><Send size={15}/></button></div>
        </section>
      </div>
    </main>
  );
}

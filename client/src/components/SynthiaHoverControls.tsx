import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getAssistantOpen, setAssistantOpen, useAssistantDock } from '@/lib/assistantDock';

interface Recognition {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null; onend: (() => void) | null;
  start(): void; stop(): void;
}
type RecognitionConstructor = new () => Recognition;
const KEY = 'synthia-hover-settings';

export function SynthiaHoverControls({ setInput, busy }: { setInput: (value: string) => void; busy: boolean }) {
  const open = useAssistantDock();
  const [settings, setSettings] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem(KEY) || '{}'); return { hover: saved.hover === true, shortcut: /^[a-z]$/.test(saved.shortcut) ? saved.shortcut : 's' }; }
    catch { return { hover: false, shortcut: 's' }; }
  });
  const [editing, setEditing] = useState(false);
  const [listening, setListening] = useState(false);
  const [notice, setNotice] = useState('');
  const recognition = useRef<Recognition | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* Storage can be disabled. */ }
    const keydown = (event: KeyboardEvent) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === settings.shortcut) {
        event.preventDefault(); setAssistantOpen(!getAssistantOpen());
      }
      if (event.key === 'Escape' && getAssistantOpen()) setAssistantOpen(false);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [settings]);
  useEffect(() => () => { clearTimeout(timer.current); recognition.current?.stop(); }, []);
  const dictate = () => {
    if (listening) { recognition.current?.stop(); return; }
    const browser = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
    const Constructor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!Constructor) { setNotice('Voice input is unavailable in this browser. You can type to Synthia below.'); return; }
    const mic = new Constructor(); recognition.current = mic;
    mic.lang = navigator.language || 'en-US'; mic.continuous = false; mic.interimResults = false;
    mic.onresult = event => { setInput(event.results[0][0].transcript); setNotice('Your words are ready below. Press Send when ready.'); };
    mic.onerror = () => { setNotice('Microphone unavailable. Check browser permissions or type below.'); setListening(false); };
    mic.onend = () => setListening(false);
    try { mic.start(); setListening(true); setNotice('Listening…'); }
    catch { setListening(false); setNotice('Could not start the microphone.'); }
  };
  return <div className={`fixed ${open ? "top-4" : "bottom-24"} right-6 z-[110] max-w-[calc(100vw-3rem)] rounded-xl border bg-card p-2 shadow-lg`}
    onMouseEnter={() => { if (settings.hover) timer.current = setTimeout(() => setAssistantOpen(true), 350); }}
    onMouseLeave={() => clearTimeout(timer.current)}>
    <div className="flex flex-wrap gap-1">
      <Button size="sm" variant="outline" onClick={() => setAssistantOpen(!getAssistantOpen())} title={`Alt+${settings.shortcut.toUpperCase()}`}>Synthia</Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => { setAssistantOpen(true); dictate(); }} aria-pressed={listening}>{listening ? 'Stop mic' : 'Talk'}</Button>
      <Button size="sm" variant="outline" onClick={() => { setAssistantOpen(true); setInput('check my GitHub connection'); }}>GitHub</Button>
      <Button size="sm" variant="ghost" onClick={() => setEditing(!editing)} aria-expanded={editing} aria-label="Configure Synthia shortcuts">⚙</Button>
    </div>
    {editing && <div className="mt-2 space-y-2 text-xs">
      <label className="flex items-center gap-2"><input type="checkbox" checked={settings.hover} onChange={e => setSettings({ ...settings, hover: e.target.checked })} />Open Synthia on hover</label>
      <label className="flex items-center gap-2">Shortcut: Alt + <select value={settings.shortcut} onChange={e => setSettings({ ...settings, shortcut: e.target.value })} className="rounded border bg-background p-1">{['s','a','j'].map(key => <option key={key} value={key}>{key.toUpperCase()}</option>)}</select></label>
      <a href="/settings" className="block underline">AI connection settings</a>
      <a href="/contact-lab" target="_blank" rel="noreferrer" className="block underline">Shona + B.A.N.T.U. contact lab ↗</a>
    </div>}
    {notice && <p role="status" className="mt-2 max-w-72 text-xs">{notice}</p>}
  </div>;
}

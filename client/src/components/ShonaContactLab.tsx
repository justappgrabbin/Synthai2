import { useRef, useState } from 'react';
import { analyzeShona, SHONA_SOURCE } from '@/lib/shonaMorphology';
import { readContactHistory } from '@/lib/contactReasoning';
import { analyzeKleinContact } from '@/lib/klein/semanticContact.mjs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function ShonaContactLab() {
  const [text, setText] = useState('Mwana kumhanya mumunda. Ndichakupai.');
  const [result, setResult] = useState<ReturnType<typeof analyzeShona> | null>(null);
  const [history, setHistory] = useState(readContactHistory);
  const [klein, setKlein] = useState<ReturnType<typeof analyzeKleinContact> | null>(null);
  const bridge = useRef<HTMLIFrameElement>(null);
  const run = () => {
    setResult(analyzeShona(text));
    const document = bridge.current?.contentDocument;
    const input = document?.getElementById('input') as HTMLTextAreaElement | null;
    if (input) { input.value = text; document?.getElementById('build')?.click(); }
  };
  return <main className="mx-auto max-w-5xl space-y-4 p-6">
    <h1 className="text-2xl font-semibold">Synthia · Rules lab</h1>
    <p>Test your supplied AUTOLING and DISEMINER implementations on text. Grammar matches and word similarities are candidates you can inspect and correct.</p>
    <Button variant="outline" onClick={() => setKlein(analyzeKleinContact(text))}>Test Klein reasoning</Button>
    {klein && <details open className="rounded border p-3"><summary>Actual Klein results · {klein.source}</summary><pre className="overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(klein, null, 2)}</pre></details>}
    <p>Analyze Shona examples with source references, then encode the same text in your original B.A.N.T.U. bridge.</p>
    <p className="text-sm text-muted-foreground">This is a bounded Shona rule layer. Prefix candidates remain unresolved until context verifies them. Linguistic tone and NSNF address mappings are separate, currently unavailable inputs.</p>
    <a href={SHONA_SOURCE} target="_blank" rel="noreferrer" className="underline">Read the Shona morphology source ↗</a>
    <label htmlFor="shona-input" className="block">Shona text</label>
    <Textarea id="shona-input" value={text} onChange={e=>setText(e.target.value)} maxLength={10000} />
    <Button onClick={run}>Analyze and encode</Button>
    {result && <div className="overflow-auto rounded-lg border p-4">
      <table className="w-full text-left text-sm"><thead><tr><th className="p-2">Token</th><th className="p-2">Analysis</th><th className="p-2">Evidence</th></tr></thead>
        <tbody>{result.tokens.map((token,index)=><tr key={index} className="border-t">
          <td className="p-2 align-top">{token.token}</td>
          <td className="p-2">{token.lemma && <p>Lemma/stem: {token.lemma} · {token.pos}</p>}<pre className="whitespace-pre-wrap">{JSON.stringify(token.features)}</pre>{token.candidates && <p>Candidate classes: {token.candidates.map(c=>c.nounClass).join(', ')}</p>}<p>{token.note}</p></td>
          <td className="p-2 align-top">{token.evidence}<br/>§{token.section}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    <section className="space-y-2 rounded-lg border p-4">
      <h2 className="text-lg font-semibold">Synthia’s recorded contact traces</h2>
      <p className="text-sm">Observed parts → relationships and constraints → action → actual outcome. These are rule-layer traces, not neural-field activation.</p>
      <Button variant="outline" onClick={()=>setHistory(readContactHistory())}>Refresh traces</Button>
      {history.length === 0 && <p>No completed conversations or tool requests recorded yet.</p>}
      {history.slice(-10).reverse().map(trace=><details key={trace.id} className="rounded border p-2"><summary>{trace.macro.action} · {trace.outcome?.status || 'unverified'} · {trace.createdAt}</summary><pre className="overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(trace,null,2)}</pre></details>)}
    </section>
    <iframe ref={bridge} src="/contact-lab/index.html" title="Original B.A.N.T.U. v0.2 encoding bridge" className="h-[800px] w-full rounded-lg border" />
  </main>;
}

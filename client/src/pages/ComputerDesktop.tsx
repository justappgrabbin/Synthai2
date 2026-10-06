import {useState} from 'react';
import {useLocation} from 'wouter';
import {ComputerWorkspaceTools} from '@/components/ComputerWorkspaceTools';
const APPS = [
 {id:'computer',label:'Your computer',src:'/computer/index.html?host=synthai2'},
 {id:'overview',label:'Human Design workspace',src:'/synthia-phone/index.html'},
 {id:'assistant',label:'Synthia assistant',src:'/synthia-phone/index.html?panel=assistant'},
 {id:'training',label:'Local training',src:'/synthia-phone/index.html?panel=training'},
 {id:'autolab',label:'Auto Lab',src:'/synthia-phone/index.html?panel=autolab'},
 {id:'swarm',label:'Swarm / automata',src:'/synthia-phone/index.html?panel=swarm'},
 {id:'studio',label:'Publishing Studio',src:'/synthia-phone/index.html?panel=studio'},
];
export default function ComputerDesktop(){
 const [,navigate]=useLocation();
 const [active,setActive]=useState('computer'),[tools,setTools]=useState(false),[revision,setRevision]=useState(0);
 const app=APPS.find(app=>app.id===active)||APPS[0];
 return <section className="bg-background text-foreground" style={{height:'100dvh',display:'flex',flexDirection:'column',paddingTop:'env(safe-area-inset-top)',paddingBottom:'env(safe-area-inset-bottom)'}} aria-label="Computer app hub">
  <header className="flex flex-wrap items-center gap-2 border-b p-2">
   <button className="min-h-11 rounded-md border px-3 text-sm" onClick={()=>navigate('/')}>← Home</button>
   <label className="min-w-0 flex-1"><span className="sr-only">Quick launch</span><select aria-label="Quick launch" className="min-h-11 w-full rounded-md border bg-background px-2 text-sm" value={active} onChange={event=>setActive(event.target.value)}>{APPS.map(app=><option key={app.id} value={app.id}>{app.label}</option>)}</select></label>
   <button className="min-h-11 rounded-md border px-3 text-sm" onClick={()=>setTools(true)}>Workspace</button>
  </header>
  <iframe key={`${active}-${revision}`} src={app.src} title={active==='computer'?'Computer app hub':app.label} style={{border:0,width:'100%',flex:1,minHeight:0}} />
  <ComputerWorkspaceTools open={tools} onClose={()=>setTools(false)} onRestored={()=>{setTools(false);setRevision(r=>r+1);}} />
 </section>;
}

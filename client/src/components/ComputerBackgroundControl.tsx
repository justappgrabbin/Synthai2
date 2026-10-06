import {useState,type CSSProperties} from 'react';
export type ComputerBackground = {kind:'default'|'web-linux'|'night'|'custom';image?:string};
const KEY='synthia-computer-background';
export function readComputerBackground():ComputerBackground{
 try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');if(p.kind==='web-linux'||p.kind==='night')return {kind:p.kind};if(p.kind==='custom'&&typeof p.image==='string'&&p.image.length<2000000&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(p.image))return p;}catch{}
 return {kind:'default'};
}
export function computerBackgroundStyle(p:ComputerBackground):CSSProperties|undefined{
 const image=p.kind==='web-linux'?'/computer-backgrounds/web-linux.jpg':p.kind==='night'?'/computer-backgrounds/night.svg':p.kind==='custom'?p.image:undefined;
 return image?{backgroundImage:`linear-gradient(#08121b55,#08121b55),url("${image}")`,backgroundSize:'cover',backgroundPosition:'center',backgroundAttachment:'fixed'}:undefined;
}
export function ComputerBackgroundControl({value,onChange}:{value:ComputerBackground;onChange:(value:ComputerBackground)=>void}){
 const [open,setOpen]=useState(false),[error,setError]=useState('');
 const save=(next:ComputerBackground)=>{try{localStorage.setItem(KEY,JSON.stringify(next));onChange(next);setError('');}catch{setError('Device storage is full. Choose a smaller background.');}};
 return <div><button className="rounded-md border bg-background/90 px-3 py-2 text-sm" onClick={()=>setOpen(!open)}>Background</button>{open&&<div className="absolute right-4 top-20 z-50 w-[min(340px,calc(100vw-32px))] rounded-xl border bg-card p-4 shadow-xl" role="dialog" aria-label="Computer background"><div className="mb-3 flex items-center justify-between"><strong>Computer background</strong><button onClick={()=>setOpen(false)} aria-label="Close background settings">✕</button></div><label className="block text-sm">Choose a background<select className="mt-2 w-full rounded border bg-background p-2" value={value.kind==='custom'?'default':value.kind} onChange={event=>save({kind:event.target.value as ComputerBackground['kind']})}><option value="default">Original SynthAI layout</option><option value="web-linux">Web Linux background</option><option value="night">Night</option></select></label><label className="mt-4 block text-sm">Use your own image<input type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 w-full" onChange={event=>{const file=event.target.files?.[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>1400000){setError('Choose a PNG, JPG or WebP under 1.4 MB.');return;}const reader=new FileReader();reader.onload=()=>save({kind:'custom',image:String(reader.result)});reader.readAsDataURL(file);}} /></label><p className="mt-3 text-xs text-muted-foreground">Saved on this device. Use Edit to arrange the app tray and dashboard widgets.</p>{error&&<p role="status" className="mt-2 text-sm">{error}</p>}</div>}</div>;
}

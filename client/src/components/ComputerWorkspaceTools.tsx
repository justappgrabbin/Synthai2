import {useState} from 'react';
import {Capacitor,registerPlugin} from '@capacitor/core';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {createWorkspaceBackup,parseWorkspaceBackup,restoreWorkspaceBackup,backupSummary,MAX_BACKUP_BYTES,type WorkspaceBackup} from '@/lib/computerBackup';

const Filesystem=registerPlugin<{writeFile:(options:{path:string;data:string;directory:string;encoding:string})=>Promise<{uri:string}>}>('Filesystem');
const Share=registerPlugin<{share:(options:{title:string;files:string[];dialogTitle:string})=>Promise<unknown>}>('Share');
export function ComputerWorkspaceTools({open,onClose,onRestored}:{open:boolean;onClose:()=>void;onRestored:()=>void}){
 const [message,setMessage]=useState(''),[pending,setPending]=useState<WorkspaceBackup|null>(null),[busy,setBusy]=useState(false);
 const close=()=>{setPending(null);setMessage('');onClose();};
 const exportBackup=async()=>{
  setBusy(true);setMessage('');
  try{
   const backup=createWorkspaceBackup(localStorage),data=JSON.stringify(backup),name=`Synthia-backup-${new Date().toISOString().slice(0,10)}.synthia-backup`;
   if(Capacitor.isNativePlatform()){
    const {uri}=await Filesystem.writeFile({path:name,data,directory:'CACHE',encoding:'utf8'});
    await Share.share({title:'Synthia workspace backup',files:[uri],dialogTitle:'Save your workspace backup'});
    setMessage('Backup prepared. Save it using the Android share sheet.');
   }else{
    const url=URL.createObjectURL(new Blob([data],{type:'application/octet-stream'}));
    const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    setMessage('Your workspace backup download is ready.');
   }
  }catch(error){setMessage(error instanceof Error?error.message:'Could not export your workspace.');}finally{setBusy(false);}
 };
 const importBackup=async(file:File)=>{
  setPending(null);setMessage('');
  try{if(file.size>MAX_BACKUP_BYTES)throw Error('Choose a backup under 12 MB.');setPending(parseWorkspaceBackup(await file.text()));}
  catch(error){setMessage(error instanceof Error?error.message:'Could not read the backup.');}
 };
 const restore=()=>{
  if(!pending)return;
  try{restoreWorkspaceBackup(localStorage,pending);onRestored();setPending(null);setMessage('');}
  catch{setMessage('The backup could not fit in device storage. Your previous data was kept.');}
 };
 const summary=pending?backupSummary(pending):null;
 return <Dialog open={open} onOpenChange={value=>{if(!value)close();}}><DialogContent className="max-h-[85dvh] overflow-y-auto"><DialogHeader><DialogTitle>Workspace</DialogTitle><DialogDescription>Charts and computer preferences stay on this device.</DialogDescription></DialogHeader>
  <section className="rounded-lg border p-3"><h3 className="font-semibold">Available on your phone</h3><p className="mt-1 text-sm text-muted-foreground">The computer hub, chart workspace, reflections, and file analysis are bundled in this app. Training and publishing need the connected local service; opening a panel does not start a job.</p><p className="mt-2 text-xs">Computer hub 1.1 · Android test build</p></section>
  <section><h3 className="font-semibold">Keep a copy of your workspace</h3><p className="mt-1 text-sm text-muted-foreground">Includes both Human Design chart workspaces, saved reflections and conversations, backgrounds, desktop icons, and computer settings. Other apps’ files and model weights are separate.</p><button className="mt-3 min-h-11 rounded-md border px-4" disabled={busy} onClick={exportBackup}>{busy?'Preparing backup…':'Save workspace backup'}</button></section>
  <label className="block text-sm font-medium">Restore a workspace backup<input className="mt-2 block w-full text-sm" type="file" accept=".synthia-backup,application/octet-stream" onChange={event=>{const file=event.target.files?.[0];if(file)void importBackup(file);event.target.value='';}} /></label>
  {summary&&<section className="rounded-lg border p-3" aria-label="Backup preview"><h3 className="font-semibold">Review before restoring</h3><p className="mt-2 text-sm">{summary.charts} charts · {summary.reflections} reflections · {summary.conversations} messages · {summary.preferences} computer settings</p><p className="mt-2 text-sm text-muted-foreground">Saved {new Date(pending!.createdAt).toLocaleString()}. Restoring replaces the matching saved workspaces and preferences on this device.</p><div className="mt-3 flex gap-2"><button className="min-h-11 rounded-md bg-primary px-4 text-primary-foreground" onClick={restore}>Restore this backup</button><button className="min-h-11 rounded-md border px-3" onClick={()=>setPending(null)}>Cancel</button></div></section>}
  {message&&<p role="status" className="text-sm">{message}</p>}
 </DialogContent></Dialog>;
}

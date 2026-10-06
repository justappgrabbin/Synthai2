export const BACKUP_KEYS = ['synthia-workspace-v1','synthia-human-design-charts-v1','synthia-computer-background','synthia_computer_preferences','ubuntuos_desktop_icons','ubuntuos_settings'] as const;
export const MAX_BACKUP_BYTES = 12 * 1024 * 1024;
export type WorkspaceBackup = {format:'synthia-workspace-backup';version:1;createdAt:string;entries:Record<string,string>};
type StorageAccess = Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const isObject=(value:unknown):value is Record<string,unknown>=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
function validateEntry(key:string,text:string){
 const value:unknown=JSON.parse(text);
 if(key==='synthia-workspace-v1'){
  if(!isObject(value)||!['profiles','notes','chat'].every(field=>Array.isArray(value[field])))throw Error('The chart workspace is incomplete.');
  if(!(value.profiles as unknown[]).every(p=>{if(!isObject(p)||typeof p.id!=='string'||typeof p.name!=='string'||!isObject(p.chart))return false;const chart=p.chart;return ['channels','centers','activeGates'].every(field=>Array.isArray(chart[field]))&&isObject(chart.geonatal)&&Array.isArray(chart.geonatal.placements);}))throw Error('A saved profile is invalid.');
  if(![...(value.notes as unknown[]),...(value.chat as unknown[])].every(item=>isObject(item)&&typeof item.text==='string'))throw Error('A saved reflection or message is invalid.');
  if(value.active!==null&&typeof value.active!=='string')throw Error('The active profile is invalid.');
 }else if(key==='synthia-human-design-charts-v1'){
  if(!Array.isArray(value)||!value.every(chart=>isObject(chart)&&typeof chart.id==='string'&&['subject','summary','centers','activations','variables','evidence'].every(field=>isObject(chart[field]))&&Array.isArray(chart.channels)&&Array.isArray(chart.gates)))throw Error('A saved chart is invalid.');
 }else if(key==='ubuntuos_desktop_icons'){
  if(!Array.isArray(value)||!value.every(icon=>isObject(icon)&&typeof icon.id==='string'&&typeof icon.name==='string'&&typeof icon.icon==='string'&&isObject(icon.position)&&Number.isFinite(icon.position.x)&&Number.isFinite(icon.position.y)))throw Error('A desktop entry is invalid.');
 }else if(!isObject(value))throw Error('A computer preference is invalid.');
}
export function parseWorkspaceBackup(text:string):WorkspaceBackup{
 if(new TextEncoder().encode(text).byteLength>MAX_BACKUP_BYTES)throw Error('Choose a backup under 12 MB.');
 const value:unknown=JSON.parse(text);
 if(!isObject(value)||value.format!=='synthia-workspace-backup'||value.version!==1||typeof value.createdAt!=='string'||!Number.isFinite(Date.parse(value.createdAt))||!isObject(value.entries))throw Error('Choose a Synthia workspace backup.');
 const entries:Record<string,string>={};
 for(const [key,entry] of Object.entries(value.entries)){
  if(!(BACKUP_KEYS as readonly string[]).includes(key)||typeof entry!=='string')throw Error('This backup contains unsupported settings.');
  validateEntry(key,entry);entries[key]=entry;
 }
 if(!Object.keys(entries).length)throw Error('This backup has no saved charts or computer preferences.');
 return {format:'synthia-workspace-backup',version:1,createdAt:value.createdAt,entries};
}
export function createWorkspaceBackup(storage:StorageAccess):WorkspaceBackup{
 const entries:Record<string,string>={};
 for(const key of BACKUP_KEYS){const value=storage.getItem(key);if(value!==null)entries[key]=value;}
 return parseWorkspaceBackup(JSON.stringify({format:'synthia-workspace-backup',version:1,createdAt:new Date().toISOString(),entries}));
}
export function restoreWorkspaceBackup(storage:StorageAccess,backup:WorkspaceBackup){
 const checked=parseWorkspaceBackup(JSON.stringify(backup));
 const previous=new Map(Object.keys(checked.entries).map(key=>[key,storage.getItem(key)]));
 try{for(const [key,value] of Object.entries(checked.entries))storage.setItem(key,value);}
 catch(error){for(const key of previous.keys())storage.removeItem(key);for(const [key,value] of previous){if(value!==null)storage.setItem(key,value);}throw error;}
}
export function backupSummary(backup:WorkspaceBackup){
 const workspace=JSON.parse(backup.entries['synthia-workspace-v1']||'{}');
 const existing=JSON.parse(backup.entries['synthia-human-design-charts-v1']||'[]');
 return {charts:(workspace.profiles?.length||0)+existing.length,reflections:workspace.notes?.length||0,conversations:workspace.chat?.length||0,preferences:Object.keys(backup.entries).filter(key=>!['synthia-workspace-v1','synthia-human-design-charts-v1'].includes(key)).length};
}

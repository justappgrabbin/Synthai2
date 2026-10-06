import assert from 'node:assert/strict';
import {calculateChart} from '../client/public/synthia-phone/deep-engine.mjs';
const {createWorkspaceBackup,parseWorkspaceBackup,restoreWorkspaceBackup,backupSummary}=await import(process.argv[2]);
class MemoryStorage{
 data=new Map();fail=null;
 getItem(key){return this.data.get(key)??null;}
 setItem(key,value){if(this.fail===key){this.fail=null;throw Error('quota');}this.data.set(key,value);}
 removeItem(key){this.data.delete(key);}
}
const storage=new MemoryStorage();
storage.setItem('synthia-workspace-v1',JSON.stringify({profiles:[{id:'example',name:'Example',chart:calculateChart(new Date('1990-01-01T12:00:00Z'),{latitude:0,longitude:0})}],notes:[{text:'Observation'}],chat:[],active:'example'}));
storage.setItem('synthia-computer-background','{"kind":"night"}');
storage.setItem('api-token','not-for-export');
const backup=createWorkspaceBackup(storage);
assert.equal(backupSummary(backup).charts,1);
assert.equal(backupSummary(backup).reflections,1);
assert(!('api-token' in backup.entries));
assert.deepEqual(parseWorkspaceBackup(JSON.stringify(backup)),backup);
assert.throws(()=>parseWorkspaceBackup(JSON.stringify({...backup,entries:{'api-token':'"anything"'}})),/unsupported/);
assert.throws(()=>parseWorkspaceBackup(JSON.stringify({...backup,version:2})),/Synthia/);
assert.throws(()=>parseWorkspaceBackup(JSON.stringify({...backup,entries:{'synthia-workspace-v1':'{}'}})),/incomplete/);
const target=new MemoryStorage();
target.setItem('synthia-computer-background','{"kind":"default"}');
target.setItem('api-token','keep-on-device');
target.fail='synthia-computer-background';
assert.throws(()=>restoreWorkspaceBackup(target,backup),/quota/);
assert.equal(target.getItem('synthia-workspace-v1'),null);
assert.equal(target.getItem('synthia-computer-background'),'{"kind":"default"}');
restoreWorkspaceBackup(target,backup);
assert.equal(target.getItem('synthia-workspace-v1'),backup.entries['synthia-workspace-v1']);
assert.equal(target.getItem('api-token'),'keep-on-device');
console.log('Backup roundtrip, validation, credential exclusion, and storage-failure rollback passed.');

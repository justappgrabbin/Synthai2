/**
 * 3D view driven by the ORIGINAL Simlish WorldSession and original Simlish
 * one-photo -> MHR rig builder. This is an additive renderer, not another
 * simulation, character engine, or invented ontology.
 */
import * as THREE from "./vendor/three/three.module.js";
import { GLTFLoader } from "./vendor/three/GLTFLoader.js";
import { GLTFExporter } from "./vendor/three/GLTFExporter.js";
import { buildFullAvatar } from "./full-avatar.mjs";
import { planBodyForm } from "./body-form.mjs";
import { PhotoIdentityStore } from "./photo-identity.mjs";
import { readProject, saveProject } from "./project-store.mjs";
import { AVATAR_THEMES } from "./avatar-theme.mjs";

const canvas = document.getElementById("simlish3DWorld");
const status = document.getElementById("simlish3DStatus");
const panel = canvas?.closest(".simlish-three-panel");
const activate = document.getElementById("simlish3DActivate");
if (!canvas || !status || !panel) throw Error("Original Simlish 3D world mount missing");
panel.style.cssText = "max-width:720px;margin:12px auto;padding:10px;border:1px solid #9d75c777;border-radius:12px;background:#131122";
canvas.style.cssText = "display:block;width:100%;height:auto;touch-action:none;border-radius:8px";
if (activate) activate.style.cssText="display:block;margin:8px auto;padding:10px 16px;border:1px solid #ebc6ff;border-radius:9px;background:#673a8a;color:white;cursor:pointer";

let renderer, scene, camera, worldGroup, avatar, mixer, lastTime=0;
let angle=0.42, tilt=0.48, pointer=null, requestBusy=false;
let lastSnapshot=null;
const identityStore = new PhotoIdentityStore();
const statusEvent = (state,reason=null) =>
  dispatchEvent(new CustomEvent("synthai2:character-3d-status",{detail:{status:state,reason}}));

function initialize() {
  if (renderer) return true;
  try {
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"default"});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.setSize(720,410,false);
    scene=new THREE.Scene();
    scene.background=new THREE.Color("#17132d");
    camera=new THREE.PerspectiveCamera(48,720/410,0.1,120);
    scene.add(new THREE.HemisphereLight(0xffffff,0x483461,2));
    const sunlight=new THREE.DirectionalLight(0xffeed4,2.2);
    sunlight.position.set(-4,9,7);
    scene.add(sunlight);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(24,24),new THREE.MeshStandardMaterial({color:0x29213a,roughness:.96}));
    floor.rotation.x=-Math.PI/2; floor.position.y=-.025;
    scene.add(floor);
    const grid=new THREE.GridHelper(20,20,0x6d487b,0x3d3154);
    grid.position.y=.002;scene.add(grid);
    worldGroup=new THREE.Group();
    scene.add(worldGroup);
    canvas.addEventListener("pointerdown",e=>{pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
    canvas.addEventListener("pointermove",e=>{
      if (!pointer) return;
      angle+=(e.clientX-pointer.x)*.009;
      tilt=Math.max(.13,Math.min(1.3,tilt+(e.clientY-pointer.y)*.006));
      pointer={x:e.clientX,y:e.clientY};
    });
    canvas.addEventListener("pointerup",()=>pointer=null);
    canvas.addEventListener("pointercancel",()=>pointer=null);
    function tick(now){
      if(!renderer)return;
      const dt=lastTime?Math.min(.05,(now-lastTime)/1000):0;lastTime=now;
      if(mixer)mixer.update(dt);
      const distance=15;
      camera.position.set(Math.sin(angle)*distance*Math.cos(tilt),4+distance*Math.sin(tilt),Math.cos(angle)*distance*Math.cos(tilt));
      camera.lookAt(0,1,0);
      renderer.render(scene,camera);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    status.textContent="3D Simlish world initialized. Rotate with a finger; build or load your 3D character when ready.";
    dispatchEvent(new CustomEvent("simlish-world-snapshot-request"));
    return true;
  }catch(error){
    status.textContent="3D rendering unavailable: "+error.message+". The original playable world remains available.";
    return false;
  }
}

const material=(color)=>new THREE.MeshStandardMaterial({color,roughness:.8,metalness:.05});
function addBox(group,x,y,z,sx,sy,sz,color) {
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material(color));
  mesh.position.set(x,y,z);group.add(mesh);return mesh;
}
function objectMesh(object) {
  const group=new THREE.Group();
  group.name=object.id;
  const scale=Math.max(.3,Math.min(2.6,(Number(object.sx)||1)*(1+(Number(object.morphState)||0)*.07)));
  const ht=Math.max(.4,Math.min(3,(Number(object.sy)||1)));
  const depth=Math.max(.3,Math.min(2.4,Number(object.sz)||1));
  switch(object.type){
    case "chair":
      addBox(group,0,.48,0,scale,.16,depth,0xa785cc);
      addBox(group,0,.92,-depth*.39,scale,.92,.13,0x714e9f);
      for (const x of [-scale*.37,scale*.37]) for(const z of [-depth*.35,depth*.35])
        addBox(group,x,.23,z,.12,.45,.12,0x614879);
      break;
    case "table":
      addBox(group,0,ht,0,scale*1.5,.16,depth*1.5,0xcba5b6);
      for(const x of [-scale*.6,scale*.6])for(const z of [-depth*.55,depth*.55])
        addBox(group,x,ht/2,z,.13,ht,.13,0x77556b);
      break;
    case "plant":{
      addBox(group,0,.22,0,.48,.44,.48,0x8a6170);
      addBox(group,0,.9,0,.13,1,.13,0x587e50);
      const leaves=new THREE.Mesh(new THREE.SphereGeometry(.58,12,8),material(0x6aaa70));
      leaves.scale.y=.62;leaves.position.y=1.35;group.add(leaves);break;
    }
    case "door":addBox(group,0,ht/2,0,scale*.95,ht,depth*.12,0x976cba);break;
    case "food":{
      const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.43,.29,.24,20),material(0xf2b6bd));
      bowl.position.y=.14;group.add(bowl);break;
    }
    case "beacon":{
      const jewel=new THREE.Mesh(new THREE.OctahedronGeometry(.7),material(0xfac977));
      jewel.position.y=1.2;group.add(jewel);break;
    }
    default: addBox(group,0,ht/2,0,scale,ht,depth,0xae9ed9);
  }
  const position=object.particle;
  group.position.set(Number(position?.x ?? object.x+5)-5,0,Number(position?.y ?? object.z+5)-5);
  return group;
}
function disposeGroup(group) {
  group.traverse(n=>{
    n.geometry?.dispose();
    if(n.material)for(const m of (Array.isArray(n.material)?n.material:[n.material]))m?.dispose();
  });
}
function renderSnapshot(snapshot) {
  if(!snapshot || !Array.isArray(snapshot.objects)) return;
  lastSnapshot=snapshot;
  if(!renderer && !initialize()) return;
  for(const child of [...worldGroup.children]){worldGroup.remove(child);disposeGroup(child);}
  for(const object of snapshot.objects) if(!object.removed)worldGroup.add(objectMesh(object));
  // Real world sessions control their own positions and geometry.
  if(!avatar)status.textContent="Live 3D: "+worldGroup.children.length+" real world objects · "+snapshot.interactions+" actions · "+snapshot.composites.length+" swarm composites. Load a 3D character with the button.";
}

function setAvatar(gltf,world) {
  if(!renderer && !initialize()) throw Error("WebGL not available");
  if(avatar){scene.remove(avatar);disposeGroup(avatar);}
  avatar=gltf.scene;
  avatar.position.set(0,0,2.2);
  avatar.scale.setScalar(1);
  scene.add(avatar);
  mixer=gltf.animations?.length?new THREE.AnimationMixer(avatar):null;
  if(mixer)mixer.clipAction(gltf.animations[0]).play();
  const color=AVATAR_THEMES[world]?.background;
  if(color)scene.background.set(color);
  status.textContent="Rigged 3D character loaded with original face identity and animation; drag to orbit the world.";
}

function fromDataURL(data) {
  if(typeof data!=="string" || !data.startsWith("data:model/gltf-binary;base64,")) throw Error("Saved avatar is not an original GLB");
  const str=atob(data.split(",")[1]);
  return Uint8Array.from(str,x=>x.charCodeAt(0));
}
function toDataURL(bytes) {
  // Avoid stack overflow from spreading multi-megabyte GLB byte arrays.
  let str="";
  for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return "data:model/gltf-binary;base64,"+btoa(str);
}
function openPhoto(data) {
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(Error("Saved portrait could not be decoded"));
    img.src=data;
  });
}

async function loadOrBuildCharacter() {
  if(requestBusy) return;
  requestBusy=true;
  if(activate)activate.disabled=true;
  try {
    status.textContent="Reading your original local Simlish character project…";
    const project=await readProject();
    if(!project?.photo) {
      status.textContent="No identity portrait is saved yet. Open Character Studio and choose your photo.";
      statusEvent("needs_input","Save an identity photo in Character Studio");
      return;
    }
    if(project.avatar?.data){
      const bytes=fromDataURL(project.avatar.data);
      const gltf=await new GLTFLoader().parseAsync(bytes.buffer,"");
      setAvatar(gltf,project.world);
      statusEvent("ready","restored saved 3D character");
      return;
    }
    // Explicit user action: preserve 2D photo and generated 3D together.
    status.textContent="Reconstructing 3D face from saved 2D portrait and fitting original MHR body rig…";
    const photo=await openPhoto(project.photo);
    const identity=(await identityStore.capture(photo,()=>project.photo,{encoded:project.photo,expected:project.identity??undefined})).identity;
    const plan=planBodyForm("");
    if(!plan.ok)throw Error(plan.reason);
    const gltf=await buildFullAvatar(photo,identity,plan);
    const raw=await new GLTFExporter().parseAsync(gltf.scene,{binary:true,animations:gltf.animations});
    const bytes=new Uint8Array(raw);
    const next={...project,identity,avatar:{data:toDataURL(bytes),identityId:identity.id}};
    await saveProject(next);
    setAvatar(gltf,project.world);
    statusEvent("ready","created and saved original 3D rig from saved portrait");
  }catch(error){
    status.textContent="3D character unavailable: "+error.message;
    statusEvent("unavailable",error.message);
  }finally{requestBusy=false;if(activate)activate.disabled=false;}
}
globalThis.addEventListener("simlish-world-snapshot",event=>renderSnapshot(event.detail));
globalThis.addEventListener("synthai2:character-3d-request",()=>void loadOrBuildCharacter());
if(activate)activate.addEventListener("click",()=>void loadOrBuildCharacter());
initialize();

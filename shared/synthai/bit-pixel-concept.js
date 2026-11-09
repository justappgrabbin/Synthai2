/**
 * SynthAI Bit–Pixel–Concept substrate, experimental v0.1.
 * Additive, dependency-free. No pretrained weights or semantic understanding claimed.
 * Pixels can be represented as raw RGB, spatial vector interpolation, or learned neural RGB.
 */
export const REPRESENTATION = Object.freeze({ PIXEL:"pixel", VECTOR:"vector", NEURAL:"neural" });
export function sixBit(value) {
  if (!Number.isInteger(value) || value < 0 || value > 63) throw new RangeError("sixBit expects 0..63");
  return Array.from({length:6},(_,i)=>(value>>(5-i))&1);
}
export function createField(width,height,rgba) {
  if (!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1) throw new Error("Invalid dimensions");
  if (!rgba || rgba.length !== width*height*4) throw new Error("Expected RGBA bytes");
  return {width,height,pixels:new Uint8ClampedArray(rgba), regions:[], version:1};
}
const clamp=x=>Math.max(0,Math.min(255,Math.round(x)));
const rgb=(field,x,y)=>{const i=(y*field.width+x)*4;return Array.from(field.pixels.slice(i,i+3));};
export function region(field,{x=0,y=0,width=field.width,height=field.height,mode="pixel",spacing=4}={}) {
  if(!Object.values(REPRESENTATION).includes(mode)) throw new Error("Unknown representation");
  if(![x,y,width,height,spacing].every(Number.isInteger)||spacing<1||x<0||y<0||width<1||height<1||x+width>field.width||y+height>field.height) throw new RangeError("Invalid region");
  const r={x,y,width,height,mode,anchors:[],network:null};
  if(mode!=="pixel"){
    for(let py=y;py<y+height;py+=spacing) for(let px=x;px<x+width;px+=spacing)
      r.anchors.push({x:px,y:py,rgb:rgb(field,px,py)});
    // Always include the far edges for stable reconstruction.
    for(let py=y;py<y+height;py++) if(py===y+height-1)
      for(let px=x;px<x+width;px++) if(px===x+width-1||((px-x)%spacing===0)) r.anchors.push({x:px,y:py,rgb:rgb(field,px,py)});
    for(let py=y;py<y+height-1;py+=spacing) r.anchors.push({x:x+width-1,y:py,rgb:rgb(field,x+width-1,py)});
  }
  field.regions.push(r);return r;
}
export function vectorColor(r,x,y) {
  if(!r.anchors.length) throw new Error("Region has no anchors");
  let total=0, c=[0,0,0];
  for(const a of r.anchors){const d=(x-a.x)**2+(y-a.y)**2;if(d===0)return a.rgb.slice();const w=1/d;total+=w;for(let k=0;k<3;k++)c[k]+=w*a.rgb[k];}
  return c.map(v=>clamp(v/total));
}
// Tiny learnable coordinate-to-RGB network. Useful for experiments, not a pretrained image generator.
export function initNeural(r,hidden=12,seed=1) {
  if(!Number.isInteger(hidden)||hidden<1||hidden>256)throw new RangeError("hidden 1..256");
  let s=seed>>>0;const rand=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};
  const w1=Array.from({length:hidden},()=>Array.from({length:3},()=>rand()*0.4-0.2));
  const w2=Array.from({length:3},()=>Array.from({length:hidden+1},()=>rand()*0.4-0.2));
  r.network={w1,w2};return r.network;
}
const coords=(r,x,y)=>[(x-r.x)/Math.max(1,r.width-1)*2-1,(y-r.y)/Math.max(1,r.height-1)*2-1,1];
function forward(net,input){const h=net.w1.map(w=>Math.tanh(w.reduce((s,v,i)=>s+v*input[i],0)));const output=net.w2.map(w=>w.reduce((s,v,i)=>s+v*(i===h.length?1:h[i]),0));return {h,output};}
export function trainNeural(field,r,{epochs=30,rate=0.02}={}) {
  if(!Number.isInteger(epochs)||epochs<1||epochs>10000||!(rate>0&&rate<=1))throw new RangeError("Invalid training parameters");
  const net=r.network||initNeural(r);let loss=0;
  for(let epoch=0;epoch<epochs;epoch++){
    loss=0;
    for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++){
      const input=coords(r,x,y),{h,output}=forward(net,input),target=rgb(field,x,y).map(v=>v/255);
      const errors=output.map((v,k)=>v-target[k]);loss+=errors.reduce((s,v)=>s+v*v,0)/3;
      const hiddenGrad=h.map((v,j)=>(1-v*v)*errors.reduce((s,e,k)=>s+e*net.w2[k][j],0));
      for(let k=0;k<3;k++)for(let j=0;j<=h.length;j++)net.w2[k][j]-=rate*errors[k]*(j===h.length?1:h[j]);
      for(let j=0;j<h.length;j++)for(let k=0;k<3;k++)net.w1[j][k]-=rate*hiddenGrad[j]*input[k];
    }
  }
  return {mse:loss/(r.width*r.height),epochs};
}
export function sample(field,x,y) {
  if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=field.width||y>=field.height)throw new RangeError("Out of bounds");
  const r=[...field.regions].reverse().find(r=>x>=r.x&&y>=r.y&&x<r.x+r.width&&y<r.y+r.height);
  if(!r||r.mode==="pixel")return rgb(field,x,y);
  if(r.mode==="vector")return vectorColor(r,x,y);
  if(!r.network)throw new Error("Train or initialize neural region first");
  return forward(r.network,coords(r,x,y)).output.map(v=>clamp(v*255));
}
export function render(field){const out=new Uint8ClampedArray(field.width*field.height*4);for(let y=0;y<field.height;y++)for(let x=0;x<field.width;x++){const i=(y*field.width+x)*4;out.set([...sample(field,x,y),255],i);}return out;}
export function representationStats(field){return {regions:field.regions.length,byMode:Object.fromEntries(Object.values(REPRESENTATION).map(m=>[m,field.regions.filter(r=>r.mode===m).length])),size:[field.width,field.height]};}

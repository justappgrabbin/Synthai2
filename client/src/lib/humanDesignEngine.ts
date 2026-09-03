import * as Astronomy from "astronomy-engine";

export type DeepCoordinate = {
  gate: number;
  line: number;
  color: number;
  tone: number;
  base: number;
  direction: "left" | "right";
};

export type Activation = DeepCoordinate & {
  planet: string;
  longitude: number;
  center: CenterKey;
  gateName: string;
  side: "personality" | "design" | "transit";
};

export type CenterKey = "head" | "ajna" | "throat" | "g" | "heart" | "spleen" | "solar" | "sacral" | "root";

export type Channel = {
  gates: [number, number];
  name: string;
  centers: [CenterKey, CenterKey];
  circuit: "individual" | "tribal" | "collective" | "integration";
};

export type VariableFacet = {
  name: string;
  description: string;
  color: number;
  tone: number;
  base: number;
  direction: "left" | "right";
  cognition?: string;
  baseOrientation: string;
};

export type HumanDesignChart = {
  id: string;
  subject: {
    name: string;
    birthDate: string;
    birthTime: string;
    timezone: string;
    utcOffsetHours: number;
    birthUtc: string;
    designUtc: string;
    warnings: string[];
  };
  summary: {
    type: string;
    strategy: string;
    authority: string;
    profile: string;
    profileName: string;
    definition: string;
    signature: string;
    notSelf: string;
    crossGates: [number, number, number, number];
  };
  centers: {
    defined: CenterKey[];
    undefined: CenterKey[];
    open: CenterKey[];
  };
  gates: number[];
  channels: Channel[];
  activations: {
    personality: Activation[];
    design: Activation[];
  };
  variables: {
    notation: string;
    determination: VariableFacet;
    environment: VariableFacet;
    motivation: VariableFacet;
    perspective: VariableFacet;
  };
  evidence: {
    engine: string;
    ephemeris: string;
    nodeType: "true" | "mean";
    gateWheelOffset: number;
    designSolarArc: number;
    generatedAt: string;
    deterministic: true;
  };
};

const GATE_OFFSET = 358.25;
const GATE_SIZE = 360 / 64;
const GATE_ORDER = [
  25,17,21,51,42,3,27,24,2,23,8,20,16,35,45,12,15,52,39,53,62,56,31,33,
  7,4,29,59,40,64,47,6,46,18,48,57,32,50,28,44,1,43,14,34,9,5,26,11,
  10,58,38,54,61,60,41,19,13,49,30,55,37,63,22,36,
] as const;

const GATE_DATA: Record<number, { name: string; center: CenterKey }> = {
  1:{name:"The Creative",center:"g"},2:{name:"The Receptive",center:"g"},3:{name:"Ordering",center:"sacral"},4:{name:"Formulization",center:"ajna"},
  5:{name:"Fixed Rhythms",center:"sacral"},6:{name:"Friction",center:"solar"},7:{name:"Role of Self",center:"g"},8:{name:"Contribution",center:"throat"},
  9:{name:"Focus",center:"sacral"},10:{name:"Behavior of Self",center:"g"},11:{name:"Ideas",center:"ajna"},12:{name:"Caution",center:"throat"},
  13:{name:"The Listener",center:"g"},14:{name:"Power Skills",center:"sacral"},15:{name:"Extremes",center:"g"},16:{name:"Skills",center:"throat"},
  17:{name:"Opinions",center:"ajna"},18:{name:"Correction",center:"spleen"},19:{name:"Wanting",center:"root"},20:{name:"The Now",center:"throat"},
  21:{name:"The Hunter",center:"heart"},22:{name:"Openness",center:"solar"},23:{name:"Assimilation",center:"throat"},24:{name:"Rationalization",center:"ajna"},
  25:{name:"Innocence",center:"g"},26:{name:"The Trickster",center:"heart"},27:{name:"Caring",center:"sacral"},28:{name:"The Player",center:"spleen"},
  29:{name:"Perseverance",center:"sacral"},30:{name:"Recognition of Feelings",center:"solar"},31:{name:"Leading",center:"throat"},32:{name:"Continuity",center:"spleen"},
  33:{name:"Privacy",center:"throat"},34:{name:"Power",center:"sacral"},35:{name:"Change",center:"throat"},36:{name:"Crisis",center:"solar"},
  37:{name:"Friendship",center:"solar"},38:{name:"The Fighter",center:"root"},39:{name:"Provocation",center:"root"},40:{name:"Aloneness",center:"heart"},
  41:{name:"Contraction",center:"root"},42:{name:"Growth",center:"sacral"},43:{name:"Insight",center:"ajna"},44:{name:"Coming to Meet",center:"spleen"},
  45:{name:"Gathering",center:"throat"},46:{name:"Love of Body",center:"g"},47:{name:"Realization",center:"ajna"},48:{name:"Depth",center:"spleen"},
  49:{name:"Principles",center:"solar"},50:{name:"Values",center:"spleen"},51:{name:"Shock",center:"heart"},52:{name:"Stillness",center:"root"},
  53:{name:"Beginnings",center:"root"},54:{name:"Ambition",center:"root"},55:{name:"Spirit",center:"solar"},56:{name:"Stimulation",center:"throat"},
  57:{name:"Intuition",center:"spleen"},58:{name:"Vitality",center:"root"},59:{name:"Sexuality",center:"sacral"},60:{name:"Limitation",center:"root"},
  61:{name:"Mystery",center:"head"},62:{name:"Details",center:"throat"},63:{name:"Doubt",center:"head"},64:{name:"Confusion",center:"head"},
};

export const HD_CHANNELS: Channel[] = [
  {gates:[1,8],name:"Inspiration",centers:["g","throat"],circuit:"individual"},{gates:[2,14],name:"The Beat",centers:["g","sacral"],circuit:"individual"},
  {gates:[3,60],name:"Mutation",centers:["sacral","root"],circuit:"individual"},{gates:[4,63],name:"Logic",centers:["ajna","head"],circuit:"collective"},
  {gates:[5,15],name:"Rhythm",centers:["sacral","g"],circuit:"collective"},{gates:[6,59],name:"Intimacy",centers:["solar","sacral"],circuit:"tribal"},
  {gates:[7,31],name:"Alpha",centers:["g","throat"],circuit:"collective"},{gates:[9,52],name:"Concentration",centers:["sacral","root"],circuit:"collective"},
  {gates:[10,20],name:"Awakening",centers:["g","throat"],circuit:"integration"},{gates:[10,34],name:"Exploration",centers:["g","sacral"],circuit:"integration"},
  {gates:[10,57],name:"Perfected Form",centers:["g","spleen"],circuit:"integration"},{gates:[11,56],name:"Curiosity",centers:["ajna","throat"],circuit:"collective"},
  {gates:[12,22],name:"Openness",centers:["throat","solar"],circuit:"individual"},{gates:[13,33],name:"The Prodigal",centers:["g","throat"],circuit:"collective"},
  {gates:[16,48],name:"The Wavelength",centers:["throat","spleen"],circuit:"collective"},{gates:[17,62],name:"Acceptance",centers:["ajna","throat"],circuit:"collective"},
  {gates:[18,58],name:"Judgement",centers:["spleen","root"],circuit:"collective"},{gates:[19,49],name:"Synthesis",centers:["root","solar"],circuit:"tribal"},
  {gates:[20,34],name:"Charisma",centers:["throat","sacral"],circuit:"integration"},{gates:[20,57],name:"The Brainwave",centers:["throat","spleen"],circuit:"integration"},
  {gates:[21,45],name:"Money",centers:["heart","throat"],circuit:"tribal"},{gates:[23,43],name:"Structuring",centers:["throat","ajna"],circuit:"individual"},
  {gates:[24,61],name:"Awareness",centers:["ajna","head"],circuit:"individual"},{gates:[25,51],name:"Initiation",centers:["g","heart"],circuit:"individual"},
  {gates:[26,44],name:"Surrender",centers:["heart","spleen"],circuit:"tribal"},{gates:[27,50],name:"Preservation",centers:["sacral","spleen"],circuit:"tribal"},
  {gates:[28,38],name:"Struggle",centers:["spleen","root"],circuit:"individual"},{gates:[29,46],name:"Discovery",centers:["sacral","g"],circuit:"collective"},
  {gates:[30,41],name:"Recognition",centers:["solar","root"],circuit:"collective"},{gates:[32,54],name:"Transformation",centers:["spleen","root"],circuit:"tribal"},
  {gates:[34,57],name:"Power",centers:["sacral","spleen"],circuit:"integration"},{gates:[35,36],name:"Transitoriness",centers:["throat","solar"],circuit:"collective"},
  {gates:[37,40],name:"Community",centers:["solar","heart"],circuit:"tribal"},{gates:[39,55],name:"Emoting",centers:["root","solar"],circuit:"individual"},
  {gates:[42,53],name:"Maturation",centers:["sacral","root"],circuit:"collective"},{gates:[47,64],name:"Abstraction",centers:["ajna","head"],circuit:"collective"},
];

const TYPE_INFO = {
  Manifestor:{strategy:"Inform",signature:"Peace",notSelf:"Anger"},
  Generator:{strategy:"Wait to Respond",signature:"Satisfaction",notSelf:"Frustration"},
  "Manifesting Generator":{strategy:"Wait to Respond, then Inform",signature:"Satisfaction",notSelf:"Frustration / Anger"},
  Projector:{strategy:"Wait for the Invitation",signature:"Success",notSelf:"Bitterness"},
  Reflector:{strategy:"Wait a Lunar Cycle",signature:"Surprise",notSelf:"Disappointment"},
} as const;

const LINE_NAMES = ["","Investigator","Hermit","Experimenter","Opportunist","Heretic","Role Model"];
const PROFILE_NAMES: Record<string,string> = {
  "1/3":"Investigator / Experimenter","1/4":"Investigator / Opportunist","2/4":"Hermit / Opportunist","2/5":"Hermit / Heretic",
  "3/5":"Experimenter / Heretic","3/6":"Experimenter / Role Model","4/6":"Opportunist / Role Model","4/1":"Opportunist / Investigator",
  "5/1":"Heretic / Investigator","5/2":"Heretic / Hermit","6/2":"Role Model / Hermit","6/3":"Role Model / Experimenter",
};
const COGNITION = ["","Smell","Taste","Outer Vision","Inner Vision","Feeling","Touch"];
const BASE_ORIENTATION = ["","Reactive","Active","Objective","Subjective","Personal"];
const DETERMINATION = ["","Appetite","Taste","Thirst","Touch","Sound","Light"];
const ENVIRONMENT = ["","Caves","Markets","Kitchens","Mountains","Valleys","Shores"];
const MOTIVATION = ["","Fear","Hope","Desire","Need","Guilt","Innocence"];
const PERSPECTIVE = ["","Survival","Possibility","Power","Wanting","Probability","Personal"];

const VARIABLE_DESCRIPTIONS: Record<string,string> = {
  Appetite:"Simple, sequential intake and clear bodily signals.",Taste:"Selection through resonance and discernment.",Thirst:"Temperature and fluid conditions shape intake.",Touch:"Physical atmosphere and contact matter.",Sound:"Acoustic conditions influence processing.",Light:"Light conditions influence processing.",
  Caves:"Protected, controlled-entry environments.",Markets:"Exchange-rich environments with movement and choice.",Kitchens:"Transformative environments where things are made and changed.",Mountains:"Elevated environments with distance and perspective.",Valleys:"Connected, acoustic corridors of information.",Shores:"Threshold environments between two different fields.",
  Fear:"Inquiry driven by what is not yet understood.",Hope:"Receptive observation and trust in timing.",Desire:"Purposeful movement toward an intended change.",Need:"Attention to what is practically required.",Guilt:"Responsibility to correct, improve, or manage.",Innocence:"Participation without a fixed agenda.",
  Survival:"View oriented toward viability and security.",Possibility:"View oriented toward potential and alternatives.",Power:"View oriented toward influence and leverage.",Wanting:"View oriented toward what is absent or desired.",Probability:"View oriented toward likely outcomes and patterns.",Personal:"View oriented through direct subjective experience.",
};

function normalizeDegrees(value:number) { return ((value % 360) + 360) % 360; }
function signedAngle(value:number) { return ((value + 180) % 360 + 360) % 360 - 180; }
function julianDay(date:Date) { return date.getTime() / 86400000 + 2440587.5; }

export function longitudeToDeep(longitude:number): DeepCoordinate {
  const adjusted = normalizeDegrees(longitude - GATE_OFFSET);
  const gateIndex = Math.floor(adjusted / GATE_SIZE) % 64;
  const withinGate = adjusted - gateIndex * GATE_SIZE;
  const lineSize = GATE_SIZE / 6;
  const line = Math.min(6, Math.floor(withinGate / lineSize) + 1);
  const withinLine = withinGate - (line - 1) * lineSize;
  const colorSize = lineSize / 6;
  const color = Math.min(6, Math.floor(withinLine / colorSize) + 1);
  const withinColor = withinLine - (color - 1) * colorSize;
  const toneSize = colorSize / 6;
  const tone = Math.min(6, Math.floor(withinColor / toneSize) + 1);
  const withinTone = withinColor - (tone - 1) * toneSize;
  const baseSize = toneSize / 5;
  const base = Math.min(5, Math.floor(withinTone / baseSize) + 1);
  return { gate:GATE_ORDER[gateIndex], line, color, tone, base, direction:tone <= 3 ? "left" : "right" };
}

function longitudeForBody(body:string, date:Date):number {
  const astro:any = Astronomy as any;
  const vector = astro.GeoVector(body, date, true);
  return normalizeDegrees(astro.Ecliptic(vector).elon);
}

function nodeLongitude(date:Date, type:"true"|"mean") {
  const T = (julianDay(date) - 2451545.0) / 36525;
  const T2=T*T, T3=T2*T, T4=T3*T;
  const meanNode = normalizeDegrees(125.0445479 - 1934.1362891*T + 0.0020754*T2 + T3/467441 - T4/60616000);
  if (type === "mean") return meanNode;
  const D=normalizeDegrees(297.8501921 + 445267.1114034*T - 0.0018819*T2 + T3/545868 - T4/113065000) * Math.PI/180;
  const M=normalizeDegrees(357.5291092 + 35999.0502909*T - 0.0001536*T2 + T3/24490000) * Math.PI/180;
  const Mp=normalizeDegrees(134.9633964 + 477198.8675055*T + 0.0087414*T2 + T3/69699 - T4/14712000) * Math.PI/180;
  const F=normalizeDegrees(93.2720950 + 483202.0175233*T - 0.0036539*T2 - T3/3526000 + T4/863310000) * Math.PI/180;
  const correction = -1.4979*Math.sin(2*(D-F)) - 0.1500*Math.sin(M) - 0.1226*Math.sin(2*D) + 0.1176*Math.sin(2*F) - 0.0801*Math.sin(2*(Mp-F));
  return normalizeDegrees(meanNode + correction);
}

function positions(date:Date, nodeType:"true"|"mean") {
  const sun = longitudeForBody("Sun", date);
  const node = nodeLongitude(date,nodeType);
  return {
    sun, earth:normalizeDegrees(sun+180), moon:longitudeForBody("Moon",date),
    northNode:node, southNode:normalizeDegrees(node+180), mercury:longitudeForBody("Mercury",date),
    venus:longitudeForBody("Venus",date), mars:longitudeForBody("Mars",date), jupiter:longitudeForBody("Jupiter",date),
    saturn:longitudeForBody("Saturn",date), uranus:longitudeForBody("Uranus",date), neptune:longitudeForBody("Neptune",date), pluto:longitudeForBody("Pluto",date),
  };
}

function solveDesignDate(birthUtc:Date) {
  const target = normalizeDegrees(longitudeForBody("Sun",birthUtc) - 88);
  let low = new Date(birthUtc.getTime() - 94*86400000);
  let high = new Date(birthUtc.getTime() - 82*86400000);
  for (let i=0;i<52;i++) {
    const mid = new Date((low.getTime()+high.getTime())/2);
    const diff = signedAngle(longitudeForBody("Sun",mid)-target);
    if (Math.abs(diff) < 1e-8) return mid;
    if (diff > 0) high=mid; else low=mid;
  }
  return new Date((low.getTime()+high.getTime())/2);
}

function activationList(pos:ReturnType<typeof positions>, side:Activation["side"]) {
  return Object.entries(pos).map(([planet,longitude]) => {
    const deep=longitudeToDeep(longitude);
    const gate=GATE_DATA[deep.gate];
    return { planet, longitude, ...deep, center:gate.center, gateName:gate.name, side } satisfies Activation;
  });
}

function definedChannels(gates:Set<number>) { return HD_CHANNELS.filter(c => gates.has(c.gates[0]) && gates.has(c.gates[1])); }

function definedCenters(channels:Channel[]) {
  const centers = new Set<CenterKey>();
  channels.forEach(c=>c.centers.forEach(center=>centers.add(center)));
  return centers;
}

function components(centers:Set<CenterKey>, channels:Channel[]) {
  const graph = new Map<CenterKey,Set<CenterKey>>();
  centers.forEach(c=>graph.set(c,new Set()));
  channels.forEach(({centers:[a,b]})=>{ if(graph.has(a)&&graph.has(b)){graph.get(a)!.add(b);graph.get(b)!.add(a);} });
  const seen=new Set<CenterKey>(); let count=0;
  centers.forEach(start=>{ if(seen.has(start)) return; count++; const queue=[start]; seen.add(start); while(queue.length){ const n=queue.shift()!; graph.get(n)?.forEach(next=>{if(!seen.has(next)){seen.add(next);queue.push(next);}}); } });
  return count;
}

function definitionName(count:number, channels:number) {
  if(!channels || !count) return "No Definition";
  return ["","Single Definition","Split Definition","Triple Split Definition","Quadruple Split Definition"][Math.min(4,count)] || `${count}-Part Definition`;
}

function motorToThroat(channels:Channel[]) {
  const graph=new Map<CenterKey,Set<CenterKey>>();
  channels.forEach(({centers:[a,b]})=>{if(!graph.has(a))graph.set(a,new Set());if(!graph.has(b))graph.set(b,new Set());graph.get(a)!.add(b);graph.get(b)!.add(a);});
  if(!graph.has("throat")) return false;
  const motors=new Set<CenterKey>(["sacral","heart","solar","root"]), seen=new Set<CenterKey>(["throat"]), queue:CenterKey[]=["throat"];
  while(queue.length){const n=queue.shift()!;if(n!=="throat"&&motors.has(n))return true;graph.get(n)?.forEach(x=>{if(!seen.has(x)){seen.add(x);queue.push(x);}});} return false;
}

function chartType(centers:Set<CenterKey>, channels:Channel[]) {
  if(!centers.size) return "Reflector" as const;
  const sacral=centers.has("sacral"), manifesting=motorToThroat(channels);
  if(sacral) return manifesting ? "Manifesting Generator" as const : "Generator" as const;
  return manifesting ? "Manifestor" as const : "Projector" as const;
}

function authority(centers:Set<CenterKey>) {
  if(!centers.size) return "Lunar Authority";
  if(centers.has("solar")) return "Emotional Authority";
  if(centers.has("sacral")) return "Sacral Authority";
  if(centers.has("spleen")) return "Splenic Authority";
  if(centers.has("heart")) return "Ego / Heart Authority";
  if(centers.has("g")) return "Self-Projected Authority";
  return "Mental / Environmental Authority";
}

function facet(name:string, deep:DeepCoordinate, cognition?:string):VariableFacet {
  return {name,description:VARIABLE_DESCRIPTIONS[name]||"Deterministic substructure derived from longitude.",color:deep.color,tone:deep.tone,base:deep.base,direction:deep.direction,cognition,baseOrientation:BASE_ORIENTATION[deep.base]};
}

function variableSet(personality:ReturnType<typeof positions>, design:ReturnType<typeof positions>) {
  const determination=longitudeToDeep(design.sun), environment=longitudeToDeep(design.northNode), motivation=longitudeToDeep(personality.sun), perspective=longitudeToDeep(personality.northNode);
  const letter=(d:DeepCoordinate)=>d.direction==="left"?"L":"R";
  return {
    notation:`${letter(determination)}${letter(environment)} ${letter(motivation)}${letter(perspective)}`,
    determination:facet(DETERMINATION[determination.color],determination,COGNITION[determination.tone]),
    environment:facet(ENVIRONMENT[environment.color],environment),
    motivation:facet(MOTIVATION[motivation.color],motivation),
    perspective:facet(PERSPECTIVE[perspective.color],perspective),
  };
}

function offsetAtInstant(instant:Date,timeZone:string) {
  const fmt=new Intl.DateTimeFormat("en-US",{timeZone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});
  const p=Object.fromEntries(fmt.formatToParts(instant).filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
  const apparentUtc=Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour),Number(p.minute),Number(p.second));
  return (apparentUtc-instant.getTime())/3600000;
}

function localToUtc(date:string,time:string,timeZone:string) {
  const [y,m,d]=date.split("-").map(Number), [hh,mm]=time.split(":").map(Number);
  const wall=Date.UTC(y,m-1,d,hh,mm,0); let guess=new Date(wall); let offset=0;
  const warnings:string[]=[];
  try {
    for(let i=0;i<4;i++){offset=offsetAtInstant(guess,timeZone);guess=new Date(wall-offset*3600000);}
  } catch {
    warnings.push(`Timezone ${timeZone} could not be resolved; UTC was used.`); return {utc:new Date(wall),offset:0,warnings};
  }
  return {utc:guess,offset,warnings};
}

function stableId(name:string,date:string,time:string,tz:string){
  const raw=`${name}|${date}|${time}|${tz}`;let h=2166136261;for(let i=0;i<raw.length;i++){h^=raw.charCodeAt(i);h=Math.imul(h,16777619);}return `hd-${(h>>>0).toString(36)}`;
}

export function calculateHumanDesign(input:{name?:string;birthDate:string;birthTime:string;timezone:string;nodeType?:"true"|"mean"}):HumanDesignChart {
  const nodeType=input.nodeType||"true"; const resolved=localToUtc(input.birthDate,input.birthTime,input.timezone); const birthUtc=resolved.utc;
  const designUtc=solveDesignDate(birthUtc), personalityPos=positions(birthUtc,nodeType), designPos=positions(designUtc,nodeType);
  const personality=activationList(personalityPos,"personality"), design=activationList(designPos,"design");
  const gateSet=new Set<number>([...personality,...design].map(a=>a.gate)), channels=definedChannels(gateSet), centers=definedCenters(channels);
  const allCenters:CenterKey[]=["head","ajna","throat","g","heart","spleen","solar","sacral","root"];
  const hangingCenters=new Set<CenterKey>([...personality,...design].filter(a=>!centers.has(a.center)).map(a=>a.center));
  const type=chartType(centers,channels), info=TYPE_INFO[type];
  const pSun=personality.find(a=>a.planet==="sun")!, dSun=design.find(a=>a.planet==="sun")!, pEarth=personality.find(a=>a.planet==="earth")!, dEarth=design.find(a=>a.planet==="earth")!;
  const profile=`${pSun.line}/${dSun.line}`;
  return {
    id:stableId(input.name||"Chart",input.birthDate,input.birthTime,input.timezone),
    subject:{name:input.name?.trim()||"Chart",birthDate:input.birthDate,birthTime:input.birthTime,timezone:input.timezone,utcOffsetHours:resolved.offset,birthUtc:birthUtc.toISOString(),designUtc:designUtc.toISOString(),warnings:resolved.warnings},
    summary:{type,strategy:info.strategy,authority:authority(centers),profile,profileName:PROFILE_NAMES[profile]||`${LINE_NAMES[pSun.line]} / ${LINE_NAMES[dSun.line]}`,definition:definitionName(components(centers,channels),channels.length),signature:info.signature,notSelf:info.notSelf,crossGates:[pSun.gate,pEarth.gate,dSun.gate,dEarth.gate]},
    centers:{defined:[...centers],undefined:allCenters.filter(c=>!centers.has(c)&&hangingCenters.has(c)),open:allCenters.filter(c=>!centers.has(c)&&!hangingCenters.has(c))},
    gates:[...gateSet].sort((a,b)=>a-b),channels,activations:{personality,design},variables:variableSet(personalityPos,designPos),
    evidence:{engine:"Synthia Human Design Kernel 1.0",ephemeris:"astronomy-engine / VSOP87",nodeType,gateWheelOffset:GATE_OFFSET,designSolarArc:88,generatedAt:new Date().toISOString(),deterministic:true},
  };
}

function coreFingerprint(chart:HumanDesignChart){return JSON.stringify({type:chart.summary.type,authority:chart.summary.authority,profile:chart.summary.profile,definition:chart.summary.definition,centers:chart.centers.defined.slice().sort(),channels:chart.channels.map(c=>c.gates.join("-")).sort(),variables:chart.variables.notation});}

export function calculateBirthTimeSensitivity(input:{name?:string;birthDate:string;birthTime:string;timezone:string;nodeType?:"true"|"mean"},minutes:number){
  const center=calculateHumanDesign(input); if(minutes<=0)return {stable:true,minutes:0,changes:[] as string[]};
  const birth=new Date(center.subject.birthUtc); const shifted=(delta:number)=>{
    const instant=new Date(birth.getTime()+delta*60000); const fmt=new Intl.DateTimeFormat("en-CA",{timeZone:input.timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
    const p=Object.fromEntries(fmt.formatToParts(instant).filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
    return calculateHumanDesign({...input,birthDate:`${p.year}-${p.month}-${p.day}`,birthTime:`${p.hour}:${p.minute}`});
  };
  const earlier=shifted(-minutes), later=shifted(minutes), base=coreFingerprint(center), changes:string[]=[];
  if(coreFingerprint(earlier)!==base)changes.push("Earlier edge changes core chart fields"); if(coreFingerprint(later)!==base)changes.push("Later edge changes core chart fields");
  return {stable:changes.length===0,minutes,changes,earlier,later};
}

export function compareHumanDesign(left:HumanDesignChart,right:HumanDesignChart){
  const l=new Set(left.gates),r=new Set(right.gates), shared=[...l].filter(g=>r.has(g)), electromagnetic=HD_CHANNELS.filter(c=>(l.has(c.gates[0])&&r.has(c.gates[1]))||(l.has(c.gates[1])&&r.has(c.gates[0])));
  return {sharedGates:shared,sharedChannels:left.channels.filter(c=>right.channels.some(x=>x.gates[0]===c.gates[0]&&x.gates[1]===c.gates[1])),electromagneticChannels:electromagnetic,typePair:`${left.summary.type} + ${right.summary.type}`,authorityPair:`${left.summary.authority} + ${right.summary.authority}`};
}

export function calculateTransit(date:Date,natal?:HumanDesignChart,nodeType:"true"|"mean"="true"){
  const pos=positions(date,nodeType), activations=activationList(pos,"transit"), gates=new Set(activations.map(a=>a.gate)), natalGates=new Set(natal?.gates||[]), combined=new Set([...gates,...natalGates]);
  return {at:date.toISOString(),activations,gates:[...gates].sort((a,b)=>a-b),sharedWithNatal:[...gates].filter(g=>natalGates.has(g)).sort((a,b)=>a-b),bridgedChannels:definedChannels(combined).filter(c=>!(natal?.channels||[]).some(n=>n.gates[0]===c.gates[0]&&n.gates[1]===c.gates[1]))};
}

export const CENTER_LABELS:Record<CenterKey,string>={head:"Head",ajna:"Ajna",throat:"Throat",g:"G Center",heart:"Heart / Ego",spleen:"Spleen",solar:"Solar Plexus",sacral:"Sacral",root:"Root"};
export { GATE_DATA };

// Cerberus, OSRS Wiki drop table, checked October 2026.
// Each kill awards one primary table roll (4 unique tickets and 126 regular
// tickets out of 130), plus independent tertiary rolls.
// The wiki ALSO reports a 3/130 chance to access the shared rare-drop table,
// despite the main entries already summing to 130. This is modelled as a
// separate roll; see README for this explicit interpretation.
export const MAX_KILLS=1_000_000;
export const UNIQUE=[
 {id:"primordial-crystal",name:"Primordial crystal"},
 {id:"pegasian-crystal",name:"Pegasian crystal"},
 {id:"eternal-crystal",name:"Eternal crystal"},
 {id:"smouldering-stone",name:"Smouldering stone"}
];
export const TERTIARY=[
 {id:"ensouled-hellhound-head",name:"Ensouled hellhound head",rate:1/15},
 {id:"clue-scroll-elite",name:"Clue scroll (elite)",rate:1/100},
 {id:"jar-of-souls",name:"Jar of souls",rate:1/2000},
 {id:"hellpuppy",name:"Hellpuppy",rate:1/3000}
];
// id,name,min,max,weight: published per-kill primary-table tickets /130.
export const COMMON=[
 ["rune-platebody","Rune platebody",1,1,5],
 ["rune-chainbody","Rune chainbody",1,1,4],
 ["rune-2h-sword","Rune 2h sword",1,1,4],
 ["black-dhide-body","Black d'hide body",1,1,3],
 ["rune-axe","Rune axe",1,1,3],
 ["rune-pickaxe","Rune pickaxe",1,1,3],
 ["battlestaff","Battlestaff",6,6,3],
 ["rune-full-helm","Rune full helm",1,1,3],
 ["lava-battlestaff","Lava battlestaff",1,1,2],
 ["rune-halberd","Rune halberd",1,1,2],

 ["fire-rune","Fire rune",300,300,6],
 ["soul-rune","Soul rune",100,100,6],
 ["pure-essence","Pure essence",300,300,5],
 ["blood-rune","Blood rune",60,60,4],
 ["steel-cannonball","Steel cannonball",50,50,4],
 ["runite-bolts-unf","Runite bolts (unf)",40,40,4],
 ["death-rune","Death rune",100,100,3],

 ["coal","Coal",120,120,6],
 ["super-restore-4","Super restore(4)",2,2,6],
 ["summer-pie","Summer pie",3,3,6],
 ["coins","Coins",10000,20000,5],
 ["dragon-bones","Dragon bones",20,20,5],
 ["unholy-symbol","Unholy symbol",1,1,5],
 ["wine-of-zamorak","Wine of zamorak",15,15,5],
 ["ashes","Ashes",50,50,4],
 ["fire-orb","Fire orb",20,20,4],
 ["grimy-torstol","Grimy torstol",6,6,4],
 ["runite-ore","Runite ore",5,5,3],
 ["uncut-diamond","Uncut diamond",5,5,3],
 ["torstol-seed","Torstol seed",3,3,2],
 ["ranarr-seed","Ranarr seed",2,2,2],
 ["key-master-teleport","Key master teleport",7,7,2]
];
// Published direct rates for the shared rare table, conditional normalization
// to reproduce the 3/130 rare-table access roll (without ring of wealth).
// A "Nothing" result is possible; quest-dependent rates use default conditions.
// [id,name,min,max,effective per-kill chance].
export const RDT=[
 ["nothing","Nothing",0,0,1/238.83],
 ["coins","Coins",3000,3000,1/264.13],
 ["uncut-sapphire","Uncut sapphire",1,1,1/1109.33],
 ["loop-half-of-key","Loop half of key",1,1,1/275.18],
 ["tooth-half-of-key","Tooth half of key",1,1,1/275.18],
 ["uncut-emerald","Uncut emerald",1,1,1/2218.67],
 ["uncut-ruby","Uncut ruby",1,1,1/4437.33],
 ["runite-bar","Runite bar",1,1,1/1109.33],
 ["nature-rune","Nature rune",67,67,1/1848.89],
 ["rune-2h-sword","Rune 2h sword",1,1,1/1848.89],
 ["rune-battleaxe","Rune battleaxe",1,1,1/1848.89],
 ["law-rune","Law rune",45,45,1/2773.33],
 ["death-rune","Death rune",45,45,1/2773.33],
 ["steel-arrow","Steel arrow",150,150,1/2773.33],
 ["rune-arrow","Rune arrow",42,42,1/2773.33],
 ["adamant-javelin","Adamant javelin",20,20,1/2773.33],
 ["rune-sq-shield","Rune sq shield",1,1,1/2773.33],
 ["dragonstone","Dragonstone",1,1,1/2773.33],
 ["silver-ore","Silver ore",100,100,1/2773.33],
 ["nature-talisman","Nature talisman",1,1,1/11832.89],
 ["uncut-diamond","Uncut diamond",1,1,1/17749.33],
 ["rune-kiteshield","Rune kiteshield",1,1,1/5546.67],
 ["dragon-med-helm","Dragon med helm",1,1,1/5546.67],
 ["rune-spear","Rune spear",1,1,1/5855.45],
 ["rune-javelin","Rune javelin",5,5,1/35498.67],
 ["shield-left-half","Shield left half",1,1,1/11710.9],
 ["dragon-spear","Dragon spear",1,1,1/15614.53]
];
export const DRY_ITEMS=[...UNIQUE,TERTIARY.find(i=>i.id==="jar-of-souls"),TERTIARY.find(i=>i.id==="hellpuppy")];
export const ITEMS=Object.freeze(Object.fromEntries([
 ["infernal-ashes","Infernal ashes"],
 ...UNIQUE.map(i=>[i.id,i.name]),
 ...TERTIARY.map(i=>[i.id,i.name]),
 ["brimstone-key","Brimstone key"],
 ...COMMON.map(([id,name])=>[id,name]),
 ...RDT.filter(r=>r[0]!=="nothing").map(([id,name])=>[id,name])
].map(([id,name])=>[id,{id,name}])));

export function validateKills(kills){
 if(!Number.isSafeInteger(kills)||kills<0||kills>MAX_KILLS)
  throw new RangeError("Enter between 0 and 1,000,000 completed kills.");
 return kills;
}
function unit(rng){
 const n=rng();
 if(typeof n!=="number"||!Number.isFinite(n)||n<0||n>=1)
  throw new RangeError("Random generator must return a value in [0, 1).");
 return n;
}
function weighted(table,weightIndex,rng){
 const total=table.reduce((sum,row)=>sum+row[weightIndex],0);
 let ticket=unit(rng)*total;
 for(const row of table){ticket-=row[weightIndex];if(ticket<0)return row;}
 return table.at(-1);
}
function quantity(row,rng){
 return row[2]===row[3]?row[2]:row[2]+Math.floor(unit(rng)*(row[3]-row[2]+1));
}
export function simulate(kills,{rng=Math.random,konarTask=false,eliteCAs=false}={}){
 validateKills(kills);
 const drops=Object.create(null);
 const add=(id,n=1)=>{if(n>0)drops[id]=(drops[id]||0)+n;};
 for(let kc=0;kc<kills;kc++){
  add("infernal-ashes");
  // All four crystal/stone drops are exclusive on the same 4/130 table.
  const first=unit(rng)*130;
  if(first<4){
   add(UNIQUE[Math.floor(first)].id);
  }else{
   const chosen=weighted(COMMON,4,rng);
   add(chosen[0],quantity(chosen,rng));
  }
  // The wiki also reports an independent 3/130 RDT access.
  if(unit(rng)<3/130){
   const chosen=weighted(RDT,4,rng);
   if(chosen[0]!=="nothing")add(chosen[0],quantity(chosen,rng));
  }
  if(unit(rng)<1/15)add("ensouled-hellhound-head");
  if(unit(rng)<(eliteCAs?1/95:1/100))add("clue-scroll-elite");
  if(unit(rng)<1/2000)add("jar-of-souls");
  if(unit(rng)<1/3000)add("hellpuppy");
  if(konarTask&&unit(rng)<1/45)add("brimstone-key");
 }
 return {kills,drops};
}
export function rateOf(id){
 if(UNIQUE.some(i=>i.id===id))return 1/520;
 return TERTIARY.find(i=>i.id===id)?.rate??0;
}

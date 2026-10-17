// Alchemical Hydra (not ordinary Hydra). Drop data: OSRS Wiki via KURU and Reldo,
// checked 17 October 2026. Every kill: 2 hydra bones + two standard-table rolls.
// Only first standard roll can be replaced by a sequential unique pre-roll.
// Some published 101-denominator standard weights sum to more than 101; their
// relative proportions are normalized instead of silently dropping categories.
export const MAX_KILLS=1000000;
export const RING_IDS=["hydras-eye","hydras-fang","hydras-heart"];
export const PREROLL=[
 ["dragon-thrownaxe",2000,500,1000],
 ["dragon-knife",2000,500,1000],
 ["hydras-claw",1000,1,1],
 ["hydra-tail",512,1,1],
 ["hydra-leather",512,1,1],
 ["ring-piece",180,1,1]
];
export const SIGNATURE_IDS=["hydras-claw","hydra-tail","hydra-leather",...RING_IDS];
export const TERTIARY=[
 ["brimstone-key",1/40],
 ["clue-scroll-hard",1/100],
 ["alchemical-hydra-heads",1/256],
 ["clue-scroll-elite",1/256],
 ["jar-of-chemicals",1/2000],
 ["ikkle-hydra",1/3000]
];
export const DRY_IDS=[...SIGNATURE_IDS,"alchemical-hydra-heads","jar-of-chemicals","ikkle-hydra"];
// [id,name,min,max,relative weight]. Wiki rarity values are per standard
// table roll; seed/herb/RDT subtable choices are resolved separately.
export const STANDARD=[
 ["mystic-fire-staff","Mystic fire staff",1,1,8],
 ["mystic-water-staff","Mystic water staff",1,1,8],
 ["battlestaff","Battlestaff",8,12,5],
 ["black-dhide-body","Black d'hide body",1,1,5],
 ["dragon-longsword","Dragon longsword",1,1,3],
 ["dragon-med-helm","Dragon med helm",1,1,3],
 ["rune-platebody","Rune platebody",1,1,3],
 ["dragon-battleaxe","Dragon battleaxe",1,1,2],
 ["rune-platelegs","Rune platelegs",1,1,1.5],
 ["rune-plateskirt","Rune plateskirt",1,1,1.5],
 ["mystic-robe-top-light","Mystic robe top (light)",1,1,1],
 ["mystic-robe-bottom-light","Mystic robe bottom (light)",1,1,1],
 ["chaos-rune","Chaos rune",150,300,6],
 ["death-rune","Death rune",150,300,6],
 ["blood-rune","Blood rune",150,300,6],
 ["astral-rune","Astral rune",150,300,6],
 ["dragonstone-bolts-e","Dragonstone bolts (e)",100,120,2],
 ["onyx-bolts-e","Onyx bolts (e)",35,50,1],
 ["coins","Coins",5550,25550,0.5],
 ["coins","Coins",40000,60000,9.5],
 ["shark","Shark",2,4,7],
 ["ranging-potion-3","Ranging potion(3)",1,1,7],
 ["super-restore-3","Super restore(3)",2,2,7],
 ["dragon-bones","Dragon bones",30,30,6],
 ["crystal-key","Crystal key",1,1,1],
 ["@herb","Herb table",1,1,10],
 ["@seed","Seed table",1,1,2],
 ["@rdt","Rare drop table",1,1,1]
];
export const HERBS=[
 ["grimy-avantoe","Grimy avantoe",10,15,1/64.6],
 ["grimy-kwuarm","Grimy kwuarm",25,30,1/64.6],
 ["grimy-ranarr-weed","Grimy ranarr weed",10,15,1/80.8],
 ["grimy-snapdragon","Grimy snapdragon",10,15,1/80.8],
 ["grimy-cadantine","Grimy cadantine",25,30,1/80.8],
 ["grimy-dwarf-weed","Grimy dwarf weed",25,30,1/80.8],
 ["grimy-lantadyme","Grimy lantadyme",25,30,1/107.7],
 ["grimy-torstol","Grimy torstol",10,15,1/107.7]
];
// Seed subtable weights are proportional to the Wiki per-standard-roll rates.
export const SEEDS=[
 ["ranarr-seed","Ranarr seed",2,3,1/420.8],
 ["snapdragon-seed","Snapdragon seed",2,3,1/450.9],
 ["torstol-seed","Torstol seed",2,3,1/573.9],
 ["watermelon-seed","Watermelon seed",30,45,1/601.2],
 ["willow-seed","Willow seed",2,3,1/631.3],
 ["mahogany-seed","Mahogany seed",2,3,1/701.4],
 ["maple-seed","Maple seed",2,3,1/701.4],
 ["teak-seed","Teak seed",2,3,1/701.4],
 ["yew-seed","Yew seed",2,3,1/701.4],
 ["papaya-tree-seed","Papaya tree seed",2,3,1/901.8],
 ["magic-seed","Magic seed",2,3,1/1147.7],
 ["palm-tree-seed","Palm tree seed",2,3,1/1262.5],
 ["spirit-seed","Spirit seed",2,3,1/1578.1],
 ["dragonfruit-tree-seed","Dragonfruit tree seed",2,3,1/2104.2],
 ["celastrus-seed","Celastrus seed",2,3,1/3156.3],
 ["redwood-tree-seed","Redwood tree seed",2,3,1/3156.3]
];
// Rare table probabilities (per standard roll) from Wiki, modeled conditional
// on accessing the rare table; "nothing" is a legitimate possible outcome.
export const RDT=[
 ["nothing","Nothing",0,0,1/556.67],
 ["coins","Coins",3000,3000,1/615.62],
 ["loop-half-of-key","Loop half of key",1,1,1/641.39],
 ["tooth-half-of-key","Tooth half of key",1,1,1/641.39],
 ["uncut-sapphire","Uncut sapphire",1,1,1/2585.6],
 ["runite-bar","Runite bar",1,1,1/2585.6],
 ["nature-rune","Nature rune",67,67,1/4309.33],
 ["rune-2h-sword","Rune 2h sword",1,1,1/4309.33],
 ["rune-battleaxe","Rune battleaxe",1,1,1/4309.33],
 ["uncut-emerald","Uncut emerald",1,1,1/5171.2],
 ["law-rune","Law rune",45,45,1/6464],
 ["death-rune","Death rune",45,45,1/6464],
 ["steel-arrow","Steel arrow",150,150,1/6464],
 ["rune-arrow","Rune arrow",42,42,1/6464],
 ["adamant-javelin","Adamant javelin",20,20,1/6464],
 ["rune-sq-shield","Rune sq shield",1,1,1/6464],
 ["dragonstone","Dragonstone",1,1,1/6464],
 ["silver-ore","Silver ore",100,100,1/6464],
 ["uncut-ruby","Uncut ruby",1,1,1/10342.4],
 ["rune-kiteshield","Rune kiteshield",1,1,1/12928],
 ["dragon-med-helm","Dragon med helm",1,1,1/12928],
 ["rune-spear","Rune spear",1,1,1/13647.7],
 ["shield-left-half","Shield left half",1,1,1/27295.41],
 ["nature-talisman","Nature talisman",1,1,1/27579.73],
 ["dragon-spear","Dragon spear",1,1,1/36393.87],
 ["uncut-diamond","Uncut diamond",1,1,1/41369.6],
 ["rune-javelin","Rune javelin",5,5,1/82739.2]
];
const specials=[
 ["hydra-bones","Hydra bones"],
 ["hydras-eye","Hydra's eye"],["hydras-fang","Hydra's fang"],["hydras-heart","Hydra's heart"],
 ["hydras-claw","Hydra's claw"],["hydra-tail","Hydra tail"],["hydra-leather","Hydra leather"],
 ["dragon-thrownaxe","Dragon thrownaxe"],["dragon-knife","Dragon knife"],
 ["brimstone-key","Brimstone key"],["clue-scroll-hard","Clue scroll (hard)"],
 ["alchemical-hydra-heads","Alchemical hydra heads"],["clue-scroll-elite","Clue scroll (elite)"],
 ["jar-of-chemicals","Jar of chemicals"],["ikkle-hydra","Ikkle hydra"]
];
export const ITEMS=Object.fromEntries([...specials,...STANDARD,...HERBS,...SEEDS,...RDT]
 .filter(row=>!row[0].startsWith("@")&&row[0]!=="nothing")
 .map(([id,name])=>[id,{id,name}]));
function unit(rng){
 const x=rng();
 if(!Number.isFinite(x)||x<0||x>=1)throw new RangeError("Random generator returned invalid value.");
 return x;
}
function choose(table,rng){
 const total=table.reduce((s,row)=>s+row[4],0);
 let pos=unit(rng)*total;
 for(const row of table){pos-=row[4];if(pos<0)return row;}
 return table.at(-1);
}
function quantity(row,rng){return row[2]===row[3]?row[2]:row[2]+Math.floor(unit(rng)*(row[3]-row[2]+1));}
function add(out,id,n=1){if(n>0)out[id]=(out[id]||0)+n;}
function standard(out,rng){
 let row=choose(STANDARD,rng);
 if(row[0]==="@herb")row=choose(HERBS,rng);
 else if(row[0]==="@seed")row=choose(SEEDS,rng);
 else if(row[0]==="@rdt")row=choose(RDT,rng);
 if(row[0]!=="nothing")add(out,row[0],quantity(row,rng));
}
export function validateKills(n){
 if(!Number.isSafeInteger(n)||n<0||n>MAX_KILLS)
  throw new RangeError("Enter between 0 and 1,000,000 completed kills.");
 return n;
}
// Success chances for each *conditional* sequential trial. The effective
// per-kill chance accounts for all prior failures in this fixed ordering.
export function preRollRates(){
 const result={};let remaining=1;
 for(const [id,denom] of PREROLL){
  result[id]=remaining/denom;
  remaining*=1-1/denom;
 }
 result.none=remaining;
 return result;
}
export function simulate(kills,{rng=Math.random,hardCA=false,eliteCA=false}={}){
 validateKills(kills);
 const drops=Object.create(null);
 let ringPieces=0;
 for(let k=0;k<kills;k++){
  add(drops,"hydra-bones",2);
  let won=false;
  for(const [id,denom,low,high] of PREROLL){
   if(unit(rng)<1/denom){
    const actual=id==="ring-piece"?RING_IDS[ringPieces++%3]:id;
    add(drops,actual,low===high?low:low+Math.floor(unit(rng)*(high-low+1)));
    won=true;break;
   }
  }
  // A pre-roll replaces only the first of the two regular loot rolls.
  if(!won)standard(drops,rng);
  standard(drops,rng);
  if(unit(rng)<1/40)add(drops,"brimstone-key");
  if(unit(rng)<1/(hardCA?95:100))add(drops,"clue-scroll-hard");
  if(unit(rng)<1/256)add(drops,"alchemical-hydra-heads");
  if(unit(rng)<1/(eliteCA?243:256))add(drops,"clue-scroll-elite");
  if(unit(rng)<1/2000)add(drops,"jar-of-chemicals");
  if(unit(rng)<1/3000)add(drops,"ikkle-hydra");
 }
 return {kills,drops,ringPieces};
}

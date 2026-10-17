// Mad Angel (repeatable post-quest), OSRS Wiki drop table, October 2026.
// Pre-roll probabilities are published per kill, total < 1, hence modeled as
// mutually exclusive main-loot replacements. Default RDT assumes no ring of wealth.
import { RDT } from "../hydra/simulator.mjs";
export const MAX_KILLS = 1_000_000;
export const PREROLL = [
  { id:"ardeaglais-teleport", name:"Ardeaglais teleport", quantity:2, rate:1/25 },
  { id:"hallowfell", name:"Hallowfell", quantity:1, rate:1/127 },
  { id:"jar-of-light", name:"Jar of Light", quantity:1, rate:1/1000 }
];
export const TERTIARY = [
  {id:"clue-scroll-medium",name:"Clue scroll (medium)",rate:1/25},
  {id:"aggy",name:"Aggy",rate:1/2000}
];
export const SIGNATURE = [PREROLL[1],PREROLL[2],TERTIARY[1]];
export const DRY_ITEMS = [...PREROLL,...TERTIARY.slice(1)];
// [id, item name, min quantity, max quantity, weight].
// 16/150 of main rolls are a supply bundle: fish (8 shark + 8 yellowfin)
// plus a prayer potion(2) and super combat potion(1).
export const COMMON = [
 ["rune-kiteshield","Rune kiteshield",1,1,12],
 ["rune-full-helm","Rune full helm",1,1,12],
 ["adamant-longsword","Adamant longsword",1,1,6],
 ["dragon-med-helm","Dragon med helm",1,1,2],
 ["dragon-battleaxe","Dragon battleaxe",1,1,2],
 ["steel-cannonball","Steel cannonball",90,100,16],
 ["law-rune","Law rune",28,30,12],
 ["nature-rune","Nature rune",20,25,8],
 ["death-rune","Death rune",40,50,8],
 ["air-rune","Air rune",110,120,4],
 ["@supply-shark","Supplies (shark)",1,1,8],
 ["@supply-yellowfin","Supplies (yellowfin)",1,1,8],
 ["prayer-potion-4","Prayer potion(4)",1,1,12],
 ["super-combat-potion-3","Super combat potion(3)",2,3,8],
 ["coins","Coins",8000,10000,8],
 ["raw-monkfish","Raw monkfish",18,22,8],
 ["emerald","Emerald",7,8,6],
 ["sapphire","Sapphire",7,8,6],
 ["cupronickel-bar","Cupronickel bar",1,1,1],
 ["papyrus","Papyrus",1,1,1]
];
export const RDT_WEIGHT = 2;
export const MAIN_WEIGHT = COMMON.reduce((s,item)=>s+item[4],0)+RDT_WEIGHT;
export const ITEMS = Object.freeze(Object.fromEntries([
 ["granite-dust","Granite dust"],["sunstone-crystal","Sunstone crystal"],
 ...PREROLL.map(i=>[i.id,i.name]),
 ...TERTIARY.map(i=>[i.id,i.name]),
 ...COMMON.filter(i=>!i[0].startsWith("@")).map(i=>[i[0],i[1]]),
 ["shark","Shark"],["yellowfin","Yellowfin"],
 ["prayer-potion-2","Prayer potion(2)"],
 ["super-combat-potion-1","Super combat potion(1)"],
 ...RDT.filter(i=>i[0]!=="nothing").map(i=>[i[0],i[1]])
].map(([id,name])=>[id,{id,name}])));
export function validateKills(n){
 if(!Number.isSafeInteger(n)||n<0||n>MAX_KILLS)
  throw new RangeError("Enter between 0 and 1,000,000 completed kills.");
 return n;
}
function random(rng){
 const x=rng();
 if(typeof x!=="number"||!Number.isFinite(x)||x<0||x>=1)
  throw new RangeError("Random number must be within [0, 1).");
 return x;
}
function choose(table,weightIndex,rng,total=null){
 let roll=random(rng)*(total??table.reduce((s,v)=>s+v[weightIndex],0));
 for(const row of table){roll-=row[weightIndex];if(roll<0)return row;}
 return table.at(-1);
}
function quantity(entry,rng){
 return entry[2]===entry[3]?entry[2]:entry[2]+Math.floor(random(rng)*(entry[3]-entry[2]+1));
}
export function rateOf(id){
 const item=PREROLL.find(i=>i.id===id)||TERTIARY.find(i=>i.id===id);
 return item?.rate??0;
}
export function simulate(kills,{rng=Math.random,mediumCAs=false,sunstoneEligible=false}={}){
 validateKills(kills);
 const drops=Object.create(null);
 const add=(id,qty=1)=>{if(qty>0)drops[id]=(drops[id]||0)+qty;};
 const preRate=PREROLL.reduce((sum,item)=>sum+item.rate,0);
 for(let kc=0;kc<kills;kc++){
  add("granite-dust",25+Math.floor(random(rng)*11));
  // The crystal is a one-off when the player's bank chest isn't built
  // and the player does not already possess a sunstone crystal.
  if(kc===0&&sunstoneEligible)add("sunstone-crystal");
  const r=random(rng);
  let cumulative=0;
  let special=false;
  for(const reward of PREROLL){
   cumulative+=reward.rate;
   if(r<cumulative){
    add(reward.id,reward.quantity);
    special=true;
    break;
   }
  }
  if(!special){
   const main=random(rng)*MAIN_WEIGHT;
   if(main<MAIN_WEIGHT-RDT_WEIGHT){
    let roll=main;
    let chosen=COMMON.at(-1);
    for(const item of COMMON){roll-=item[4];if(roll<0){chosen=item;break;}}
    if(chosen[0]==="@supply-shark"||chosen[0]==="@supply-yellowfin"){
     add(chosen[0]==="@supply-shark"?"shark":"yellowfin",2);
     add("prayer-potion-2");
     add("super-combat-potion-1");
    }else add(chosen[0],quantity(chosen,rng));
   }else{
    const rare=choose(RDT,4,rng);
    if(rare[0]!=="nothing")add(rare[0],quantity(rare,rng));
   }
  }
  if(random(rng)<(mediumCAs?1/23:1/25))add("clue-scroll-medium");
  if(random(rng)<1/2000)add("aggy");
 }
 return {kills,drops};
}

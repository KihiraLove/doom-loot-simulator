// Phosani's Nightmare ONLY. Sources: OSRS Wiki drop table (Jul 2026)
// and Mod Ash's 1–2 April 2026 clarification of the staff/mace rolls.
export const MAX_KILLS = 1_000_000;
export const ARMOUR_CHANCE = 1 / 140;
export const ORB_CHANCE = 3 / 1600;
export const ARMOUR = [
  { id:"nightmare-staff", name:"Nightmare staff", weight:.276, rarity:"69/35,000" },
  { id:"inquisitors-great-helm", name:"Inquisitor's great helm", weight:.2, rarity:"1/700" },
  { id:"inquisitors-hauberk", name:"Inquisitor's hauberk", weight:.2, rarity:"1/700" },
  { id:"inquisitors-plateskirt", name:"Inquisitor's plateskirt", weight:.2, rarity:"1/700" },
  { id:"inquisitors-mace", name:"Inquisitor's mace", weight:.124, rarity:"31/35,000" }
];
export const ORBS = [
  { id:"eldritch-orb", name:"Eldritch orb", rarity:"1/1,600" },
  { id:"harmonised-orb", name:"Harmonised orb", rarity:"1/1,600" },
  { id:"volatile-orb", name:"Volatile orb", rarity:"1/1,600" }
];
export const SIGNATURE = [...ARMOUR, ...ORBS];
export const TERTIARY = [
  { id:"clue-scroll-elite", name:"Clue scroll (elite)", rarity:"1/35", rate:1/35 },
  { id:"slepey-tablet", name:"Slepey tablet", rarity:"1/25 + 25th kill guarantee", rate:1/25 },
  { id:"parasitic-egg", name:"Parasitic egg", rarity:"1/200", rate:1/200 },
  { id:"little-nightmare", name:"Little nightmare", rarity:"1/1,400", rate:1/1400 },
  { id:"jar-of-dreams", name:"Jar of dreams", rarity:"1/4,000", rate:1/4000 }
];
export const DRY_ITEMS = [...SIGNATURE, ...TERTIARY.slice(2)];
// [id, name, min quantity, max quantity, relative weight].
// Wiki common-table percentages are rounded and sum to 101; normalize weights.
export const COMMON = [
 ["cosmic-rune","Cosmic rune",247,420,4],
 ["nature-rune","Nature rune",165,305,4],
 ["death-rune","Death rune",165,305,4],
 ["blood-rune","Blood rune",343,765,4],
 ["soul-rune","Soul rune",110,228,4],
 ["steel-cannonball","Steel cannonball",137,382,4],
 ["rune-arrow","Rune arrow",412,957,3],
 ["mithril-ore","Mithril ore",165,305,5],
 ["coal","Coal",220,458,4],
 ["gold-ore","Gold ore",165,305,4],
 ["adamantite-ore","Adamantite ore",40,95,4],
 ["magic-logs","Magic logs",40,95,4],
 ["grimy-cadantine","Grimy cadantine",13,26,4],
 ["grimy-torstol","Grimy torstol",13,26,4],
 ["snapdragon-seed","Snapdragon seed",5,10,3],
 ["uncut-emerald","Uncut emerald",33,75,3],
 ["uncut-ruby","Uncut ruby",27,60,3],
 ["runite-ore","Runite ore",11,26,2],
 ["bass","Bass",16,29,6],
 ["shark","Shark",13,26,6],
 ["prayer-potion-3","Prayer potion(3)",8,15,5],
 ["sanfew-serum-3","Sanfew serum(3)",6,12,5],
 ["saradomin-brew-3","Saradomin brew(3)",8,15,5],
 ["zamorak-brew-3","Zamorak brew(3)",8,15,5],
 ["coins","Coins",41417,74500,2]
];
export const ITEMS = [{id:"big-bones",name:"Big bones",rarity:"Always"},...SIGNATURE,...TERTIARY,
 ...COMMON.map(([id,name])=>({id,name}))];
export const ITEM_BY_ID=Object.fromEntries(ITEMS.map(item=>[item.id,item]));
const COMMON_TOTAL=COMMON.reduce((s,row)=>s+row[4],0);

export function validateKills(kills) {
 if(!Number.isSafeInteger(kills)||kills<0||kills>MAX_KILLS)
   throw new RangeError("Enter between 0 and 1,000,000 completed kills.");
 return kills;
}
function unit(rng) {
 const n=rng();
 if(typeof n!=="number"||!Number.isFinite(n)||n<0||n>=1)
   throw new RangeError("Random number must be in [0,1).");
 return n;
}
function weighted(choices, weightAt, total, rng) {
 let roll=unit(rng)*total;
 for(const item of choices){roll-=weightAt(item); if(roll<0)return item;}
 return choices.at(-1);
}
export function simulate(kills,{rng=Math.random,eliteCAs=false}={}) {
 validateKills(kills);
 const drops=Object.create(null);
 const add=(id,qty=1)=>{drops[id]=(drops[id]||0)+qty;};
 for(let kc=1;kc<=kills;kc++){
   add("big-bones");
   const common=weighted(COMMON,item=>item[4],COMMON_TOTAL,rng);
   add(common[0],common[2]+Math.floor(unit(rng)*(common[3]-common[2]+1)));
   // These two rolls are independent: two signatures can land on one kill.
   if(unit(rng)<ARMOUR_CHANCE) add(weighted(ARMOUR,item=>item.weight,1,rng).id);
   if(unit(rng)<ORB_CHANCE) add(ORBS[Math.floor(unit(rng)*3)].id);
   if(unit(rng)<(eliteCAs?1/33:1/35))add("clue-scroll-elite");
   if(unit(rng)<1/25)add("slepey-tablet");
   if(kc===25&&!drops["slepey-tablet"])add("slepey-tablet");
   if(unit(rng)<1/200)add("parasitic-egg");
   if(unit(rng)<1/1400)add("little-nightmare");
   if(unit(rng)<1/4000)add("jar-of-dreams");
 }
 return {kills,drops};
}
export function rateOf(id) {
 const a=ARMOUR.find(item=>item.id===id);
 if(a)return ARMOUR_CHANCE*a.weight;
 if(ORBS.some(item=>item.id===id))return 1/1600;
 return TERTIARY.find(item=>item.id===id)?.rate??0;
}

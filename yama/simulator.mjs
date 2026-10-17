// Yama standard (uncontracted) encounters, per-player contribution.
// See OSRS Wiki Yama, Dossier and Forgotten lockbox tables (Jul/Aug 2026).
export const MAX_KILLS=1000000;
export const EQUIPMENT=[
 {id:"oathplate-helm",name:"Oathplate helm",weight:1},
 {id:"oathplate-chest",name:"Oathplate chest",weight:1},
 {id:"oathplate-legs",name:"Oathplate legs",weight:1},
 {id:"soulflame-horn",name:"Soulflame horn",weight:2}
];
export const BOSS_UNIQUES=[
 ...EQUIPMENT,{id:"dossier",name:"Dossier"},{id:"forgotten-lockbox",name:"Forgotten lockbox"},
 {id:"oathplate-shards",name:"Oathplate shards"},{id:"yami",name:"Yami"}
];
export const DRY_ITEMS=BOSS_UNIQUES.filter(i=>i.id!=="forgotten-lockbox");
// Standard table: one of 78 weighted outcomes; supply outcome gives three
// different supplies, selected uniformly from six (each with 50% inclusion).
export const SUPPLIES=[
 ["pineapple-pizza","Pineapple pizza",3,4],
 ["wild-pie","Wild pie",3,4],
 ["prayer-potion-3","Prayer potion(3)",2,2],
 ["super-restore-mix-2","Super restore mix(2)",2,2],
 ["super-combat-potion-1","Super combat potion(1)",1,1],
 ["zamorak-mix-2","Zamorak mix(2)",1,1]
];
// [id, name, solo quantity, weight]; scaled by contribution.
export const STANDARD=[
 ["rune-chainbody","Rune chainbody",8,5],
 ["battlestaff","Battlestaff",40,4],
 ["rune-platebody","Rune platebody",8,3],
 ["dragon-plateskirt","Dragon plateskirt",1,2],
 ["dragon-platelegs","Dragon platelegs",1,2],
 ["blood-rune","Blood rune",400,3],
 ["law-rune","Law rune",150,3],
 ["smoke-rune","Smoke rune",350,2],
 ["soul-rune","Soul rune",500,2],
 ["soul-rune","Soul rune",1000,2],
 ["fire-rune","Fire rune",40000,1],
 ["wrath-rune","Wrath rune",800,1],
 ["aether-catalyst","Aether catalyst",850,7],
 ["diabolic-worms","Diabolic worms",90,7],
 ["barrel-of-demonic-tallow-full","Barrel of demonic tallow (full)",1,5],
 ["chasm-teleport-scroll","Chasm teleport scroll",6,4],
 ["emerald","Emerald",40,3],
 ["ruby","Ruby",40,3],
 ["diamond","Diamond",40,3],
 ["onyx-bolt-tips","Onyx bolt tips",150,1]
];
export const LOCKBOX=[
 ["dragon-bolts-unf","Dragon bolts (unf)",125,60],
 ["dragon-dart","Dragon dart",125,60],
 ["oathplate-shards","Oathplate shards",14,60],
 ["dragon-dart","Dragon dart",80,50],
 ["oathplate-shards","Oathplate shards",11,50],
 ["dragon-platelegs","Dragon platelegs",1,50],
 ["dragon-plateskirt","Dragon plateskirt",1,50],
 ["coins","Coins",233333,20],
 ["oathplate-helm","Oathplate helm",1,1],
 ["oathplate-chest","Oathplate chest",1,1],
 ["oathplate-legs","Oathplate legs",1,1]
];
export const DOSSIER=[
 ["contract-of-bloodied-blows","Contract of bloodied blows",3,260],
 ["contract-of-divine-severance","Contract of divine severance",3,260],
 ["contract-of-forfeit-breath","Contract of forfeit breath",3,260],
 ["contract-of-glyphic-attenuation","Contract of glyphic attenuation",3,260],
 ["contract-of-sensory-clouding","Contract of sensory clouding",3,260],
 ["chasm-teleport-scroll","Chasm teleport scroll",null,116],
 ["rite-of-vile-transference","Rite of vile transference",1,116],
 ["contract-of-familiar-acquisition","Contract of familiar acquisition",2,65],
 ["contract-of-shard-acquisition","Contract of shard acquisition",1,39],
 ["contract-of-worm-acquisition","Contract of worm acquisition",1,39],
 ["contract-of-catalyst-acquisition","Contract of catalyst acquisition",1,39],
 ["contract-of-harmony-acquisition","Contract of harmony acquisition",1,13],
 ["contract-of-oathplate-acquisition","Contract of oathplate acquisition",1,13]
];
export const ALL_ITEMS=[
 ...BOSS_UNIQUES,...SUPPLIES.map(([id,name])=>({id,name})),
 ...STANDARD.map(([id,name])=>({id,name})),
 ...LOCKBOX.map(([id,name])=>({id,name})),
 ...DOSSIER.map(([id,name])=>({id,name})),{id:"clue-scroll-elite",name:"Clue scroll (elite)"}
];
export const ITEM_MAP=Object.fromEntries(ALL_ITEMS.map(item=>[item.id,item]));
export function validateKills(kills){
 if(!Number.isSafeInteger(kills)||kills<0||kills>MAX_KILLS)throw new RangeError("Enter 0 to 1,000,000 completed kills.");
 return kills;
}
export function validateContribution(contribution){
 if(contribution!==1&&contribution!==0.5)throw new RangeError("Choose Solo (100%) or Duo (50%).");
 return contribution;
}
export function rates(contribution){
 validateContribution(contribution);
 const gear=contribution/120, dossier=(1-gear)*contribution/12;
 const box=(1-gear)*(1-contribution/12)/30;
 const shards=(1-gear)*(1-contribution/12)*(29/30)/15;
 return {gear,dossier,box,shards,common:1-gear-dossier-box-shards,pet:1/2500,clue:1/30};
}
export function itemRate(id,contribution){
 const r=rates(contribution);
 const eq=EQUIPMENT.find(i=>i.id===id);
 if(eq)return r.gear*eq.weight/5;
 if(id==="dossier")return r.dossier;
 if(id==="forgotten-lockbox")return r.box;
 if(id==="oathplate-shards")return r.shards;
 if(id==="yami")return r.pet;
 return 0;
}
function unit(rng){
 const x=rng();
 if(!Number.isFinite(x)||x<0||x>=1)throw new RangeError("RNG must return [0,1).");
 return x;
}
function sample(table,total,rng,weightIndex=3){
 let value=unit(rng)*total;
 for(const item of table){value-=item[weightIndex];if(value<0)return item;}
 return table.at(-1);
}
function add(drops,id,n=1){if(n>0)drops[id]=(drops[id]||0)+n;}
function qtyScaled(q,c){return Math.max(1,Math.floor(q*c));}
function qtyRange(low,high,rng){return low+Math.floor(unit(rng)*(high-low+1));}
// Open every simulated box/dossier immediately after its Yama kill, so
// first dossier at >=100 KC can satisfy the Rite of vile transference guarantee.
export function simulate(kills,contribution=1,{rng=Math.random}={}){
 validateKills(kills);const r=rates(contribution);
 const drops=Object.create(null), boxes=Object.create(null), dossiers=Object.create(null);
 let lockboxes=0, dossierCount=0, riteOwned=false;
 for(let kc=1;kc<=kills;kc++){
  const roll=unit(rng);
  if(roll<r.gear){
   const eq=sample(EQUIPMENT.map(i=>[i.id,i.name,i.weight]),5,rng,2);
   add(drops,eq[0]);
  }else if(roll<r.gear+r.dossier){
   add(drops,"dossier");dossierCount++;
   let reward=DOSSIER.find(x=>x[0]==="rite-of-vile-transference");
   if(riteOwned||kc<100)reward=sample(DOSSIER,1740,rng,3);
   // Guaranteed the first dossier opened after 100 kills, unless rite already acquired.
   if(reward[0]==="rite-of-vile-transference"){
    if(!riteOwned){add(dossiers,reward[0]);riteOwned=true;}
    else add(dossiers,"chasm-teleport-scroll",qtyRange(15,18,rng));
   }else if(reward[0]==="chasm-teleport-scroll"){
    add(dossiers,reward[0],qtyRange(15,18,rng));
   }else add(dossiers,reward[0],reward[2]);
  }else if(roll<r.gear+r.dossier+r.box){
   add(drops,"forgotten-lockbox");lockboxes++;
   const reward=sample(LOCKBOX,403,rng);
   add(boxes,reward[0],reward[2]);
  }else if(roll<r.gear+r.dossier+r.box+r.shards){
   add(drops,"oathplate-shards",qtyScaled(12,contribution));
  }else{
   // 15 of the 78 standard-table tickets select a three-of-six supply drop.
   const base=unit(rng)*78;
   if(base<15){
    for(const [id,,low,high] of SUPPLIES){
     if(unit(rng)<0.5)add(drops,id,qtyScaled(qtyRange(low,high,rng),contribution));
    }
   }else{
    let value=base-15,entry=STANDARD.at(-1);
    for(const candidate of STANDARD){value-=candidate[3];if(value<0){entry=candidate;break;}}
    add(drops,entry[0],qtyScaled(entry[2],contribution));
   }
  }
  // These tertiary tables are independent of the main reward.
  if(unit(rng)<r.clue)add(drops,"clue-scroll-elite");
  if(unit(rng)<r.pet)add(drops,"yami");
 }
 return {kills,contribution,drops,boxes,dossiers,lockboxes,dossierCount};
}

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  MAX_KILLS, EQUIPMENT, BOSS_UNIQUES, DRY_ITEMS, SUPPLIES, STANDARD, LOCKBOX, DOSSIER,
  ALL_ITEMS, rates, itemRate, simulate,validateKills,validateContribution
} from "../yama/simulator.mjs";
import {calculateDry,anyRare} from "../yama/dry-calc.mjs";
const close=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<=tolerance,"Expected "+b+", got "+a);
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("wiki source weights and sequential contributions",()=>{
 assert.equal(MAX_KILLS,1000000);
 assert.equal(EQUIPMENT.reduce((s,i)=>s+i.weight,0),5);
 assert.equal(SUPPLIES.length,6);
 assert.equal(STANDARD.reduce((s,i)=>s+i[3],0),63);
 assert.equal(LOCKBOX.reduce((s,i)=>s+i[3],0),403);
 assert.equal(DOSSIER.reduce((s,i)=>s+i[3],0),1740);
 close(rates(1).gear,1/120);
 close(rates(.5).gear,1/240);
 close(rates(.5).dossier/(1-rates(.5).gear),1/24);
 close(rates(1).box/(1-rates(1).gear-rates(1).dossier),1/30);
 close(rates(.5).box/(1-rates(.5).gear-rates(.5).dossier),1/30);
 close(rates(.5).pet,1/2500);
 close(itemRate("soulflame-horn",1),1/300);
 close(itemRate("soulflame-horn",.5),1/600);
 close(itemRate("oathplate-chest",1),1/600);
 close(itemRate("oathplate-chest",.5),1/1200);
 close(rates(1).gear+rates(1).dossier+rates(1).box+rates(1).shards+rates(1).common,1);
});
test("single kill can produce an oathplate unique, pet, and elite clue",()=>{
 const result=simulate(1,1,{rng:()=>0});
 assert.equal(result.drops["oathplate-helm"],1);
 assert.equal(result.drops.yami,1);
 assert.equal(result.drops["clue-scroll-elite"],1);
});
test("solo versus duo changes equipment drop and amount, not the pet roll",()=>{
 const solo=simulate(1,1,{rng:()=>.005});
 const duo=simulate(1,.5,{rng:()=>.005});
 assert.equal(solo.drops["oathplate-helm"],1);
 assert.equal(duo.drops["oathplate-helm"],undefined);
 const soloCommon=simulate(1,1,{rng:()=>.99});
 const duoCommon=simulate(1,.5,{rng:()=>.99});
 assert.equal(soloCommon.drops["onyx-bolt-tips"],150);
 assert.equal(duoCommon.drops["onyx-bolt-tips"],75);
});
test("a forgotten lockbox opens once per earned lockbox and has separate loot",()=>{
 const result=simulate(1,1,{rng:()=>.1});
 assert.equal(result.lockboxes,1);
 assert.equal(result.drops["forgotten-lockbox"],1);
 assert.equal(result.boxes["dragon-bolts-unf"],125);
 assert.equal(result.drops["dragon-bolts-unf"],undefined);
 assert.equal(result.dossierCount,0);
});
test("dossier rewards are separate and 100 KC guarantees the first rite if not already owned",()=>{
 const before=simulate(99,1,{rng:()=>.02});
 assert.equal(before.dossierCount,99);
 assert.equal(before.dossiers["rite-of-vile-transference"],undefined);
 const after=simulate(100,1,{rng:()=>.02});
 assert.equal(after.dossierCount,100);
 assert.equal(after.dossiers["rite-of-vile-transference"],1);
 assert.equal(after.drops["rite-of-vile-transference"],undefined);
});
test("invalid inputs and boundary counts are rejected",()=>{
 assert.deepEqual({...simulate(0).drops},{});
 assert.equal(validateKills(MAX_KILLS),MAX_KILLS);
 assert.equal(validateContribution(.5),.5);
 for(const n of [-1,1.2,1000001,Infinity,NaN])assert.throws(()=>simulate(n));
 for(const c of [-1,0,.4,2,NaN])assert.throws(()=>simulate(1,c));
 assert.throws(()=>simulate(1,1,{rng:()=>1}));
});
test("dry calculator excludes all opened-container rewards",()=>{
 const results=calculateDry(100,1,{"oathplate-helm":1,"oathplate-shards":12});
 assert.equal(results["oathplate-helm"].count,1);
 assert.equal(results["oathplate-shards"].count,12);
 assert.equal(results["oathplate-shards"].expected,100*12*itemRate("oathplate-shards",1));
 assert.ok(!("forgotten-lockbox" in results));
 assert.ok(!("rite-of-vile-transference" in results));
 assert.ok(!("contract-of-familiar-acquisition" in results));
 const duo=calculateDry(100,.5,{"oathplate-shards":6});
 assert.equal(duo["oathplate-shards"].count,6);
 assert.throws(()=>calculateDry(100,.5,{"oathplate-shards":12+1}));
 assert.throws(()=>calculateDry(100,1,{"oathplate-shards":6}));
});
test("individual and combined dry distributions are normalized at high kill count",()=>{
 for(const kc of [0,1,50,1000,1000000]){
  for(const c of [1,.5]){
   const data=calculateDry(kc,c);
   for(const item of DRY_ITEMS){
    const row=data[item.id];
    close(row.fewer+row.exact+row.more,1);
    const batch=item.id==="oathplate-shards"?(c===1?12:6):1;
    close(row.expected,kc*itemRate(item.id,c)*batch,1e-6);
   }
   close(data.anyUnique.fewer+data.anyUnique.exact+data.anyUnique.more,1);
   close(data.anyUnique.atLeastOne,1-Math.pow((1-rates(c).gear)*(1-1/2500),kc),1e-7);
  }
 }
 close(anyRare(1,1,2).exact,rates(1).gear*(1/2500));
 assert.throws(()=>anyRare(1,1,3));
});
test("Yama navigation, contribution choices and all drop sprites are local PNGs",()=>{
 const home=read("index.html"),page=read("yama/index.html"),app=read("yama/app.mjs");
 assert.match(home,/href="\.\/yama\/"/);
 assert.match(page,/id="mode-loot"/);
 assert.match(page,/id="mode-dry"/);
 assert.match(page,/value="0.5"/);
 assert.ok(page.indexOf('name="contribution"')<page.indexOf('id="kill-count"'));
 assert.match(page,/id="box-grid"/);assert.match(page,/id="dossier-grid"/);
 assert.match(app,/calculateDry/);
 assert.doesNotMatch(app,/https:\/\/oldschool\.runescape\.wiki\/images/);
 const uniq=[...new Set(ALL_ITEMS.map(i=>i.id))];
 for(const id of uniq){
  const bytes=readFileSync(new URL("../assets/items/"+id+".png",import.meta.url));
  assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10],id+" missing PNG");
 }
 assert.ok(BOSS_UNIQUES.length>4);
});

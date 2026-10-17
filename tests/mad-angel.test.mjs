import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  PREROLL,TERTIARY,SIGNATURE,DRY_ITEMS,COMMON,MAIN_WEIGHT,
  ITEMS,MAX_KILLS,simulate,rateOf,validateKills
} from "../mad-angel/simulator.mjs";
import {calculateDry,anyUniqueOdds} from "../mad-angel/dry-calc.mjs";

const close=(a,b,eps=1e-9)=>
 assert.ok(Math.abs(a-b)<=eps,"Expected "+b+", got "+a);
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("post-quest rare rates and 150-ticket normal table match Mad Angel drops",()=>{
 assert.equal(MAIN_WEIGHT,150);
 assert.equal(COMMON.reduce((sum,row)=>sum+row[4],0),148);
 assert.equal(PREROLL.length,3);
 close(rateOf("ardeaglais-teleport"),1/25);
 close(rateOf("hallowfell"),1/127);
 close(rateOf("jar-of-light"),1/1000);
 close(rateOf("aggy"),1/2000);
 close(rateOf("clue-scroll-medium"),1/25);
 assert.equal(PREROLL[0].quantity,2);
 assert.equal(TERTIARY[0].id,"clue-scroll-medium");
 assert.equal(DRY_ITEMS.length,4);
 assert.equal(SIGNATURE.length,3);
});
test("every kill gives 25–35 granite dust; eligible sunstone crystal is exactly once",()=>{
 const base=simulate(2,{rng:()=>.5});
 assert.equal(base.drops["granite-dust"],60);
 assert.equal(base.drops["sunstone-crystal"],undefined);
 const eligible=simulate(2,{rng:()=>.5,sunstoneEligible:true});
 assert.equal(eligible.drops["sunstone-crystal"],1);
 assert.equal(eligible.drops["granite-dust"],60);
 const zero=simulate(0,{rng:()=>0,sunstoneEligible:true});
 assert.deepEqual({...zero.drops},{});
});
test("mutually exclusive pre-rolls and independent pet roll",()=>{
 const tp=simulate(1,{rng:()=>0});
 assert.equal(tp.drops["ardeaglais-teleport"],2);
 assert.equal(tp.drops["hallowfell"],undefined);
 assert.equal(tp.drops["jar-of-light"],undefined);
 assert.equal(tp.drops.aggy,1);
 const sword=simulate(1,{rng:()=>.045});
 assert.equal(sword.drops.hallowfell,1);
 assert.equal(sword.drops["ardeaglais-teleport"],undefined);
 const jar=simulate(1,{rng:()=>.048});
 assert.equal(jar.drops["jar-of-light"],1);
 assert.equal(jar.drops["hallowfell"],undefined);
});
test("supply batch gives fish plus both potions rather than just one item",()=>{
 const rolls=[.5,.5,.58,.5,.5];
 let i=0;
 const loot=simulate(1,{rng:()=>rolls[i++]});
 assert.equal(loot.drops["granite-dust"],30);
 assert.equal(loot.drops.shark,2);
 assert.equal(loot.drops["prayer-potion-2"],1);
 assert.equal(loot.drops["super-combat-potion-1"],1);
 assert.equal(loot.drops.yellowfin,undefined);
});
test("medium combat achievement clue rate is 1/23 without changing pet chance",()=>{
 const run=(ca)=>{const rolls=[.5,.5,.07,.041,.5];let i=0;
  return simulate(1,{rng:()=>rolls[i++],mediumCAs:ca});};
 assert.equal(run(false).drops["clue-scroll-medium"],undefined);
 assert.equal(run(true).drops["clue-scroll-medium"],1);
});
test("strict input validation",()=>{
 assert.equal(validateKills(MAX_KILLS),MAX_KILLS);
 for(const n of [-1,1.5,MAX_KILLS+1,Infinity,NaN]){
  assert.throws(()=>simulate(n));assert.throws(()=>calculateDry(n));
 }
 assert.throws(()=>simulate(1,{rng:()=>1}));
});
test("teleports are entered in pairs for dry calculator",()=>{
 const data=calculateDry(1,{"ardeaglais-teleport":2});
 assert.equal(data["ardeaglais-teleport"].count,2);
 close(data["ardeaglais-teleport"].exact,1/25);
 close(data["ardeaglais-teleport"].expected,2/25);
 assert.throws(()=>calculateDry(1,{"ardeaglais-teleport":1}));
 assert.throws(()=>calculateDry(1,{"ardeaglais-teleport":3}));
});
test("combined Hallowfell + jar + pet odds model exclusive pre-roll and independent pet",()=>{
 const rate=1/127+1/1000;
 const row=anyUniqueOdds(1,2);
 close(row.exact,rate/2000);
 close(row.atLeastOne,1-(1-rate)*(1-1/2000));
 const observed=calculateDry(1,{"hallowfell":1,"aggy":1});
 close(observed.anyUnique.exact,row.exact);
 assert.equal(observed.anyUnique.count,2);
 assert.throws(()=>anyUniqueOdds(1,3));
});
test("dry outcomes sum to 100% at all tested kill counts",()=>{
 for(const n of [0,1,50,1000,1000000]){
  const data=calculateDry(n,{});
  for(const item of DRY_ITEMS){
   const odds=data[item.id];
   close(odds.fewer+odds.exact+odds.more,1,1e-8);
   close(odds.expected,n*rateOf(item.id)*(item.quantity??1),1e-6);
  }
  close(data.anyUnique.fewer+data.anyUnique.exact+data.anyUnique.more,1,1e-8);
 }
});
test("homepage integration, two modes, and every item icon is locally backed by PNG",()=>{
 const home=read("index.html"),page=read("mad-angel/index.html"),app=read("mad-angel/app.mjs");
 assert.match(home,/href="\.\/mad-angel\/"/);
 assert.match(home,/src="\.\/assets\/items\/aggy\.png"/);
 assert.match(page,/href="\.\.\/"/);
 assert.match(page,/id="mode-loot"/);
 assert.match(page,/id="mode-dry"/);
 assert.match(page,/id="medium-cas"/);
 assert.match(page,/id="sunstone-eligible"/);
 assert.match(page,/src="\.\.\/assets\/items\/aggy\.png"/);
 assert.match(app,/calculateDry/);
 assert.doesNotMatch(app,/oldschool\.runescape\.wiki\/images/);
 for(const item of Object.values(ITEMS)){
  const content=readFileSync(new URL("../assets/items/"+item.id+".png",import.meta.url));
  assert.deepEqual([...content.subarray(0,8)],[137,80,78,71,13,10,26,10],item.id);
 }
});

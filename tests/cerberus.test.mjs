import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  UNIQUE,TERTIARY,COMMON,RDT,DRY_ITEMS,ITEMS,
  MAX_KILLS,rateOf,validateKills,simulate
} from "../cerberus/simulator.mjs";
import {calculateDry} from "../cerberus/dry-calc.mjs";

const close=(actual,expected,tolerance=1e-8)=>
 assert.ok(Math.abs(actual-expected)<=tolerance,"Expected "+expected+", got "+actual);
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("Cerberus primary drop table has 130 tickets and exact unique rates",()=>{
 assert.equal(COMMON.reduce((sum,row)=>sum+row[4],0),126);
 assert.equal(COMMON.length,32);
 assert.equal(UNIQUE.length,4);
 for(const item of UNIQUE)close(rateOf(item.id),1/520);
 assert.equal(DRY_ITEMS.length,6);
 assert.equal(RDT.length,27);
 assert.ok(RDT.every(row=>row[4]>0));
 close(rateOf("jar-of-souls"),1/2000);
 close(rateOf("hellpuppy"),1/3000);
 close(rateOf("ensouled-hellhound-head"),1/15);
 close(rateOf("clue-scroll-elite"),1/100);
});
test("one primary unique per kill, always infernal ashes",()=>{
 const result=simulate(1,{rng:()=>0,konarTask:true});
 assert.equal(result.drops["infernal-ashes"],1);
 assert.equal(result.drops["primordial-crystal"],1);
 assert.equal(result.drops["pegasian-crystal"]||0,0);
 assert.equal(result.drops["eternal-crystal"]||0,0);
 assert.equal(result.drops["smouldering-stone"]||0,0);
 assert.equal(result.drops["ensouled-hellhound-head"],1);
 assert.equal(result.drops["jar-of-souls"],1);
 assert.equal(result.drops["hellpuppy"],1);
 assert.equal(result.drops["brimstone-key"],1);
});
test("normal loot retains source quantities and updated key master teleport batch of seven",()=>{
 const result=simulate(1,{rng:()=>.999});
 assert.equal(result.drops["infernal-ashes"],1);
 assert.equal(result.drops["key-master-teleport"],7);
 assert.equal(Object.keys(result.drops).length,2);
 const normal=simulate(10,{rng:()=>.999});
 assert.equal(normal.drops["key-master-teleport"],70);
 assert.equal(normal.drops["infernal-ashes"],10);
});
test("Konar task is required for a brimstone key; elite CA affects only elite clues",()=>{
 // Order: primary, common, RDT, head, clue, jar, pet, optional Konar key.
 const sequence=()=>{let at=0;const rolls=[.99,.99,.99,.99,.0098,.99,.99,0];return ()=>rolls[at++];};
 const base=simulate(1,{rng:sequence(),konarTask:false,eliteCAs:false});
 const boosted=simulate(1,{rng:sequence(),konarTask:true,eliteCAs:true});
 assert.equal(base.drops["brimstone-key"],undefined);
 assert.equal(boosted.drops["brimstone-key"],1);
 assert.equal(base.drops["clue-scroll-elite"],1);
 assert.equal(boosted.drops["clue-scroll-elite"],1);
 // Chance between the two thresholds, 1/100 and 1/95.
 const between=()=>{let at=0;const rolls=[.99,.99,.99,.99,.0102,.99,.99,0];return ()=>rolls[at++];};
 assert.equal(simulate(1,{rng:between(),eliteCAs:false}).drops["clue-scroll-elite"],undefined);
 assert.equal(simulate(1,{rng:between(),eliteCAs:true}).drops["clue-scroll-elite"],1);
});
test("zero and invalid counts are handled, RNG is constrained",()=>{
 assert.deepEqual({...simulate(0).drops},{});
 assert.equal(validateKills(MAX_KILLS),MAX_KILLS);
 for(const n of [-1,1.5,MAX_KILLS+1,Infinity,NaN]){
  assert.throws(()=>simulate(n));
  assert.throws(()=>calculateDry(n));
 }
 assert.throws(()=>simulate(1,{rng:()=>1}));
});
test("dry calculator matches multinomial exclusivity and independent tertiary rates",()=>{
 const one=calculateDry(1,{"primordial-crystal":1});
 close(one["primordial-crystal"].exact,1/520);
 close(one.anyUnique.exact,1/130);
 close(one.anyUnique.atLeastOne,1/130);
 assert.equal(one.anyUnique.count,1);
 assert.throws(()=>calculateDry(1,{"primordial-crystal":1,"pegasian-crystal":1}));
 const three=calculateDry(1,{"primordial-crystal":1,"jar-of-souls":1,"hellpuppy":1});
 close(three["jar-of-souls"].exact,1/2000);
 close(three["hellpuppy"].exact,1/3000);
 assert.ok(!("brimstone-key" in three));
 assert.ok(!("key-master-teleport" in three));
});
test("fewer, exact, and more normalize at high kill counts",()=>{
 for(const n of [0,1,100,10000,1000000]){
  const data=calculateDry(n,{});
  for(const item of DRY_ITEMS){
   const stat=data[item.id];
   close(stat.fewer+stat.exact+stat.more,1,1e-7);
   close(stat.expected,n*rateOf(item.id),1e-6);
  }
  close(data.anyUnique.fewer+data.anyUnique.exact+data.anyUnique.more,1,1e-7);
  close(data.anyUnique.expected,n/130,1e-6);
  close(data.anyUnique.atLeastOne,-Math.expm1(n*Math.log1p(-1/130)));
 }
});
test("cerberus route uses local pet sprite, two calculator modes, and optional task toggles",()=>{
 const home=read("index.html"),page=read("cerberus/index.html"),app=read("cerberus/app.mjs");
 assert.match(home,/href="\.\/cerberus\/"/);
 assert.match(home,/src="\.\/assets\/items\/hellpuppy\.png"/);
 assert.match(page,/href="\.\.\/"/);
 assert.match(page,/src="\.\/app\.mjs"/);
 assert.match(page,/id="mode-loot"/);
 assert.match(page,/id="mode-dry"/);
 assert.match(page,/id="konar-task"/);
 assert.match(page,/id="elite-cas"/);
 assert.match(page,/src="\.\.\/assets\/items\/hellpuppy\.png"/);
 assert.match(app,/calculateDry/);
 assert.doesNotMatch(home+page+app,/oldschool\.runescape\.wiki\/images/);
 for(const item of Object.values(ITEMS)){
  const image=readFileSync(new URL("../assets/items/"+item.id+".png",import.meta.url));
  assert.deepEqual([...image.subarray(0,8)],[137,80,78,71,13,10,26,10],item.id+" must have a local PNG");
 }
});

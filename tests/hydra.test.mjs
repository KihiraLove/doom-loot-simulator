import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  PREROLL,RING_IDS,ITEMS,MAX_KILLS,STANDARD,HERBS,SEEDS,RDT,
  preRollRates,validateKills,simulate
} from "../hydra/simulator.mjs";
import {calculateDry,ringCountFromHits,SIGNATURE_CHANCE} from "../hydra/dry-calc.mjs";
const close=(a,b,eps=1e-8)=>assert.ok(Math.abs(a-b)<=eps,"Expected "+b+", got "+a);
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
test("pre-roll is sequential with accurate per-kill rates",()=>{
 const rates=preRollRates();
 assert.deepEqual(PREROLL.map(i=>i[0]),[
  "dragon-thrownaxe","dragon-knife","hydras-claw","hydra-tail","hydra-leather","ring-piece"
 ]);
 const expected={"dragon-thrownaxe":2000,"dragon-knife":2001,"hydras-claw":1001,
  "hydra-tail":513,"hydra-leather":514,"ring-piece":181.1};
 for(const [name,denom] of Object.entries(expected))
  close(1/rates[name],denom,name==="ring-piece"?.06:.6);
 close(SIGNATURE_CHANCE,rates["hydras-claw"]+rates["hydra-tail"]+
  rates["hydra-leather"]+rates["ring-piece"]);
 close(Object.values(rates).reduce((a,b)=>a+b,0),1);
});
test("guaranteed bones and two standard rolls, with first roll replaced by a unique",()=>{
 const normal=simulate(1,{rng:()=>.5});
 assert.equal(normal.drops["hydra-bones"],2);
 assert.equal(normal.drops["astral-rune"],450);
 assert.equal(normal.ringPieces,0);
 const rare=simulate(1,{rng:()=>0});
 assert.equal(rare.drops["hydra-bones"],2);
 assert.equal(rare.drops["dragon-thrownaxe"],500);
 assert.equal(rare.drops["mystic-fire-staff"],1);
 assert.equal(rare.drops["hydras-claw"],undefined);
 assert.equal(rare.drops["ikkle-hydra"],1);
 assert.equal(rare.drops["jar-of-chemicals"],1);
});
test("ring pieces repeat in fixed order (eye then fang then heart)",()=>{
 let seed=1234567;
 const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 const result=simulate(25000,{rng});
 const eye=result.drops["hydras-eye"]||0;
 const fang=result.drops["hydras-fang"]||0;
 const heart=result.drops["hydras-heart"]||0;
 assert.ok(result.ringPieces>0);
 assert.equal(result.ringPieces,eye+fang+heart);
 assert.ok(eye>=fang&&fang>=heart);
 assert.ok(eye-fang<=1&&fang-heart<=1);
 for(let r=0;r<15;r++){
  close(ringCountFromHits(r,"hydras-eye"),Math.floor((r+2)/3));
  close(ringCountFromHits(r,"hydras-fang"),Math.floor((r+1)/3));
  close(ringCountFromHits(r,"hydras-heart"),Math.floor(r/3));
 }
});
test("ring-piece dry results use ordered counts rather than three independent trials",()=>{
 const one=calculateDry(1);
 close(one["hydras-eye"].exact,1-preRollRates()["ring-piece"]);
 close(one["hydras-fang"].exact,1);
 close(one["hydras-heart"].exact,1);
 assert.throws(()=>calculateDry(1,{"hydras-fang":1}));
 assert.throws(()=>calculateDry(2,{"hydras-heart":1}));
 const triple=calculateDry(3,{"hydras-eye":1,"hydras-fang":1,"hydras-heart":1});
 assert.ok(triple["hydras-heart"].exact>0);
 close(triple.anyUnique.count,3);
});
test("dry probability distributions stay normalized across maximum supported kills",()=>{
 for(const n of [0,1,100,3000,1000000]){
  const out=calculateDry(n);
  for(const id of ["hydras-claw","hydra-tail","hydra-leather",...RING_IDS,
   "alchemical-hydra-heads","jar-of-chemicals","ikkle-hydra","anyUnique"]){
    const row=out[id];
    close(row.fewer+row.exact+row.more,1,1e-7);
    assert.ok(Number.isFinite(row.expected));
  }
  close(out.anyUnique.expected,n*SIGNATURE_CHANCE,1e-6);
  close(out.anyUnique.atLeastOne,1-(1-SIGNATURE_CHANCE)**n,1e-9);
 }
 for(const n of [-1,NaN,1.5,Infinity,1000001]){
  assert.throws(()=>validateKills(n));
  assert.throws(()=>calculateDry(n));
  assert.throws(()=>simulate(n));
 }
 assert.equal(validateKills(MAX_KILLS),MAX_KILLS);
 assert.throws(()=>simulate(1,{rng:()=>1}));
});
test("standard categories and additional tables remain populated",()=>{
 assert.ok(STANDARD.length>20);
 assert.equal(HERBS.length,8);
 assert.equal(SEEDS.length,16);
 assert.ok(RDT.length>20);
 const weight=STANDARD.reduce((sum,row)=>sum+row[4],0);
 assert.equal(weight,120); // Source list exceeds 101, hence relative normalization.
});
test("Hydra has accessible homepage selector, both modes and local PNG for every reward",()=>{
 const home=read("index.html"),page=read("hydra/index.html"),app=read("hydra/app.mjs");
 assert.match(home,/href="\.\/hydra\/"/);
 assert.match(page,/href="\.\.\/"/);
 assert.match(page,/src="\.\/app\.mjs"/);
 assert.match(page,/id="mode-loot"/);assert.match(page,/id="mode-dry"/);
 assert.match(page,/id="hard-ca"/);assert.match(page,/id="elite-ca"/);
 assert.match(page,/src="\.\.\/assets\/items\/ikkle-hydra\.png"/);
 assert.match(app,/calculateDry/);
 assert.doesNotMatch(home+page+app,/oldschool\.runescape\.wiki\/images/);
 for(const item of Object.values(ITEMS)){
  const img=readFileSync(new URL("../assets/items/"+item.id+".png",import.meta.url));
  assert.deepEqual([...img.subarray(0,8)],[137,80,78,71,13,10,26,10],item.id);
 }
});

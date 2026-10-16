import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ARMOUR, ORBS, SIGNATURE, DRY_ITEMS, COMMON, ITEMS, ARMOUR_CHANCE, ORB_CHANCE,
  simulate, rateOf, validateKills
} from "../phosani/simulator.mjs";
import { binomial, anySignatureOdds, calculateDry } from "../phosani/dry-calc.mjs";
const close=(actual,expected,tolerance=1e-9)=>
  assert.ok(Math.abs(actual-expected)<tolerance,"Expected "+expected+", got "+actual);
test("Phosani rates agree with current wiki and unique probabilities are normalized",()=>{
  close(ARMOUR_CHANCE,1/140);
  close(ORB_CHANCE,3/1600);
  close(ARMOUR.reduce((s,x)=>s+x.weight,0),1);
  assert.equal(ARMOUR.length,5);
  assert.equal(ORBS.length,3);
  close(rateOf("nightmare-staff"),69/35000);
  close(rateOf("inquisitors-mace"),31/35000);
  for(const item of ARMOUR.slice(1,4))close(rateOf(item.id),1/700);
  for(const item of ORBS)close(rateOf(item.id),1/1600);
  close(rateOf("little-nightmare"),1/1400);
  close(rateOf("parasitic-egg"),1/200);
  close(rateOf("jar-of-dreams"),1/4000);
  assert.equal(COMMON.length,25);
  assert.equal(COMMON.reduce((sum,row)=>sum+row[4],0),101);
  assert.equal(DRY_ITEMS.length,11);
});
test("independent signature tables can both drop on the same kill",()=>{
  const result=simulate(1,{rng:()=>0});
  assert.equal(result.drops["nightmare-staff"],1);
  assert.equal(result.drops["eldritch-orb"],1);
  assert.equal(result.drops["cosmic-rune"],247);
  assert.equal(result.drops["big-bones"],1);
  assert.equal(result.drops["little-nightmare"],1);
  assert.equal(result.drops["parasitic-egg"],1);
  assert.equal(result.drops["jar-of-dreams"],1);
});
test("Slepey tablet is guaranteed by 25 kills if no earlier tablet drops",()=>{
  assert.equal(simulate(24,{rng:()=>.5}).drops["slepey-tablet"],undefined);
  assert.equal(simulate(25,{rng:()=>.5}).drops["slepey-tablet"],1);
});
test("elite combat achievements increase only the elite clue chance",()=>{
  const base=simulate(1,{rng:()=>.029,eliteCAs:false});
  const elite=simulate(1,{rng:()=>.029,eliteCAs:true});
  assert.equal(base.drops["clue-scroll-elite"],undefined);
  assert.equal(elite.drops["clue-scroll-elite"],1);
});
test("zero kills and invalid kill counts are handled",()=>{
  assert.deepEqual({...simulate(0).drops},{});
  assert.equal(validateKills(1000000),1000000);
  for(const invalid of [-1,1.5,Infinity,NaN,1000001]){
    assert.throws(()=>simulate(invalid));
    assert.throws(()=>calculateDry(invalid));
  }
  assert.throws(()=>simulate(1,{rng:()=>1}));
});
test("dry probabilities sum to 100% for all drops and 1 million kills",()=>{
  for(const n of [0,1,100,10000,1000000]){
    const result=calculateDry(n,{});
    for(const item of DRY_ITEMS){
      const row=result[item.id];
      close(row.fewer+row.exact+row.more,1);
      close(row.expected,n*rateOf(item.id),1e-7);
    }
    close(result.anyUnique.fewer+result.anyUnique.exact+result.anyUnique.more,1);
    close(result.anyUnique.expected,n*(ARMOUR_CHANCE+ORB_CHANCE));
  }
});
test("any unique models two drops in a single kill",()=>{
  const row=anySignatureOdds(1,2);
  close(row.exact,ARMOUR_CHANCE*ORB_CHANCE);
  close(row.atLeastOne,1-(1-ARMOUR_CHANCE)*(1-ORB_CHANCE));
  close(row.fewer+row.exact+row.more,1);
  close(anySignatureOdds(0,0).exact,1);
  assert.throws(()=>anySignatureOdds(1,3));
  const count=calculateDry(1,{"nightmare-staff":1,"eldritch-orb":1});
  assert.equal(count.anyUnique.count,2);
  close(count.anyUnique.exact,row.exact);
});
test("binomial distribution is normalized even at high n",()=>{
  for(const [n,p] of [[0,.01],[1,.5],[1000,1/1400],[1000000,1/140]]){
    const d=binomial(n,p);
    close(d.values.reduce((sum,value)=>sum+value,0),1);
    close(d.expected,n*p);
  }
});
test("new simulator has its own route and both calculators",()=>{
  const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
  const home=read("index.html"),page=read("phosani/index.html"),app=read("phosani/app.mjs");
  assert.match(home,/href="\.\/doom\/"/);
  assert.match(home,/href="\.\/phosani\/"/);
  assert.match(page,/href="\.\.\/"/);
  assert.match(page,/id="mode-loot"/);
  assert.match(page,/id="mode-dry"/);
  assert.match(page,/src="\.\/app\.mjs"/);
  assert.match(app,/calculateDry/);
  assert.ok(SIGNATURE.length===8);
});

test("all Phosani rewards have local valid PNG sprites",()=>{
  for (const item of ITEMS) {
    const image = readFileSync(new URL("../assets/items/" + item.id + ".png",import.meta.url));
    assert.deepEqual([...image.subarray(0,8)],[137,80,78,71,13,10,26,10],item.id + " is not PNG");
  }
});
test("Phosani navigation and item graphics use the Little nightmare pet icon",()=>{
  const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
  const home=read("index.html"),page=read("phosani/index.html"),app=read("phosani/app.mjs");
  assert.match(home,/href="\.\/phosani\/"[\s\S]*?src="\.\/assets\/items\/little-nightmare\.png"/);
  assert.match(page,/rel="icon" type="image\/png" href="\.\.\/assets\/items\/little-nightmare\.png"/);
  assert.match(page,/class="brand-mark"[\s\S]*?src="\.\.\/assets\/items\/little-nightmare\.png"/);
  assert.match(app,/img\.src = "\.\.\/assets\/items\/" \+ item\.id \+ "\.png"/);
  assert.doesNotMatch(home+page+app,/phosani\.svg|https:\/\/oldschool\.runescape\.wiki\/images/);
});

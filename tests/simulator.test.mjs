import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  ITEMS, SPECIAL_ITEMS, CLUE, TABLE_SIZE, MAX_FLOOR_ROLLS,
  quantityMultiplier, guaranteedTears, gearDenominator, domDenominator,
  rollCommon, rollQuantity, rollGear, rollDom, validatePlan, simulate
} from "../simulator.mjs";

test("common table has exactly 312 tickets and matches expected individual weights", () => {
  assert.equal(ITEMS.reduce((n, item) => n + item.weight, 0), TABLE_SIZE);
  const counts = Object.fromEntries(ITEMS.map(item => [item.id, 0]));
  for (let i = 0; i < TABLE_SIZE; i++) counts[rollCommon(() => (i + 0.5) / TABLE_SIZE).id]++;
  for (const item of ITEMS) assert.equal(counts[item.id], item.weight, item.id);
});

test("each item has a bundled inventory sprite", () => {
  for (const item of [...ITEMS, ...SPECIAL_ITEMS, CLUE]) {
    assert.ok(existsSync(new URL("../assets/items/" + item.id + ".png", import.meta.url)), item.id);
  }
});

test("depth multipliers and truncating arithmetic match wiki example", () => {
  assert.equal(quantityMultiplier(1), -0.5);
  assert.equal(quantityMultiplier(2), -0.35);
  assert.equal(quantityMultiplier(3), 0);
  assert.equal(quantityMultiplier(8), 0.17);
  assert.equal(quantityMultiplier(50), 0.2);
  const legs = ITEMS.find(item => item.id === "dragon-platelegs");
  assert.equal(rollQuantity(legs, 2, () => 0), 2);
  assert.equal(rollQuantity(legs, 2, () => 0.5), 2);
  assert.equal(rollQuantity(legs, 2, () => 0.999), 3);
  assert.equal(rollQuantity(legs, 1, () => 0.999), 2);
  assert.equal(rollQuantity(legs, 9, () => 0.999), 4);
  const lure = ITEMS.find(item => item.id === "shark-lure");
  assert.equal(rollQuantity(lure, 3, () => 0), 40);
  assert.equal(rollQuantity(lure, 3, () => 0.999), 70);
});

test("guaranteed tears begin at three and accumulate through deep delves", () => {
  assert.equal([1, 2, 3, 4, 5, 6, 7, 8, 9].map(guaranteedTears).reduce((a,b)=>a+b,0), 550);
  assert.equal(Array.from({length: 16}, (_, i) => guaranteedTears(i + 1)).reduce((a,b)=>a+b,0), 1250);
});

test("shared gear roll unlocks one new item at each threshold and caps at 9", () => {
  assert.equal(rollGear(1, () => 0), null);
  assert.equal(rollGear(2, () => 0), "mokhaiotl-cloth");
  assert.equal(rollGear(2, () => .5), null);
  assert.equal(rollGear(3, () => 1.1 / 2000), "eye-of-ayak");
  assert.equal(rollGear(3, () => 2.1 / 2000), null);
  assert.equal(rollGear(4, () => 2.1 / 1350), "avernic-treads");
  assert.equal(gearDenominator(8), 630);
  assert.equal(gearDenominator(9), 540);
  assert.equal(gearDenominator(50), 540);
});

test("pet is unlocked from 6, independent from gear, and stops improving at 9", () => {
  assert.equal(rollDom(5, () => 0), false);
  assert.equal(rollDom(6, () => 0), true);
  assert.equal(rollDom(6, () => .002), false);
  assert.equal(domDenominator(6), 1000);
  assert.equal(domDenominator(7), 750);
  assert.equal(domDenominator(8), 500);
  assert.equal(domDenominator(9), 250);
  assert.equal(domDenominator(50), 250);
});

test("one level-3 delve gets one regular roll and its own 50 guaranteed tears", () => {
  const result = simulate([{ depth: 3, count: 1 }], () => .9999);
  assert.equal(result.runs, 1);
  assert.equal(result.floors, 1);
  assert.equal(result.drops["dragon-platelegs"], 4);
  assert.equal(result.drops["demon-tear"], 50);
  assert.equal(result.uniqueCount, 0);
  assert.equal(result.drops[CLUE.id] ?? 0, 0);
});

test("mixed delve levels are independent rolls, then their loot is aggregated", () => {
  const result = simulate([{ depth: 2, count: 2 }, { depth: 3, count: 1 }], () => .9999);
  assert.equal(result.runs, 3);
  assert.equal(result.floors, 3);
  assert.equal(result.drops["demon-tear"], 50);
  assert.equal(result.drops["dragon-platelegs"], 10); // 2*3 at level 2 + 4 at level 3
});

test("simulation rejects invalid or expensive plans", () => {
  assert.throws(() => validatePlan([]), /at least one/);
  assert.throws(() => validatePlan([{depth: 10, count: 1}]), /Delve depth/);
  assert.doesNotThrow(() => validatePlan([{depth: 9, count: 1}]));
  assert.throws(() => validatePlan([{depth: 3, count: -1}]), /non-negative/);
  assert.throws(() => validatePlan([{depth: 1.5, count: 1}]), /Delve depth/);
  assert.throws(() => validatePlan([{depth: 9, count: Math.floor(MAX_FLOOR_ROLLS / 9) + 1}]), /Limit/);
});

test("9+ counts one level-9-or-deeper roll each, with capped rates", () => {
  const result = simulate([{depth: 9, count: 1}], () => .9999);
  assert.equal(result.floors, 1);
  assert.equal(result.runs, 1);
  assert.equal(result.drops["demon-tear"], 100);
  assert.equal(result.drops["dragon-platelegs"], 4);
  assert.equal(gearDenominator(9), gearDenominator(16));
  assert.equal(domDenominator(9), domDenominator(16));
  assert.equal(quantityMultiplier(9), quantityMultiplier(16));
});

test("one completed delve at each level 1 through 9 yields nine rolls and 550 guaranteed tears", () => {
  const plan = Array.from({length: 9}, (_, i) => ({depth: i + 1, count: 1}));
  const result = simulate(plan, () => .9999);
  assert.equal(result.runs, 9);
  assert.equal(result.floors, 9);
  assert.equal(result.drops["demon-tear"], 550);
});

test("user-supplied per-delve multipliers, guaranteed tears, and unique rates are exact", () => {
  const multipliers = [-.5, -.35, 0, .05, .1, .12, .14, .17, .2];
  const tears = [0, 0, 50, 60, 70, 80, 90, 100, 100];
  const gear = [null, 2500, 2000, 1350, 810, 765, 720, 630, 540];
  const pets = [null, null, null, null, null, 1000, 750, 500, 250];
  const scaledHundreds = [50, 65, 100, 105, 110, 112, 114, 117, 120];
  for (let depth = 1; depth <= 9; depth++) {
    const i = depth - 1;
    assert.equal(quantityMultiplier(depth), multipliers[i], "multiplier at " + depth);
    assert.equal(guaranteedTears(depth), tears[i], "tears at " + depth);
    assert.equal(gearDenominator(depth), gear[i], "gear rate at " + depth);
    assert.equal(domDenominator(depth), pets[i], "pet rate at " + depth);
    assert.equal(rollQuantity({min:100,max:100}, depth, () => 0), scaledHundreds[i]);
  }
});

test("guaranteed tears and unique drops never receive the quantity multiplier", () => {
  for (const depth of [2, 3, 4, 5, 6, 7, 8, 9]) {
    const result = simulate([{depth, count:1}], () => 0);
    const commonTears = rollQuantity({min:100,max:100}, depth, () => 0);
    assert.equal(result.drops["demon-tear"], commonTears + guaranteedTears(depth));
    assert.equal(result.drops["mokhaiotl-cloth"], 1);
    assert.equal(result.drops.dom ?? 0, depth >= 6 ? 1 : 0);
  }
});

test("equipment roll is exclusive but Dom may drop on the same delve", () => {
  const seq = [.9999, .5, .9999, 2.5 / 765, 0];
  let pos = 0;
  const result = simulate([{depth: 6,count:1}], () => seq[pos++]);
  assert.equal(result.floors, 1);
  assert.equal(result.drops["avernic-treads"], 1);
  assert.equal(result.drops.dom, 1);
  assert.equal(result.drops["mokhaiotl-cloth"] ?? 0, 0);
  assert.equal(result.drops["eye-of-ayak"] ?? 0, 0);
  assert.equal(result.uniqueCount, 2);
});

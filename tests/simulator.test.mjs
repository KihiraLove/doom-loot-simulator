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

test("a three-floor run rolls the normal loot table three times and adds level-3 tears", () => {
  const result = simulate([{ depth: 3, count: 1 }], () => .9999);
  assert.equal(result.runs, 1);
  assert.equal(result.floors, 3);
  assert.equal(result.drops["dragon-platelegs"], 9); // 2 + 3 + 4
  assert.equal(result.drops["demon-tear"], 50);
  assert.equal(result.uniqueCount, 0);
  assert.equal(result.drops[CLUE.id] ?? 0, 0);
});

test("different claimed end depths each include all earlier floors", () => {
  const result = simulate([{ depth: 2, count: 2 }, { depth: 3, count: 1 }], () => .9999);
  assert.equal(result.runs, 3);
  assert.equal(result.floors, 7);
  assert.equal(result.drops["demon-tear"], 50);
});

test("simulation rejects invalid or expensive plans", () => {
  assert.throws(() => validatePlan([]), /at least one/);
  assert.throws(() => validatePlan([{depth: 10, count: 1}]), /Delve depth/);
  assert.doesNotThrow(() => validatePlan([{depth: 9, count: 1}]));
  assert.throws(() => validatePlan([{depth: 3, count: -1}]), /non-negative/);
  assert.throws(() => validatePlan([{depth: 1.5, count: 1}]), /Delve depth/);
  assert.throws(() => validatePlan([{depth: 9, count: Math.floor(MAX_FLOOR_ROLLS / 9) + 1}]), /Limit/);
});

test("9+ input simulates a nine-floor run with capped rates", () => {
  const result = simulate([{depth: 9, count: 1}], () => .9999);
  assert.equal(result.floors, 9);
  assert.equal(result.runs, 1);
  assert.equal(result.drops["demon-tear"], 550);
  assert.equal(gearDenominator(9), gearDenominator(16));
  assert.equal(domDenominator(9), domDenominator(16));
  assert.equal(quantityMultiplier(9), quantityMultiplier(16));
});

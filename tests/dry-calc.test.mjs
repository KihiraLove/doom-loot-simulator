import test from "node:test";
import assert from "node:assert/strict";
import {
  uniqueDropProbability, uniqueRollGroups, chanceForCount, calculateDryResults,
  anyUniqueRollGroups, calculateAnyUniqueResult
} from "../dry-calc.mjs";
import { gearDenominator, domDenominator } from "../simulator.mjs";
import { readFileSync } from "node:fs";

function close(actual, expected, tolerance = 1e-10) {
  assert.ok(Math.abs(actual - expected) < tolerance, `expected ${expected}, got ${actual}`);
}

test("per-floor drop rates match the simulation's minimum-depth gates", () => {
  close(uniqueDropProbability("mokhaiotl-cloth", 2), 1 / 2500);
  assert.equal(uniqueDropProbability("eye-of-ayak", 2), 0);
  close(uniqueDropProbability("eye-of-ayak", 3), 1 / 2000);
  assert.equal(uniqueDropProbability("avernic-treads", 3), 0);
  close(uniqueDropProbability("avernic-treads", 4), 1 / 1350);
  assert.equal(uniqueDropProbability("dom", 5), 0);
  close(uniqueDropProbability("dom", 6), 1 / 1000);
  close(uniqueDropProbability("dom", 9), 1 / domDenominator(9));
  close(uniqueDropProbability("avernic-treads", 9), 1 / gearDenominator(9));
  assert.throws(() => uniqueDropProbability("not-an-item", 5), /Unknown/);
});

test("each counted delve contributes only its own level's eligible unique roll", () => {
  const groups = uniqueRollGroups([{depth:2, count:3}, {depth:5, count:2}], "mokhaiotl-cloth");
  assert.deepEqual(groups.map(group => [group.floor, group.trials]), [[2, 3], [5, 2]]);
  const eye = uniqueRollGroups([{depth:2,count:3}, {depth:5,count:2}], "eye-of-ayak");
  assert.deepEqual(eye.map(group => [group.floor, group.trials]), [[5, 2]]);
  assert.deepEqual(uniqueRollGroups([{depth:5, count:20}], "dom"), []);
});

test("single binomial distribution matches exact textbook values", () => {
  const odds = chanceForCount([{trials:2, probability:0.5}], 1);
  close(odds.fewer, 0.25);
  close(odds.exact, 0.5);
  close(odds.more, 0.25);
  close(odds.expected, 1);
  close(odds.fewer + odds.exact + odds.more, 1);
});

test("mixed per-floor rates use convolution, not average rates", () => {
  const odds = chanceForCount([
    {trials:1,probability:0.5},
    {trials:1,probability:0.25}
  ], 1);
  close(odds.fewer, 0.375);
  close(odds.exact, 0.5);
  close(odds.more, 0.125);
  close(odds.expected, 0.75);
});

test("zero drops follows the Wiki's dry chance binomial model", () => {
  const odds = chanceForCount([{trials:128,probability:1/128}], 0);
  close(odds.exact, (1 - 1/128) ** 128);
  close(odds.fewer, 0);
  close(odds.more, 1 - (1 - 1/128) ** 128);
});

test("no eligible rolls handles zero and positive observed drops correctly", () => {
  assert.deepEqual(chanceForCount([], 0), {fewer:0,exact:1,more:0,expected:0,attempts:0});
  assert.deepEqual(chanceForCount([], 3), {fewer:1,exact:0,more:0,expected:0,attempts:0});
  const result = calculateDryResults([{depth:1,count:50}], {
    "mokhaiotl-cloth":0,"eye-of-ayak":0,"avernic-treads":0,"dom":0
  });
  for (const item of Object.values(result)) {
    assert.equal(item.exact, 1);
    assert.equal(item.expected, 0);
  }
});

test("counts above the number of eligible rolls are impossible", () => {
  const result = calculateDryResults([{depth:2,count:1}], {
    "mokhaiotl-cloth":2,"eye-of-ayak":1,"avernic-treads":1,"dom":1
  });
  for (const item of Object.values(result)) {
    close(item.fewer, 1);
    close(item.exact, 0);
    close(item.more, 0);
  }
});

test("100 delve 9+ entries mean 100 independent rolls at the level-9 rates", () => {
  const input = [{depth:9,count:100}];
  const result = calculateDryResults(input, {
    "mokhaiotl-cloth":1,"eye-of-ayak":1,"avernic-treads":1,"dom":1
  });
  for (const id of ["mokhaiotl-cloth","eye-of-ayak","avernic-treads","dom"]) {
    assert.equal(result[id].attempts, 100, id);
    close(result[id].fewer + result[id].exact + result[id].more, 1);
  }
  close(result["mokhaiotl-cloth"].expected, 100/540);
  close(result.dom.expected, 100/250);
  close(result["mokhaiotl-cloth"].fewer, (1 - 1/540)**100);
  close(result.dom.fewer, (1 - 1/250)**100);
  close(result.anyUnique.atLeastOne, 1 - ((1 - 3/540)*(1 - 1/250))**100);
  close(result.anyUnique.expected, 100 * (3/540 + 1/250));
  assert.equal(result.anyUnique.attempts, 200); // equipment roll + independent pet roll
});

test("large valid plan is numerically stable", () => {
  const result = calculateDryResults([{depth:9,count:100000}], {
    "mokhaiotl-cloth":700,"eye-of-ayak":700,"avernic-treads":500,"dom":850
  });
  for (const item of Object.values(result)) {
    close(item.fewer + item.exact + item.more, 1);
    assert.ok(item.expected > 0);
    assert.ok(Number.isFinite(item.exact));
  }
});

test("invalid observed drop counts and impossible delve plans are rejected", () => {
  const zero = {"mokhaiotl-cloth":0,"eye-of-ayak":0,"avernic-treads":0,"dom":0};
  assert.throws(() => calculateDryResults([],zero), /at least one/);
  assert.throws(() => calculateDryResults([{depth:10,count:1}],zero), /Delve depth/);
  assert.throws(() => calculateDryResults([{depth:9,count:1}],{...zero,dom:-1}), /non-negative/);
  assert.throws(() => calculateDryResults([{depth:9,count:1}],{...zero,dom:0.5}), /non-negative/);
  assert.throws(() => chanceForCount([{trials:1,probability:0.5}],-1), /non-negative/);
});

test("Any unique: a delve-2 run has only a cloth chance", () => {
  const plan = [{depth: 2, count: 1}];
  const counts = {"mokhaiotl-cloth": 0, "eye-of-ayak": 0, "avernic-treads": 0, "dom": 0};
  const groups = anyUniqueRollGroups(plan);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].type, "equipment");
  assert.equal(groups[0].probability, 1 / 2500);
  const result = calculateAnyUniqueResult(plan, counts);
  close(result.atLeastOne, 1 / 2500);
  close(result.exact, 1 - 1 / 2500);
  close(result.more, 1 / 2500);
  close(result.fewer, 0);
  assert.equal(result.count, 0);
});

test("Any unique: at level 4 the three equipment rewards are mutually exclusive", () => {
  const groups = anyUniqueRollGroups([{depth: 4, count: 1}]);
  assert.deepEqual(groups.map(group => [group.floor, group.type, group.probability]), [
    [4, "equipment", 3 / 1350]
  ]);
  const count = {"mokhaiotl-cloth": 1, "eye-of-ayak": 1, "avernic-treads": 0, "dom": 0};
  const result = calculateAnyUniqueResult([{depth: 4, count: 1}], count);
  close(result.expected, 3 / 1350);
  close(result.atLeastOne, 3 / 1350);
  close(result.fewer, 1);
  close(result.exact, 0); // one delve can give at most one equipment unique here
  close(result.more, 0);
  assert.equal(result.count, 2);
});

test("Any unique: pet and gear are separate independent rolls", () => {
  const groups = anyUniqueRollGroups([{depth: 6, count: 1}]);
  assert.ok(groups.some(group => group.floor === 6 && group.type === "equipment" && group.probability === 3 / 765));
  assert.ok(groups.some(group => group.floor === 6 && group.type === "pet" && group.probability === 1 / 1000));
  const result = calculateAnyUniqueResult([{depth: 6, count: 1}], {
    "mokhaiotl-cloth": 1, "eye-of-ayak": 0, "avernic-treads": 0, "dom": 1
  });
  close(result.expected, groups.reduce((sum, group) => sum + group.probability, 0));
  close(result.atLeastOne, 1 - groups.reduce((prod, group) => prod * (1 - group.probability), 1));
  close(result.fewer + result.exact + result.more, 1);

  // If gear and pet both drop on the same floor, two uniques are possible.
  const odds = chanceForCount([
    {trials: 1, probability: .2},
    {trials: 1, probability: .4}
  ], 2);
  close(odds.exact, .08);
  close(odds.fewer, .92);
  close(odds.more, 0);
});

test("Any unique: dry result sums four observed counts and exposes chance of at least one", () => {
  const results = calculateDryResults([{depth: 9, count: 100}], {
    "mokhaiotl-cloth": 1, "eye-of-ayak": 2, "avernic-treads": 3, "dom": 4
  });
  assert.equal(results.anyUnique.count, 10);
  close(results.anyUnique.fewer + results.anyUnique.exact + results.anyUnique.more, 1);
  assert.ok(results.anyUnique.atLeastOne > 0 && results.anyUnique.atLeastOne < 1);
});

test("Any unique: zero eligible rolls and impossible counts remain well-defined", () => {
  const noUnique = calculateAnyUniqueResult([{depth: 1, count: 10}], {
    "mokhaiotl-cloth": 0, "eye-of-ayak": 0, "avernic-treads": 0, "dom": 0
  });
  assert.equal(noUnique.atLeastOne, 0);
  assert.equal(noUnique.exact, 1);
  assert.equal(noUnique.expected, 0);
  const impossible = calculateAnyUniqueResult([{depth: 1, count: 10}], {
    "mokhaiotl-cloth": 1, "eye-of-ayak": 0, "avernic-treads": 0, "dom": 0
  });
  assert.equal(impossible.fewer, 1);
  assert.equal(impossible.exact, 0);
  assert.equal(impossible.more, 0);
});

test("UI has no preset buttons and includes the aggregate unique-drop result", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf-8");
  const app = readFileSync(new URL("../app.mjs", import.meta.url), "utf-8");
  assert.ok(!html.includes("data-preset-depth"));
  assert.ok(!app.includes("data-preset-depth"));
  assert.ok(app.includes("Any unique drop"));
  assert.ok(app.includes("Chance of at least one unique drop"));
});

test("every row of the supplied unique drop table matches the dry calculator", () => {
  const gear = [0, 2500, 2000, 1350, 810, 765, 720, 630, 540];
  const pet = [0, 0, 0, 0, 0, 1000, 750, 500, 250];
  const ids = ["mokhaiotl-cloth", "eye-of-ayak", "avernic-treads", "dom"];
  const unlock = [2, 3, 4, 6];
  for (let level = 1; level <= 9; level++) {
    const result = calculateDryResults([{depth:level,count:1}], Object.fromEntries(ids.map(id=>[id,0])));
    for (let i = 0; i < ids.length; i++) {
      const p = level < unlock[i] ? 0 : 1/(i === 3 ? pet[level - 1] : gear[level - 1]);
      close(result[ids[i]].expected, p);
      close(result[ids[i]].exact, 1 - p);
      close(result[ids[i]].more, p);
      assert.equal(result[ids[i]].attempts, p ? 1 : 0);
    }
    const gearCount = (level >= 2) + (level >= 3) + (level >= 4);
    const pGear = gearCount ? gearCount/gear[level - 1] : 0;
    const pPet = level >= 6 ? 1/pet[level - 1] : 0;
    close(result.anyUnique.expected, pGear + pPet);
    close(result.anyUnique.atLeastOne, 1 - (1 - pGear)*(1 - pPet));
    close(result.anyUnique.exact, (1 - pGear)*(1 - pPet));
  }
});

test("mixed delve counts do not implicitly include preceding floors", () => {
  const plan = [{depth:8,count:3}, {depth:9,count:2}];
  const result = calculateDryResults(plan, {
    "mokhaiotl-cloth":0,"eye-of-ayak":0,"avernic-treads":0,"dom":0
  });
  const pGear8 = 1/630, pGear9 = 1/540;
  close(result["mokhaiotl-cloth"].exact, (1-pGear8)**3*(1-pGear9)**2);
  close(result.dom.exact, (1-1/500)**3*(1-1/250)**2);
  assert.equal(result["mokhaiotl-cloth"].attempts, 5);
  assert.equal(result.anyUnique.attempts, 10);
});

test("multiple entries for a single level accumulate as repeated rolls", () => {
  const plan = [{depth:9,count:2}, {depth:9,count:3}];
  const cloth = uniqueRollGroups(plan, "mokhaiotl-cloth");
  assert.deepEqual(cloth.map(x=>[x.floor,x.trials]), [[9,5]]);
  const gear = anyUniqueRollGroups(plan);
  assert.deepEqual(gear.map(x=>[x.floor,x.trials]), [[9,5], [9,5]]);
});

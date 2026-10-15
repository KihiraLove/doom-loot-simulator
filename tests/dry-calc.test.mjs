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

test("completed runs contribute a roll at each eligible delve", () => {
  const groups = uniqueRollGroups([{depth:2, count:3}, {depth:5, count:2}], "mokhaiotl-cloth");
  assert.deepEqual(groups.map(group => [group.floor, group.trials]), [
    [2, 5], [3, 2], [4, 2], [5, 2]
  ]);
  const dom = uniqueRollGroups([{depth:5, count:20}], "dom");
  assert.deepEqual(dom, []);
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

test("delve 9+ evaluates exactly nine floors, including eligible rolls", () => {
  const input = [{depth:9,count:100}];
  const result = calculateDryResults(input, {
    "mokhaiotl-cloth":1,"eye-of-ayak":1,"avernic-treads":1,"dom":1
  });
  assert.equal(result["mokhaiotl-cloth"].attempts, 800);
  assert.equal(result["eye-of-ayak"].attempts, 700);
  assert.equal(result["avernic-treads"].attempts, 600);
  assert.equal(result.dom.attempts, 400);
  for (const item of Object.values(result)) {
    close(item.fewer + item.exact + item.more, 1);
    assert.ok(item.exact >= 0 && item.exact <= 1);
  }
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

test("Any unique: at each floor, eligible equipment rewards are mutually exclusive", () => {
  const groups = anyUniqueRollGroups([{depth: 4, count: 1}]);
  assert.deepEqual(groups.map(group => [group.floor, group.type, group.probability]), [
    [2, "equipment", 1 / 2500],
    [3, "equipment", 2 / 2000],
    [4, "equipment", 3 / 1350]
  ]);
  const count = {"mokhaiotl-cloth": 1, "eye-of-ayak": 1, "avernic-treads": 0, "dom": 0};
  const result = calculateAnyUniqueResult([{depth: 4, count: 1}], count);
  close(result.expected, 1 / 2500 + 2 / 2000 + 3 / 1350);
  close(result.atLeastOne, 1 - (1 - 1 / 2500) * (1 - 2 / 2000) * (1 - 3 / 1350));
  close(result.fewer + result.exact + result.more, 1);
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

import test from "node:test";
import assert from "node:assert/strict";
import {
  uniqueDropProbability, uniqueRollGroups, chanceForCount, calculateDryResults
} from "../dry-calc.mjs";
import { gearDenominator, domDenominator } from "../simulator.mjs";

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

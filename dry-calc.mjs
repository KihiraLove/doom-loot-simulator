import {
  SPECIAL_ITEMS, MAX_DEPTH, validatePlan, gearDenominator, domDenominator
} from "./simulator.mjs";

// A floor awards at most one equipment unique. Marginally, each eligible
// equipment item has probability 1 / gearDenominator(floor); the Dom pet
// rolls separately. Results below are per-item probabilities, NOT a joint
// probability across multiple different items.
export function uniqueDropProbability(itemId, floor) {
  const item = SPECIAL_ITEMS.find(entry => entry.id === itemId);
  if (!item) throw new RangeError("Unknown unique reward: " + itemId);
  if (!Number.isSafeInteger(floor) || floor < 1 || floor > MAX_DEPTH) {
    throw new RangeError("Invalid delve floor.");
  }
  if (floor < item.minimumDepth) return 0;
  return 1 / (item.id === "dom" ? domDenominator(floor) : gearDenominator(floor));
}

export function uniqueRollGroups(plan, itemId) {
  validatePlan(plan);
  const groups = [];
  for (let floor = 1; floor <= MAX_DEPTH; floor++) {
    const probability = uniqueDropProbability(itemId, floor);
    if (probability === 0) continue;
    const trials = plan.reduce((sum, row) => sum + (row.depth >= floor ? row.count : 0), 0);
    if (trials) groups.push({ floor, trials, probability });
  }
  return groups;
}

// Compute a binomial PMF from its mode to avoid starting with P(0) = (1-p)^n,
// which underflows for large numbers of rolls. Keeping ~18 standard deviations
// on both sides plus 24 extra counts discards only numerically negligible tails
// at Doom's rare-drop probabilities. The support is renormalized after truncation.
function binomialSupport(n, p) {
  if (n === 0 || p === 0) return { start: 0, values: Float64Array.of(1) };
  if (p === 1) return { start: n, values: Float64Array.of(1) };

  const mean = n * p;
  const sigma = Math.sqrt(n * p * (1 - p));
  const first = Math.max(0, Math.floor(mean - 18 * sigma - 24));
  const last = Math.min(n, Math.ceil(mean + 18 * sigma + 24));
  const mode = Math.floor((n + 1) * p);
  const values = new Float64Array(last - first + 1);

  // log P(mode) = n log(1-p) + sum(i=1..mode) log[(n-i+1)p / (i(1-p))].
  // Summing O(n*p) (at most ~4k at the configured run limit) is stable.
  const logp = Math.log(p);
  const log1mp = Math.log1p(-p);
  let logMode = n * log1mp;
  for (let i = 1; i <= mode; i++) {
    logMode += Math.log(n - i + 1) - Math.log(i) + logp - log1mp;
  }
  values[mode - first] = Math.exp(logMode);

  for (let k = mode - 1; k >= first; k--) {
    values[k - first] = values[k + 1 - first] * (k + 1) / (n - k) * ((1 - p) / p);
  }
  for (let k = mode + 1; k <= last; k++) {
    values[k - first] = values[k - 1 - first] * (n - k + 1) / k * (p / (1 - p));
  }

  let total = 0;
  for (const probability of values) total += probability;
  if (!(total > 0)) throw new Error("Could not evaluate the drop probability.");
  for (let i = 0; i < values.length; i++) values[i] /= total;
  return { start: first, values };
}

function convolve(left, right) {
  const values = new Float64Array(left.values.length + right.values.length - 1);
  for (let i = 0; i < left.values.length; i++) {
    const a = left.values[i];
    if (a === 0) continue;
    for (let j = 0; j < right.values.length; j++) {
      values[i + j] += a * right.values[j];
    }
  }
  return { start: left.start + right.start, values };
}

function clampProbability(value) {
  return Math.min(1, Math.max(0, value));
}

export function chanceForCount(groups, obtained) {
  if (!Number.isSafeInteger(obtained) || obtained < 0) {
    throw new RangeError("Drop counts must be non-negative whole numbers.");
  }
  const attempts = groups.reduce((sum, group) => sum + group.trials, 0);
  const expected = groups.reduce((sum, group) => sum + group.trials * group.probability, 0);

  if (attempts === 0) {
    return { fewer: obtained > 0 ? 1 : 0, exact: obtained === 0 ? 1 : 0, more: 0, expected, attempts };
  }
  if (obtained > attempts) {
    return { fewer: 1, exact: 0, more: 0, expected, attempts };
  }

  let distribution = { start: 0, values: Float64Array.of(1) };
  for (const { trials, probability } of groups) {
    distribution = convolve(distribution, binomialSupport(trials, probability));
  }

  // Small floating-point errors must not make the three outcomes fail to sum to 1.
  let fewer = 0;
  let exact = 0;
  let more = 0;
  for (let i = 0; i < distribution.values.length; i++) {
    const count = distribution.start + i;
    const chance = distribution.values[i];
    if (count < obtained) fewer += chance;
    else if (count === obtained) exact += chance;
    else more += chance;
  }
  const total = fewer + exact + more;
  fewer = clampProbability(fewer / total);
  exact = clampProbability(exact / total);
  more = clampProbability(1 - fewer - exact);
  return { fewer, exact, more, expected, attempts };
}

export function calculateDryResults(plan, counts) {
  validatePlan(plan);
  const results = {};
  for (const item of SPECIAL_ITEMS) {
    const count = counts[item.id];
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new RangeError("Enter a non-negative whole number for " + item.name + ".");
    }
    results[item.id] = {
      item,
      count,
      ...chanceForCount(uniqueRollGroups(plan, item.id), count)
    };
  }
  return results;
}

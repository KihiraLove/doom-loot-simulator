// Drop rates transcribed from the OSRS Wiki's Doom of Mokhaiotl drop table.
// No network calls are made by the simulator. All quantities are delve-3 base values.
export const WIKI_URL = "https://oldschool.runescape.wiki/w/Doom_of_Mokhaiotl";

export const ITEMS = [
  { id: "demon-tear", name: "Demon tear", min: 100, max: 300, weight: 21 },
  { id: "mokhaiotl-waystone", name: "Mokhaiotl waystone", min: 1, max: 2, weight: 21 },
  { id: "rune-pickaxe", name: "Rune pickaxe", min: 1, max: 3, weight: 15, noted: true },
  { id: "death-rune", name: "Death rune", min: 50, max: 70, weight: 15 },
  { id: "chaos-rune", name: "Chaos rune", min: 50, max: 70, weight: 15 },
  { id: "earth-rune", name: "Earth rune", min: 500, max: 1000, weight: 15 },
  { id: "fire-rune", name: "Fire rune", min: 500, max: 1000, weight: 15 },
  { id: "steel-cannonball", name: "Steel cannonball", min: 200, max: 600, weight: 15 },
  { id: "onyx-bolts", name: "Onyx bolts", min: 5, max: 15, weight: 15 },
  { id: "coal", name: "Coal", min: 15, max: 50, weight: 15, noted: true },
  { id: "gold-ore", name: "Gold ore", min: 20, max: 60, weight: 15, noted: true },
  { id: "dragon-med-helm", name: "Dragon med helm", min: 1, max: 1, weight: 15, noted: true },
  { id: "mystic-earth-staff", name: "Mystic earth staff", min: 1, max: 1, weight: 15, noted: true },
  { id: "runite-ore", name: "Runite ore", min: 3, max: 6, weight: 15, noted: true },
  { id: "aether-catalyst", name: "Aether catalyst", min: 151, max: 400, weight: 15 },
  { id: "dragon-dart-tip", name: "Dragon dart tip", min: 30, max: 90, weight: 15 },
  { id: "sun-kissed-bones", name: "Sun-kissed bones", min: 18, max: 75, weight: 15 },
  { id: "raw-shark", name: "Raw shark", min: 20, max: 35, weight: 10, noted: true },
  { id: "spirit-seed", name: "Spirit seed", min: 1, max: 1, weight: 9 },
  { id: "celastrus-seed", name: "Celastrus seed", min: 1, max: 1, weight: 9 },
  { id: "ranarr-seed", name: "Ranarr seed", min: 1, max: 3, weight: 6 },
  // The wiki lists shark lures in even-numbered stacks at delve 3.
  { id: "shark-lure", name: "Shark lure", min: 40, max: 70, step: 2, weight: 5 },
  { id: "tooth-half-of-key", name: "Tooth half of key", min: 1, max: 1, weight: 3 },
  { id: "dragon-platelegs", name: "Dragon platelegs", min: 2, max: 4, weight: 3, noted: true }
];

export const SPECIAL_ITEMS = [
  { id: "mokhaiotl-cloth", name: "Mokhaiotl cloth", minimumDepth: 2 },
  { id: "eye-of-ayak", name: "Eye of ayak", minimumDepth: 3 },
  { id: "avernic-treads", name: "Avernic treads", minimumDepth: 4 },
  { id: "dom", name: "Dom", minimumDepth: 6 }
];

export const CLUE = { id: "clue-scroll-elite", name: "Clue scroll (elite)" };
export const ITEM_DETAILS = Object.fromEntries([...ITEMS, ...SPECIAL_ITEMS, CLUE].map(item => [item.id, item]));
export const TABLE_SIZE = 312;
// All deeper delves use the level-9 rate tier. Each input represents a single delve roll.
export const MAX_DEPTH = 9;
export const MAX_FLOOR_ROLLS = 1_000_000;

if (ITEMS.reduce((sum, item) => sum + item.weight, 0) !== TABLE_SIZE) {
  throw new Error("The Doom common loot table weights do not total 312.");
}

export function quantityMultiplier(depth) {
  if (depth === 1) return -0.5;
  if (depth === 2) return -0.35;
  if (depth === 3) return 0;
  if (depth === 4) return 0.05;
  if (depth === 5) return 0.1;
  if (depth === 6) return 0.12;
  if (depth === 7) return 0.14;
  if (depth === 8) return 0.17;
  return 0.2;
}

export function guaranteedTears(depth) {
  if (depth < 3) return 0;
  return depth === 3 ? 50 : depth === 4 ? 60 : depth === 5 ? 70 : depth === 6 ? 80 : depth === 7 ? 90 : 100;
}

export function gearDenominator(depth) {
  if (depth < 2) return null;
  return [null, null, 2500, 2000, 1350, 810, 765, 720, 630][depth] ?? 540;
}

export function domDenominator(depth) {
  if (depth < 6) return null;
  return depth === 6 ? 1000 : depth === 7 ? 750 : depth === 8 ? 500 : 250;
}

export function randomInteger(min, max, rng = Math.random) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function rollCommon(rng = Math.random) {
  let ticket = Math.floor(rng() * TABLE_SIZE);
  for (const item of ITEMS) {
    if (ticket < item.weight) return item;
    ticket -= item.weight;
  }
  // Defensive fallback for custom RNGs that produce exactly 1.
  return ITEMS[ITEMS.length - 1];
}

export function rollQuantity(item, depth, rng = Math.random) {
  const step = item.step ?? 1;
  const base = item.min + step * randomInteger(0, Math.floor((item.max - item.min) / step), rng);
  return base + Math.trunc(base * quantityMultiplier(depth));
}

// One shared piece-of-equipment roll per floor, with one equally weighted
// ticket per unlocked gear item. The pet uses an independent roll.
export function rollGear(depth, rng = Math.random) {
  const denominator = gearDenominator(depth);
  if (!denominator) return null;
  const eligible = SPECIAL_ITEMS.slice(0, depth === 2 ? 1 : depth === 3 ? 2 : 3);
  const ticket = Math.floor(rng() * denominator);
  return ticket < eligible.length ? eligible[ticket].id : null;
}

export function rollDom(depth, rng = Math.random) {
  const denominator = domDenominator(depth);
  return denominator !== null && rng() < 1 / denominator;
}

export function validatePlan(plan) {
  if (!Array.isArray(plan)) throw new TypeError("The plan must be a list of depths and runs.");
  let runs = 0;
  let floors = 0;
  for (const row of plan) {
    if (!Number.isSafeInteger(row.depth) || row.depth < 1 || row.depth > MAX_DEPTH) {
      throw new RangeError("Delve depth must be a whole number from 1 to 9 (9+ category).");
    }
    if (!Number.isSafeInteger(row.count) || row.count < 0) {
      throw new RangeError("Delve counts must be non-negative whole numbers.");
    }
    runs += row.count;
    // Entries count individual completed delves, not full runs ending at that depth.
    floors += row.count;
    if (floors > MAX_FLOOR_ROLLS || !Number.isSafeInteger(floors)) {
      throw new RangeError("Limit your selection to " + MAX_FLOOR_ROLLS.toLocaleString("en") + " total delve rolls per simulation.");
    }
  }
  if (!runs) throw new RangeError("Enter at least one completed delve to simulate.");
  return { runs, floors };
}

export function simulate(plan, rng = Math.random) {
  const { runs, floors } = validatePlan(plan);
  const drops = Object.create(null);
  const add = (id, count) => { drops[id] = (drops[id] ?? 0) + count; };

  for (const { depth, count } of plan) {
    for (let delve = 0; delve < count; delve++) {
      // A counted delve is a single completed floor at the selected tier.
      // A complete run to depth N is entered as one delve at each level 1..N.
      const common = rollCommon(rng);
      add(common.id, rollQuantity(common, depth, rng));

      // Guaranteed tears and unique drops are NOT quantity-multiplied.
      const tears = guaranteedTears(depth);
      if (tears) add("demon-tear", tears);

      if (rng() < 1 / (depth < 3 ? 75 : 50)) add(CLUE.id, 1);

      const gear = rollGear(depth, rng);
      if (gear) add(gear, 1);

      if (rollDom(depth, rng)) add("dom", 1);
    }
  }

  return {
    runs,
    floors,
    drops,
    uniqueCount: SPECIAL_ITEMS.reduce((sum, item) => sum + (drops[item.id] ?? 0), 0),
    gearCount: SPECIAL_ITEMS.slice(0, 3).reduce((sum, item) => sum + (drops[item.id] ?? 0), 0),
    distinctItems: Object.keys(drops).length
  };
}

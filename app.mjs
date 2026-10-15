import {
  ITEMS, SPECIAL_ITEMS, ITEM_DETAILS, MAX_DEPTH, MAX_FLOOR_ROLLS,
  gearDenominator, domDenominator, simulate, validatePlan
} from "./simulator.mjs";

const inputs = document.getElementById("depth-inputs");
const form = document.getElementById("simulator-form");
const addDepth = document.getElementById("add-depth");
const clearButton = document.getElementById("clear-button");
const validationMessage = document.getElementById("validation-message");
const plannedRuns = document.getElementById("planned-runs");
const exportButton = document.getElementById("export-button");
const emptyState = document.getElementById("empty-state");
const resultsContent = document.getElementById("results-content");
const uniqueGrid = document.getElementById("unique-grid");
const lootGrid = document.getElementById("loot-grid");
const formatter = new Intl.NumberFormat("en-US");
let lastResult = null;
let lastPlan = [];

function number(value) {
  return formatter.format(value);
}

function makeDepthField(depth) {
  const label = document.createElement("label");
  label.className = "depth-field";

  const caption = document.createElement("span");
  caption.textContent = "Delve " + depth;

  const input = document.createElement("input");
  input.type = "number";
  input.min = "0";
  input.step = "1";
  input.value = "0";
  input.dataset.depth = String(depth);
  input.setAttribute("aria-label", "Runs ending at delve " + depth);
  input.setAttribute("inputmode", "numeric");

  label.append(caption, input);
  inputs.append(label);
}

function refreshAddDepth() {
  const next = inputs.querySelectorAll("input").length + 1;
  addDepth.disabled = next > MAX_DEPTH;
  addDepth.textContent = next > MAX_DEPTH ? "Maximum delve reached" : "+ Add delve " + next;
}

function readPlan() {
  return [...inputs.querySelectorAll("input")].map(input => {
    const raw = input.value.trim();
    if (!/^(0|[1-9]\d*)$/.test(raw)) {
      throw new RangeError("Enter a non-negative whole number for delve " + input.dataset.depth + ".");
    }
    const count = Number(raw);
    if (!Number.isSafeInteger(count)) {
      throw new RangeError("Run count for delve " + input.dataset.depth + " is too large.");
    }
    return { depth: Number(input.dataset.depth), count };
  }).filter(row => row.count > 0);
}

function showError(message) {
  validationMessage.textContent = message;
  validationMessage.hidden = !message;
}

function updatePlanSummary() {
  try {
    const plan = readPlan();
    const runs = plan.reduce((sum, row) => sum + row.count, 0);
    const floors = plan.reduce((sum, row) => sum + row.depth * row.count, 0);
    plannedRuns.textContent = number(runs) + " runs · " + number(floors) + " floor rolls";
    plannedRuns.style.color = floors > MAX_FLOOR_ROLLS ? "var(--danger)" : "";
  } catch {
    plannedRuns.textContent = "Check your run counts";
    plannedRuns.style.color = "var(--danger)";
  }
}

function makeSprite(id, description) {
  const image = document.createElement("img");
  image.src = "./assets/items/" + id + ".png";
  image.alt = description || "";
  image.loading = "lazy";
  image.width = 36;
  image.height = 32;
  return image;
}

function renderUniqueCards(result) {
  uniqueGrid.replaceChildren();
  for (const item of SPECIAL_ITEMS) {
    const count = result.drops[item.id] ?? 0;
    const card = document.createElement("div");
    card.className = "unique-card" + (count ? " found" : "");

    const name = document.createElement("strong");
    name.textContent = item.name;
    const amount = document.createElement("span");
    amount.className = "count";
    amount.textContent = "× " + number(count);

    const detail = document.createElement("span");
    detail.className = "rarity";
    detail.textContent = item.id === "dom"
      ? "From 6 · up to 1/" + number(domDenominator(9))
      : "From " + item.minimumDepth + " · up to 1/" + number(gearDenominator(9));

    card.append(makeSprite(item.id, ""), name, amount, detail);
    uniqueGrid.append(card);
  }
}

function renderLoot(result) {
  lootGrid.replaceChildren();
  const specialIds = new Set(SPECIAL_ITEMS.map(item => item.id));
  const entries = Object.entries(result.drops)
    .filter(([id, count]) => count > 0 && !specialIds.has(id))
    .sort((a, b) => b[1] - a[1] || (ITEM_DETAILS[a[0]]?.name || "").localeCompare(ITEM_DETAILS[b[0]]?.name || ""));

  document.getElementById("item-count").textContent = number(entries.length) + " item types";
  for (const [id, count] of entries) {
    const item = ITEM_DETAILS[id];
    const entry = document.createElement("div");
    entry.className = "loot-item";
    entry.title = item.name + (item.noted ? " (noted)" : "");

    const icon = document.createElement("div");
    icon.className = "loot-icon";
    icon.append(makeSprite(id, ""));

    const info = document.createElement("div");
    info.className = "loot-info";
    const amount = document.createElement("strong");
    amount.textContent = "× " + number(count);
    const name = document.createElement("span");
    name.textContent = item.name + (item.noted ? " (noted)" : "");
    info.append(amount, name);
    entry.append(icon, info);
    lootGrid.append(entry);
  }
}

function renderResult(result) {
  document.getElementById("stat-runs").textContent = number(result.runs);
  document.getElementById("stat-floors").textContent = number(result.floors);
  document.getElementById("stat-uniques").textContent = number(result.uniqueCount);
  document.getElementById("stat-tears").textContent = number(result.drops["demon-tear"] ?? 0);
  renderUniqueCards(result);
  renderLoot(result);
  emptyState.hidden = true;
  resultsContent.hidden = false;
  exportButton.disabled = false;
}

function clearResults() {
  lastResult = null;
  lastPlan = [];
  emptyState.hidden = false;
  resultsContent.hidden = true;
  exportButton.disabled = true;
  for (const id of ["stat-runs", "stat-floors", "stat-uniques", "stat-tears"]) {
    document.getElementById(id).textContent = "—";
  }
}

for (let depth = 1; depth <= 16; depth++) makeDepthField(depth);
refreshAddDepth();
updatePlanSummary();

addDepth.addEventListener("click", () => {
  const next = inputs.querySelectorAll("input").length + 1;
  if (next <= MAX_DEPTH) makeDepthField(next);
  refreshAddDepth();
  updatePlanSummary();
});

inputs.addEventListener("input", () => {
  showError("");
  updatePlanSummary();
});

document.querySelectorAll("[data-preset-depth]").forEach(button => {
  button.addEventListener("click", () => {
    const depth = Number(button.dataset.presetDepth);
    inputs.querySelectorAll("input").forEach(input => { input.value = input.dataset.depth === String(depth) ? button.dataset.presetCount : "0"; });
    showError("");
    updatePlanSummary();
  });
});

clearButton.addEventListener("click", () => {
  inputs.replaceChildren();
  for (let depth = 1; depth <= 16; depth++) makeDepthField(depth);
  refreshAddDepth();
  updatePlanSummary();
  showError("");
  clearResults();
});

form.addEventListener("submit", event => {
  event.preventDefault();
  showError("");
  try {
    const plan = readPlan();
    validatePlan(plan);
    const result = simulate(plan);
    lastResult = result;
    lastPlan = plan;
    renderResult(result);
  } catch (error) {
    showError(error instanceof Error ? error.message : "The simulation could not be completed.");
  }
});

function csvCell(text) {
  const value = String(text);
  return '"' + value.replaceAll('"', '""') + '"';
}

exportButton.addEventListener("click", () => {
  if (!lastResult) return;
  const lines = [
    ["Doom of Mokhaiotl simulation"],
    ["Completed runs", lastResult.runs],
    ["Total floor rolls", lastResult.floors],
    [],
    ["Final delve", "Claimed runs"],
    ...lastPlan.map(row => [row.depth, row.count]),
    [],
    ["Item", "Quantity", "Noted"]
  ];
  for (const [id, count] of Object.entries(lastResult.drops).sort((a,b) => (ITEM_DETAILS[a[0]]?.name || "").localeCompare(ITEM_DETAILS[b[0]]?.name || ""))) {
    const item = ITEM_DETAILS[id];
    lines.push([item.name, count, item.noted ? "Yes" : "No"]);
  }
  const csv = lines.map(line => line.map(csvCell).join(",")).join("\r\n") + "\r\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "doom-loot-simulation.csv";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

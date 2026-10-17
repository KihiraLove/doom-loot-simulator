import {
  SIGNATURE, DRY_ITEMS, ITEMS as ITEM_BY_ID, MAX_KILLS, simulate
} from "./simulator.mjs";
import { calculateDry } from "./dry-calc.mjs";

const $ = id => document.getElementById(id);
const format = n => new Intl.NumberFormat("en-US").format(n);
const form = $("simulator-form");
const dryInputs = $("dry-inputs");
let mode = "loot";

function icon(item) {
  const wrapper = document.createElement("span");
  wrapper.className = "phosani-icon";
  const img = document.createElement("img");
  img.src = "../assets/items/" + item.id + ".png";
  img.alt = "";
  img.loading = "lazy";
  img.width = 36; img.height = 32;
  wrapper.append(img);
  return wrapper;
}
function parseNumber(input, limit, label) {
  const raw = input.value.trim();
  if (!/^(0|[1-9]\d*)$/.test(raw) ||
      !Number.isSafeInteger(Number(raw)) || Number(raw)>limit) {
    throw new RangeError("Enter a non-negative whole number up to " + format(limit) + " for " + label + ".");
  }
  return Number(raw);
}
function showError(message) {
  $("validation-message").textContent=message;
  $("validation-message").hidden=!message;
}
function resetPanels() {
  $("empty-state").hidden=false;
  $("results-content").hidden=true;
  $("dry-empty").hidden=false;
  $("dry-results").hidden=true;
}
function setMode(next) {
  mode=next;
  const isDry=mode==="dry";
  $("dry-fields").hidden=!isDry;
  $("dry-panel").hidden=!isDry;
  $("loot-panel").hidden=isDry;
  $("medium-cas").closest("label").hidden=isDry;
  $("sunstone-eligible").closest("label").hidden=isDry;
  for(const [name,selected] of [["loot",!isDry],["dry",isDry]]){
    $("mode-"+name).classList.toggle("is-active",selected);
    $("mode-"+name).setAttribute("aria-pressed",String(selected));
  }
  $("action-label").textContent=isDry?"Calculate chances":"Simulate loot";
  showError("");
}
function dryField(item) {
  const label=document.createElement("label");
  label.className="dry-field";
  const name=document.createElement("span");
  name.textContent=item.name;
  const input=document.createElement("input");
  input.type="number";input.min="0";input.step="1";input.value="0";
  input.inputMode="numeric";input.dataset.id=item.id;
  input.setAttribute("aria-label",item.name+" received");
  label.append(icon(item),name,input);
  dryInputs.append(label);
}
for(const item of DRY_ITEMS)dryField(item);

function uniqueCard(item,count) {
  const card=document.createElement("div");
  card.className="unique-card"+(count?" found":"");
  const name=document.createElement("strong");
  name.textContent=item.name;
  const amount=document.createElement("span");
  amount.className="count";amount.textContent="× "+format(count);
  const rarity=document.createElement("span");
  rarity.className="rarity";rarity.textContent=item.rate ? "1/"+format(Math.round(1/item.rate)) : "";
  card.append(icon(item),name,amount,rarity);
  return card;
}
function lootCard(item,count) {
  const card=document.createElement("div");
  card.className="loot-item";
  const frame=document.createElement("div");
  frame.className="loot-icon";frame.append(icon(item));
  const detail=document.createElement("div");
  detail.className="loot-info";
  const amount=document.createElement("strong");amount.textContent="× "+format(count);
  const title=document.createElement("span");title.textContent=item.name;
  detail.append(amount,title);card.append(frame,detail);
  return card;
}
function renderLoot(result) {
  const unique=$("unique-grid"),loot=$("loot-grid");
  unique.replaceChildren();loot.replaceChildren();
  for(const item of DRY_ITEMS) unique.append(uniqueCard(item,result.drops[item.id]||0));
  const uniqueIds=new Set(DRY_ITEMS.map(item=>item.id));
  const entries=Object.entries(result.drops)
    .filter(([id,count])=>count>0&&!uniqueIds.has(id))
    .sort((a,b)=>b[1]-a[1]||ITEM_BY_ID[a[0]].name.localeCompare(ITEM_BY_ID[b[0]].name));
  for(const [id,count] of entries)loot.append(lootCard(ITEM_BY_ID[id],count));
  $("empty-state").hidden=true;$("results-content").hidden=false;
}
function probabilityText(p) {
  if(p<=0)return "0%";
  if(p>=1)return "100%";
  const value=p*100;
  if(value<.000001)return "<0.000001%";
  if(value>99.999999)return ">99.999999%";
  return value.toFixed(value<1?4:2)+"%";
}
function outcome(label,p) {
  const item=document.createElement("div");item.className="dry-outcome";
  const text=document.createElement("span");text.textContent=label;
  const value=document.createElement("strong");value.textContent=probabilityText(p);
  item.append(text,value);return item;
}
function dryCard(name,item,result,combined=false) {
  const card=document.createElement("section");
  card.className="dry-result-card"+(combined?" dry-total-card":"");
  const head=document.createElement("div");head.className="dry-result-heading";
  const title=document.createElement("div");
  const h3=document.createElement("h3");h3.textContent=name;
  const expected=document.createElement("p");
  expected.textContent="Expected: "+result.expected.toLocaleString("en-US",{maximumFractionDigits:2});
  title.append(h3,expected);head.append(icon(item),title);card.append(head);
  if(combined){
    const line=document.createElement("p");line.className="any-drop-chance";
    const caption=document.createElement("span");caption.textContent="At least one";
    const value=document.createElement("strong");value.textContent=probabilityText(result.atLeastOne);
    line.append(caption,value);card.append(line);
  }
  const odds=document.createElement("div");odds.className="dry-outcomes";
  odds.append(
    outcome("Fewer than "+format(result.count),result.fewer),
    outcome("Exactly "+format(result.count),result.exact),
    outcome("More than "+format(result.count),result.more)
  );
  card.append(odds);return card;
}
function renderDry(result) {
  const grid=$("dry-results-grid");grid.replaceChildren();
  grid.append(dryCard("Any rare reward (Hallowfell, jar or Aggy)",SIGNATURE[0],result.anyUnique,true));
  for(const item of DRY_ITEMS)grid.append(dryCard(item.name,item,result[item.id]));
  $("dry-empty").hidden=true;$("dry-results").hidden=false;
}
function readReceived(kills){
  const result={};
  for(const field of dryInputs.querySelectorAll("input")){
    const item=ITEM_BY_ID[field.dataset.id];
    result[item.id]=parseNumber(field,kills,item.name);
  }
  return result;
}

$("mode-loot").addEventListener("click",()=>setMode("loot"));
$("mode-dry").addEventListener("click",()=>setMode("dry"));
form.addEventListener("input",()=>{resetPanels();showError("");});
$("clear-button").addEventListener("click",()=>{
  $("kill-count").value="0";$("medium-cas").checked=false;$("sunstone-eligible").checked=false;
  for(const input of dryInputs.querySelectorAll("input"))input.value="0";
  resetPanels();showError("");
});
form.addEventListener("submit",event=>{
  event.preventDefault();showError("");
  try{
    const kills=parseNumber($("kill-count"),MAX_KILLS,"completed kills");
    if(mode==="dry")renderDry(calculateDry(kills,readReceived(kills)));
    else renderLoot(simulate(kills,{mediumCAs:$("medium-cas").checked,sunstoneEligible:$("sunstone-eligible").checked}));
  }catch(err){showError(err instanceof Error?err.message:"Could not calculate the result.");}
});

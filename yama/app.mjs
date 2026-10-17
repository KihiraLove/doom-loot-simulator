import {BOSS_UNIQUES,DRY_ITEMS,ITEM_MAP,MAX_KILLS,simulate} from "./simulator.mjs";
import {calculateDry} from "./dry-calc.mjs";
const $=id=>document.getElementById(id);
const format=n=>new Intl.NumberFormat("en-US").format(n);
const form=$("simulator-form");
let mode="loot";
function icon(item){
 const image=document.createElement("img");
 image.src="../assets/items/"+item.id+".png";
 image.alt="";image.loading="lazy";image.width=36;image.height=32;
 return image;
}
function field(item){
 const label=document.createElement("label");label.className="dry-field";
 const name=document.createElement("span");name.textContent=item.name;
 const input=document.createElement("input");
 input.type="number";input.min="0";input.step="1";input.value="0";input.inputMode="numeric";
 input.dataset.id=item.id;input.setAttribute("aria-label",item.name+" received");
 label.append(icon(item),name,input);$("dry-inputs").append(label);
}
for(const item of DRY_ITEMS)field(item);
function clearOutput(){
 $("empty-state").hidden=false;$("results-content").hidden=true;
 $("opened-panel").hidden=true;$("dry-empty").hidden=false;$("dry-results").hidden=true;
}
function showError(message){
 $("validation-message").textContent=message;
 $("validation-message").hidden=!message;
}
function setMode(next){
 mode=next;
 const dry=mode==="dry";
 $("dry-fields").hidden=!dry;$("dry-panel").hidden=!dry;$("loot-panel").hidden=dry;
 $("opened-panel").hidden=dry||$("results-content").hidden;
 for(const [name,active] of [["loot",!dry],["dry",dry]]){
  $("mode-"+name).classList.toggle("is-active",active);
  $("mode-"+name).setAttribute("aria-pressed",String(active));
 }
 $("action-label").textContent=dry?"Calculate chances":"Simulate loot";
 showError("");
}
function parse(input,max,label){
 const raw=input.value.trim();
 if(!/^(0|[1-9]\d*)$/.test(raw)||!Number.isSafeInteger(Number(raw))||Number(raw)>max)
  throw new RangeError("Enter a non-negative whole number up to "+format(max)+" for "+label+".");
 return Number(raw);
}
function contribution(){
 return Number(form.querySelector('input[name="contribution"]:checked').value);
}
function makeUnique(item,amount){
 const card=document.createElement("div");card.className="unique-card"+(amount?" found":"");
 const title=document.createElement("strong");title.textContent=item.name;
 const count=document.createElement("span");count.className="count";count.textContent="× "+format(amount);
 card.append(icon(item),title,count);return card;
}
function lootCard(item,qty){
 const row=document.createElement("div");row.className="loot-item";
 const badge=document.createElement("div");badge.className="loot-icon";badge.append(icon(item));
 const info=document.createElement("div");info.className="loot-info";
 const amount=document.createElement("strong");amount.textContent="× "+format(qty);
 const name=document.createElement("span");name.textContent=item.name;
 info.append(amount,name);row.append(badge,info);return row;
}
function renderGrid(grid,drops,exclude=new Set()){
 grid.replaceChildren();
 const sorted=Object.entries(drops)
  .filter(([id,count])=>count>0&&!exclude.has(id))
  .sort((a,b)=>b[1]-a[1]||ITEM_MAP[a[0]].name.localeCompare(ITEM_MAP[b[0]].name));
 for(const [id,count] of sorted)grid.append(lootCard(ITEM_MAP[id],count));
}
function renderLoot(result){
 $("unique-grid").replaceChildren();
 for(const item of BOSS_UNIQUES)$("unique-grid").append(makeUnique(item,result.drops[item.id]||0));
 renderGrid($("loot-grid"),result.drops,new Set(BOSS_UNIQUES.map(i=>i.id)));
 $("box-heading").textContent="Forgotten lockboxes opened: "+format(result.lockboxes);
 $("dossier-heading").textContent="Dossiers opened: "+format(result.dossierCount);
 renderGrid($("box-grid"),result.boxes);
 renderGrid($("dossier-grid"),result.dossiers);
 $("box-empty").hidden=result.lockboxes>0;
 $("dossier-empty").hidden=result.dossierCount>0;
 $("empty-state").hidden=true;$("results-content").hidden=false;$("opened-panel").hidden=false;
}
function percent(p){
 if(p<=0)return "0%";if(p>=1)return "100%";
 const value=100*p;
 if(value<.000001)return "<0.000001%";
 if(value>99.999999)return ">99.999999%";
 return value.toFixed(value<1?4:2)+"%";
}
function outcome(label,value){
 const cell=document.createElement("div");cell.className="dry-outcome";
 const caption=document.createElement("span");caption.textContent=label;
 const number=document.createElement("strong");number.textContent=percent(value);
 cell.append(caption,number);return cell;
}
function dryCard(title,item,result,combined=false){
 const card=document.createElement("section");card.className="dry-result-card"+(combined?" dry-total-card":"");
 const head=document.createElement("div");head.className="dry-result-heading";
 const texts=document.createElement("div");
 const h=document.createElement("h3");h.textContent=title;
 const expected=document.createElement("p");expected.textContent="Expected: "+result.expected.toLocaleString("en-US",{maximumFractionDigits:2});
 texts.append(h,expected);head.append(icon(item),texts);card.append(head);
 if(combined){
  const p=document.createElement("p");p.className="any-drop-chance";
  const label=document.createElement("span");label.textContent="At least one";
  const v=document.createElement("strong");v.textContent=percent(result.atLeastOne);
  p.append(label,v);card.append(p);
 }
 const outcomes=document.createElement("div");outcomes.className="dry-outcomes";
 outcomes.append(
  outcome("Fewer than "+format(result.count),result.fewer),
  outcome("Exactly "+format(result.count),result.exact),
  outcome("More than "+format(result.count),result.more)
 );card.append(outcomes);return card;
}
function renderDry(result){
 const grid=$("dry-results-grid");grid.replaceChildren();
 grid.append(dryCard("Any equipment drop or Yami",{id:"yami",name:"Yami"},result.anyUnique,true));
 for(const item of DRY_ITEMS)grid.append(dryCard(item.name,item,result[item.id]));
 $("dry-empty").hidden=true;$("dry-results").hidden=false;
}
function readDry(kills,c){
 const received={};
 for(const input of $("dry-inputs").querySelectorAll("input")){
  const item=ITEM_MAP[input.dataset.id];
  const max=item.id==="oathplate-shards"?kills*(c===1?12:6):kills;
  received[item.id]=parse(input,max,item.name);
 }
 return received;
}
$("mode-loot").addEventListener("click",()=>setMode("loot"));
$("mode-dry").addEventListener("click",()=>setMode("dry"));
form.addEventListener("input",()=>{clearOutput();showError("");});
$("clear-button").addEventListener("click",()=>{
 $("kill-count").value="0";
 form.querySelector('input[value="1"][name="contribution"]').checked=true;
 for(const input of $("dry-inputs").querySelectorAll("input"))input.value="0";
 clearOutput();showError("");
});
form.addEventListener("submit",event=>{
 event.preventDefault();showError("");
 try{
  const kills=parse($("kill-count"),MAX_KILLS,"completed kills"),c=contribution();
  if(mode==="dry")renderDry(calculateDry(kills,c,readDry(kills,c)));
  else renderLoot(simulate(kills,c));
 }catch(error){showError(error instanceof Error?error.message:"Could not calculate.");}
});

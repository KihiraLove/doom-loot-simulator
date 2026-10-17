import {ITEMS,DRY_IDS,SIGNATURE_IDS,MAX_KILLS,simulate} from "./simulator.mjs";
import {calculateDry} from "./dry-calc.mjs";
const $=id=>document.getElementById(id);
const format=n=>new Intl.NumberFormat("en-US").format(n);
const form=$("simulator-form");
const dryInputs=$("dry-inputs");
const DISPLAY_UNIQUES=[...SIGNATURE_IDS,"alchemical-hydra-heads","jar-of-chemicals","ikkle-hydra"];
let mode="loot";
function icon(item){
 const img=document.createElement("img");
 img.src="../assets/items/"+item.id+".png";
 img.alt="";img.width=36;img.height=32;img.loading="lazy";
 return img;
}
function errorText(text){
 $("validation-message").textContent=text;
 $("validation-message").hidden=!text;
}
function reset(){
 $("empty-state").hidden=false;$("results-content").hidden=true;
 $("dry-empty").hidden=false;$("dry-results").hidden=true;
}
function setMode(next){
 mode=next;const dry=mode==="dry";
 $("dry-fields").hidden=!dry;
 $("dry-panel").hidden=!dry;
 $("loot-panel").hidden=dry;
 $("combat-options").hidden=dry;
 for(const [id,active] of [["loot",!dry],["dry",dry]]){
  $("mode-"+id).classList.toggle("is-active",active);
  $("mode-"+id).setAttribute("aria-pressed",String(active));
 }
 $("action-label").textContent=dry?"Calculate chances":"Simulate loot";
 errorText("");
}
function numberInput(input,max,name){
 const text=input.value.trim();
 if(!/^(0|[1-9]\d*)$/.test(text)||!Number.isSafeInteger(Number(text))||Number(text)>max)
  throw new RangeError("Enter a non-negative whole number up to "+format(max)+" for "+name+".");
 return Number(text);
}
function dryField(item){
 const label=document.createElement("label");label.className="dry-field";
 const name=document.createElement("span");name.textContent=item.name;
 const input=document.createElement("input");
 input.type="number";input.min="0";input.step="1";input.value="0";input.inputMode="numeric";
 input.dataset.id=item.id;input.setAttribute("aria-label",item.name+" received");
 label.append(icon(item),name,input);dryInputs.append(label);
}
for(const id of DRY_IDS)dryField(ITEMS[id]);
function uniqueCard(item,qty){
 const card=document.createElement("div");card.className="unique-card"+(qty?" found":"");
 const name=document.createElement("strong");name.textContent=item.name;
 const count=document.createElement("span");count.className="count";count.textContent="× "+format(qty);
 card.append(icon(item),name,count);
 return card;
}
function lootCard(item,qty){
 const card=document.createElement("div");card.className="loot-item";
 const holder=document.createElement("div");holder.className="loot-icon";holder.append(icon(item));
 const info=document.createElement("div");info.className="loot-info";
 const value=document.createElement("strong");value.textContent="× "+format(qty);
 const name=document.createElement("span");name.textContent=item.name;
 info.append(value,name);card.append(holder,info);return card;
}
function renderLoot(result){
 const unique=$("unique-grid"),loot=$("loot-grid");
 unique.replaceChildren();loot.replaceChildren();
 for(const id of DISPLAY_UNIQUES)unique.append(uniqueCard(ITEMS[id],result.drops[id]||0));
 const uniqueIds=new Set(DISPLAY_UNIQUES);
 const entries=Object.entries(result.drops)
   .filter(([id,qty])=>qty>0&&!uniqueIds.has(id))
   .sort((a,b)=>b[1]-a[1]||ITEMS[a[0]].name.localeCompare(ITEMS[b[0]].name));
 for(const [id,qty] of entries)loot.append(lootCard(ITEMS[id],qty));
 $("empty-state").hidden=true;$("results-content").hidden=false;
}
function percent(p){
 if(p<=0)return "0%";if(p>=1)return "100%";
 const n=p*100;
 if(n<.000001)return "<0.000001%";
 if(n>99.999999)return ">99.999999%";
 return n.toFixed(n<1?4:2)+"%";
}
function oddsCell(text,p){
 const c=document.createElement("div");c.className="dry-outcome";
 const caption=document.createElement("span");caption.textContent=text;
 const value=document.createElement("strong");value.textContent=percent(p);
 c.append(caption,value);return c;
}
function dryCard(name,item,result,combined=false){
 const card=document.createElement("section");card.className="dry-result-card"+(combined?" dry-total-card":"");
 const header=document.createElement("div");header.className="dry-result-heading";
 const title=document.createElement("div");
 const h=document.createElement("h3");h.textContent=name;
 const expected=document.createElement("p");
 expected.textContent="Expected: "+result.expected.toLocaleString("en-US",{maximumFractionDigits:2});
 title.append(h,expected);header.append(icon(item),title);card.append(header);
 if(combined){
  const line=document.createElement("p");line.className="any-drop-chance";
  const label=document.createElement("span");label.textContent="At least one";
  const value=document.createElement("strong");value.textContent=percent(result.atLeastOne);
  line.append(label,value);card.append(line);
 }
 const outcomes=document.createElement("div");outcomes.className="dry-outcomes";
 outcomes.append(
  oddsCell("Fewer than "+format(result.count),result.fewer),
  oddsCell("Exactly "+format(result.count),result.exact),
  oddsCell("More than "+format(result.count),result.more)
 );
 card.append(outcomes);return card;
}
function renderDry(data){
 const grid=$("dry-results-grid");grid.replaceChildren();
 grid.append(dryCard("Any signature unique",ITEMS["hydras-claw"],data.anyUnique,true));
 for(const id of DRY_IDS)grid.append(dryCard(ITEMS[id].name,ITEMS[id],data[id]));
 $("dry-empty").hidden=true;$("dry-results").hidden=false;
}
function readReceived(kills){
 const counts={};
 for(const input of dryInputs.querySelectorAll("input")){
  const id=input.dataset.id;
  counts[id]=numberInput(input,kills,ITEMS[id].name);
 }
 return counts;
}
$("mode-loot").addEventListener("click",()=>setMode("loot"));
$("mode-dry").addEventListener("click",()=>setMode("dry"));
form.addEventListener("input",()=>{reset();errorText("");});
$("clear-button").addEventListener("click",()=>{
 $("kill-count").value="0";$("hard-ca").checked=false;$("elite-ca").checked=false;
 for(const input of dryInputs.querySelectorAll("input"))input.value="0";
 reset();errorText("");
});
form.addEventListener("submit",event=>{
 event.preventDefault();errorText("");
 try{
  const kills=numberInput($("kill-count"),MAX_KILLS,"completed kills");
  if(mode==="dry")renderDry(calculateDry(kills,readReceived(kills)));
  else renderLoot(simulate(kills,{hardCA:$("hard-ca").checked,eliteCA:$("elite-ca").checked}));
 }catch(e){errorText(e instanceof Error?e.message:"The calculation could not be completed.");}
});

import {UNIQUE,DRY_ITEMS,rateOf,validateKills} from "./simulator.mjs";
import {binomial} from "../phosani/dry-calc.mjs";

function validCount(count,kills){
 if(!Number.isSafeInteger(count)||count<0||count>kills)
  throw new RangeError("Drop counts must be whole numbers between 0 and the completed kills.");
}
function odds(dist,count){
 let fewer=0,exact=0;
 for(let i=0;i<dist.values.length;i++){
  const n=dist.from+i;
  if(n<count)fewer+=dist.values[i];
  else if(n===count)exact+=dist.values[i];
 }
 return {
  count,expected:dist.expected,
  fewer:Math.max(0,Math.min(1,fewer)),
  exact:Math.max(0,Math.min(1,exact)),
  more:Math.max(0,Math.min(1,1-fewer-exact))
 };
}
// One primary unique-table roll gives at most one of the four outcomes.
export function calculateDry(kills,received={}){
 validateKills(kills);
 if(received===null||typeof received!=="object")
  throw new TypeError("Drop counts must be provided.");
 const result={};
 for(const item of DRY_ITEMS){
  const count=received[item.id]??0;
  validCount(count,kills);
  result[item.id]=odds(binomial(kills,rateOf(item.id)),count);
 }
 const count=UNIQUE.reduce((sum,item)=>sum+(received[item.id]??0),0);
 validCount(count,kills);
 result.anyUnique={
  ...odds(binomial(kills,1/130),count),
  atLeastOne:-Math.expm1(kills*Math.log1p(-1/130))
 };
 return result;
}

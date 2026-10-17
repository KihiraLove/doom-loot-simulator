import {EQUIPMENT,DRY_ITEMS,validateKills,validateContribution,itemRate,rates} from "./simulator.mjs";
import {binomial} from "../phosani/dry-calc.mjs";
function checkCount(n,max){
 if(!Number.isSafeInteger(n)||n<0||n>max)
  throw new RangeError("Drop counts must be non-negative whole numbers no higher than possible drops.");
}
function stats(dist,k){
 let fewer=0,exact=0;
 for(let i=0;i<dist.values.length;i++){
  const v=dist.from+i;
  if(v<k)fewer+=dist.values[i];
  else if(v===k)exact+=dist.values[i];
 }
 return {count:k,expected:dist.expected,
  fewer:Math.max(0,Math.min(1,fewer)),
  exact:Math.max(0,Math.min(1,exact)),
  more:Math.max(0,Math.min(1,1-fewer-exact))};
}
// "Any unique" means any of the four equipment items or Yami.
// These two independent rolls can occur on the same kill.
export function anyRare(kills,contribution,count){
 validateKills(kills);validateContribution(contribution);
 checkCount(count,kills*2);
 const {gear,pet}=rates(contribution);
 const a=binomial(kills,gear),b=binomial(kills,pet);
 const prefix=new Float64Array(b.values.length+1);
 for(let i=0;i<b.values.length;i++)prefix[i+1]=prefix[i]+b.values[i];
 let fewer=0,exact=0;
 for(let i=0;i<a.values.length;i++){
  const other=count-(a.from+i)-b.from;
  fewer+=a.values[i]*prefix[Math.max(0,Math.min(b.values.length,other))];
  if(other>=0&&other<b.values.length)exact+=a.values[i]*b.values[other];
 }
 return {count,expected:kills*(gear+pet),
  atLeastOne:-Math.expm1(kills*(Math.log1p(-gear)+Math.log1p(-pet))),
  fewer:Math.max(0,Math.min(1,fewer)),
  exact:Math.max(0,Math.min(1,exact)),
  more:Math.max(0,Math.min(1,1-fewer-exact))};
}
export function calculateDry(kills,contribution=1,received={}){
 validateKills(kills);validateContribution(contribution);
 if(!received||typeof received!=="object")throw new TypeError("Drop counts are required.");
 const result={};
 for(const item of DRY_ITEMS){
  const count=received[item.id]??0;
  checkCount(count,item.id==="oathplate-shards"?kills*12:kills);
  // Shards drop as 12 or 6 in a single roll. Observations are actual
  // shard quantity, not the number of successful shard rolls.
  const batch=item.id==="oathplate-shards"?(contribution===1?12:6):1;
  if(count%batch!==0)throw new RangeError("Oathplate shard counts must be a multiple of "+batch+".");
  const row=stats(binomial(kills,itemRate(item.id,contribution)),count/batch);
  result[item.id]={...row,count,expected:row.expected*batch};
 }
 const total=EQUIPMENT.reduce((s,item)=>s+(received[item.id]??0),0)+(received.yami??0);
 result.anyUnique=anyRare(kills,contribution,total);
 return result;
}

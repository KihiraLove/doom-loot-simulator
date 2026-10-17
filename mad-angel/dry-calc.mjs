import {DRY_ITEMS,SIGNATURE,PREROLL,rateOf,validateKills} from "./simulator.mjs";
import {binomial} from "../phosani/dry-calc.mjs";
function countCheck(n,max){
 if(!Number.isSafeInteger(n)||n<0||n>max)
  throw new RangeError("Drop counts must be whole numbers within the possible range.");
}
function summary(dist,observed,unit=1){
 let fewer=0,exact=0;
 for(let i=0;i<dist.values.length;i++){
  const amount=(dist.from+i)*unit,probability=dist.values[i];
  if(amount<observed)fewer+=probability;
  else if(amount===observed)exact+=probability;
 }
 return {count:observed,expected:dist.expected*unit,
  fewer:Math.max(0,Math.min(1,fewer)),exact:Math.max(0,Math.min(1,exact)),
  more:Math.max(0,Math.min(1,1-fewer-exact))};
}
const RARE_CHANCE=PREROLL.filter(item=>SIGNATURE.some(s=>s.id===item.id))
 .reduce((sum,item)=>sum+item.rate,0);
// Main rare pre-rolls are mutually exclusive; pet is independent.
// Exact total unique-count odds convolve the two binomial distributions.
export function anyUniqueOdds(kills,count){
 validateKills(kills);countCheck(count,2*kills);
 const a=binomial(kills,RARE_CHANCE),b=binomial(kills,1/2000);
 const prefix=new Float64Array(b.values.length+1);
 for(let i=0;i<b.values.length;i++)prefix[i+1]=prefix[i]+b.values[i];
 let fewer=0,exact=0;
 for(let i=0;i<a.values.length;i++){
  const other=count-(a.from+i)-b.from;
  const below=Math.max(0,Math.min(other,b.values.length));
  fewer+=a.values[i]*prefix[below];
  if(other>=0&&other<b.values.length)exact+=a.values[i]*b.values[other];
 }
 return {count,expected:kills*(RARE_CHANCE+1/2000),
  atLeastOne:-Math.expm1(kills*(Math.log1p(-RARE_CHANCE)+Math.log1p(-1/2000))),
  fewer:Math.max(0,Math.min(1,fewer)),exact:Math.max(0,Math.min(1,exact)),
  more:Math.max(0,Math.min(1,1-fewer-exact))};
}
export function calculateDry(kills,counts={}){
 validateKills(kills);
 if(!counts||typeof counts!=="object")throw new TypeError("Drop counts are required.");
 const results={};
 for(const item of DRY_ITEMS){
  const received=counts[item.id]??0;
  const unit=item.quantity??1; // Teleports arrive 2 at a time.
  countCheck(received,kills*unit);
  if(received%unit!==0)throw new RangeError(item.name+" counts must be multiples of "+unit+".");
  results[item.id]=summary(binomial(kills,rateOf(item.id)),received,unit);
 }
 const total=SIGNATURE.reduce((sum,item)=>sum+(counts[item.id]??0),0);
 results.anyUnique=anyUniqueOdds(kills,total);
 return results;
}

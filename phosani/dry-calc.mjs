import { ARMOUR_CHANCE, ORB_CHANCE, SIGNATURE, DRY_ITEMS, rateOf, validateKills } from "./simulator.mjs";

// Evaluate around the binomial mode to avoid underflow for very large kill counts.
// O(standard deviation), with omitted tails much smaller than shown precision.
export function binomial(n,p) {
 validateKills(n);
 if(!(p>=0&&p<=1))throw new RangeError("Invalid probability");
 if(n===0||p===0)return {from:0,values:Float64Array.of(1),expected:0};
 if(p===1)return {from:n,values:Float64Array.of(1),expected:n};
 const mean=n*p, radius=Math.ceil(10*Math.sqrt(n*p*(1-p))+15);
 const from=Math.max(0,Math.floor(mean-radius));
 const to=Math.min(n,Math.ceil(mean+radius));
 const mode=Math.max(from,Math.min(to,Math.floor((n+1)*p)));
 const values=new Float64Array(to-from+1);
 values[mode-from]=1;
 for(let k=mode-1;k>=from;k--)
   values[k-from]=values[k+1-from]*(k+1)/(n-k)*(1-p)/p;
 for(let k=mode+1;k<=to;k++)
   values[k-from]=values[k-1-from]*(n-k+1)/k*p/(1-p);
 let total=0;
 for(const v of values)total+=v;
 for(let i=0;i<values.length;i++)values[i]/=total;
 return {from,values,expected:mean};
}
function countCheck(k,max) {
 if(!Number.isSafeInteger(k)||k<0||k>max)
   throw new RangeError("Drop counts must be whole numbers between 0 and the possible drops.");
}
function odds(dist,k){
 let fewer=0,exact=0;
 for(let i=0;i<dist.values.length;i++){
   const value=dist.from+i;
   if(value<k)fewer+=dist.values[i];
   else if(value===k)exact+=dist.values[i];
 }
 return {count:k,expected:dist.expected,
   fewer:Math.max(0,Math.min(1,fewer)),
   exact:Math.max(0,Math.min(1,exact)),
   more:Math.max(0,Math.min(1,1-fewer-exact))};
}
// Count total drops from BOTH mutually independent signature tables,
// including the possibility of two uniques on a single kill.
export function anySignatureOdds(kills,count) {
 validateKills(kills);
 countCheck(count,kills*2);
 const a=binomial(kills,ARMOUR_CHANCE),b=binomial(kills,ORB_CHANCE);
 const prefix=new Float64Array(b.values.length+1);
 for(let i=0;i<b.values.length;i++)prefix[i+1]=prefix[i]+b.values[i];
 let fewer=0,exact=0;
 for(let i=0;i<a.values.length;i++){
   const other=count-(a.from+i)-b.from;
   const below=Math.max(0,Math.min(b.values.length,other));
   fewer+=a.values[i]*prefix[below];
   if(other>=0&&other<b.values.length)exact+=a.values[i]*b.values[other];
 }
 return {count,expected:kills*(ARMOUR_CHANCE+ORB_CHANCE),
   atLeastOne:-Math.expm1(kills*(Math.log1p(-ARMOUR_CHANCE)+Math.log1p(-ORB_CHANCE))),
   fewer:Math.max(0,Math.min(1,fewer)),
   exact:Math.max(0,Math.min(1,exact)),
   more:Math.max(0,Math.min(1,1-fewer-exact))};
}
export function calculateDry(kills,received={}){
 validateKills(kills);
 if(received===null||typeof received!=="object")throw new TypeError("Missing drop counts");
 const results={};
 for(const item of DRY_ITEMS){
   const count=received[item.id]??0;
   countCheck(count,kills);
   results[item.id]=odds(binomial(kills,rateOf(item.id)),count);
 }
 const total=SIGNATURE.reduce((s,item)=>s+(received[item.id]??0),0);
 results.anyUnique=anySignatureOdds(kills,total);
 return results;
}

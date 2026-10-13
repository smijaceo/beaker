// UI preferences only: no printer records, selection or workflow state are stored here.
export function createRouteStore(storage,key='beaker-saved-routes-v1'){
 const fields=['q','building','floor','status','area'],sorts=['route','location','serial','status'];
 const clean=value=>{
  if(!value||typeof value.name!=='string'||!value.name.trim()||value.name.length>60)return null;
  return {name:value.name.trim(),filters:Object.fromEntries(fields.map(k=>[k,typeof value.filters?.[k]==='string'?value.filters[k].slice(0,200):''])),sort:sorts.includes(value.sort)?value.sort:'route'};
 };
 const read=()=>{try{const data=JSON.parse(storage?.getItem(key)||'[]');return Array.isArray(data)?data.map(clean).filter(Boolean).slice(0,20):[]}catch{return []}};
 const write=routes=>{if(!storage)throw Error('Browser storage is unavailable; this route was not saved.');try{storage.setItem(key,JSON.stringify(routes))}catch{throw Error('Browser storage is unavailable or full; this route was not saved.')}};
 return {
  list:read,
  save(name,filters,sort){const item=clean({name,filters,sort});if(!item)throw Error('Enter a route name of 1–60 characters.');const routes=read(),index=routes.findIndex(r=>r.name.toLowerCase()===item.name.toLowerCase());if(index>=0)routes[index]=item;else{if(routes.length>=20)throw Error('Remove a saved route before adding another (maximum 20).');routes.push(item)}write(routes);return item},
  remove(name){write(read().filter(r=>r.name!==name))}
 };
}

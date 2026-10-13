// Ephemeral navigation only. This module never stores or writes printer state.
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const idOf=record=>record?.id==null?null:String(record.id);
const uniqueIds=records=>[...new Set(records.map(idOf).filter(id=>id!==null))];
export function createRouteSession({name='Current filters',printers=[],allPrinters=printers}={}){
 let ids=uniqueIds(printers),cursor=ids.length?0:-1,records=new Map(),matches=new Set(),active=true;
 function updateRecords(filtered,all){records=new Map(all.filter(p=>idOf(p)!==null).map(p=>[idOf(p),{...p}]));matches=new Set(uniqueIds(filtered));}
 updateRecords(printers,allPrinters);
 const snapshot=()=>{
  const entries=ids.map(id=>({id,printer:records.has(id)?{...records.get(id)}:null,missing:!records.has(id),outsideFilter:records.has(id)&&!matches.has(id)}));
  const totals={};let missing=0,outsideFilter=0;
  for(const entry of entries){if(entry.missing)missing++;else{const status=String(entry.printer.status||'Unknown');totals[status]=(totals[status]||0)+1;if(entry.outsideFilter)outsideFilter++;}}
  return {name,active,ids:[...ids],cursor,position:cursor+1,length:ids.length,current:entries[cursor]||null,entries,totals,missing,outsideFilter,canPrevious:active&&cursor>0,canNext:active&&cursor>=0&&cursor<ids.length-1};
 };
 return {
  snapshot,
  previous(){if(active&&cursor>0)cursor--;return snapshot()},
  next(){if(active&&cursor>=0&&cursor<ids.length-1)cursor++;return snapshot()},
  // Keep every existing slot, including missing/departed records; append new matches
  // in refreshed query order. Saves may change status/sort, never the cursor.
  refresh(filtered,all=filtered){if(!active)return snapshot();updateRecords(filtered,all);const known=new Set(ids);for(const id of uniqueIds(filtered)){if(!known.has(id)){ids.push(id);known.add(id)}}if(cursor<0&&ids.length)cursor=0;return snapshot()},
  exit(){active=false;return snapshot()}
 };
}
export function renderRouteSession(session,{canEdit=false}={}){
 const state=typeof session.snapshot==='function'?session.snapshot():session;
 if(!state.active)return '';
 const current=state.current,printer=current?.printer;
 const totals=Object.entries(state.totals).map(([status,count])=>`${escape(status)}: ${count}`).join(' · ');
 return `<section class="route-session" aria-label="Session route"><h2>${escape(state.name)}</h2><p class="muted">Session route · your place is kept until this page reloads.</p><p role="status" aria-live="polite">${state.length?`Position ${state.position} of ${state.length}`:'No printers in this session'}</p><p>Printer status · ${totals||'No available printer records'}${state.missing?` · Missing: ${state.missing}`:''}</p>${current?`<div class="route-current"><h3 class="identifier">${escape(printer?.location||printer?.serial||current.id)}</h3>${printer?`<p class="identifier">${escape(printer.serial)} · ${escape(printer.status||'Unknown')}</p>`:''}${current.missing?'<p class="warning">This printer is no longer available. Its session position is retained.</p>':''}${current.outsideFilter?'<p class="warning">This printer no longer matches the route filters. Its session position is retained.</p>':''}${printer?`<button type="button" class="primary" data-printer-quick="${escape(current.id)}" ${canEdit?'':'disabled'}>Update relabeling</button> <button type="button" data-open="printer:${escape(current.id)}">Open printer</button>`:''}</div>`:'<p>Exit and adjust filters, or refresh to include new matches.</p>'}<div class="toolbar"><button type="button" data-act="route-previous" ${state.canPrevious?'':'disabled'}>Previous printer</button><button type="button" data-act="route-next" ${state.canNext?'':'disabled'}>Next printer</button><button type="button" data-act="route-refresh">Refresh route</button><button type="button" data-act="route-exit">Exit route</button></div><p class="muted">Previous / Next moves between printers. Update relabeling to record physical work.</p></section>`;
}

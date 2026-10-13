// Presentation only: source authority, annotations and mapping candidates stay distinct.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function ticketSource(ticket,key){
 if(ticket.source && Object.prototype.hasOwnProperty.call(ticket.source,key))return ticket.source[key]??'';
 const legacy={assigned_to:'owner',short_description:'short_description'}[key]||key;
 return ticket['source_'+legacy]??'';
}
const shown=v=>v===undefined||v===null||v===''?'Not recorded':v;
const datum=(label,value)=>`<div><dt>${esc(label)}</dt><dd>${esc(shown(value))}</dd></div>`;
const canEdit=role=>role!=='viewer';
export function ticketRead(ticket,{role='viewer',dateDisplay=v=>v||'Unknown'}={}){
 const url=String(ticket.url||'');
 const safeURL=/^https?:\/\//i.test(url);
 return `<section aria-label="Authoritative ticket source"><h3>ServiceNow source</h3><p class="muted">Read-only imported fields. Local annotations do not update ServiceNow.</p><dl class="datums">${[['Short description','short_description'],['Priority','priority'],['State','state'],['Owner','assigned_to'],['Location','location']].map(([label,key])=>datum(label,ticketSource(ticket,key))).join('')}${datum('Last seen',dateDisplay(ticket.last_seen_at))}</dl>${safeURL?`<p><a href="${esc(url)}" target="_blank" rel="noopener">Open ServiceNow</a></p>`:'<p class="muted">Source URL unavailable</p>'}${ticket.missing_from_latest?'<div class="warning">Absent from latest export; retained. Absence does not establish closure.</div>':''}<details><summary>Source details</summary><pre>${esc(JSON.stringify(ticket.source||{},null,2))}</pre></details></section><section aria-label="Operational annotations"><h3>Operational annotations</h3><dl class="datums">${[['Operational location','location'],['Printer','printer'],['Issue','issue'],['Action','action'],['Notes','notes']].map(([label,key])=>datum(label,ticket[key])).join('')}</dl><button type="button" data-ticket-action="annotations" ${canEdit(role)?'':'disabled'}>Edit annotations</button></section>`;
}
export function ticketAnnotations(ticket,{role='viewer'}={}){
 const disabled=canEdit(role)?'':'disabled';
 return `<p class="muted">Local operational annotations only. ServiceNow priority, state and owner remain read-only.</p><div class="form-grid">${[['location','Operational location'],['printer','Printer'],['issue','Issue'],['action','Action'],['notes','Notes']].map(([key,label])=>`<label>${label}${['location','printer'].includes(key)?`<input name="${key}" value="${esc(ticket[key]||'')}" ${disabled}>`:`<textarea name="${key}" rows="3" ${disabled}>${esc(ticket[key]||'')}</textarea>`}</label>`).join('')}</div>`;
}
export function mappingCandidates(rows,{dateDisplay=v=>v||'Unknown'}={}){
 return rows.map(row=>`<article class="ledger-row ledger-mapping"><div class="ledger-open"><strong class="identifier">${esc(row.location||'No Location ID')}</strong><dl class="datums">${datum('HN / EPR',row.epr?'HN'+row.epr:'Not recorded')}${datum('LWS ID',row.lws_id)}${datum('Review',row.review||'No review message')}${datum('Source record ID',row.id)}${datum('Recorded at',dateDisplay(row.updated_at))}${datum('Recorded by',row.updated_by||'Unknown')}${row.source_row!==undefined?datum('Source row',row.source_row):''}${row.source_sheet!==undefined?datum('Source sheet',row.source_sheet):''}${row.batch_id!==undefined?datum('Source batch',row.batch_id):''}</dl></div></article>`).join('');
}
export function secondaryMore({actor='',role='viewer'}={}){
 const groups=[['Work',[['units','Provisioning'],['blocked','Blocked work'],['tickets','Tickets']]],['Records',[['mappings','Mapping candidates'],['history','History and audit']]],['Utilities',[['tools','Labels, handoffs and data']]],['Workspace',[['settings','Settings']]]];
 return `<p>${esc(actor)} · ${esc(role)}</p>${groups.map(([label,links])=>`<section class="panel"><h2>${label}</h2><div class="linklist">${links.map(([view,title])=>`<button data-view="${view}">${title} →</button>`).join('')}</div></section>`).join('')}<p class="muted">${role==='import-admin'?'Imports and settings changes require preview/review where applicable.':role==='viewer'?'Read-only identity. Record changes, receipt imports and administrative changes are unavailable.':'Record editing is available. Imports and settings changes require import-admin.'} Printer sender is unconfigured. Exports and send receipts do not establish physical Printed or Complete.</p><div class="linklist"><button class="tertiary" data-intro-replay>Replay intro</button><button data-act="logout">Sign out</button></div>`;
}

// Presentation and payloads only. Existing IDs and backend scheduling rules remain authoritative.
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const datum=(label,value)=>`<div><dt>${esc(label)}</dt><dd>${esc(value||'Not recorded')}</dd></div>`;
const button=(kind,id,label)=>`<button type="button" data-work-open="${esc(kind+':'+id)}">${esc(label)}</button>`;
const source=(r,key)=>Object.prototype.hasOwnProperty.call(r.source||{},key)?r.source[key]??'':r['source_'+({assigned_to:'owner'}[key]||key)]||'';
export function agendaLinks(task,state){
 const links=[];
 if(task.ticket){const ticket=(state.tickets||[]).find(t=>t.number===task.ticket);links.push(ticket?button('ticket',ticket.id,'Ticket '+ticket.number)+(ticket.missing_from_latest?'<p class="muted">Absent from latest export; retained. Absence does not establish closure.</p>':''):`<p class="muted">Ticket ${esc(task.ticket)} is not available in this import.</p>`);
 if(ticket?.printer){const query=String(ticket.printer);const matches=(state.printers||[]).filter(p=>p.location===query||p.serial===query);links.push(`<button type="button" data-work-find="${esc(query)}">Find printer: ${esc(query)}</button>`);links.push(matches.map(p=>button('printer',p.id,`${p.location||'No Location ID'} · ${p.serial||'No serial'}`)).join(''));if(matches.length>1)links.push('<p class="muted">Multiple physical records match. Confirm the serial before taking action.</p>');}}
 for(const [key,kind,collection,label] of [['unit_id','unit','units','Provisioning'],['issue_id','issue','issues','Issue']])if(task[key])links.push((state[collection]||[]).some(r=>r.id===task[key])?button(kind,task[key],label):`<p class="muted">Linked ${label.toLowerCase()} is unavailable.</p>`);
 return links.length?`<section aria-label="Linked work"><h3>Do this work</h3><div class="step-actions">${links.join('')}</div></section>`:'<p class="muted">No linked ticket, provisioning request or issue. Follow the recorded action.</p>';
}
export function taskRead(task,state,{canEdit=false,dateDisplay=v=>v||'Unknown',badge=v=>esc(v)}={}){
 const editable=typeof canEdit==='function'?canEdit():canEdit;
 const dates=(state.agenda||[]).filter(a=>a.task_id===task.id).map(a=>a.work_date);
 const blocked=(state.blockers||[]).find(b=>b.task_id===task.id&&!b.closed_at);
 return `<p>${badge(task.status||'Planned')} · ${esc(task.priority||'Moderate')} priority</p><dl class="datums">${datum('Task',task.title)}${datum('Owner',task.owner||'Unassigned')}${datum('Location',task.location)}${datum('Action',task.action)}${datum('Scheduled',dates.map(date=>dateDisplay(date)).join(', ')||'Not scheduled')}</dl>${blocked?`<section aria-label="Blocker"><h3>Blocked work</h3><dl class="datums">${datum('Reason',blocked.reason)}${datum('Waiting on',blocked.waiting_on)}${datum('Follow-up',dateDisplay(blocked.follow_up))}</dl></section>`:''}${agendaLinks(task,state)}<div class="step-actions"><button type="button" data-task-action="status" ${editable?'':'disabled'}>Change status</button><button type="button" data-task-action="edit" ${editable?'':'disabled'}>Edit details</button><button type="button" data-work-schedule="task:${esc(task.id)}" ${editable?'':'disabled'}>Add to agenda</button></div>`;
}
export function agendaCandidates(kind,record,state){return (state.tasks||[]).filter(t=>kind==='task'?t.id===record.id:kind==='ticket'?!!record.number&&t.ticket===record.number:kind==='unit'?t.unit_id===record.id:kind==='issue'?t.issue_id===record.id:false)}
export function agendaSeed(kind,record){
 if(kind==='task')return taskPayload(record);
 if(kind==='ticket')return {title:source(record,'short_description')||record.number,owner:source(record,'assigned_to'),location:record.location||'',action:record.action||'',ticket:record.number||'',unit_id:'',issue_id:'',priority:'Moderate',status:'Planned'};
 if(kind==='unit')return {title:record.next_action||'Provision '+(record.printer||record.legacy_id||record.id),owner:record.owner||'',location:record.location||'',action:record.next_action||'',ticket:record.ticket||'',unit_id:record.id,issue_id:'',priority:'Moderate',status:'Planned'};
 if(kind==='issue')return {title:record.next_action||'Review printer issue',owner:record.owner||'',location:'',action:record.next_action||'',ticket:'',unit_id:'',issue_id:record.id,priority:'Moderate',status:'Planned'};
 throw new Error('Unsupported work type');
}
export function agendaForm(kind,record,state,{date=state.today||'',canEdit=true}={}){
 const candidates=agendaCandidates(kind,record,state),disabled=(typeof canEdit==='function'?!canEdit():!canEdit)?'disabled':'';
 const chosen=kind==='task'?record.id:candidates.length?'':'__new__';
 return `<p>Choose a date and the work to add. Scheduling keeps its current status and blockers.</p><label>Work date<input type="date" name="work_date" required value="${esc(date)}" ${disabled}></label><label>Work to schedule<select name="agenda_task_id" required ${disabled}>${kind==='task'?'':`<option value="" ${chosen===''?'selected':''}>Choose existing work or create new work</option>`}${candidates.map(t=>`<option value="${esc(t.id)}" ${chosen===t.id?'selected':''}>${esc(t.title)} · ${esc(t.status)} · ${esc(t.owner||'Unassigned')} (${esc(t.id)})</option>`).join('')}${kind==='task'?'':`<option value="__new__" ${chosen==='__new__'?'selected':''}>Create new work</option>`}</select></label>${kind==='task'?'<p class="muted">Schedules this same task; existing dates are retained.</p>':candidates.length?'<p class="muted">Choose an existing item or create new work.</p>':'<p class="muted">No linked tasks found.</p>'}${kind==='task'?'':'<details><summary>About existing work</summary><p class="muted">An identical linked task may be reused. Its current status and earlier agenda dates are retained.</p></details>'}`;
}
export function taskPayload(task,state={},changes={}){
 const result={};for(const key of ['id','version','title','owner','priority','status','location','action','ticket','unit_id','issue_id'])if(Object.prototype.hasOwnProperty.call(task,key))result[key]=task[key];
 const b=(state.blockers||[]).find(b=>b.task_id===task.id&&!b.closed_at);
 if(b)Object.assign(result,{reason:b.reason,waiting_on:b.waiting_on,follow_up:b.follow_up||'',blocker_notes:b.notes||''});
 return {...result,...changes};
}

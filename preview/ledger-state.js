// Reconciled from the incoming Field Ledger state helpers. Pure presentation helpers only.
const destinations=['today','printers','issues','blocked','units','tickets','mappings','tools','history','settings','more'];
const recordViews={printer:'printers',issue:'issues',task:'today',unit:'units',ticket:'tickets'};
export function readDestination(location={}){
 const hash=String(location?.hash||'').replace(/^#\/?/,'');
 const match=/^(printer|issue|task|unit|ticket)(?:\/|:)(.+)$/.exec(hash);
 if(match){try{const id=decodeURIComponent(match[2]);if(id.trim())return {view:recordViews[match[1]],record:{kind:match[1],id}}}catch{}}
 if(destinations.includes(hash))return {view:hash};
 const query=new URLSearchParams(location?.search||'').get('view');
 return {view:destinations.includes(query)?query:'today'};
}
export function errorField(message,names=[]){
 const text=String(message||'');
 const aliases=[
  [/physical|print\/scan verification/i,['physical_verified']],
  [/resolution|outcome|leaving Issue/i,['outcome']],
  [/\bnote\b/i,['note','text']],
  [/\bwaiting on\b/i,['waiting_on']],
  [/\breason\b/i,['reason']],
  [/\bEPR\b/i,['epr']],
  [/\bprinter name\b/i,['printer']],
  [/\bLocation ID\b/i,['location','printer']],
  [/\blocation\b/i,['location']],
  [/\btitle\b/i,['title']],
  [/\bMAC\b/i,['mac']],
  [/\bIP(?:v[46])?\b/i,['ip']],
  [/\bnext action\b/i,['next_action']],
 ];
 for(const [pattern,keys] of aliases){if(pattern.test(text)){const key=keys.find(key=>names.includes(key));if(key)return key}}
 return names.find(name=>{
  const label=name.replaceAll('_',' ').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return label&&new RegExp('\\b'+label+'\\b','i').test(text);
 })||'';
}

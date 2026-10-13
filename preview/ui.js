// Adapt the existing native detail sheet to the visible keyboard viewport. No draft/state mutations.
export function installDetailViewport(dialog,win=window){
 const viewport=win.visualViewport;if(!viewport||!dialog)return ()=>{};
 const update=()=>{dialog.style.setProperty('--detail-height',Math.max(120,viewport.height)+'px');dialog.style.setProperty('--detail-top',Math.max(0,viewport.offsetTop)+'px');dialog.classList?.toggle('keyboard-open',viewport.height<win.innerHeight-80)};
 const destroy=()=>{viewport.removeEventListener('resize',update);viewport.removeEventListener('scroll',update);win.removeEventListener('pagehide',hide)};
 const hide=event=>{if(!event.persisted)destroy()};
 viewport.addEventListener('resize',update);viewport.addEventListener('scroll',update);win.addEventListener('pagehide',hide);update();
 return destroy;
}
if(typeof document!=='undefined')installDetailViewport(document.querySelector('#detail'));

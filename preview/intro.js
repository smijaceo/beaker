import {createIntroController,INTRO_TIMING} from './intro-controller.js';
import {wordmarkPaths} from './wordmark.js';
// The vertical cut is shared by both halves and clipped to the actual glyph outlines.
const fracture='M550 0 L550 142 L543 157 L556 174 L546 191 L558 208 L547 229 L553 249 L550 400';
export function introArtwork(){return `<svg class="intro-wordmark" viewBox="0 0 1100 400" role="img" aria-label="BeakerBoyz"><defs>
 <g id="intro-letters">${wordmarkPaths.map(d=>`<path d="${d}"/>`).join('')}</g>
 <clipPath id="intro-left"><path d="${fracture} L0 400 L0 0 Z"/></clipPath>
 <clipPath id="intro-right"><path d="${fracture} L1100 400 L1100 0 Z"/></clipPath>
 <clipPath id="intro-letter-mask"><use href="#intro-letters"/></clipPath>
 <clipPath id="intro-crack-window"><rect class="intro-crack-window" y="169" width="1100" height="91"/></clipPath>
 <clipPath id="intro-chip-a"><path d="M543 157 L556 174 L548 173 Z"/></clipPath>
 <clipPath id="intro-chip-b"><path d="M546 191 L558 208 L550 204 Z"/></clipPath>
 <clipPath id="intro-chip-c"><path d="M547 229 L553 249 L544 241 Z"/></clipPath>
 <mask id="intro-main-pieces"><rect width="1100" height="400" fill="white"/><path d="M543 157 L556 174 L548 173 Z M546 191 L558 208 L550 204 Z M547 229 L553 249 L544 241 Z" fill="black"/></mask>
 </defs>
 <g class="intro-upper"><g clip-path="url(#intro-left)"><use href="#intro-letters" fill="#FFFFFF" mask="url(#intro-main-pieces)"/></g></g>
 <g class="intro-lower"><g clip-path="url(#intro-right)"><use href="#intro-letters" fill="#FFFFFF" mask="url(#intro-main-pieces)"/></g></g>
 <g class="intro-chip intro-chip-a" clip-path="url(#intro-chip-a)"><use href="#intro-letters" fill="#FFFFFF"/></g>
 <g class="intro-chip intro-chip-b" clip-path="url(#intro-chip-b)"><use href="#intro-letters" fill="#FFFFFF"/></g>
 <g class="intro-chip intro-chip-c" clip-path="url(#intro-chip-c)"><use href="#intro-letters" fill="#FFFFFF"/></g>
 <g clip-path="url(#intro-letter-mask)"><g clip-path="url(#intro-crack-window)" class="intro-fracture"><path d="${fracture}" fill="none" stroke="#0B0D10" stroke-width="4"/></g></g></svg>`}
export function approvedProducts(manifest){
 return (Array.isArray(manifest?.products)?manifest.products:[]).filter(p=>p?.approved===true&&p.verified===true&&typeof p.model==='string'&&p.model.trim()&&typeof p.source==='string'&&p.source.trim()&&typeof p.rights==='string'&&p.rights.trim()&&typeof p.alt==='string'&&p.alt.trim()&&typeof p.src==='string'&&!p.src.includes('..')&&/^\/assets\/[a-zA-Z0-9_/-]+\.(png|webp|avif)$/.test(p.src)).slice(0,5);
}
// Default-on attempts respect AudioContext/browser/device policy. No gesture prompts or late cues.
export function installIntroSound(win,began,reduced){
 const Context=win.AudioContext||win.webkitAudioContext;
 if(reduced||!Context)return ()=>{};
 let context;try{context=new Context();Promise.resolve(context.resume()).catch(()=>{})}catch{try{Promise.resolve(context?.close()).catch(()=>{})}catch{}return ()=>{}}
 let closed=false;const timers=new Set(),buffers=new Map(),sources=[],abort=new AbortController();
 const elapsed=()=> (win.performance?.now?.()??Date.now())-began;
 const later=(fn,ms)=>{const id=win.setTimeout(()=>{timers.delete(id);fn()},Math.max(0,ms));timers.add(id)};
 const cues=[{name:'crack',at:INTRO_TIMING.crackStart,rate:1,volume:.25},{name:'short-choir',at:INTRO_TIMING.circleAt,rate:.86,volume:.22}];
 for(const cue of cues){
  Promise.resolve().then(()=>win.fetch('/assets/audio/'+cue.name+'.mp3',{signal:abort.signal})).then(r=>{if(!r.ok)throw Error('Audio unavailable');return r.arrayBuffer()}).then(data=>closed?null:context.decodeAudioData(data)).then(buffer=>{if(!closed&&buffer)buffers.set(cue.name,buffer)}).catch(()=>{});
  later(()=>{
   const buffer=buffers.get(cue.name),now=elapsed();
   if(closed||context.state!=='running'||!buffer||now>cue.at+100)return;
   try{
    const source=context.createBufferSource(),gain=context.createGain(),t=context.currentTime;
    source.buffer=buffer;source.playbackRate.value=cue.rate;source.connect(gain);gain.connect(context.destination);sources.push({source,gain});
    if(cue.name==='crack'){
     gain.gain.setValueAtTime(cue.volume,t);gain.gain.linearRampToValueAtTime(0,t+.4);source.start(t);source.stop(t+.42);
    }else{
     gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(cue.volume,t+.22);
     for(const [at,v] of [[INTRO_TIMING.holdEnd,.22],[4420,.07],[4745,.15],[5135,.04],[5330,.07],[INTRO_TIMING.darkAt,0]])gain.gain.linearRampToValueAtTime(v,t+Math.max(0,at-now)/1000);
     source.start(t);source.stop(t+Math.max(0,INTRO_TIMING.darkAt-now)/1000);
    }
   }catch{}
  },cue.at-elapsed());
 }
 return ()=>{if(closed)return;closed=true;abort.abort();timers.forEach(id=>win.clearTimeout(id));timers.clear();buffers.clear();for(const {source,gain} of sources){try{source.stop()}catch{}try{source.disconnect();gain.disconnect()}catch{}}try{Promise.resolve(context.close()).catch(()=>{})}catch{}};
}
export function installIntro(doc=document,win=window){
 let overlay=null,previous=null,viewCleanup=null;
 const motion=win.matchMedia?.('(prefers-reduced-motion: reduce)')||{matches:true};
 let storage;try{storage=win.sessionStorage}catch{}
 const release=()=>{
  const current=overlay;overlay=null;try{viewCleanup?.()}catch{}viewCleanup=null;
  if(current){try{if(current.open)current.close()}catch{}try{current.remove()}catch{}}
  const target=previous?.isConnected&&previous!==doc.body?previous:doc.querySelector('#main-content, [data-login], #retry-start');
  try{target?.focus({preventScroll:true})}catch{}previous=null;
 };
 const controller=createIntroController({
  storage,reduce:()=>motion.matches,
  mount({finish,reduced}){
   previous=doc.activeElement;const began=win.performance?.now?.()??Date.now();
   overlay=doc.createElement('dialog');overlay.className='intro-overlay'+(reduced?' intro-reduced':'');overlay.setAttribute('aria-label','BeakerBoyz opening');overlay.setAttribute('tabindex','-1');
   for(const [name,value] of Object.entries(INTRO_TIMING))overlay.style.setProperty('--intro-'+name,value+'ms');
   overlay.innerHTML=`<div class="intro-stage"><div class="intro-light" aria-hidden="true"><div class="intro-beam"></div><div class="intro-halo"></div></div><div class="intro-origin">${introArtwork()}<div class="intro-products" aria-hidden="true"></div></div></div>`;
   doc.body.append(overlay);
   if(win.getComputedStyle(overlay).getPropertyValue('--intro-ready').trim()!=='1'||typeof overlay.showModal!=='function')return false;
   const current=overlay,abort=new AbortController(),images=[],root=doc.documentElement,overflow=root?.style?.overflow;
   const seek=typeof win.requestAnimationFrame==='function'&&typeof current.getAnimations==='function';
   const onCancel=e=>e.preventDefault(),onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation()}},onMotion=()=>{if(motion.matches)finish()};
   let deadline=null,watchdog=null,frame=null,cleaned=false,soundCleanup=()=>{};
   viewCleanup=()=>{
    if(cleaned)return;cleaned=true;
    if(deadline!==null)win.clearTimeout(deadline);if(watchdog!==null)win.clearTimeout(watchdog);if(frame!==null)win.cancelAnimationFrame?.(frame);
    abort.abort();soundCleanup();if(root?.style)root.style.overflow=overflow;
    images.forEach(image=>{image.onload=null;image.onerror=null;image.removeAttribute('src')});
    current.removeEventListener('cancel',onCancel);current.removeEventListener('keydown',onKey);motion.removeEventListener?.('change',onMotion);
   };
   current.addEventListener('cancel',onCancel);current.addEventListener('keydown',onKey);motion.addEventListener?.('change',onMotion);
   current.showModal();current.focus({preventScroll:true});if(root?.style)root.style.overflow='hidden';
   watchdog=win.setTimeout(()=>{finish();if(overlay===current)release()},(reduced?INTRO_TIMING.reducedDuration:INTRO_TIMING.duration)+500);
   soundCleanup=installIntroSound(win,began,reduced);
   if(seek){
    const tick=()=>{
     if(cleaned||overlay!==current)return;
     try{const elapsed=(win.performance?.now?.()??Date.now())-began;for(const animation of current.getAnimations({subtree:true})){animation.pause();animation.currentTime=elapsed}frame=win.requestAnimationFrame(tick)}catch{finish()}
    };tick();if(cleaned)return viewCleanup;
   }
   deadline=win.setTimeout(()=>abort.abort(),1800);
   if(!reduced){
    Promise.resolve().then(()=>win.fetch('/assets/intro-products.json',{signal:abort.signal})).then(r=>{if(!r.ok)throw Error('Assets unavailable');return r.json()}).then(manifest=>{
     if(!controller.active||current!==overlay||abort.signal.aborted)return;
     for(const [i,p] of approvedProducts(manifest).entries()){
      const image=new win.Image();images.push(image);image.alt=p.alt;image.className='intro-product intro-product-'+i;image.decoding='async';
      image.onload=()=>{
       const elapsed=(win.performance?.now?.()??Date.now())-began;
       if(abort.signal.aborted||!controller.active||current!==overlay||elapsed>1800)return;
       image.style.setProperty('--scene-elapsed',(seek?0:elapsed)+'ms');current.querySelector('.intro-products').append(image);
      };
      image.onerror=()=>image.remove();image.src=p.src;
     }
    }).catch(()=>{});
   }
   return viewCleanup;
  },unmount:release
 });
 const replay=e=>{if(e.target.closest('[data-intro-replay]'))controller.play({replay:true})};
 const pagehide=()=>controller.finish(),visibility=()=>{if(doc.hidden)controller.finish()};
 doc.addEventListener('click',replay);doc.addEventListener('visibilitychange',visibility);win.addEventListener('pagehide',pagehide);controller.play();
 return ()=>{controller.finish();doc.removeEventListener('click',replay);doc.removeEventListener('visibilitychange',visibility);win.removeEventListener('pagehide',pagehide)};
}
if(typeof document!=='undefined')installIntro();

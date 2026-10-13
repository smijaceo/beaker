// Testable lifecycle; independent of application records, routing and network loading.
export const INTRO_SESSION_KEY='beaker-intro-session-v1';
export const INTRO_TIMING=Object.freeze({duration:6500,reducedDuration:850,crackStart:640,splitStart:700,crackEnd:800,revealStart:1300,circleAt:2800,holdEnd:4100,darkAt:5600,fadeAt:5850});
export function createIntroController({mount,unmount,storage,reduce=()=>false,schedule=setTimeout,cancel=clearTimeout}){
 let active=false,seen=false,timer=null,cleanup=null;
 function finish(){if(!active)return;active=false;if(timer!==null)cancel(timer);timer=null;try{cleanup?.()}catch{}cleanup=null;try{unmount()}catch{}}
 function play({replay=false}={}){
  if(active)finish();
  let stored=false;try{stored=storage?.getItem(INTRO_SESSION_KEY)==='1'}catch{}
  if(!replay&&(seen||stored))return false;
  seen=true;try{storage?.setItem(INTRO_SESSION_KEY,'1')}catch{}
  active=true;
  // Install the hard deadline BEFORE mounting, so decoration can never gate app startup.
  timer=schedule(finish,reduce()?INTRO_TIMING.reducedDuration:INTRO_TIMING.duration);
  try{const mounted=mount({finish,reduced:reduce()});if(!active){try{if(typeof mounted==='function')mounted()}catch{}return false}cleanup=mounted;if(cleanup===false){cleanup=null;finish();return false}}
  catch{finish();return false}
  return true;
 }
 return {play,finish,get active(){return active}};
}

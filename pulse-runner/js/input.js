// Per-pointer ownership extends the existing Bramble games' capture-based controls.
const bindings={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',KeyZ:'jump',Space:'jump',KeyX:'fire',KeyJ:'fire',ShiftLeft:'dash',ShiftRight:'dash',KeyC:'dash',KeyK:'dash',KeyQ:'weapon',KeyE:'weapon'};
export class Input{
 constructor(root,unlock,pause){this.root=root;this.pointers=new Map();this.keys=new Map();this.pending=new Set();this.enabled=false;this.padPaused=false;this.pause=pause;
  root.querySelectorAll('[data-action]').forEach(button=>{
   button.addEventListener('pointerdown',e=>{if(!this.enabled)return;e.preventDefault();unlock();button.setPointerCapture?.(e.pointerId);this.pointers.set(e.pointerId,button.dataset.action);this.pending.add(button.dataset.action);this.paint();});
   button.addEventListener('pointermove',e=>{if(!['left','right','neutral'].includes(this.pointers.get(e.pointerId)))return;const b=document.getElementById('move-pad').getBoundingClientRect();this.pointers.set(e.pointerId,e.clientX<b.left-28||e.clientX>b.right+28||e.clientY<b.top-40||e.clientY>b.bottom+40?'neutral':e.clientX<b.left+b.width/2?'left':'right');this.paint();});
   const off=e=>{this.pointers.delete(e.pointerId);this.paint();};for(const name of['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,off);button.addEventListener('contextmenu',e=>e.preventDefault());
  });
  window.addEventListener('keydown',e=>{if(!this.enabled||e.target.closest('input,select,textarea,dialog'))return;if(e.code==='Escape'||e.code==='KeyP'){e.preventDefault();if(!e.repeat)pause();return;}const a=bindings[e.code];if(!a)return;e.preventDefault();unlock();if(!e.repeat)this.pending.add(a);this.keys.set(e.code,a);this.paint();});
  window.addEventListener('keyup',e=>{if(bindings[e.code]&&this.enabled)e.preventDefault();this.keys.delete(e.code);this.paint();});
  window.addEventListener('blur',()=>{this.clear();pause(true);});document.addEventListener('visibilitychange',()=>{if(document.hidden){this.clear();pause(true);}});
 }
 paint(){const active=new Set([...this.pointers.values(),...this.keys.values()]);this.root.querySelectorAll('[data-action]').forEach(b=>b.classList.toggle('held',active.has(b.dataset.action)));}
 sample(){const a=new Set([...this.pointers.values(),...this.keys.values(),...this.pending]);let p;try{p=Array.from(navigator.getGamepads?.()||[]).find(Boolean);}catch{}
  if(p&&this.enabled){if(p.axes[0]<-.25||p.buttons[14]?.pressed)a.add('left');if(p.axes[0]>.25||p.buttons[15]?.pressed)a.add('right');if(p.buttons[0]?.pressed)a.add('jump');if(p.buttons[2]?.pressed||p.buttons[7]?.pressed)a.add('fire');if(p.buttons[1]?.pressed||p.buttons[5]?.pressed)a.add('dash');if(p.buttons[4]?.pressed)a.add('weapon');if(p.buttons[9]?.pressed&&!this.padPaused)this.pause();this.padPaused=!!p.buttons[9]?.pressed;}
  this.pending.clear();return Object.fromEntries(['left','right','jump','fire','dash','weapon'].map(k=>[k,this.enabled&&a.has(k)]));
 }
 clear(){this.pointers.clear();this.keys.clear();this.pending.clear();this.paint();}
}

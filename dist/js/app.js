import {W,H,PARTS,CATEGORIES,GAMES,partById,starterUnlocks,starterHouse,blankHouse,uid,position,hitTest,unlockReward,validateHouse,History,STAGES,stageById} from './model.js';
import {getState,setState,saveHouse,getHouses} from './storage.js';
import {ART_VERSION,loadArt,spriteElement,drawBackground,drawWorld,thumbnail} from './art.js';
import {AudioPlayer} from './audio.js';
import {MiniGames} from './minigames.js';

const $=id=>document.getElementById(id);
const icons={
house:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
chef:'<path d="M7 14a4 4 0 1 1-2-7 5 5 0 0 1 9-2 4 4 0 1 1 5 9v7H7Z"/><path d="M7 17h12M10 11v3m5-3v3"/>',
album:'<rect x="3" y="3" width="18" height="18" rx="3"/><path d="m3 16 5-5 4 4 3-3 6 6"/><circle cx="15" cy="8" r="1"/>',
settings:'<path d="m9 3-1 3-3 1-2 4 2 3v3l4 3h4l3-2h3l2-4-1-4-3-2-1-4Z"/><circle cx="12" cy="12" r="3"/>',
undo:'<path d="m9 4-6 6 6 5M3 10h11a6 6 0 0 1 0 12"/>',
box:'<path d="m3 8 9-5 9 5v12H3ZM3 8l9 5 9-5M12 13v7"/>',
camera:'<path d="M4 7h4l2-3h4l2 3h4a2 2 0 0 1 2 2v11H2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/>',
plus:'<path d="M12 5v14M5 12h14"/>',back:'<path d="m14 5-7 7 7 7"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>'
};
document.querySelectorAll('[data-icon]').forEach(e=>{e.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[e.dataset.icon]||icons.house}</svg>`;});

let house=starterHouse(),unlocked=starterUnlocks(),category='wall',selected=null,selectedPart=null,ready=false,storageAvailable=true;
let activeView='build',drag=null,scenePointer=null,particles=[],raf=0,lastFrame=0,toastTimer,saveBusy=false;
let camera={s:1,x:0,y:0,width:W,height:H};
let cheerUntil=0,delivery=null;
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const history=new History(),audio=new AudioPlayer(),canvas=$('house-canvas'),ctx=canvas.getContext('2d');
const mini=new MiniGames(audio,finishGame);
const celebratedHouses=new Map();

function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2200);}
function notice(text){$('notice-message').textContent=text;if(!$('notice-dialog').open)$('notice-dialog').showModal();}
function storageError(error){console.warn('Local storage:',error?.name||'unavailable');storageAvailable=false;$('save-status').textContent='保存できません：保護者の方へ';notice('この端末への保存を完了できませんでした。空き容量やブラウザの保存設定を確認してください。今の作品は画面に残っています。画面を閉じる前に、もう一度「ほぞん」をお試しください。');}
async function persistDraft(){try{await setState('draft',house);storageAvailable=true;$('save-status').textContent='つづきは じどうほぞん';return true;}catch(e){storageError(e);return false;}}
function remember(){history.push(house.items);}
function cheer(part=null){cheerUntil=performance.now()+1800;if(part&&!reducedMotion.matches)delivery={sprite:part.sprite,start:performance.now()};render();}
function changed(message=true){persistDraft();render();if(message){audio.effect('build');cheer();}}
function burst(x,y){if(!reducedMotion.matches)for(let i=0;i<16;i++)particles.push({x,y,vx:(Math.random()-.5)*130,vy:-30-Math.random()*110,life:1,size:3+Math.random()*5,color:['#ed784f','#f6cc48','#37a3a4','#fff4c8'][i%4]});render();}
function resize(){
  const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
  const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);
  const s=Math.min(r.width/W,r.height/H);camera={s,x:(r.width-W*s)/2,y:(r.height-H*s)/2,width:r.width,height:r.height,dpr};render();
}
function render(){if(!raf)raf=requestAnimationFrame(paint);}
function paint(time){
  raf=0;if(!ready||activeView!=='build')return;const dt=Math.min((time-lastFrame)/1000,.05)||.016;lastFrame=time;
  ctx.setTransform(camera.dpr||1,0,0,camera.dpr||1,0,0);ctx.clearRect(0,0,camera.width,camera.height);
  drawBackground(ctx,camera.width,camera.height,house.stage);
  if(delivery&&(time-delivery.start>=2400||reducedMotion.matches))delivery=null;
  const cheering=time<cheerUntil&&!reducedMotion.matches;
  ctx.translate(camera.x,camera.y);ctx.scale(camera.s,camera.s);drawWorld(ctx,house,selected,particles,false,{time,cheer:cheering,delivery:delivery?{sprite:delivery.sprite,progress:Math.max(0,(time-delivery.start)/2400)}:null});
  for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=80*dt;p.life-=dt*1.4;}particles=particles.filter(p=>p.life>0);
  $('undo').disabled=history.stack.length===0;$('remove').disabled=!selected;
  if(particles.length||cheering||delivery)render();
}
function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left-camera.x)/camera.s,y:(e.clientY-r.top-camera.y)/camera.s};}
function withinCanvas(e){const r=canvas.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;}
function addPart(id,x,y){const p=partById(id);if(!p||!unlocked.includes(id))return;remember();const pos=position(p,x,y),item={id:uid(),part:id,...pos};house.items.push(item);selected=item.id;burst(pos.x,pos.y);changed();cheer(p);}

function updateStageButton(){
  const stage=stageById(house.stage);$('stage-label').textContent=stage.name;
  audio.setStage(stage.id);
  $('stage-preview').src=new URL('../assets/'+stage.file,import.meta.url).href;
}
$('choose-stage').onclick=()=>{
  if(!ready||saveBusy||drag)return;
  $('stage-options').replaceChildren();
  for(const stage of STAGES){
    const b=document.createElement('button');b.className='stage-card';b.setAttribute('aria-pressed',String(stage.id===stageById(house.stage).id));
    const img=document.createElement('img');img.src=new URL('../assets/'+stage.file,import.meta.url).href;img.alt='';
    const label=document.createElement('span');label.textContent=stage.name;b.append(img,label);
    b.onclick=()=>{house.stage=stage.id;updateStageButton();audio.resume();$('stage-dialog').close();persistDraft();render();};
    $('stage-options').append(b);
  }
  $('stage-dialog').showModal();
};

function makeCategories(){
  $('categories').replaceChildren();for(const c of CATEGORIES){const b=document.createElement('button');b.className=`category ${category===c.id?'active':''}`;b.role='tab';b.id=`tab-${c.id}`;b.setAttribute('aria-selected',String(category===c.id));b.setAttribute('aria-controls','parts');b.append(spriteElement(c.sprite));const label=document.createElement('span');label.textContent=c.name;b.append(label);b.onclick=()=>{category=c.id;selectedPart=null;makeCategories();makeParts();audio.resume();};$('categories').append(b);}
}
function makeParts(){
  $('parts').replaceChildren();$('parts').setAttribute('aria-labelledby',`tab-${category}`);
  for(const p of PARTS.filter(p=>p.category===category)){
    const locked=!unlocked.includes(p.id),b=document.createElement('button');b.className=`part-button ${locked?'locked':''} ${selectedPart===p.id?'selected':''}`;b.dataset.part=p.id;b.setAttribute('aria-label',locked?`${p.name}。おかしをつくると使えます`:p.name);b.setAttribute('aria-pressed',String(selectedPart===p.id));b.title=p.name;b.append(spriteElement(p.sprite));
    const name=document.createElement('small');name.className='part-name';name.textContent=p.name;b.append(name);
    if(locked){const badge=document.createElement('span');badge.className='part-badge';badge.append(spriteElement(24));b.append(badge);b.onclick=()=>{if(ready)mini.open(p.game);};}
    else{
      b.addEventListener('pointerdown',e=>{if(!ready||drag||scenePointer!==null)return;e.preventDefault();audio.resume();b.setPointerCapture(e.pointerId);drag={part:p.id,pointerId:e.pointerId,x:e.clientX,y:e.clientY,moved:false};$('drag-ghost').replaceChildren(spriteElement(p.sprite));});
      b.addEventListener('pointermove',e=>{if(!drag||drag.pointerId!==e.pointerId)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>9)drag.moved=true;if(drag.moved){const g=$('drag-ghost');g.style.display='block';g.style.transform=`translate(${e.clientX-50}px,${e.clientY-65}px)`;}});
      b.addEventListener('pointerup',e=>{if(!drag||drag.pointerId!==e.pointerId)return;const d=drag;drag=null;$('drag-ghost').style.display='none';if(d.moved&&withinCanvas(e)){const pos=point(e);addPart(p.id,pos.x,pos.y);}else if(!d.moved){selectedPart=p.id;selected=null;makeParts();render();$('guide-text').textContent='おきたいところを タップ！';}});
      b.addEventListener('pointercancel',()=>{drag=null;$('drag-ghost').style.display='none';});
      b.addEventListener('click',e=>{if(e.detail===0){selectedPart=p.id;selected=null;makeParts();render();$('guide-text').textContent='おきたいところを タップ！';}});
    }
    $('parts').append(b);
  }
}
canvas.addEventListener('pointerdown',e=>{
  if(!ready||scenePointer!==null||drag)return;e.preventDefault();audio.resume();const pos=point(e);canvas.setPointerCapture(e.pointerId);
  if(selectedPart){scenePointer=e.pointerId;const id=selectedPart;selectedPart=null;addPart(id,pos.x,pos.y);makeParts();return;}
  const item=hitTest(house.items,pos.x,pos.y);selected=item?.id??null;scenePointer=e.pointerId;
  if(!item&&((Math.abs(pos.x-365)<65&&Math.abs(pos.y-581)<95)||(Math.abs(pos.x-867)<80&&Math.abs(pos.y-545)<70)||(Math.abs(pos.x-940)<100&&Math.abs(pos.y-650)<65))){cheer();$('guide-text').textContent='いっしょに おうちを たてよう！';audio.effect('soft');}
  if(item)drag={item,initial:structuredClone(house.items),x:pos.x-item.x,y:pos.y-item.y,startX:pos.x,startY:pos.y,moved:false,pointerId:e.pointerId};render();
});
canvas.addEventListener('pointermove',e=>{if(scenePointer!==e.pointerId||!drag?.item)return;e.preventDefault();const p=point(e);if(Math.hypot(p.x-drag.startX,p.y-drag.startY)>6)drag.moved=true;if(drag.moved){Object.assign(drag.item,position(partById(drag.item.part),p.x-drag.x,p.y-drag.y));render();}});
canvas.addEventListener('pointerup',e=>{if(scenePointer!==e.pointerId)return;scenePointer=null;if(drag?.item&&drag.moved){history.push(drag.initial);const i=house.items.indexOf(drag.item);house.items.splice(i,1);house.items.push(drag.item);burst(drag.item.x,drag.item.y);changed();}drag=null;});
canvas.addEventListener('pointercancel',()=>{if(drag?.item){house.items=drag.initial;render();}drag=null;scenePointer=null;});
canvas.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&selectedPart){e.preventDefault();addPart(selectedPart,600,440);selectedPart=null;makeParts();}});

$('undo').onclick=()=>{const prior=history.pop();if(prior){house.items=prior;selected=null;audio.resume();changed(false);toast('ひとつ もどしたよ');}};
$('remove').onclick=()=>{if(!selected)return;remember();house.items=house.items.filter(i=>i.id!==selected);selected=null;changed(false);audio.effect('soft');toast('おかしを しまったよ');};
async function saveCurrent(showFeedback=true){
  try{const record={...structuredClone(house),savedAt:Date.now(),artVersion:ART_VERSION,thumbnail:thumbnail(house)};await saveHouse(record);house.savedAt=record.savedAt;storageAvailable=true;await setState('draft',house);$('save-status').textContent='アルバムに ほぞんしたよ';if(showFeedback){toast('おうちの できあがり！');$('guide-text').textContent='みんなで たてた おうちだね！';cheer();burst(600,270);audio.effect('win');const signature=JSON.stringify([house.stage,house.items]);if(house.items.length&&celebratedHouses.get(house.id)!==signature){audio.celebrate('house');celebratedHouses.set(house.id,signature);}}return true;}catch(e){storageError(e);return false;}
}
$('save').onclick=async()=>{if(!ready||saveBusy)return;saveBusy=true;$('save').disabled=true;audio.resume();await saveCurrent();saveBusy=false;$('save').disabled=false;};
$('new-house').onclick=async()=>{if(!ready||saveBusy)return;saveBusy=true;$('new-house').disabled=true;try{if(house.items.length&&!await saveCurrent(false))return;house=blankHouse(house.stage);updateStageButton();selected=null;selectedPart=null;history.clear();await persistDraft();render();makeParts();toast('あたらしい おうちを つくろう');$('guide-text').textContent='かべや やねを おいてみよう';category='wall';makeCategories();makeParts();}finally{saveBusy=false;$('new-house').disabled=false;}};

async function showView(view){
  if(!ready)return;activeView=view;for(const name of ['build','games','gallery'])$(name+'-view').hidden=name!==view;
  document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  if(view==='build')requestAnimationFrame(resize);if(view==='gallery')await loadGallery();audio.resume();
}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>showView(b.dataset.view));$('more-parts').onclick=()=>showView('games');
function makeGames(){
  $('game-cards').replaceChildren();for(const g of GAMES){
    const b=document.createElement('button');b.className='game-card';const scene=document.createElement('span');scene.className='job-picture';scene.append(spriteElement(g.sprite,'game-art'));if(g.sprite!==g.crew)scene.append(spriteElement(g.crew,'game-helper'));b.append(scene);const h=document.createElement('h3');h.textContent=g.name;const small=document.createElement('small');small.textContent=g.action;const arrow=document.createElement('span');arrow.className='game-arrow';arrow.textContent='▶';arrow.setAttribute('aria-hidden','true');b.append(h,small,arrow);b.onclick=()=>mini.open(g.id);$('game-cards').append(b);
  }
}
async function finishGame(id){
  const reward=unlockReward(id,unlocked);unlocked=reward.unlocked;const ids=reward.fresh.length?reward.fresh:PARTS.filter(p=>p.game===id).slice(0,2).map(p=>p.id);
  try{await setState('unlocked',unlocked);}catch(e){storageError(e);}
  $('reward-message').textContent=reward.fresh.length?'おうちの ざいりょうが できたよ！':'みんなで おかしを つくったよ！';$('reward-parts').replaceChildren(...ids.map(id=>spriteElement(partById(id).sprite)));
  $('use-reward').onclick=()=>{$('reward-dialog').close();category=partById(ids[0]).category;selectedPart=ids[0];selected=null;makeCategories();makeParts();showView('build');$('guide-text').textContent='おきたいところを タップ！';};
  $('reward-dialog').showModal();audio.effect('win');audio.celebrate(id);makeParts();
}
async function loadGallery(){
  const list=$('gallery-list');list.textContent='アルバムを ひらいているよ…';
  try{
    const all=(await getHouses()).filter(validateHouse).sort((a,b)=>b.savedAt-a.savedAt);list.replaceChildren();
    if(!all.length){const empty=document.createElement('div');empty.className='empty-gallery';empty.innerHTML='<span aria-hidden="true">🖼️</span><p>つくったおうちが ここに ならぶよ。<br>カメラのボタンで ほぞんしてみよう。</p>';const b=document.createElement('button');b.className='primary-button';b.textContent='おうちを つくる';b.onclick=()=>showView('build');empty.append(b);list.append(empty);return;}
    for(const [i,record] of all.entries()){
      const b=document.createElement('button');b.className='gallery-card';b.setAttribute('aria-label',`おうち ${all.length-i}をひらく`);const img=document.createElement('img');img.src=record.artVersion===ART_VERSION&&record.thumbnail?record.thumbnail:thumbnail(record);img.alt=`おかしのおうち ${all.length-i}`;img.loading='lazy';const p=document.createElement('p');p.textContent=`おうち ${all.length-i}`;const date=document.createElement('span');date.textContent=new Date(record.savedAt).toLocaleDateString('ja-JP',{month:'long',day:'numeric'});p.append(date);b.append(img,p);
      b.onclick=async()=>{if(saveBusy)return;saveBusy=true;try{if(house.items.length&&!await saveCurrent(false))return;const latest=record.id===house.id?structuredClone(house):record;house={id:latest.id,name:latest.name,items:structuredClone(latest.items),savedAt:latest.savedAt,stage:stageById(latest.stage).id};updateStageButton();history.clear();selected=null;selectedPart=null;await persistDraft();makeParts();showView('build');toast('つづきを つくろう！');}finally{saveBusy=false;}};list.append(b);
    }
  }catch(e){list.textContent='アルバムを開けませんでした。保護者の方と、保存設定を確認してください。';storageError(e);}
}

$('settings-button').onclick=()=>{$('parent-gate').hidden=false;$('parent-settings').hidden=true;$('parent-dialog').showModal();};
document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(b.dataset.answer==='11'){$('parent-gate').hidden=true;$('parent-settings').hidden=false;for(const key of ['bgm','sfx','voice'])$('setting-'+key).checked=audio.settings[key];}else toast('もういちど えらんでください');});
for(const key of ['bgm','sfx','voice'])$('setting-'+key).onchange=async e=>{audio.resume();audio.update(key,e.target.checked);try{await setState('settings',audio.settings);}catch(error){storageError(error);}};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
document.addEventListener('visibilitychange',()=>{if(document.hidden){audio.stop();if(ready)persistDraft();}else if(ready){audio.resume();render();}});
window.addEventListener('pagehide',()=>{if(ready)persistDraft();audio.stop();});
new ResizeObserver(resize).observe($('canvas-wrap'));

async function registerOffline(){
  if(!('serviceWorker'in navigator)){$('offline-status').textContent='このブラウザではオフライン対応を利用できません。Safariで開いてください。';return;}
  try{
    const registration=await navigator.serviceWorker.register(new URL('../sw.js',import.meta.url),{scope:new URL('../',import.meta.url).pathname});
    const mark=()=>{$('offline-status').textContent='✓ オフラインの準備ができました';};
    if(registration.active)mark();else{const worker=registration.installing||registration.waiting;worker?.addEventListener('statechange',()=>{if(worker.state==='activated')mark();else if(worker.state==='redundant')$('offline-status').textContent='準備が完了していません。通信状態を確認して、もう一度開いてください。';});}
    navigator.serviceWorker.addEventListener('controllerchange',mark);
  }catch(e){$('offline-status').textContent='オフラインの準備ができませんでした。通信できる状態で再度開いてください。';}
}
async function init(){
  let saved=[];const results=await Promise.allSettled([loadArt(),Promise.all([getState('draft'),getState('unlocked'),getState('settings')])]);
  if(results[0].status==='rejected'){$('loading').querySelector('p').textContent='おかしを読み込めませんでした。通信を確認して、もう一度開いてください。';return;}
  if(results[1].status==='fulfilled'){saved=results[1].value;if(validateHouse(saved[0]))house={...saved[0],stage:stageById(saved[0].stage).id};if(Array.isArray(saved[1]))unlocked=[...new Set([...starterUnlocks(),...saved[1].filter(id=>partById(id))])];if(saved[2])for(const key of ['bgm','sfx','voice'])if(typeof saved[2][key]==='boolean')audio.settings[key]=saved[2][key];}
  else storageError(results[1].reason);
  for(const [id,index] of [['brand-art',28],['guide-crew',24],['work-button-art',24],['work-friend',26],['reward-crew',27]])$(id).replaceChildren(spriteElement(index));
  ready=true;updateStageButton();$('loading').hidden=true;makeCategories();makeParts();makeGames();resize();registerOffline();
  if(storageAvailable)persistDraft();
}
init();

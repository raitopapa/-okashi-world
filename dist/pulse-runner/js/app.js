import {STEP,SAVE_KEY,STAGES,WEAPONS,DIFFICULTIES,freshSave,validateSave} from './levels.js';
import {Game} from './engine.js';
import {Renderer,stagePreview} from './render.js';
import {Input} from './input.js';
import {Sound} from './audio.js';

const $=id=>document.getElementById(id);
let stored=null;try{stored=JSON.parse(localStorage.getItem(SAVE_KEY));}catch{}
const save=stored?validateSave(stored):freshSave();
if(!stored)save.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sound=new Sound(save.muted);
const game=new Game(save,onEvent);
const renderer=new Renderer($('game'),game);
const input=new Input($('controls'),()=>sound.unlock(),togglePause);
let toastTimer,primaryAction=()=>{},helpResume=false,lastMode='',hudTime=0,storageFailed=false;

function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch{if(!storageFailed){storageFailed=true;toast('このブラウザでは保存できません。現在のプレイは続けられます。');}}}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3100);}
function onEvent(type,value){
 if(type==='music'){sound.setTrack(value);return;}
 if(type==='sfx'){sound.effect(value);return;}
 if(type==='save'){persist();return;}
 if(type==='weapon'){toast(WEAPONS.find(w=>w.id===value).note);return;}
 if(type==='checkpoint'){sound.effect('checkpoint');toast('チェックポイント到達 — 体力回復・自動保存');}
 if(type==='core')toast('データコアを回収！');
 if(type==='boss')toast(value+' — BOSS SIGNAL');
 if(type==='rage')toast('PHASE 02 — 攻撃が加速する！');
 if(type==='pause'){input.clear();sound.setPaused(true);showResult('paused');}
 if(type==='resume'){input.clear();sound.setPaused(false);$('result-screen').hidden=true;}
 if(type==='dead'||type==='clear'){input.clear();showResult(type);}
}
function sync(){
 const m=game.mode;lastMode=m;$('app').dataset.mode=m;
 $('title-screen').hidden=m!=='title';$('select-screen').hidden=m!=='select';
 const field=!['title','select'].includes(m);$('hud').hidden=!field;$('controls').hidden=m!=='playing';
 input.enabled=m==='playing'||m==='paused';
 $('top-caption').textContent=m==='title'?'A SIDE-SCROLLING ACTION ADVENTURE':m==='select'?'MISSION CONTROL':game.level.en;
 $('continue').hidden=!save.checkpoint;
 renderer.resize();updateHud();
}
function menu(mode='select'){
 if(['playing','paused','dying','dead'].includes(game.mode))game.persistCheckpoint();
 game.mode=mode;input.clear();$('result-screen').hidden=true;sound.setPaused(false);sound.setTrack('menu');missions();sync();
}
function start(id,resume=false){
 sound.unlock();sound.setPaused(false);input.clear();if(!game.load(id,resume))return;
 game.persistCheckpoint();$('result-screen').hidden=true;sync();$('game').focus({preventScroll:true});
 if(document.fullscreenElement)screen.orientation?.lock?.('landscape').catch(()=>{});
}
function togglePause(onlyPause=false){if(game.mode==='playing'){game.pause();sync();}else if(game.mode==='paused'&&!onlyPause&&!$('settings').open){sound.unlock();game.resume();sync();}}
function missions(){
 $('missions').replaceChildren();
 for(const s of STAGES){
  const locked=s.id===3&&![0,1,2].every(i=>save.cleared.includes(i)),cleared=save.cleared.includes(s.id),b=document.createElement('button');
  b.className='mission'+(s.id===3?' mission-final':'')+(cleared?' cleared':'');b.disabled=locked;b.style.setProperty('--accent',s.accent);
  b.setAttribute('aria-label',s.name+(locked?'・3つのボス撃破で解放':cleared?'・クリア済み、再出発':'・出発'));
  const reward=WEAPONS.find(w=>w.id===s.reward);
  b.innerHTML=s.id===3?`<div class="mission-body"><span class="mission-code">Ω</span><h3>${s.name}</h3><p>${s.sub}</p><span class="final-status">${locked?'3つのボス撃破で解放':cleared?'CLEAR ✓':'出発 →'}</span></div>`:`<canvas aria-hidden="true"></canvas><div class="mission-body"><div class="mission-code"><span>${s.code} / ${s.en}</span><span>${cleared?'CLEAR ✓':'READY'}</span></div><h3>${s.name}</h3><p>${s.sub}<br>${s.gimmick}</p><div class="mission-weapon"><span class="weapon-square">${reward.short}</span><span>${reward.name}を獲得</span><span style="margin-left:auto">${save.cores[s.id]||0}/3 ◇</span></div></div>`;
  $('missions').append(b);if(s.id<3)stagePreview(b.querySelector('canvas'),s.id);b.addEventListener('click',()=>start(s.id));
 }
 difficultyUI();
}
function difficultyUI(){document.querySelectorAll('[data-difficulty]').forEach(b=>{const selected=b.dataset.difficulty===save.difficulty;b.classList.toggle('chosen',selected);b.setAttribute('aria-pressed',String(selected));});$('difficulty-tip').textContent=DIFFICULTIES[save.difficulty].tip;$('difficulty-setting').value=save.difficulty;}
function showResult(mode){
 $('result-screen').hidden=false;const clear=mode==='clear',dead=mode==='dead';
 $('result-eyebrow').textContent=clear?'SIGNAL RESTORED':dead?'CONNECTION LOST':'TAKE A BREATH';
 $('result-symbol').textContent=clear?'✦':dead?'↻':'Ⅱ';
 $('result-title').textContent=clear?(game.level.id===3?'都市に、パルスが戻った。':'ミッションクリア！'):dead?'もう一度、ここから。':'ひとやすみ';
 const reward=WEAPONS.find(w=>w.id===game.level.reward);
 $('result-copy').textContent=clear?(reward?`新武器「${reward.name}」を獲得。${reward.note}`:'すべてのシグナルを復旧！各都市のデータコアとハイスコアに挑戦しよう。'):dead?'チェックポイントから再出発。難しいときは設定でアシストを選べます。':'準備ができたら、冒険を続けよう。';
 $('result-stats').textContent=clear?`SCORE ${String(game.score).padStart(6,'0')}  ·  CORE ${save.cores[game.level.id]||0}/3  ·  ${Math.floor(game.elapsed/60)}:${String(Math.floor(game.elapsed%60)).padStart(2,'0')}`:dead?`CHECKPOINT ${game.checkpoint}/2`:'';
 $('result-primary').textContent=clear?'次のミッションへ →':dead?'リトライ ↻':'プレイを続ける →';
 primaryAction=clear?()=>menu('select'):dead?()=>{sound.unlock();sound.setPaused(false);game.retry();$('result-screen').hidden=true;sync();$('game').focus({preventScroll:true});}:()=>togglePause();
 sync();
}
function openHelp(){helpResume=game.mode==='playing';if(helpResume)game.pause();input.clear();$('auto-fire').checked=save.autoFire;$('reduce-motion').checked=save.reducedMotion;difficultyUI();$('settings').showModal();sync();}
$('settings').addEventListener('close',()=>{if(helpResume&&game.mode==='paused')game.resume();helpResume=false;sync();});
$('start').onclick=()=>{sound.unlock();menu();};$('continue').onclick=()=>{if(save.checkpoint)start(save.checkpoint.stage,true);};
$('brand').onclick=()=>menu('title');$('select-back').onclick=()=>menu('title');
$('help').onclick=openHelp;$('title-help').onclick=openHelp;$('pause').onclick=()=>togglePause();
$('result-primary').onclick=()=>primaryAction();$('result-secondary').onclick=()=>menu();
$('weapon-select').onclick=()=>{if(game.mode==='playing'){sound.unlock();game.cycleWeapon();updateHud();}};
function soundUI(){$('sound').setAttribute('aria-pressed',String(!save.muted));$('sound').setAttribute('aria-label',save.muted?'音をオンにする':'音をオフにする');$('sound').classList.toggle('muted',save.muted);}
$('sound').onclick=()=>{sound.unlock();save.muted=!save.muted;sound.setMuted(save.muted);soundUI();persist();};
$('fullscreen').onclick=async()=>{sound.unlock();try{if(document.fullscreenElement)await document.exitFullscreen();else if($('app').requestFullscreen){await $('app').requestFullscreen();await screen.orientation?.lock?.('landscape').catch(()=>{});}else toast('端末を横向きに。ホーム画面に追加すると広く遊べます。');}catch{toast('端末を横向きにすると、広く遊べます。');}};
document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-pressed',String(!!document.fullscreenElement));renderer.resize();});
document.querySelectorAll('[data-difficulty]').forEach(b=>b.onclick=()=>{save.difficulty=b.dataset.difficulty;difficultyUI();persist();});
$('difficulty-setting').onchange=e=>{save.difficulty=e.target.value;difficultyUI();persist();};
$('auto-fire').onchange=e=>{save.autoFire=e.target.checked;persist();};$('reduce-motion').onchange=e=>{save.reducedMotion=e.target.checked;persist();};
window.addEventListener('resize',()=>{input.clear();renderer.resize();});
window.addEventListener('pagehide',()=>{if(['playing','paused','dying','dead'].includes(game.mode))game.persistCheckpoint();sound.setPaused(true);});
window.addEventListener('pageshow',()=>sound.setPaused(document.hidden||game.mode==='paused'));
document.addEventListener('visibilitychange',()=>{if(document.hidden)sound.setPaused(true);else if(game.mode!=='paused')sound.setPaused(false);});
function updateHud(){
 const p=game.player,w=WEAPONS.find(w=>w.id===p.weapon),l=game.level,b=game.boss;
 $('hp-fill').style.width=`${p.hp/p.maxHp*100}%`;$('hp-label').textContent=`${p.hp} / ${p.maxHp}`;
 $('hp-track').setAttribute('aria-valuemin','0');$('hp-track').setAttribute('aria-valuemax',p.maxHp);$('hp-track').setAttribute('aria-valuenow',p.hp);
 $('difficulty-label').textContent=game.difficulty.name;
 $('core-count').textContent=`◇ ${l.items.filter(i=>i.type==='core'&&game.collected.has(i.id)).length}/3`;
 $('weapon-letter').textContent=w.short;$('weapon-letter').style.color=w.color;$('weapon-name').textContent=w.name;
 $('energy-fill').style.width=`${p.energy/28*100}%`;$('charge-fill').style.width=`${Math.min(1,p.charge)*100}%`;
 $('stage-label').textContent=l.code+' / '+l.en;$('score').textContent=String(game.score).padStart(6,'0');
 $('boss-hud').hidden=!b.active||b.dead;$('boss-name').textContent=l.boss;$('boss-phase').textContent='PHASE 0'+b.phase;$('boss-fill').style.width=`${b.hp/b.maxHp*100}%`;
 $('boss-meter').setAttribute('aria-valuemin','0');$('boss-meter').setAttribute('aria-valuemax',b.maxHp);$('boss-meter').setAttribute('aria-valuenow',b.hp);
}
missions();sound.setTrack('menu');soundUI();sync();
let last=performance.now(),accumulator=0;
function frame(now){const dt=Math.min(.1,Math.max(0,(now-last)/1000));last=now;accumulator=Math.min(accumulator+dt,STEP*6);while(accumulator>=STEP){game.tick(STEP,input.sample());accumulator-=STEP;}if(lastMode!==game.mode)sync();hudTime+=dt;if(hudTime>.07){hudTime=0;updateHud();}renderer.render(dt);requestAnimationFrame(frame);}
requestAnimationFrame(frame);
async function offline(){
 const label=$('offline-status').querySelector('span');
 if(!('serviceWorker' in navigator)){label.textContent='オンラインでプレイ';return;}
 try{
  const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
  if(!reg.active){const worker=reg.installing||reg.waiting;if(worker)await new Promise((resolve,reject)=>{const check=()=>{if(worker.state==='activated')resolve();if(worker.state==='redundant')reject(new Error('install failed'));};worker.addEventListener('statechange',check);check();});}
  if(reg.active){label.textContent='オフライン準備完了';$('offline-status').classList.add('ready');}
  else label.textContent='オンラインでプレイ';
 }catch{label.textContent='オンラインでプレイ';}
}
offline();

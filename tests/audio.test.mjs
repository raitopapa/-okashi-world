import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioPlayer} from '../dist/js/audio.js';

function setup(t,settings={}){
  const timers=new Map(),fades=[],buses=[];let next=1;
  t.mock.method(globalThis,'setInterval',(fn,delay)=>{const id=next++;timers.set(id,{fn,delay});return id;});
  t.mock.method(globalThis,'clearInterval',id=>timers.delete(id));
  t.mock.method(globalThis,'setTimeout',fn=>{fades.push(fn);return next++;});
  const oldWindow=globalThis.window,oldDocument=globalThis.document;
  globalThis.window={};globalThis.document={hidden:false};
  t.after(()=>{if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;});
  const audio=new AudioPlayer(settings),played=[];
  audio.context={state:'running',currentTime:0,destination:{},
    suspend(){this.state='suspended';return Promise.resolve();},
    resume(){this.state='running';return Promise.resolve();},
    createGain(){const bus={disconnected:false,connect(){},disconnect(){this.disconnected=true;},gain:{value:1,cancelScheduledValues(){},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;}}};buses.push(bus);return bus;}
  };
  audio.tone=(...args)=>played.push(args);
  return{audio,timers,fades,buses,played};
}

test('switching stages changes music and retires the old track without duplicate loops',t=>{
  const {audio,timers,fades,buses,played}=setup(t);
  audio.resume();const forest=played.at(-1),forestBeat=[...timers.values()][0].delay;
  audio.setStage('seaside');const sea=played.at(-1),seaTimer=audio.timer;
  assert.notEqual(forest[0],sea[0]);assert.notEqual(forest[4],sea[4]);
  assert.notEqual(forestBeat,[...timers.values()][0].delay);assert.equal(timers.size,1);
  assert.equal(buses[0].gain.value,0);fades.shift()();assert.ok(buses[0].disconnected);
  audio.setStage('seaside');assert.equal(audio.timer,seaTimer);
  audio.setStage('snow');assert.equal(timers.size,1);assert.notEqual(played.at(-1)[0],sea[0]);
  audio.setStage('legacy');assert.equal(audio.stage,'orchard');assert.equal(timers.size,1);
});

test('changing the saved stage respects muted BGM and starts the chosen track when enabled',t=>{
  const {audio,timers,played}=setup(t,{bgm:false});
  audio.setStage('snow');audio.resume();assert.equal(timers.size,0);assert.equal(played.length,0);
  audio.update('bgm',true);assert.equal(audio.stage,'snow');assert.equal(timers.size,1);assert.ok(played.length>0);
  audio.update('bgm',false);audio.setStage('seaside');assert.equal(timers.size,0);
  assert.equal(audio.settings.bgm,false);assert.equal(audio.settings.sfx,true);
});

test('background pause and pending context resume cannot restart muted or hidden music',async t=>{
  const {audio,timers}=setup(t);
  audio.resume();globalThis.document.hidden=true;audio.stop();assert.equal(timers.size,0);
  audio.setStage('snow');audio.resume();await Promise.resolve();assert.equal(timers.size,0);
  globalThis.document.hidden=false;audio.resume();assert.equal(timers.size,1);
  audio.stop();audio.resume();audio.update('bgm',false);await Promise.resolve();assert.equal(timers.size,0);
});

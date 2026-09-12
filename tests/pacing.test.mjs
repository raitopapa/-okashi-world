import test from 'node:test';
import assert from 'node:assert/strict';
import {STAGES,stageById,blankHouse,starterHouse,validateHouse,GAMES,gameProgress} from '../dist/js/model.js';
import {CelebrationCues} from '../dist/js/celebrations.js';

test('stage choices survive serialization and legacy houses keep their contents',()=>{
  const original=starterHouse(),items=structuredClone(original.items);
  for(const stage of STAGES){
    const saved=JSON.parse(JSON.stringify({...original,stage:stage.id}));
    assert.ok(validateHouse(saved));assert.equal(stageById(saved.stage).id,stage.id);
    assert.deepEqual(saved.items,items);assert.equal(blankHouse(stage.id).stage,stage.id);
  }
  delete original.stage;assert.ok(validateHouse(original));
  assert.equal(stageById(original.stage).id,'orchard');assert.equal(stageById('removed-stage').id,'orchard');
  assert.deepEqual(original.items,items);
});

test('crafting completes from actions, while baking alone has a short timer',()=>{
  for(const game of GAMES.filter(g=>g.id!=='oven')){
    assert.equal(gameProgress({...game,count:0,elapsed:999}),0);
    assert.equal(gameProgress({...game,count:game.target/2,elapsed:0}),.5);
    assert.equal(gameProgress({...game,count:game.target,elapsed:0}),1);
    assert.equal(gameProgress({...game,count:game.target+10,elapsed:0}),1);
  }
  const oven=GAMES.find(g=>g.id==='oven');assert.ok(oven.duration<=2);
  assert.equal(gameProgress({...oven,baking:false,elapsed:999}),0);
  assert.equal(gameProgress({...oven,baking:true,elapsed:1}),.5);
  assert.equal(gameProgress({...oven,baking:true,elapsed:2}),1);
});

test('speech is restricted to completions and has a shared cooldown',()=>{
  const cues=new CelebrationCues();
  for(const event of ['place','move','start','crew'])assert.equal(cues.next(event,0),null);
  assert.equal(typeof cues.next('house',0),'string');
  for(const event of ['cookie','chocolate','catch','oven','house'])assert.equal(cues.next(event,24999),null);
  assert.equal(typeof cues.next('cookie',25000),'string');
  assert.equal(cues.next('house',25001),null);
});

test('each completion rotates through four lines; suppressed calls consume none',()=>{
  for(const event of ['house','cookie','chocolate','catch','oven']){
    const cues=new CelebrationCues(),spoken=[];
    for(let i=0;i<4;i++){
      spoken.push(cues.next(event,i*25000));assert.equal(cues.next(event,i*25000+1),null);
    }
    assert.equal(new Set(spoken).size,4);assert.equal(cues.next(event,100000),spoken[0]);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {PARTS,GAMES,starterUnlocks,unlockReward,starterHouse,blankHouse,validateHouse,position,partById,hitTest,History,ordered} from '../dist/js/model.js';
test('each game unlocks 1–2 relevant pieces; repetition never removes progress',()=>{
  let unlocked=starterUnlocks();
  for(const game of GAMES){const next=unlockReward(game.id,unlocked);assert.ok(next.fresh.length>=1&&next.fresh.length<=2);assert.ok(next.fresh.every(id=>partById(id).game===game.id));assert.ok(unlocked.every(id=>next.unlocked.includes(id)));unlocked=next.unlocked;const again=unlockReward(game.id,unlocked);assert.equal(again.fresh.length,0);assert.deepEqual(again.unlocked,unlocked);}
  assert.equal(unlocked.length,PARTS.length);
});
test('repeated placements use independent IDs and stay within the play area',()=>{
  const a=starterHouse(),b=starterHouse();assert.notEqual(a.id,b.id);assert.notEqual(a.items[0].id,b.items[0].id);assert.ok(validateHouse(a));assert.ok(validateHouse(blankHouse()));
  for(const part of PARTS){const p=position(part,-10000,10000);assert.equal(p.x,part.w/2);assert.equal(p.y,750-part.h/2);}
});
test('frontmost visible part is picked; ordering does not mutate saved data',()=>{
  const items=[{id:'roof',part:'chocolate-roof',x:500,y:300},{id:'wall',part:'biscuit',x:500,y:300},{id:'star',part:'star',x:500,y:300}];
  assert.equal(hitTest(items,500,300).id,'star');assert.deepEqual(items.map(i=>i.id),['roof','wall','star']);assert.deepEqual(ordered(items).map(i=>i.id),['wall','roof','star']);assert.equal(hitTest(items,0,0),undefined);
});
test('undo restores an independent pre-drag snapshot, including removed parts',()=>{
  const h=starterHouse(),old=structuredClone(h.items),history=new History();history.push(h.items);h.items[0].x=20;h.items.splice(2,1);const restored=history.pop();assert.deepEqual(restored,old);assert.equal(history.pop(),undefined);
});
test('invalid persisted records are rejected before rendering',()=>{
  assert.equal(validateHouse({id:'a',items:[{id:'i',part:'nonexistent',x:0,y:0}]}),false);assert.equal(validateHouse({id:'a',items:[{id:'i',part:'biscuit',x:Infinity,y:0}]}),false);assert.equal(validateHouse(null),false);
});

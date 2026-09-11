import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ATLAS_MAP} from '../dist/js/atlas-map.js';
import {PARTS,GAMES,CATEGORIES,validateHouse,partById,ordered} from '../dist/js/model.js';

test('every part and worker resolves to a complete crop within its actual PNG',()=>{
  let count=0;
  for(const atlas of ATLAS_MAP){
    const png=fs.readFileSync(new URL('../dist/assets/'+atlas.file,import.meta.url));
    assert.equal(png.readUInt32BE(16),atlas.width);assert.equal(png.readUInt32BE(20),atlas.height);
    for(const [x,y,w,h] of atlas.rects){assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=atlas.width&&y+h<=atlas.height);count++;}
  }
  assert.equal(count,32);
  for(const index of [...PARTS.map(p=>p.sprite),...CATEGORIES.map(c=>c.sprite),...GAMES.flatMap(g=>[g.sprite,g.crew]),24,25,26,27,28,29,30,31])assert.ok(Number.isInteger(index)&&index>=0&&index<count);
});

test('a version 1 album retains all original part IDs, dimensions, placement, and layering',()=>{
  const dimensions=[['biscuit',244,244,1],['chocolate-roof',334,250,2],['blue-window',86,86,3],['pink-door',94,134,3],['lollipop',108,194,4],['mint-candy',108,88,4],['marshmallow',86,86,4],['strawberry',134,154,4],['waffle',244,244,1],['pink-roof',334,250,2],['heart',86,82,4],['star',86,86,4],['cookie-base',370,134,0],['cake-base',370,160,0],['cocoa-wall',244,244,1],['gumdrop',90,98,4]];
  const old={id:'saved-before-redesign',name:'わたしのおうち',savedAt:100,items:dimensions.map(([part],i)=>({id:'piece-'+i,part,x:250+i*32,y:250+i*17}))};
  const snapshot=structuredClone(old);assert.ok(validateHouse(old));ordered(old.items);
  for(const [id,w,h,layer] of dimensions){const p=partById(id);assert.deepEqual([p.w,p.h,p.layer],[w,h,layer]);}
  assert.deepEqual(old,snapshot);
});

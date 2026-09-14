import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
function worker({failInstall=false,root='https://example.test/'}={}){
  const listeners={},cacheData=new Map(),deleted=[],network=[];let claimed=false,skipped=false;
  const cache={addAll:async urls=>{if(failInstall)throw new Error('network disconnected');for(const url of urls)cacheData.set(url,{url,ok:true});},match:async request=>cacheData.get(typeof request==='string'?request:request.url.split('?')[0])};
  const caches={open:async()=>cache,keys:async()=>['other-app-v3','okashi-world-/-v0'],delete:async key=>{deleted.push(key);return true;}};
  const self={location:{href:new URL('sw.js',root).href},clients:{claim:async()=>{claimed=true;}},skipWaiting:async()=>{skipped=true;},addEventListener:(key,fn)=>listeners[key]=fn};
  vm.runInNewContext(source,{self,caches,URL,fetch:async req=>{network.push(req.url);throw new Error('offline');}});
  const dispatch=async(name,event={})=>{let promise;listeners[name]({...event,waitUntil:p=>promise=p,respondWith:p=>promise=p});return promise?await promise:undefined;};
  return{dispatch,cacheData,deleted,network,get claimed(){return claimed;},get skipped(){return skipped;}};
}
test('complete precache contains every public runtime asset except the worker itself',async()=>{
  const w=worker();await w.dispatch('install');const files=[];function walk(url,prefix=''){for(const e of fs.readdirSync(url,{withFileTypes:true})){if(e.isDirectory())walk(new URL(e.name+'/',url),prefix+e.name+'/');else files.push(prefix+e.name);}}walk(new URL('../dist/',import.meta.url));
  for(const f of files.filter(f=>f!=='sw.js'&&!f.startsWith('pulse-runner/')))assert.ok(w.cacheData.has('https://example.test/'+f),`not precached: ${f}`);assert.equal(w.skipped,true);
});
test('offline navigation and artwork requests are served without network',async()=>{
  const w=worker();await w.dispatch('install');const page=await w.dispatch('fetch',{request:{url:'https://example.test/',method:'GET',mode:'navigate'}});assert.equal(page.url,'https://example.test/index.html');
  const art=await w.dispatch('fetch',{request:{url:'https://example.test/assets/parts.png',method:'GET',mode:'cors'}});assert.equal(art.url,'https://example.test/assets/parts.png');assert.equal(w.network.length,0);
});
test('activation preserves unrelated application caches',async()=>{const w=worker();await w.dispatch('activate');assert.deepEqual(w.deleted,['okashi-world-/-v0']);assert.equal(w.claimed,true);});
test('interrupted first download does not activate an incomplete worker',async()=>{const w=worker({failInstall:true});await assert.rejects(w.dispatch('install'),/disconnected/);assert.equal(w.skipped,false);});
test('third party and non-GET requests are not intercepted',async()=>{const w=worker();assert.equal(await w.dispatch('fetch',{request:{url:'https://elsewhere.test/image.png',method:'GET',mode:'cors'}}),undefined);assert.equal(await w.dispatch('fetch',{request:{url:'https://example.test/',method:'POST',mode:'cors'}}),undefined);});
test('a GitHub Pages subdirectory serves the new crew offline without capturing sibling sites',async()=>{
  const root='https://example.test/-okashi-world/',w=worker({root});await w.dispatch('install');
  for(const file of ['index.html','js/atlas-map.js','js/celebrations.js','assets/workshop.png','assets/garden.webp','assets/seaside.webp','assets/snow.webp']){
    const request={url:root+file,method:'GET',mode:file==='index.html'?'navigate':'cors'};
    assert.equal((await w.dispatch('fetch',{request})).url,root+file);
  }
  assert.equal(await w.dispatch('fetch',{request:{url:'https://example.test/another-game/',method:'GET',mode:'navigate'}}),undefined);
  assert.equal(w.network.length,0);
});

test('root worker leaves Pulse Runner navigation and assets to its own worker',async()=>{const w=worker({root:'https://example.test/-okashi-world/'});for(const file of ['', 'js/app.js'])assert.equal(await w.dispatch('fetch',{request:{url:'https://example.test/-okashi-world/pulse-runner/'+file,method:'GET',mode:'navigate'}}),undefined);});

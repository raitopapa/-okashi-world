export const W = 1200, H = 750;
export const STAGES = [
  {id:'orchard',name:'くだものの もり',file:'garden.webp'},
  {id:'seaside',name:'うみべ',file:'seaside.webp'},
  {id:'snow',name:'ゆきの ひろば',file:'snow.webp'},
];
export const stageById = id => STAGES.find(s=>s.id===id)||STAGES[0];
export const CATEGORIES = [
  { id: 'wall', name: 'かべ・どだい', sprite: 0 },
  { id: 'roof', name: 'やね', sprite: 16 },
  { id: 'window', name: 'まど', sprite: 19 },
  { id: 'door', name: 'ドア', sprite: 18 },
  { id: 'garden', name: 'おにわ', sprite: 4 },
  { id: 'topping', name: 'かざり', sprite: 6 },
];
export const PARTS = [
  { id:'biscuit', name:'ビスケットれんが', category:'wall', sprite:0, w:244, h:244, layer:1 },
  { id:'chocolate-roof', name:'チョコのやね', category:'roof', sprite:1, w:334, h:250, layer:2 },
  { id:'blue-window', name:'あおいまど', category:'window', sprite:2, w:86, h:86, layer:3 },
  { id:'pink-door', name:'いちごのドア', category:'door', sprite:3, w:94, h:134, layer:3 },
  { id:'lollipop', name:'ぺろぺろキャンディ', category:'garden', sprite:4, w:108, h:194, layer:4 },
  { id:'mint-candy', name:'ミントキャンディ', category:'topping', sprite:5, w:108, h:88, layer:4 },
  { id:'marshmallow', name:'クリーム', category:'topping', sprite:6, w:86, h:86, layer:4 },
  { id:'strawberry', name:'いちごのき', category:'garden', sprite:7, w:134, h:154, layer:4 },
  { id:'waffle', name:'いちごれんが', category:'wall', sprite:8, w:244, h:244, layer:1, game:'cookie' },
  { id:'pink-roof', name:'いちごのやね', category:'roof', sprite:9, w:334, h:250, layer:2, game:'chocolate' },
  { id:'heart', name:'ハートクッキー', category:'topping', sprite:10, w:86, h:82, layer:4, game:'catch' },
  { id:'star', name:'おほしさま', category:'topping', sprite:11, w:86, h:86, layer:4, game:'catch' },
  { id:'cookie-base', name:'クッキーのだい', category:'wall', sprite:12, w:370, h:134, layer:0, game:'oven' },
  { id:'cake-base', name:'ケーキのだい', category:'wall', sprite:13, w:370, h:160, layer:0, game:'oven' },
  { id:'cocoa-wall', name:'ココアれんが', category:'wall', sprite:14, w:244, h:244, layer:1, game:'cookie' },
  { id:'gumdrop', name:'しずくグミ', category:'garden', sprite:15, w:90, h:98, layer:4 },
  { id:'waffle-roof', name:'ワッフルのやね', category:'roof', sprite:16, w:334, h:250, layer:2 },
  { id:'pudding-roof', name:'プリンのやね', category:'roof', sprite:17, w:330, h:225, layer:2, game:'chocolate' },
  { id:'chocolate-door', name:'いたチョコのドア', category:'door', sprite:18, w:78, h:134, layer:3 },
  { id:'donut-window', name:'ドーナツのまど', category:'window', sprite:19, w:72, h:72, layer:3 },
  { id:'pretzel-window', name:'プレッツェルのまど', category:'window', sprite:20, w:80, h:76, layer:3 },
  { id:'candy-pillar', name:'しましまのはしら', category:'wall', sprite:21, w:46, h:256, layer:3 },
  { id:'pancake-base', name:'ホットケーキのどだい', category:'wall', sprite:22, w:370, h:126, layer:0 },
  { id:'fruit-basket', name:'くだもののかご', category:'garden', sprite:23, w:132, h:110, layer:4 },
];
export const GAMES = [
  { id:'cookie', name:'れんがを ポン！', hint:'きじを 4かい ポン！', icon:'🍪', sprite:0, crew:24, action:'かべの ざいりょう', target:4 },
  { id:'chocolate', name:'チョコを まぜよう', hint:'くるくる まぜよう！ タップでも いいよ', icon:'🍫', sprite:28, crew:25, action:'やねの ざいりょう', target:6 },
  { id:'catch', name:'ざいりょう あつめ', hint:'かごに 3こ はこぼう！', icon:'🍬', sprite:26, crew:26, action:'かざりの ざいりょう', target:3 },
  { id:'oven', name:'かまどで こんがり', hint:'きじを かまどに いれよう！', icon:'🥐', sprite:29, crew:24, action:'どだいの ざいりょう', duration:2 },
];
export function gameProgress(game){
  if(game.id==='oven')return game.baking?Math.min(1,game.elapsed/game.duration):0;
  return Math.min(1,game.count/game.target);
}
export const partById = id => PARTS.find(p => p.id === id);
export const starterUnlocks = () => PARTS.filter(p => !p.game).map(p => p.id);
export const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const blankHouse = (stage='orchard') => ({ id:uid(), name:'おかしのおうち', stage:stageById(stage).id, items:[], savedAt:0 });
export function starterHouse() {
  const h=blankHouse();
  [['pancake-base',600,612],['biscuit',600,460],['waffle-roof',600,279],['candy-pillar',480,466],['candy-pillar',720,466],['donut-window',518,448],['pretzel-window',682,448],['chocolate-door',600,515],['fruit-basket',816,603]].forEach(([part,x,y])=>h.items.push({id:uid(),part,x,y}));
  return h;
}
export function position(part, x, y) {
  return { x:Math.max(part.w/2,Math.min(W-part.w/2,x)), y:Math.max(part.h/2,Math.min(H-part.h/2,y)) };
}
export function ordered(items) { return [...items].sort((a,b)=>partById(a.part).layer-partById(b.part).layer); }
export function hitTest(items,x,y) {
  return ordered(items).reverse().find(item=>{
    const p=partById(item.part);
    return Math.abs(x-item.x)<=p.w*.43 && Math.abs(y-item.y)<=p.h*.43;
  });
}
export function unlockReward(gameId,unlocked) {
  const fresh=PARTS.filter(p=>p.game===gameId&&!unlocked.includes(p.id)).slice(0,2);
  return { fresh:fresh.map(p=>p.id), unlocked:[...new Set([...unlocked,...fresh.map(p=>p.id)])] };
}
export function validateHouse(h) {
  return !!h && typeof h.id==='string' && Array.isArray(h.items) && h.items.every(i=>typeof i.id==='string'&&partById(i.part)&&Number.isFinite(i.x)&&Number.isFinite(i.y));
}
export class History {
  constructor(){ this.stack=[]; }
  push(items){ this.stack.push(structuredClone(items)); if(this.stack.length>60)this.stack.shift(); }
  pop(){ return this.stack.pop(); }
  clear(){ this.stack=[]; }
}

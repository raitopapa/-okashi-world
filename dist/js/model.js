export const W = 1200, H = 750;
export const CATEGORIES = [
  { id: 'wall', name: 'かべ', sprite: 0 },
  { id: 'roof', name: 'やね', sprite: 1 },
  { id: 'window', name: 'まど', sprite: 2 },
  { id: 'door', name: 'ドア', sprite: 3 },
  { id: 'garden', name: 'おにわ', sprite: 4 },
  { id: 'topping', name: 'かざり', sprite: 6 },
];
export const PARTS = [
  { id:'biscuit', name:'ビスケット', category:'wall', sprite:0, w:244, h:244, layer:1 },
  { id:'chocolate-roof', name:'チョコのやね', category:'roof', sprite:1, w:334, h:250, layer:2 },
  { id:'blue-window', name:'あおいまど', category:'window', sprite:2, w:86, h:86, layer:3 },
  { id:'pink-door', name:'いちごのドア', category:'door', sprite:3, w:94, h:134, layer:3 },
  { id:'lollipop', name:'ぺろぺろキャンディ', category:'garden', sprite:4, w:108, h:194, layer:4 },
  { id:'mint-candy', name:'ミントキャンディ', category:'topping', sprite:5, w:108, h:88, layer:4 },
  { id:'marshmallow', name:'マシュマロ', category:'topping', sprite:6, w:86, h:86, layer:4 },
  { id:'strawberry', name:'いちごのき', category:'garden', sprite:7, w:134, h:154, layer:4 },
  { id:'waffle', name:'いちごワッフル', category:'wall', sprite:8, w:244, h:244, layer:1, game:'cookie' },
  { id:'pink-roof', name:'いちごのやね', category:'roof', sprite:9, w:334, h:250, layer:2, game:'chocolate' },
  { id:'heart', name:'ハートクッキー', category:'topping', sprite:10, w:86, h:82, layer:4, game:'catch' },
  { id:'star', name:'おほしさま', category:'topping', sprite:11, w:86, h:86, layer:4, game:'catch' },
  { id:'cookie-base', name:'クッキーのだい', category:'wall', sprite:12, w:370, h:134, layer:0, game:'oven' },
  { id:'cake-base', name:'ケーキのだい', category:'wall', sprite:13, w:370, h:160, layer:0, game:'oven' },
  { id:'cocoa-wall', name:'ココアクッキー', category:'wall', sprite:14, w:244, h:244, layer:1, game:'cookie' },
  { id:'gumdrop', name:'しずくグミ', category:'garden', sprite:15, w:90, h:98, layer:4 },
];
export const GAMES = [
  { id:'cookie', name:'クッキーぽん！', hint:'きじを ポン、ポン！', icon:'🍪', action:'おしてみよう', duration:30 },
  { id:'chocolate', name:'チョコまぜまぜ', hint:'くるくる まぜよう！', icon:'🍫', action:'まぜまぜ', duration:30 },
  { id:'catch', name:'キャンディあつめ', hint:'おかしを かごに いれよう！', icon:'🍬', action:'あつめよう', duration:35 },
  { id:'oven', name:'ふっくらオーブン', hint:'きじを オーブンへ！', icon:'🥐', action:'やいてみよう', duration:30 },
];
export const partById = id => PARTS.find(p => p.id === id);
export const starterUnlocks = () => PARTS.filter(p => !p.game).map(p => p.id);
export const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const blankHouse = () => ({ id:uid(), name:'おかしのおうち', items:[], savedAt:0 });
export function starterHouse() {
  const h=blankHouse();
  [['biscuit',600,460],['chocolate-roof',600,279],['blue-window',550,442],['blue-window',650,442],['pink-door',600,509]].forEach(([part,x,y])=>h.items.push({id:uid(),part,x,y}));
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

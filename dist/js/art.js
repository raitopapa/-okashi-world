import { W,H,partById,ordered } from './model.js';
export const art={background:null,atlas:null,sprites:[],urls:[]};
const rects=[
  [53,53,243,245],[328,65,305,230],[665,61,253,245],[973,47,231,258],
  [73,325,212,301],[328,397,305,173],[675,365,232,237],[944,342,279,282],
  [39,640,253,244],[323,652,307,226],[665,657,254,229],[971,646,246,235],
  [22,980,306,177],[330,947,303,210],[663,908,255,262],[969,936,250,239],
];
function loadImage(path){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=()=>rej(new Error('画像を読み込めませんでした'));img.src=new URL(path,import.meta.url).href;});}
export async function loadArt(){
  [art.background,art.atlas]=await Promise.all([loadImage('../assets/garden.webp'),loadImage('../assets/parts.png')]);
  const ratio=art.atlas.width/1254;
  rects.forEach(([x,y,w,h])=>{
    const sprite=document.createElement('canvas');sprite.width=Math.round(w*ratio);sprite.height=Math.round(h*ratio);
    sprite.getContext('2d').drawImage(art.atlas,x*ratio,y*ratio,w*ratio,h*ratio,0,0,sprite.width,sprite.height);
    art.sprites.push(sprite);art.urls.push(sprite.toDataURL());
  });
}
export function spriteElement(index,extra=''){
  const e=document.createElement('span');e.className=`sprite ${extra}`;e.setAttribute('aria-hidden','true');
  if(art.urls[index]){e.style.backgroundImage=`url("${art.urls[index]}")`;e.style.backgroundSize='contain';e.style.backgroundPosition='center';}
  else e.style.backgroundPosition=`${(index%4)*100/3}% ${Math.floor(index/4)*100/3}%`;
  return e;
}
export function drawSprite(ctx,index,x,y,w,h,angle=0){
  const img=art.sprites[index];if(!img)return;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();
}
export function drawWorld(ctx,house,selected=null,particles=[],background=true){
  if(background){ctx.clearRect(0,0,W,H);ctx.fillStyle='#e6eddb';ctx.fillRect(0,0,W,H);
  if(art.background)ctx.drawImage(art.background,0,0,W,H);}
  for(const item of ordered(house.items)){
    const p=partById(item.part);drawSprite(ctx,p.sprite,item.x,item.y,p.w,p.h);
    if(selected===item.id){ctx.save();ctx.strokeStyle='#ae697e';ctx.lineWidth=3;ctx.setLineDash([8,8]);ctx.beginPath();ctx.roundRect(item.x-p.w/2-6,item.y-p.h/2-6,p.w+12,p.h+12,14);ctx.stroke();ctx.restore();}
  }
  for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
}
export function thumbnail(house){const c=document.createElement('canvas');c.width=480;c.height=300;const ctx=c.getContext('2d');ctx.scale(.4,.4);drawWorld(ctx,house);return c.toDataURL('image/jpeg',.78);}

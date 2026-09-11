import { W,H,partById,ordered } from './model.js';
import { ATLAS_MAP } from './atlas-map.js';
export const ART_VERSION=2;
export const art={background:null,atlases:[],sprites:[],urls:[]};
function loadImage(path){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>res(img);img.onerror=()=>rej(new Error('画像を読み込めませんでした'));img.src=new URL(path,import.meta.url).href;});}
export async function loadArt(){
  const images=await Promise.all([loadImage('../assets/garden.webp'),...ATLAS_MAP.map(a=>loadImage('../assets/'+a.file))]);
  art.background=images.shift();art.atlases=images;art.sprites=[];art.urls=[];
  ATLAS_MAP.forEach((atlas,i)=>{
    if(images[i].width!==atlas.width||images[i].height!==atlas.height)throw new Error('おかしの画像サイズが違います');
    for(const [x,y,w,h] of atlas.rects){
      const sprite=document.createElement('canvas');sprite.width=w;sprite.height=h;
      sprite.getContext('2d').drawImage(images[i],x,y,w,h,0,0,w,h);
      art.sprites.push(sprite);art.urls.push(sprite.toDataURL());
    }
  });
}
export function spriteElement(index,extra=''){
  const e=document.createElement('span');e.className=`sprite ${extra}`;e.setAttribute('aria-hidden','true');
  if(art.urls[index])e.style.backgroundImage=`url("${art.urls[index]}")`;
  return e;
}
export function drawSprite(ctx,index,x,y,w,h,angle=0){
  const img=art.sprites[index];if(!img)return;
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();
}
export function drawBackground(ctx,width,height){
  ctx.fillStyle='#acd26b';ctx.fillRect(0,0,width,height);
  if(!art.background)return;
  const scale=Math.max(width/art.background.width,height/art.background.height),w=art.background.width*scale,h=art.background.height*scale;
  ctx.drawImage(art.background,(width-w)/2,(height-h)/2,w,h);
}
export function drawWorld(ctx,house,selected=null,particles=[],background=true,crew={}){
  if(background){ctx.clearRect(0,0,W,H);drawBackground(ctx,W,H);}
  // Workers stand behind pieces so the whole clearing stays available to build on.
  const bob=crew.cheer?Math.sin((crew.time||0)*.013)*7:0;
  drawSprite(ctx,crew.cheer?27:24,365,581+bob,89,155);
  drawSprite(ctx,25,867,545,132,118,crew.cheer?Math.sin((crew.time||0)*.009)*.06:0);
  for(const item of ordered(house.items)){
    const p=partById(item.part);drawSprite(ctx,p.sprite,item.x,item.y,p.w,p.h);
    if(selected===item.id){ctx.save();ctx.strokeStyle='#297978';ctx.lineWidth=3;ctx.setLineDash([8,8]);ctx.beginPath();ctx.roundRect(item.x-p.w/2-6,item.y-p.h/2-6,p.w+12,p.h+12,12);ctx.stroke();ctx.restore();}
  }
  if(crew.delivery){
    const t=crew.delivery.progress,x=180+780*t,y=680+Math.sin(t*Math.PI*18)*3;
    ctx.save();ctx.globalAlpha=Math.min(1,t*8,(1-t)*8);
    drawSprite(ctx,26,x,y,160,120);drawSprite(ctx,crew.delivery.sprite,x+39,y-33,47,47);ctx.restore();
  }else drawSprite(ctx,26,940,650,155,117);
  for(const p of particles){ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
}
export function thumbnail(house){const c=document.createElement('canvas');c.width=480;c.height=300;const ctx=c.getContext('2d');ctx.scale(.4,.4);drawWorld(ctx,house);return c.toDataURL('image/jpeg',.82);}

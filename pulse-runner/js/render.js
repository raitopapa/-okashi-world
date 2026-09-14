import{STAGES,WEAPONS,HEIGHT}from'./levels.js';import{clamp}from'./engine.js';
const r=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
const txt=(c,s,x,y,size=14,col='#effaff',align='left')=>{c.font=`600 ${size}px ui-monospace,monospace`;c.fillStyle=col;c.textAlign=align;c.fillText(s,x,y);};
const hash=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
const poly=(c,p,col)=>{c.fillStyle=col;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
export function robot(c,x,y,{face=1,t=0,run=false,air=false,dash=false,shooting=false,charge=0,scale=1,color='#3aafff'}={}){
 c.save();c.translate(Math.round(x+14*scale),Math.round(y+22*scale));c.scale(scale*face,scale);if(dash){c.translate(0,8);c.rotate(-.2);}
 const leg=run&&!air?Math.round(Math.sin(t*19)*7):air?5:0,blue=color,mid='#2075b7',white='#c6f3ff',ink='#07152e';
 poly(c,[[-9,-6],[-30-(run?5:0),-12+Math.sin(t*7)*3],[-23,-3],[-32,2],[-11,4]],'#ef9374');
 r(c,-14,-7,7,20,ink);r(c,-16,-5,6,14,mid);r(c,-16,-4,2,8,white);
 r(c,-10,10,9,9+leg*.4,ink);r(c,3,10,9,10-leg*.4,ink);r(c,-11-leg*.5,13,10,11,mid);r(c,2+leg*.6,12,10,12,blue);
 r(c,-14-leg*.6,21,14,5,ink);r(c,2+leg*.6,21,15,5,ink);r(c,-13-leg*.6,20,13,4,mid);r(c,3+leg*.6,20,13,4,blue);r(c,-12-leg*.6,19,8,2,white);r(c,4+leg*.6,18,8,3,white);
 r(c,-11,-8,24,20,ink);r(c,-10,-7,20,17,blue);r(c,-9,6,20,5,'#123d6c');r(c,-7,-6,14,3,white);r(c,-6,-1,12,8,mid);r(c,-3,0,7,5,'#fff0a6');r(c,-1,0,3,5,'#fffad7');
 r(c,-9,-12,22,5,'#e58c6b');r(c,-4,-11,12,3,'#ffd5a0');r(c,-10,-26,23,17,ink);r(c,-7,-29,17,4,ink);r(c,-9,-25,21,14,blue);r(c,-6,-28,15,4,blue);r(c,-7,-25,6,3,white);r(c,3,-25,5,3,white);
 r(c,-9,-20,5,9,mid);r(c,-11,-21,6,8,'#123d6c');r(c,-10,-20,4,3,'#a1f5ff');r(c,-1,-22,15,9,ink);r(c,1,-21,12,5,'#84f2ff');r(c,9,-21,3,5,'#f2fffd');r(c,0,-14,11,2,white);r(c,-6,-33,3,6,mid);r(c,-6,-34,3,2,'#ffda8d');
 const a=shooting||charge>.2?-6:0;r(c,8,a-2,10,11,ink);r(c,9,a-1,8,8,blue);r(c,14,a,14,12,ink);r(c,15,a+1,12,10,mid);r(c,16,a+1,9,3,white);r(c,24,a+3,5,6,'#7beafa');r(c,26,a+4,2,4,ink);
 if(shooting)poly(c,[[30,a+3],[39,a],[35,a+6],[42,a+10],[30,a+9]],'#ffffbe');
 if(charge>.35){c.strokeStyle=charge>=1?'#fff0ae':'#75e9ff';c.lineWidth=2;c.beginPath();c.arc(21,a+6,13+Math.sin(t*22)*3,0,Math.PI*2);c.stroke();for(let k=0;k<4;k++){const q=t*8+k*Math.PI/2;r(c,21+Math.cos(q)*20,a+6+Math.sin(q)*20,3,3,c.strokeStyle);}}
 c.restore();
}
export function bossArt(c,x,y,s,t=0,state='idle',face=-1,hurt=false,scale=1){
 c.save();c.translate(Math.round(x+34*scale),Math.round(y+40*scale));c.scale(face*scale,scale);const a=hurt?'#fff':s.accent,shell=['#366889','#7a5355','#687da9','#794d86'][s.id];c.translate(0,state==='sleep'?0:Math.sin(t*3)*2);
 if(s.id===0){poly(c,[[-19,-24],[-66,-43],[-59,-22],[-43,-19],[-58,-12],[-24,-5]],'#152d4b');poly(c,[[19,-24],[61,-42],[56,-20],[44,-17],[58,-9],[23,-5]],'#152d4b');poly(c,[[-24,-23],[-57,-34],[-47,-22],[-23,-10]],a);poly(c,[[24,-23],[55,-34],[47,-22],[23,-10]],a);}
 else if(s.id===2){poly(c,[[-23,-8],[-65,9],[-54,32],[-50,15],[-24,4]],a);poly(c,[[23,-8],[62,-35],[55,-4],[29,10]],a);poly(c,[[26,-7],[53,-23],[47,-5]],'#eef7ff');}
 else if(s.id===3){c.strokeStyle=a;c.lineWidth=3;c.beginPath();c.arc(0,-8,57,0,Math.PI*2);c.stroke();for(let k=0;k<6;k++){const q=t*.7+k*Math.PI/3;r(c,Math.cos(q)*58-5,Math.sin(q)*58-13,10,10,a);}}
 r(c,-30,-23,60,47,'#0a142b');r(c,-26,-21,52,42,shell);r(c,-25,-19,49,5,a);r(c,-20,-11,40,23,'#182b44');r(c,-9,-6,18,18,a);r(c,-5,-2,10,10,'#fff5c4');r(c,-21,-40,42,20,'#08152b');r(c,-17,-43,34,4,'#08152b');r(c,-18,-38,36,16,shell);
 poly(c,[[-22,-32],[-28,-49],[-9,-36]],a);poly(c,[[22,-32],[28,-49],[9,-36]],a);r(c,-16,-34,32,7,'#091829');r(c,-12,-33,11,4,a);r(c,4,-33,10,4,a);r(c,-12,-25,24,4,'#cfdeee');
 const st=state==='rush'?Math.sin(t*23)*8:0;r(c,-24+st,23,18,15,'#0a152b');r(c,8-st,23,18,15,'#0a152b');r(c,-28+st,31,25,10,shell);r(c,6-st,31,25,10,shell);r(c,-27+st,31,22,3,a);r(c,7-st,31,22,3,a);
 if(s.id!==2){r(c,-39,-13,15,29,'#101a30');r(c,-39,-13,14,6,a);r(c,27,-13,19,28,'#101a30');r(c,27,-13,18,6,a);r(c,34,0,15,12,shell);}
 if(state==='tell'){c.strokeStyle=a;c.lineWidth=2;c.beginPath();c.arc(0,-5,45+Math.sin(t*22)*4,0,Math.PI*2);c.stroke();}c.restore();
}
export function background(c,s,w,cam=0,t=0){
 const sky=c.createLinearGradient(0,0,0,540);s.sky.forEach((col,i)=>sky.addColorStop(i/2,col));c.fillStyle=sky;c.fillRect(0,0,w,540);
 const sx=w*.72-cam*.025;c.fillStyle=s.theme==='fire'?'#aa6355':s.theme==='core'?'#8b5084':'#668c9e';c.globalAlpha=.36;c.beginPath();c.arc(sx,155,68,0,Math.PI*2);c.fill();c.strokeStyle=s.accent;c.globalAlpha=.25;c.lineWidth=2;c.beginPath();c.arc(sx,155,87,-.5,Math.PI*1.4);c.stroke();c.globalAlpha=1;
 for(let i=0;i<38;i++)r(c,(hash(i+21)*2200-cam*.045+w*3)%w,hash(i+77)*260,i%7?1:2,i%7?1:2,'#8aafc5');
 for(let layer=0;layer<3;layer++){const stride=layer===0?126:106,speed=[.1,.23,.4][layer],base=[365,401,448][layer],left=Math.floor(cam*speed/stride)-1,right=left+Math.ceil(w/stride)+3;
  for(let i=left;i<right;i++){const seed=i+layer*513,x=i*stride-cam*speed,bh=74+hash(seed+900)*[166,194,158][layer],bw=58+hash(seed+181)*52,y=base-bh;
   const cols=s.theme==='fire'?['#362536','#402c3d','#302432']:s.theme==='core'?['#292039','#352541','#271e36']:['#1c334a','#234057','#172e44'];r(c,x,y,bw,bh,cols[layer]);r(c,x+4,y-5,bw-8,6,cols[layer]);if(hash(seed+32)>.55){r(c,x+bw*.6,y-31,3,31,cols[layer]);r(c,x+bw*.6,y-34,3,3,s.accent);}
   if(s.theme==='fire'&&i%3===0){r(c,x+8,y-28,13,28,cols[layer]);for(let k=0;k<3;k++){c.globalAlpha=.1;r(c,x+5+Math.sin(t+k)*8,y-55-k*20,24+k*8,18,'#af8480');c.globalAlpha=1;}}
   for(let row=0;row<Math.floor(bh/20)-1;row++)for(let col=0;col<Math.floor(bw/16)-1;col++)if(hash(seed*83+row*19+col)>.54)r(c,x+9+col*16,y+14+row*20,3+(layer===2?2:0),6,layer===2?'#568c9e':s.theme==='fire'?'#9b6761':'#44738a');
   if(layer===1&&i%3===0){r(c,x+6,y+bh*.4,bw-12,2,s.accent);c.globalAlpha=.1;r(c,x+6,y+bh*.4-5,bw-12,14,s.accent);c.globalAlpha=1;}if(layer===2&&i%2===0){r(c,x+bw,base-60,stride-bw+2,5,cols[layer]);r(c,x+bw+10,base-59,4,20,cols[layer]);}if(s.theme==='ice')poly(c,[[x,y],[x+bw,y],[x+bw,y+6],[x+bw*.6,y+3],[x+bw*.35,y+11],[x,y+5]],'#6b95b1');
  }
 }
 if(s.theme==='ice')for(let i=0;i<40;i++)r(c,(hash(i+301)*w+t*(10+hash(i)*20))%w,(hash(i+811)*530+t*16)%540,2,2,'#bacfe5');
 else for(let i=0;i<14;i++){c.globalAlpha=.35;r(c,(hash(i+111)*w+t*6)%w,200+(hash(i+216)*310-t*9+10000)%310,2,3,s.accent);c.globalAlpha=1;}
 const fog=c.createLinearGradient(0,400,0,540);fog.addColorStop(0,'#090f2200');fog.addColorStop(1,'#090f22');c.fillStyle=fog;c.fillRect(0,400,w,140);
}
function platform(c,p,s,t){const{x,y,w,h}=p;r(c,x,y,w,h,s.dark);r(c,x,y+4,w,Math.min(h-4,28),s.tile);r(c,x,y,w,3,p.kind==='ice'?'#c5e5ff':s.accent);r(c,x+2,y+4,w-4,2,'#80a8b5');
 for(let xx=x+6;xx<x+w-4;xx+=32){r(c,xx,y+12,20,9,s.dark);r(c,xx+1,y+12,18,1,'#476172');r(c,xx+24,y+11,2,2,'#7c9bab');if(!p.oneWay&&h>40){r(c,xx-3,y+38,28,h-40,s.tile);r(c,xx,y+40,2,h-48,s.dark);}}
 if(p.oneWay){r(c,x+7,y+h,4,7,s.tile);r(c,x+w-11,y+h,4,7,s.tile);}if(p.kind==='belt')for(let xx=x+8;xx<x+w-8;xx+=28){const a=t*30%14;poly(c,[[xx+a,y+6],[xx+7+a,y+6],[xx+13+a,y+12],[xx+7+a,y+18],[xx+a,y+18],[xx+6+a,y+12]],'#e9b477');}
 if(p.kind==='ice')for(let xx=x+10;xx<x+w;xx+=43)poly(c,[[xx,y],[xx+9,y],[xx+4,y+10]],'#a4daef');if(p.kind==='moving'){r(c,x+12,y+h,14,5,'#68e8ff');r(c,x+w-26,y+h,14,5,'#68e8ff');}
}
function enemy(c,e,t){const col=e.hit>0?'#fff':e.slow>0?'#acd5ff':e.type==='drone'?'#c395de':e.type==='hopper'?'#eaa57c':'#e1b475';c.save();c.translate(Math.round(e.x+e.w/2),Math.round(e.y));
 if(e.type==='drone'){r(c,-19,7,38,9,'#172239');r(c,-13,3,26,18,col);r(c,-8,0,16,5,col);r(c,-10,10,20,7,'#122239');r(c,-7,11,4,3,'#fff0ae');r(c,3,11,4,3,'#fff0ae');for(const d of[-1,1]){r(c,d*22-7,7,14,3,col);r(c,d*22-9-Math.sin(t*30)*2,2,18,2,'#6c99bb');}r(c,-5,23,10,3,'#6ee6ff');}
 else if(e.type==='turret'){r(c,-19,24,38,6,'#172139');r(c,-14,20,28,5,col);r(c,-12,2,24,21,'#18273e');r(c,-10,0,20,19,col);r(c,-7,5,14,7,'#10243a');r(c,e.face>0?5:-25,8,20,9,'#718195');r(c,e.face>0?21:-26,9,5,7,e.tell>0?'#fff4b6':'#ffc486');}
 else{const st=e.type==='hopper'?4:Math.sin(t*10)*4;r(c,-14,2,28,22,'#142139');r(c,-12,0,24,20,col);r(c,-14,6,28,3,col);r(c,-10,7,20,7,'#1b2a42');r(c,-7,9,4,3,'#fff4bc');r(c,3,9,4,3,'#fff4bc');r(c,-11-st*.5,23,8,7,'#49546d');r(c,4+st*.5,23,8,7,'#49546d');r(c,-13-st*.5,28,12,3,col);r(c,3+st*.5,28,12,3,col);if(e.type==='hopper'){r(c,-9,-4,3,6,col);r(c,6,-4,3,6,col);}}
 if(e.tell>0)txt(c,'!',0,-9,18,'#ffcb8b','center');c.restore();
}
export class Renderer{
 constructor(canvas,game){this.canvas=canvas;this.c=canvas.getContext('2d',{alpha:false});this.game=game;this.w=960;this.menuClock=0;}
 resize(){const b=this.canvas.getBoundingClientRect();this.w=clamp(Math.round(b.width/Math.max(1,b.height)*HEIGHT),480,1440);this.canvas.width=this.w;this.canvas.height=HEIGHT;this.c.imageSmoothingEnabled=false;this.game.viewW=this.w;}
 render(dt=0){
  const g=this.game,c=this.c,w=this.w,menu=['title','select'].includes(g.mode);this.menuClock+=g.save.reducedMotion?0:Math.min(dt,.05);const t=g.save.reducedMotion?0:menu?this.menuClock:g.clock,s=menu?STAGES[0]:g.level,cam=menu?t*9:g.camera;background(c,s,w,cam,t);
  if(menu){const x=w*.76;platform(c,{x:x-165,y:410,w:340,h:130,kind:'solid'},s,t);robot(c,x-34,287+Math.sin(t*2)*2,{scale:2.55,t});txt(c,'PR–01',x-4,473,13,'#5e8a9f','center');txt(c,'SIGNAL FOUND_',x+15,240,12,'#7aaec0','center');c.strokeStyle='#4b7e9766';c.strokeRect(x-105,260,210,132);return;}
  c.save();if(!g.save.reducedMotion&&g.shake>0)c.translate((Math.random()-.5)*g.shake,(Math.random()-.5)*g.shake);c.translate(-Math.round(cam),0);const visible=p=>p.x+p.w>cam-60&&p.x<cam+w+60;
  for(const p of [...g.level.solids,...g.platforms])if(visible(p))platform(c,p,s,t);
  for(const cp of g.level.checkpoints){if(cp.x<cam-60||cp.x>cam+w+60)continue;const active=g.level.checkpoints.indexOf(cp)<g.checkpoint;r(c,cp.x,cp.y-72,4,72,'#88a7bc');r(c,cp.x-8,cp.y-5,20,5,'#5b849e');poly(c,[[cp.x+4,cp.y-71],[cp.x+36,cp.y-61],[cp.x+4,cp.y-50]],active?'#a1ffc7':'#a0c7d6');r(c,cp.x-2,cp.y-76,8,6,active?'#a1ffc7':'#fff1b8');}
  for(const q of g.level.signs)if(q.x>cam-160&&q.x<cam+w)txt(c,q.text,q.x,q.y,12,'#cae4ec');
  for(const i of g.items){if(i.dead||!visible(i))continue;const x=i.x+9,y=i.y+7+Math.sin(t*3+i.x)*3;
   if(i.type==='core'){c.strokeStyle='#f7d898';c.lineWidth=1;c.strokeRect(x-13,y-13,26,26);poly(c,[[x,y-10],[x+9,y],[x,y+10],[x-9,y]],'#ffdb96');poly(c,[[x,y-6],[x+5,y],[x,y+6],[x-5,y]],'#fff5cc');}
   else if(i.type==='health'){r(c,x-9,y-10,18,21,'#163547');r(c,x-8,y-9,16,19,'#8fe9ba');r(c,x-2,y-5,4,12,'#164251');r(c,x-6,y-1,12,4,'#164251');}
   else poly(c,[[x+1,y-10],[x-7,y+1],[x-1,y+1],[x-3,y+10],[x+8,y-3],[x+2,y-3]],'#b6edee');
  }
  for(const h of g.level.hazards){if(!visible(h))continue;r(c,h.x-5,h.y+h.h-9,h.w+10,9,'#1b283b');if(h.active){c.globalAlpha=.24;r(c,h.x-7,h.y,h.w+14,h.h,s.accent);c.globalAlpha=1;r(c,h.x+5,h.y+Math.sin(t*30)*6,h.w-10,h.h,'#fff0cb');r(c,h.x,h.y,h.w,4,s.accent);if(h.kind==='vent')for(let k=0;k<5;k++)poly(c,[[h.x+k*7,h.y+20],[h.x+k*7+4,h.y-4-Math.sin(t*20+k)*11],[h.x+k*7+8,h.y+30]],'#ffbb86');}else if(h.warning){txt(c,'!',h.x+h.w/2,h.y+20,25,'#ffdc92','center');r(c,h.x,h.y+h.h-6,h.w,5,'#ffe0a8');}}
  const gate=g.level.gate;r(c,gate-8,254,40,166,'#15263a');r(c,gate,263,24,157,'#334e65');for(let y=274;y<420;y+=18)r(c,gate+3,y,18,4,g.boss.active&&!g.boss.dead?s.accent:'#5c798d');txt(c,'BOSS',gate+12,243,12,s.accent,'center');
  for(const e of g.enemies)if(!e.dead&&visible(e))enemy(c,e,t);const b=g.boss;if(!b.dead&&visible(b))bossArt(c,b.x,b.y,s,t,b.state,b.face,b.hit>0);
  if(b.active&&!b.dead&&b.state==='tell'){txt(c,b.action==='shoot'?'SHOT':b.action==='rush'?'DASH':'JUMP',b.x+34,b.y-30,14,s.accent,'center');if(b.action==='rush'){c.globalAlpha=.15;r(c,g.level.gate+24,407,g.level.width-g.level.gate,13,s.accent);c.globalAlpha=1;}}
  for(const b of [...g.bullets,...g.enemyBullets]){c.globalAlpha=.2;r(c,b.x-5,b.y-4,b.w+10,b.h+8,b.color);c.globalAlpha=1;r(c,b.x,b.y,b.w,b.h,b.color);r(c,b.x+3,b.y+2,Math.max(2,b.w-6),Math.max(2,b.h-4),'#fff7d7');if(b.kind==='wave')poly(c,[[b.x,b.y+b.h],[b.x+b.w*.5,b.y-9],[b.x+b.w,b.y+b.h]],b.color);}
  const p=g.player;if(p.hp>0&&(p.invincible<=0||Math.floor(g.clock*15)%2===0))robot(c,p.x,p.y,{face:p.face,t,run:Math.abs(p.vx)>25&&p.ground,air:!p.ground,dash:p.dashTime>0,shooting:p.shootAnim>0,charge:p.charge,color:p.weapon==='pulse'?'#3aafff':WEAPONS.find(w=>w.id===p.weapon).color});
  for(const p of g.particles){c.globalAlpha=clamp(p.life/p.max,0,1);r(c,p.x-p.size/2,p.y-p.size/2,p.size,p.size,p.color);}c.globalAlpha=1;for(const f of g.floats){c.globalAlpha=Math.min(1,f.life*2);txt(c,f.text,f.x,f.y,12,f.color,'center');}c.globalAlpha=1;c.restore();
  if(g.intro>0&&g.mode==='playing'&&p.x<700){c.globalAlpha=Math.min(1,g.intro);txt(c,s.en,w/2,138,19,'#e8f7ff','center');txt(c,s.sub,w/2,164,12,'#a6c7d8','center');c.globalAlpha=1;}
 }
}
export function stagePreview(canvas,id){const c=canvas.getContext('2d'),s=STAGES[id];canvas.width=400;canvas.height=174;c.save();c.scale(400/640,174/350);background(c,s,640,600,0);platform(c,{x:0,y:306,w:640,h:100,kind:id===1?'belt':id===2?'ice':'solid'},s,0);platform(c,{x:72,y:232,w:142,h:22,kind:'solid',oneWay:true},s,0);bossArt(c,400,180,s,0,'idle',-1,false,1.5);robot(c,114,184,{t:1,shooting:true});c.restore();}

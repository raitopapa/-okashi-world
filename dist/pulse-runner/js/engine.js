import {createLevel,WEAPONS,STAGES,DIFFICULTIES} from './levels.js';
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const approach=(a,b,v)=>a<b?Math.min(a+v,b):Math.max(a-v,b);
const EMPTY={left:false,right:false,jump:false,fire:false,dash:false,weapon:false};
export class Game{
 constructor(save,emit=()=>{}){this.save=save;this.emit=emit;this.viewW=960;this.load(0);this.mode='title';}
 load(id,resume=false){
  if(id===3&&![0,1,2].every(i=>this.save.cleared.includes(i)))return false;
  this.level=createLevel(id);this.difficulty=DIFFICULTIES[this.save.difficulty];const c=resume&&this.save.checkpoint?.stage===id?this.save.checkpoint:null;
  this.checkpoint=c?.index||0;this.collected=new Set(c?.collected||[]);this.score=c?.score||0;this.clock=0;this.elapsed=0;this.deaths=0;this.intro=2.5;this.announcedPhase=false;
  this.spawn();this.mode='playing';this.emit('music',id);return true;
 }
 spawn(){
  const l=this.level,d=this.difficulty,cp=this.checkpoint?l.checkpoints[this.checkpoint-1]:{x:112,y:420};
  this.player={x:cp.x,y:cp.y-44,w:28,h:44,vx:0,vy:0,hp:d.hp,maxHp:d.hp,energy:28,face:1,ground:false,wall:0,coyote:0,buffer:0,invincible:1.2,dashTime:0,dashCooldown:0,airDash:true,airJump:true,jumpLock:0,charge:0,cooldown:0,shootAnim:0,weapon:'pulse'};
  this.enemies=l.enemies.map((e,i)=>({...e,y:e.y-(e.type==='drone'?0:8),startX:e.x,startY:e.y,w:e.type==='turret'?34:30,h:e.type==='drone'?24:30,hp:e.type==='turret'?5:e.type==='hopper'?4:3,vx:-48,vy:0,face:-1,time:i*.47,cooldown:1.3+i*.31,tell:0,hit:0,slow:0,dead:false,ground:false}));
  this.platforms=l.platforms.map(p=>({...p,startX:p.x,dx:0,oneWay:true,kind:'moving'}));
  this.items=l.items.filter(i=>!this.collected.has(i.id)).map(i=>({...i,w:18,h:18,dead:false}));
  this.bullets=[];this.enemyBullets=[];this.particles=[];this.floats=[];this.shake=0;this.hitstop=0;this.stateTime=0;this.previous={...EMPTY};this.previousJump=false;
  this.boss={x:l.bossX,y:340,w:68,h:80,vx:0,vy:0,hp:l.hp,maxHp:l.hp,active:false,dead:false,state:'sleep',timer:1,pattern:0,face:-1,hit:0,phase:1,action:'shoot'};
  this.camera=clamp(this.player.x-this.viewW*.3,0,l.width-this.viewW);
 }
 unlockedWeapons(){return WEAPONS.filter(w=>w.id==='pulse'||this.save.cleared.some(i=>STAGES[i].reward===w.id));}
 cycleWeapon(){const w=this.unlockedWeapons(),p=this.player;p.weapon=w[(w.findIndex(w=>w.id===p.weapon)+1)%w.length].id;p.charge=0;this.emit('weapon',p.weapon);}
 persistCheckpoint(){this.save.checkpoint={stage:this.level.id,index:this.checkpoint,score:this.score,collected:[...this.collected]};this.emit('save');}
 retry(){this.deaths++;this.difficulty=DIFFICULTIES[this.save.difficulty];this.announcedPhase=false;this.spawn();this.mode='playing';this.emit('music',this.level.id);}
 pause(){if(this.mode==='playing'){this.mode='paused';this.player.charge=0;this.emit('pause');}}
 resume(){if(this.mode==='paused'){this.mode='playing';this.previous={...EMPTY};this.emit('resume');}}
 burst(x,y,color,count=12,force=140){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,v=force*(.3+Math.random());this.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.25+Math.random()*.4,max:.65,color,size:2+Math.random()*4});}if(this.particles.length>180)this.particles.splice(0,this.particles.length-180);}
 float(x,y,text,color='#effaff'){this.floats.push({x,y,text,color,life:1});}
 solidsFor(p){const s=this.level.solids.filter(s=>s.x<p.x+p.w+30&&s.x+s.w>p.x-30);if(this.boss.active&&!this.boss.dead)s.push({x:this.level.gate,y:0,w:24,h:600});return s;}
 move(p,dt,platforms=false){
  p.wall=0;p.x+=p.vx*dt;
  for(const s of this.solidsFor(p)){if(s.oneWay||!overlap(p,s))continue;if(p.vx>0){p.x=s.x-p.w;p.wall=1;}else if(p.vx<0){p.x=s.x+s.w;p.wall=-1;}p.vx=0;}
  p.x=clamp(p.x,0,this.level.width-p.w);const feet=p.y+p.h;p.y+=p.vy*dt;p.ground=false;p.floorKind='';
  for(const s of [...this.solidsFor(p),...(platforms?this.platforms:[])]){
   if(!overlap(p,s))continue;
   if(p.vy>=0&&feet<=s.y+6){p.y=s.y-p.h;p.vy=0;p.ground=true;p.floorKind=s.kind;if(s.kind==='moving')p.x+=s.dx;}
   else if(!s.oneWay&&p.vy<0&&p.y+p.h>s.y+s.h){p.y=s.y+s.h;p.vy=0;}
  }
 }
 fire(charge=0){
  const p=this.player;let weapon=p.weapon;if(weapon!=='pulse'&&p.energy<(charge?5:2.5))weapon='pulse';if(weapon!=='pulse')p.energy=Math.max(0,p.energy-(charge?5:2.5));
  const damage=charge>.92?6:charge>.4?3:1,color=WEAPONS.find(w=>w.id===weapon).color,x=p.x+(p.face>0?p.w+4:-10),y=p.y+17;
  for(const a of weapon==='arc'?[-.23,0,.23]:[0])this.bullets.push({x,y:y-(damage>1?5:0),w:damage>1?32:16,h:damage>1?18:8,vx:p.face*Math.cos(a)*(weapon==='frost'?640:800),vy:Math.sin(a)*720,damage,weapon,color,life:1.25,hitIds:new Set(),pierce:weapon==='flame'||damage>3});
  p.shootAnim=.15;p.cooldown=.21;this.emit('sfx',damage>1?'charge':'shot');this.burst(x,y,color,damage>1?8:3,70);
 }
 hurt(damage,x){
  const p=this.player;if(this.mode!=='playing'||p.invincible>0||p.dashTime>0)return;
  p.hp=Math.max(0,p.hp-Math.max(1,Math.round(damage*this.difficulty.damage)));p.invincible=1.1;p.vx=(p.x<x?-1:1)*175;p.vy=-190;p.jumpLock=.18;p.charge=0;
  this.shake=5;this.hitstop=.045;this.burst(p.x+14,p.y+20,'#ffbe9e');this.emit('sfx','hurt');if(p.hp<=0)this.die();
 }
 die(){if(this.mode!=='playing')return;this.player.hp=0;this.mode='dying';this.stateTime=.7;this.burst(this.player.x+14,this.player.y+20,'#77e8ff',35,230);this.emit('sfx','die');this.persistCheckpoint();}
 tick(dt,input=EMPTY){
  if(!['playing','dying','clearing'].includes(this.mode))return;this.clock+=dt;
  for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=280*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);
  for(const f of this.floats){f.y-=28*dt;f.life-=dt;}this.floats=this.floats.filter(f=>f.life>0);this.shake=Math.max(0,this.shake-dt*22);
  if(this.mode==='dying'||this.mode==='clearing'){this.stateTime-=dt;if(this.stateTime<=0){this.mode=this.mode==='dying'?'dead':'clear';this.emit(this.mode);}return;}
  if(this.hitstop>0){this.hitstop-=dt;return;}
  const edge=Object.fromEntries(Object.keys(EMPTY).map(k=>[k,!!input[k]&&!this.previous[k]])),release=!input.fire&&this.previous.fire;this.previous={...input};this.elapsed+=dt;this.intro=Math.max(0,this.intro-dt);
  for(const s of this.platforms){const x=s.x;s.x=s.startX+Math.sin(this.clock*s.speed)*s.range;s.dx=s.x-x;}
  const p=this.player,d=this.difficulty,dir=Number(!!input.right)-Number(!!input.left);
  for(const k of['invincible','dashTime','dashCooldown','jumpLock','cooldown','shootAnim'])p[k]=Math.max(0,p[k]-dt);p.energy=Math.min(28,p.energy+dt*2);
  if(p.ground){p.coyote=.12;p.airDash=true;p.airJump=true;}else p.coyote=Math.max(0,p.coyote-dt);
  p.buffer=edge.jump?.14:Math.max(0,p.buffer-dt);if(edge.weapon)this.cycleWeapon();
  if(p.jumpLock<=0&&p.dashTime<=0){const a=p.floorKind==='ice'&&p.ground?1050:2400;p.vx=approach(p.vx,dir*260,dt*(dir?a:p.floorKind==='ice'?550:2300));if(dir)p.face=dir;}
  if(edge.dash&&p.dashCooldown<=0&&(p.ground||p.airDash)){p.dashTime=.18;p.dashCooldown=.48;p.vx=p.face*640;p.vy=0;if(!p.ground)p.airDash=false;this.emit('sfx','dash');this.burst(p.x+14,p.y+36,'#82e9ff',8,80);}
  if(p.buffer>0){
   if(p.coyote>0){p.vy=-d.jump;p.ground=false;p.coyote=0;p.buffer=0;this.emit('sfx','jump');}
   else if(p.wall&&!p.ground){p.vy=-d.jump*.94;p.vx=-p.wall*340;p.face=-p.wall;p.jumpLock=.18;p.buffer=0;p.airDash=true;this.emit('sfx','jump');}
   else if(d.double&&p.airJump){p.vy=-d.jump*.88;p.airJump=false;p.buffer=0;this.burst(p.x+14,p.y+44,'#a8ebff',10,70);this.emit('sfx','jump');}
  }
  if(!input.jump&&this.previousJump&&p.vy<-220)p.vy*=.5;this.previousJump=!!input.jump;
  if(p.dashTime<=0)p.vy=Math.min(850,p.vy+d.gravity*dt);else{p.vy=0;if(Math.floor(this.clock*60)%2===0)this.particles.push({x:p.x+14,y:p.y+22,vx:-p.face*80,vy:0,life:.18,max:.18,size:18,color:'#6ae0ff'});}
  if(p.wall&&p.vy>100&&dir===p.wall)p.vy=100;if(p.ground&&p.floorKind==='belt')p.x+=66*dt;
  this.move(p,dt,true);if(p.y>590){this.die();return;}
  if(edge.fire){p.charge=0;if(p.cooldown<=0)this.fire();}if(input.fire){p.charge=Math.min(1.2,p.charge+dt);if(p.charge<.48&&p.cooldown<=0)this.fire();if(p.charge>=1&&p.charge-dt<1)this.emit('sfx','ready');}
  if(release){if(p.charge>=.4)this.fire(p.charge);p.charge=0;}if(this.save.autoFire&&!input.fire&&p.cooldown<=0)this.fire();
  this.level.checkpoints.forEach((cp,i)=>{if(i+1>this.checkpoint&&p.x+p.w>cp.x&&p.x<cp.x+42&&p.y+p.h>cp.y-90){this.checkpoint=i+1;p.hp=p.maxHp;p.energy=28;this.persistCheckpoint();this.float(cp.x,cp.y-90,'CHECKPOINT','#9effc5');this.emit('checkpoint');this.burst(cp.x+8,cp.y-48,'#9effc5',25,90);}});
  for(const i of this.items){if(i.dead||!overlap(p,i))continue;i.dead=true;this.collected.add(i.id);if(i.type==='health'){p.hp=Math.min(p.maxHp,p.hp+6);this.float(i.x,i.y,'+ HP','#a5ffc9');}else if(i.type==='core'){this.score+=300;this.float(i.x,i.y,'DATA CORE','#ffda8e');this.emit('core');}else{p.energy=Math.min(28,p.energy+6);this.score+=30;}this.emit('sfx','pickup');this.burst(i.x+9,i.y+9,'#fae5a8',7,65);}
  for(const h of this.level.hazards){const f=(this.clock+h.offset)%h.period;h.warning=f>h.period-1.8&&f<=h.period-1.1;h.active=f>h.period-1.1;if(h.active&&overlap(p,h))this.hurt(3,h.x+h.w/2);}
  this.updateEnemies(dt);
  if(!this.boss.active&&p.x>this.level.gate+36){this.boss.active=true;this.boss.state='wake';this.boss.timer=1.25;p.hp=p.maxHp;p.energy=28;this.enemyBullets=[];this.enemies.forEach(e=>e.dead=true);this.emit('boss',this.level.boss);this.emit('music','boss');}
  this.updateBoss(dt);this.updateBullets(dt);
  const min=this.boss.active&&!this.boss.dead?Math.min(this.level.gate-60,this.level.width-this.viewW):0;
  const target=clamp(p.x-this.viewW*.38+p.face*44,min,this.level.width-this.viewW);this.camera+=(target-this.camera)*(1-Math.exp(-dt*7));
 }
 updateEnemies(dt){
  const p=this.player,speed=this.difficulty.speed;
  for(const e of this.enemies){if(e.dead||Math.abs(e.x-p.x)>1000)continue;e.time+=dt;e.hit=Math.max(0,e.hit-dt);e.slow=Math.max(0,e.slow-dt);const es=speed*(e.slow>0?.42:1);e.face=p.x<e.x?-1:1;
   if(e.type==='drone'){e.x=e.startX+Math.sin(e.time*.8)*76;e.y=e.startY+Math.sin(e.time*2)*29;}
   else if(e.type==='walker'){e.vx=(e.vx>=0?1:-1)*56*es;const a={x:e.x+(e.vx>0?e.w+8:-8),y:e.y+e.h+4,w:4,h:10};if(e.ground&&!this.level.solids.some(s=>overlap(a,s)))e.vx*=-1;e.vy=Math.min(700,e.vy+1700*dt);const vx=e.vx;this.move(e,dt);if(e.wall)e.vx=-vx;}
   else if(e.type==='hopper'){if(e.ground&&e.cooldown<=0){e.vy=-480;e.vx=e.face*135*es;e.cooldown=1.6/es;}e.vy=Math.min(700,e.vy+1700*dt);this.move(e,dt);e.cooldown-=dt;if(e.ground)e.vx=0;}
   if(e.type==='turret'||e.type==='drone'){e.cooldown-=dt*es;e.tell=e.cooldown<=.48&&e.cooldown>0?e.cooldown:0;if(e.cooldown<=0){if(Math.abs(e.x-p.x)<680)this.enemyShot(e.x+15,e.y+12,p.x+14,p.y+22,(e.type==='turret'?240:205)*speed,'#ffb77a');e.cooldown=e.type==='turret'?2.25:2.9;e.tell=0;}}
   if(e.y>600)e.dead=true;if(overlap(p,e))this.hurt(3,e.x+15);
  }
 }
 enemyShot(x,y,tx,ty,speed,color='#ff9c94',angle=0,kind='orb'){const a=Math.atan2(ty-y,tx-x)+angle;this.enemyBullets.push({x,y,w:kind==='wave'?28:12,h:kind==='wave'?28:12,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:5,color,kind});}
 updateBoss(dt){
  const b=this.boss,p=this.player,l=this.level;if(!b.active||b.dead)return;b.hit=Math.max(0,b.hit-dt);b.timer-=dt;b.face=p.x<b.x?-1:1;b.phase=b.hp<=b.maxHp*.5?2:1;
  if(b.phase===2&&!this.announcedPhase){this.announcedPhase=true;this.emit('rage');this.burst(b.x+34,b.y+30,l.accent,24,180);}const fast=this.difficulty.speed*(b.phase===2?1.18:1);
  if((b.state==='idle'||b.state==='wake')&&b.timer<=0){const patterns=l.id===0?['shoot','leap','shoot','rush']:l.id===1?['leap','shoot','rush']:l.id===2?['rush','shoot','leap']:['shoot','rush','leap','shoot'];b.action=patterns[b.pattern++%patterns.length];b.state='tell';b.timer=.7/fast;b.vx=0;}
  else if(b.state==='tell'&&b.timer<=0){
   if(b.action==='shoot'){const n=b.phase===2?5:3;for(let i=0;i<n;i++)this.enemyShot(b.x+34,b.y+38,p.x+14,p.y+20,245*fast,l.accent,(i-(n-1)/2)*.19);this.emit('sfx','enemyShot');b.state='idle';b.timer=1.15/fast;}
   else if(b.action==='rush'){b.state='rush';b.vx=b.face*340*fast;b.timer=1/fast;this.emit('sfx','dash');}
   else{b.state='leap';b.vy=-640;b.vx=clamp((p.x-b.x)*1.35,-260,260);b.timer=2;}
  }
  if(b.state==='rush'){b.x+=b.vx*dt;if(b.timer<=0||b.x<=l.gate+42||b.x>=l.width-92){b.state='idle';b.timer=1/fast;b.vx=0;}}
  if(b.state==='leap'){b.vy+=1540*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.y+b.h>=420&&b.vy>0){b.y=420-b.h;b.vy=0;b.vx=0;b.state='idle';b.timer=1.1/fast;this.shake=7;for(const dir of[-1,1])this.enemyShot(b.x+30,392,b.x+30+dir*100,392,255*fast,l.accent,0,'wave');this.burst(b.x+34,416,l.accent,25,190);this.emit('sfx','explode');}}
  b.x=clamp(b.x,l.gate+38,l.width-90);if(b.state!=='wake'&&overlap(p,b))this.hurt(4,b.x+34);
 }
 updateBullets(dt){
  for(const b of this.bullets){const x=b.x;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;const swept={x:Math.min(x,b.x),y:b.y,w:b.w+Math.abs(b.x-x),h:b.h};
   if(this.level.solids.some(s=>!s.oneWay&&overlap(swept,s))){b.life=0;continue;}
   for(let i=0;i<this.enemies.length;i++){const e=this.enemies[i];if(e.dead||b.hitIds.has(i)||!overlap(swept,e))continue;b.hitIds.add(i);e.hp-=b.damage;e.hit=.09;if(b.weapon==='frost')e.slow=1.6;this.burst(b.x,b.y,b.color,4,80);if(!b.pierce)b.life=0;if(e.hp<=0){e.dead=true;this.score+=100;this.burst(e.x+15,e.y+15,'#ffc086',15,160);this.emit('sfx','explode');this.hitstop=.025;}else this.emit('sfx','hit');if(b.life<=0)break;}
   const boss=this.boss;
   if(b.life>0&&boss.active&&!boss.dead&&boss.state!=='wake'&&boss.hit<=0&&!b.hitIds.has('boss')&&overlap(swept,boss)){
    b.hitIds.add('boss');const weak=b.weapon===this.level.weak||(this.level.id===3&&b.weapon!=='pulse'),damage=b.damage*(weak?2:1);boss.hp=Math.max(0,boss.hp-damage);boss.hit=.1;b.life=0;
    this.float(boss.x+20,boss.y,weak?`${damage} WEAK`:String(damage),b.color);this.burst(b.x,b.y,b.color,8,140);this.hitstop=.035;this.shake=2;this.emit('sfx','hit');if(boss.hp<=0)this.win();
   }
  }
  for(const b of this.enemyBullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.kind!=='wave'&&this.level.solids.some(s=>!s.oneWay&&overlap(b,s)))b.life=0;if(overlap(b,this.player)){this.hurt(b.kind==='wave'?4:3,b.x);b.life=0;}}
  this.bullets=this.bullets.filter(b=>b.life>0);this.enemyBullets=this.enemyBullets.filter(b=>b.life>0);
 }
 win(){const id=this.level.id;this.boss.dead=true;this.mode='clearing';this.stateTime=1.25;this.enemyBullets=[];this.burst(this.boss.x+34,this.boss.y+40,this.level.accent,60,260);this.shake=9;this.score+=1500;
  const cores=this.level.items.filter(i=>i.type==='core'&&this.collected.has(i.id)).length;if(!this.save.cleared.includes(id))this.save.cleared.push(id);this.save.cores[id]=Math.max(this.save.cores[id]||0,cores);this.save.best[id]=Math.max(this.save.best[id]||0,this.score);this.save.checkpoint=null;this.emit('save');this.emit('sfx','win');}
}

import { GAMES } from './model.js';
import { drawSprite } from './art.js';
const $=id=>document.getElementById(id);
export class MiniGames {
  constructor(audio,onComplete){
    this.audio=audio;this.onComplete=onComplete;this.canvas=$('mini-canvas');this.ctx=this.canvas.getContext('2d');this.active=null;this.frameId=0;
    this.canvas.addEventListener('pointerdown',e=>this.down(e));this.canvas.addEventListener('pointermove',e=>this.move(e));this.canvas.addEventListener('pointerup',e=>this.up(e));this.canvas.addEventListener('pointercancel',()=>this.cancelPointer());
    $('mini-close').onclick=()=>this.close();$('mini-dialog').addEventListener('cancel',e=>{e.preventDefault();this.close();});
    document.addEventListener('visibilitychange',()=>{this.last=performance.now();});
  }
  open(id){
    this.close();const game=GAMES.find(g=>g.id===id);this.active={...game,elapsed:0,started:id!=='oven',count:0,stamps:[],falling:[],drag:null,pointerId:null,baking:false,angle:0,spark:0};
    for(let i=0;i<7;i++)this.active.falling.push({x:135+i*120,y:55+Math.random()*200,sprite:[5,10,11,15][i%4],speed:15+Math.random()*13});
    $('mini-title').textContent=game.name;$('mini-hint').textContent=game.hint;$('mini-icon').textContent=game.icon;
    $('mini-progress-fill').style.width='0%';$('mini-dialog').showModal();this.last=performance.now();this.audio.resume();this.audio.say(game.hint);this.animate();
  }
  close(){cancelAnimationFrame(this.frameId);this.active=null;if($('mini-dialog').open)$('mini-dialog').close();}
  point(e){const r=this.canvas.getBoundingClientRect();const fit=Math.min(r.width/1000,r.height/560),ox=(r.width-1000*fit)/2,oy=(r.height-560*fit)/2;return{x:(e.clientX-r.left-ox)/fit,y:(e.clientY-r.top-oy)/fit};}
  down(e){
    const g=this.active;if(!g||g.pointerId!==null)return;e.preventDefault();g.pointerId=e.pointerId;this.canvas.setPointerCapture(e.pointerId);this.audio.resume();const p=this.point(e);g.lastPoint=p;
    if(g.id==='cookie'){
      if(p.x>115&&p.x<885&&p.y>75&&p.y<480){g.stamps.push({x:p.x,y:p.y,sprite:g.stamps.length%2?10:0});if(g.stamps.length>30)g.stamps.shift();g.count++;this.audio.effect('soft');g.spark=.8;}
    }else if(g.id==='chocolate'){g.count++;g.angle+=.7;this.audio.effect('soft');}
    else if(g.id==='catch'){
      if(p.y>390&&p.x>310&&p.x<690&&g.selectedCandy){this.collect(g.selectedCandy);g.selectedCandy=null;}
      else{const candy=g.falling.find(c=>Math.hypot(c.x-p.x,c.y-p.y)<75);if(candy){g.drag=candy;g.selectedCandy=candy;g.dragStart=p;}}
    }else if(g.id==='oven'&&!g.baking){
      if(p.x<375&&p.y>155){g.drag={x:p.x,y:p.y};g.doughSelected=true;}
      else if(p.x>440&&p.x<840&&p.y>120&&g.doughSelected)this.bake();
    }
  }
  move(e){
    const g=this.active;if(!g||g.pointerId!==e.pointerId)return;e.preventDefault();const p=this.point(e);
    if(g.id==='chocolate'&&Math.hypot(p.x-500,p.y-290)<240){const dist=Math.hypot(p.x-g.lastPoint.x,p.y-g.lastPoint.y);g.angle+=dist*.025;g.count+=dist*.02;if(dist>7&&Math.random()<.035)this.audio.effect('soft');}
    if(g.drag){g.drag.x=Math.max(45,Math.min(955,p.x));g.drag.y=Math.max(45,Math.min(525,p.y));}
    g.lastPoint=p;
  }
  up(e){
    const g=this.active;if(!g||g.pointerId!==e.pointerId)return;const p=this.point(e);
    if(g.id==='catch'&&g.drag){if(p.y>370&&p.x>280&&p.x<720){this.collect(g.drag);g.selectedCandy=null;}else if(g.dragStart&&Math.hypot(p.x-g.dragStart.x,p.y-g.dragStart.y)<12){$('mini-caption').textContent='かごを タップしても いいよ';}}
    if(g.id==='oven'&&g.drag&&p.x>410&&p.x<860&&p.y>110&&p.y<490)this.bake();
    g.drag=null;g.pointerId=null;
  }
  cancelPointer(){if(this.active){this.active.drag=null;this.active.pointerId=null;}}
  collect(candy){const g=this.active;g.count++;candy.y=-80;candy.x=100+Math.random()*800;g.spark=1;this.audio.effect();}
  bake(){const g=this.active;g.baking=true;g.started=true;g.elapsed=0;g.drag=null;this.audio.effect();$('mini-hint').textContent='ふっくら おいしく なあれ！';}
  animate(){
    const g=this.active;if(!g)return;const now=performance.now(),dt=Math.min((now-this.last)/1000,.1);this.last=now;
    if(!document.hidden){if(g.started)g.elapsed+=dt;g.spark=Math.max(0,g.spark-dt);if(g.id==='catch')for(const c of g.falling){if(c!==g.drag&&c!==g.selectedCandy){c.y+=c.speed*dt;if(c.y>390)c.y=-70;}}}
    const progress=g.started?Math.min(1,g.elapsed/g.duration):0;$('mini-progress-fill').style.width=`${progress*100}%`;$('mini-dialog').querySelector('[role="progressbar"]').setAttribute('aria-valuenow',String(Math.round(progress*100)));
    $('mini-caption').textContent=g.id==='oven'&&!g.baking?'きじをえらんで、オーブンをタップしても いいよ':progress>.8?'もうすぐ できるよ！':g.count>0?'いいね、そのちょうし！':'ゆっくり あそぼう';
    this.draw(g,progress);
    if(progress>=1){const id=g.id;this.close();this.onComplete(id);return;}
    this.frameId=requestAnimationFrame(()=>this.animate());
  }
  text(text,x,y,size=40,color='#805c46'){const c=this.ctx;c.fillStyle=color;c.font=`${size}px 'Hiragino Maru Gothic ProN',sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y);}
  draw(g,p){
    const c=this.ctx;c.clearRect(0,0,1000,560);c.fillStyle='#f6ebd8';c.fillRect(0,0,1000,560);
    if(g.id==='cookie'){
      c.fillStyle='#e6bf80';c.beginPath();c.roundRect(105,65,790,430,100);c.fill();c.strokeStyle='#d1a56c';c.lineWidth=4;c.setLineDash([6,10]);c.stroke();c.setLineDash([]);
      if(!g.stamps.length){this.text('☝',500,275,105);this.text('ポン！',500,385,30);}
      for(const s of g.stamps)drawSprite(c,s.sprite,s.x,s.y,110,106);
      this.text('🍪',75,55,65);
    }else if(g.id==='chocolate'){
      this.text('🥣',500,285,365);c.fillStyle=`rgb(${107+p*20},${66+p*10},${46+p*8})`;c.beginPath();c.ellipse(500,242,165,76,0,0,Math.PI*2);c.fill();
      c.strokeStyle='#c2916d';c.lineWidth=7;c.lineCap='round';c.beginPath();for(let i=0;i<90;i++){const a=i*.13+g.angle,r=i*1.5,x=500+Math.cos(a)*r,y=242+Math.sin(a)*r*.37;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
      this.text('🥄',500+Math.cos(g.angle)*125,225+Math.sin(g.angle)*42,90);drawSprite(c,1,115,120,135,107);drawSprite(c,9,890,420,135,107);this.text('くるくる',500,475,33);
    }else if(g.id==='catch'){
      c.fillStyle='#e4ebd8';c.fillRect(0,0,1000,560);this.text('🧺',500,455,180);
      if(g.selectedCandy){c.strokeStyle='#ac798b';c.lineWidth=4;c.setLineDash([5,7]);c.strokeRect(g.selectedCandy.x-52,g.selectedCandy.y-52,104,104);c.setLineDash([]);}
      for(const candy of g.falling)drawSprite(c,candy.sprite,candy.x,candy.y,88,88);
      if(g.count)this.text('✦ '.repeat(Math.min(g.count,8)),500,530,27,'#c89955');
    }else{
      c.fillStyle=g.baking?'#ecd1ad':'#e5d8c6';c.beginPath();c.roundRect(435,95,395,365,50);c.fill();
      c.fillStyle=g.baking?'#d99558':'#8b7160';c.beginPath();c.roundRect(465,175,335,220,30);c.fill();
      this.text('●  ●  ●',630,138,25,'#a5745c');
      if(!g.baking){drawSprite(c,12,g.drag?.x??230,g.drag?.y??310,210,120);this.text('➜',355,305,48);this.text('オーブン',635,430,26);}
      else{drawSprite(c,p>.5?13:12,632,295,210+p*45,110+p*28);this.text('♨',632,217,53,'#fff1d3');this.text('ふっくら…',240,307,31);this.text('🐰',230,402,75);}
    }
    if(g.spark>0){this.text('✦',85,470,40,'#d7a144');this.text('✧',905,75,48,'#d7a144');}
  }
}

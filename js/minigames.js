import { GAMES,gameProgress } from './model.js';
import { drawSprite,spriteElement } from './art.js';
const $=id=>document.getElementById(id);
export class MiniGames {
  constructor(audio,onComplete){
    this.audio=audio;this.onComplete=onComplete;this.canvas=$('mini-canvas');this.ctx=this.canvas.getContext('2d');this.active=null;this.frameId=0;
    this.canvas.addEventListener('pointerdown',e=>this.down(e));this.canvas.addEventListener('pointermove',e=>this.move(e));this.canvas.addEventListener('pointerup',e=>this.up(e));this.canvas.addEventListener('pointercancel',()=>this.cancelPointer());
    $('mini-close').onclick=()=>this.close();$('mini-dialog').addEventListener('cancel',e=>{e.preventDefault();this.close();});
    document.addEventListener('visibilitychange',()=>{this.last=performance.now();});
  }
  open(id){
    this.close();const game=GAMES.find(g=>g.id===id);this.active={...game,elapsed:0,count:0,stamps:[],falling:[],drag:null,pointerId:null,baking:false,angle:0,spark:0,finishing:false,completeFor:0};
    for(let i=0;i<7;i++)this.active.falling.push({x:135+i*120,y:55+Math.random()*200,sprite:[5,10,11,15][i%4],speed:15+Math.random()*13});
    $('mini-title').textContent=game.name;$('mini-hint').textContent=game.hint;$('mini-icon').replaceChildren(spriteElement(game.crew));
    $('mini-progress-fill').style.width='0%';$('mini-dialog').showModal();this.last=performance.now();this.audio.resume();this.animate();
  }
  close(){cancelAnimationFrame(this.frameId);this.active=null;if($('mini-dialog').open)$('mini-dialog').close();}
  point(e){const r=this.canvas.getBoundingClientRect();const fit=Math.min(r.width/1000,r.height/560),ox=(r.width-1000*fit)/2,oy=(r.height-560*fit)/2;return{x:(e.clientX-r.left-ox)/fit,y:(e.clientY-r.top-oy)/fit};}
  down(e){
    const g=this.active;if(!g||g.finishing||g.pointerId!==null)return;e.preventDefault();g.pointerId=e.pointerId;this.canvas.setPointerCapture(e.pointerId);this.audio.resume();const p=this.point(e);g.lastPoint=p;
    if(g.id==='cookie'){
      if(p.x>170&&p.x<820&&p.y>135&&p.y<435){g.stamps.push({x:p.x,y:p.y,sprite:g.stamps.length%3?0:8});if(g.stamps.length>30)g.stamps.shift();g.count++;this.audio.effect('build');g.spark=.8;}
    }else if(g.id==='chocolate'&&Math.hypot(p.x-500,p.y-290)<240){g.count++;g.angle+=.7;this.audio.effect('soft');}
    else if(g.id==='catch'){
      if(p.y>390&&p.x>310&&p.x<690&&g.selectedCandy){this.collect(g.selectedCandy);g.selectedCandy=null;}
      else{const candy=g.falling.find(c=>Math.hypot(c.x-p.x,c.y-p.y)<75);if(candy){g.drag=candy;g.selectedCandy=candy;g.dragStart=p;}}
    }else if(g.id==='oven'&&g.baking){g.elapsed=g.duration;
    }else if(g.id==='oven'){
      if(p.x<375&&p.y>155){g.drag={x:p.x,y:p.y};g.doughSelected=true;}
      else if(p.x>440&&p.x<840&&p.y>120&&g.doughSelected)this.bake();
    }
  }
  move(e){
    const g=this.active;if(!g||g.finishing||g.pointerId!==e.pointerId)return;e.preventDefault();const p=this.point(e);
    if(g.id==='chocolate'&&Math.hypot(p.x-500,p.y-290)<240&&Math.hypot(g.lastPoint.x-500,g.lastPoint.y-290)<240){const dist=Math.hypot(p.x-g.lastPoint.x,p.y-g.lastPoint.y);g.angle+=dist*.025;g.count+=dist/160;if(dist>7&&Math.random()<.035)this.audio.effect('soft');}
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
  bake(){const g=this.active;g.baking=true;g.elapsed=0;g.drag=null;this.audio.effect();$('mini-hint').textContent='すぐ やけるよ！ タップで とりだそう';}
  animate(){
    const g=this.active;if(!g)return;const now=performance.now(),dt=Math.min((now-this.last)/1000,.1);this.last=now;
    if(!document.hidden){if(g.baking)g.elapsed+=dt;g.spark=Math.max(0,g.spark-dt);if(g.finishing)g.completeFor+=dt;if(g.id==='catch')for(const c of g.falling){if(c!==g.drag&&c!==g.selectedCandy){c.y+=c.speed*dt;if(c.y>390)c.y=-70;}}}
    const progress=gameProgress(g);$('mini-progress-fill').style.width=`${progress*100}%`;$('mini-dialog').querySelector('[role="progressbar"]').setAttribute('aria-valuenow',String(Math.round(progress*100)));
    $('mini-caption').textContent=progress>=1?'できあがり！':g.id==='oven'&&!g.baking?'きじをえらんで、かまどを タップしても いいよ':g.id==='catch'&&g.selectedCandy?'かごを タップしても いいよ':g.id==='cookie'?`あと ${Math.max(0,g.target-g.count)}かい ポン！`:g.id==='catch'?`あと ${Math.max(0,g.target-g.count)}こ はこぼう`:g.id==='chocolate'?'まぜたぶんだけ すすむよ':'タップすると とりだせるよ';
    this.draw(g,progress);
    if(progress>=1){g.finishing=true;if(g.completeFor>=.35){const id=g.id;this.close();this.onComplete(id);return;}}
    this.frameId=requestAnimationFrame(()=>this.animate());
  }
  text(text,x,y,size=40,color='#805c46'){const c=this.ctx;c.fillStyle=color;c.font=`${size}px 'Hiragino Maru Gothic ProN',sans-serif`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,x,y);}
  draw(g,p){
    const c=this.ctx;c.clearRect(0,0,1000,560);c.fillStyle='#fff3d5';c.fillRect(0,0,1000,560);
    if(g.id==='cookie'){
      drawSprite(c,31,500,287,815,438);
      if(!g.stamps.length){this.text('ここを ポン！',460,270,40);this.text('れんがを つくろう',460,330,28);}
      for(const s of g.stamps)drawSprite(c,s.sprite,s.x,s.y,103,78);
      drawSprite(c,g.spark?27:24,91,402,108,189);drawSprite(c,0,907,444,100,100);
    }else if(g.id==='chocolate'){
      drawSprite(c,30,500,290,428,380,Math.sin(g.angle)*.025);
      c.save();c.beginPath();c.ellipse(480,310,130,31,0,0,Math.PI*2);c.clip();
      c.strokeStyle='#e6bc86';c.globalAlpha=.7;c.lineWidth=6;c.lineCap='round';c.beginPath();for(let i=0;i<90;i++){const a=i*.13+g.angle,r=i*1.5,x=480+Math.cos(a)*r,y=310+Math.sin(a)*r*.23;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();c.restore();
      drawSprite(c,28,153,395,230,154);drawSprite(c,25,855,380,199,173,Math.sin(g.angle)*.035);drawSprite(c,17,850,130,144,103);this.text('くるくる、まぜよう',500,511,31);
    }else if(g.id==='catch'){
      c.fillStyle='#eff1cf';c.fillRect(0,0,1000,560);drawSprite(c,23,500,445,227,216);drawSprite(c,28,140,432,240,160);drawSprite(c,26,848,422,232,173);
      if(g.selectedCandy){c.strokeStyle='#298987';c.lineWidth=4;c.setLineDash([5,7]);c.strokeRect(g.selectedCandy.x-52,g.selectedCandy.y-52,104,104);c.setLineDash([]);}
      for(const candy of g.falling)drawSprite(c,candy.sprite,candy.x,candy.y,88,88);
      if(g.count)this.text('✦ '.repeat(Math.min(g.count,8)),500,542,23,'#b57722');
    }else{
      drawSprite(c,29,636,287,424,392);drawSprite(c,24,914,402,98,174);
      if(!g.baking){drawSprite(c,12,g.drag?.x??230,g.drag?.y??310,210,120);this.text('➜',370,313,48);this.text('かまどへ どうぞ',280,445,29);}
      else{drawSprite(c,p>.5?13:12,636,373,150+p*26,76+p*17);this.text('♨',630,292,45,'#fff1d3');this.text('こんがり…',230,224,32);drawSprite(c,p>.8?27:24,224,394,108,186);}
    }
    if(g.spark>0){this.text('✦',85,470,40,'#d7a144');this.text('✧',905,75,48,'#d7a144');}
  }
}

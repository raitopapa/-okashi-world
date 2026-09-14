// New score/patches, using the envelope and look-ahead technique from Bramble's Dash.
const tracks={menu:{bpm:108,roots:[45,41,48,43],melody:[12,19,15,22,19,15,10,17]},0:{bpm:142,roots:[45,41,48,43],melody:[12,19,24,22,19,15,17,19]},1:{bpm:130,roots:[40,43,38,42],melody:[12,12,19,15,12,22,19,15]},2:{bpm:118,roots:[47,43,50,45],melody:[24,19,15,22,19,17,15,12]},3:{bpm:150,roots:[42,38,45,40],melody:[12,19,22,24,19,17,15,10]},boss:{bpm:164,roots:[40,39,38,43],melody:[12,19,12,15,22,19,15,10]}};
const hz=n=>440*2**((n-69)/12);
export class Sound{
 constructor(muted=false){this.muted=muted;this.track='menu';this.paused=false;this.nodes=new Set();this.step=0;}
 unlock(){try{if(!this.ctx){this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=this.muted?0:.48;this.master.connect(this.ctx.destination);this.music=this.ctx.createGain();this.music.gain.value=.26;this.music.connect(this.master);this.fx=this.ctx.createGain();this.fx.gain.value=.68;this.fx.connect(this.master);this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate*.18,this.ctx.sampleRate);const a=this.noise.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;this.next=this.ctx.currentTime+.07;this.timer=setInterval(()=>this.schedule(),35);}if(!this.paused)this.ctx.resume().catch(()=>{});}catch{}}
 tone(f,dur=.1,vol=.15,type='square',delay=0,end=f,music=false){if(!this.ctx||this.muted||this.paused)return;const t=this.ctx.currentTime+Math.max(0,delay),o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(1,f),t);o.frequency.exponentialRampToValueAtTime(Math.max(1,end),t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(music?this.music:this.fx);o.start(t);o.stop(t+dur+.02);this.nodes.add(o);o.onended=()=>{this.nodes.delete(o);o.disconnect();g.disconnect();};}
 hiss(vol=.2,dur=.1,delay=0,music=false){if(!this.ctx||this.muted||this.paused)return;const t=this.ctx.currentTime+Math.max(0,delay),s=this.ctx.createBufferSource(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();s.buffer=this.noise;f.type='highpass';f.frequency.value=music?5800:900;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(music?this.music:this.fx);s.start(t);s.stop(t+dur);this.nodes.add(s);s.onended=()=>{this.nodes.delete(s);s.disconnect();g.disconnect();f.disconnect();};}
 stopNodes(){for(const n of this.nodes)try{n.stop();}catch{}this.nodes.clear();}
 setTrack(id){if(this.track===id)return;this.track=id;this.step=0;if(this.ctx){this.stopNodes();this.next=this.ctx.currentTime+.09;}}
 setMuted(v){this.muted=v;if(this.master){this.master.gain.setTargetAtTime(v?0:.48,this.ctx.currentTime,.025);this.next=this.ctx.currentTime+.06;}}
 setPaused(v){this.paused=v;if(!this.ctx)return;if(v){this.stopNodes();this.ctx.suspend().catch(()=>{});}else{this.next=this.ctx.currentTime+.08;this.ctx.resume().catch(()=>{});}}
 schedule(){if(!this.ctx||this.muted||this.paused||this.ctx.state!=='running')return;const cfg=tracks[this.track]||tracks.menu,eighth=60/cfg.bpm/2;if(this.next<this.ctx.currentTime-.2)this.next=this.ctx.currentTime+.025;
  for(let n=0;n<8&&this.next<this.ctx.currentTime+.14;n++){const i=this.step%64,bar=Math.floor(i/8),beat=i%8,root=cfg.roots[bar%4],delay=this.next-this.ctx.currentTime,m=cfg.melody[(beat+(bar>=4?3:0))%8]+(bar>=4&&beat===7?12:0);this.tone(hz(root+m),eighth*.7,.095,this.track===2?'triangle':'square',delay,hz(root+m),true);if(beat%2===0)this.tone(hz(root+(beat===6?7:0)-12),eighth*1.4,.24,'triangle',delay,hz(root+(beat===6?7:0)-12),true);if(beat===0||beat===4)this.tone(130,.11,.24,'sine',delay,40,true);if(beat===2||beat===6)this.hiss(.095,.055,delay,true);if(this.track!=='menu')this.hiss(beat%2?.035:.017,.027,delay,true);this.next+=eighth;this.step++;}
 }
 effect(name){
  if(name==='shot')this.tone(880,.085,.12,'square',0,240);
  else if(name==='charge'){this.tone(190,.18,.22,'sawtooth',0,1100);this.hiss(.14,.1);}
  else if(name==='ready'){this.tone(1200,.06,.1,'sine');this.tone(1800,.09,.09,'sine',.07);}
  else if(name==='jump')this.tone(270,.13,.13,'square',0,600);
  else if(name==='dash'){this.hiss(.18,.14);this.tone(200,.12,.13,'sawtooth',0,440);}
  else if(name==='pickup'||name==='checkpoint'){this.tone(988,.07,.1);this.tone(1480,.13,.1,'triangle',.06);}
  else if(name==='hit')this.tone(145,.065,.18,'square',0,60);
  else if(name==='hurt'){this.hiss(.22,.13);this.tone(270,.22,.15,'sawtooth',0,80);}
  else if(name==='explode'){this.hiss(.26,.16);this.tone(90,.15,.2,'triangle',0,30);}
  else if(name==='enemyShot')this.tone(180,.14,.15,'sawtooth',0,540);
  else if(name==='die')[440,370,280,165].forEach((f,i)=>this.tone(f,.13,.13,'triangle',i*.1));
  else if(name==='win')[523,659,784,1047,988,1175,1319].forEach((f,i)=>this.tone(f,.22,.17,'triangle',i*.115));
  else this.tone(660,.06,.08,'triangle');
 }
}

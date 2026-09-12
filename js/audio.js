import {CelebrationCues} from './celebrations.js';
import {stageById} from './model.js';
const MUSIC={
  orchard:{beat:650,duration:1.1,volume:.021,type:'sine',notes:[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,659.25,783.99,1046.5,783.99,698.46,659.25,587.33,523.25]},
  seaside:{beat:850,duration:1.6,volume:.014,type:'triangle',notes:[392,493.88,587.33,493.88,440,523.25,659.25,523.25,392,493.88,587.33,739.99,659.25,587.33,493.88,440]},
  snow:{beat:1050,duration:2.2,volume:.017,type:'sine',notes:[659.25,0,783.99,987.77,880,0,783.99,659.25,587.33,0,659.25,783.99,659.25,587.33,493.88,0]},
};
export class AudioPlayer {
  constructor(settings={}){this.settings={bgm:true,sfx:true,voice:false,...settings};this.context=null;this.timer=null;this.musicBus=null;this.stage='orchard';this.note=0;this.cues=new CelebrationCues();}
  resume(){
    if(!this.context){const AC=window.AudioContext||window.webkitAudioContext;if(AC)this.context=new AC();}
    if(this.context?.state==='suspended')this.context.resume().then(()=>this.startMusic()).catch(()=>{});
    if(this.settings.bgm&&!document.hidden&&!this.timer)this.startMusic();
  }
  tone(freq,delay=0,duration=.24,volume=.075,type='sine',output=this.context?.destination){
    if(!this.context||this.context.state!=='running')return;
    const t=this.context.currentTime+delay,o=this.context.createOscillator(),g=this.context.createGain();
    o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+duration);
    o.connect(g);g.connect(output);o.onended=()=>{o.disconnect();g.disconnect();};o.start(t);o.stop(t+duration+.02);
  }
  effect(kind='place'){
    if(!this.settings.sfx)return;
    if(kind==='build'){this.tone(262,0,.11,.06,'triangle');this.tone(330,.12,.11,.045,'triangle');this.tone(1046.5,.22,.3,.05);return;}
    (kind==='win'?[523.25,659.25,783.99,1046.5]:kind==='soft'?[698.46]:[783.99,1046.5]).forEach((f,i)=>this.tone(f,i*.1,kind==='win'?.55:.22));
  }
  startMusic(){
    if(this.timer!==null||!this.settings.bgm||document.hidden||this.context?.state!=='running')return;
    const song=MUSIC[this.stage],bus=this.context.createGain();this.musicBus=bus;bus.connect(this.context.destination);
    bus.gain.setValueAtTime(0,this.context.currentTime);bus.gain.linearRampToValueAtTime(1,this.context.currentTime+.15);
    const play=()=>{if(document.hidden)return;const freq=song.notes[this.note++%song.notes.length];if(!freq)return;
      this.tone(freq,0,song.duration,song.volume,song.type,bus);
      if(this.stage==='snow')this.tone(freq*2,0,.6,.003,'sine',bus);
    };
    play();this.timer=setInterval(play,song.beat);
  }
  stopMusic(){
    clearInterval(this.timer);this.timer=null;
    const bus=this.musicBus;this.musicBus=null;if(!bus)return;
    const now=this.context.currentTime;bus.gain.cancelScheduledValues(now);bus.gain.setValueAtTime(bus.gain.value,now);bus.gain.linearRampToValueAtTime(0,now+.12);
    setTimeout(()=>bus.disconnect(),150);
  }
  setStage(id){const stage=stageById(id).id;if(stage===this.stage)return;this.stopMusic();this.stage=stage;this.note=0;this.startMusic();}
  stop(){this.stopMusic();window.speechSynthesis?.cancel();this.context?.suspend().catch(()=>{});}
  update(key,value){this.settings[key]=value;if(key==='bgm'){this.stopMusic();if(value)this.resume();}if(key==='voice'&&!value)window.speechSynthesis?.cancel();}
  celebrate(kind){
    if(!this.settings.voice||!window.speechSynthesis||window.speechSynthesis.speaking||window.speechSynthesis.pending)return;
    const voice=window.speechSynthesis.getVoices().find(v=>v.lang.startsWith('ja')&&v.localService);
    if(!voice)return;
    const text=this.cues.next(kind,performance.now());if(!text)return;
    const u=new SpeechSynthesisUtterance(text);u.voice=voice;u.lang='ja-JP';u.rate=.85;u.pitch=1.2;
    window.speechSynthesis.speak(u);
  }
}

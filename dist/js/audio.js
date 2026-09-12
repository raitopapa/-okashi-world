import {CelebrationCues} from './celebrations.js';
export class AudioPlayer {
  constructor(settings={}){this.settings={bgm:true,sfx:true,voice:false,...settings};this.context=null;this.timer=null;this.note=0;this.cues=new CelebrationCues();}
  resume(){
    if(!this.context){const AC=window.AudioContext||window.webkitAudioContext;if(AC)this.context=new AC();}
    if(this.context?.state==='suspended')this.context.resume().catch(()=>{});
    if(this.settings.bgm&&!document.hidden&&!this.timer)this.startMusic();
  }
  tone(freq,delay=0,duration=.24,volume=.075,type='sine'){
    if(!this.context||this.context.state!=='running')return;
    const t=this.context.currentTime+delay,o=this.context.createOscillator(),g=this.context.createGain();
    o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+duration);
    o.connect(g);g.connect(this.context.destination);o.start(t);o.stop(t+duration+.02);
  }
  effect(kind='place'){
    if(!this.settings.sfx)return;
    if(kind==='build'){this.tone(262,0,.11,.06,'triangle');this.tone(330,.12,.11,.045,'triangle');this.tone(1046.5,.22,.3,.05);return;}
    (kind==='win'?[523.25,659.25,783.99,1046.5]:kind==='soft'?[698.46]:[783.99,1046.5]).forEach((f,i)=>this.tone(f,i*.1,kind==='win'?.55:.22));
  }
  startMusic(){
    if(this.timer||!this.settings.bgm)return;
    const melody=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,659.25,783.99,1046.5,783.99,698.46,659.25,587.33,523.25];
    this.timer=setInterval(()=>{if(document.hidden)return;this.tone(melody[this.note++%melody.length],0,1.2,.021);},650);
  }
  stop(){clearInterval(this.timer);this.timer=null;window.speechSynthesis?.cancel();this.context?.suspend().catch(()=>{});}
  update(key,value){this.settings[key]=value;if(key==='bgm'){clearInterval(this.timer);this.timer=null;if(value)this.resume();}if(key==='voice'&&!value)window.speechSynthesis?.cancel();}
  celebrate(kind){
    if(!this.settings.voice||!window.speechSynthesis||window.speechSynthesis.speaking||window.speechSynthesis.pending)return;
    const voice=window.speechSynthesis.getVoices().find(v=>v.lang.startsWith('ja')&&v.localService);
    if(!voice)return;
    const text=this.cues.next(kind,performance.now());if(!text)return;
    const u=new SpeechSynthesisUtterance(text);u.voice=voice;u.lang='ja-JP';u.rate=.85;u.pitch=1.2;
    window.speechSynthesis.speak(u);
  }
}

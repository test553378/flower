import test from 'node:test';
import assert from 'node:assert/strict';
import { GameAudio } from '../src/audio.js';
function fixture({ voices = [{lang:'ja-JP',name:'test-ja'}], noSpeech = false } = {}) {
  const intervals=new Map(), utterances=[], nodes=[];let sequence=0,cancels=0;
  class Context {
    state='running';currentTime=0;destination={};
    resume(){this.state='running';return Promise.resolve();} suspend(){this.state='suspended';return Promise.resolve();} close(){this.state='closed';return Promise.resolve();}
    createOscillator(){const n={frequency:{value:0},connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}};nodes.push(n);return n;}
    createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
  }
  const win={AudioContext:Context,setInterval(fn){const id=++sequence;intervals.set(id,fn);return id;},clearInterval(id){intervals.delete(id);},
    SpeechSynthesisUtterance:class {constructor(text){this.text=text;}},speechSynthesis:{cancel(){cancels++;},speak(utterance){utterances.push(utterance);},getVoices(){return voices;}}};
  if(noSpeech){delete win.speechSynthesis;delete win.SpeechSynthesisUtterance;}
  return {audio:new GameAudio(win),win,intervals,utterances,nodes,get cancels(){return cancels;}};
}
test('T-15: three independent initially-on channels; original score starts after unlock',()=>{
  const f=fixture(),a=f.audio;
  assert.deepEqual(a.settings,{bgm:true,effects:true,voice:true});a.setActive(true);assert.equal(f.intervals.size,0);
  a.unlock();assert.equal(f.intervals.size,1);const musicNotes=f.nodes.length;assert(musicNotes>0);
  a.toggle('effects');a.effect('correct');assert.equal(f.nodes.length,musicNotes);assert.equal(f.intervals.size,1);
  a.speak('こんにちは');assert.equal(f.utterances.length,1);
  a.toggle('bgm');assert.equal(f.intervals.size,0);assert.equal(a.settings.voice,true);
  a.toggle('effects');a.effect('correct');assert(f.nodes.length>musicNotes);
  a.toggle('voice');a.speak('よみあげない');assert.equal(f.utterances.length,1);assert.equal(a.settings.effects,true);a.destroy();
});
test('T-15: every new utterance cancels the last; stale callbacks cannot affect current speech',()=>{
  const f=fixture(),a=f.audio;
  a.speak('はじめの おねがい');const old=f.utterances[0];
  a.speak('もういちど きく');const current=f.utterances[1];
  assert.equal(f.cancels,2);assert.equal(current.lang,'ja-JP');assert.equal(current.voice.name,'test-ja');
  old.onend();assert.equal(a.utterance,current);current.onend();assert.equal(a.utterance,null);
  a.speak('おねがい');a.setActive(false);assert.equal(a.utterance,null);a.destroy();
});
test('T-15: backgrounding stops speech/music/effects; no music timer duplication on resume',async()=>{
  const f=fixture(),a=f.audio;a.setActive(true);a.unlock();a.effect('correct');a.speak('おねがい');
  a.suspend();assert.equal(f.intervals.size,0);assert.equal(a.utterance,null);assert.equal(a.musicNodes.size,0);assert.equal(a.effectNodes.size,0);
  a.resume();a.unlock();await Promise.resolve();assert.equal(f.intervals.size,1);a.unlock();assert.equal(f.intervals.size,1);a.destroy();assert.equal(f.intervals.size,0);
});
test('T-15: unavailable speech/audio APIs and empty voice lists do not stop gameplay',()=>{
  const f=fixture({noSpeech:true});assert.doesNotThrow(()=>f.audio.speak('こんにちは'));f.audio.destroy();
  const empty=fixture({voices:[]});empty.audio.speak('こんにちは');assert.equal(empty.utterances[0].lang,'ja-JP');empty.audio.destroy();
  const noAudio=fixture();delete noAudio.win.AudioContext;noAudio.audio.setActive(true);assert.doesNotThrow(()=>noAudio.audio.unlock());assert.doesNotThrow(()=>noAudio.audio.effect('tap'));noAudio.audio.destroy();
});

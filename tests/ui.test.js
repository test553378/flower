import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { Window } from 'happy-dom';
import { createApp } from '../src/app.js';
import { CATALOG, PAPERS, RIBBONS } from '../src/catalog.js';
import { totalStock } from '../src/logic/inventory.js';
function setup() {
  const win = new Window({ url: 'https://example.test/flower/', settings: { disableCSSFileLoading: true, disableJavaScriptFileLoading: true } });
  win.document.body.innerHTML = '<main id="app"></main>';
  Object.defineProperty(win.document, 'hidden', { value: false, configurable:true });
  const root = win.document.getElementById('app'), events = [], pending = new Map(); let sequence=0;
  const audio = { settings:{bgm:true,effects:true,voice:true}, unlock(){}, setActive(value){events.push(['active',value]);}, effect(name){events.push(['effect',name]);}, speak(text){events.push(['speech',text]);}, cancelSpeech(){events.push(['cancel']);}, toggle(key){this.settings[key]=!this.settings[key];}, suspend(){events.push(['suspend']);}, resume(){events.push(['resume']);}, destroy(){} };
  const app = createApp(root, { random: () => .42, audio, timer: {set(fn){const id=++sequence;pending.set(id,fn);return id;},clear(id){pending.delete(id);}} });
  app.render();
  const ui = { win, root, app, events, audio, pending,
    click(action) { const b=[...root.querySelectorAll('button')].find(b=>b.dataset.action===action); assert(b,`Missing button ${action}`); assert(!b.disabled,`Disabled button ${action}`); b.click(); },
    settle() { const [id,fn]=pending.entries().next().value || []; assert(fn,'No receipt timer');pending.delete(id);fn(); },
    checkText() { assert(!/\p{Script=Han}/u.test(root.textContent)); for(const el of root.querySelectorAll('[aria-label],img[alt]')) assert(!/\p{Script=Han}/u.test(el.getAttribute('aria-label')||el.getAttribute('alt'))); },
    destroy(){app.destroy();win.happyDOM.abort();},
  };
  return ui;
}
function fulfill(ui) {
  const order=ui.app.getState().order;
  for(const [id,n] of Object.entries(order)) for(let i=0;i<n;i++) ui.click('flower:'+id);
  if(totalStock(order)>=2){ui.click('tab-wrap');ui.click('wrap:paper:green');ui.click('wrap:ribbon:purple');}
  ui.click('give'); assert.equal(ui.app.getState().screen,'checkout'); ui.checkText();
  assert.equal(ui.root.querySelectorAll('.bouquet-stem').length,totalStock(order));
  ui.settle(); ui.checkText();
}
function unlockFree(ui) {
  ui.click('start');
  for(let stage=1;stage<=5;stage++){
    while(ui.app.getState().screen==='shop') fulfill(ui);
    assert.equal(ui.app.getState().screen,'clear');assert.equal(ui.app.getState().stage,stage);ui.click('next');
  }
  assert.equal(ui.app.getState().screen,'free');
}
test('T-05, T-06, T-07: real tap events preserve wrong flowers, hint tiers and undo', () => {
  const ui=setup();try{
    ui.click('start');assert(!ui.root.querySelector('.hint-flowers'));
    const before=ui.app.getState();
    const wrong=Object.keys(before.stock).find(id=>!before.order[id]);
    ui.click('flower:'+wrong);ui.click('give');
    assert.equal(ui.app.getState().mistakes,1);assert.deepEqual(ui.app.getState().selected,[wrong]);assert.deepEqual(ui.app.getState().stock,before.stock);
    assert(!ui.root.querySelector('.hint-flowers'));assert(ui.root.querySelector('.hint-panel'));assert(ui.events.some(e=>e[0]==='speech'&&e[1].includes('たりない')));
    ui.click('flower:'+wrong);assert(!ui.root.querySelector('.hint-flowers'),'editing must not promote hint tier');
    ui.click('give');assert.equal(ui.app.getState().mistakes,2);assert.equal(ui.root.querySelectorAll('.hint-flowers>div').length,Object.keys(before.order).length);
    ui.click('undo');assert.deepEqual(ui.app.getState().selected,[wrong]);ui.checkText();
  }finally{ui.destroy();}
});
test('T-08, T-18: all 25 combinations have exact stem layers, correct paper and ribbon', () => {
  const ui=setup();try{
    ui.click('start');ui.click('flower:tulip_red');ui.click('flower:rose_pink');ui.click('flower:sunflower_yellow');ui.click('tab-wrap');
    for(const paper of PAPERS)for(const ribbon of RIBBONS){
      ui.click('wrap:paper:'+paper);ui.click('wrap:ribbon:'+ribbon);
      assert.deepEqual([...ui.root.querySelectorAll('.bouquet-stem')].map(img=>img.dataset.stem),['tulip_red','rose_pink','sunflower_yellow']);
      assert(ui.root.querySelector('.paper-back').src.endsWith(`/paper_${paper}.png`));assert(ui.root.querySelector('.paper-front').src.endsWith(`/paper_${paper}.png`));
      assert(ui.root.querySelector('.bouquet-ribbon').src.endsWith(`/ribbon_${ribbon}.png`));ui.checkText();
    }
    assert(![...ui.root.querySelectorAll('img')].some(img=>img.src.includes('bouquet_examples')));
  }finally{ui.destroy();}
});
test('T-10, T-11, T-12, T-17: tap through all 5 stages, create ten-stem bouquets and paginate collection', () => {
  const ui=setup();try{
    ui.checkText();unlockFree(ui);
    assert.equal(ui.root.querySelectorAll('.flower-choice').length,10);
    for(let creation=0;creation<7;creation++){
      for(const id of Object.keys(CATALOG))ui.click('flower:'+id);
      ui.click('flower:tulip_red');assert.equal(ui.app.getState().selected.length,10);assert.equal(ui.root.querySelectorAll('.bouquet-stem').length,10);
      ui.click('tab-wrap');ui.click('wrap:paper:lightblue');ui.click('wrap:ribbon:pink');ui.click('save');ui.checkText();
    }
    assert.equal(ui.app.getState().collection.length,7);ui.click('collection');assert.equal(ui.root.querySelectorAll('.collection-card').length,1);
    ui.click('page-prev');assert.equal(ui.root.querySelectorAll('.collection-card').length,6);
    ui.click('page-next');assert.equal(ui.root.querySelectorAll('.collection-card').length,1);ui.click('back-free');ui.checkText();
    ui.click('settings');for(const key of ['bgm','effects','voice'])ui.click('audio:'+key);ui.checkText();ui.click('close-dialog');
    ui.click('home');ui.checkText();ui.click('close-dialog');assert.equal(ui.app.getState().collection.length,7);
    ui.click('home');ui.click('confirm-home');assert.equal(ui.app.getState().screen,'title');assert.equal(ui.app.getState().collection.length,0);
    assert.deepEqual(ui.audio.settings,{bgm:false,effects:false,voice:false},'title return preserves audio preferences');
  }finally{ui.destroy();}
});
test('T-13, T-14: confirmation blocks reset; new app initializes; no persistent storage', async () => {
  const ui=setup();try{
    ui.click('start');ui.click('flower:tulip_red');const before=ui.app.getState();
    ui.click('home');assert(ui.root.querySelector('[role="dialog"]'));assert.deepEqual(ui.app.getState(),before);ui.click('close-dialog');assert.deepEqual(ui.app.getState(),before);
    ui.click('home');ui.click('confirm-home');assert.equal(ui.app.getState().screen,'title');assert.equal(ui.app.getState().stage,1);assert.deepEqual(ui.app.getState().selected,[]);
    const fresh=setup();try{assert.deepEqual(fresh.app.getState().collection,[]);assert.equal(fresh.app.getState().screen,'title');assert.deepEqual(fresh.audio.settings,{bgm:true,effects:true,voice:true});}finally{fresh.destroy();}
    const files=await readdir(new URL('../src/',import.meta.url));
    for(const file of files.filter(f=>f.endsWith('.js'))) assert(!/localStorage|sessionStorage|indexedDB|document\.cookie/.test(await readFile(new URL('../src/'+file,import.meta.url),'utf8')));
  }finally{ui.destroy();}
});
test('T-09, T-13, T-15: settings/return confirmation pause receipt and cancel pending speech', () => {
  const ui=setup();try{
    ui.click('start');const order=ui.app.getState().order;
    for(const [id,n]of Object.entries(order))for(let i=0;i<n;i++)ui.click('flower:'+id);
    ui.click('give');assert.equal(ui.app.getState().screen,'shop');assert.equal(ui.root.querySelector('[role="tab"][aria-selected="true"]').textContent,'ラッピング');
    ui.click('wrap:paper:pink');ui.click('wrap:ribbon:red');ui.click('give');assert.equal(ui.pending.size,1);
    ui.click('settings');assert.equal(ui.pending.size,0);ui.click('audio:bgm');assert.equal(ui.audio.settings.bgm,false);ui.click('close-dialog');assert.equal(ui.pending.size,1);
    ui.click('home');assert.equal(ui.pending.size,0);ui.click('confirm-home');assert.equal(ui.pending.size,0);assert(ui.events.some(e=>e[0]==='cancel'));assert.equal(ui.app.getState().screen,'title');
  }finally{ui.destroy();}
});
test('T-16 structural checks only: viewport, portrait prompt, touch rules, large controls', async () => {
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8'),css=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');
  assert.match(html,/maximum-scale=1/);assert.match(html,/user-scalable=no/);assert.match(html,/よこに してね/);
  assert.match(css,/@media\(orientation:portrait\)/);assert.match(css,/touch-action:manipulation/);assert.match(css,/overscroll-behavior:none/);assert.match(css,/100dvh/);assert.match(css,/min-height:52px/);
  assert(!/\p{Script=Han}/u.test(html));
});
test('T-18: image failure shows a message while game controls still work', () => {
  const ui=setup();try{
    ui.click('start');ui.root.querySelector('.stock-flower').dispatchEvent(new ui.win.Event('error'));
    assert(ui.root.querySelector('.asset-warning'));ui.click('flower:tulip_red');assert.equal(ui.app.getState().selected.length,1);
    ui.app.reportAssetFailure('backgrounds/shop_interior.png');assert(ui.root.querySelector('.asset-warning'));ui.checkText();
  }finally{ui.destroy();}
});

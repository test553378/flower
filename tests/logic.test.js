import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, STAGES, PAPERS, RIBBONS } from '../src/catalog.js';
import { totalStock, initialStock, consumeStock, priceOf, countFlowers } from '../src/logic/inventory.js';
import { generateOrder, orderKey, feasibleOrders, orderText } from '../src/logic/orders.js';
import { validateBouquet, makeHint } from '../src/logic/validation.js';
import * as game from '../src/logic/state.js';
const expand = order => Object.entries(order).flatMap(([id, n]) => Array(n).fill(id));
function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
test('T-01: exact 5 stage stocks and prices', () => {
  assert.deepEqual(STAGES.map(totalStock), [10,12,15,18,20]);
  assert.equal(STAGES.reduce((sum, stock) => sum + totalStock(stock), 0), 75);
  const copy = initialStock(1); copy.tulip_red--; assert.equal(initialStock(1).tulip_red, 4);
  assert.equal(priceOf(['rose_pink','rose_white','tulip_red']), 700);
});
test('T-02, T-03, T-10: 2,500 seeded stage runs, feasible orders and guaranteed sellout', () => {
  let orders = 0;
  for (let stage = 1; stage <= 5; stage++) for (let seed = 0; seed < 500; seed++) {
    let stock = initialStock(stage), previous = null, customer = 0, sawBouquet = false;
    const random = rng(seed + stage * 99);
    while (totalStock(stock)) {
      const before = { ...stock }, order = generateOrder(stock, stage, customer, previous, random), stems = expand(order);
      assert.deepEqual(stock, before); assert(stems.length >= 1 && stems.length <= 5);
      for (const [id, n] of Object.entries(order)) { assert(CATALOG[id]); assert(n <= stock[id] && n > 0); }
      if (previous && feasibleOrders(stock).length > 1) assert.notEqual(orderKey(order), orderKey(previous));
      sawBouquet ||= stems.length > 1;
      stock = consumeStock(stock, stems); previous = order; orders++; customer++;
      assert(customer <= totalStock(initialStock(stage)));
    }
    assert(sawBouquet); assert.equal(generateOrder(stock, stage, customer), null);
  }
  assert(orders > 10000); console.log(`Generated and sold ${orders} valid orders across 2,500 complete stages.`);
});
test('T-02: arbitrary depleted stock, last stem, unavoidable duplicates', () => {
  const random = rng(234);
  for (let i = 0; i < 2000; i++) {
    const stock = Object.fromEntries(Object.keys(CATALOG).map(id => [id, Math.floor(random() * 4)]));
    const order = generateOrder(stock, 5, i, null, random);
    if (!totalStock(stock)) { assert.equal(order, null); continue; }
    assert(totalStock(order) <= 5); consumeStock(stock, expand(order));
  }
  assert.deepEqual(generateOrder({ rose_white: 1 }, 5, 10), { rose_white: 1 });
  assert.deepEqual(generateOrder({ rose_white: 1 }, 5, 10, { rose_white: 1 }), { rose_white: 1 });
});
test('T-04, T-05: exact type/color/count validation, order independent, extras rejected', () => {
  const order = { tulip_red: 1, rose_pink: 2 };
  assert(validateBouquet(order, ['rose_pink','tulip_red','rose_pink']));
  for (const stems of [[], ['tulip_yellow','rose_pink','rose_pink'], ['tulip_red','rose_pink'], [...expand(order),'rose_white']]) assert(!validateBouquet(order, stems));
  let state = game.startStage(game.createState(), 1, () => 0);
  state = game.selectFlower(state, 'rose_pink');
  const result = game.submit(state);
  assert.equal(result.screen, 'shop'); assert.equal(result.mistakes, 1);
  assert.deepEqual(result.selected, state.selected); assert.deepEqual(result.stock, state.stock); assert.deepEqual(result.order, state.order);
  assert.throws(() => consumeStock({ rose_pink: 0 }, ['rose_pink']), RangeError);
});
test('T-06, T-07: hint tiers, actual differences and LIFO undo', () => {
  const order = { tulip_red: 2, rose_pink: 1 };
  assert.match(makeHint(order, ['tulip_red'], 1).text, /1ぽん たりない/);
  assert.deepEqual(makeHint(order, [], 1).details, []);
  assert.deepEqual(makeHint(order, [], 2).details, [{ id:'tulip_red', count:2 },{ id:'rose_pink', count:1 }]);
  assert.match(makeHint({ tulip_red:1 }, ['tulip_red','rose_white'], 1).text, /おおい/);
  let state = game.startStage(game.createState(), 1);
  state = game.selectFlower(game.selectFlower(state, 'tulip_red'), 'rose_pink');
  assert.deepEqual(game.undo(state).selected, ['tulip_red']);
});
test('T-08, T-09: all 25 wrappings, single stem unwrapped, checkout only once', () => {
  for (const paper of PAPERS) for (const ribbon of RIBBONS) {
    let state = game.startStage(game.createState(), 1, () => 0);
    state = { ...state, selected: expand(state.order) };
    assert.equal(game.submit(state).screen, 'shop');
    state = game.wrap(game.wrap(state, 'paper', paper), 'ribbon', ribbon);
    const result = game.submit(state);
    assert.equal(result.screen, 'checkout'); assert.equal(result.receipt.total, priceOf(state.selected));
    assert.equal(totalStock(result.stock), 10 - state.selected.length);
    assert.deepEqual(game.submit(result), result);
  }
  const state = { ...game.startStage(game.createState(), 1), order:{tulip_red:1}, selected:['tulip_red'] };
  assert.equal(game.submit(state).screen, 'checkout');
});
test('T-10, T-11: complete 5 stages through real state transitions', () => {
  let state = game.startStage(game.createState(), 1, rng(10));
  for (let stage = 1; stage <= 5; stage++) {
    while (state.screen === 'shop') {
      for (const id of expand(state.order)) state = game.selectFlower(state, id);
      state = game.wrap(game.wrap(state,'paper','pink'),'ribbon','red');
      state = game.submit(state); assert.equal(state.screen,'checkout');
      state = game.finishCheckout(state, rng(stage));
    }
    assert.equal(state.screen,'clear'); assert.equal(totalStock(state.stock),0);
    state = game.nextStage(state, rng(stage));
  }
  assert.equal(state.screen,'free');
});
test('T-12, T-14: free mode limits, copies, unlimited collection, fresh initialization', () => {
  let state = { ...game.createState(), screen:'free' };
  for (const id of Object.keys(CATALOG)) state = game.selectFlower(state,id);
  assert.equal(state.selected.length,10); assert.equal(game.selectFlower(state,'rose_pink').selected.length,10);
  state = game.wrap(game.wrap(state,'paper','green'),'ribbon','purple');
  state = game.saveCreation(state); assert.equal(state.collection.length,1); assert.equal(state.collection[0].stems.length,10); assert.equal(state.selected.length,0);
  for(let i=0;i<24;i++) state = game.saveCreation(game.wrap(game.wrap(game.selectFlower(state,'rose_white'),'paper','pink'),'ribbon','red'));
  assert.equal(state.collection.length,25); assert.deepEqual(game.createState().collection,[]); assert.equal(game.createState().stage,1);
});
test('T-17: all catalog, generated orders and hint strings contain no kanji', () => {
  const han = /\p{Script=Han}/u;
  for(const flower of Object.values(CATALOG)) assert(!han.test(flower.label));
  for(const stock of STAGES) { const order=generateOrder(stock,5,5); assert(!han.test(orderText(order))); assert(!han.test(makeHint(order,[],2).text)); }
});

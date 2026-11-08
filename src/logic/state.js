import { CATALOG, PAPERS, RIBBONS } from '../catalog.js?v=20261108-public';
import { initialStock, available, consumeStock, totalStock, priceOf } from './inventory.js?v=20261108-public';
import { generateOrder } from './orders.js?v=20261108-public';
import { validateBouquet, makeHint } from './validation.js?v=20261108-public';
export function createState() {
  return { screen: 'title', stage: 1, stock: initialStock(1), order: null, selected: [], paper: null, ribbon: null, customerIndex: 0, mistakes: 0, hint: null, collection: [], receipt: null, notice: '' };
}
export function startStage(state, stage, random = Math.random) {
  const stock = initialStock(stage);
  return { ...state, screen: 'shop', stage, stock, order: generateOrder(stock, stage, 0, null, random), selected: [], paper: null, ribbon: null, customerIndex: 0, mistakes: 0, hint: null, receipt: null, notice: '' };
}
export function selectFlower(state, id) {
  if (!['shop', 'free'].includes(state.screen) || !CATALOG[id]) return state;
  const limit = state.screen === 'free' ? 10 : 5;
  if (state.selected.length >= limit) return { ...state, notice: `${limit}ほんまで えらべるよ` };
  if (state.screen === 'shop' && available(state.stock, state.selected, id) <= 0) return { ...state, notice: 'この おはなは ぜんぶ えらんだよ' };
  return { ...state, selected: [...state.selected, id], notice: '' };
}
export function undo(state) {
  if (!['shop', 'free'].includes(state.screen)) return state;
  return { ...state, selected: state.selected.slice(0, -1), notice: '' };
}
export function wrap(state, kind, color) {
  if (!['shop', 'free'].includes(state.screen) || !['paper', 'ribbon'].includes(kind)) return state;
  if (!(kind === 'paper' ? PAPERS : RIBBONS).includes(color)) return state;
  return { ...state, [kind]: color, notice: '' };
}
export function submit(state) {
  if (state.screen !== 'shop') return state;
  if (!validateBouquet(state.order, state.selected)) {
    const mistakes = state.mistakes + 1;
    return { ...state, mistakes, hint: makeHint(state.order, state.selected, mistakes), notice: '' };
  }
  if (state.selected.length >= 2 && (!state.paper || !state.ribbon)) return { ...state, notice: 'かみと リボンを えらんでね' };
  return { ...state, screen: 'checkout', stock: consumeStock(state.stock, state.selected), hint: null, notice: '', receipt: { total: priceOf(state.selected), count: state.selected.length } };
}
export function finishCheckout(state, random = Math.random) {
  if (state.screen !== 'checkout') return state;
  if (totalStock(state.stock) === 0) return { ...state, screen: 'clear' };
  const customerIndex = state.customerIndex + 1;
  return { ...state, screen: 'shop', order: generateOrder(state.stock, state.stage, customerIndex, state.order, random), customerIndex, selected: [], paper: null, ribbon: null, mistakes: 0, hint: null, receipt: null, notice: '' };
}
export function nextStage(state, random = Math.random) {
  if (state.screen !== 'clear') return state;
  return state.stage === 5 ? { ...state, screen: 'free', selected: [], paper: null, ribbon: null, notice: '' } : startStage(state, state.stage + 1, random);
}
export function saveCreation(state) {
  if (state.screen !== 'free') return state;
  if (!state.selected.length) return { ...state, notice: 'おはなを えらんでね' };
  if (!state.paper || !state.ribbon) return { ...state, notice: 'かみと リボンを えらんでね' };
  return { ...state, collection: [...state.collection, { stems: [...state.selected], paper: state.paper, ribbon: state.ribbon }], selected: [], paper: null, ribbon: null, notice: 'すてき！ コレクションに ならんだよ' };
}

import { CATALOG, stemCount } from '../catalog.js';
import { totalStock } from './inventory.js';
export const orderKey = order => Object.entries(order).filter(([, n]) => n > 0).sort(([a], [b]) => a.localeCompare(b)).map(([id, n]) => `${id}:${n}`).join('|');
// Enumerate the small feasible space: stock bounds and duplicate avoidance are exact.
export function feasibleOrders(stock) {
  const entries = Object.entries(stock).filter(([id, n]) => CATALOG[id] && n > 0), result = [];
  function visit(index, remaining, order) {
    if (index === entries.length) { if (Object.keys(order).length) result.push({ ...order }); return; }
    const [id, count] = entries[index];
    for (let n = 0; n <= Math.min(count, remaining); n++) {
      if (n) order[id] = n; else delete order[id];
      visit(index + 1, remaining - n, order);
    }
    delete order[id];
  }
  visit(0, 5, {});
  return result;
}
export function generateOrder(stock, stage, customerIndex, previous = null, random = Math.random) {
  if (totalStock(stock) === 0) return null;
  let candidates = feasibleOrders(stock);
  // Start at 2/3/4/5/5 stems; aim for more stems and variety as guests progress.
  const target = Math.min(5, stage + 1 + Math.floor(customerIndex / 2), totalStock(stock));
  const variety = Math.min(Object.values(stock).filter(n => n > 0).length, target, 1 + Math.floor((stage + customerIndex) / 2));
  if (previous && candidates.length > 1) candidates = candidates.filter(o => orderKey(o) !== orderKey(previous));
  const score = o => Math.abs(totalStock(o) - target) * 3 + Math.abs(Object.keys(o).length - variety);
  const best = Math.min(...candidates.map(score));
  candidates = candidates.filter(o => score(o) === best);
  return { ...candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))] };
}
export function orderText(order) {
  const list = Object.entries(order).map(([id, n]) => `${CATALOG[id].label}を ${stemCount(n)}`).join('、');
  return `${list}、${totalStock(order) >= 2 ? 'はなたばに してね！' : 'ください！'}`;
}

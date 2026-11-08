import { countFlowers } from './inventory.js';
import { CATALOG, stemCount } from '../catalog.js';
export function differences(order, selected) {
  const counts = countFlowers(selected);
  return [...new Set([...Object.keys(order), ...Object.keys(counts)])].map(id => ({ id, needed: order[id] || 0, selected: counts[id] || 0, delta: (order[id] || 0) - (counts[id] || 0) })).filter(item => item.delta !== 0);
}
export const validateBouquet = (order, selected) => Object.keys(order).length > 0 && differences(order, selected).length === 0;
export function makeHint(order, selected, mistakes) {
  const text = differences(order, selected).slice(0, 1).map(({ id, delta }) => delta > 0
    ? `${CATALOG[id].label}が ${stemCount(delta)} たりないよ。`
    : `${CATALOG[id].label}が ${stemCount(-delta)} おおいよ。「ひとつ もどす」で もどしてね。`).join(' ');
  return { text: text || 'おはなは ぴったり！「わたす」で とどけよう。', details: mistakes >= 2 ? Object.entries(order).map(([id, count]) => ({ id, count })) : [] };
}

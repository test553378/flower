import { CATALOG, STAGES } from '../catalog.js';
export const totalStock = stock => Object.values(stock).reduce((sum, n) => sum + n, 0);
export const initialStock = stage => ({ ...STAGES[stage - 1] });
export const countFlowers = stems => stems.reduce((counts, id) => ({ ...counts, [id]: (counts[id] || 0) + 1 }), {});
export const priceOf = stems => stems.reduce((sum, id) => sum + CATALOG[id].price, 0);
export const available = (stock, stems, id) => (stock[id] || 0) - (countFlowers(stems)[id] || 0);
export function consumeStock(stock, stems) {
  const counts = countFlowers(stems);
  if (Object.entries(counts).some(([id, n]) => !CATALOG[id] || n > (stock[id] || 0))) throw new RangeError('Stock exceeded');
  return Object.fromEntries(Object.entries(stock).map(([id, n]) => [id, n - (counts[id] || 0)]));
}

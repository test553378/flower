export const ASSET_ROOT = './assets/ohanayasan/';
export const asset = path => ASSET_ROOT + path;
const names = { tulip: 'チューリップ', rose: 'バラ', sunflower: 'ひまわり', gerbera: 'ガーベラ', cosmos: 'コスモス', marguerite: 'マーガレット', carnation: 'カーネーション' };
export const COLORS = {
  red: { name: 'あか', hex: '#e9596e' }, pink: { name: 'ピンク', hex: '#f6a6c7' }, yellow: { name: 'きいろ', hex: '#f4d467' }, white: { name: 'しろ', hex: '#fffaf0' },
  orange: { name: 'オレンジ', hex: '#f8a958' }, purple: { name: 'むらさき', hex: '#c29ae6' }, green: { name: 'みどり', hex: '#9acda3' }, lightblue: { name: 'みずいろ', hex: '#93cfe8' },
};
const prices = { tulip: 100, rose: 300, sunflower: 200, gerbera: 200, cosmos: 100, marguerite: 100, carnation: 200 };
export const CATALOG = Object.fromEntries([
  'tulip_red', 'tulip_yellow', 'rose_pink', 'rose_white', 'sunflower_yellow', 'gerbera_white', 'gerbera_orange', 'cosmos_purple', 'marguerite_white', 'carnation_pink',
].map(id => {
  const [type, color] = id.split('_');
  return [id, { id, type, color, name: names[type], label: `${COLORS[color].name}の ${names[type]}`, price: prices[type], image: `flowers/${id}.png` }];
}));
export const PAPERS = ['pink', 'lightblue', 'yellow', 'purple', 'green'];
export const RIBBONS = ['red', 'pink', 'yellow', 'lightblue', 'purple'];
export const CUSTOMERS = ['girl_orange', 'girl_blue', 'boy_green', 'boy_glasses'];
export const STAGES = [
  { tulip_red: 4, rose_pink: 3, sunflower_yellow: 3 },
  { tulip_red: 3, rose_pink: 3, sunflower_yellow: 3, gerbera_white: 3 },
  { tulip_red: 3, tulip_yellow: 2, rose_pink: 3, sunflower_yellow: 2, gerbera_white: 2, cosmos_purple: 3 },
  { tulip_red: 3, rose_pink: 3, rose_white: 2, sunflower_yellow: 3, gerbera_orange: 3, cosmos_purple: 2, marguerite_white: 2 },
  { tulip_red: 3, rose_pink: 3, rose_white: 2, sunflower_yellow: 2, gerbera_orange: 3, cosmos_purple: 2, marguerite_white: 2, carnation_pink: 3 },
];
export function stemCount(n) { return `${n}${n === 1 ? 'ぽん' : n === 3 ? 'ぼん' : n === 6 || n === 8 || n === 10 ? 'ぽん' : 'ほん'}`; }

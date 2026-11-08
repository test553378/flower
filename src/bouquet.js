import { asset, CATALOG, COLORS, stemCount } from './catalog.js?v=20261108-public';
export function imageTag(path, alt = '', className = '', attrs = '') {
  return `<img src="${asset(path)}" alt="${alt}" class="${className}" draggable="false" decoding="async" ${attrs}>`;
}
export function bouquetMarkup(stems, paper, ribbon, { free = false, small = false } = {}) {
  const wrapped = (free || stems.length >= 2) && stems.length > 0;
  const description = stems.length ? `${stemCount(stems.length)}の ${wrapped ? 'はなたば' : 'おはな'}` : 'ここに おはなが ならぶよ';
  const paperImage = wrapped && paper ? imageTag(`wrapping/paper_${paper}.png`, `${COLORS[paper].name}の かみ`, 'paper-back') : '';
  const layers = stems.map((id, index) => {
    const twoRows = stems.length > 5, row = twoRows && index >= Math.ceil(stems.length / 2) ? 1 : 0;
    const rowCount = twoRows ? (row ? Math.floor(stems.length / 2) : Math.ceil(stems.length / 2)) : stems.length;
    const position = row ? index - Math.ceil(stems.length / 2) : index;
    const angle = rowCount === 1 ? 0 : (position / (rowCount - 1) - .5) * (twoRows ? 64 : 54);
    return imageTag(CATALOG[id].image, CATALOG[id].label, `bouquet-stem ${twoRows ? 'two-rows' : ''}`, `data-stem="${id}" style="--angle:${angle}deg;--row:${row};--layer:${index + 2}"`);
  }).join('');
  return `<div class="bouquet ${small ? 'small' : ''} ${stems.length === 1 ? 'single' : ''}" role="group" aria-label="${description}">
    ${paperImage}${layers}
    ${paperImage ? imageTag(`wrapping/paper_${paper}.png`, '', 'paper-front', 'aria-hidden="true"') : ''}
    ${wrapped && ribbon ? imageTag(`wrapping/ribbon_${ribbon}.png`, `${COLORS[ribbon].name}の リボン`, 'bouquet-ribbon') : ''}
    ${!stems.length && !small ? `<div class="bouquet-empty">${imageTag('effects/sparkle.png')}<span>おはなを<br>タップしてね</span></div>` : ''}
  </div>`;
}

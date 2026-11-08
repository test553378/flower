import { CATALOG, COLORS, PAPERS, RIBBONS, CUSTOMERS, STAGES, stemCount } from './catalog.js';
import { totalStock, available, countFlowers } from './logic/inventory.js';
import { orderText } from './logic/orders.js';
import { createState, startStage, selectFlower, undo, wrap, submit, finishCheckout, nextStage, saveCreation } from './logic/state.js';
import { imageTag as img, bouquetMarkup } from './bouquet.js';
import { GameAudio } from './audio.js';
import { makeHint } from './logic/validation.js';

const button = (action, text, className = '', attrs = '') => `<button type="button" data-action="${action}" class="${className}" ${attrs}>${text}</button>`;
const icon = name => img(`ui/${name}.png`, '', 'button-icon');
export function createApp(root, options = {}) {
  const win = root.ownerDocument.defaultView, doc = root.ownerDocument;
  const audio = options.audio || new GameAudio(win), random = options.random || Math.random;
  let state = createState(), dialog = null, tab = 'flowers', page = 0, receiptTimer = null, returnFocus = null;
  let failedAssets = new Set(), destroyed = false, lastScene = null;
  const timer = options.timer || { set: fn => win.setTimeout(fn, 1500), clear: id => win.clearTimeout(id) };
  function cancelReceipt() { if (receiptTimer !== null) timer.clear(receiptTimer); receiptTimer = null; }
  function armReceipt() {
    cancelReceipt();
    if (state.screen === 'checkout' && !dialog && !doc.hidden) receiptTimer = timer.set(() => {
      receiptTimer = null; state = finishCheckout(state, random); render();
      if (state.screen === 'clear') { audio.effect('clear'); audio.speak(state.stage === 5 ? 'ぜんぶ クリア！ すてきな おはなやさんだね！' : 'ぜんぶ うれたよ！ おめでとう！'); }
      else audio.speak(orderText(state.order));
    });
  }
  function header(title = '') {
    return `<header class="topbar"><div class="wordmark">おはなやさん<span class="wordmark-flower" aria-hidden="true">${img('flowers/rose_pink.png')}</span></div>
      ${title ? `<div class="stage-heading">${title}</div>` : '<span class="header-spacer"></span>'}
      <nav aria-label="メニュー">${state.screen !== 'title' ? button('home', `${icon('home')}<span>タイトルへ もどる</span>`, 'quiet home-button') : ''}${button('settings', `${icon('settings')}<span>おと</span>`, 'quiet', 'aria-label="おとの せってい"')}</nav></header>`;
  }
  function titleScreen() {
    return `<section class="scene title-scene">${header()}<div class="title-copy"><span class="eyebrow">きょうは わたしの おみせ</span><h1>おはなやさん<span>ちいさな はなたば、<br>おおきな にこにこ。</span></h1><p>おはなを えらんで ぎゅっと たばねて。<br>みんなに えがおを とどけよう！</p>
      ${button('start', `${icon('play')}<span>はじめる</span>`, 'primary title-start')}
      ${button('help', 'あそびかた', 'text-button')}
      <div class="title-guests">${CUSTOMERS.map(id => img(`characters/customers/${id}_smile.png`, 'おきゃくさん')).join('')}<span>みんなが まってるよ</span></div></div>
      ${img('characters/player/fullbody_welcome.png', 'はなたばを もった おはなやさんの おんなのこ', 'title-player')}
      ${img('effects/petals.png', '', 'title-petals')}<div class="title-note">タップで あそべるよ ・ おとが でるよ</div></section>`;
  }
  function orderPanel(free) {
    const emotion = state.screen === 'checkout' ? 'happy' : state.hint ? 'trouble' : 'smile';
    const customer = CUSTOMERS[state.customerIndex % CUSTOMERS.length];
    return `<section class="order-area" aria-label="${free ? 'じゆうに つくろう' : 'おきゃくさんの おねがい'}">
      <div class="order-card"><span class="eyebrow">${free ? 'じゆうに つくろう' : 'おきゃくさんの おねがい'}</span>
      ${free ? `<h2>どんな はなたばに<br>しようかな？</h2><p>ぜんぶの おはなが<br>なんぼんでも つかえるよ。</p><p>ひとつの はなたばは<br><strong>10ぽんまで</strong> だよ。</p>${button('collection', `コレクション <span class="count-badge">${state.collection.length}</span>`, 'secondary collection-link')}`
        : `<div class="order-lines" aria-label="${orderText(state.order)}">${Object.entries(state.order).map(([id, n]) => `<p><span class="order-color" style="--color:${COLORS[CATALOG[id].color].hex}"></span><span>${COLORS[CATALOG[id].color].name}の<br><strong>${CATALOG[id].name}</strong></span><b>${stemCount(n)}</b></p>`).join('')}</div><p class="order-ending">${totalStock(state.order) >= 2 ? 'はなたばに してね！' : 'ください！'}</p>${button('listen', `${icon('sound')}<span>もういちど きく</span>`, 'listen-button')}`}
      </div>${state.hint ? hintPanel() : `<div class="customer-portrait">${img(free ? `characters/player/${emotion}.png` : `characters/customers/${customer}_${emotion}.png`, free ? 'おはなやさん' : 'おきゃくさん', 'customer-image')}<span>${free ? 'すきな いろを えらんでね' : state.screen === 'checkout' ? 'ありがとう！' : 'よろしくね！'}</span></div>`}
      </section>`;
  }
  function hintPanel() {
    if (!state.hint) return '';
    // Recalculate differences while the child edits; the hint tier belongs to the order.
    return `<div class="hint-panel" role="status"><div class="hint-heading">${img(`characters/customers/${CUSTOMERS[state.customerIndex % CUSTOMERS.length]}_trouble.png`, 'いっしょに かんがえる おきゃくさん')}<strong>いっしょに<br>みてみよう</strong></div><p>${state.hint.text}</p>${state.hint.details.length ? `<div class="hint-flowers">${state.hint.details.map(({ id, count }) => `<div>${img(CATALOG[id].image, CATALOG[id].label)}<span>${stemCount(count)}</span></div>`).join('')}</div>` : ''}</div>`;
  }
  function bouquetPanel(free) {
    const counts = countFlowers(state.selected), emotion = state.screen === 'checkout' ? 'happy' : state.hint ? 'trouble' : 'smile';
    return `<section class="bouquet-area" aria-label="えらんだ おはな"><div class="bouquet-heading"><span class="eyebrow">${free ? 'わたしの はなたば' : 'ここで つくろう'}</span><span class="stem-counter">${state.selected.length}<small> / ${free ? 10 : 5}ほん</small></span></div>
      <div class="bouquet-stage">${bouquetMarkup(state.selected, state.paper, state.ribbon, { free })}${state.screen === 'checkout' ? img('effects/sparkle.png', '', 'correct-sparkle') : ''}</div>
      <div class="selected-summary" aria-label="えらんだ おはなの かず">${Object.entries(counts).map(([id, count]) => `<span>${img(CATALOG[id].image, CATALOG[id].label)}<b>×${count}</b></span>`).join('') || '<span class="selection-caption">ひとつずつ えらんでね</span>'}</div>
      <div class="shop-helper">${img(`characters/player/${emotion}.png`, 'おはなやさん')}<p>${state.notice || (tab === 'wrap' ? 'かみと リボンも<br>すきな いろで！' : 'すてきな おはなを<br>えらぼうね！')}</p></div>
      <div class="actions">${button('undo', `${icon('undo')}<span>ひとつ もどす</span>`, 'secondary', !state.selected.length || state.screen === 'checkout' ? 'disabled' : '')}${button(free ? 'save' : 'give', free ? 'できあがり！' : 'わたす', 'primary', !state.selected.length || state.screen === 'checkout' ? 'disabled' : '')}</div>
      </section>`;
  }
  function stockPanel(free) {
    const ids = free ? Object.keys(CATALOG) : Object.keys(STAGES[state.stage - 1]);
    return `<section class="stock-area" aria-label="おはなと ラッピング"><div class="work-tabs" role="tablist" aria-label="えらぶもの">
      ${button('tab-flowers', 'おはな', tab === 'flowers' ? 'active' : '', `role="tab" id="flowers-tab" aria-selected="${tab === 'flowers'}" aria-controls="work-panel"`)}
      ${button('tab-wrap', 'ラッピング', tab === 'wrap' ? 'active' : '', `role="tab" id="wrap-tab" aria-selected="${tab === 'wrap'}" aria-controls="work-panel"`)}
      </div><div id="work-panel" class="work-panel" role="tabpanel" aria-labelledby="${tab === 'flowers' ? 'flowers-tab' : 'wrap-tab'}">${tab === 'flowers'
        ? `<div class="stock-grid" style="--rows:${Math.ceil(ids.length / 2)}">${ids.map(id => {
          const flower = CATALOG[id], n = available(state.stock, state.selected, id), sold = !free && state.stock[id] === 0;
          return button(`flower:${id}`, `<span class="stock-amount ${sold ? 'sold' : ''}">${free ? '∞' : sold ? 'うりきれ' : `あと ${stemCount(n)}`}</span>${img(flower.image, '', 'stock-flower')}<span class="flower-name"><small>${COLORS[flower.color].name}の</small>${flower.name}</span><span class="price">${flower.price}えん</span>`, `flower-choice ${sold ? 'sold-out' : ''}`, `data-flower="${id}" aria-label="${flower.label} ${free ? '' : `あと ${stemCount(n)}`} ${flower.price}えん" ${!free && n <= 0 ? 'disabled' : ''}`);
        }).join('')}</div>`
        : `<div class="wrapping-panel">${!free && state.selected.length < 2 ? '<p class="wrap-note">はなたばは 2ほんから。<br>1ぽんの ときは そのまま わたせるよ。</p>' : '<p class="wrap-note">すきな いろで かざろう！<br>ラッピングは むりょうだよ。</p>'}${wrapChoices('paper', PAPERS, 'かみ')}${wrapChoices('ribbon', RIBBONS, 'リボン')}<p class="wrap-status">${state.paper && state.ribbon ? 'すてき！ わたす じゅんびが できたよ' : 'かみと リボンを ひとつずつ えらんでね'}</p></div>`}</div>
      <div class="stock-footer">${free ? 'すきな おはなを なんどでも' : `おみせの おはな　あと <b>${stemCount(totalStock(state.stock))}</b>`}</div></section>`;
  }
  function wrapChoices(kind, colors, label) {
    return `<fieldset><legend>${label} <small>むりょう</small></legend><div class="color-choices">${colors.map(color => button(`wrap:${kind}:${color}`, `${img(`wrapping/${kind}_${color}.png`)}<span>${COLORS[color].name}</span>`, `color-choice ${state[kind] === color ? 'chosen' : ''}`, `aria-label="${COLORS[color].name}の ${label}" aria-pressed="${state[kind] === color}"`)).join('')}</div></fieldset>`;
  }
  function shopScreen() {
    const free = state.screen === 'free';
    return `<section class="scene shop-scene ${free ? 'free-scene' : ''}">${header(free ? 'じゆうに つくろう' : `ステージ ${state.stage}<span class="stage-dots" aria-label="5ステージの ${state.stage}">${STAGES.map((_, i) => `<i class="${i < state.stage ? 'filled' : ''}"></i>`).join('')}</span>`)}
      <div class="shop-layout">${orderPanel(free)}${bouquetPanel(free)}${stockPanel(free)}</div>
      ${state.screen === 'checkout' ? `<div class="checkout-toast" role="status">${img('effects/heart.png')}<strong>ぴったり！ ありがとう！</strong><span>おかいけい <b>${state.receipt.total}えん</b></span></div>` : ''}
    </section>`;
  }
  function clearScreen() {
    const final = state.stage === 5;
    return `<section class="scene clear-scene ${final ? 'final-scene' : ''}">${header()}<div class="clear-content">${img('effects/sparkle.png', '', 'clear-sparkle')}<span class="eyebrow">${final ? 'すてきな おはなやさん！' : `ステージ ${state.stage}`}</span><h1>${final ? 'ぜんぶ クリア！' : 'ぜんぶ うれたよ！'}</h1><p>${final ? 'たくさんの えがおを ありがとう。<br>つぎは じゆうに はなたばを つくろう！' : 'みんな にこにこ、うれしいね。<br>つぎの おみせも たのしもう！'}</p><div class="clear-friends">${img('characters/player/happy.png', 'よろこぶ おはなやさん')}${CUSTOMERS.map(id => img(`characters/customers/${id}_happy.png`, 'よろこぶ おきゃくさん')).join('')}</div>${button('next', final ? 'じゆうに つくる' : 'つぎへ', 'primary clear-next')}</div></section>`;
  }
  function collectionScreen() {
    const max = Math.max(1, Math.ceil(state.collection.length / 6)); page = Math.max(0, Math.min(page, max - 1));
    return `<section class="scene collection-scene">${header('コレクション')}<div class="collection-top"><p>わたしの とっておき <b>${state.collection.length}</b>こ</p>${button('back-free', 'はなたばを つくる', 'secondary')}</div><div class="collection-grid">${state.collection.slice(page * 6, page * 6 + 6).map((creation, i) => `<article class="collection-card">${bouquetMarkup(creation.stems, creation.paper, creation.ribbon, { free: true, small: true })}<span>はなたば ${page * 6 + i + 1}</span></article>`).join('') || '<p class="empty-collection">はなたばを つくると<br>ここに ならぶよ！</p>'}</div><div class="pagination">${button('page-prev', 'まえへ', 'secondary', page === 0 ? 'disabled' : '')}<span>${page + 1} / ${max}</span>${button('page-next', 'つぎへ', 'secondary', page >= max - 1 ? 'disabled' : '')}</div></section>`;
  }
  function dialogMarkup() {
    if (!dialog) return '';
    const content = dialog === 'home' ? `<h2 id="dialog-title">タイトルへ もどる？</h2><p>いまの ゲームと コレクションが<br>さいしょからに なるよ。</p><div class="dialog-actions">${button('close-dialog', 'まだ あそぶ', 'secondary')}${button('confirm-home', 'もどる', 'primary')}</div>`
      : dialog === 'settings' ? `<h2 id="dialog-title">おとの せってい</h2><p>すきな おとで あそぼう</p><div class="sound-settings">${[['bgm','BGM'],['effects','こうかおん'],['voice','こえ']].map(([key, text]) => button(`audio:${key}`, `<span>${text}</span><b>${audio.settings[key] ? 'オン' : 'オフ'}</b>`, audio.settings[key] ? 'sound-on' : '', `aria-pressed="${audio.settings[key]}"`)).join('')}</div>${button('close-dialog', 'とじる', 'primary')}`
      : `<h2 id="dialog-title">あそびかた</h2><ol class="help-steps"><li><b>1</b><span>おねがいを きこう。<br>「もういちど きく」でも きけるよ。</span></li><li><b>2</b><span>おはなを ひとつずつ タップ！<br>「ひとつ もどす」で もどせるよ。</span></li><li><b>3</b><span>はなたばは かみと リボンで かざろう。</span></li><li><b>4</b><span>「わたす」で おとどけ！<br>ぜんぶ うれたら クリアだよ。</span></li></ol>${button('close-dialog', 'わかった！', 'primary')}`;
    return `<div class="dialog-scrim"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${content}</section></div>`;
  }
  function render() {
    if (destroyed) return;
    const scene = `${state.screen}:${state.stage}:${state.customerIndex}`;
    root.classList.toggle('steady', scene === lastScene); lastScene = scene;
    const focused = doc.activeElement?.dataset?.action;
    root.innerHTML = (state.screen === 'title' ? titleScreen() : state.screen === 'clear' ? clearScreen() : state.screen === 'collection' ? collectionScreen() : shopScreen()) + dialogMarkup()
      + (failedAssets.size ? '<div class="asset-warning" role="status">えが よみこめなかったよ。ページを ひらきなおしてね。</div>' : '');
    if (dialog) {
      const scene = root.querySelector('.scene'); scene.inert = true; scene.setAttribute('aria-hidden', 'true');
      const target = [...root.querySelectorAll('.dialog button')].find(b => b.dataset.action === focused) || root.querySelector('.dialog button');
      target?.focus({ preventScroll: true });
    } else if (focused) [...root.querySelectorAll('button')].find(b => b.dataset.action === focused && !b.disabled)?.focus({ preventScroll: true });
  }
  function refreshHint() {
    if (state.hint) state = { ...state, hint: makeHint(state.order, state.selected, state.mistakes) };
  }
  function openDialog(name) { returnFocus = doc.activeElement?.dataset?.action; dialog = name; cancelReceipt(); audio.cancelSpeech(); }
  function closeDialog() { dialog = null; render(); [...root.querySelectorAll('button')].find(b => b.dataset.action === returnFocus)?.focus({ preventScroll: true }); armReceipt(); }
  function handleAction(action) {
    audio.unlock();
    if (dialog && !['close-dialog','confirm-home'].includes(action) && !action.startsWith('audio:')) return;
    if (action === 'start') { state = startStage(createState(), 1, random); tab = 'flowers'; audio.setActive(true); audio.effect('tap'); render(); audio.speak(orderText(state.order)); return; }
    if (action === 'home' || action === 'settings' || action === 'help') { openDialog(action); render(); return; }
    if (action === 'close-dialog') { closeDialog(); return; }
    if (action === 'confirm-home') { cancelReceipt(); state = createState(); tab = 'flowers'; page = 0; dialog = null; audio.setActive(false); render(); return; }
    if (action.startsWith('audio:')) { audio.toggle(action.split(':')[1]); render(); return; }
    if (action === 'listen') { audio.speak(orderText(state.order)); return; }
    if (state.screen === 'checkout') return;
    if (action.startsWith('flower:')) { state = selectFlower(state, action.slice(7)); refreshHint(); audio.effect('tap'); }
    else if (action === 'undo') { state = undo(state); refreshHint(); audio.effect('undo'); }
    else if (action.startsWith('tab-')) { tab = action === 'tab-wrap' ? 'wrap' : 'flowers'; audio.effect('tap'); }
    else if (action.startsWith('wrap:')) { const [, kind, color] = action.split(':'); state = wrap(state, kind, color); audio.effect('tap'); }
    else if (action === 'give') {
      state = submit(state);
      if (state.screen === 'checkout') { audio.cancelSpeech(); audio.effect('correct'); tab = 'flowers'; armReceipt(); }
      else if (state.notice) { tab = 'wrap'; audio.speak(state.notice); }
      else { audio.effect('hint'); audio.speak(state.hint.text); }
    }
    else if (action === 'next') { state = nextStage(state, random); tab = 'flowers'; audio.effect('tap'); audio.speak(state.screen === 'free' ? 'すきな おはなで はなたばを つくろう！' : orderText(state.order)); }
    else if (action === 'save') {
      const count = state.collection.length; state = saveCreation(state);
      if (state.collection.length > count) { audio.effect('save'); audio.speak(state.notice); tab = 'flowers'; }
      else { if (!state.paper || !state.ribbon) tab = 'wrap'; audio.speak(state.notice); }
    }
    else if (action === 'collection') { state = { ...state, screen: 'collection' }; page = Math.max(0, Math.ceil(state.collection.length / 6) - 1); audio.cancelSpeech(); }
    else if (action === 'back-free') state = { ...state, screen: 'free' };
    else if (action === 'page-prev') page--;
    else if (action === 'page-next') page++;
    render();
  }
  function click(event) { const target = event.target.closest('button[data-action]'); if (target && root.contains(target) && !target.disabled) handleAction(target.dataset.action); }
  function keydown(event) {
    if (!dialog) return;
    if (event.key === 'Escape') { closeDialog(); return; }
    if (event.key === 'Tab') {
      const buttons = [...root.querySelectorAll('.dialog button:not(:disabled)')], index = buttons.indexOf(doc.activeElement);
      event.preventDefault(); buttons[(index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length]?.focus();
    }
  }
  function assetError(event) {
    if (event.target.tagName !== 'IMG') return;
    failedAssets.add(event.target.getAttribute('src')); event.target.classList.add('image-failed');
    if (!root.querySelector('.asset-warning')) root.insertAdjacentHTML('beforeend', '<div class="asset-warning" role="status">えが よみこめなかったよ。ページを ひらきなおしてね。</div>');
  }
  function hidden() { if (doc.hidden) { cancelReceipt(); audio.suspend(); } else { audio.resume(); armReceipt(); } }
  function pagehide() { cancelReceipt(); audio.suspend(); }
  function pageshow() { audio.resume(); armReceipt(); }
  root.addEventListener('click', click); root.addEventListener('error', assetError, true); root.addEventListener('keydown', keydown);
  doc.addEventListener('visibilitychange', hidden); win.addEventListener('pagehide', pagehide); win.addEventListener('pageshow', pageshow);
  return { render, getState: () => structuredClone(state), reportAssetFailure(path) { failedAssets.add(path); render(); }, destroy() {
    destroyed = true; cancelReceipt(); audio.destroy(); root.removeEventListener('click', click); root.removeEventListener('error', assetError, true); root.removeEventListener('keydown', keydown);
    doc.removeEventListener('visibilitychange', hidden); win.removeEventListener('pagehide', pagehide); win.removeEventListener('pageshow', pageshow);
  } };
}

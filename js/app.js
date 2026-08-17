/* =========================================================
   Smoke · 记账上  —— 主逻辑
   数据全部存在本机 localStorage,不上传任何服务器
   ========================================================= */

// ---------- 10 种风格（一张参考图 = 一种风格） ----------
const STYLES = [
  { id: 'style-muscle-kitty', name: '肌肉 Kitty', img: 'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20101452.png', color: '#ffd6e0' },
  { id: 'style-power-kitty', name: '力量 Kitty', img: 'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20101456.png', color: '#e3f2fd' },
  { id: 'style-classic-kitty', name: '经典 Kitty', img: 'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20101505.png', color: '#fff5d7' },
  { id: 'style-cool-kitty', name: '酷酷 Kitty', img: 'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20101519.png', color: '#a8d8ea' },
  { id: 'style-round-bear', name: '圆滚滚熊', img: 'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20102705.png', color: '#00d4ff' },
  { id: 'style-abs-bear', name: '腹肌线条熊', img: 'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20103709.png', color: '#f7e8d5' },
  { id: 'style-chill-bear', name: '发呆白熊', img: 'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20103716.png', color: '#ffffff' },
  { id: 'style-mask-dog', name: '口罩小狗', img: 'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20103749.png', color: '#d4a373' },
  { id: 'style-gym-beagle', name: '健身房小比格', img: 'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20103756.png', color: '#ffbe76' },
  { id: 'style-melon-bear', name: '西瓜杠铃熊', img: 'assets/%E5%B1%8F%E5%B9%95%E6%88%AA%E5%9B%BE%202026-08-17%20103805.png', color: '#c1e1c1' }
];

// ---------- 存储 ----------
const STORE_KEY = 'smoke_jieyan_v5';
let data = load();

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE_KEY));
    if (d && typeof d === 'object') return Object.assign({ counts: {}, style: STYLES[0].id, themeColor: null, favs: [], liked: {}, dailyLimit: 20 }, d);
  } catch (e) {}
  return { counts: {}, style: STYLES[0].id, themeColor: null, favs: [], liked: {}, dailyLimit: 20 };
}
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }

// 本会话内:是否已对当前超限状态关闭过报警
let alarmDismissed = false;

// ---------- 日期工具 ----------
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function dateStr(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function todayStr() { return dateStr(new Date()); }
const WK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function rangeOf(cycle) {
  const out = [];
  const now = new Date();
  if (cycle === 'day') {
    out.push(todayStr());
  } else if (cycle === 'week') {
    const day = (now.getDay() + 6) % 7;
    const mon = new Date(now); mon.setDate(now.getDate() - day);
    for (let i = 0; i < 7; i++) { const d = new Date(mon); d.setDate(mon.getDate() + i); out.push(dateStr(d)); }
  } else if (cycle === 'month') {
    const y = now.getFullYear(), m = now.getMonth();
    const dim = new Date(y, m + 1, 0).getDate();
    for (let i = 1; i <= dim; i++) { const d = new Date(y, m, i); out.push(dateStr(d)); }
  }
  return out;
}

// ---------- 颜色工具 ----------
function hexToRgb(hex) {
  const m = hex.replace('#', '').match(/^(..)(..)(..)$/);
  if (!m) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
}
function shade(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const f = (100 + percent) / 100;
  return rgbToHex(r * f, g * f, b * f);
}
function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}
function isDark(hex) { return luminance(hex) < 0.42; }

const STYLE_DEFAULTS = {};
STYLES.forEach(s => { STYLE_DEFAULTS[s.id] = s.color; });

function applyStyle(s) {
  data.style = s; save();
  document.body.className = s;
  const styleObj = STYLES.find(x => x.id === s) || STYLES[0];
  const mascot = document.getElementById('mascot');
  if (mascot) { mascot.src = styleObj.img; mascot.alt = styleObj.name; }
  if (!data.themeColor) applyColor(STYLE_DEFAULTS[s], false);
  else applyColor(data.themeColor, false);
  renderStyleGrid();
}
function applyColor(hex, persist) {
  if (persist) { data.themeColor = hex; save(); }
  const c2 = shade(hex, -30);
  document.body.style.background = 'linear-gradient(160deg, ' + hex + ', ' + c2 + ')';
  document.body.classList.toggle('dark-bg', isDark(hex));

  const picker = document.getElementById('colorPicker');
  if (picker) picker.value = hex;

  document.querySelectorAll('.color-swatch').forEach(s => {
    const c = s.style.getPropertyValue('--c').trim();
    s.classList.toggle('on', c.toLowerCase() === hex.toLowerCase());
  });
}

// ---------- 音效 & 震动 ----------
let audioCtx = null;
function ensureAudio() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) {}
  return audioCtx;
}
function tick() {
  try {
    const ctx = ensureAudio(); if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(620, t);
    o.frequency.exponentialRampToValueAtTime(960, t + 0.06);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.22);
  } catch (e) {}
}
// 报警音:三声急促双频警报
function playAlarm() {
  try {
    const ctx = ensureAudio(); if (!ctx) return;
    const t0 = ctx.currentTime;
    [0, 0.2, 0.4].forEach(off => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(880, t0 + off);
      o.frequency.setValueAtTime(660, t0 + off + 0.09);
      g.gain.setValueAtTime(0.0001, t0 + off);
      g.gain.exponentialRampToValueAtTime(0.26, t0 + off + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + off + 0.17);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0 + off); o.stop(t0 + off + 0.18);
    });
  } catch (e) {}
}

// ---------- 上限检查 + 报警 ----------
function checkLimit(n) {
  const limit = data.dailyLimit;
  const banner = document.getElementById('limitBanner');
  const overlay = document.getElementById('alarmOverlay');
  const sub = document.getElementById('alarmSub');

  if (limit > 0 && n >= limit) {
    // 已达极限
    if (!alarmDismissed) {
      overlay.hidden = false;
      sub.textContent = '你今天已抽 ' + n + ' 根,超过设定的 ' + limit + ' 根上限';
      playAlarm();
      if (navigator.vibrate) navigator.vibrate([60, 40, 60, 40, 60]);
    }
    banner.hidden = false;
    banner.className = 'limit-banner danger';
    banner.textContent = '🚫 今日焦油量已达极限！';
  } else if (limit > 0 && n >= limit - 2) {
    alarmDismissed = false;
    banner.hidden = false;
    banner.className = 'limit-banner warn';
    banner.textContent = '⚠ 注意!还差 ' + (limit - n) + ' 根到今日极限';
  } else {
    alarmDismissed = false;
    banner.hidden = true;
  }
}

// ---------- 主页渲染 ----------
const heroCount = document.getElementById('todayCount');
function renderHome(animate) {
  const t = todayStr();
  const n = data.counts[t] || 0;
  heroCount.textContent = n;
  document.getElementById('heroLimit').textContent = '上限 ' + data.dailyLimit + ' 根';

  if (animate) {
    heroCount.classList.remove('pop'); void heroCount.offsetWidth; heroCount.classList.add('pop');
  }

  const wk = rangeOf('week'), mo = rangeOf('month');
  const sum = arr => arr.reduce((a, d) => a + (data.counts[d] || 0), 0);
  document.getElementById('weekNum').textContent = sum(wk);
  document.getElementById('monthNum').textContent = sum(mo);

  checkLimit(n);
}

// ---------- 点击计数 ----------
document.getElementById('tapBtn').addEventListener('click', () => {
  ensureAudio();
  const t = todayStr();
  data.counts[t] = (data.counts[t] || 0) + 1;
  save();
  const n = data.counts[t];
  tick();
  if (navigator.vibrate) navigator.vibrate(28);
  renderHome(true);
  renderStats(currentCycle);
});

// ---------- 统计页 ----------
let currentCycle = 'day';
function renderStats(cycle) {
  const range = rangeOf(cycle);
  const vals = range.map(d => data.counts[d] || 0);
  const total = vals.reduce((a, b) => a + b, 0);
  const peak = Math.max(0, ...vals);
  const avg = range.length ? Math.round(total / range.length * 10) / 10 : 0;

  document.getElementById('statBig').textContent = total;
  const lab = { day: '今日总支数', week: '本周总支数', month: '本月总支数' }[cycle];
  document.getElementById('statBigLab').textContent = lab;
  document.getElementById('statAvg').textContent = avg;
  document.getElementById('statPeak').textContent = peak;
  document.getElementById('statLimit').textContent = data.dailyLimit;

  renderCalendar();
}

function renderCalendar() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  document.getElementById('calTitle').textContent = y + '年' + (m + 1) + '月';
  const first = new Date(y, m, 1);
  const lead = (first.getDay() + 6) % 7;
  const dim = new Date(y, m + 1, 0).getDate();
  const tStr = todayStr();
  const limit = data.dailyLimit;
  let html = '';
  for (let i = 0; i < lead; i++) html += '<div class="cal-cell empty"></div>';
  for (let d = 1; d <= dim; d++) {
    const ds = dateStr(new Date(y, m, d));
    const c = data.counts[ds] || 0;
    const over = limit > 0 && c >= limit;
    const cls = 'cal-cell' + (ds === tStr ? ' today' : '') + (over ? ' over' : '');
    html += '<div class="' + cls + '">' + d + (c > 0 ? '<span class="cnt">' + c + '</span>' : '') + '</div>';
  }
  document.getElementById('calGrid').innerHTML = html;
}

document.getElementById('statsSeg').addEventListener('click', e => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentCycle = btn.dataset.cycle;
  renderStats(currentCycle);
});

// ---------- 励志语录(主页卡,自动切换) ----------
let curQuote = -1;
function pickQuote() {
  if (QUOTES.length === 1) return 0;
  let i;
  do { i = Math.floor(Math.random() * QUOTES.length); } while (i === curQuote);
  return i;
}
function showQuote() {
  curQuote = pickQuote();
  const el = document.getElementById('quoteText');
  el.textContent = QUOTES[curQuote];
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  syncQuoteBtns();
}
function syncQuoteBtns() {
  const q = QUOTES[curQuote];
  document.getElementById('likeBtn').classList.toggle('on', !!data.liked[curQuote]);
  const faved = data.favs.indexOf(q) >= 0;
  document.getElementById('favBtn').classList.toggle('on', faved);
}
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('show'), 1400);
}
document.getElementById('likeBtn').addEventListener('click', () => {
  if (data.liked[curQuote]) delete data.liked[curQuote]; else data.liked[curQuote] = true;
  save(); syncQuoteBtns();
  toast(data.liked[curQuote] ? '已点赞 ♥' : '已取消赞');
});
document.getElementById('copyBtn').addEventListener('click', () => {
  const q = QUOTES[curQuote];
  if (navigator.clipboard) navigator.clipboard.writeText(q).then(() => toast('已复制')).catch(() => toast('复制失败'));
  else toast('当前环境不支持复制');
});
document.getElementById('favBtn').addEventListener('click', () => {
  const q = QUOTES[curQuote];
  const i = data.favs.indexOf(q);
  if (i >= 0) data.favs.splice(i, 1); else data.favs.push(q);
  save(); syncQuoteBtns(); renderFavs();
  toast(i >= 0 ? '已取消收藏' : '已收藏 ★');
});

// ---------- 收藏列表(烟民的家) ----------
function renderFavs() {
  const box = document.getElementById('favItems');
  document.getElementById('favCount').textContent = data.favs.length;
  if (!data.favs.length) { box.innerHTML = '<div class="fav-empty">还没有收藏,回主页点 ☆ 存一句吧</div>'; return; }
  box.innerHTML = data.favs.map((q, i) =>
    '<div class="fav-item"><span class="txt">' + q + '</span><button class="del" data-i="' + i + '">✕</button></div>'
  ).join('');
  box.querySelectorAll('.del').forEach(b => b.addEventListener('click', () => {
    data.favs.splice(+b.dataset.i, 1); save(); renderFavs(); syncQuoteBtns();
  }));
}

// ---------- 风格选择器渲染（10 张图为 10 种风格） ----------
function renderStyleGrid() {
  const grid = document.getElementById('styleGrid');
  if (!grid) return;
  grid.innerHTML = STYLES.map(s =>
    '<button class="style-tile' + (s.id === data.style ? ' on' : '') + '" data-style="' + s.id + '">' +
      '<img class="st-thumb" src="' + s.img + '" alt="' + s.name + '" loading="lazy">' +
      '<span class="st-name">' + s.name + '</span>' +
    '</button>'
  ).join('');
}

document.getElementById('styleGrid').addEventListener('click', e => {
  const tile = e.target.closest('.style-tile');
  if (!tile) return;
  data.themeColor = null; // 切风格时恢复该风格的默认色
  applyStyle(tile.dataset.style);
});

document.getElementById('palette').addEventListener('click', e => {
  const sw = e.target.closest('.color-swatch');
  if (!sw) return;
  applyColor(sw.style.getPropertyValue('--c').trim(), true);
});

document.getElementById('colorPicker').addEventListener('input', e => {
  applyColor(e.target.value, true);
});

// ---------- 每日上限设置 ----------
function renderLimitUI() {
  const inp = document.getElementById('limitInput');
  if (inp) inp.value = data.dailyLimit;
}
document.getElementById('limitSave').addEventListener('click', () => {
  let v = parseInt(document.getElementById('limitInput').value, 10);
  if (isNaN(v) || v < 1) v = 1;
  if (v > 99) v = 99;
  data.dailyLimit = v; save();
  alarmDismissed = false;
  renderHome(false);
  renderStats(currentCycle);
  toast('每日上限已设为 ' + v + ' 根');
});

// ---------- 红色报警关闭 ----------
document.getElementById('alarmClose').addEventListener('click', () => {
  document.getElementById('alarmOverlay').hidden = true;
  alarmDismissed = true;
});

// ---------- 我的:导出 / 重置 ----------
document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '抽烟数据备份_' + todayStr() + '.json';
  a.click();
  toast('已导出备份');
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('确定清空【今日】计数吗?')) return;
  data.counts[todayStr()] = 0; save();
  alarmDismissed = false;
  renderHome(false); renderStats(currentCycle);
});

// ---------- 底部导航 ----------
const PAGE_TITLES = { home: 'Smoke', stats: '烟民记账本', me: '烟民的家' };
document.querySelector('.tabbar').addEventListener('click', e => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  const view = tab.dataset.view;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  document.getElementById('pageTitle').textContent = PAGE_TITLES[view];
  if (view === 'home') { renderHome(false); showQuote(); }
  if (view === 'stats') renderStats(currentCycle);
  if (view === 'me') { renderFavs(); renderLimitUI(); }
});

// ---------- 启动 ----------
(function init() {
  const now = new Date();
  document.getElementById('todayDate').textContent = (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + WK[now.getDay()];
  renderStyleGrid();
  applyStyle(data.style);
  renderHome(false);
  showQuote();
  renderStats('day');
  renderFavs();
  renderLimitUI();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();

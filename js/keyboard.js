/* ============================================================
   keyboard.js —— 虚拟键盘、手指分工、双手提示
   ============================================================ */

/* ---------------- 手指定义 ---------------- */
const FINGER_INFO = {
  L5: { name: '左手小指', short: '左小指', color: '#ef5f6b' },
  L4: { name: '左手无名指', short: '左无名指', color: '#f59f3c' },
  L3: { name: '左手中指', short: '左中指', color: '#e3c229' },
  L2: { name: '左手食指', short: '左食指', color: '#4cb96b' },
  R2: { name: '右手食指', short: '右食指', color: '#14b8a6' },
  R3: { name: '右手中指', short: '右中指', color: '#3b82f6' },
  R4: { name: '右手无名指', short: '右无名指', color: '#8b5cf6' },
  R5: { name: '右手小指', short: '右小指', color: '#ec4899' },
  TH: { name: '大拇指', short: '拇指', color: '#94a3b8' },
};
const FINGER_ORDER = ['L5', 'L4', 'L3', 'L2', 'R2', 'R3', 'R4', 'R5', 'TH'];

/* ---------------- 键盘布局（美式 QWERTY） ---------------- */
const KB_ROWS = [
  [
    { m: '`', s: '~', f: 'L5' }, { m: '1', s: '!', f: 'L5' }, { m: '2', s: '@', f: 'L4' },
    { m: '3', s: '#', f: 'L3' }, { m: '4', s: '$', f: 'L2' }, { m: '5', s: '%', f: 'L2' },
    { m: '6', s: '^', f: 'R2' }, { m: '7', s: '&', f: 'R2' }, { m: '8', s: '*', f: 'R3' },
    { m: '9', s: '(', f: 'R4' }, { m: '0', s: ')', f: 'R5' }, { m: '-', s: '_', f: 'R5' },
    { m: '=', s: '+', f: 'R5' },
    { m: '退格', f: 'R5', w: 2, special: true, id: 'Backspace' },
  ],
  [
    { m: 'Tab', f: 'L5', w: 1.6, special: true, id: 'Tab' },
    { m: 'q', f: 'L5' }, { m: 'w', f: 'L4' }, { m: 'e', f: 'L3' }, { m: 'r', f: 'L2' },
    { m: 't', f: 'L2' }, { m: 'y', f: 'R2' }, { m: 'u', f: 'R2' }, { m: 'i', f: 'R3' },
    { m: 'o', f: 'R4' }, { m: 'p', f: 'R5' }, { m: '[', s: '{', f: 'R5' }, { m: ']', s: '}', f: 'R5' },
    { m: '\\', s: '|', f: 'R5', w: 1.4 },
  ],
  [
    { m: 'Caps', f: 'L5', w: 1.85, special: true, id: 'CapsLock' },
    { m: 'a', f: 'L5' }, { m: 's', f: 'L4' }, { m: 'd', f: 'L3' }, { m: 'f', f: 'L2', home: true },
    { m: 'g', f: 'L2' }, { m: 'h', f: 'R2' }, { m: 'j', f: 'R2', home: true }, { m: 'k', f: 'R3' },
    { m: 'l', f: 'R4' }, { m: ';', s: ':', f: 'R5' }, { m: "'", s: '"', f: 'R5' },
    { m: '回车', f: 'R5', w: 2.15, special: true, id: 'Enter' },
  ],
  [
    { m: 'Shift', f: 'L5', w: 2.35, special: true, id: 'ShiftLeft' },
    { m: 'z', f: 'L5' }, { m: 'x', f: 'L4' }, { m: 'c', f: 'L3' }, { m: 'v', f: 'L2' },
    { m: 'b', f: 'L2' }, { m: 'n', f: 'R2' }, { m: 'm', f: 'R2' },
    { m: ',', s: '<', f: 'R3' }, { m: '.', s: '>', f: 'R4' }, { m: '/', s: '?', f: 'R5' },
    { m: 'Shift', f: 'R5', w: 2.65, special: true, id: 'ShiftRight' },
  ],
  [
    { m: 'Ctrl', f: 'L5', w: 1.3, special: true, id: 'ControlLeft' },
    { m: 'Win', f: 'L5', w: 1.2, special: true, id: 'MetaLeft' },
    { m: 'Alt', f: 'L5', w: 1.2, special: true, id: 'AltLeft' },
    { m: '空格', f: 'TH', w: 6.4, special: true, id: 'Space' },
    { m: 'Alt', f: 'R5', w: 1.2, special: true, id: 'AltRight' },
    { m: 'Win', f: 'R5', w: 1.2, special: true, id: 'MetaRight' },
    { m: 'Ctrl', f: 'R5', w: 1.3, special: true, id: 'ControlRight' },
  ],
];

/* ---------------- 字符 → 按键 映射 ---------------- */
const CHAR_MAP = {};

(function buildCharMap() {
  KB_ROWS.forEach((row) => {
    row.forEach((k) => {
      const id = k.id || k.m;
      if (k.m.length === 1) CHAR_MAP[k.m] = { id, shift: false, finger: k.f };
      if (k.s && k.s.length === 1) CHAR_MAP[k.s] = { id, shift: true, finger: k.f };
    });
  });
  // 大写字母 = 小写键 + Shift
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach((c) => {
    CHAR_MAP[c.toUpperCase()] = { id: c, shift: true, finger: CHAR_MAP[c].finger };
  });
  // 特殊键
  CHAR_MAP['\n'] = { id: 'Enter', shift: false, finger: 'R5' };
  CHAR_MAP['\t'] = { id: 'Tab', shift: false, finger: 'L5' };
  CHAR_MAP[' '] = { id: 'Space', shift: false, finger: 'TH' };
})();

/**
 * 查出「要打出这个字符，该按哪个键、用哪根手指」
 * @returns {{id:string, shift:boolean, shiftId:string|null, finger:string, label:string, display:string}|null}
 */
function keyInfoForChar(ch) {
  const info = CHAR_MAP[ch];
  if (!info) return null;

  let shiftId = null;
  if (info.shift) {
    // 用另一只手按 Shift：左手按字母 → 右手 Shift，反之亦然
    const leftHand = info.finger[0] === 'L' || info.finger === 'TH';
    shiftId = leftHand ? 'ShiftRight' : 'ShiftLeft';
  }

  let label = ch;
  let display = ch;
  if (ch === '\n') { label = 'Enter'; display = '回车'; }
  else if (ch === '\t') { label = 'Tab'; display = 'Tab'; }
  else if (ch === ' ') { label = 'Space'; display = '空格'; }

  return { id: info.id, shift: info.shift, shiftId, finger: info.finger, label, display };
}

/* ---------------- 虚拟键盘 ---------------- */
const Keyboard = {
  root: null,
  keys: {},

  render(container) {
    this.root = container;
    container.innerHTML = '';
    this.keys = {};

    KB_ROWS.forEach((row) => {
      const rowEl = document.createElement('div');
      rowEl.className = 'kb-row';

      row.forEach((k) => {
        const id = k.id || k.m;
        const el = document.createElement('div');
        el.className = 'key' + (k.special ? ' special' : '') + (k.home ? ' home' : '');
        el.style.flexGrow = String(k.w || 1);
        el.dataset.key = id;
        el.dataset.finger = k.f;

        let html = '';
        if (k.s) html += `<span class="k-shift">${escapeHtml(k.s)}</span>`;
        html += `<span class="k-main">${escapeHtml(k.m)}</span>`;
        html += `<span class="k-finger" data-f="${k.f}"></span>`;
        el.innerHTML = html;

        rowEl.appendChild(el);
        this.keys[id] = el;
      });

      container.appendChild(rowEl);
    });
  },

  /** 清掉所有高亮 */
  clearHighlight() {
    Object.values(this.keys).forEach((el) => {
      el.classList.remove('hl', 'needshift', 'shifthl');
    });
  },

  /** 高亮「下一个该按的键」 */
  highlightChar(ch) {
    this.clearHighlight();
    const info = keyInfoForChar(ch);
    if (!info) return null;

    if (info.shiftId && this.keys[info.shiftId]) {
      this.keys[info.shiftId].classList.add('hl', 'needshift');
    }
    const el = this.keys[info.id];
    if (el) el.classList.add('hl');

    return info;
  },

  /** 按键的一瞬间做一个下压动画 */
  flash(id) {
    const el = this.keys[id];
    if (!el) return;
    el.classList.add('press');
    setTimeout(() => el.classList.remove('press'), 170);
  },

  /** 错误时把期望的键标红一下 */
  flashError(ch) {
    const info = keyInfoForChar(ch);
    if (!info || !this.keys[info.id]) return;
    const el = this.keys[info.id];
    el.classList.add('err');
    setTimeout(() => el.classList.remove('err'), 260);
  },

  /** 根据错键统计，把最常错的键标出来 */
  showWeakKeys(keyErrors, topN = 8) {
    Object.values(this.keys).forEach((el) => {
      el.classList.remove('weak');
      el.removeAttribute('data-weak');
    });
    if (!keyErrors) return;

    const sorted = Object.entries(keyErrors)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN);

    sorted.forEach(([ch, n]) => {
      const info = keyInfoForChar(ch);
      if (!info) return;
      const el = this.keys[info.id];
      if (el) { el.classList.add('weak'); el.dataset.weak = n; }
    });
  },

  /** 渲染配色图例 */
  renderLegend(container) {
    container.innerHTML = FINGER_ORDER.map((f) =>
      `<span><i style="background:${FINGER_INFO[f].color}"></i>${FINGER_INFO[f].short}</span>`
    ).join('');
  },
};

/* ---------------- 双手提示 ---------------- */
const Hands = {
  root: null,
  els: {},

  init(root) {
    this.root = root;
    this.els = {};
    root.querySelectorAll('.finger').forEach((el) => {
      this.els[el.dataset.finger] = el;
    });
  },

  /** 高亮该用哪根手指 */
  highlight(finger) {
    Object.values(this.els).forEach((el) => el.classList.remove('active'));
    if (finger && this.els[finger]) this.els[finger].classList.add('active');
  },

  /** 手指按下的小动画 */
  press(finger) {
    const el = this.els[finger];
    if (!el) return;
    el.classList.add('press');
    setTimeout(() => el.classList.remove('press'), 190);
  },

  clear() {
    Object.values(this.els).forEach((el) => el.classList.remove('active', 'press'));
  },
};

/* ---------------- 小工具 ---------------- */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

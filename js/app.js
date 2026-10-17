/* ============================================================
   app.js —— 界面、交互、成绩存储
   ============================================================ */

/* ============================================================
   成绩存储（localStorage，不上传任何数据）
   ============================================================ */
const Store = {
  KEY: 'typing-tutor.v1',
  available: true,
  data: { records: [], keyErrors: {}, levels: {}, settings: null },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const d = JSON.parse(raw);
        this.data = {
          records: Array.isArray(d.records) ? d.records : [],
          keyErrors: d.keyErrors && typeof d.keyErrors === 'object' ? d.keyErrors : {},
          levels: d.levels && typeof d.levels === 'object' ? d.levels : {},
          settings: d.settings || null,
        };
      }
    } catch (e) {
      this.available = false;
      console.warn('读取本地记录失败，本次练习不会被保存：', e);
    }
  },

  save() {
    if (!this.available) return;
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (e) {
      this.available = false;
      console.warn('保存失败：', e);
    }
  },

  addRecord(r) {
    this.data.records.push(r);
    if (this.data.records.length > 400) this.data.records = this.data.records.slice(-400);
    this.save();
  },

  addKeyErrors(map) {
    Object.keys(map || {}).forEach((k) => {
      this.data.keyErrors[k] = (this.data.keyErrors[k] || 0) + map[k];
    });
    this.save();
  },

  updateLevel(id, stats, stars) {
    const cur = this.data.levels[id] || { stars: 0, bestKpm: 0, bestAcc: 0, times: 0 };
    cur.times += 1;
    cur.stars = Math.max(cur.stars, stars);
    cur.bestKpm = Math.max(cur.bestKpm, Math.round(stats.kpm));
    cur.bestAcc = Math.max(cur.bestAcc, stats.accuracy);
    this.data.levels[id] = cur;
    this.save();
  },

  saveSettings(s) {
    this.data.settings = s;
    this.save();
  },

  clear() {
    this.data = { records: [], keyErrors: {}, levels: {}, settings: this.data.settings };
    this.save();
  },
};

/* ============================================================
   全局状态
   ============================================================ */
const App = {
  screen: 'home',
  session: null,
  renderer: null,
  timer: null,
  current: null,       // 当前练习配置
  list: null,          // 当前关卡列表（用于「下一组」）
  index: -1,
  opts: { strict: true, tabIndent: true, spaces: true, sound: false },
  els: {},
};

const $ = (id) => document.getElementById(id);

/* ============================================================
   工具函数
   ============================================================ */
function fmtTime(sec) {
  sec = Math.max(0, Math.floor(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function fmtDate(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function starsHtml(n) {
  let s = '';
  for (let i = 1; i <= 3; i++) s += `<span class="${i <= n ? 'on' : ''}">★</span>`;
  return s;
}

/** 星级：以「准确率」为核心，鼓励先打对再打快 */
function calcStars(stats) {
  const acc = stats.accuracy;
  if (stats.mode === 'test') {
    if (stats.totalKeys < 20) return 0;
    if (acc >= 98) return 3;
    if (acc >= 94) return 2;
    return 1;
  }
  if (stats.progress < 0.999) return 0;
  if (acc >= 98) return 3;
  if (acc >= 94) return 2;
  return 1;
}

/* ---- 从 keydown 事件里取出真正要打的字符（兼容输入法状态） ---- */
const CODE_CHARS = {
  Backquote: ['`', '~'], Minus: ['-', '_'], Equal: ['=', '+'],
  BracketLeft: ['[', '{'], BracketRight: [']', '}'], Backslash: ['\\', '|'],
  Semicolon: [';', ':'], Quote: ["'", '"'], Comma: [',', '<'],
  Period: ['.', '>'], Slash: ['/', '?'],
  Digit1: ['1', '!'], Digit2: ['2', '@'], Digit3: ['3', '#'], Digit4: ['4', '$'], Digit5: ['5', '%'],
  Digit6: ['6', '^'], Digit7: ['7', '&'], Digit8: ['8', '*'], Digit9: ['9', '('], Digit0: ['0', ')'],
};

function charFromEvent(e) {
  if (e.key === 'Enter') return '\n';
  if (e.key === 'Tab') return '\t';
  if (e.key === 'Backspace') return 'BACKSPACE';
  if (e.key === ' ') return ' ';

  // 输入法在组字时 e.key 不可靠，用物理键位兜底（中文用户很常见）
  if (e.isComposing || e.keyCode === 229 || e.key === 'Process') {
    if (/^Key[A-Z]$/.test(e.code)) {
      const c = e.code.slice(3);
      return e.shiftKey ? c : c.toLowerCase();
    }
    if (CODE_CHARS[e.code]) return CODE_CHARS[e.code][e.shiftKey ? 1 : 0];
    return null;
  }

  if (typeof e.key === 'string' && e.key.length === 1) return e.key;
  return null;
}

/* ---- 按键音（WebAudio 现场合成，不需要音频文件） ---- */
let audioCtx = null;
function playSound(ok) {
  if (!App.opts.sound) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = ok ? 'sine' : 'square';
    osc.frequency.value = ok ? 880 : 190;
    gain.gain.setValueAtTime(ok ? 0.045 : 0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + (ok ? 0.05 : 0.13));
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + (ok ? 0.06 : 0.15));
  } catch (e) { /* 静默失败即可 */ }
}

/* ============================================================
   界面切换
   ============================================================ */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach((s) => {
    s.classList.toggle('active', s.id === 'screen-' + name);
  });
  // 「练习」和「拳击」都是子界面，顶部导航高亮它们各自的入口模块
  const navTarget = name === 'practice' ? (App.current && App.current.origin)
    : name === 'boxing' ? 'finger'
      : name;
  document.querySelectorAll('.nav-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.screen === navTarget);
  });
  App.screen = name;
}

/**
 * 虚拟键盘是单例，但练习界面和拳击界面各有一份容器。
 * 切界面时把它重新挂到对应的容器上（重绘 60 个键只要 ~1ms）。
 * 另一份容器会被清空 —— 否则会留下过期的高亮，看着像还有效。
 */
function mountKeyboard(containerId) {
  document.querySelectorAll('.keyboard').forEach((el) => {
    if (el.id !== containerId) el.innerHTML = '';
  });
  Keyboard.render($(containerId));
}

function stopTimer() {
  if (App.timer) { clearInterval(App.timer); App.timer = null; }
}

/* ============================================================
   关卡卡片渲染
   ============================================================ */

/**
 * 取一个关卡的练习内容。
 * 大多数关卡用 build() 直接返回文本；
 * 拼音关用 unit() 额外带回「汉字 ↔ 拼音」对照表，界面上的候选词框要用它。
 */
function levelUnit(level) {
  if (level.unit) return level.unit();
  return { target: level.build() };
}

/** 关卡卡片上的小预览：拼音关显示汉字，其余显示第一行文本 */
function previewOf(unit) {
  if (unit.items) return unit.items.map((i) => i.w).join(' ');
  return unit.target.split('\n')[0];
}

function makeCard(level, origin) {
  const btn = document.createElement('button');
  btn.className = 'level-card';
  btn.dataset.level = level.id;

  const saved = Store.data.levels[level.id];
  const stars = saved ? saved.stars : 0;

  let preview = '';
  try {
    preview = previewOf(levelUnit(level)).slice(0, 44);
  } catch (e) { preview = ''; }

  btn.innerHTML =
    `<div class="lc-top"><h4>${escapeHtml(level.title)}</h4><span class="stars">${starsHtml(stars)}</span></div>` +
    `<p class="lc-desc">${escapeHtml(level.desc || '')}</p>` +
    `<div class="lc-preview">${escapeHtml(preview)}</div>`;

  if (saved && saved.bestKpm) {
    btn.title = `最快 ${saved.bestKpm} 字/分 · 最高正确率 ${saved.bestAcc.toFixed(1)}% · 练过 ${saved.times} 次`;
  }

  btn.addEventListener('click', () => {
    App.list = level.__list || null;
    App.index = level.__index != null ? level.__index : -1;
    const u = levelUnit(level);
    startPractice({
      title: level.title,
      subtitle: level.desc || '',
      mode: origin,
      origin,
      target: u.target,
      items: u.items,
      levelId: level.id,
    });
  });
  return btn;
}

function renderFingerLevels() {
  const box = $('fingerLevels');
  box.innerHTML = '';
  const list = FINGER_LESSONS.map((l) => ({
    ...l,
    build: () => genKeyDrill(l.keys, l.opts || {}),
  }));
  list.forEach((l, i) => { l.__list = list; l.__index = i; });

  let lastGroup = null;
  list.forEach((l) => {
    if (l.group !== lastGroup) {
      lastGroup = l.group;
      const t = document.createElement('div');
      t.className = 'group-title';
      t.textContent = l.group;
      box.appendChild(t);
    }
    box.appendChild(makeCard(l, 'finger'));
  });
}

/* ---- 通用：把所有关卡拍平，方便「下一组」 ---- */
function flattenLevels(tab) {
  const out = [];
  if (tab.levels) tab.levels.forEach((l) => out.push(l));
  if (tab.groups) tab.groups.forEach((g) => g.levels.forEach((l) => out.push(l)));
  out.forEach((l, i) => { l.__list = out; l.__index = i; });
  return out;
}

function renderTabbedTrack(track, tabsBox, levelsBox, origin) {
  tabsBox.innerHTML = '';
  track.tabs.forEach((tab, i) => {
    const b = document.createElement('button');
    b.className = 'tab-btn' + (i === 0 ? ' active' : '');
    b.textContent = tab.name;
    b.addEventListener('click', () => {
      tabsBox.querySelectorAll('.tab-btn').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      renderTabBody(tab, levelsBox, origin);
    });
    tabsBox.appendChild(b);
  });
  renderTabBody(track.tabs[0], levelsBox, origin);
}

function renderTabBody(tab, levelsBox, origin) {
  levelsBox.innerHTML = '';
  const all = flattenLevels(tab);

  if (tab.groups) {
    tab.groups.forEach((g) => {
      const t = document.createElement('div');
      t.className = 'group-title';
      t.textContent = g.title;
      levelsBox.appendChild(t);
      g.levels.forEach((l) => levelsBox.appendChild(makeCard(l, origin)));
    });
  } else {
    all.forEach((l) => levelsBox.appendChild(makeCard(l, origin)));
  }
}

function renderAllGrids() {
  renderFingerLevels();
  renderTabbedTrack(ENGLISH_TRACK, $('englishTabs'), $('englishLevels'), 'english');
  renderTabbedTrack(PINYIN_TRACK, $('pinyinTabs'), $('pinyinLevels'), 'pinyin');
  renderTabbedTrack(CODE_TRACK, $('codeTabs'), $('codeLevels'), 'code');
}

/* ============================================================
   拼音中文打字：汉字 + 拼音进度 + 候选词框
   ============================================================ */

/**
 * 算出当前光标在第几个词、这个拼音打了几个字母。
 * 目标文本形如 "nihao xiexie "，每个词后面跟一个空格表示「确认」。
 */
function pinyinState(items, pos) {
  let start = 0;
  for (let i = 0; i < items.length; i++) {
    const end = start + items[i].p.length;
    if (pos <= end) return { idx: i, item: items[i], typed: Math.max(0, pos - start) };
    start = end + 1;
  }
  const last = items[items.length - 1];
  return last ? { idx: items.length - 1, item: last, typed: last.p.length } : null;
}

/** 候选项：目标词永远排第一，另外配两个「读音相近」的干扰项，像真输入法一样 */
function pickDecoys(items, target, typed) {
  const others = items.filter((i) => i.w !== target.w);
  let pool = others.filter((i) => typed && i.p.startsWith(typed));
  if (pool.length < 2) pool = others.filter((i) => typed && i.p[0] === typed[0]);
  if (pool.length < 2) pool = others;
  return R.pickN(pool, 2);
}

function updatePinyinPanel() {
  const panel = $('pinyinPanel');
  const items = App.current && App.current.items;
  const s = App.session;

  if (!items || !s) { panel.classList.add('hidden'); return; }
  const st = pinyinState(items, s.pos);
  if (!st) { panel.classList.add('hidden'); return; }
  panel.classList.remove('hidden');

  $('pyWord').textContent = st.item.w;

  // 拼音逐字母进度：打过的变绿，没打的保持灰色
  const p = st.item.p;
  let ph = '';
  for (let i = 0; i < p.length; i++) {
    ph += `<span class="${i < st.typed ? 't' : 'r'}">${escapeHtml(p[i])}</span>`;
  }
  $('pyPinyin').innerHTML = ph;

  const decoys = pickDecoys(items, st.item, p.slice(0, st.typed));
  $('pyCands').innerHTML = [st.item].concat(decoys)
    .map((it, i) => `<span class="py-cand${i === 0 ? ' first' : ''}">${escapeHtml(it.w)}</span>`)
    .join('');
}

/* ============================================================
   练习：开始 / 重置 / 渲染
   ============================================================ */
function startPractice(cfg) {
  App.current = cfg;
  showScreen('practice');
  buildSession(cfg);
}

function buildSession(cfg) {
  stopTimer();
  App.session = null;

  // 拳击游戏可能把单例虚拟键盘挂到了它自己的容器上，这里挂回来
  mountKeyboard('keyboard');

  App.renderer.render(cfg.target);
  App.renderer.setSpaceVisible(App.opts.spaces);
  App.renderer.reset();

  $('typeArea').classList.remove('done');
  $('typeArea').classList.add('focused');
  $('typeOverlay').classList.remove('show');
  $('btnPause').disabled = false;
  $('btnPause').textContent = '⏸ 暂停';

  $('pTitle').textContent = cfg.title || '练习';
  $('pSubtitle').textContent = cfg.subtitle || '';

  const durationSec = cfg.durationSec || 0;
  $('sTimeLabel').textContent = durationSec ? '剩余' : '用时';

  App.session = new TypingSession({
    target: cfg.target,
    mode: cfg.mode,
    title: cfg.title,
    strict: App.opts.strict,
    tabIndent: App.opts.tabIndent,
    durationSec,
    onUpdate: renderStats,
    onFinish: onSessionFinish,
    onFeedback: onFeedback,
  });

  // 「下一组」按钮：限时测试和自定义文本都没有"下一组"
  const noNext = cfg.mode === 'test' || cfg.mode === 'custom';
  $('btnNext').style.display = noNext ? 'none' : '';

  renderStats(App.session.stats());
  $('typeScroll').scrollTop = 0;
  // 一进来就把光标放在第一个字符上，否则用户不知道该从哪开始
  App.renderer.setCursor(App.session.pos);
  updatePinyinPanel();
  updateHint();

  if (durationSec) {
    App.timer = setInterval(() => {
      const s = App.session;
      if (!s || s.finished) return;
      const st = s.stats();
      renderStats(st);
      if (st.seconds >= durationSec) s.timeUp();
    }, 100);
  } else {
    App.timer = setInterval(() => {
      const s = App.session;
      if (!s || s.finished || !s.startedAt) return;
      renderStats(s.stats());
    }, 200);
  }
}

function renderStats(st) {
  if (!st) return;
  $('sKpm').textContent = Math.round(st.kpm);
  $('sAcc').textContent = st.accuracy.toFixed(1) + '%';

  const s = App.session;
  if (s && s.durationSec) {
    $('sTime').textContent = fmtTime(Math.max(0, s.durationSec - st.seconds));
  } else {
    $('sTime').textContent = fmtTime(st.seconds);
  }

  $('sProgress').textContent = Math.round(st.progress * 100) + '%';
  $('pBar').style.width = (st.progress * 100).toFixed(2) + '%';

  const acc = $('sAcc').parentElement;
  acc.classList.remove('ok', 'warn', 'bad');
  if (st.totalKeys > 4) {
    acc.classList.add(st.accuracy >= 97 ? 'ok' : st.accuracy >= 92 ? 'warn' : 'bad');
  }

  const kpmBox = $('sKpm').parentElement;
  kpmBox.classList.remove('ok', 'warn', 'bad');
  if (st.totalKeys > 4) {
    kpmBox.classList.add(st.kpm >= 120 ? 'ok' : st.kpm >= 60 ? 'warn' : 'bad');
  }
}

function updateHint() {
  const s = App.session;
  if (!s || s.finished) {
    $('hintNext').innerHTML = '<span class="muted">这一组已经完成</span>';
    Keyboard.clearHighlight();
    Hands.clear();
    return;
  }

  const ch = s.nextChar();
  if (ch === null) return;

  const info = Keyboard.highlightChar(ch);
  if (!info) {
    $('hintNext').innerHTML = '<span class="muted">这个字符键盘上没有，可以直接跳过</span>';
    Hands.clear();
    return;
  }

  Hands.highlight(info.finger);
  const f = FINGER_INFO[info.finger];
  const disp = ch === '\n' ? '回车' : ch === ' ' ? '空格' : escapeHtml(ch);
  $('hintNext').innerHTML =
    `<span class="muted">下一个</span> <kbd>${disp}</kbd>` +
    `<span class="finger-tag" style="background:${f.color}">${f.name}</span>` +
    (info.shift ? '<span class="muted">＋ 按住 Shift</span>' : '');
}

function onFeedback(fb) {
  const s = App.session;
  if (!s) return;
  const info = keyInfoForChar(fb.expected);

  if (fb.ok) {
    if (fb.indent) {
      for (let i = 0; i < fb.indent; i++) App.renderer.setMark(fb.pos + i, 'ok');
    } else {
      App.renderer.setMark(fb.pos, 'ok');
    }
    if (info) { Keyboard.flash(info.id); Hands.press(info.finger); }
    playSound(true);
  } else {
    App.renderer.setMark(fb.pos, 'bad');
    Keyboard.flashError(fb.expected);
    if (info) Hands.press(info.finger);
    playSound(false);
    const area = $('typeArea');
    area.classList.remove('shake');
    void area.offsetWidth;          // 强制重排，让动画能连续触发
    area.classList.add('shake');
    setTimeout(() => area.classList.remove('shake'), 200);
  }

  App.renderer.setCursor(s.pos);
  updatePinyinPanel();
  updateHint();
}

/* ============================================================
   练习结束
   ============================================================ */
function onSessionFinish(stats, reason) {
  stopTimer();
  Keyboard.clearHighlight();
  Hands.clear();
  $('typeArea').classList.add('done');
  $('btnPause').disabled = true;

  const stars = calcStars(stats);

  if (stats.totalKeys >= 8) {
    Store.addRecord({
      ts: Date.now(),
      mode: stats.mode,
      title: stats.title,
      kpm: Math.round(stats.kpm),
      acc: Number(stats.accuracy.toFixed(2)),
      seconds: Math.round(stats.seconds),
      errors: stats.errorKeys,
      chars: stats.netChars,
    });
    Store.addKeyErrors(stats.keyErrors);
    if (App.current && App.current.levelId) {
      Store.updateLevel(App.current.levelId, stats, stars);
    }
  }

  showModal(stats, stars, reason);
}

function advise(st) {
  if (st.totalKeys < 8) return '练习时间太短，没有计入成绩。多打一会儿吧。';
  if (st.accuracy < 90) return '错得有点多。放慢速度，先保证每个键都按对 —— 准确率上去了，速度自然会跟上来。';
  if (st.accuracy < 95) return '不错！再稳一点就更好了。练习时眼睛盯着屏幕，不要看键盘。';
  if (st.kpm < 60) return '准确率很棒，这就是正确的方式。接下来试着把速度提上来，手指记得回到基准键。';
  if (st.kpm < 130) return '又准又快，已经超过大多数初学者了，继续保持。';
  return '非常厉害！可以挑战更难的关卡，或者去做限时速度测试。';
}

function showModal(stats, stars, reason) {
  $('mStars').innerHTML = starsHtml(stars);
  $('mTitle').textContent = reason === 'timeup' ? '时间到！' : '这一组完成啦';

  $('mStats').innerHTML =
    `<div><b>${Math.round(stats.kpm)}</b><span>字/分</span></div>` +
    `<div><b>${stats.accuracy.toFixed(1)}%</b><span>正确率</span></div>` +
    `<div><b>${fmtTime(stats.seconds)}</b><span>用时</span></div>` +
    `<div><b>${stats.errorKeys}</b><span>错误次数</span></div>`;

  $('mMsg').textContent = advise(stats);
  $('mNext').style.display = (App.current && App.current.mode === 'test') ? 'none' : '';
  $('modalMask').classList.remove('hidden');
}

function closeModal() {
  $('modalMask').classList.add('hidden');
}

/* ============================================================
   键盘监听
   ============================================================ */
function onKeyDown(e) {
  // 拳击小游戏有自己的按键处理
  if (App.screen === 'boxing') { Boxing.onKeyDown(e); return; }
  if (App.screen !== 'practice') return;

  // 弹窗打开时：回车 = 下一组，Esc = 关闭
  if (!$('modalMask').classList.contains('hidden')) {
    if (e.key === 'Enter') { e.preventDefault(); $('mNext').style.display === 'none' ? closeModal() : nextLevel(); }
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
    return;
  }

  if (e.key === 'Escape') { e.preventDefault(); backFromPractice(); return; }

  const s = App.session;
  if (!s || s.finished || s.paused) return;

  // 忽略单独按下的修饰键
  if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'AltGraph', 'ContextMenu', 'F5', 'F12'].includes(e.key)) return;

  const ch = charFromEvent(e);
  if (ch === null) return;

  e.preventDefault();   // 阻止 Tab 跳焦点、空格滚页面、退格返回上一页

  if (ch === 'BACKSPACE') {
    if (s.backspace()) { App.renderer.setCursor(s.pos); updatePinyinPanel(); }
  } else {
    s.press(ch);
  }
}

/* ============================================================
   速度测试
   ============================================================ */
function startTest() {
  const kind = $('testKind').querySelector('.seg-btn.active').dataset.kind;
  const dur = Number($('testDur').querySelector('.seg-btn.active').dataset.dur);
  const names = { code: '代码混合', english: '英文文章', pinyin: '拼音中文', symbol: '纯符号' };

  // 拼音测试也要带上对照表，候选词框才显示得出来
  const unit = kind === 'pinyin' ? pyUnit(PY_ALL, 150) : null;

  startPractice({
    title: `速度测试 · ${names[kind]} · ${dur / 60} 分钟`,
    subtitle: '时间到会自动结算',
    mode: 'test',
    origin: 'test',
    target: unit ? unit.target : TEST_TEXTS[kind](),
    items: unit ? unit.items : undefined,
    durationSec: dur,
  });
}

/* ============================================================
   自定义练习
   ============================================================ */

/**
 * 把粘贴进来的文本规整成可以逐字比对的目标串。
 * - 统一换行符（Windows 的 \r\n / 老的 \r 都转成 \n）
 * - 可选把 Tab 换成 4 个空格（粘贴来的代码经常混用 Tab 和空格）
 * - 去掉每行行尾多余的空格，以及首尾的空行
 */
function normalizeCustomText(raw, tabsToSpaces) {
  let t = String(raw == null ? '' : raw).replace(/\r\n?/g, '\n');
  // 从网页 / Word 复制过来的文本常带 BOM 和零宽字符：肉眼看不见，但会卡住练习
  t = t.replace(/[\uFEFF\u200B-\u200D]/g, '');
  if (tabsToSpaces) t = t.replace(/\t/g, '    ');
  t = t.split('\n').map((line) => line.replace(/[ ]+$/, '')).join('\n');
  return t.replace(/^\n+/, '').replace(/\n+$/, '');
}

/**
 * 找出键盘上打不出来的字符（中文汉字、全角标点、emoji……）。
 * 这个模式是逐字比对的，混进这类字符会让练习卡死，所以开始前要先拦下来。
 */
function unmappableChars(t) {
  const seen = new Map();
  for (const ch of t) {
    if (ch === '\n' || ch === ' ' || ch === '\t') continue;
    if (!keyInfoForChar(ch)) seen.set(ch, (seen.get(ch) || 0) + 1);
  }
  return seen;
}

function customError(msg) {
  const el = $('customErr');
  if (!msg) { el.hidden = true; el.textContent = ''; return; }
  el.textContent = msg;
  el.hidden = false;
}

function updateCustomCount() {
  const t = normalizeCustomText($('customText').value, $('customTabs').checked);
  const el = $('customCount');
  const n = t.length;
  el.textContent = n + ' 个字符' + (n > 0 ? ` · ${t.split('\n').length} 行` : '');
  el.classList.toggle('over', n > 3000);
  el.classList.toggle('warn', n > 1500 && n <= 3000);
  if (n > 0) customError('');
}

function startCustom() {
  const t = normalizeCustomText($('customText').value, $('customTabs').checked);

  if (t.length < 10) {
    customError('文本太短了，至少要 10 个字符才值得练一次。');
    $('customText').focus();
    return;
  }
  if (t.length > 8000) {
    customError(`太长了（${t.length} 个字符）。建议删减到 3000 字以内 —— 一次练不完，也不容易坚持。`);
    return;
  }

  // 打不出来的字符会让严格模式永远卡在那里，必须提前拦住
  const bad = unmappableChars(t);
  if (bad.size > 0) {
    let total = 0;
    bad.forEach((n) => { total += n; });
    const sample = [...bad.keys()].slice(0, 6).map((c) => `「${c}」`).join('');
    customError(
      `文本里有 ${total} 个字符键盘上打不出来：${sample}${bad.size > 6 ? ' 等' : ''}。`
      + '这个模式是逐字比对英文和代码的 —— 中文汉字、全角标点、emoji 都输入不了。'
      + '要练中文请用顶栏的「拼音打字」，那里是打拼音。',
    );
    return;
  }

  customError('');

  App.list = null;
  App.index = -1;
  startPractice({
    title: '自定义练习',
    subtitle: `${t.length} 个字符 · ${t.split('\n').length} 行`,
    mode: 'custom',
    origin: 'custom',
    target: t,
  });
}

/* ============================================================
   成绩记录界面
   ============================================================ */
function renderRecords() {
  const recs = Store.data.records;
  const totalSec = recs.reduce((a, r) => a + r.seconds, 0);
  const bestKpm = recs.length ? Math.max(...recs.map((r) => r.kpm)) : 0;
  const avgAcc = recs.length ? recs.reduce((a, r) => a + r.acc, 0) / recs.length : 0;

  $('recordOverview').innerHTML =
    `<div class="ov-card"><b>${recs.length}</b><span>练习次数</span></div>` +
    `<div class="ov-card"><b>${fmtTime(totalSec)}</b><span>累计练习时间</span></div>` +
    `<div class="ov-card"><b>${bestKpm}</b><span>最高字/分</span></div>` +
    `<div class="ov-card"><b>${avgAcc.toFixed(1)}%</b><span>平均正确率</span></div>`;

  if (!Store.available) {
    $('trendNote').textContent = '⚠ 浏览器禁止了本地存储，这次的成绩不会被保存。';
  }

  drawTrend(recs);
  renderWeakKeys();
  renderRecordTable(recs);
}

function renderRecordTable(recs) {
  const tb = $('recordTable').querySelector('tbody');
  tb.innerHTML = '';
  if (!recs.length) {
    tb.innerHTML = '<tr class="empty-row"><td colspan="6">还没有成绩，先去练一组吧</td></tr>';
    return;
  }
  recs.slice(-20).reverse().forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td>${fmtDate(r.ts)}</td>` +
      `<td class="r-mode">${escapeHtml(r.title || r.mode)}</td>` +
      `<td class="r-kpm">${r.kpm}</td>` +
      `<td>${r.acc.toFixed(1)}%</td>` +
      `<td>${fmtTime(r.seconds)}</td>` +
      `<td>${r.errors}</td>`;
    tb.appendChild(tr);
  });
}

function renderWeakKeys() {
  const box = $('weakList');
  const entries = Object.entries(Store.data.keyErrors)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (!entries.length) {
    box.innerHTML = '<p class="card-note" style="margin:0">还没有错误数据。多练几组，这里会告诉你哪几个键最需要加强。</p>';
    $('btnWeakDrill').disabled = true;
    return;
  }

  $('btnWeakDrill').disabled = false;
  const max = entries[0][1];
  box.innerHTML = entries.map(([k, n]) => {
    const label = k === 'Space' ? '空格' : k === 'Enter' ? '回车' : escapeHtml(k);
    return `<div class="weak-item">
      <kbd>${label}</kbd>
      <div class="weak-bar"><i style="width:${Math.max(6, (n / max) * 100)}%"></i></div>
      <em>${n} 次</em>
    </div>`;
  }).join('');
}

function drawTrend(recs) {
  const cv = $('trendChart');
  const ctx = cv.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = cv.clientWidth || 600;
  const H = 220;
  cv.width = Math.round(W * dpr);
  cv.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const data = recs.slice(-40);
  $('trendNote').textContent = data.length >= 2
    ? `最近 ${data.length} 次的字/分变化（越往右越新）`
    : '再练几组就能看到进步曲线了。';

  if (!data.length) {
    ctx.fillStyle = '#c3cbd9';
    ctx.font = '14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无数据', W / 2, H / 2);
    return;
  }

  const padL = 40, padR = 14, padT = 16, padB = 28;
  const cw = W - padL - padR;
  const chh = H - padT - padB;

  const maxV = Math.max(40, ...data.map((d) => d.kpm));
  const niceMax = Math.ceil(maxV / 40) * 40;

  // 网格 + Y 轴刻度
  ctx.strokeStyle = '#eef1f6';
  ctx.fillStyle = '#a9b3c4';
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const v = (niceMax / 4) * i;
    const y = padT + chh - (v / niceMax) * chh;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + cw, y);
    ctx.stroke();
    ctx.fillText(String(Math.round(v)), padL - 8, y + 4);
  }

  const xAt = (i) => padL + (data.length === 1 ? cw / 2 : (i / (data.length - 1)) * cw);
  const yAt = (v) => padT + chh - (v / niceMax) * chh;

  // 面积
  const grad = ctx.createLinearGradient(0, padT, 0, padT + chh);
  grad.addColorStop(0, 'rgba(59,110,245,.22)');
  grad.addColorStop(1, 'rgba(59,110,245,0)');
  ctx.beginPath();
  ctx.moveTo(xAt(0), padT + chh);
  data.forEach((d, i) => ctx.lineTo(xAt(i), yAt(d.kpm)));
  ctx.lineTo(xAt(data.length - 1), padT + chh);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // 折线
  ctx.beginPath();
  data.forEach((d, i) => (i ? ctx.lineTo(xAt(i), yAt(d.kpm)) : ctx.moveTo(xAt(i), yAt(d.kpm))));
  ctx.strokeStyle = '#3b6ef5';
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // 数据点
  data.forEach((d, i) => {
    ctx.beginPath();
    ctx.arc(xAt(i), yAt(d.kpm), 3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#3b6ef5';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // 最高分标注
  const bi = data.reduce((best, d, i) => (d.kpm > data[best].kpm ? i : best), 0);
  ctx.fillStyle = '#2a55cc';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${data[bi].kpm}`, xAt(bi), yAt(data[bi].kpm) - 9);
}

/** 用最常按错的键现场生成一组针对性练习 */
function startWeakDrill() {
  const keys = Object.keys(Store.data.keyErrors)
    .filter((k) => Store.data.keyErrors[k] > 0 && k !== 'Space' && k !== 'Enter' && k.length === 1)
    .sort((a, b) => Store.data.keyErrors[b] - Store.data.keyErrors[a])
    .slice(0, 8);

  if (keys.length < 2) {
    alert('错误样本还不够多，先多练几组再来。');
    return;
  }

  App.list = null;
  App.index = -1;
  startPractice({
    title: '薄弱键专项练习',
    subtitle: '根据你的历史错误自动生成：' + keys.map((k) => (k === ' ' ? '空格' : k)).join(' '),
    mode: 'weak',
    origin: 'records',
    target: genKeyDrill(keys, { rows: 5, groupLen: 4 }),
  });
}

/* ============================================================
   练习控制
   ============================================================ */
function restartPractice() {
  if (!App.current) return;
  closeModal();
  // 重新生成文本（符号/单词/拼音都是随机的，所以每次都不一样）
  const cfg = { ...App.current };
  if (App.current.mode === 'test') {
    const kind = $('testKind').querySelector('.seg-btn.active').dataset.kind;
    if (kind === 'pinyin') {
      const u = pyUnit(PY_ALL, 150);
      cfg.target = u.target;
      cfg.items = u.items;
    } else {
      cfg.target = TEST_TEXTS[kind]();
      cfg.items = undefined;
    }
  } else {
    const found = findLevel(App.current.levelId);
    if (found) {
      const u = levelUnit(found);
      cfg.target = u.target;
      cfg.items = u.items;
    }
  }
  App.current = cfg;
  buildSession(cfg);
}

function findLevel(id) {
  if (!id) return null;
  let hit = null;
  FINGER_LESSONS.forEach((l) => { if (l.id === id) hit = l; });
  const scan = (tab) => {
    if (tab.levels) tab.levels.forEach((l) => { if (l.id === id) hit = l; });
    if (tab.groups) tab.groups.forEach((g) => g.levels.forEach((l) => { if (l.id === id) hit = l; }));
  };
  ENGLISH_TRACK.tabs.forEach(scan);
  PINYIN_TRACK.tabs.forEach(scan);
  CODE_TRACK.tabs.forEach(scan);
  return hit;
}

function nextLevel() {
  closeModal();
  if (!App.list || App.index < 0 || App.index + 1 >= App.list.length) {
    backFromPractice();
    return;
  }
  const next = App.list[App.index + 1];
  App.index = App.index + 1;
  const u = levelUnit(next);
  startPractice({
    title: next.title,
    subtitle: next.desc || '',
    mode: App.current.mode,
    origin: App.current.origin,
    target: u.target,
    items: u.items,
    levelId: next.id,
  });
}

function backFromPractice() {
  stopTimer();
  App.session = null;
  closeModal();
  const origin = (App.current && App.current.origin) || 'home';
  App.current = null;
  showScreen(origin);
  if (origin === 'records') renderRecords();
  if (GRID_SCREENS.includes(origin)) renderAllGrids();
}

function togglePause() {
  const s = App.session;
  if (!s || s.finished) return;
  if (s.paused) {
    s.resume();
    $('typeOverlay').classList.remove('show');
    $('btnPause').textContent = '⏸ 暂停';
    updateHint();
  } else {
    if (!s.startedAt) return;   // 还没开始就不用暂停
    s.pause();
    $('typeOverlay').innerHTML = '<div style="text-align:center"><b>已暂停</b><br><span style="font-size:14px;color:#8c96a8">点「继续」或按 Esc 返回</span></div>';
    $('typeOverlay').classList.add('show');
    $('btnPause').textContent = '▶ 继续';
  }
}

/* ============================================================
   初始化
   ============================================================ */
function bindSeg(container, onChange) {
  container.querySelectorAll('.seg-btn').forEach((b) => {
    b.addEventListener('click', () => {
      container.querySelectorAll('.seg-btn').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      onChange && onChange(b);
    });
  });
}

/** 这些界面里放的是「关卡卡片」，每次进入都要重新生成预览 */
const GRID_SCREENS = ['finger', 'english', 'pinyin', 'code'];

function init() {
  Store.load();

  // 读取上次的开关设置
  if (Store.data.settings) Object.assign(App.opts, Store.data.settings);
  $('chkStrict').checked = App.opts.strict;
  $('chkTabIndent').checked = App.opts.tabIndent;
  $('chkSpaces').checked = App.opts.spaces;
  $('chkSound').checked = App.opts.sound;

  // 渲染组件
  App.renderer = new TextRenderer($('typeText'));
  mountKeyboard('keyboard');
  Keyboard.renderLegend($('kbLegend'));
  Hands.init(document.querySelector('.hands-wrap'));
  renderAllGrids();

  // 拳击小游戏
  Boxing.init();
  Boxing.bindLevels();
  $('btnBoxing').addEventListener('click', () => {
    showScreen('boxing');
    Boxing.start();
  });

  // 顶部导航
  document.querySelectorAll('.nav-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const target = b.dataset.screen;
      if (App.screen === 'practice') { stopTimer(); App.session = null; closeModal(); }
      if (App.screen === 'boxing') Boxing.stop();
      showScreen(target);
      if (target === 'records') renderRecords();
      if (GRID_SCREENS.includes(target)) renderAllGrids();
    });
  });

  // 首页卡片
  document.querySelectorAll('[data-goto]').forEach((b) => {
    b.addEventListener('click', () => {
      const target = b.dataset.goto;
      showScreen(target);
      if (target === 'records') renderRecords();
    });
  });

  // 练习界面按钮
  $('btnBack').addEventListener('click', backFromPractice);
  $('btnRestart').addEventListener('click', restartPractice);
  $('btnPause').addEventListener('click', togglePause);
  $('btnNext').addEventListener('click', nextLevel);
  $('typeOverlay').addEventListener('click', () => { if (App.session && App.session.paused) togglePause(); });
  $('typeArea').addEventListener('click', () => { if (App.session && App.session.paused) togglePause(); });

  // 弹窗按钮
  $('mAgain').addEventListener('click', restartPractice);
  $('mNext').addEventListener('click', nextLevel);
  $('mClose').addEventListener('click', () => { closeModal(); backFromPractice(); });

  // 开关
  $('chkStrict').addEventListener('change', (e) => {
    App.opts.strict = e.target.checked;
    if (App.session) App.session.strict = e.target.checked;
    Store.saveSettings(App.opts);
  });
  $('chkTabIndent').addEventListener('change', (e) => {
    App.opts.tabIndent = e.target.checked;
    if (App.session) App.session.tabIndent = e.target.checked;
    Store.saveSettings(App.opts);
  });
  $('chkSpaces').addEventListener('change', (e) => {
    App.opts.spaces = e.target.checked;
    App.renderer.setSpaceVisible(e.target.checked);
    Store.saveSettings(App.opts);
  });
  $('chkSound').addEventListener('change', (e) => {
    App.opts.sound = e.target.checked;
    Store.saveSettings(App.opts);
    if (e.target.checked) playSound(true);
  });

  // 速度测试
  bindSeg($('testKind'));
  bindSeg($('testDur'));
  $('btnStartTest').addEventListener('click', startTest);

  // 自定义练习
  $('customStart').addEventListener('click', startCustom);
  $('customText').addEventListener('input', updateCustomCount);
  $('customTabs').addEventListener('change', updateCustomCount);
  $('customText').addEventListener('keydown', (e) => {
    // 文本框里 Ctrl+Enter 直接开始，省得去点按钮
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); startCustom(); }
  });

  // 成绩记录
  $('btnClearRecords').addEventListener('click', () => {
    if (confirm('确定要清空全部成绩记录吗？这个操作不能撤销。')) {
      Store.clear();
      renderRecords();
      renderAllGrids();
    }
  });
  $('btnWeakDrill').addEventListener('click', startWeakDrill);

  // 全局键盘监听
  document.addEventListener('keydown', onKeyDown);

  // 窗口尺寸变化时重画曲线
  let rt = null;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (App.screen === 'records') drawTrend(Store.data.records); }, 150);
  });

  showScreen('home');
}

document.addEventListener('DOMContentLoaded', init);

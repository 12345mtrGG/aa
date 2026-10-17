/* ============================================================
   boxing.js —— 指法基础里的拳击小游戏

   核心规则：打对高亮的键 = 出拳，打错 = 被对手反击。
   所以这个游戏练的不是「反应快」，而是「手指准」——
   和指法课的目标一致，不是另搞一套。
   ============================================================ */

const BOX_LEVELS = {
  easy: {
    name: '简单', tip: '只打基准键 A S D F J K L ;',
    keys: 'asdfjkl;'.split(''),
    foeHp: 600, youHp: 100, duration: 60,
  },
  normal: {
    name: '中等', tip: '全部字母键',
    keys: 'asdfghjkl;qwertyuiopzxcvbnm,.'.split(''),
    foeHp: 800, youHp: 100, duration: 60,
  },
  hard: {
    name: '困难', tip: '26 个字母 + 数字',
    keys: 'abcdefghijklmnopqrstuvwxyz0123456789'.split(''),
    foeHp: 1000, youHp: 100, duration: 60,
  },
};

/* 连击越长，拳越重 —— 让「打准」比「打快」更划算 */
const PUNCH_TIERS = [
  { min: 20, name: '毁灭重拳' },
  { min: 12, name: '上勾拳' },
  { min: 8, name: '摆拳' },
  { min: 5, name: '勾拳' },
  { min: 3, name: '直拳' },
  { min: 1, name: '刺拳' },
];

const BOX_BASE_DAMAGE = 10;   // 每拳基础伤害
const BOX_MAX_MULT = 5;       // 连击倍率上限
const BOX_MISS_DAMAGE = 6;    // 打错一次自己被反击掉多少血
const BOX_QUEUE_LEN = 5;      // 屏幕上预先显示几个待打的键
const BOX_COUNTDOWN_MS = 600;

/** 连击数 → 伤害倍率与本次伤害（每 5 连加一档，最高 ×5） */
function boxDamage(combo) {
  const mult = Math.min(BOX_MAX_MULT, 1 + Math.floor(combo / 5));
  return { mult, dmg: BOX_BASE_DAMAGE * mult };
}

/** 连击数 → 这一拳叫什么 */
function boxPunchName(combo) {
  const t = PUNCH_TIERS.find((x) => combo >= x.min);
  return t ? t.name : '';
}

/** 时间到的时候按剩余血量比例判定点数胜负 */
function boxDecide(youHp, youMax, foeHp, foeMax) {
  return (youHp / youMax) > (foeHp / foeMax);
}

const Boxing = {
  levelId: 'easy',
  cfg: null,
  queue: [],
  combo: 0,
  maxCombo: 0,
  youHp: 100,
  foeHp: 600,
  hits: 0,
  misses: 0,
  damageDealt: 0,
  damageTaken: 0,
  remaining: 60,
  clock: null,
  countdownTimer: null,
  running: false,      // 倒计时结束、正式开打
  busy: false,         // 倒计时中 / 已结束
  over: false,
  el: {},

  /* ---------- 初始化：缓存元素 + 绑定按钮 ---------- */
  init() {
    const ids = ['boxTimer', 'boxYouHp', 'boxFoeHp', 'boxYouHpTxt', 'boxFoeHpTxt',
      'boxYouFig', 'boxFoeFig', 'boxStage', 'boxBanner', 'boxComboTxt', 'boxPunchName',
      'boxQueue', 'boxHint', 'boxOverlay', 'boxResIcon', 'boxResTitle', 'boxResStats',
      'boxResMsg', 'boxSound', 'fistLeft', 'fistRight'];
    ids.forEach((id) => { this.el[id] = $(id); });

    $('boxBack').addEventListener('click', () => this.quit());
    $('boxAgain').addEventListener('click', () => this.start());
    $('boxExit').addEventListener('click', () => this.quit());
  },

  /** 这个键该用哪只手 → 哪只拳套出拳。左手键出左拳，右手键出右拳。 */
  sideOf(ch) {
    const info = keyInfoForChar(ch);
    if (!info) return 'right';
    return info.finger.charAt(0) === 'L' ? 'left' : 'right';
  },

  /** 清掉拳套上的临时状态（出拳、待命、受击闪烁） */
  clearFistState() {
    [this.el.fistLeft, this.el.fistRight].forEach((f) => {
      if (f) f.classList.remove('thrust', 'ready');
    });
    if (this.el.boxStage) this.el.boxStage.classList.remove('hitflash', 'shake');
  },

  /* ---------- 难度切换 ---------- */
  bindLevels() {
    document.querySelectorAll('#boxLevelSeg .seg-btn').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#boxLevelSeg .seg-btn').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        this.levelId = b.dataset.lv;
        this.start();          // 换难度直接重开一局
      });
    });
    const snd = this.el.boxSound;
    if (snd) {
      snd.checked = App.opts.sound;
      snd.addEventListener('change', (e) => {
        App.opts.sound = e.target.checked;
        Store.saveSettings(App.opts);
        if (e.target.checked) playSound(true);
      });
    }
  },

  /* ---------- 开始一局 ---------- */
  start(levelId) {
    if (levelId) this.levelId = levelId;
    this.cfg = BOX_LEVELS[this.levelId] || BOX_LEVELS.easy;

    clearInterval(this.clock);
    clearInterval(this.countdownTimer);
    this.clock = null;

    this.queue = [];
    this.combo = 0;
    this.maxCombo = 0;
    this.hits = 0;
    this.misses = 0;
    this.damageDealt = 0;
    this.damageTaken = 0;
    this.youHp = this.cfg.youHp;
    this.foeHp = this.cfg.foeHp;
    this.remaining = this.cfg.duration;
    this.running = false;
    this.busy = true;
    this.over = false;

    this.el.boxOverlay.classList.add('hidden');
    this.el.boxStage.classList.remove('danger');
    this.el.boxFoeFig.classList.remove('hitted');
    this.clearFistState();

    // 顺序很重要：先把单例虚拟键盘挂到拳击台上，再去做高亮，
    // 否则高亮会落在上一个界面的键盘上、然后被重绘冲掉。
    mountKeyboard('boxingKeyboard');
    Keyboard.clearHighlight();

    this.refillQueue(BOX_QUEUE_LEN);
    this.renderQueue();
    this.updateHud();
    this.updateHint();

    this.runCountdown();
  },

  runCountdown() {
    let n = 3;
    const step = () => {
      if (n > 0) {
        this.showBanner(String(n));
        n--;
        this.countdownTimer = setTimeout(step, BOX_COUNTDOWN_MS);
      } else {
        this.showBanner('开始！');
        this.countdownTimer = setTimeout(() => {
          this.hideBanner();
          this.begin();
        }, BOX_COUNTDOWN_MS);
      }
    };
    step();
  },

  begin() {
    this.busy = false;
    this.running = true;
    this.startedAt = Date.now();
    this.clock = setInterval(() => this.tick(), 100);
    this.updateHint();
  },

  /* ---------- 计时 ---------- */
  tick() {
    if (!this.running) return;
    const left = this.cfg.duration - (Date.now() - this.startedAt) / 1000;
    this.remaining = Math.max(0, left);
    this.el.boxTimer.textContent = fmtTime(this.remaining);
    this.el.boxTimer.classList.toggle('urgent', this.remaining <= 10);

    if (this.remaining <= 0) this.finish('timeup');
  },

  /* ---------- 出拳序列 ---------- */
  randomKey() {
    const ks = this.cfg.keys;
    let k = R.pick(ks);
    // 同一个键最多连出两次，否则手感很假
    let guard = 0;
    while (guard++ < 12 && ks.length > 1 && this.queue.slice(-2).every((x) => x === k)) {
      k = R.pick(ks);
    }
    return k;
  },

  refillQueue(n) {
    while (this.queue.length < n) this.queue.push(this.randomKey());
  },

  advance() {
    this.queue.shift();
    this.queue.push(this.randomKey());
    this.renderQueue();
    this.updateHint();
  },

  /* ---------- 按键 ---------- */
  onKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); this.quit(); return; }
    if (!this.running) return;
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'AltGraph', 'ContextMenu', 'F5', 'F12'].includes(e.key)) return;

    const ch = charFromEvent(e);
    if (ch === null || ch === 'BACKSPACE') return;
    e.preventDefault();
    // 大小写不敏感：这个游戏练的是手指落点，不是 Shift
    this.press(ch.toLowerCase());
  },

  press(ch) {
    if (!this.running || this.over) return;
    const want = this.queue[0];

    if (ch === want) {
      this.hits++;
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);

      const { mult, dmg } = boxDamage(this.combo);
      this.damageDealt += dmg;
      this.foeHp = Math.max(0, this.foeHp - dmg);

      this.advance();
      // 用「刚按下的这个键」决定出哪只手，而不是下一个键
      this.punchFx(dmg, mult, this.sideOf(ch));
      Keyboard.flash(keyInfoForChar(want) ? keyInfoForChar(want).id : null);
      playSound(true);
      this.updateHud();

      if (this.foeHp <= 0) return this.finish('ko');
    } else {
      this.misses++;
      this.combo = 0;
      this.youHp = Math.max(0, this.youHp - BOX_MISS_DAMAGE);
      this.damageTaken += BOX_MISS_DAMAGE;

      this.counterFx(want);
      playSound(false);
      this.updateHud();

      if (this.youHp <= 0) return this.finish('down');
    }
  },

  /* ---------- 界面刷新 ---------- */
  updateHud() {
    const youPct = (this.youHp / this.cfg.youHp) * 100;
    const foePct = (this.foeHp / this.cfg.foeHp) * 100;
    this.el.boxYouHp.style.width = youPct + '%';
    this.el.boxFoeHp.style.width = foePct + '%';
    this.el.boxYouHpTxt.textContent = Math.round(this.youHp);
    this.el.boxFoeHpTxt.textContent = Math.round(this.foeHp);

    this.el.boxComboTxt.innerHTML = `连击 <b>${this.combo}</b>`;

    this.el.boxPunchName.textContent = boxPunchName(this.combo);
    this.el.boxPunchName.classList.toggle('hot', this.combo >= 8);

    // 对手快倒下了给个提示
    this.el.boxStage.classList.toggle('danger', foePct <= 30 && this.running);
  },

  renderQueue() {
    const box = this.el.boxQueue;
    box.innerHTML = '';
    this.queue.forEach((k, i) => {
      const info = keyInfoForChar(k);
      const el = document.createElement('div');
      el.className = 'qkey' + (i === 0 ? ' cur' : '');
      el.innerHTML =
        `<span class="qk-main">${escapeHtml(k === ' ' ? '空格' : k)}</span>` +
        (info ? `<span class="qk-finger" style="background:${FINGER_INFO[info.finger].color}"></span>` : '');
      box.appendChild(el);
    });
  },

  /** 哪只拳套亮起来待命 —— 让玩家一眼看出这一拳该用哪只手 */
  setReadyFist(ch) {
    const side = ch ? this.sideOf(ch) : null;
    if (this.el.fistLeft) this.el.fistLeft.classList.toggle('ready', side === 'left');
    if (this.el.fistRight) this.el.fistRight.classList.toggle('ready', side === 'right');
  },

  updateHint() {
    const ch = this.queue[0];
    if (this.over || !ch) {
      this.el.boxHint.innerHTML = '<span class="muted">回合结束</span>';
      Keyboard.clearHighlight();
      this.setReadyFist(null);
      return;
    }
    const info = Keyboard.highlightChar(ch);
    if (!info) { this.el.boxHint.innerHTML = '<span class="muted">—</span>'; return; }
    this.setReadyFist(ch);

    const f = FINGER_INFO[info.finger];
    const fistName = this.sideOf(ch) === 'left' ? '左拳' : '右拳';
    // 倒计时阶段就把第一个出拳键亮出来，玩家可以先把手指定好位
    const lead = this.running ? '出拳键' : '准备';
    this.el.boxHint.innerHTML =
      `<span class="muted">${lead}</span> <kbd>${escapeHtml(ch === ' ' ? '空格' : ch)}</kbd>` +
      `<span class="finger-tag" style="background:${f.color}">${f.name}</span>` +
      `<span class="fist-tag ${this.sideOf(ch)}">${fistName}</span>` +
      (this.running && this.combo >= 3
        ? `<span class="muted">连击加成 ×${boxDamage(this.combo).mult}</span>`
        : '');
  },

  /* ---------- 特效 ---------- */
  /** 命中点：对手的脸（第一视角下就在屏幕中上方） */
  punchFx(dmg, mult, side) {
    const stage = this.el.boxStage;

    // 出拳的拳套向前顶一下
    const fist = side === 'left' ? this.el.fistLeft : this.el.fistRight;
    if (fist) {
      // 同一只手连打时，上一次的定时器会把这次动画提前掐断，所以按拳套分别记时
      clearTimeout(fist._thrustTimer);
      fist.classList.remove('thrust');
      void fist.offsetWidth;          // 强制重排，让同一只手连打也能重新播放动画
      fist.classList.add('thrust');
      fist._thrustTimer = setTimeout(() => {
        fist.classList.remove('thrust');
        fist._thrustTimer = null;
      }, 260);
    }

    const pow = document.createElement('div');
    pow.className = 'fx-pow' + (mult >= 3 ? ' big' : '');
    pow.textContent = '💥';
    stage.appendChild(pow);
    setTimeout(() => pow.remove(), 440);

    const num = document.createElement('div');
    num.className = 'fx-dmg foe' + (mult >= 3 ? ' big' : '');
    num.textContent = '-' + dmg;
    stage.appendChild(num);
    setTimeout(() => num.remove(), 720);

    // 对手被打退
    this.el.boxFoeFig.classList.remove('hitted');
    void this.el.boxFoeFig.offsetWidth;
    this.el.boxFoeFig.classList.add('hitted');
    setTimeout(() => this.el.boxFoeFig.classList.remove('hitted'), 250);
  },

  counterFx(want) {
    const stage = this.el.boxStage;

    // 第一视角被打中：整块屏幕红一下 + 震一下
    stage.classList.remove('hitflash', 'shake');
    void stage.offsetWidth;
    stage.classList.add('hitflash', 'shake');
    setTimeout(() => {
      stage.classList.remove('hitflash', 'shake');
    }, 360);

    const num = document.createElement('div');
    num.className = 'fx-dmg you';
    num.textContent = '-' + BOX_MISS_DAMAGE;
    stage.appendChild(num);
    setTimeout(() => num.remove(), 720);

    // 顺便告诉玩家他按错了哪个键
    const info = keyInfoForChar(want);
    if (info) Keyboard.flashError(want);
  },

  showBanner(text) {
    this.el.boxBanner.textContent = text;
    this.el.boxBanner.classList.add('show');
  },

  hideBanner() {
    this.el.boxBanner.classList.remove('show');
  },

  /* ---------- 结算 ---------- */
  finish(reason) {
    if (this.over) return;
    this.over = true;
    this.running = false;
    clearInterval(this.clock);
    this.clock = null;

    const elapsed = this.cfg.duration - this.remaining;
    const total = this.hits + this.misses;
    const acc = total ? (this.hits / total) * 100 : 100;
    const kpm = elapsed > 0.5 ? this.hits / (elapsed / 60) : 0;

    let win;
    let title;
    let icon;
    let msg;

    if (reason === 'ko') {
      win = true; icon = '🏆'; title = 'KO！对手倒下了';
      msg = this.maxCombo >= 15
        ? '连击打得非常漂亮，手指已经完全记住键位了。'
        : '赢下来了！试着把连击拉得更长，伤害会成倍增长。';
    } else if (reason === 'down') {
      win = false; icon = '💫'; title = '你被 KO 了';
      msg = '打错太多被反击了。放慢一点点，先把每个键都按准 —— 准确率上去了，连击自然就长。';
    } else {
      // 时间到：按剩余血量比例判定点数
      win = boxDecide(this.youHp, this.cfg.youHp, this.foeHp, this.cfg.foeHp);
      icon = win ? '🏅' : '⏱';
      title = win ? '点数获胜！' : '时间到，点数落后';
      msg = win
        ? '稳扎稳打拿下了这一局。想要 KO 的话，就得把连击拉长。'
        : `对手还剩 ${Math.round(this.foeHp)} 血。减少失误、把连击续上，就能反超。`;
    }

    Keyboard.clearHighlight();

    if (total >= 10) {
      Store.addRecord({
        ts: Date.now(),
        mode: 'boxing',
        title: `拳击训练 · ${this.cfg.name}`,
        kpm: Math.round(kpm),
        acc: Number(acc.toFixed(2)),
        seconds: Math.round(elapsed),
        errors: this.misses,
        chars: this.hits,
      });
    }

    this.el.boxResIcon.textContent = icon;
    this.el.boxResTitle.textContent = title;
    this.el.boxResStats.innerHTML =
      `<div><b>${this.hits}</b><span>出拳</span></div>` +
      `<div><b>${this.maxCombo}</b><span>最高连击</span></div>` +
      `<div><b>${acc.toFixed(0)}%</b><span>准确率</span></div>` +
      `<div><b>${this.damageDealt}</b><span>造成伤害</span></div>`;
    this.el.boxResMsg.textContent = msg;
    this.el.boxOverlay.classList.remove('hidden');
    this.setReadyFist(null);
  },

  /* ---------- 退出 ---------- */
  /** 只做清理，不负责跳转（切换顶部导航时用） */
  stop() {
    this.running = false;
    this.over = true;
    this.busy = false;
    clearInterval(this.clock);
    clearTimeout(this.countdownTimer);
    this.clock = null;
    this.countdownTimer = null;
    this.el.boxOverlay.classList.add('hidden');
    this.hideBanner();
    Keyboard.clearHighlight();
    this.clearFistState();
  },

  /** 回到指法基础页 */
  quit() {
    this.stop();
    showScreen('finger');
    renderAllGrids();
  },
};

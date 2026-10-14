/* ============================================================
   engine.js —— 打字引擎 + 文本渲染器
   ============================================================ */

/* ============================================================
   TextRenderer：把目标文本渲染成一个字符一个格子
   —— 只有变化的格子会被更新，所以长文本也不会卡。
   ============================================================ */
class TextRenderer {
  constructor(container) {
    this.el = container;     // .type-text
    this.scroller = container.parentElement;  // .type-scroll
    this.spans = [];
    this.text = '';
    this.cursorSpan = null;
  }

  render(text) {
    this.text = text;
    this.el.innerHTML = '';
    this.spans = [];
    this.cursorSpan = null;

    const frag = document.createDocumentFragment();
    const showNums = text.split('\n').length > 1;
    let lineNo = 1;
    let atLineStart = true;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];

      // 多行代码在每行开头加行号，方便看
      if (atLineStart && showNums && i > 0) {
        const ln = document.createElement('span');
        ln.className = 'ln';
        ln.textContent = String(lineNo);
        frag.appendChild(ln);
      }
      atLineStart = false;

      const span = document.createElement('span');
      span.className = 'c';

      if (ch === '\n') {
        span.classList.add('nl');
        frag.appendChild(span);
        frag.appendChild(document.createTextNode('\n'));
        this.spans.push(span);
        lineNo++;
        atLineStart = true;
        continue;
      }

      if (ch === ' ') span.classList.add('sp');
      span.textContent = ch;
      frag.appendChild(span);
      this.spans.push(span);
    }

    this.el.appendChild(frag);
  }

  setMark(i, cls) {
    const s = this.spans[i];
    if (!s) return;
    s.classList.remove('ok', 'bad');
    if (cls) s.classList.add(cls);
  }

  setCursor(i) {
    if (this.cursorSpan) this.cursorSpan.classList.remove('cur');
    const s = this.spans[i];
    if (!s) { this.cursorSpan = null; return; }
    s.classList.add('cur');
    this.cursorSpan = s;
    this.follow(s);
  }

  /** 光标跟随：让当前行始终完整地留在可视区域里 */
  follow(span) {
    const box = this.scroller;
    if (!box) return;
    const lh = parseFloat(getComputedStyle(this.el).lineHeight) || 40;
    const top = span.offsetTop;
    const h = box.clientHeight;
    const pad = 8;
    if (top < box.scrollTop + pad) {
      box.scrollTop = Math.max(0, top - pad);
    } else if (top + lh > box.scrollTop + h - pad) {
      box.scrollTop = top + lh - h + pad;
    }
  }

  reset() {
    this.spans.forEach((s) => s.classList.remove('ok', 'bad', 'cur'));
    this.cursorSpan = null;
    if (this.scroller) this.scroller.scrollTop = 0;
  }

  setSpaceVisible(on) {
    this.el.classList.toggle('show-spaces', !!on);
  }
}

/* ============================================================
   TypingSession：一次练习的完整状态机
   ============================================================ */
class TypingSession {
  /**
   * @param {object} cfg
   *   target       目标文本
   *   mode         练习类型标识（用于存成绩）
   *   title        显示名称
   *   strict       严格模式：按错必须改对才能前进
   *   tabIndent    Tab 键自动补全行首缩进
   *   durationSec  限时秒数（0 = 不限时）
   *   onUpdate     每次状态变化回调
   *   onFinish     完成回调 (stats, reason)
   *   onFeedback   每次击键回调 ({ok, expected, typed, finger})
   */
  constructor(cfg) {
    this.cfg = cfg || {};
    this.target = this.cfg.target || '';
    this.mode = this.cfg.mode || 'practice';
    this.title = this.cfg.title || '';
    this.strict = this.cfg.strict !== false;
    this.tabIndent = this.cfg.tabIndent !== false;
    this.durationSec = this.cfg.durationSec || 0;

    this.onUpdate = this.cfg.onUpdate || function () {};
    this.onFinish = this.cfg.onFinish || function () {};
    this.onFeedback = this.cfg.onFeedback || function () {};

    this.reset();
  }

  reset() {
    this.pos = 0;
    this.marks = new Array(this.target.length).fill(null);
    this.okCount = 0;
    this.totalKeys = 0;
    this.correctKeys = 0;
    this.errorKeys = 0;
    this.keyErrors = {};
    this.startedAt = null;
    this.finishedAt = null;
    this.pausedMs = 0;
    this.pauseStartedAt = null;
    this.paused = false;
    this.finished = false;
    this.finishReason = null;
    this.emit();
  }

  /* ---------- 时间 ---------- */
  elapsed() {
    if (!this.startedAt) return 0;
    const end = this.finishedAt || Date.now();
    const extra = this.paused && this.pauseStartedAt ? Date.now() - this.pauseStartedAt : 0;
    return Math.max(0, (end - this.startedAt - this.pausedMs - extra) / 1000);
  }

  pause() {
    if (this.paused || this.finished || !this.startedAt) return false;
    this.paused = true;
    this.pauseStartedAt = Date.now();
    return true;
  }

  resume() {
    if (!this.paused) return false;
    this.pausedMs += Date.now() - this.pauseStartedAt;
    this.pauseStartedAt = null;
    this.paused = false;
    return true;
  }

  /* ---------- 统计 ---------- */
  stats() {
    const sec = this.elapsed();
    const min = sec / 60;
    return {
      mode: this.mode,
      title: this.title,
      seconds: sec,
      netChars: this.okCount,
      totalChars: this.target.length,
      totalKeys: this.totalKeys,
      correctKeys: this.correctKeys,
      errorKeys: this.errorKeys,
      accuracy: this.totalKeys ? (this.correctKeys / this.totalKeys) * 100 : 100,
      kpm: min > 0.04 ? this.okCount / min : 0,
      progress: this.target.length ? this.pos / this.target.length : 0,
      keyErrors: this.keyErrors,
      finished: this.finished,
    };
  }

  emit() {
    this.onUpdate(this.stats());
  }

  /* ---------- 击键处理 ---------- */

  /** 下一个要打的字符（没打完才返回） */
  nextChar() {
    return this.pos < this.target.length ? this.target[this.pos] : null;
  }

  /** 当前是否在行首（用于判断能不能 Tab 补缩进） */
  atLineStart() {
    return this.pos === 0 || this.target[this.pos - 1] === '\n';
  }

  bumpKeyError(ch) {
    if (!ch) return;
    const k = ch === '\n' ? 'Enter' : ch === ' ' ? 'Space' : ch;
    this.keyErrors[k] = (this.keyErrors[k] || 0) + 1;
  }

  /** 主入口。返回 true 表示这次按键被引擎消费了 */
  press(ch) {
    if (this.finished || this.paused) return false;
    if (this.pos >= this.target.length) return false;

    // Tab 补全行首缩进：小白不用数空格，按一下 Tab 整段缩进就位
    if (ch === '\t' && this.tabIndent && this.target[this.pos] === ' ') {
      return this.completeIndent();
    }

    if (!this.startedAt) {
      this.startedAt = Date.now();
      this.cfg.onStart && this.cfg.onStart();
    }

    const expected = this.target[this.pos];
    this.totalKeys++;

    if (ch === expected) {
      this.correctKeys++;
      this.okCount++;
      this.marks[this.pos] = 'ok';
      const at = this.pos;
      this.pos++;
      this.onFeedback({ ok: true, pos: at, expected, typed: ch, strictHold: false });
    } else {
      this.errorKeys++;
      this.bumpKeyError(expected);
      if (this.strict) {
        // 严格模式：停在原地，标红提示，必须按对才前进
        this.marks[this.pos] = 'bad';
        this.onFeedback({ ok: false, pos: this.pos, expected, typed: ch, strictHold: true });
      } else {
        // 宽松模式：允许打错继续走，错的格子标红
        this.marks[this.pos] = 'bad';
        const at = this.pos;
        this.pos++;
        this.onFeedback({ ok: false, pos: at, expected, typed: ch, strictHold: false });
      }
    }

    if (this.pos >= this.target.length) return this.finish('complete');
    this.emit();
    return true;
  }

  /** Tab 补全缩进 */
  completeIndent() {
    if (!this.startedAt) {
      this.startedAt = Date.now();
      this.cfg.onStart && this.cfg.onStart();
    }
    let run = 0;
    while (this.target[this.pos + run] === ' ') run++;
    if (run === 0) return false;

    for (let i = 0; i < run; i++) {
      this.marks[this.pos + i] = 'ok';
    }
    // 缩进被完整正确地打出来了，按「打对了」计
    this.okCount += run;
    this.correctKeys += run;
    this.totalKeys += run;
    const at = this.pos;
    this.pos += run;
    this.onFeedback({ ok: true, pos: at, expected: ' ', typed: '\t', indent: run });

    if (this.pos >= this.target.length) return this.finish('complete');
    this.emit();
    return true;
  }

  /** 退格：只回退位置，不额外计入击键（错误在打错那一刻已经记过了） */
  backspace() {
    if (this.finished || this.paused) return false;
    if (this.pos <= 0) return false;
    this.pos--;
    if (this.marks[this.pos] === 'ok') this.okCount--;
    this.marks[this.pos] = null;
    this.emit();
    return true;
  }

  /** 跳过当前字符（卡住时用） */
  skip() {
    if (this.finished) return;
    if (this.pos >= this.target.length) return;
    this.marks[this.pos] = 'bad';
    this.errorKeys++;
    this.totalKeys++;
    this.pos++;
    if (this.pos >= this.target.length) return this.finish('complete');
    this.emit();
  }

  finish(reason) {
    if (this.finished) return true;
    this.finished = true;
    this.finishReason = reason || 'manual';
    this.finishedAt = Date.now();
    const s = this.stats();
    this.onUpdate(s);
    this.onFinish(s, this.finishReason);
    return true;
  }

  /** 时间到（限时测试用） */
  timeUp() {
    if (this.finished) return;
    if (!this.startedAt) {
      // 一个字都没打，直接算结束，避免出现「无限等待」
      this.startedAt = Date.now();
    }
    this.finish('timeup');
  }
}

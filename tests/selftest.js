/* 自测脚本：在 Node 里跑一遍数据生成器和打字引擎 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// document 只用来在 app.js 末尾注册 DOMContentLoaded，给个空壳就能把 app.js 载进来测纯函数
const ctx = vm.createContext({ console, document: { addEventListener() {} } });
['js/data.js', 'js/keyboard.js', 'js/engine.js', 'js/boxing.js', 'js/app.js'].forEach((f) => {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
});

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; }
  else { fail++; console.log('  ✗ ' + name + (extra ? '  → ' + extra : '')); }
}

/* 注意：class / const 声明不会成为 sandbox 对象的属性，
   必须用 runInContext 把它们取回宿主环境。 */
const genKeyDrill = vm.runInContext('genKeyDrill', ctx);
const keyInfoForChar = vm.runInContext('keyInfoForChar', ctx);
const TypingSession = vm.runInContext('TypingSession', ctx);
const pyUnit = vm.runInContext('pyUnit', ctx);
const pinyinState = vm.runInContext('pinyinState', ctx);
const pickDecoys = vm.runInContext('pickDecoys', ctx);
const PY_ALL = vm.runInContext('PY_ALL', ctx);

/* ---------- 1. 所有关卡都能生成文本 ---------- */
console.log('\n[1] 关卡内容生成');
const allLevels = [];
vm.runInContext('FINGER_LESSONS', ctx).forEach((l) =>
  allLevels.push({ id: l.id, content: () => ({ target: genKeyDrill(l.keys, l.opts || {}) }) }));

const tracks = [
  vm.runInContext('ENGLISH_TRACK', ctx),
  vm.runInContext('PINYIN_TRACK', ctx),
  vm.runInContext('ARTICLE_TRACK', ctx),
  vm.runInContext('CODE_TRACK', ctx),
];
tracks.forEach((t) => t.tabs.forEach((tab) => {
  // 拼音关用 unit()（额外带回汉字对照表），其余关用 build()
  const push = (l) => allLevels.push({ id: l.id, content: () => (l.unit ? l.unit() : { target: l.build() }) });
  if (tab.levels) tab.levels.forEach(push);
  if (tab.groups) tab.groups.forEach((g) => g.levels.forEach(push));
}));

console.log(`  共 ${allLevels.length} 个关卡`);
allLevels.forEach((l) => {
  let u = null;
  try { u = l.content(); } catch (e) { ok(l.id, false, '生成内容抛异常: ' + e.message); return; }
  ok(`${l.id} 生成文本`, u && typeof u.target === 'string' && u.target.length >= 20, `长度=${u && u.target && u.target.length}`);
});

/* 全局不变量：所有练习目标里只能出现「键盘打得出来」的字符。
   一旦混进汉字 / 全角标点 / emoji，严格模式会永久卡在那一格。 */
const typoable = new Set(['\n', ' ', '\t']);
allLevels.forEach((l) => {
  let u = null;
  try { u = l.content(); } catch (e) { return; }
  if (!u || !u.target) return;
  const bad = [...new Set([...u.target].filter((c) => !typoable.has(c) && !keyInfoForChar(c)))];
  if (bad.length) {
    ok(`${l.id} 只含可输入字符`, false, JSON.stringify(bad.slice(0, 12)));
  }
});

/* 连续生成 30 次，确保随机生成器不会产出空串或抛错 */
allLevels.forEach((l) => {
  for (let i = 0; i < 30; i++) {
    try {
      const u = l.content();
      if (!u || !u.target || u.target.length < 20) {
        ok(`${l.id} 随机稳定性`, false, `第 ${i} 次长度 ${u && u.target && u.target.length}`);
        return;
      }
    } catch (e) { ok(`${l.id} 随机稳定性`, false, e.message); return; }
  }
});

/* ---------- 2. 字符 → 按键映射 ---------- */
console.log('\n[2] 字符到按键的映射');
const cases = [
  ['a', 'a', false, 'L5'], ['A', 'a', true, 'L5'],
  ['5', '5', false, 'L2'], ['%', '5', true, 'L2'],
  ['{', '[', true, 'R5'], ['}', ']', true, 'R5'],
  [';', ';', false, 'R5'], [':', ';', true, 'R5'],
  ['_', '-', true, 'R5'], ['+', '=', true, 'R5'],
  ['<', ',', true, 'R3'], ['>', '.', true, 'R4'], ['?', '/', true, 'R5'],
  ['"', "'", true, 'R5'], ['|', '\\', true, 'R5'],
  [' ', 'Space', false, 'TH'], ['\n', 'Enter', false, 'R5'], ['\t', 'Tab', false, 'L5'],
];
cases.forEach(([ch, id, shift, finger]) => {
  const got = keyInfoForChar(ch);
  ok(`'${ch === '\n' ? '\\n' : ch}' → ${id}`, got && got.id === id && got.shift === shift && got.finger === finger,
    got ? JSON.stringify({ id: got.id, shift: got.shift, finger: got.finger }) : 'null');
});
/* Shift 必须用另一只手按 */
ok('左手字母用右 Shift', keyInfoForChar('A').shiftId === 'ShiftRight');
ok('右手字母用左 Shift', keyInfoForChar('P').shiftId === 'ShiftLeft');
ok('左手符号用右 Shift', keyInfoForChar('#').shiftId === 'ShiftRight');

/* ---------- 3. 引擎：全对打完整段 ---------- */
console.log('\n[3] 引擎 —— 全部打对');
function newSession(target, opts = {}) {
  let fin = null;
  const s = new TypingSession(Object.assign({
    target, mode: 'test', title: 't',
    onFinish: (st, r) => { fin = { st, r }; },
  }, opts));
  s.__fin = () => fin;
  return s;
}

{
  const target = 'hello world\nsecond line';
  const s = newSession(target);
  for (const ch of target) s.press(ch);
  ok('完整打完触发 finish', s.finished === true);
  ok('进度 = 100%', Math.abs(s.stats().progress - 1) < 1e-9, s.stats().progress);
  ok('正确率 = 100%', s.stats().accuracy === 100, s.stats().accuracy);
  ok('错误数 = 0', s.stats().errorKeys === 0);
  ok('净字符数 = 目标长度', s.stats().netChars === target.length, `${s.stats().netChars} vs ${target.length}`);
  ok('finish 原因 = complete', s.finishReason === 'complete', s.finishReason);
  ok('多打一个键不报错', (s.press('x'), s.pos === target.length));
}

/* ---------- 4. 引擎：严格模式 ---------- */
console.log('\n[4] 引擎 —— 严格模式');
{
  const s = newSession('abc', { strict: true });
  s.press('a');
  ok('打对后前进', s.pos === 1, s.pos);
  s.press('x');                       // 错
  ok('打错后不前进', s.pos === 1, s.pos);
  ok('错误被记录', s.errorKeys === 1);
  ok('期望键记入薄弱键', s.keyErrors['b'] === 1, JSON.stringify(s.keyErrors));
  s.press('b');
  ok('改正后前进', s.pos === 2);
  s.press('c');
  ok('打完结束', s.finished === true);
  ok('正确率 = 3/4', Math.abs(s.stats().accuracy - 75) < 1e-9, s.stats().accuracy);
}

/* ---------- 5. 引擎：宽松模式 ---------- */
console.log('\n[5] 引擎 —— 宽松模式');
{
  const s = newSession('abc', { strict: false });
  s.press('a');
  s.press('x');                       // 错，但继续往前走
  ok('打错仍然前进', s.pos === 2, s.pos);
  ok('错的位置被标记', s.marks[1] === 'bad', s.marks[1]);
  s.press('c');
  ok('打完结束', s.finished === true);
  ok('净字符数只算对的', s.stats().netChars === 2, s.stats().netChars);
  ok('正确率 = 2/3', Math.abs(s.stats().accuracy - (2 / 3) * 100) < 1e-9, s.stats().accuracy);
}

/* ---------- 6. 引擎：Tab 补全缩进 ---------- */
console.log('\n[6] 引擎 —— Tab 补全缩进');
{
  const target = 'if x:\n    print(x)';
  const s = newSession(target, { tabIndent: true });
  'if x:\n'.split('').forEach((c) => s.press(c));
  ok('到达行首缩进处', s.pos === 6, s.pos);
  s.press('\t');
  ok('Tab 一次吃下 4 个空格', s.pos === 10, s.pos);
  ok('缩进被标记为正确', s.marks[6] === 'ok' && s.marks[9] === 'ok');
  ok('正确率不受影响', s.stats().accuracy === 100, s.stats().accuracy);
  'print(x)'.split('').forEach((c) => s.press(c));
  ok('打完结束', s.finished === true);
}
{
  const s = newSession('ab', { tabIndent: false });
  s.press('a');
  s.press('\t');
  ok('关掉 Tab 补全后 Tab 算打错', s.pos === 1 && s.errorKeys === 1, `${s.pos}/${s.errorKeys}`);
}

/* ---------- 7. 引擎：退格与暂停 ---------- */
console.log('\n[7] 引擎 —— 退格与暂停');
{
  const s = newSession('abc');
  s.press('a'); s.press('b');
  s.backspace();
  ok('退格回退一格', s.pos === 1, s.pos);
  ok('退格清掉标记', s.marks[1] === null);
  ok('退格计入净字符数变化', s.stats().netChars === 1, s.stats().netChars);
  ok('退格不计入击键数', s.totalKeys === 2, s.totalKeys);
  s.press('b'); s.press('c');
  ok('补打后完成', s.finished === true && s.stats().accuracy === 100, s.stats().accuracy);
}
{
  const s = newSession('abc');
  s.press('a');
  s.pause();
  ok('暂停后按键无效', (s.press('b'), s.pos === 1));
  s.resume();
  s.press('b');
  ok('恢复后可以继续', s.pos === 2, s.pos);
}

/* ---------- 8. 速度测试文本长度 ---------- */
console.log('\n[8] 速度测试文本');
const TEST_TEXTS = vm.runInContext('TEST_TEXTS', ctx);
Object.keys(TEST_TEXTS).forEach((k) => {
  const t = TEST_TEXTS[k]();
  ok(`${k} 长度足够 5 分钟`, t.length > 800, `长度=${t.length}`);
});

/* ---------- 9. 缩进类文本必须以空格缩进开头 ---------- */
console.log('\n[9] 代码缩进检查');
[...vm.runInContext('PY_PROGRAMS', ctx), ...vm.runInContext('CPP_PROGRAMS', ctx)].forEach((p, i) => {
  ok(`程序 ${i + 1} 用 4 空格缩进`, !/\t/.test(p), '发现 Tab 字符');
});

/* ---------- 10. 拼音中文打字 ---------- */
console.log('\n[10] 拼音中文打字');

/* 10.1 数据质量 */
ok('拼音词表规模够大', PY_ALL.length >= 150, PY_ALL.length + ' 条');
ok('每条都有汉字和拼音', PY_ALL.every((i) => i.w && i.p), JSON.stringify(PY_ALL.filter((i) => !i.w || !i.p).slice(0, 3)));
ok('拼音全是小写字母', PY_ALL.every((i) => /^[a-z]+$/.test(i.p)),
  JSON.stringify(PY_ALL.filter((i) => !/^[a-z]+$/.test(i.p)).slice(0, 3)));
ok('没有重复的汉字条目', new Set(PY_ALL.map((i) => i.w)).size === PY_ALL.length,
  `重复 ${PY_ALL.length - new Set(PY_ALL.map((i) => i.w)).size} 条`);

/* 词库分组：大学生日常那几组必须真的接进了关卡，不能只定义不引用 */
const PINYIN_TRACK = vm.runInContext('PINYIN_TRACK', ctx);
const pyTabs = PINYIN_TRACK.tabs;
ok('拼音有 4 个标签页', pyTabs.length === 4, pyTabs.map((t) => t.name).join(' / '));
const campusTab = pyTabs.find((t) => t.id === 'campus');
ok('存在「校园生活」标签页', !!campusTab);
ok('校园生活有 7 关', campusTab && campusTab.levels.length === 7,
  campusTab && campusTab.levels.length);
const phraseTab = pyTabs.find((t) => t.id === 'phrase');
ok('短语页含校园口语关', phraseTab && phraseTab.levels.some((l) => l.id === 'py-p3')
  && phraseTab.levels.some((l) => l.id === 'py-p4'));
ok('校园词库规模够用', [].concat(
  vm.runInContext('PY_CAMPUS', ctx), vm.runInContext('PY_CLASS', ctx),
  vm.runInContext('PY_DORM', ctx), vm.runInContext('PY_EXAM', ctx),
  vm.runInContext('PY_FUN', ctx), vm.runInContext('PY_CAREER', ctx),
).length >= 100,
  [].concat(
    vm.runInContext('PY_CAMPUS', ctx), vm.runInContext('PY_CLASS', ctx),
    vm.runInContext('PY_DORM', ctx), vm.runInContext('PY_EXAM', ctx),
    vm.runInContext('PY_FUN', ctx), vm.runInContext('PY_CAREER', ctx),
  ).length + ' 条');

/* 每个汉字 = 一个音节 = 一段连续的元音，所以「元音段数」应该等于汉字数。
   唯一的例外：前一个音节以元音结尾、后一个音节以元音开头时，拼音书写会把它们连起来
   （我爱 = wo + ai → 写成 woaini，不是 wo'aini）。真实输入法也是这么切的。
   所以这里允许「元音段数比汉字数少 1」—— 仍能抓出少写/多写整段音节这类错误。
   高频词的逐字精确校对由下面的抽查表负责。 */
const sylIssues = PY_ALL.filter((i) => {
  const runs = (i.p.match(/[aeiouv]+/g) || []).length;
  return runs > i.w.length || i.w.length - runs > 1;
});
ok('拼音音节数 = 汉字个数（允许 1 处元音连写）', sylIssues.length === 0,
  JSON.stringify(sylIssues.slice(0, 5).map((i) => `${i.w}=${i.p}`)));

/* 高频词的拼音逐个抽查（防止手写数据时打错字） */
const PINYIN_SPOT = {
  中国: 'zhongguo', 你好: 'nihao', 谢谢: 'xiexie', 电脑: 'diannao', 键盘: 'jianpan',
  学习: 'xuexi', 老师: 'laoshi', 早上好: 'zaoshanghao', 对不起: 'duibuqi',
  我是中国人: 'woshizhongguoren', 上网: 'shangwang', 登录: 'denglu', 数据: 'shuju',
  屏幕: 'pingmu', 走路: 'zoulu',
  /* 大学生日常：这些是最容易手滑写错的，逐个锁死 */
  宿舍: 'sushe', 食堂: 'shitang', 图书馆: 'tushuguan', 教学楼: 'jiaoxuelou',
  交作业: 'jiaozuoye', 早八: 'zaoba', 翘课: 'qiaoke', 水课: 'shuike',
  绩点: 'jidian', 挂科: 'guake', 补考: 'bukao', 保研: 'baoyan', 答辩: 'dabian',
  熄灯: 'xideng', 熬夜: 'aoye', 奶茶: 'naicha', 内卷: 'neijuan', 躺平: 'tangping',
  表情包: 'biaoqingbao', 朋友圈: 'pengyouquan', 三方协议: 'sanfangxieyi',
  简历: 'jianli', 面试: 'mianshi', 招聘会: 'zhaopinhui',
  帮我带个饭: 'bangwodaigefan', 明天要交作业: 'mingtianyaojiaozuoye',
  老师点名了吗: 'laoshidianminglema', 我挂科了: 'woguakele', 期末考完了: 'qimokaowanle',
};
const byWord = {};
PY_ALL.forEach((i) => { byWord[i.w] = i.p; });
Object.keys(PINYIN_SPOT).forEach((w) => {
  if (byWord[w] === undefined) return;   // 词表里没有就跳过，不算失败
  ok(`「${w}」拼音正确`, byWord[w] === PINYIN_SPOT[w], `${byWord[w]} ≠ ${PINYIN_SPOT[w]}`);
});

/* 10.2 pyUnit 结构 */
const u10 = pyUnit(PY_ALL, 10);
ok('pyUnit 返回 10 个词', u10.items.length === 10, u10.items.length);
ok('target = 各词拼音 + 空格',
  u10.target === u10.items.map((i) => i.p + ' ').join(''), JSON.stringify(u10.target.slice(0, 30)));
ok('target 只含小写字母和空格', /^[a-z ]+$/.test(u10.target));
ok('pyUnit 不会超出词表长度', pyUnit(PY_ALL, 9999).items.length === PY_ALL.length);

/* 10.3 光标定位（这里最容易出 off-by-one，逐位验一遍） */
const two = [{ w: '你好', p: 'nihao' }, { w: '谢谢', p: 'xiexie' }];
//  位置:  0 1 2 3 4 5 | 6  7 8 9  10 11 12
//  内容:  n i h a o ␣ | x  i e x  i  e  ␣
//  「你好」占 0~5（5 是它后面的空格），「谢谢」占 6~12
[[0, '你好', 0], [3, '你好', 3], [5, '你好', 5], [6, '谢谢', 0], [12, '谢谢', 6], [99, '谢谢', 6]]
  .forEach(([pos, word, typed]) => {
    const st = pinyinState(two, pos);
    ok(`pos=${pos} → 「${word}」已打 ${typed} 个字母`,
      st && st.item.w === word && st.typed === typed,
      st ? `「${st.item.w}」${st.typed}` : 'null');
  });

/* 10.4 候选词：目标词永远第一，干扰项不会重复目标词 */
const items10 = u10.items;
ok('候选词不与目标词重复',
  items10.every((it) => !pickDecoys(items10, it, it.p).some((x) => x.w === it.w)));
ok('候选词数量为 2', items10.every((it) => pickDecoys(items10, it, it.p.slice(0, 1)).length === 2));

/* 10.5 整段拼音能被打字引擎打完 */
{
  const u = pyUnit(PY_ALL, 12);
  const s = newSession(u.target);
  for (const ch of u.target) s.press(ch);
  ok('拼音整段能打完', s.finished === true);
  ok('拼音整段全对', s.stats().accuracy === 100, s.stats().accuracy);
  ok('拼音净字符数 = target 长度', s.stats().netChars === u.target.length);
}

/* ---------- 11. 拳击小游戏 ---------- */
console.log('\n[11] 拳击小游戏');

/* 11.1 关卡配置 */
const BOX_LEVELS = vm.runInContext('BOX_LEVELS', ctx);
const ids = Object.keys(BOX_LEVELS);
ok('有 3 个难度', ids.length === 3, ids.join('/'));
ok('每个难度都有按键池、双方血量和时长',
  ids.every((k) => BOX_LEVELS[k].keys.length && BOX_LEVELS[k].foeHp > 0
    && BOX_LEVELS[k].youHp > 0 && BOX_LEVELS[k].duration > 0));
ok('难度递进：键位池越来越大',
  BOX_LEVELS.easy.keys.length < BOX_LEVELS.normal.keys.length
  && BOX_LEVELS.normal.keys.length < BOX_LEVELS.hard.keys.length,
  ids.map((k) => BOX_LEVELS[k].keys.length).join(' < '));

/* 这条最关键：任何一个键都必须在键盘映射表里存在，
   否则游戏里高亮不出键、也提示不了手指。 */
const unmapped = [];
ids.forEach((lv) => BOX_LEVELS[lv].keys.forEach((k) => {
  const info = keyInfoForChar(k);
  if (!info) unmapped.push(`${lv}:${k}`);
}));
ok('所有出拳键都存在于键盘映射表', unmapped.length === 0, unmapped.join(' '));

/* 拳击游戏要求「不用 Shift」—— 它练的是手指落点，不该混进 Shift 的干扰 */
const shifted = [];
ids.forEach((lv) => BOX_LEVELS[lv].keys.forEach((k) => {
  const info = keyInfoForChar(k);
  if (info && info.shift) shifted.push(`${lv}:${k}`);
}));
ok('出拳键都不需要按 Shift', shifted.length === 0, shifted.join(' '));

/* 11.2 伤害公式 */
const boxDamage = vm.runInContext('boxDamage', ctx);
const boxPunchName = vm.runInContext('boxPunchName', ctx);
const boxDecide = vm.runInContext('boxDecide', ctx);

[[0, 1], [1, 1], [4, 1], [5, 2], [9, 2], [10, 3], [14, 3], [15, 4], [19, 4],
 [20, 5], [24, 5], [25, 5], [100, 5], [9999, 5]]
  .forEach(([combo, mult]) => {
    const got = boxDamage(combo);
    ok(`连击 ${combo} → 倍率 ×${mult}`, got.mult === mult, '×' + got.mult);
  });
ok('伤害 = 基础伤害 × 倍率', boxDamage(7).dmg === 10 * boxDamage(7).mult, boxDamage(7).dmg);
ok('伤害随连击单调不减',
  Array.from({ length: 60 }, (_, i) => boxDamage(i + 1).dmg)
    .every((d, i, a) => i === 0 || d >= a[i - 1]));

/* 11.3 拳名 */
[[0, ''], [1, '刺拳'], [2, '刺拳'], [3, '直拳'], [4, '直拳'], [5, '勾拳'],
 [7, '勾拳'], [8, '摆拳'], [11, '摆拳'], [12, '上勾拳'], [19, '上勾拳'],
 [20, '毁灭重拳'], [60, '毁灭重拳']]
  .forEach(([combo, name]) => ok(`连击 ${combo} → ${name || '(无)'}`, boxPunchName(combo) === name, boxPunchName(combo)));

/* 11.4 点数判定 */
ok('满血对残血 → 赢', boxDecide(100, 100, 10, 600) === true);
ok('残血对满血 → 输', boxDecide(10, 100, 600, 600) === false);
ok('血量比例相同 → 不算赢', boxDecide(50, 100, 300, 600) === false);

/* 11.5 数值平衡：新手的出拳量足够 KO 对手（这是玩法能不能成立的关键） */
function totalDamage(n) {
  let sum = 0;
  for (let i = 1; i <= n; i++) sum += boxDamage(i).dmg;
  return sum;
}
ids.forEach((lv) => {
  const need = Math.ceil(BOX_LEVELS[lv].foeHp);
  let n = 1;
  while (n < 200 && totalDamage(n) < need) n++;
  ok(`${BOX_LEVELS[lv].name}难度：${n} 拳可 KO`,
    n <= 40, `要打 ${n} 拳（60 秒内偏多）`);
});
ok('打空连击后回到基础伤害', boxDamage(0).dmg === 10);

/* 11.6 容错度：新手要挨多少下才会被 KO */
const BOX_MISS_DAMAGE = vm.runInContext('BOX_MISS_DAMAGE', ctx);
ids.forEach((lv) => {
  const strikes = Math.ceil(BOX_LEVELS[lv].youHp / BOX_MISS_DAMAGE);
  ok(`${BOX_LEVELS[lv].name}难度能挨 ${strikes} 次反击`, strikes >= 10, strikes);
});

/* ---------- 12. 自定义练习：文本规整 ---------- */
console.log('\n[12] 自定义练习');
const norm = vm.runInContext('normalizeCustomText', ctx);

ok('CRLF 统一成 LF', norm('a\r\nb\rc', true) === 'a\nb\nc', JSON.stringify(norm('a\r\nb\rc', true)));
ok('Tab 可转成 4 个空格', norm('if (x) {\n\treturn 1;\n}', true) === 'if (x) {\n    return 1;\n}',
  JSON.stringify(norm('if (x) {\n\treturn 1;\n}', true)));
ok('关掉选项就保留 Tab', norm('a\tb', false) === 'a\tb', JSON.stringify(norm('a\tb', false)));
ok('去掉每行行尾多余空格', norm('hello   \nworld  ', true) === 'hello\nworld',
  JSON.stringify(norm('hello   \nworld  ', true)));
ok('去掉开头空行', norm('\n\n你好', true) === '你好', JSON.stringify(norm('\n\n你好', true)));
ok('去掉结尾空行', norm('你好\n\n\n', true) === '你好', JSON.stringify(norm('你好\n\n\n', true)));
ok('保留中间的空行', norm('第一段\n\n第二段', true) === '第一段\n\n第二段',
  JSON.stringify(norm('第一段\n\n第二段', true)));
ok('空输入返回空串', norm('', true) === '' && norm(null, true) === '' && norm(undefined, true) === '');
ok('纯空白输入被清成空串', norm(' \n\t\n ', true) === '', JSON.stringify(norm(' \n\t\n ', true)));
ok('只有空格和换行的行会被压成空行',
  norm('a\n   \nb', true) === 'a\n\nb', JSON.stringify(norm('a\n   \nb', true)));
ok('中文和代码混排不被破坏',
  norm('// 注释\nint main() {\n    return 0;\n}', true) === '// 注释\nint main() {\n    return 0;\n}');

/* 从网页 / Word 复制常带进来的隐形字符 */
ok('去掉 BOM', norm('\uFEFFhello', true) === 'hello', JSON.stringify(norm('\uFEFFhello', true)));
ok('去掉零宽空格/零宽连接符', norm('a\u200Bb\u200Dc', true) === 'abc',
  JSON.stringify(norm('a\u200Bb\u200Dc', true)));

/* 打不出来的字符必须在开始前被拦住，否则严格模式会卡死 */
const unmappable = vm.runInContext('unmappableChars', ctx);
ok('纯英文+代码没有打不出的字符', unmappable('int main() {\n    return 0;\n}').size === 0);
ok('中文汉字会被识别', unmappable('你好').size === 2, unmappable('你好').size);
ok('全角标点会被识别', unmappable('hello，world。').size === 2, unmappable('hello，world。').size);
ok('空格换行不算问题字符', unmappable('a b\nc').size === 0);
ok('emoji 会被识别', unmappable('ok 😀').size === 1, unmappable('ok 😀').size);
ok('统计次数正确', (unmappable('中中中') || new Map()).get('中') === 3);

/* ---------- 13. Verilog、C++ 完整项目、文章练习 ---------- */
console.log('\n[13] Verilog / 完整项目 / 文章练习');

/* 13.1 Verilog */
const CODE_TRACK_ = vm.runInContext('CODE_TRACK', ctx);
const vlgTab = CODE_TRACK_.tabs.find((t) => t.id === 'verilog');
ok('编程打字有 Verilog 标签页', !!vlgTab);
ok('Verilog 有 7 关', vlgTab && vlgTab.groups[0].levels.length === 7,
  vlgTab && vlgTab.groups[0].levels.length);

/* 关键：Verilog 代码里的每一个字符都必须能用键盘打出来，
   否则练习会卡在那一格（和自定义练习是同一类问题） */
vlgTab.groups[0].levels.forEach((lv) => {
  const txt = lv.build();
  const bad = [...new Set([...txt].filter((c) => c !== '\n' && c !== ' ' && c !== '\t' && !keyInfoForChar(c)))];
  ok(`Verilog「${lv.title}」只含可输入字符`, bad.length === 0, JSON.stringify(bad));
});
const vlgAll = vlgTab.groups[0].levels.map((l) => l.build()).join('\n');
ok('Verilog 覆盖了 module/endmodule', /module/.test(vlgAll) && /endmodule/.test(vlgAll));
ok('Verilog 覆盖了 always 与 posedge', /always/.test(vlgAll) && /posedge/.test(vlgAll));
ok('Verilog 覆盖了非阻塞赋值 <=', vlgAll.includes('<='));
ok('Verilog 覆盖了 testbench 的 initial/#', /initial/.test(vlgAll) && /#\d/.test(vlgAll));

/* 13.2 C++ 完整项目 */
const CPP_PROJECT_ = vm.runInContext('CPP_PROJECT', ctx);
ok('C++ 项目有 main 函数', /int main\s*\(/.test(CPP_PROJECT_));
ok('C++ 项目有类定义', /class ScoreBook/.test(CPP_PROJECT_));
ok('C++ 项目有结构体', /struct Student/.test(CPP_PROJECT_));
ok('C++ 项目行数够（≥40 行）', CPP_PROJECT_.split('\n').length >= 40, CPP_PROJECT_.split('\n').length);
const badProj = [...new Set([...CPP_PROJECT_].filter((c) => c !== '\n' && c !== ' ' && !keyInfoForChar(c)))];
ok('C++ 项目只含可输入字符', badProj.length === 0, JSON.stringify(badProj));
const cppTab = CODE_TRACK_.tabs.find((t) => t.id === 'cpp');
ok('C++ 里有「完整项目」这一关',
  cppTab.groups.some((g) => g.levels.some((l) => l.id === 'cp9')));

/* 13.3 文章练习 */
const ART = vm.runInContext('ARTICLE_TRACK', ctx);
ok('文章练习有 2 个标签页', ART.tabs.length === 2, ART.tabs.map((t) => t.name).join(' / '));

const enTab = ART.tabs.find((t) => t.id === 'en-paper');
ok('英文论文有 6 关', enTab && enTab.levels.length === 6, enTab && enTab.levels.length);
enTab.levels.forEach((lv) => {
  const t = lv.build();
  ok(`英文文章「${lv.title}」长度够（≥400 字符）`, t.length >= 400, t.length);
  const bad = [...new Set([...t].filter((c) => c !== '\n' && c !== ' ' && !keyInfoForChar(c)))];
  ok(`英文文章「${lv.title}」只含可输入字符`, bad.length === 0, JSON.stringify(bad));
});
ok('英文摘要是《Attention Is All You Need》的原文（首句）',
  /The dominant sequence transduction models/.test(enTab.levels[0].build()));

const zhTab = ART.tabs.find((t) => t.id === 'zh-ic');
ok('中文集成电路有 3 关', zhTab && zhTab.levels.length === 3, zhTab && zhTab.levels.length);

const zhAll = [].concat(
  vm.runInContext('ZH_IC_MAKE', ctx),
  vm.runInContext('ZH_IC_CIM', ctx),
  vm.runInContext('ZH_IC_FLOW', ctx),
);
ok('中文文章词数够（≥180 词）', zhAll.length >= 180, zhAll.length);
ok('中文文章拼音全是小写字母', zhAll.every((i) => /^[a-z]+$/.test(i.p)),
  JSON.stringify(zhAll.filter((i) => !/^[a-z]+$/.test(i.p)).slice(0, 3)));
const zhSyl = zhAll.filter((i) => {
  const runs = (i.p.match(/[aeiouv]+/g) || []).length;
  return runs > i.w.length || i.w.length - runs > 1;
});
ok('中文文章拼音音节数正确', zhSyl.length === 0,
  JSON.stringify(zhSyl.slice(0, 5).map((i) => `${i.w}=${i.p}`)));

/* 文章必须按原文顺序出题，不能像词汇池那样随机挑 */
const seqUnit = zhTab.levels[0].unit();
ok('中文文章按原文顺序出题',
  seqUnit.items[0].w === '一块' && seqUnit.target.startsWith('yikuai '),
  seqUnit.items[0].w + ' / ' + seqUnit.target.slice(0, 14));
ok('中文文章 target 只含小写字母和空格', /^[a-z ]+$/.test(seqUnit.target));

/* 整篇文章能被引擎顺次打完 */
{
  const u = zhTab.levels[0].unit();
  const s = newSession(u.target);
  for (const ch of u.target) s.press(ch);
  ok('中文文章能整篇打完', s.finished === true && s.stats().accuracy === 100, s.stats().accuracy);
}

console.log(`\n===== 通过 ${pass} 项，失败 ${fail} 项 =====`);
process.exit(fail ? 1 : 0);

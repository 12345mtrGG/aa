/* ============================================================
   data.js —— 所有练习内容
   说明：练习文本大多是「按规则随机生成」的，所以每次点进去
        内容都不一样，可以反复练不会背下来。
   ============================================================ */

/* ---------------- 随机工具 ---------------- */
const R = {
  int: (n) => Math.floor(Math.random() * n),
  pick: (a) => a[Math.floor(Math.random() * a.length)],
  pickN(a, n) {
    const c = a.slice(), out = [];
    while (out.length < n && c.length) out.push(c.splice(R.int(c.length), 1)[0]);
    return out;
  },
  shuffle(a) {
    const c = a.slice();
    for (let i = c.length - 1; i > 0; i--) {
      const j = R.int(i + 1);
      [c[i], c[j]] = [c[j], c[i]];
    }
    return c;
  },
};

const HOME_ROW = 'asdfjkl;';

/* ---------------- 通用文本生成器 ---------------- */

/** 从一组键里生成「手指操」式的练习文本 */
function genKeyDrill(keys, opts = {}) {
  const rows = opts.rows || 5;           // 行数
  const groupsPerRow = opts.groupsPerRow || 6;
  const groupLen = opts.groupLen || 4;
  const home = keys.filter((k) => HOME_ROW.includes(k));
  const out = [];

  for (let r = 0; r < rows; r++) {
    const gs = [];
    for (let g = 0; g < groupsPerRow; g++) {
      const mode = (r + g) % 4;

      if (mode === 0) {
        // 单键重复：建立单指记忆
        gs.push(R.pick(keys).repeat(groupLen));
      } else if (mode === 1) {
        // 双键交替：练两指配合（正是真实打字时的节奏）
        const a = R.pick(keys), b = R.pick(keys);
        let s = '';
        for (let i = 0; i < groupLen; i++) s += i % 2 ? b : a;
        gs.push(s);
      } else if (mode === 2) {
        // 随机组合
        let s = '';
        for (let i = 0; i < groupLen; i++) s += R.pick(keys);
        gs.push(s);
      } else {
        // 基准键锚定：打完离位键后回到 home row，这是盲打的关键
        const pool = home.length ? home : keys;
        let s = '';
        for (let i = 0; i < groupLen; i++) s += i % 2 === 0 ? R.pick(pool) : R.pick(keys);
        gs.push(s);
      }
    }
    out.push(gs.join(' '));
  }
  return out.join('   ');
}

/** 从候选片段里随机拼一段（用于符号练习） */
function mixDrill(patterns, count = 34) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(R.pick(patterns));
  return out.join(' ');
}

/** 随机挑 n 行自洽的代码行，用回车连起来 */
function pickLines(lines, n = 11) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(R.pick(lines));
  return out.join('\n');
}

/** 随机挑 n 个多行代码块 */
function pickBlocks(blocks, n = 3) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(R.pick(blocks));
  return out.join('\n\n');
}

/** 从词表里拼一串词，控制总长度 */
function wordStream(words, targetLen = 260, sep = ' ') {
  const out = [];
  let len = 0;
  while (len < targetLen) {
    const w = R.pick(words);
    out.push(w);
    len += w.length + sep.length;
  }
  return out.join(sep);
}

/** 从句子表里拼一段 */
function sentenceStream(sentences, n = 5) {
  return R.pickN(sentences, n).join(' ');
}

/* ============================================================
   一、指法基础课
   ============================================================ */

const FINGER_LESSONS = [
  { id: 'f01', group: '第 1 步 · 找到家', title: '认识 F 和 J', desc: '左右食指放在有凸起的两颗键上', keys: ['f', 'j'], opts: { rows: 5, groupLen: 4 } },
  { id: 'f02', group: '第 1 步 · 找到家', title: '左手基准键 A S D F', desc: '小指、无名指、中指、食指依次排开', keys: ['a', 's', 'd', 'f'] },
  { id: 'f03', group: '第 1 步 · 找到家', title: '右手基准键 J K L ;', desc: '食指、中指、无名指、小指依次排开', keys: ['j', 'k', 'l', ';'] },
  { id: 'f04', group: '第 1 步 · 找到家', title: '双手基准键合练', desc: '八个手指各就各位，这是所有打字的地基', keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';'] },

  { id: 'f05', group: '第 2 步 · 手指上移', title: '中指上移 E 和 I', desc: '中指从 D / K 往上够一格', keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'e', 'i'] },
  { id: 'f06', group: '第 2 步 · 手指上移', title: '无名指上移 W 和 O', desc: '无名指从 S / L 往上够一格', keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'e', 'i', 'w', 'o'] },
  { id: 'f07', group: '第 2 步 · 手指上移', title: '食指上移 R T / U Y', desc: '食指要负责两列，是十指里最忙的', keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'e', 'i', 'w', 'o', 'r', 't', 'u', 'y'] },
  { id: 'f08', group: '第 2 步 · 手指上移', title: '小指上移 Q 和 P', desc: '小指最短最没劲，要单独多练', keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'q', 'p', 'e', 'i', 'w', 'o'] },
  { id: 'f09', group: '第 2 步 · 手指上移', title: '上排全键 QWERTY UIOP', desc: '整排连贯练习', keys: 'qwertyuiop'.split('').concat(['a', 's', 'd', 'f', 'j', 'k', 'l', ';']) },

  { id: 'f10', group: '第 3 步 · 手指下移', title: '食指下移 V B / N M', desc: '食指往下也有两列', keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'v', 'b', 'n', 'm'] },
  { id: 'f11', group: '第 3 步 · 手指下移', title: '中指 C、无名指 ,', desc: '中指和无名指往下各一格', keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'v', 'b', 'n', 'm', 'c', ','] },
  { id: 'f12', group: '第 3 步 · 手指下移', title: '小指 Z、无名指 . 和小指 /', desc: '下排最边上的三个键', keys: ['a', 's', 'd', 'f', 'j', 'k', 'l', ';', 'z', '.', '/', 'c', ',', 'v', 'b', 'n', 'm'] },
  { id: 'f13', group: '第 3 步 · 手指下移', title: '下排全键 ZXCV BNM,./', desc: '整排连贯练习', keys: 'zxcvbnm,./'.split('').concat(['a', 's', 'd', 'f', 'j', 'k', 'l', ';']) },

  { id: 'f14', group: '第 4 步 · 补齐与提速', title: '内指 G 和 H', desc: '食指往里够一格，很多人总按错这两个键', keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'] },
  { id: 'f15', group: '第 4 步 · 补齐与提速', title: '26 个字母综合', desc: '所有字母随机出现，检验真实水平', keys: 'abcdefghijklmnopqrstuvwxyz'.split('') },
  { id: 'f16', group: '第 4 步 · 补齐与提速', title: '数字键 1 ~ 0', desc: '手指从基准键往上斜着够第一排', keys: '1234567890'.split(''), opts: { rows: 5, groupLen: 4 } },
  { id: 'f17', group: '第 4 步 · 补齐与提速', title: '大写字母与 Shift', desc: '左手按字母就用右手 Shift，反之亦然', keys: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') },
  { id: 'f18', group: '第 4 步 · 补齐与提速', title: '常用标点符号', desc: '逗号、句号、引号、冒号……写代码全靠它们', keys: [',', '.', ';', "'", '-', '=', '/', ':', '?', '!', '"', '(', ')'] },
];

/* ============================================================
   二、英文练习素材
   ============================================================ */

const EN_LETTERS = {
  '小写字母': 'abcdefghijklmnopqrstuvwxyz'.split(''),
  '左手字母': 'qwertasdfgzxcvb'.split(''),
  '右手字母': 'yuiophjklmn'.split(''),
};

const EN_WORDS = `the be to of and a in that have I it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us man find here thing many life still line right move own under while great might sound below saw left late run don't few stop while along might close something seem next hard open example begin life always those both paper together got group often run important until children side feet car mile night walk white sea began grow took river four carry state once book hear stop without second later miss idea enough eat face watch far real almost let above girl sometimes mountains cut young talk soon list song being leave family`.split(/\s+/).filter(Boolean);

const EN_SENTENCES = [
  'The quick brown fox jumps over the lazy dog.',
  'Pack my box with five dozen liquor jugs.',
  'How vexingly quick daft zebras jump!',
  'The five boxing wizards jump quickly.',
  'A good typist keeps their eyes on the screen.',
  'Practice every day, even if only for ten minutes.',
  'Accuracy comes first; speed will follow naturally.',
  'Keep your wrists relaxed and your fingers curved.',
  'The best way to learn is to make it a habit.',
  'Do not look down at the keyboard while typing.',
  'A journey of a thousand miles begins with a single step.',
  'Little by little, one travels far.',
  'Simplicity is the soul of efficiency.',
  'Programs must be written for people to read.',
  'Talk is cheap. Show me the code.',
  'Premature optimization is the root of all evil.',
  'Make it work, make it right, make it fast.',
  'Any fool can write code that a computer understands.',
  'Good code is its own best documentation.',
  'First, solve the problem. Then, write the code.',
  'The only way to go fast is to go well.',
  'Testing leads to failure, and failure leads to understanding.',
  'Deleted code is debugged code.',
  'Weeks of coding can save you hours of planning.',
];

const EN_PARAGRAPHS = [
  `Typing is a physical skill. Your fingers learn patterns, not letters, so the only way to improve is to repeat the same movements until they become automatic. At the beginning you will feel slow and clumsy. That is completely normal. Every professional typist started at the same place you are now.`,
  `The single most important habit is to stop looking at your hands. It feels faster in the short term to glance down, but it costs you far more later. If you must look somewhere, look at the screen. Trust your fingers to find the key, and let your mistakes teach you.`,
  `Speed is a side effect of accuracy, never the other way around. A person who types one hundred words a minute with many mistakes spends more time fixing errors than a person who types sixty words a minute without any. Slow down until you stop making mistakes, then let the speed come on its own.`,
  `A computer program is a sequence of instructions. Each instruction tells the machine to do one small thing, and by combining thousands of them we build something useful. The keyboard is how we write those instructions. The faster and more accurately you type, the more time you spend thinking instead of hunting for keys.`,
  `Sit up straight with both feet flat on the floor. Your elbows should rest near your sides at roughly a right angle. Curl your fingers slightly as if holding a small ball, and rest them lightly on the home row. Keep your shoulders down and your wrists off the desk edge.`,
  `Rest your left fingers on A, S, D and F, and your right fingers on J, K, L and the semicolon. Feel the small raised bumps on the F and J keys with your index fingers. Those bumps exist for exactly one reason: to let you find the home position without looking.`,
];

/* ============================================================
   三、编程打字素材
   ============================================================ */

/* ---- 3.1 符号练习片段 ---- */
const SYM = {
  paren: ['()', '(a)', '(x)', '(a, b)', '(1 + 2)', '(x, y)', '()', '(i)', '()'],
  bracket: ['[]', '[i]', '[0]', '[n]', '[i][j]', '[]', '[k]', '[n - 1]', '[]'],
  brace: ['{}', '{a}', '{  }', '{1}', '{}', '{ x }', '{}', '{ k: v }'],
  quote: ["''", '""', "'a'", '"ab"', "'x';", 'a;', ';', "'s'", 'a, b;', 'x = 1;'],
  arith: ['a + b', 'x - y', 'i * n', 'n / 2', 'a = b', 'a += 1', 'm % 2', 'a - 1', 'x * 2'],
  logic: ['a < b', 'a > b', 'a <= b', 'a >= b', 'a == b', 'a != b', 'a && b', 'a || b', '!a', 'i < n'],
  cpp: ['std::cout', 'p->x', 'i++', '++i', 'a << b', 'cin >> x', 'std::vector<int>', 'std::string', 'x->next', '::value', 'a >> 1', 'std::endl'],
  misc: ['my_var', 'a.b', 'x, y', 'key: value', 'obj->name', 'MAX_SIZE', 'arr[i].id', 's.size()', 'n - 1', 'i, j'],
};

/* ---- 3.2 关键字 ---- */
const PY_KEYWORDS = `and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield`.split(' ');

const CPP_KEYWORDS = `alignas auto bool break case catch char class const constexpr continue decltype default delete do double else enum explicit extern false float for friend goto if inline int long mutable namespace new noexcept nullptr operator private protected public register return short signed sizeof static struct switch template this throw true try typedef typename union unsigned using virtual void volatile while`.split(' ');

const CPP_TYPES = ['int', 'double', 'float', 'char', 'bool', 'void', 'long long', 'unsigned', 'size_t', 'auto', 'const int', 'std::string', 'std::vector<int>', 'std::map<std::string, int>', 'std::pair<int, int>', 'const std::string&'];

const CPP_STD = ['std::cout', 'std::cin', 'std::endl', 'std::vector', 'std::string', 'std::sort', 'std::map', 'std::set', 'std::find', 'std::begin', 'std::end', 'std::size_t', '#include <iostream>', '#include <vector>', '#include <algorithm>', '#include <string>', 'using namespace std;'];

/* ---- 3.3 命名风格 ---- */
const ID_SNAKE = ['user_name', 'get_user_by_id', 'is_login', 'total_count', 'handle_click', 'parse_json_data', 'max_retry_count', 'current_page_index', 'is_valid_email', 'update_user_profile', 'read_file', 'write_log', 'find_max_value', 'list_all_items', 'build_index_map'];
const ID_CAMEL = ['userName', 'getUserById', 'isLogin', 'totalCount', 'handleClick', 'parseJsonData', 'maxRetryCount', 'currentPageIndex', 'isValidEmail', 'updateUserProfile', 'readFile', 'writeLog', 'findMaxValue', 'listAllItems', 'buildIndexMap'];
const ID_PASCAL = ['UserService', 'HttpClient', 'DataParser', 'MainController', 'ConfigManager', 'FileReader', 'JsonHelper', 'TaskScheduler', 'LinkedList', 'BinaryTree', 'Point3D', 'StringBuilder'];
const ID_CONST = ['MAX_SIZE', 'API_KEY', 'DEFAULT_TIMEOUT', 'BASE_URL', 'ENABLE_CACHE', 'LOG_LEVEL', 'DB_HOST', 'RETRY_COUNT', 'PI_VALUE', 'BUFFER_SIZE', 'MAX_RETRY', 'NODE_COUNT'];

/* ---- 3.4 Python 代码 ---- */
const PY_LINES_BASIC = [
  'print("Hello, World!")',
  'name = "Tom"',
  'age = 18',
  'x = 3.14',
  'flag = True',
  'nums = [1, 2, 3, 4, 5]',
  'total = sum(nums)',
  'print(f"total = {total}")',
  's = "hello".upper()',
  'n = len(nums)',
  'a, b = b, a',
  'value = int(input("Enter: "))',
  'print(name, age)',
  'pi = 3.14159',
  'text = "hello world".split()',
];

const PY_LINES_DATA = [
  'd = {"name": "Tom", "age": 18}',
  'd["city"] = "Beijing"',
  'nums.append(6)',
  'nums.sort(reverse=True)',
  'squares = [x * x for x in nums]',
  'evens = [x for x in nums if x % 2 == 0]',
  'subset = nums[1:3]',
  'pairs = list(zip(a, b))',
  'print(", ".join(names))',
  'keys = list(d.keys())',
  'value = d.get("age", 0)',
  'result = sorted(nums, reverse=True)',
  'matrix = [[1, 2], [3, 4]]',
  'first, *rest = nums',
];

const PY_BLOCKS_FLOW = [
`if x > 0:
    print("positive")
else:
    print("negative")`,

`for i in range(10):
    print(i)`,

`for item in nums:
    total += item`,

`while n > 0:
    n -= 1
    print(n)`,

`if a > b and b > c:
    print("a is the largest")`,

`for i, v in enumerate(nums):
    print(i, v)`,

`if x in items:
    print("found")`,
];

const PY_BLOCKS_FUNC = [
`def add(a, b):
    return a + b`,

`def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)`,

`try:
    value = int(text)
except ValueError:
    value = 0`,

`with open("data.txt", "r") as f:
    for line in f:
        print(line.strip())`,

`def greet(name="Tom"):
    print(f"Hello, {name}!")`,

`nums = [3, 1, 4, 1, 5]
total = 0
for n in nums:
    total += n
print(total)`,
];

const PY_PROGRAMS = [
`def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True


for x in range(2, 30):
    if is_prime(x):
        print(x)`,

`class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def dist(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5


p = Point(3, 4)
print(p.dist())`,

`def main():
    nums = [1, 2, 3, 4, 5]
    total = sum(n * n for n in nums)
    print(f"total = {total}")


if __name__ == "__main__":
    main()`,

`words = ["apple", "banana", "cherry"]
counts = {}
for w in words:
    counts[w] = len(w)

for k, v in sorted(counts.items()):
    print(k, v)`,
];

/* ---- 3.5 C++ 代码 ---- */
const CPP_LINES_BASIC = [
  '#include <iostream>',
  '#include <vector>',
  'using namespace std;',
  'int x = 10;',
  'double y = 3.14;',
  "char c = 'A';",
  'bool flag = true;',
  'const int MAX = 100;',
  'std::string name = "Tom";',
  'int sum = 0;',
  'cout << "Hello" << endl;',
  'cin >> x;',
  'int n = nums.size();',
  'return 0;',
];

const CPP_BLOCKS_FLOW = [
`for (int i = 0; i < n; ++i) {
    sum += arr[i];
}`,

`if (x > 0) {
    cout << "positive" << endl;
} else {
    cout << "negative" << endl;
}`,

`int i = 0;
while (i < 10) {
    cout << i << endl;
    ++i;
}`,

`for (auto& item : nums) {
    cout << item << " ";
}`,

`if (a > b && b > c) {
    cout << a << endl;
}`,
];

const CPP_BLOCKS_FUNC = [
`int add(int a, int b) {
    return a + b;
}`,

`void swap(int& a, int& b) {
    int t = a;
    a = b;
    b = t;
}`,

`double average(const std::vector<int>& v) {
    int sum = 0;
    for (int x : v) sum += x;
    return static_cast<double>(sum) / v.size();
}`,

`bool isEven(int n) {
    return n % 2 == 0;
}`,
];

const CPP_BLOCKS_STL = [
`std::vector<int> nums = {5, 3, 1, 4, 2};
std::sort(nums.begin(), nums.end());`,

`std::map<std::string, int> mp;
mp["apple"] = 3;
auto it = mp.find("apple");
if (it != mp.end()) {
    cout << it->second << endl;
}`,

`std::string s = "hello";
std::reverse(s.begin(), s.end());`,

`std::set<int> seen;
seen.insert(42);`,

`std::vector<int> v(10, 0);
v.push_back(7);
std::cout << v.size() << std::endl;`,
];

const CPP_BLOCKS_CLASS = [
`class Point {
public:
    Point(double x, double y) : x_(x), y_(y) {}

    double dist() const {
        return std::sqrt(x_ * x_ + y_ * y_);
    }

private:
    double x_;
    double y_;
};`,

`struct Node {
    int value;
    Node* next;

    Node(int v) : value(v), next(nullptr) {}
};`,

`class Counter {
public:
    void inc() { ++count_; }
    int value() const { return count_; }

private:
    int count_ = 0;
};`,
];

const CPP_PROGRAMS = [
`#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> nums = {5, 3, 1, 4, 2};
    std::sort(nums.begin(), nums.end());

    int sum = 0;
    for (int i = 0; i < nums.size(); ++i) {
        sum += nums[i];
    }

    std::cout << "sum = " << sum << std::endl;
    return 0;
}`,

`#include <iostream>

int main() {
    for (int i = 1; i <= 9; ++i) {
        for (int j = 1; j <= i; ++j) {
            std::cout << j << "*" << i << "=" << i * j << " ";
        }
        std::cout << std::endl;
    }
    return 0;
}`,

`#include <iostream>

bool isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; i * i <= n; ++i) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    for (int x = 2; x < 30; ++x) {
        if (isPrime(x)) {
            std::cout << x << " ";
        }
    }
    return 0;
}`,

`#include <iostream>
#include <string>
#include <map>

int main() {
    std::map<std::string, int> counts;
    std::string words[] = {"apple", "banana", "apple"};

    for (const auto& w : words) {
        counts[w]++;
    }

    for (const auto& pair : counts) {
        std::cout << pair.first << " : " << pair.second << std::endl;
    }
    return 0;
}`,
];

/* ============================================================
   三点五、拼音中文打字素材
   写法：汉字|拼音（不带声调、全小写、连写）
   ============================================================ */

/** 把 "我|wo 你|ni" 这样的紧凑写法解析成 { w, p } 数组 */
function pyList(str) {
  return str.trim().split(/\s+/).filter(Boolean).map((s) => {
    const i = s.indexOf('|');
    return { w: s.slice(0, i), p: s.slice(i + 1) };
  });
}

const PY_CHARS_1 = pyList(`
我|wo 你|ni 他|ta 她|ta 好|hao 是|shi 的|de 了|le 在|zai 有|you
人|ren 大|da 小|xiao 上|shang 下|xia 中|zhong 国|guo 天|tian 地|di 水|shui
火|huo 山|shan 日|ri 月|yue 年|nian 时|shi 分|fen 秒|miao 电|dian 脑|nao
手|shou 机|ji 车|che 门|men 家|jia 学|xue 生|sheng 老|lao 师|shi 朋|peng
`);

const PY_CHARS_2 = pyList(`
友|you 工|gong 作|zuo 吃|chi 喝|he 看|kan 听|ting 说|shuo 读|du 写|xie
来|lai 去|qu 走|zou 跑|pao 坐|zuo 站|zhan 想|xiang 做|zuo 用|yong 买|mai
卖|mai 开|kai 关|guan 前|qian 后|hou 左|zuo 右|you 多|duo 少|shao 高|gao
长|chang 短|duan 新|xin 旧|jiu 快|kuai 慢|man 早|zao 晚|wan 冷|leng 热|re
`);

const PY_LIFE = pyList(`
你好|nihao 谢谢|xiexie 再见|zaijian 对不起|duibuqi 没关系|meiguanxi
早上好|zaoshanghao 晚安|wanan 吃饭|chifan 喝水|heshui 睡觉|shuijiao
起床|qichuang 上班|shangban 下班|xiaban 回家|huijia 朋友|pengyou
家人|jiaren 爸爸|baba 妈妈|mama 孩子|haizi 天气|tianqi
`);

const PY_STUDY = pyList(`
学习|xuexi 工作|gongzuo 老师|laoshi 学生|xuesheng 同学|tongxue
考试|kaoshi 成绩|chengji 努力|nuli 认真|renzhen 进步|jinbu
会议|huiyi 报告|baogao 计划|jihua 任务|renwu 完成|wancheng
时间|shijian 开始|kaishi 结束|jieshu 帮忙|bangmang 感谢|ganxie
`);

const PY_TECH = pyList(`
电脑|diannao 键盘|jianpan 鼠标|shubiao 屏幕|pingmu 文件|wenjian
软件|ruanjian 硬件|yingjian 系统|xitong 网络|wangluo 上网|shangwang
下载|xiazai 上传|shangchuan 搜索|sousuo 网页|wangye 邮箱|youxiang
密码|mima 登录|denglu 程序|chengxu 代码|daima 数据|shuju
`);

const PY_PHRASE = pyList(`
你好吗|nihaoma 我很好|wohenhao 谢谢你|xiexieni 不客气|bukeqi
晚上好|wanshanghao 我爱你|woaini 中国加油|zhongguojiayou 好久不见|haojiubujian
请多关照|qingduoguanzhao 我是中国人|woshizhongguoren 这是一台电脑|zheshiyitaidiannao
他喜欢看书|taxihuankanshu 学习使我快乐|xuexishiwokuaile 我们一起学习|womenyiqixuexi
祝你生日快乐|zhunishengrikuaile 电脑很好用|diannaohenhaoyong 请打开文件|qingdakaiwenjian
我在学习打字|wozaixuexidazi 今天天气很好|jintiantianqihenhao 上网要注意安全|shangwangyaozhuyianquan
`);

const PY_ALL = [].concat(PY_CHARS_1, PY_CHARS_2, PY_LIFE, PY_STUDY, PY_TECH, PY_PHRASE);

/**
 * 生成一个拼音练习单元。
 * target 是「拼音 + 空格」拼起来的字符串（交给打字引擎逐字母比对），
 * items 保留汉字和拼音的对应关系，界面上的「汉字 + 候选词框」靠它渲染。
 */
function pyUnit(pool, n) {
  const items = R.pickN(pool, Math.min(n, pool.length));
  return {
    items,
    target: items.map((it) => it.p + ' ').join(''),
  };
}

/* ============================================================
   四、关卡结构（界面直接读这个）
   ============================================================ */

const ENGLISH_TRACK = {
  id: 'english',
  name: '英文练习',
  tabs: [
    {
      id: 'letters', name: '随机字母',
      levels: [
        { id: 'en-l1', title: '小写字母 a ~ z', desc: '26 个字母随机出现', build: () => genKeyDrill(EN_LETTERS['小写字母'], { rows: 5, groupLen: 5 }) },
        { id: 'en-l2', title: '左手字母专项', desc: '只练左手负责的 15 个字母', build: () => genKeyDrill(EN_LETTERS['左手字母'], { rows: 5, groupLen: 5 }) },
        { id: 'en-l3', title: '右手字母专项', desc: '只练右手负责的 11 个字母', build: () => genKeyDrill(EN_LETTERS['右手字母'], { rows: 5, groupLen: 5 }) },
      ],
    },
    {
      id: 'words', name: '常用单词',
      levels: [
        { id: 'en-w1', title: '高频短词', desc: 'the / and / you 这类最常见的小词', build: () => wordStream(EN_WORDS.filter((w) => w.length <= 3), 240) },
        { id: 'en-w2', title: '常用单词', desc: '长度 4 ~ 6 的日常词汇', build: () => wordStream(EN_WORDS.filter((w) => w.length >= 4 && w.length <= 6), 260) },
        { id: 'en-w3', title: '长单词挑战', desc: '7 个字母以上的词，考验连贯性', build: () => wordStream(EN_WORDS.filter((w) => w.length >= 7), 260) },
        { id: 'en-w4', title: '单词混合', desc: '长短词混在一起，接近真实文章', build: () => wordStream(EN_WORDS, 280) },
      ],
    },
    {
      id: 'sent', name: '句子与文章',
      levels: [
        { id: 'en-s1', title: '短句练习', desc: '带大小写和标点的完整句子', build: () => sentenceStream(EN_SENTENCES, 6) },
        { id: 'en-s2', title: '打字名言', desc: '程序员圈子里流传的句子', build: () => sentenceStream(EN_SENTENCES.slice(12), 6) },
        { id: 'en-p1', title: '整段文章', desc: '连续输入一整段，练耐力和节奏', build: () => R.pick(EN_PARAGRAPHS) },
      ],
    },
  ],
};

const CODE_TRACK = {
  id: 'code',
  name: '编程打字',
  tabs: [
    {
      id: 'symbol', name: '① 符号与命名',
      groups: [
        {
          title: '符号基础 · 写代码最卡手指的地方',
          levels: [
            { id: 'sy1', title: '圆括号 ( )', desc: '函数调用天天用', build: () => mixDrill(SYM.paren, 34) },
            { id: 'sy2', title: '方括号 [ ]', desc: '数组、下标、列表', build: () => mixDrill(SYM.bracket, 34) },
            { id: 'sy3', title: '花括号 { }', desc: '代码块，C++ 里最多', build: () => mixDrill(SYM.brace, 34) },
            { id: 'sy4', title: '引号与分号 \' " ;', desc: '每行代码的结尾', build: () => mixDrill(SYM.quote, 34) },
            { id: 'sy5', title: '四则与赋值 + - * / =', desc: '算术和赋值运算符', build: () => mixDrill(SYM.arith, 34) },
            { id: 'sy6', title: '比较与逻辑 < > ! && ||', desc: '条件判断必备', build: () => mixDrill(SYM.logic, 34) },
            { id: 'sy7', title: 'C++ 专属 :: -> ++ << >>', desc: '这四个符号最劝退新手', build: () => mixDrill(SYM.cpp, 30) },
            { id: 'sy8', title: '下划线、点号、冒号 _ . , :', desc: '命名和结构全靠它们', build: () => mixDrill(SYM.misc, 30) },
            {
              id: 'sy9', title: '符号大杂烩', desc: '以上全部随机混合，终极考验',
              build: () => mixDrill([].concat(SYM.paren, SYM.bracket, SYM.brace, SYM.quote, SYM.arith, SYM.logic, SYM.cpp, SYM.misc), 36),
            },
          ],
        },
        {
          title: '命名风格 · 写出规范的变量名',
          levels: [
            { id: 'nm1', title: 'snake_case', desc: 'Python 变量和函数的标准写法', build: () => wordStream(ID_SNAKE, 240) },
            { id: 'nm2', title: 'camelCase', desc: 'Java / JS 风格的小驼峰', build: () => wordStream(ID_CAMEL, 240) },
            { id: 'nm3', title: 'PascalCase', desc: '类名、组件名的写法', build: () => wordStream(ID_PASCAL, 200) },
            { id: 'nm4', title: 'MAX_SIZE 常量命名', desc: '全大写加下划线，注意 Shift 的切换', build: () => wordStream(ID_CONST, 200) },
            {
              id: 'nm5', title: '四种风格混合', desc: '在风格之间来回切换，最难的一种',
              build: () => wordStream([].concat(ID_SNAKE, ID_CAMEL, ID_PASCAL, ID_CONST), 280),
            },
          ],
        },
      ],
    },
    {
      id: 'python', name: '② Python',
      groups: [
        {
          title: 'Python 由浅入深',
          levels: [
            { id: 'py1', title: '基础语句', desc: '变量、打印、简单运算', build: () => pickLines(PY_LINES_BASIC, 11) },
            { id: 'py2', title: '列表与字典', desc: '最常用的两种数据结构', build: () => pickLines(PY_LINES_DATA, 11) },
            { id: 'py3', title: '条件与循环', desc: '注意行尾的冒号和 4 空格缩进', build: () => pickBlocks(PY_BLOCKS_FLOW, 4) },
            { id: 'py4', title: '函数与异常', desc: 'def / return / try / with', build: () => pickBlocks(PY_BLOCKS_FUNC, 3) },
            { id: 'py5', title: '完整程序', desc: '带缩进的完整小程序，一次打一整段', build: () => R.pick(PY_PROGRAMS) },
          ],
        },
      ],
    },
    {
      id: 'cpp', name: '③ C++',
      groups: [
        {
          title: 'C++ 由浅入深',
          levels: [
            { id: 'cp1', title: '头文件与基础语句', desc: '#include / using / 变量声明', build: () => pickLines(CPP_LINES_BASIC, 11) },
            { id: 'cp2', title: '分支与循环', desc: '注意行尾的分号和花括号', build: () => pickBlocks(CPP_BLOCKS_FLOW, 4) },
            { id: 'cp3', title: '函数定义', desc: '返回类型、参数、引用 &', build: () => pickBlocks(CPP_BLOCKS_FUNC, 3) },
            { id: 'cp4', title: 'STL 常用写法', desc: 'vector / map / set / sort', build: () => pickBlocks(CPP_BLOCKS_STL, 3) },
            { id: 'cp5', title: '类与结构体', desc: 'class / struct / public / private', build: () => pickBlocks(CPP_BLOCKS_CLASS, 2) },
            { id: 'cp6', title: '完整程序', desc: '含 main 函数的完整 C++ 程序', build: () => R.pick(CPP_PROGRAMS) },
          ],
        },
        {
          title: 'C++ 词汇表',
          levels: [
            {
              id: 'cp7', title: 'C++ 关键字', desc: '62 个关键字随机出现',
              build: () => {
                const picked = R.pickN(CPP_KEYWORDS, 30);
                return picked.map((k) => [k, k, R.pick(CPP_KEYWORDS)].join(' ')).join('\n');
              },
            },
            {
              id: 'cp8', title: '类型与标准库', desc: 'int / double / std::vector …',
              build: () => wordStream([].concat(CPP_TYPES, CPP_STD), 240),
            },
          ],
        },
      ],
    },
  ],
};

/* ---- Python 关键字单独一关，避免上面太挤 ---- */
CODE_TRACK.tabs[1].groups[0].levels.push({
  id: 'py6', title: 'Python 关键字', desc: '35 个关键字随机出现',
  build: () => R.pickN(PY_KEYWORDS, 30).map((k) => [k, k, R.pick(PY_KEYWORDS)].join(' ')).join('\n'),
});

/* ============================================================
   五、拼音中文打字关卡
   ============================================================ */

const PINYIN_TRACK = {
  id: 'pinyin',
  name: '拼音打字',
  tabs: [
    {
      id: 'char', name: '① 单字',
      levels: [
        { id: 'py-c1', title: '一级常用字', desc: '最常用的 40 个汉字，先把拼音打顺', unit: () => pyUnit(PY_CHARS_1, 26) },
        { id: 'py-c2', title: '二级常用字', desc: '动作、方位、形容词', unit: () => pyUnit(PY_CHARS_2, 26) },
        { id: 'py-c3', title: '单字混合', desc: '两组合在一起随机出现', unit: () => pyUnit(PY_CHARS_1.concat(PY_CHARS_2), 28) },
      ],
    },
    {
      id: 'word', name: '② 常用词',
      levels: [
        { id: 'py-w1', title: '生活日常', desc: '问候、吃饭、睡觉、家人', unit: () => pyUnit(PY_LIFE, 14) },
        { id: 'py-w2', title: '学习与工作', desc: '考试、会议、任务、进步', unit: () => pyUnit(PY_STUDY, 14) },
        { id: 'py-w3', title: '电脑与网络', desc: '键盘、文件、下载、密码', unit: () => pyUnit(PY_TECH, 14) },
        { id: 'py-w4', title: '词汇混合', desc: '三类词混在一起', unit: () => pyUnit([].concat(PY_LIFE, PY_STUDY, PY_TECH), 16) },
      ],
    },
    {
      id: 'phrase', name: '③ 短语短句',
      levels: [
        { id: 'py-p1', title: '日常短句', desc: '一整句话连着打，练节奏', unit: () => pyUnit(PY_PHRASE, 7) },
        { id: 'py-p2', title: '短句挑战', desc: '10 个短句，考验连贯性', unit: () => pyUnit(PY_PHRASE, 10) },
      ],
    },
  ],
};

/* ---- 速度测试用文本（给足量，避免限时没到就没字可打了） ---- */
const TEST_TEXTS = {
  code: () => [
    R.pick(CPP_PROGRAMS),
    R.pick(PY_PROGRAMS),
    pickBlocks(CPP_BLOCKS_STL, 4),
    pickBlocks(PY_BLOCKS_FUNC, 4),
    pickBlocks(CPP_BLOCKS_FLOW, 4),
    pickBlocks(PY_BLOCKS_FLOW, 4),
    pickLines(CPP_LINES_BASIC, 14),
    pickLines(PY_LINES_BASIC, 14),
  ].join('\n\n'),
  english: () => R.pickN(EN_PARAGRAPHS, EN_PARAGRAPHS.length).join('\n\n'),
  symbol: () => mixDrill([].concat(SYM.paren, SYM.bracket, SYM.brace, SYM.quote, SYM.arith, SYM.logic, SYM.cpp, SYM.misc), 220),
  pinyin: () => pyUnit(PY_ALL, 150).target,
};

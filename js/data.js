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
   三点二、C++ 完整项目（一个从头到尾能跑的小程序）
   ============================================================ */

const CPP_PROJECT = `// Student score book: a small but complete C++ project
#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <cstddef>
#include <algorithm>

struct Student {
    std::string name;
    int score;
};

class ScoreBook {
public:
    void add(const std::string& name, int score) {
        students_.push_back({name, score});
    }

    double average() const {
        if (students_.empty()) return 0.0;
        int sum = 0;
        for (const auto& s : students_) {
            sum += s.score;
        }
        return static_cast<double>(sum) / students_.size();
    }

    std::vector<Student> top(std::size_t n) const {
        std::vector<Student> sorted = students_;
        std::sort(sorted.begin(), sorted.end(),
                  [](const Student& a, const Student& b) {
                      return a.score > b.score;
                  });
        if (sorted.size() > n) {
            sorted.resize(n);
        }
        return sorted;
    }

private:
    std::vector<Student> students_;
};

int main() {
    ScoreBook book;
    book.add("Alice", 92);
    book.add("Bob", 78);
    book.add("Carol", 85);

    std::cout << std::fixed << std::setprecision(1);
    std::cout << "average = " << book.average() << std::endl;

    for (const auto& s : book.top(2)) {
        std::cout << s.name << " : " << s.score << std::endl;
    }
    return 0;
}`;

/* ============================================================
   三点三、Verilog 入门
   ============================================================ */

const VLG_SYMBOLS = [
  'module', 'endmodule', 'input', 'output', 'inout', 'wire', 'reg',
  'always', 'assign', 'begin', 'end', 'posedge', 'negedge', 'parameter',
  'localparam', 'if', 'else', 'case', 'endcase', '#', '@', '<=', '==', '!=',
  '&&', '||', '~', '&', '|', '^', '<<', '>>',
];

const VLG_LINES_PORT = [
  'module adder (',
  '    input  wire [3:0] a,',
  '    input  wire [3:0] b,',
  '    input  wire       cin,',
  '    output wire [3:0] sum,',
  '    output wire       cout',
  ');',
  'endmodule',
  'wire [7:0] data;',
  'reg  [3:0] cnt;',
  'parameter WIDTH = 8;',
];

const VLG_BLOCKS_MODULE = [
`module adder (
    input  wire [3:0] a,
    input  wire [3:0] b,
    output wire [4:0] sum
);
    assign sum = a + b;
endmodule`,

`module mux2 (
    input  wire a,
    input  wire b,
    input  wire sel,
    output wire y
);
    assign y = sel ? b : a;
endmodule`,

`module decoder2to4 (
    input  wire [1:0] in,
    output reg  [3:0] out
);
    always @(*) begin
        case (in)
            2'b00: out = 4'b0001;
            2'b01: out = 4'b0010;
            2'b10: out = 4'b0100;
            default: out = 4'b1000;
        endcase
    end
endmodule`,
];

const VLG_BLOCKS_COMB = [
`assign y = (a & b) | (~c);
assign z = a ^ b;`,

`assign {cout, sum} = a + b + cin;
assign shifted = data << 2;`,

`wire [3:0] low  = value[3:0];
wire [3:0] high = value[7:4];
assign eq = (a == b);
assign ne = (a != b);`,

`assign valid = (state == 2'b01) && (ready || force);`,
];

const VLG_BLOCKS_SEQ = [
`always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
        cnt <= 8'd0;
    end else begin
        cnt <= cnt + 8'd1;
    end
end`,

`always @(posedge clk) begin
    q <= d;
end`,

`always @(negedge clk) begin
    if (enable) begin
        q <= d;
    end
end`,
];

const VLG_MODULES = [
`module clk_div #(
    parameter DIV = 50_000_000
) (
    input  wire clk,
    input  wire rst_n,
    output reg  tick
);
    reg [25:0] cnt;

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            cnt  <= 26'd0;
            tick <= 1'b0;
        end else if (cnt == DIV - 1) begin
            cnt  <= 26'd0;
            tick <= 1'b1;
        end else begin
            cnt  <= cnt + 26'd1;
            tick <= 1'b0;
        end
    end
endmodule`,

`module counter #(
    parameter WIDTH = 8
) (
    input  wire             clk,
    input  wire             rst_n,
    input  wire             en,
    output reg  [WIDTH-1:0] q
);
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            q <= {WIDTH{1'b0}};
        end else if (en) begin
            q <= q + 1'b1;
        end
    end
endmodule`,

`module seg7 (
    input  wire [3:0] bin,
    output reg  [6:0] seg
);
    always @(*) begin
        case (bin)
            4'd0: seg = 7'b1111110;
            4'd1: seg = 7'b0110000;
            4'd2: seg = 7'b1101101;
            4'd3: seg = 7'b1111001;
            default: seg = 7'b0000000;
        endcase
    end
endmodule`,
];

const VLG_TESTBENCH = [
`module tb_clk_div;
    reg  clk;
    reg  rst_n;
    wire tick;

    clk_div #(.DIV(4)) dut (
        .clk(clk),
        .rst_n(rst_n),
        .tick(tick)
    );

    initial begin
        clk = 1'b0;
        forever #5 clk = ~clk;
    end

    initial begin
        rst_n = 1'b0;
        #20 rst_n = 1'b1;
        #100 $finish;
    end
endmodule`,
];

/* ============================================================
   三点四、文章练习素材

   说明：
   - 英文《Attention Is All You Need》只引用「摘要原文」（带出处），
     其余是导读——用我自己的话讲同一件事，不整篇转载论文。
   - 中文集成电路部分为**原创学习材料**，围绕相关研究方向撰写，
     不是任何论文的原文，也不代表原作者的观点。
   ============================================================ */

/* 论文摘要：Vaswani et al., "Attention Is All You Need", arXiv:1706.03762 */
const EN_ATTENTION_ABSTRACT = `The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight GPUs, a small fraction of the training costs of the best models from the literature. We show that the Transformer generalizes well to other tasks by applying it successfully to English constituency parsing both with large and limited training data.`;

/* 以下三段是导读，原创文字 */
const EN_ATTENTION_INTRO = `Before the Transformer, sequence models were built on recurrence. A recurrent network reads a sentence one token at a time and carries a hidden state forward, so the computation at step one hundred cannot begin until step ninety-nine has finished. That sequential dependency is the reason these models were hard to parallelize. The Transformer removes it. Instead of walking through the sequence, it lets every position look at every other position in a single step. The paper argues that attention alone is enough, and the experiment it reports supports that claim: better translation quality, trained in a fraction of the time.`;

const EN_ATTENTION_SELF = `The central idea is self-attention. Each token is projected into three vectors: a query, a key and a value. The score between two tokens is the dot product of one token's query with the other token's key. Those scores are scaled down, passed through a softmax, and used as weights to average the value vectors. The result is a new representation for each token that blends in information from the tokens it attends to. Because every position can attend to every other position in one step, the path between any two tokens is short. This is what lets the model capture long range dependencies without the sequential bottleneck of a recurrent network.`;

const EN_ATTENTION_HEADS = `A single attention operation can express only one pattern of relatedness. The Transformer therefore runs several attention heads in parallel. Each head has its own projection matrices, so each head learns a different way of looking at the sequence. One head might track syntactic agreement, another might follow coreference, and a third might focus on nearby words. The outputs of all heads are concatenated and projected back to the model dimension. This is cheap: splitting the model into eight heads makes each head one eighth as wide, so the total cost stays close to that of a single full-width head.`;

const EN_ATTENTION_POS = `Attention by itself is order blind. If you shuffle the tokens, the weighted sums are the same, because the operation treats its input as a set rather than a sequence. The Transformer restores order by adding a positional encoding to every input embedding. The paper uses fixed sinusoids of different frequencies, so that the encoding of a position is a deterministic function of its index. Removing recurrence also removes the sequential dependency that blocks parallel training. Every position can be computed at the same time, and training on eight GPUs for a few days was enough to beat the best translation systems of the time.`;

/* ---- 中文集成电路专题（原创）---- */
/* 一、芯片是怎么造出来的 */
const ZH_IC_MAKE = pyList(`
一块|yikuai 芯片|xinpian 的|de 诞生|dansheng 要|yao 经过|jingguo 几百|jibai 道|dao 工序|gongxu
首先|shouxian 是|shi 设计|sheji 工程师|gongchengshi 用|yong 硬件|yingjian 描述|miaoshu 语言|yuyan
写出|xiechu 电路|dianlu 再|zai 综合|zonghe 布局|buju 和|he 布线|buxian 变成|biancheng 版图|bantu
然后|ranhou 是|shi 制造|zhizao 在|zai 硅片|guipian 上|shang 反复|fanfu 进行|jinxing
光刻|guangke 刻蚀|keshi 离子|lizi 注入|zhuru 薄膜|baomo 沉积|chenji
每|mei 一步|yibu 的|de 精度|jingdu 都|dou 在|zai 纳米|nami 级别|jibie
最后|zuihou 是|shi 封装|fengzhuang 和|he 测试|ceshi 把|ba 裸片|luopian 装进|zhuangjin
外壳|waike 并|bing 检验|jianyan 功能|gongneng
`);

/* 二、存储器与存算一体 */
const ZH_IC_CIM = pyList(`
传统|chuantong 的|de 计算|jisuan 架构|jiagou 把|ba 存储|cunchu 和|he 计算|jisuan 分开|fenkai
数据|shuju 在|zai 内存|neicun 和|he 处理器|chuliqi 之间|zhijian 来回|laihui 搬运|banyun
这|zhe 条|tiao 通路|tonglu 的|de 带宽|daikuan 和|he 功耗|gonghao 已经|yijing 成为|chengwei 瓶颈|pingjing
存算一体|cunsuanyiti 的|de 思路|silu 是|shi 让|rang 存储|cunchu 单元|danyuan 自己|ziji 完成|wancheng
一部分|yibufen 计算|jisuan
例如|liru 用|yong 磁性|cixing 隧道|suidao 结|jie 的|de 电阻|dianzu 状态|zhuangtai 表示|biaoshi 权重|quanzhong
再|zai 通过|tongguo 基尔霍夫|jierhuofu 定律|dinglv 在|zai 模拟|moni 域|yu 完成|wancheng 乘加|chengjia
这样|zheyang 可以|keyi 省掉|shengdiao 大量|daliang 的|de 数据|shuju 搬运|banyun
但|dan 模拟|moni 计算|jisuan 的|de 精度|jingdu 一致性|yizhixing 和|he 工艺|gongyi 偏差|piancha
仍然|rengran 是|shi 难点|nandian
`);

/* 三、从 RTL 到版图 */
const ZH_IC_FLOW = pyList(`
数字|shuzi 芯片|xinpian 的|de 设计|sheji 从|cong 寄存器|jicunqi 传输|chuanshu 级|ji 开始|kaishi
工程师|gongchengshi 把|ba 电路|dianlu 的|de 行为|xingwei 写进|xiejin 代码|daima
然后|ranhou 通过|tongguo 逻辑|luoji 综合|zonghe 映射|yingshe 到|dao 标准|biaozhun 单元|danyuan 库|ku
综合|zonghe 之后|zhihou 要|yao 做|zuo 形式|xingshi 验证|yanzheng
确认|queren 网表|wangbiao 和|he 源|yuan 代码|daima 等价|dengjia
接着|jiezhe 是|shi 布局|buju 布线|buxian 决定|jueding 每个|meige 单元|danyuan 放在|fangzai 哪里|nali
怎么|zenme 连|lian 起来|qilai
最后|zuihou 提取|tiqu 寄生|jisheng 参数|canshu 做|zuo 时序|shixu 和|he 功耗|gonghao 分析|fenxi
如果|ruguo 不|bu 满足|manzu 约束|yueshu 就|jiu 要|yao 回到|huidao 前面|qianmian 的|de 步骤|buzhou
反复|fanfu 迭代|diedai
`);

/* 按原顺序出题（文章必须顺着打，不能随机挑词）*/
function pySequence(items) {
  return {
    items,
    target: items.map((it) => it.p + ' ').join(''),
  };
}

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

/* ---- 大学生日常（校园地标、上课、宿舍、考试、社团、求职）---- */

const PY_CAMPUS = pyList(`
宿舍|sushe 食堂|shitang 图书馆|tushuguan 教学楼|jiaoxuelou 教室|jiaoshi
实验室|shiyanshi 操场|caochang 校园|xiaoyuan 自习室|zixishi 快递站|kuaidizhan
超市|chaoshi 体育馆|tiyuguan 报告厅|baogaoting 洗衣房|xiyifang 开水房|kaishuifang
校车|xiaoche
`);

const PY_CLASS = pyList(`
上课|shangke 下课|xiake 选课|xuanke 课表|kebiao 课程|kecheng
学分|xuefen 作业|zuoye 交作业|jiaozuoye 小组|xiaozu 分工|fengong
汇总|huizong 笔记|biji 课件|kejian 讲座|jiangzuo 提问|tiwen
回答|huida 点名|dianming 签到|qiandao 请假|qingjia 迟到|chidao
翘课|qiaoke 水课|shuike 早八|zaoba
`);

const PY_DORM = pyList(`
室友|shiyou 快递|kuaidi 外卖|waimai 打包|dabao 排队|paidui
刷卡|shuaka 校园卡|xiaoyuanka 空调|kongtiao 断电|duandian 熄灯|xideng
赖床|laichuang 洗澡|xizao 打水|dashui 打扫|dazao 值日|zhiri
生活费|shenghuofei 兼职|jianzhi 熬夜|aoye 通宵|tongxiao
`);

const PY_EXAM = pyList(`
期中|qizhong 期末|qimo 绩点|jidian 挂科|guake 补考|bukao
重修|chongxiu 复习|fuxi 预习|yuxi 自习|zixi 奖学金|jiangxuejin
保研|baoyan 考研|kaoyan 毕业|biye 论文|lunwen 答辩|dabian
导师|daoshi 开题|kaiti
`);

const PY_FUN = pyList(`
社团|shetuan 学生会|xueshenghui 招新|zhaoxin 聚餐|jucan 火锅|huoguo
奶茶|naicha 咖啡|kafei 夜宵|yexiao 追剧|zhuiju 打游戏|dayouxi
刷视频|shuashipin 直播|zhibo 网购|wanggou 拼单|pindan 团购|tuangou
旅游|lvyou 演唱会|yanchanghui 电影院|dianyingyuan 拍照|paizhao 朋友圈|pengyouquan
点赞|dianzan 评论|pinglun 转发|zhuanfa 聊天|liaotian 表情包|biaoqingbao
吐槽|tucao 摸鱼|moyu 内卷|neijuan 躺平|tangping
`);

const PY_CAREER = pyList(`
实习|shixi 简历|jianli 面试|mianshi 招聘|zhaopin 招聘会|zhaopinhui
笔试|bishi 岗位|gangwei 待遇|daiyu 薪资|xinzi 加班|jiaban
转正|zhuanzheng 三方协议|sanfangxieyi 职业|zhiye 城市|chengshi
`);

const PY_CAMPUS_PHRASE = pyList(`
早上有课|zaoshangyouke 帮我带个饭|bangwodaigefan 明天要交作业|mingtianyaojiaozuoye
你选什么课|nixuanshenmeke 期末考完了|qimokaowanle 我要去图书馆|woyaoqutushuguan
这道题怎么做|zhedaotizenmezuo 老师点名了吗|laoshidianminglema 我快迟到了|wokuaichidaole
一起去自习|yiqiquzixi 晚上吃什么|wanshangchishenme 帮我占个座|bangwozhangezuo
作业写完了吗|zuoyexiewanlema 明天没课|mingtianmeike 周末出去玩|zhoumochuquwan
我挂科了|woguakele 考研加油|kaoyanjiayou 祝你面试顺利|zhunimianshishunli
答辩通过了|dabiantongguole 一起去吃饭|yiqiquchifan
`);

const PY_ALL = [].concat(
  PY_CHARS_1, PY_CHARS_2,
  PY_LIFE, PY_STUDY, PY_TECH,
  PY_CAMPUS, PY_CLASS, PY_DORM, PY_EXAM, PY_FUN, PY_CAREER,
  PY_PHRASE, PY_CAMPUS_PHRASE,
);

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
            {
              id: 'cp9', title: '完整项目：成绩管理', desc: '结构体 + 类 + vector + sort + lambda，57 行能跑的小项目',
              build: () => CPP_PROJECT,
            },
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
    {
      id: 'verilog', name: '④ Verilog',
      groups: [
        {
          title: 'Verilog 入门 · 从零到能写模块',
          levels: [
            {
              id: 'vl1', title: '关键字与符号', desc: 'module / always / posedge / <= …',
              build: () => {
                const picked = R.pickN(VLG_SYMBOLS, 26);
                let out = '';
                for (let i = 0; i < picked.length; i++) {
                  out += picked[i] + ' ';
                  if ((i + 1) % 6 === 0) out += '\n';
                }
                return out;
              },
            },
            { id: 'vl2', title: '端口与线网声明', desc: 'input / output / wire / reg / parameter', build: () => pickLines(VLG_LINES_PORT, 10) },
            { id: 'vl3', title: '模块结构', desc: 'module … endmodule 的完整骨架', build: () => pickBlocks(VLG_BLOCKS_MODULE, 2) },
            { id: 'vl4', title: '组合逻辑 assign', desc: '连续赋值、位运算、拼接', build: () => pickBlocks(VLG_BLOCKS_COMB, 2) },
            { id: 'vl5', title: '时序逻辑 always', desc: '时钟沿触发、非阻塞赋值 <=', build: () => pickBlocks(VLG_BLOCKS_SEQ, 2) },
            { id: 'vl6', title: '完整模块：分频器 / 计数器', desc: '带 parameter 和复位逻辑', build: () => pickBlocks(VLG_MODULES, 2) },
            { id: 'vl7', title: 'testbench 激励', desc: 'initial / forever / #延时 / 实例化', build: () => pickBlocks(VLG_TESTBENCH, 1) },
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
   四点五、文章练习
   ============================================================ */

const ARTICLE_TRACK = {
  id: 'articles',
  name: '文章练习',
  tabs: [
    {
      id: 'en-paper', name: '① 英文论文',
      levels: [
        {
          id: 'ar-e1', title: 'Attention 摘要', desc: 'Vaswani et al. 2017 · arXiv:1706.03762 摘要原文',
          build: () => EN_ATTENTION_ABSTRACT,
        },
        { id: 'ar-e2', title: '导读：为什么去掉循环', desc: '原创导读 · 约 100 词', build: () => EN_ATTENTION_INTRO },
        { id: 'ar-e3', title: '导读：自注意力怎么算', desc: 'query / key / value 与缩放点积', build: () => EN_ATTENTION_SELF },
        { id: 'ar-e4', title: '导读：多头注意力', desc: '多个子空间并行看序列', build: () => EN_ATTENTION_HEADS },
        { id: 'ar-e5', title: '导读：位置编码与并行化', desc: '正弦编码 + 训练成本', build: () => EN_ATTENTION_POS },
        {
          id: 'ar-e6', title: '论文精读挑战', desc: '摘要 + 四段导读连打，约 580 词',
          build: () => [EN_ATTENTION_ABSTRACT, EN_ATTENTION_INTRO, EN_ATTENTION_SELF,
            EN_ATTENTION_HEADS, EN_ATTENTION_POS].join('\n\n'),
        },
      ],
    },
    {
      id: 'zh-ic', name: '② 中文 · 集成电路',
      levels: [
        { id: 'ar-z1', title: '芯片是怎么造出来的', desc: '原创学习材料 · 60 词 · 打拼音', unit: () => pySequence(ZH_IC_MAKE) },
        { id: 'ar-z2', title: '存储器与存算一体', desc: '原创学习材料 · 76 词 · 打拼音', unit: () => pySequence(ZH_IC_CIM) },
        { id: 'ar-z3', title: '从 RTL 到版图', desc: '原创学习材料 · 70 词 · 打拼音', unit: () => pySequence(ZH_IC_FLOW) },
      ],
    },
  ],
};

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
      id: 'campus', name: '③ 校园生活',
      levels: [
        { id: 'py-s1', title: '校园地标', desc: '宿舍、食堂、图书馆、教学楼', unit: () => pyUnit(PY_CAMPUS, 12) },
        { id: 'py-s2', title: '上课与作业', desc: '选课、课表、小组、答辩；还有早八和水课', unit: () => pyUnit(PY_CLASS, 14) },
        { id: 'py-s3', title: '宿舍生活', desc: '室友、快递、外卖、熄灯、熬夜', unit: () => pyUnit(PY_DORM, 14) },
        { id: 'py-s4', title: '考试与成绩', desc: '期中、期末、绩点、挂科、保研', unit: () => pyUnit(PY_EXAM, 12) },
        { id: 'py-s5', title: '社团与娱乐', desc: '聚餐、奶茶、追剧、旅游、内卷、躺平', unit: () => pyUnit(PY_FUN, 14) },
        { id: 'py-s6', title: '实习与求职', desc: '简历、面试、招聘会、三方协议', unit: () => pyUnit(PY_CAREER, 12) },
        {
          id: 'py-s7', title: '校园词汇大混合', desc: '六类校园词随机出现，检验真实水平',
          unit: () => pyUnit([].concat(PY_CAMPUS, PY_CLASS, PY_DORM, PY_EXAM, PY_FUN, PY_CAREER), 18),
        },
      ],
    },
    {
      id: 'phrase', name: '④ 短语短句',
      levels: [
        { id: 'py-p1', title: '日常短句', desc: '一整句话连着打，练节奏', unit: () => pyUnit(PY_PHRASE, 7) },
        { id: 'py-p2', title: '短句挑战', desc: '10 个短句，考验连贯性', unit: () => pyUnit(PY_PHRASE, 10) },
        {
          id: 'py-p3', title: '校园口语', desc: '「帮我带个饭」「明天要交作业」这类日常话',
          unit: () => pyUnit(PY_CAMPUS_PHRASE, 8),
        },
        {
          id: 'py-p4', title: '校园口语挑战', desc: '12 句连着打，最贴近真实的聊天节奏',
          unit: () => pyUnit(PY_CAMPUS_PHRASE, 12),
        },
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

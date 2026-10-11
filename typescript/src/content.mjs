// TypeScript 隙間ドリルの中身。
// コードを含む問題と例は verify.mjs が TypeScript 7 / 5 の両方でコンパイル・実行して確かめる。
// - tf:   「型チェックを通る？」。正解は expect（ok / error）から自動で決まる
// - type: 「型は？」。選択肢それぞれを Equal で検査し、正解だけが通ることを確かめる
// - out:  「表示は？」。実際に実行した出力と正解の選択肢を突き合わせる
// - pick: 概念の問題（コードの検証なし）

const tf = (id, code, expect, explain, opts = {}) => ({ id, kind: "tf", q: opts.q ?? "この TypeScript は型チェックを通る？", code, expect, codes: opts.codes, explain });
const typeQ = (id, q, code, expr, choices, answer, explain, opts = {}) => ({ id, kind: "type", q, code, expr, choices, answer, explain, insertAfter: opts.insertAfter, wrap: opts.wrap });
const outQ = (id, q, code, choices, answer, explain, opts = {}) => ({ id, kind: "out", q, code, choices, answer, explain, expect: opts.expect, throws: opts.throws });
const pick = (id, q, choices, answer, explain, opts = {}) => ({ id, kind: "pick", q, code: opts.code, choices, answer, explain });

export const units = [
  {
    id: "u1",
    title: "TypeScript とは",
    min: 5,
    lead: "TypeScript は JavaScript に「型」を足した言語。書いた `.ts` は、型を取り除いた JavaScript に変換されて動く。型チェックは変換とは別に、`tsc` やエディタが行う。",
    points: [
      "型をチェックするのは `tsc`（TypeScript のコンパイラ）やエディタ。実際に動くのは JavaScript。",
      "型は実行時には残らない（型消去）。実行中に「この値は User 型か」を TypeScript の型で調べることはできない。",
      "JavaScript の文法は基本的にそのまま使える。TypeScript はそこに型の書き方を足したもの。JS の知識はそのまま活きる。",
      "`tsc` は既定では、型エラーがあっても JavaScript を出力する（`noEmitOnError` が既定で false のため）。現場のプロジェクトで、型エラーをどこで止めているか（ビルド・CI など）を確認しておくとよい。",
    ],
    swift: [
      ["型エラーがあると実行ファイルが作られない", "型チェックと JS への変換は別の工程"],
      ["実行時も型の情報を持つ（`is` / `as?` で調べられる）", "型は実行時に消える。調べるのは `typeof` などの JS の機能"],
    ],
    examples: [
      {
        title: "型が合わないとエラー",
        code: `let count: number = 1;
count = "2"; // エラー: string は number に入らない`,
        errors: [2322],
      },
    ],
    questions: [
      pick("u1-1", "TypeScript の型について正しいものは？", [
        "実行前のチェックに使われ、実行される JavaScript には残らない",
        "実行時にも残っていて、User などの型名を取り出せる",
        "型を書かないと実行できない",
        "型が合わないと、必ず JavaScript が出力されない",
      ], 0, "型はチェックのためのもので、出力される JavaScript からは消える。型を書かなくても推論されるし、型エラーがあっても `tsc` は既定で JS を出力する。"),
      tf("u1-2", `let price = 100;
price = "120円";`, "error", "`price` は初期値の 100 から `number` と推論される。あとから文字列は入れられない。JavaScript なら何も言われずに動いてしまう書き方。"),
      tf("u1-3", `function add(a: number, b: number) {
  return a + b;
}
add(1, "2");`, "error", "引数 `b` は `number`。`\"2\"` は string なのでエラー。JavaScript だと `1 + \"2\"` は文字列 `\"12\"` になり、気づきにくいバグになる。"),
      tf("u1-4", `const total: number = 1 + 2;
console.log(total);`, "ok", "`1 + 2` は number なので、`number` と書いた変数に入る。"),
      pick("u1-5", "`.ts` ファイルを Node.js やブラウザで動かすとき、実際に実行されるのは？", [
        "型を取り除いた JavaScript",
        "型の情報ごと実行される TypeScript",
        "型チェックに通った部分だけ",
      ], 0, "最近の Node.js は `.ts` を直接実行できるが、これも型の部分を取り除いて JavaScript として動かしているだけで、型チェックはしない。チェックは `tsc` やエディタの役目。"),
    ],
  },

  {
    id: "u2",
    title: "現場で読む JavaScript",
    min: 8,
    lead: "TypeScript のコードの大半は JavaScript の書き方。ここで詰まると型の話まで進めないので、現場のコードによく出る書き方をおさらいする。",
    points: [
      "変数は `const`（再代入しない）と `let`（再代入する）。`var` は古い書き方。",
      "比較は `===` を使う。`==` は型を変換してから比べるので `\"1\" == 1` が true になる。",
      "アロー関数 `(a, b) => a + b`。本体が式1つなら `return` を省ける。",
      "分割代入 `const { name, age } = user` / `const [first, second] = list`。",
      "スプレッド `...` は配列やオブジェクトを展開する。`{ ...user, age: 31 }` は元の `user` を変えずに、一部を差し替えた新しいオブジェクトを作る。",
      "配列のメソッド: `map`（変換）、`filter`（絞り込み）、`find`（最初の1件。なければ undefined）、`some`（1つでも当てはまるか）、`reduce`（集計）。",
      "`?.` は途中が null / undefined なら undefined を返す。`??` は左が null / undefined のときだけ右を使う。`||` は左が `0` や `\"\"` でも右を使う。",
    ],
    swift: [
      ["`let`（定数）", "`const`"],
      ["`var`（変数）", "`let`　※名前が逆になっているので注意"],
      ["`let` の struct は中身も変えられない", "`const` でもオブジェクトの中身は変えられる（再代入だけ禁止）"],
      ["`reduce(0) { $0 + $1 }`", "`reduce((sum, n) => sum + n, 0)`（初期値が後ろ）"],
    ],
    examples: [
      {
        title: "よく出る書き方",
        code: `const user = { name: "Ken", age: 30 };
const { name } = user;              // name は "Ken"
const older = { ...user, age: 31 }; // user は変わらない

const nums = [1, 2, 3, 4];
const evens = nums.filter((n) => n % 2 === 0);     // [2, 4]
const total = nums.reduce((sum, n) => sum + n, 0); // 10
const message = \`\${name} さんは \${older.age} 歳\`;  // テンプレート文字列`,
      },
    ],
    questions: [
      outQ("u2-1", "表示されるのは？", `const options: { name: string; age?: number } = { name: "Ken" };
const { name, age = 20 } = options;
console.log(age);`, ["20", "undefined", "Ken", "null"], 0, "分割代入の `= 20` は、値が undefined のときに使われる既定値。`age` が無いので 20。"),
      outQ("u2-2", "表示されるのは？", `const a = [1, 2, 3];
const b = [...a, 4];
b.push(5);
console.log(a.length, b.length);`, ["3 5", "5 5", "4 5", "3 4"], 0, "`[...a, 4]` は新しい配列を作る。`b` に push しても `a` は変わらない。"),
      outQ("u2-3", "表示されるのは？", `const nums = [1, 2, 3, 4, 5];
const result = nums.filter((n) => n % 2 === 1).map((n) => n * 10);
console.log(JSON.stringify(result));`, ["[10,30,50]", "[20,40]", "[10,20,30,40,50]", "[1,3,5]"], 0, "`filter` で奇数 1, 3, 5 を残し、`map` で 10 倍する。"),
      outQ("u2-4", "`show(0)` で表示されるのは？", `function show(count: number) {
  console.log(count || 10, count ?? 10);
}
show(0);`, ["10 0", "0 0", "10 10", "0 10"], 0, "`||` は左が falsy（0, \"\", false, null, undefined など）なら右を使うので 10。`??` は左が null / undefined のときだけ右を使うので 0 のまま。数値や文字列の既定値には `??` が安全。"),
      outQ("u2-5", "表示されるのは？", `const user = { name: "Ken", age: 30 };
const updated = { ...user, age: 31 };
console.log(user.age, updated.age);`, ["30 31", "31 31", "30 30", "31 30"], 0, "スプレッドで作ったのは別のオブジェクト。元の `user` は 30 のまま。React などで状態を更新するときによく使う書き方。"),
      pick("u2-6", "関数の中で定数を宣言するとき（Swift の `let total = 1`）、TypeScript で使うキーワードは？", ["const", "let", "var", "readonly"], 0, "変数の宣言では、Swift の `let` は TS の `const`、Swift の `var` は TS の `let`。同じ `let` で意味が違うので取り違えやすい。`readonly` はプロパティに付けるもので、変数の宣言には使えない（struct のプロパティの `let` に当たるのが `readonly`。単元4）。"),
    ],
  },

  {
    id: "u3",
    title: "基本の型と型推論",
    min: 7,
    lead: "型は全部に書く必要はない。初期値から推論されるので、書くのは推論できない所と、意図をはっきりさせたい所。",
    points: [
      "基本の型は `string` `number` `boolean`。`number` は整数と小数を区別しない。",
      "配列は `string[]`（`Array<string>` とも書ける）。長さと並びが決まっているものはタプル `[string, number]`。",
      "`let count = 0` と書けば `count` は `number` と推論される。",
      "`const` で文字列や数値を宣言すると、型はその値そのもの（リテラル型）になる。`const mode = \"dark\"` の型は `\"dark\"`。`let` なら `string`。",
      "`any` は何でも入り、型チェックが効かなくなる。strict 設定では、引数の型を書かずに暗黙の any になるとエラーになる。",
    ],
    swift: [
      ["`Int` / `Double`", "`number`（区別なし）"],
      ["`String` / `Bool`", "`string` / `boolean`"],
      ["`[String]`", "`string[]`"],
      ["`(String, Int)`", "`[string, number]`（タプル）"],
    ],
    examples: [
      {
        title: "推論に任せる",
        code: `let count = 0;          // number
const mode = "dark";    // "dark"（リテラル型）
let theme = "dark";     // string
const tags = ["a", "b"]; // string[]

function double(n: number) { // 引数は書く。戻り値は number と推論される
  return n * 2;
}`,
      },
    ],
    questions: [
      typeQ("u3-1", "`count` の型は？", `let count = 10;`, "typeof count", ["number", "10", "any", "int"], 0, "`let` は再代入できるので、値 10 そのものではなく `number` になる。`int` という型は TypeScript にない。"),
      typeQ("u3-2", "`label` の型は？", `const label = "OK";`, "typeof label", ["\"OK\"", "string", "any", "String"], 0, "`const` は再代入できないので、値そのものの型 `\"OK\"` になる。`String`（大文字）はラッパーオブジェクトの型で、普段は使わない。"),
      typeQ("u3-3", "`items` の型は？", `const items = [1, "two", 3];`, "typeof items", ["(string | number)[]", "[number, string, number]", "any[]", "number[]"], 0, "配列リテラルはタプルではなく配列として推論される。中身の型をまとめた `(string | number)[]` になる。"),
      tf("u3-4", `let rate: number = 0.5;
rate = 3;`, "ok", "`number` は整数も小数も同じ型。Swift のように Int と Double を変換する必要はない。"),
      tf("u3-5", `function double(n) {
  return n * 2;
}`, "error", "引数 `n` に型がないので暗黙の any になる。strict 設定（`noImplicitAny`）ではエラー。`n: number` と書く。"),
      tf("u3-6", `const pair: [string, number] = ["age", 30, true];`, "error", "タプル `[string, number]` は要素が2つと決まっているので、3つ書くとエラー。ただし、あとから `pair.push(3)` で足すことは止められない（`readonly [string, number]` にすれば止まる）。"),
    ],
  },

  {
    id: "u4",
    title: "オブジェクトの型",
    min: 8,
    lead: "オブジェクトの形に名前を付けるのが `type` と `interface`。現場のコードで一番よく見る型の書き方。",
    points: [
      "`type User = { id: number; name: string }` または `interface User { id: number; name: string }`。",
      "`?` を付けたプロパティは省略できる。読むと「その型 か undefined」として扱われる。",
      "`readonly` を付けると再代入がエラーになる（型チェックの上だけの制限）。",
      "オブジェクトの形を表すだけなら `type` と `interface` はほぼ同じように使える。拡張は interface なら `extends`、type なら `&`。違いは、interface は同じ名前で2回書くと宣言が合体すること、type は `string | number` のような union にも名前を付けられること。どちらを使うかは現場の既存コードに合わせる。",
      "オブジェクトリテラルを型付きの変数に直接書くと、型にないプロパティはエラーになる（余分なプロパティのチェック）。",
    ],
    swift: [
      ["`struct User { let id: Int; var email: String? }`", "`type User = { readonly id: number; email?: string }`"],
      ["`protocol`", "`interface`（ただし準拠の宣言は不要。単元9で）"],
    ],
    examples: [
      {
        title: "type と interface",
        code: `type User = {
  id: number;
  name: string;
  email?: string;            // 省略できる
  readonly createdAt: string; // 再代入できない
};

interface Admin extends User { // interface は extends で拡張できる
  role: "admin";
}

const admin: Admin = { id: 1, name: "Ken", createdAt: "2026-10-11", role: "admin" };`,
      },
    ],
    questions: [
      tf("u4-1", `type User = { id: number; name: string };
const u: User = { id: 1 };`, "error", "`name` は必須なのに無い。省略したいなら `name?: string` にする。"),
      tf("u4-2", `type User = { id: number; name: string; email?: string };
const u: User = { id: 1, name: "Ken" };`, "ok", "`email?` は省略できる。"),
      tf("u4-3", `type User = { id: number; name: string; email?: string };
function mailLength(u: User) {
  return u.email.length;
}`, "error", "`email` は `string | undefined`。undefined の可能性があるまま `.length` は使えない。`u.email?.length` や、先に undefined を確かめる書き方にする。"),
      tf("u4-4", `type User = { readonly id: number; name: string };
const u: User = { id: 1, name: "Ken" };
u.id = 2;`, "error", "`readonly` のプロパティには再代入できない。`name` なら変えられる。"),
      tf("u4-5", `type User = { id: number; name: string };
const u: User = { id: 1, name: "Ken", age: 30 };`, "error", "オブジェクトリテラルを直接書くと、型に無い `age` はエラー（打ち間違いを見つけるためのチェック）。"),
      pick("u4-6", "`type` と `interface` の違いとして正しいものは？", [
        "interface は同じ名前で2回書くと、宣言が合体する",
        "type は実行時にも残る",
        "interface にはメソッドを書けない",
        "type ではオブジェクトの形を表せない",
      ], 0, "どちらも型なので実行時には残らない。interface にもメソッドは書けるし、type でもオブジェクトの形は表せる。合体（宣言のマージ）は interface だけの性質。"),
    ],
  },

  {
    id: "u5",
    title: "関数の型",
    min: 7,
    lead: "関数は引数に型を書き、戻り値は推論に任せることが多い。コールバックは引数の型まで推論される。",
    points: [
      "引数には型を書く。戻り値は推論されるが、`function f(): string` と書くと、中身が合わないときにその場でエラーになる。",
      "省略できる引数は `b?: number`（中では `number | undefined`）。既定値つきの `b = 1` なら中では `number`。",
      "関数そのものの型は `(value: number) => string` と書く。",
      "`map` のコールバックのように、渡す先の型が決まっていれば引数の型は書かなくてよい（文脈から推論される）。",
      "戻り値がない関数は `void`。",
      "Swift の引数ラベルはない。名前付きで渡したいときは、オブジェクト1つを受け取って分割代入する。",
    ],
    swift: [
      ["`func greet(name: String) -> String`", "`function greet(name: string): string`"],
      ["`(Int) -> String`", "`(value: number) => string`"],
      ["引数ラベル `create(name: \"Ken\", age: 30)`", "オブジェクトで渡す `create({ name: \"Ken\", age: 30 })`"],
    ],
    examples: [
      {
        title: "関数の書き方",
        code: `function greet(name: string, greeting = "こんにちは"): string {
  return greeting + "、" + name;
}

type Formatter = (value: number) => string;
const yen: Formatter = (value) => value.toLocaleString() + "円"; // value は number

function createUser({ name, age }: { name: string; age: number }) {
  return { name, age };
}
createUser({ name: "Ken", age: 30 });`,
      },
    ],
    questions: [
      tf("u5-1", `function getTitle(): string {
  return 42;
}`, "error", "戻り値を `string` と明示しているので、42 を返すとその場でエラーになる。"),
      tf("u5-2", `function area(width: number, height: number) {
  return width * height;
}
area(10);`, "error", "引数は2つ必要。JavaScript なら `height` が undefined のまま動き、結果は NaN になる。"),
      tf("u5-3", `function addTax(price: number, rate?: number) {
  return price * (1 + rate);
}`, "error", "`rate?` は `number | undefined`。undefined の可能性があるまま計算に使えない。既定値 `rate = 0.1` にすれば `number` になる。"),
      typeQ("u5-4", "関数の中での `rate` の型は？", `function addTax(price: number, rate = 0.1) {
  return price * (1 + rate);
}`, "typeof rate", ["number", "number | undefined", "0.1", "any"], 0, "既定値があると、中では必ず値が入っているので `number`。呼ぶ側は `addTax(1000)` と省略できる。", { insertAfter: "function addTax(price: number, rate = 0.1) {" }),
      typeQ("u5-5", "`labels` の型は？", `const nums = [1, 2, 3];
const labels = nums.map((n) => n.toFixed(1));`, "typeof labels", ["string[]", "number[]", "any[]", "(string | number)[]"], 0, "`n` は `number` と推論され、`toFixed` は string を返すので `string[]`。"),
      typeQ("u5-6", "`judge` の戻り値の型は？", `function judge(score: number) {
  if (score >= 60) return "pass";
  return "fail";
}`, "ReturnType<typeof judge>", ["\"pass\" | \"fail\"", "string", "boolean", "void"], 0, "返しうる値が2つの文字列なので、その union になる。`ReturnType<typeof judge>` は関数の戻り値の型を取り出す書き方。"),
    ],
  },

  {
    id: "u6",
    title: "union 型と絞り込み",
    min: 8,
    lead: "`A | B` は「A か B のどちらか」。使う前に条件分岐でどちらかに絞り込むと、その中では絞った型として扱える。",
    points: [
      "`string | number` の値に使えるのは、両方に共通する操作だけ。",
      "文字列リテラルの union `\"draft\" | \"published\"` は、Swift の（値を持たない）enum の代わりによく使われる。",
      "絞り込み（narrowing）に使う書き方: `typeof x === \"string\"`、`x === \"draft\"`、`\"meow\" in pet`、`Array.isArray(x)`、`x instanceof Date`。",
      "if・switch・早めの return の流れを TypeScript が追って、自動で型を狭める。Swift の `if let` / `guard let` に近い感覚。",
    ],
    swift: [
      ["`enum Status { case draft, published }`", "`type Status = \"draft\" | \"published\"`"],
      ["`if let` / `guard let` で型が変わる", "if や return の流れで型が狭まる"],
    ],
    examples: [
      {
        title: "絞り込み",
        code: `type Status = "draft" | "published" | "archived";

function label(status: Status) {
  if (status === "draft") return "下書き";
  if (status === "published") return "公開中";
  return "アーカイブ"; // ここでは status は "archived"
}

function toText(value: string | number) {
  if (typeof value === "number") {
    return value.toFixed(2); // number として使える
  }
  return value.toUpperCase(); // 残りは string
}`,
      },
    ],
    questions: [
      tf("u6-1", `function size(x: string | string[]) {
  return x.length;
}`, "ok", "string にも配列にも `length` があるので、絞り込まなくても使える。共通の操作なら OK。"),
      tf("u6-2", `function upper(x: string | number) {
  return x.toUpperCase();
}`, "error", "`toUpperCase` は string にしかない。`typeof x === \"string\"` で絞り込んでから使う。"),
      tf("u6-3", `type Status = "draft" | "published";
let s: Status = "deleted";`, "error", "`Status` に入るのは 2 つの文字列だけ。打ち間違いもここで見つかる。"),
      typeQ("u6-4", "コメントの位置での `x` の型は？", `function f(x: string | number | boolean) {
  if (typeof x === "string") {
    return;
  }
  // ここでの x の型は？
}`, "typeof x", ["number | boolean", "string | number | boolean", "string", "never"], 0, "string なら return しているので、そこから先に来るのは number か boolean だけ。早めの return でも絞り込みは効く。", { insertAfter: "  // ここでの x の型は？" }),
      tf("u6-5", `type Cat = { meow(): void };
type Dog = { bark(): void };

function speak(pet: Cat | Dog) {
  if ("meow" in pet) {
    pet.meow();
  } else {
    pet.bark();
  }
}`, "ok", "`\"meow\" in pet` で Cat に絞り込まれ、else では Dog になる。"),
    ],
  },

  {
    id: "u7",
    title: "null と undefined",
    min: 9,
    lead: "Swift の Optional に当たるもの。strict 設定では、null や undefined が入りうるかを型で区別する。",
    points: [
      "strict 設定（`strictNullChecks`）では、`string` に null も undefined も入らない。入りうるなら `string | undefined` のように型に書く。",
      "JavaScript には「値がない」を表す値が `null` と `undefined` の2つある。現場のコードでどちらを使っているかを見ておく。",
      "`?.` と `??` は Swift とほぼ同じ感覚で使える。",
      "絞り込みは `if (x !== undefined)` や `if (x != null)`（`!=` は null と undefined の両方を弾く）。`if (x)` は `\"\"` や `0` も弾くので、文字列や数値では注意。",
      "`x!`（非 null アサーション）は Swift の強制アンラップに似ているが、実行時には何もしない。`x!` 自体では止まらず、undefined のままプロパティを読めばその場で TypeError、読まなければ undefined のまま先へ進む。",
      "`find` や `Map` の `get` の戻り値は `T | undefined`。一方、配列の `arr[0]` は既定では `T` のまま（`noUncheckedIndexedAccess` を有効にすると `T | undefined`）。",
    ],
    swift: [
      ["`String?`", "`string | undefined`（または `string | null`）"],
      ["`if let name { }`", "`if (name !== undefined) { }`"],
      ["`guard let name else { return }`", "`if (name === undefined) return;`"],
      ["`a?.b` / `a ?? b`", "`a?.b` / `a ?? b`（ほぼ同じ）"],
      ["`x!`（nil ならその場でクラッシュ）", "`x!`（実行時は何もしない。undefined のまま進む）"],
    ],
    examples: [
      {
        title: "Optional の扱い",
        code: `type User = { name: string; nickname?: string };

function displayName(user: User | undefined) {
  if (user === undefined) return "ゲスト"; // guard let の代わり
  return user.nickname ?? user.name;      // ここでは user は User
}`,
      },
    ],
    questions: [
      tf("u7-1", `let name: string = null;`, "error", "strict 設定では `string` に null は入らない。入れたいなら `string | null` と書く。"),
      tf("u7-2", `const users = [{ id: 1, name: "Ken" }];
const found = users.find((u) => u.id === 2);
console.log(found.name);`, "error", "`find` は見つからないと undefined を返すので、`found` は `{...} | undefined`。`found?.name` や、undefined を確かめてから使う。"),
      typeQ("u7-3", "`bio` の戻り値の型は？", `type User = { name: string; profile?: { bio: string } };
function bio(u: User) {
  return u.profile?.bio;
}`, "ReturnType<typeof bio>", ["string | undefined", "string", "string | null", "undefined"], 0, "`profile` が無ければ `?.` で undefined になるので、`string | undefined`。"),
      outQ("u7-4", "表示されるのは？", `function show(input: string | undefined) {
  console.log(JSON.stringify([input ?? "ゲスト", input || "ゲスト"]));
}
show("");`, ["[\"\",\"ゲスト\"]", "[\"ゲスト\",\"ゲスト\"]", "[\"\",\"\"]", "[\"ゲスト\",\"\"]"], 0, "空文字は undefined ではないので `??` はそのまま `\"\"`。`||` は空文字を falsy として右を使う。入力欄の値などで差が出る。"),
      outQ("u7-5", "実行するとどうなる？", `const settings = new Map<string, string>();
const theme = settings.get("theme")!;
console.log(theme);`, ["undefined と表示される", "実行時エラーで止まる", "型エラーになる", "空の文字列が表示される"], 0, "`!` は型の上で undefined を消すだけで、実行時には何もしない。Swift の強制アンラップと違い、ここでは止まらずに undefined のまま進む。", { expect: "undefined" }),
      typeQ("u7-6", "既定の設定で `first` の型は？", `const scores = [80, 90];
const first = scores[0];`, "typeof first", ["number", "number | undefined", "80", "any"], 0, "配列の添字アクセスは、既定では undefined を含まない。空の配列でも `number` と扱われる。tsconfig の `noUncheckedIndexedAccess` を有効にすると `number | undefined` になる。"),
    ],
  },

  {
    id: "u8",
    title: "判別可能な union",
    min: 8,
    lead: "Swift の「値を持つ enum」に当たる書き方。共通のタグ（よく `kind` や `type`）を持つオブジェクトの union で表す。",
    points: [
      "種類ごとに持つ値が違う型は、タグ付きのオブジェクトの union で書く。",
      "タグで switch や if をすると、その分岐の中では型が絞り込まれ、その種類のプロパティが使える。",
      "Swift の switch は網羅していないとコンパイルエラーだが、TypeScript の switch は網羅を強制しない。`never` 型の変数に入れる書き方で「書き漏れ」をエラーにできる。",
    ],
    swift: [
      ["`enum Result { case ok(Int); case error(String) }`", "`type Result = { kind: \"ok\"; value: number } | { kind: \"error\"; message: string }`"],
      ["switch の網羅は自動でチェック", "`never` を使って自分でチェックする"],
    ],
    examples: [
      {
        title: "読み込み状態",
        code: `type LoadState =
  | { kind: "loading" }
  | { kind: "success"; data: string[] }
  | { kind: "failure"; message: string };

function render(state: LoadState): string {
  switch (state.kind) {
    case "loading":
      return "読み込み中";
    case "success":
      return state.data.join(", "); // data が使える
    case "failure":
      return "エラー: " + state.message;
    default: {
      const unreachable: never = state; // case を書き忘れるとここでエラー
      return unreachable;
    }
  }
}`,
      },
    ],
    questions: [
      tf("u8-1", `type Result =
  | { kind: "ok"; value: number }
  | { kind: "error"; message: string };

function show(r: Result) {
  return r.value;
}`, "error", "`value` は ok のときにしか無い。`if (r.kind === \"ok\")` で絞り込んでから使う。"),
      tf("u8-2", `type Result =
  | { kind: "ok"; value: number }
  | { kind: "error"; message: string };

function show(r: Result) {
  if (r.kind === "ok") return r.value;
  return r.message;
}`, "ok", "if で ok に絞り込まれ、その後ろは error だけになる。"),
      tf("u8-3", `type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; size: number }
  | { kind: "triangle"; base: number; height: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle":
      return Math.PI * s.radius ** 2;
    case "square":
      return s.size ** 2;
    default: {
      const rest: never = s;
      return rest;
    }
  }
}`, "error", "triangle の case が無いので、default に triangle が来うる。`never` には何も入らないのでエラーになり、書き漏れに気づける。"),
      typeQ("u8-4", "triangle の case が無いこの関数の戻り値の型は？（型チェックは通る）", `type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; size: number }
  | { kind: "triangle"; base: number; height: number };

function label(s: Shape) {
  switch (s.kind) {
    case "circle":
      return "円";
    case "square":
      return "四角";
  }
}`, "ReturnType<typeof label>", ["\"円\" | \"四角\" | undefined", "\"円\" | \"四角\"", "string", "never"], 0, "網羅していなくてもエラーにならず、triangle のときは何も返さない（undefined）。戻り値の型を明示する（`: string`）か `never` を使うと、漏れをエラーにできる。"),
      pick("u8-5", "Swift の「値を持つ enum」を TypeScript で表す一般的な方法は？", [
        "共通のタグを持つオブジェクトの union",
        "enum キーワード",
        "class の継承",
        "any 型",
      ], 0, "TypeScript の `enum` が持てるのは、メンバーごとに固定の数値か文字列（Swift の raw value に当たるもの）だけで、関連値は持てない。種類ごとに違う値を持たせるなら、タグ付きの union を使う。"),
    ],
  },

  {
    id: "u9",
    title: "構造的型付け",
    min: 7,
    lead: "Swift との一番大きな違い。TypeScript は「名前」ではなく「形」で型が合うかを判断する。",
    points: [
      "必要なプロパティとその型（形）を持っていれば、その型に代入できる。これを構造的型付けという。",
      "Swift では `struct A: Proto` と宣言したものだけが Proto に合う。TypeScript では、class が interface を `implements` していなくても、形が合えば入る。",
      "別名を付けただけの型は区別されない。`type UserId = string` と `type PostId = string` はどちらも string なので、取り違えてもエラーにならない。",
      "余分なプロパティのエラーは、オブジェクトリテラルを直接書いたときだけ。一度変数に入れてから渡すと、多い分には通る。",
      "例外として、`private` や `#` のメンバーを持つ class は、形が同じでも別の class とは互換にならない。",
    ],
    swift: [
      ["`struct Pen: Named` と準拠を宣言する", "宣言しなくても形が合えば OK"],
      ["型の名前が違えば別の型", "名前が違っても形が同じなら同じ型"],
    ],
    examples: [
      {
        title: "形が合えば入る",
        code: `interface Point {
  x: number;
  y: number;
}

class Pixel { // implements Point とは書いていない
  x = 0;
  y = 0;
  color = "red";
}

const p: Point = new Pixel(); // 形が合うので OK`,
      },
    ],
    questions: [
      tf("u9-1", `interface Named {
  name: string;
}
class Product {
  name = "ペン";
  price = 120;
}
const n: Named = new Product();`, "ok", "`Product` は `name: string` を持っているので `Named` に入る。`implements Named` の宣言は要らない。"),
      tf("u9-2", `type UserId = string;
type PostId = string;

function deleteUser(id: UserId) {}

const postId: PostId = "post-1";
deleteUser(postId);`, "ok", "`UserId` も `PostId` も中身は string なので区別されない。ID の取り違えは型では防げない（防ぎたいときは「ブランド型」という書き方を使う）。"),
      tf("u9-3", `type Point = { x: number; y: number };
const p: Point = { x: 1, y: 2, z: 3 };`, "error", "オブジェクトリテラルを直接書いたので、余分な `z` がエラーになる。"),
      tf("u9-4", `type Point = { x: number; y: number };
const raw = { x: 1, y: 2, z: 3 };
const p: Point = raw;`, "ok", "変数経由だと余分なプロパティのチェックは働かない。必要な `x` と `y` があるので入る。"),
      tf("u9-5", `type Point = { x: number; y: number };
const raw = { x: 1 };
const p: Point = raw;`, "error", "足りない方はどこから渡してもエラー。`y` が無い。"),
    ],
  },

  {
    id: "u10",
    title: "ジェネリクス",
    min: 7,
    lead: "書き方は Swift とほぼ同じ `<T>`。呼ぶ側では多くの場合、引数から T が推論される。",
    points: [
      "`function first<T>(items: T[]): T | undefined` のように型の引数を取る。",
      "制約は `<T extends { id: number }>`（Swift の `<T: Proto>` や `where` に当たる）。構造的型付けなので、その形を持っていればよい。",
      "よく見るジェネリックな型: `Array<T>`（= `T[]`）、`Promise<T>`、`Map<K, V>`、`Record<K, V>`。",
    ],
    swift: [
      ["`func first<T>(_ items: [T]) -> T?`", "`function first<T>(items: T[]): T | undefined`"],
      ["`<T: Identifiable>`", "`<T extends { id: number }>`"],
      ["`[String: Int]`", "`Record<string, number>` や `Map<string, number>`"],
    ],
    examples: [
      {
        title: "ジェネリック関数",
        code: `function first<T>(items: T[]): T | undefined {
  return items[0];
}
const n = first([10, 20]);   // number | undefined
const s = first(["a", "b"]); // string | undefined

function byId<T extends { id: number }>(items: T[], id: number) {
  return items.find((item) => item.id === id);
}`,
      },
    ],
    questions: [
      typeQ("u10-1", "`flag` の型は？", `function first<T>(items: T[]): T | undefined {
  return items[0];
}
const flag = first([true, false]);`, "typeof flag", ["boolean | undefined", "boolean", "true | undefined", "unknown"], 0, "引数から T が `boolean` と推論され、戻り値は `boolean | undefined`。"),
      tf("u10-2", `function first<T>(items: T[]): T | undefined {
  return items[0];
}
first<string>([1, 2]);`, "error", "T を `string` と明示したので、引数は `string[]` でなければならない。"),
      tf("u10-3", `function byId<T extends { id: number }>(items: T[], id: number) {
  return items.find((item) => item.id === id);
}
byId([{ name: "Ken" }], 1);`, "error", "T は `{ id: number }` の形を持つ必要がある。`id` の無いオブジェクトは渡せない。"),
      typeQ("u10-4", "`apples` の型は？", `const stock = new Map<string, number>();
stock.set("apple", 3);
const apples = stock.get("apple");`, "typeof apples", ["number | undefined", "number", "3", "unknown"], 0, "`Map` の `get` はキーが無いと undefined を返すので、直前に set していても `number | undefined`。"),
      typeQ("u10-5", "既定の設定で `english` の型は？", `const scores: Record<string, number> = { math: 80 };
const english = scores.english;`, "typeof english", ["number", "number | undefined", "undefined", "any"], 0, "`Record<string, number>` は「どのキーでも number がある」という型なので `number` になる。実際に実行すると undefined。`Map` との違いに注意（`noUncheckedIndexedAccess` を有効にすると `number | undefined`）。"),
    ],
  },

  {
    id: "u11",
    title: "型から型を作る",
    min: 8,
    lead: "既存の型を組み替えて新しい型を作る道具。現場のコードで `Partial<User>` のような書き方を見たらこれ。",
    points: [
      "`Partial<T>`: 全部を省略可に。`Required<T>`: 全部を必須に。`Readonly<T>`: 全部を readonly に。",
      "`Pick<T, \"a\" | \"b\">`: 一部だけ取り出す。`Omit<T, \"a\">`: 一部を除く。",
      "`Record<K, V>`: キーが K、値が V のオブジェクト。",
      "`keyof T` は T のプロパティ名の union。",
      "型の位置で `typeof 変数` と書くと、その変数の型を取り出せる（実行時の `typeof` 演算子とは別物）。",
      "`as const` を付けると、値がリテラル型の readonly になる。配列から union 型を作るときによく使う。",
    ],
    examples: [
      {
        title: "組み替えの例",
        code: `type User = { id: number; name: string; email: string };

type UserUpdate = Partial<Omit<User, "id">>; // id 以外を、全部省略可に
const patch: UserUpdate = { name: "新しい名前" };

type UserKey = keyof User; // "id" | "name" | "email"

const ROLES = ["admin", "editor", "viewer"] as const;
type Role = (typeof ROLES)[number]; // "admin" | "editor" | "viewer"`,
      },
    ],
    questions: [
      tf("u11-1", `type User = { id: number; name: string; email: string };
const draft: Partial<User> = {};`, "ok", "`Partial` で全部が省略可になるので、空のオブジェクトも入る。"),
      tf("u11-2", `type User = { id: number; name: string; email: string };
const summary: Pick<User, "id" | "name"> = {
  id: 1,
  name: "Ken",
  email: "ken@example.com",
};`, "error", "`Pick` で取り出したのは `id` と `name` だけ。リテラルで `email` を書くと余分なプロパティでエラー。"),
      typeQ("u11-3", "`UserKey` は？", `type User = { id: number; name: string; email: string };
type UserKey = keyof User;`, "UserKey", ["\"id\" | \"name\" | \"email\"", "string", "User", "[\"id\", \"name\", \"email\"]"], 0, "`keyof` はプロパティ名の文字列リテラルの union を返す。"),
      typeQ("u11-4", "`Config` は？", `const config = { theme: "dark", fontSize: 14 };
type Config = typeof config;`, "Config", ["{ theme: string; fontSize: number }", "{ theme: \"dark\"; fontSize: 14 }", "\"config\"", "object"], 0, "オブジェクトのプロパティは後から変えられるので、`\"dark\"` ではなく `string` に広がる。"),
      typeQ("u11-5", "`as const` を付けると `Config` は？", `const config = { theme: "dark", fontSize: 14 } as const;
type Config = typeof config;`, "Config", ["{ readonly theme: \"dark\"; readonly fontSize: 14 }", "{ theme: string; fontSize: number }", "{ readonly theme: string; readonly fontSize: number }", "{ theme: \"dark\"; fontSize: 14 }"], 0, "`as const` は値そのものの型にして、全部を readonly にする。"),
      tf("u11-6", `type User = { id: number; name: string };
const user: Readonly<User> = { id: 1, name: "Ken" };
user.name = "Taro";`, "error", "`Readonly<User>` は全プロパティが readonly。"),
    ],
  },

  {
    id: "u12",
    title: "any・unknown・as",
    min: 8,
    lead: "型チェックを弱める道具。現場のコードで見かけたら「ここは型が守ってくれない」という目印になる。",
    points: [
      "`any` は型チェックを止める。何でも入り、何でも呼べる。間違いは実行するまで分からず、any から取り出した値も any として広がる。",
      "`unknown` も何でも入るが、使う前に絞り込みが必要。外から来た値は unknown で受けると安全。",
      "`JSON.parse` の戻り値は `any`。そのまま使うと型チェックが効かない。",
      "`値 as 型` は型アサーション。コンパイラに「この型として扱って」と伝えるだけで、実行時の変換もチェックもしない。Swift の `as?`（失敗なら nil）や `as!`（失敗ならクラッシュ）とは違う。",
      "明らかに無関係な型への `as` はエラーになるが、`as unknown as 型` と2段にすると通ってしまう。見かけたら要注意。",
      "API のレスポンスに型を付けても、中身が本当にその形かは保証されない。実行時に確かめたいときは zod などの検証ライブラリを使う。",
    ],
    swift: [
      ["`Any`（使う前にキャストが要る）", "`unknown`（使う前に絞り込みが要る）"],
      ["対応なし", "`any`（チェックを止める）"],
      ["`as?` / `as!`（実行時に確かめる）", "`as`（確かめない）"],
    ],
    examples: [
      {
        title: "unknown を絞り込む",
        code: `const raw: unknown = JSON.parse('{"name":"Ken"}');

if (typeof raw === "object" && raw !== null && "name" in raw) {
  console.log(raw.name); // 絞り込んだので使える
}`,
      },
    ],
    questions: [
      tf("u12-1", `const v: unknown = "hello";
v.toUpperCase();`, "error", "unknown は、絞り込むまでプロパティを読んだりメソッドを呼んだりできない（代入や `===` での比較はできる）。`if (typeof v === \"string\")` の中なら使える。"),
      outQ("u12-2", "このコードについて正しいのは？", `const v: any = 123;
v.toUpperCase();`, ["型チェックは通るが、実行するとエラーになる", "型チェックでエラーになる", "型チェックも通り、正常に動く", "123 が文字列に変換される"], 0, "any なので型チェックは何も言わない。実行すると number に toUpperCase は無いので TypeError で止まる。", { throws: "TypeError" }),
      outQ("u12-3", "表示されるのは？", `const input = "42";
const n = input as unknown as number;
console.log(typeof n);`, ["string", "number", "undefined", "object"], 0, "`as` は型の上で扱いを変えるだけで、値は変換されない。中身は文字列の \"42\" のまま。数値にしたいなら `Number(input)`。"),
      tf("u12-4", `const n = "42" as number;`, "error", "string と number は重なりが無いので、直接の `as` はエラーになる。`as unknown as number` と2段にすると通ってしまうが、値は変わらない。"),
      typeQ("u12-5", "`data` の型は？", `const data = JSON.parse('{"id":1}');`, "typeof data", ["any", "unknown", "{ id: number }", "object"], 0, "`JSON.parse` の戻り値は any。中身を TypeScript は知らない。unknown で受けて絞り込むか、検証してから使う。"),
      pick("u12-6", "API のレスポンスに `as User` を付けた。正しい説明は？", [
        "実際の形が違っても型チェックは通り、問題は実行時に出る",
        "形が違えば、その場で例外が投げられる",
        "形が違えば、User の形に変換される",
        "形が違えば、型チェックでエラーになる",
      ], 0, "`as` はチェックも変換もしない。サーバーの仕様が変わってプロパティ名が変わっても、型チェックは通ってしまう。"),
    ],
  },

  {
    id: "u13",
    title: "Promise と async/await",
    min: 8,
    lead: "書き方は Swift の async/await に近い。違いは、戻り値が `Promise<T>` という型になることと、失敗しうるかどうかが型に出ないこと。",
    points: [
      "`async` 関数の戻り値の型は必ず `Promise<T>`。`return 3` なら `Promise<number>`。",
      "`await` を付けると中身の `T` が取り出せる。付け忘れても、戻り値を使っていれば型エラーで気づけることが多い。ただし `save();` のように戻り値を使わない呼び出しで忘れても、型エラーにならない（ESLint の `no-floating-promises` というルールで見つけられる）。",
      "並べて待つなら `Promise.all([a(), b()])`。結果はタプルとして型が付く。",
      "`catch (e)` の `e` は strict 設定では `unknown`。`e instanceof Error` で絞り込んでから `e.message` を使う。",
      "Swift の `throws` のように「投げるかどうか」は型に出ない。どの関数が失敗しうるかは型からは分からない。",
      "Promise は作った時点で動き始める（`await` しなくても処理は実行される）。",
    ],
    swift: [
      ["`func load() async throws -> User`", "`async function load(): Promise<User>`（throws は型に出ない）"],
      ["`try await load()`", "`await load()`（try は try/catch で囲む）"],
      ["`async let` で並べて待つ", "`Promise.all([...])`"],
    ],
    examples: [
      {
        title: "API を呼ぶ",
        code: `type User = { id: number; name: string };

async function fetchUser(id: number): Promise<User> {
  const res = await fetch("/api/users/" + id);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return (await res.json()) as User; // json() はブラウザの型定義では Promise<any>。as は検証しない
}

async function main() {
  try {
    const [a, b] = await Promise.all([fetchUser(1), fetchUser(2)]);
    console.log(a.name, b.name);
  } catch (e) {
    if (e instanceof Error) console.log(e.message);
  }
}`,
      },
    ],
    questions: [
      typeQ("u13-1", "`getCount` の戻り値の型は？", `async function getCount() {
  return 3;
}`, "ReturnType<typeof getCount>", ["Promise<number>", "number", "Promise<3>", "Promise<void>"], 0, "async 関数は必ず Promise を返す。中身は `number` に広がる。"),
      tf("u13-2", `async function getCount() {
  return 3;
}
async function main() {
  const count = getCount();
  console.log(count + 1);
}`, "error", "`await` を忘れているので `count` は `Promise<number>`。Promise に + 1 はできない。`const count = await getCount()` にする。"),
      tf("u13-3", `async function main() {
  try {
    await Promise.reject(new Error("失敗"));
  } catch (e) {
    console.log(e.message);
  }
}`, "error", "strict 設定では `e` は unknown。何が投げられるかは型から分からないので、`if (e instanceof Error)` で絞り込む。"),
      outQ("u13-4", "表示される順番は？", `console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");`, ["A → D → C → B", "A → B → C → D", "A → D → B → C", "A → C → D → B"], 0, "同期の処理（A, D）が先に全部動く。そのあと Promise の続き（C）が、setTimeout（B）より先に動く。0 ミリ秒でも setTimeout は後回し。"),
      typeQ("u13-5", "`b` の型は？", `async function main() {
  const [a, b] = await Promise.all([Promise.resolve(1), Promise.resolve("x")]);
}`, "typeof b", ["string", "number", "Promise<string>", "string | number"], 0, "`Promise.all` に配列を渡すと、結果は同じ並びのタプルになる。2番目は `string`。", { insertAfter: "  const [a, b] = await Promise.all([Promise.resolve(1), Promise.resolve(\"x\")]);" }),
    ],
  },

  {
    id: "u14",
    title: "モジュールと現場コードの読み方",
    min: 7,
    lead: "最後は、現場のプロジェクトを開いたときに出てくるもの。ファイルのつながりと設定ファイルの見方。",
    points: [
      "ファイルの外から使えるのは `export` したものだけ。`export default` は1ファイルに1つで、`import` 側が好きな名前を付けられる。",
      "`import type { User } from \"./types\"` は型だけを読み込む書き方。出力される JavaScript からは消える。",
      "`tsconfig.json` がプロジェクトの設定。まず `strict` を見る（`strictNullChecks` や `noImplicitAny` などをまとめて有効にする設定）。TypeScript 6.0 以降は書かなくても strict が有効だが、5.x では `\"strict\": true` と書かないと無効。このドリルは strict が有効な前提で作っている。",
      "`.d.ts` は型の情報だけを書いたファイル。JavaScript で書かれたライブラリに型を付けるもので、`@types/〇〇` というパッケージで入れることが多い。",
      "`enum` は TypeScript 独自の機能で、型だけでなく実行時のオブジェクトも作る（型が消えるという原則の例外）。そのため、Node.js が `.ts` を型を取り除くだけで直接実行する方式では enum は動かない。現場によっては enum の代わりに文字列リテラルの union を使う。",
      "VS Code では、変数にマウスを乗せると型が表示され、F12 で定義へ移動できる。読むときの一番の味方。",
    ],
    swift: [
      ["同じモジュール内は import 不要", "ファイルごとに export / import が必要"],
      ["`public` / `internal`", "`export` したものだけが外から見える"],
    ],
    examples: [
      {
        title: "export と import",
        files: {
          "types.ts": `export type User = { id: number; name: string };
export const MAX_USERS = 100;`,
          "main.ts": `import type { User } from "./types";
import { MAX_USERS } from "./types";

export default function canAdd(users: User[]): boolean {
  return users.length < MAX_USERS;
}`,
        },
        code: `// types.ts
export type User = { id: number; name: string };
export const MAX_USERS = 100;

// user-service.ts
import type { User } from "./types";
import { MAX_USERS } from "./types";

export default function canAdd(users: User[]): boolean {
  return users.length < MAX_USERS;
}`,
      },
    ],
    questions: [
      pick("u14-1", "`import type { User } from \"./types\"` について正しいものは？", [
        "型だけを読み込み、出力される JavaScript からは消える",
        "User を実行時の値として使えるようにする",
        "types.ts の中身を全部読み込む",
        "User の型をコピーして新しい型を作る",
      ], 0, "型は実行時に存在しないので、型だけの import は出力から消える。値（関数や定数）は通常の import で読み込む。"),
      outQ("u14-2", "表示されるのは？", `enum Color {
  Red,
  Green,
  Blue,
}
console.log(Color.Green, Color[2]);`, ["1 Blue", "Green Blue", "undefined undefined", "1 2"], 0, "数値の enum は 0 から番号が振られ、実行時のオブジェクトとして残る。番号から名前を引く逆引きもできる。"),
      tf("u14-3", `import plus from "./math";
console.log(plus(1, 2));`, "ok", "`export default` されたものは、import 側で好きな名前（ここでは plus）を付けられる。", { q: "math.ts が `export default function add(a: number, b: number) { return a + b; }` のとき、この main.ts は型チェックを通る？" }),
      pick("u14-4", "tsconfig.json の `\"strict\": true` について正しいものは？", [
        "strictNullChecks や noImplicitAny など、厳しいチェックをまとめて有効にする",
        "型エラーがあると JavaScript を出力しなくなる",
        "実行時にも型をチェックするようになる",
        "any 型を書くとエラーになる",
      ], 0, "strict は複数のチェックをまとめて有効にする設定。出力を止めるのは `noEmitOnError`。明示的に書いた `any` はエラーにならない（暗黙の any がエラーになる）。"),
      pick("u14-5", "`.d.ts` ファイルとは？", [
        "型の情報だけを書いたファイル",
        "テスト用のファイル",
        "TypeScript をコンパイルした結果の JavaScript",
        "設定ファイル",
      ], 0, "中身は型の宣言だけで、実行されるコードは入らない。JavaScript のライブラリに型を付けるために使う。"),
    ],
  },
];

// u14-3 は math.ts を一緒にコンパイルする
export const extraFiles = {
  "u14-3": {
    "math.ts": `export default function add(a: number, b: number) {
  return a + b;
}`,
  },
};

export const cheatsheet = units.flatMap((u) => (u.swift ?? []).map(([swift, ts]) => ({ unit: u.id, title: u.title, swift, ts })));

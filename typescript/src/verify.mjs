// content.mjs の全コードを TypeScript 7 と 5 の両方で型チェックし、出力の問題は実行して確かめる。
// 1つでも食い違えば exit 1。結果（実際のエラーメッセージと出力）は verified.json に書き、build.mjs が画面に載せる。
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { units, extraFiles } from "./content.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const WORK = join(ROOT, ".verify");
const COMPILERS = {
  ts7: join(ROOT, "node_modules/typescript/bin/tsc"),
  ts5: join(ROOT, "node_modules/ts5/bin/tsc"),
};
const COMPILER_OPTIONS = {
  strict: true,
  target: "es2022",
  module: "esnext",
  moduleResolution: "bundler",
  moduleDetection: "force",
  lib: ["es2022", "dom"],
  types: [],
  skipLibCheck: true,
  pretty: false,
};
const PRELUDE = `export {};
declare global {
  type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
}
`;

const problems = [];
const fail = (msg) => problems.push(msg);

// ---- 検査する単位（job）を組み立てる ----
const jobs = []; // { key, files, expect: "ok"|"error", codes?, owner, choice? }
for (const u of units) {
  u.examples?.forEach((ex, i) => {
    jobs.push({ key: `${u.id}-ex${i}`, owner: `${u.id}-ex${i}`, files: ex.files ?? { "main.ts": ex.code }, expect: ex.errors ? "error" : "ok", codes: ex.errors });
  });
  for (const q of u.questions) {
    if (q.choices) {
      if (q.answer < 0 || q.answer >= q.choices.length) fail(`${q.id}: answer が範囲外`);
      if (new Set(q.choices).size !== q.choices.length) fail(`${q.id}: 選択肢が重複`);
    }
    if (q.kind === "tf") {
      jobs.push({ key: q.id, owner: q.id, files: { "main.ts": q.code, ...(extraFiles[q.id] ?? {}) }, expect: q.expect, codes: q.codes });
    } else if (q.kind === "out") {
      jobs.push({ key: q.id, owner: q.id, files: { "main.ts": q.code }, expect: "ok", run: true });
    } else if (q.kind === "type") {
      q.choices.forEach((choice, k) => {
        const assertion = `const __check: Equal<${q.expr}, ${choice}> = true;`;
        let code;
        if (q.insertAfter) {
          const lines = q.code.split("\n");
          const at = lines.indexOf(q.insertAfter);
          if (at < 0) fail(`${q.id}: insertAfter の行が見つからない`);
          const indent = (lines[at + 1] ?? "").match(/^\s*/)[0] || "  ";
          lines.splice(at + 1, 0, indent + assertion);
          code = lines.join("\n");
        } else {
          code = q.code + "\n" + assertion;
        }
        jobs.push({ key: `${q.id}~c${k}`, owner: q.id, choice: k, files: { "main.ts": code }, expect: k === q.answer ? "ok" : "error" });
      });
    }
  }
}

// ---- コンパイラごとに型チェック ----
function typecheck(name) {
  const dir = join(WORK, name);
  rmSync(dir, { recursive: true, force: true });
  const files = ["_prelude.ts"];
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "_prelude.ts"), PRELUDE);
  for (const job of jobs) {
    for (const [file, src] of Object.entries(job.files)) {
      const p = join("jobs", job.key, file);
      mkdirSync(join(dir, dirname(p)), { recursive: true });
      writeFileSync(join(dir, p), src + "\n");
      files.push(p);
    }
  }
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { ...COMPILER_OPTIONS, noEmit: true }, files }, null, 2));
  const r = spawnSync("node", [COMPILERS[name], "-p", join(dir, "tsconfig.json")], { encoding: "utf8" });
  const out = (r.stdout + r.stderr).split("\n");
  const diags = new Map(); // job.key -> [{file, line, col, code, message}]
  let last = null;
  for (const line of out) {
    const m = line.match(/^(.+?)\((\d+),(\d+)\): error TS(\d+): (.*)$/);
    if (m) {
      const rel = m[1].replace(/\\/g, "/").replace(/^.*?jobs\//, "");
      const [key, file] = [rel.split("/")[0], rel.split("/").slice(1).join("/")];
      last = { file, line: +m[2], col: +m[3], code: +m[4], message: m[5] };
      if (!diags.has(key)) diags.set(key, []);
      diags.get(key).push(last);
    } else if (last && /^\s+\S/.test(line)) {
      last.message += "\n" + line.trim();
    } else if (line.trim() && !m) {
      if (!/^\s*$/.test(line)) fail(`${name}: 解釈できない出力: ${line}`);
    }
  }
  return diags;
}

const versions = {};
for (const name of Object.keys(COMPILERS)) {
  versions[name] = execFileSync("node", [COMPILERS[name], "-v"], { encoding: "utf8" }).trim().replace("Version ", "");
}
const results = { ts7: typecheck("ts7"), ts5: typecheck("ts5") };

for (const job of jobs) {
  for (const name of Object.keys(COMPILERS)) {
    const d = results[name].get(job.key) ?? [];
    const label = `${job.key} [${name}]`;
    if (job.expect === "ok" && d.length) fail(`${label}: 通るはずがエラー: ${d.map((x) => `TS${x.code} ${x.message}`).join(" / ")}`);
    if (job.expect === "error" && !d.length) fail(`${label}: エラーのはずが通った`);
    if (job.codes && d.some((x) => !job.codes.includes(x.code))) fail(`${label}: 想定外のエラーコード ${d.map((x) => x.code)}`);
  }
  const c7 = (results.ts7.get(job.key) ?? []).map((x) => x.code).join(",");
  const c5 = (results.ts5.get(job.key) ?? []).map((x) => x.code).join(",");
  if (job.expect === "error" && job.choice === undefined && c7 !== c5) console.warn(`注意 ${job.key}: エラーコードが版で違う ts7=${c7} ts5=${c5}`);
}

// ---- 出力の問題を実行して確かめる（TS 7 で JS に変換して Node.js で実行） ----
const outputs = {};
const runJobs = jobs.filter((j) => j.run);
{
  const dir = join(WORK, "emit");
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const files = [];
  for (const job of runJobs) {
    const p = join("src", job.key, "main.ts");
    mkdirSync(join(dir, dirname(p)), { recursive: true });
    writeFileSync(join(dir, p), job.files["main.ts"] + "\n");
    files.push(p);
  }
  writeFileSync(join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { ...COMPILER_OPTIONS, rootDir: "src", outDir: "out" }, files }, null, 2));
  const r = spawnSync("node", [COMPILERS.ts7, "-p", join(dir, "tsconfig.json")], { encoding: "utf8" });
  if (r.status !== 0) fail(`emit 失敗: ${r.stdout}${r.stderr}`);
  writeFileSync(join(dir, "out", "package.json"), '{"type":"module"}');
  for (const job of runJobs) {
    const q = units.flatMap((u) => u.questions).find((x) => x.id === job.key);
    const run = spawnSync("node", [join(dir, "out", job.key, "main.js")], { encoding: "utf8", timeout: 5000 });
    const stdout = run.stdout.replace(/\n$/, "");
    if (q.throws) {
      if (run.status === 0 || !run.stderr.includes(q.throws)) fail(`${q.id}: ${q.throws} で止まるはずが status=${run.status}`);
      const errLine = run.stderr.split("\n").find((l) => l.includes(q.throws)) ?? "";
      outputs[q.id] = { stdout, error: errLine.trim() };
    } else {
      const expected = q.expect ?? q.choices[q.answer].replaceAll(" → ", "\n");
      if (stdout !== expected) fail(`${q.id}: 出力が違う 実際=${JSON.stringify(stdout)} 想定=${JSON.stringify(expected)}`);
      if (run.status !== 0) fail(`${q.id}: 実行が異常終了 ${run.stderr}`);
      outputs[q.id] = { stdout };
    }
  }
}

// ---- 結果を書き出す ----
const verified = { versions, checkedAt: new Date().toISOString().slice(0, 10), questions: {} };
for (const u of units) {
  for (const q of u.questions) {
    if (q.kind === "tf") {
      verified.questions[q.id] = { diag: (results.ts7.get(q.id) ?? []).map(({ file, line, code, message }) => ({ file, line, code, message })) };
    } else if (q.kind === "out") {
      verified.questions[q.id] = outputs[q.id];
    }
  }
}
writeFileSync(join(ROOT, "verified.json"), JSON.stringify(verified, null, 2));

const qCount = units.reduce((n, u) => n + u.questions.length, 0);
const exCount = units.reduce((n, u) => n + (u.examples?.length ?? 0), 0);
console.log(`TypeScript ${versions.ts7} / ${versions.ts5}: ${jobs.length} 件の型チェック、${runJobs.length} 件の実行（${units.length} 単元・${qCount} 問・例 ${exCount}）`);
if (problems.length) {
  console.error(`\n食い違い ${problems.length} 件:`);
  for (const p of problems) console.error(" - " + p);
  process.exit(1);
}
console.log("すべて想定どおり");

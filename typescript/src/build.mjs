// template.html に content.mjs と verified.json を流し込んで dist/ts-drill.html を作る。先に verify.mjs を通すこと。
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { units, extraFiles } from "./content.mjs";

const ROOT = dirname(fileURLToPath(import.meta.url));
const verified = JSON.parse(readFileSync(join(ROOT, "verified.json"), "utf8"));

const data = {
  meta: { versions: verified.versions, checkedAt: verified.checkedAt },
  units: units.map((u) => ({
    id: u.id,
    title: u.title,
    min: u.min,
    lead: u.lead,
    points: u.points,
    swift: u.swift ?? [],
    examples: (u.examples ?? []).map((ex) => ({ title: ex.title, code: ex.code, multiFile: Boolean(ex.files) })),
    questions: u.questions.map((q) => {
      const base = { id: q.id, kind: q.kind, q: q.q, code: q.code ?? null, explain: q.explain, multiFile: Boolean(extraFiles[q.id]) };
      if (q.kind === "tf") {
        return { ...base, choices: ["通る", "エラーになる"], answer: q.expect === "ok" ? 0 : 1, evidence: { type: "tsc", diag: verified.questions[q.id].diag } };
      }
      if (q.kind === "out") return { ...base, choices: q.choices, answer: q.answer, evidence: { type: "run", ...verified.questions[q.id] } };
      if (q.kind === "type") return { ...base, choices: q.choices, answer: q.answer, evidence: { type: "types" } };
      return { ...base, choices: q.choices, answer: q.answer, evidence: null };
    }),
  })),
};

const json = JSON.stringify(data).replace(/</g, "\\u003c").replace(/[\u2028\u2029]/g, (c) => "\\u" + c.charCodeAt(0).toString(16));
const page = readFileSync(join(ROOT, "template.html"), "utf8").replace("/*__DATA__*/", () => json);

// Artifact 用: 外枠（doctype・head）は公開時に付くので中身だけ。進捗は db でスマホと PC に共通
const artifact = page.replace("<!--__BACKLINK__-->", "");
mkdirSync(join(ROOT, "dist"), { recursive: true });
writeFileSync(join(ROOT, "dist", "ts-drill.html"), artifact);

// GitHub Pages 用（study-notes/typescript/index.html）: head と body に分けた完全な HTML。進捗は localStorage
const split = page.indexOf('<header class="bar">');
const head = page.slice(0, split).trim();
const body = page.slice(split).replace("<!--__BACKLINK__-->", '<a href="../">← 見える学習ノートの一覧へ</a>');
const standalone = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="JavaScript と Swift の知識から TypeScript を学ぶ隙間時間ドリル。全14単元・77問、全コードを tsc で検証済み。">
${head}
</head>
<body>
${body}
</body>
</html>
`;
writeFileSync(join(ROOT, "..", "index.html"), standalone);
console.log(`dist/ts-drill.html ${(artifact.length / 1024).toFixed(0)} KB / ../index.html ${(standalone.length / 1024).toFixed(0)} KB`);

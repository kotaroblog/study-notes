# TypeScript 隙間ドリル

スマホの隙間時間で解く TypeScript の教材。JavaScript を少し知っていて Swift を書く人向け。
GitHub Pages: https://kotaroblog.github.io/study-notes/typescript/ （`npm run build` で `../index.html` を生成）
Artifact 版（進捗をアカウントに保存）: https://claude.ai/artifact/KW8aPYZMhNpyVefyMGZNp1 （`dist/ts-drill.html` をこの URL へ再公開）

## ファイル

| ファイル | 役割 |
|---|---|
| `content.mjs` | 単元・問題・Swift 対応表（中身はここだけ編集する） |
| `verify.mjs` | 全コードを TypeScript 7 と 5 の strict で型チェックし、出力の問題は Node.js で実行して答えと突き合わせる |
| `verified.json` | 検証で得た実際の tsc エラーと実行結果（画面の「実際に出したエラー」に使う） |
| `template.html` | 画面 |
| `build.mjs` | template に中身を流し込んで `dist/ts-drill.html` を作る |

## 更新の手順

```bash
cd workspace/study-notes/typescript/src
npm run build   # verify → build。食い違いが1件でもあれば止まる
```

その後 `dist/ts-drill.html` を同じ Artifact の URL に再公開する。

## 問題の種類

- `tf` 「型チェックを通る？」: `expect` に `ok` / `error`。正解は expect から自動で決まる
- `type` 「型は？」: `expr` の型を選択肢ごとに `Equal` で照合し、正解だけが一致することを確かめる。関数の中の型は `insertAfter` で照合を差し込む行を指定
- `out` 「表示は？」: 実行した出力と正解の選択肢（`→` は改行として扱う）を照合。選択肢が出力そのものでないときは `expect`、例外で止まる問題は `throws`
- `pick` 概念の問題。コード検証がないので、文面は別途査読する

## 進捗の保存

Artifact の `db`（`data/users/<id>/progress`）。アカウントごとに非公開で、スマホと PC で共通。
使えないとき（ログインしていない等）は localStorage にだけ保存する。

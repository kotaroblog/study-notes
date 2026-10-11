# 見える学習ノート

コマンドや仕組みの「動き」を、1ステップずつ図で追うための学習ノート（自分の勉強用）。
ビルド不要の静的 HTML で、GitHub Pages で公開している。

公開 URL: https://kotaroblog.github.io/study-notes/

## 構成

| パス | 内容 |
|---|---|
| `index.html` | 教材一覧 |
| `git/index.html` | 見えるGit（場面1：機能ブランチを作って、main に入るまで） |
| `git/verify/verify_scenario.py` | 図の各ステップを実際の Git で再現して突き合わせるスクリプト |
| `typescript/index.html` | TypeScript 隙間ドリル（`typescript/src/` から生成。直接編集しない） |
| `typescript/src/` | ドリルの中身（`content.mjs`）・検証（`verify.mjs`）・生成（`build.mjs`） |
| `aws/index.html` | 見えるAWS（場面1：Web アプリを1つ AWS に載せる）。説明は AWS 公式ドキュメントで裏取りし、出典をページ末尾に載せる |

## 見えるGit の確かめ方

図の各ステップの状態（ブランチの位置・コミット・ファイルの状態）は、`git/index.html` の
`<script type="application/json" id="scenario">` に書いてある。場面を足したり直したりしたら、
次のコマンドで実際の Git と一致することを確かめる。

```sh
python3 git/verify/verify_scenario.py
```

一時フォルダにリモート（裸のリポジトリ）・自分・同僚のクローンを作って同じ操作を行い、
`すべて一致` と出れば図と実際の動きが同じ。利用者の `~/.gitconfig` の影響は受けない。

## TypeScript 隙間ドリル の確かめ方

中身は `typescript/src/content.mjs` だけを編集し、次のコマンドで検証と生成をまとめて行う。

```sh
cd typescript/src && npm install && npm run build
```

全問題・全例のコードを TypeScript 7 と 5 の strict で型チェックし、出力を問う問題は Node.js で実行して答えと突き合わせる。
1件でも食い違えば生成しない。成功すると `typescript/index.html`（GitHub Pages 用）と
`typescript/src/dist/ts-drill.html`（Artifact 用・進捗をアカウントに保存する版。git 管理外）ができる。
GitHub Pages 版の進捗は、開いたブラウザの localStorage に保存される。

## 教材を足すとき

`<トピック>/index.html` を作り、トップの `index.html` の一覧に1項目足す。

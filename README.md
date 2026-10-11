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

## 見えるGit の確かめ方

図の各ステップの状態（ブランチの位置・コミット・ファイルの状態）は、`git/index.html` の
`<script type="application/json" id="scenario">` に書いてある。場面を足したり直したりしたら、
次のコマンドで実際の Git と一致することを確かめる。

```sh
python3 git/verify/verify_scenario.py
```

一時フォルダにリモート（裸のリポジトリ）・自分・同僚のクローンを作って同じ操作を行い、
`すべて一致` と出れば図と実際の動きが同じ。利用者の `~/.gitconfig` の影響は受けない。

## 教材を足すとき

`<トピック>/index.html` を作り、トップの `index.html` の一覧に1項目足す。

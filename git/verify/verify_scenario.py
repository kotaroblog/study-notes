#!/usr/bin/env python3
"""index.html の場面データを、実際の Git で同じ操作をして突き合わせる。

使い方: python3 verify/verify_scenario.py [index.html]

- リモートは裸のリポジトリ（GitHub の代わり）、自分・同僚はそれぞれのクローン
- 各ステップの後に「自分」と「リモート」の状態を取り、index.html の steps と比べる
- 利用者の ~/.gitconfig の影響を受けないよう、HOME を一時フォルダに差し替える
"""
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

LETTER_BY_SUBJECT = {
    "最初のコミット": "A",
    "トップ画面を追加": "B",
    "ログイン画面を追加": "C",
    "設定画面を追加": "D",
}


def load_scenario(html_path: Path) -> dict:
    html = html_path.read_text(encoding="utf-8")
    m = re.search(r'<script type="application/json" id="scenario">(.*?)</script>', html, re.S)
    if not m:
        sys.exit("場面データが見つからない")
    return json.loads(m.group(1))


class Lab:
    def __init__(self, root: Path):
        self.root = root
        self.env = dict(os.environ)
        self.env.update({
            "HOME": str(root / "home"),
            "GIT_CONFIG_NOSYSTEM": "1",
            "GIT_AUTHOR_NAME": "dev", "GIT_AUTHOR_EMAIL": "dev@example.com",
            "GIT_COMMITTER_NAME": "dev", "GIT_COMMITTER_EMAIL": "dev@example.com",
            "LANG": "C",
        })
        (root / "home").mkdir()
        self.remote = root / "remote.git"
        self.me = root / "me"
        self.peer = root / "peer"

    def git(self, cwd: Path, *args: str) -> str:
        r = subprocess.run(["git", *args], cwd=cwd, env=self.env, capture_output=True, text=True)
        if r.returncode != 0:
            raise RuntimeError(f"git {' '.join(args)} が失敗: {r.stderr}")
        return r.stdout + r.stderr

    def letter(self, repo: Path, rev: str) -> str:
        subject = self.git(repo, "log", "-1", "--format=%s", rev).strip()
        if subject.startswith("Merge pull request"):
            return "M"
        return LETTER_BY_SUBJECT[subject]

    def refs(self, repo: Path, prefix: str) -> dict:
        out = self.git(repo, "for-each-ref", "--format=%(refname)", prefix).split()
        res = {}
        for ref in out:
            if ref.endswith("/HEAD"):
                continue
            res[ref[len(prefix):]] = self.letter(repo, ref)
        return res

    def commits(self, repo: Path) -> list:
        revs = self.git(repo, "rev-list", "--all").split()
        return sorted({self.letter(repo, r) for r in revs})

    def snap_remote(self) -> dict:
        return {"commits": self.commits(self.remote), "branches": self.refs(self.remote, "refs/heads/")}

    def snap_me(self):
        if not (self.me / ".git").exists():
            return None, None, None
        local = {
            "commits": self.commits(self.me),
            "branches": self.refs(self.me, "refs/heads/"),
            "tracking": {"origin/" + k: v for k, v in self.refs(self.me, "refs/remotes/origin/").items()},
            "head": self.git(self.me, "symbolic-ref", "--short", "HEAD").strip(),
        }
        porcelain = self.git(self.me, "status", "--porcelain=v1", "--untracked-files=all")
        status = {}
        for line in porcelain.splitlines():
            if line:
                status[line[3:]] = line[:2]
        files = sorted(p.name for p in self.me.iterdir() if p.name != ".git")
        work, stage = [], []
        for f in files:
            code = status.get(f, "  ")
            if code == "??":
                work.append([f, "untracked"])
            elif code[0] != " " and code[1] == " ":
                work.append([f, "staged"])
            elif code[1] != " ":
                work.append([f, "modified"])
            else:
                work.append([f, "clean"])
            if code[0] == "A":
                stage.append([f, "new"])
            elif code[0] == "M":
                stage.append([f, "modified"])
        return local, work, stage


def run(lab: Lab) -> list:
    """場面1の操作を順に行い、各ステップ後の状態を返す。"""
    g, root = lab.git, lab.root
    snaps = []

    def snap():
        local, work, stage = lab.snap_me()
        snaps.append({"remote": lab.snap_remote(), "local": local, "work": work, "stage": stage})

    # 準備: リモートに main（A・B）を用意する
    subprocess.run(["git", "init", "-q", "--bare", "-b", "main", str(lab.remote)], env=lab.env, check=True)
    seed = root / "seed"
    g(root, "clone", "-q", str(lab.remote), str(seed))
    (seed / "README.md").write_text("app\n")
    g(seed, "add", "README.md"); g(seed, "commit", "-q", "-m", "最初のコミット")
    (seed / "top.java").write_text("class Top {}\n")
    g(seed, "add", "top.java"); g(seed, "commit", "-q", "-m", "トップ画面を追加")
    g(seed, "push", "-q", "origin", "main")
    snap()                                                          # 1 はじめ

    g(root, "clone", "-q", str(lab.remote), str(lab.me)); snap()    # 2 clone
    g(lab.me, "switch", "-q", "-c", "feature/login"); snap()        # 3 switch -c
    (lab.me / "login.java").write_text("class Login {}\n")
    g(lab.me, "status"); snap()                                     # 4 status
    g(lab.me, "add", "login.java"); snap()                          # 5 add
    g(lab.me, "commit", "-q", "-m", "ログイン画面を追加"); snap()     # 6 commit
    g(lab.me, "push", "-q", "-u", "origin", "feature/login"); snap()  # 7 push -u

    # 同僚の変更が main に入る（スカッシュでマージされた PR に相当）
    g(root, "clone", "-q", str(lab.remote), str(lab.peer))
    (lab.peer / "settings.java").write_text("class Settings {}\n")
    g(lab.peer, "add", "settings.java"); g(lab.peer, "commit", "-q", "-m", "設定画面を追加")
    g(lab.peer, "push", "-q", "origin", "main"); snap()             # 8 同僚

    g(lab.me, "fetch", "-q"); snap()                                # 9 fetch

    # GitHub の［Merge pull request］（マージコミットを作る方式）に相当
    g(lab.peer, "fetch", "-q")
    g(lab.peer, "merge", "-q", "--no-ff", "origin/feature/login",
      "-m", "Merge pull request #1 from team/feature/login")
    g(lab.peer, "push", "-q", "origin", "main"); snap()             # 10 PR マージ

    g(lab.me, "switch", "-q", "main"); snap()                       # 11 switch main
    out = g(lab.me, "pull")                                         # 12 pull
    if "Fast-forward" not in out:
        raise RuntimeError("pull が早送りにならなかった: " + out)
    snap()
    g(lab.peer, "push", "-q", "origin", "--delete", "feature/login"); snap()  # 13 Delete branch
    g(lab.me, "fetch", "-q", "--prune"); snap()                     # 14 fetch --prune
    g(lab.me, "branch", "-d", "feature/login"); snap()              # 15 branch -d
    return snaps


def normalize(step: dict) -> dict:
    """index.html 側の値を比較用にそろえる（並び順の差は見ない）。"""
    local = step["local"]
    if local is not None:
        local = {**local, "commits": sorted(local["commits"])}
    return {
        "remote": {**step["remote"], "commits": sorted(step["remote"]["commits"])},
        "local": local,
        "work": sorted(step["work"]) if step["work"] is not None else None,
        "stage": sorted(step["stage"]) if step["stage"] is not None else None,
    }


def main() -> int:
    html = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "index.html"
    scenario = load_scenario(html)
    with tempfile.TemporaryDirectory() as tmp:
        snaps = run(Lab(Path(tmp)))
    steps = scenario["steps"]
    if len(steps) != len(snaps):
        print(f"ステップ数が違う: 図 {len(steps)} / 実際 {len(snaps)}")
        return 1
    bad = 0
    for i, (want, got) in enumerate(zip(steps, snaps), start=1):
        w = normalize(want)
        g = {**got, "work": sorted(got["work"]) if got["work"] is not None else None,
             "stage": sorted(got["stage"]) if got["stage"] is not None else None}
        diffs = [k for k in ("remote", "local", "work", "stage") if w[k] != g[k]]
        mark = "OK " if not diffs else "NG "
        print(f"{mark}ステップ {i:2d} {want['title']}")
        for k in diffs:
            bad += 1
            print(f"    {k}: 図 {json.dumps(w[k], ensure_ascii=False)}")
            print(f"    {' ' * len(k)}  実際 {json.dumps(g[k], ensure_ascii=False)}")
    print("すべて一致" if not bad else f"不一致 {bad} 件")
    return 0 if not bad else 1


if __name__ == "__main__":
    sys.exit(main())

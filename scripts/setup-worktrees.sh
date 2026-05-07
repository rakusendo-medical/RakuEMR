#!/usr/bin/env bash
# 並行セッション運用のための git worktree セットアップ
#
# 各 AI ワーカー（S2 / S3 / S4）に独立した worktree を割り当てる。
# MASTER は本リポジトリ（main ブランチ）にとどまる。
#
# 結果のディレクトリ構成:
#
#   ~/project/
#   ├── RakuEMR/         ← MASTER（main）— 本スクリプトが動いている場所
#   ├── RakuEMR-s2/      ← S2（worker/s2）
#   ├── RakuEMR-s3/      ← S3（worker/s3）
#   └── RakuEMR-s4/      ← S4（worker/s4）
#
# 各 Claude Code セッションは対応する worktree のディレクトリで起動する。
# 二度目以降の実行は何もしない（既存 worktree はスキップ）。

set -euo pipefail

# MASTER の worktree（main）に移動
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

repo_root="$(pwd)"
parent_dir="$(dirname "$repo_root")"

echo "MASTER worktree: $repo_root"
echo "Worktrees will be created under: $parent_dir/"
echo

for worker in s2 s3 s4; do
  branch="worker/$worker"
  dir="$parent_dir/RakuEMR-$worker"

  if [ -d "$dir" ]; then
    echo "[$worker] $dir already exists — skipping"
    continue
  fi

  if git rev-parse --verify "$branch" >/dev/null 2>&1; then
    echo "[$worker] Branch $branch exists — adding worktree"
    git worktree add "$dir" "$branch"
  else
    echo "[$worker] Creating new branch $branch from main"
    git worktree add "$dir" -b "$branch" main
  fi

  # ワーカー branch にも main の最新を反映
  echo "[$worker] Updating $branch from origin/main"
  (
    cd "$dir"
    git fetch origin main --quiet
    # main から ahead でなければ fast-forward マージ
    git merge origin/main --ff-only --quiet 2>/dev/null || true
  )

  # ブリーフィングディレクトリへのシンボリックリンクを設置
  # （.claude/briefings/ は gitignore のため worktree には個別配備されない・
  #  全 worktree で MASTER のブリーフィングを共有する）
  briefing_link="$dir/.claude/briefings"
  briefing_target="$repo_root/.claude/briefings"
  if [ ! -e "$briefing_link" ]; then
    mkdir -p "$dir/.claude"
    ln -s "$briefing_target" "$briefing_link"
    echo "[$worker] Symlinked .claude/briefings -> $briefing_target"
  elif [ -L "$briefing_link" ]; then
    echo "[$worker] .claude/briefings symlink already in place"
  else
    echo "[$worker] WARNING: .claude/briefings exists and is not a symlink. Skipping."
  fi
done

echo
echo "=== Worktrees ==="
git worktree list
echo
echo "次のステップ:"
echo "  各 Claude Code セッションを以下のディレクトリで起動してください:"
echo "    - S2: $parent_dir/RakuEMR-s2"
echo "    - S3: $parent_dir/RakuEMR-s3"
echo "    - S4: $parent_dir/RakuEMR-s4"
echo "  ロール宣言時のフローは CLAUDE.md / .claude/briefings/common.md 参照"

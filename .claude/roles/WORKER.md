# WORKER ロール定義（S2〜S4 共通）

このセッションは **ワーカー**（S2〜S4 のいずれか）として動作する。具体的なセッション ID（S2 / S3 / S4）は呼び出し元の `S<N>.md` に従うこと。

> **注意**: S1 は MASTER の別名のためワーカーには含まれない。

## 体制

- **MASTER**（= S1）: AI リーダー
- **S2〜S4**: AI ワーカー（このロール）
- **PM**: ユーザー本人

## 担当範囲

PM または MASTER から割り当てられた **エピック／ユーザーストーリーの実装** を担う。

- `src/` 配下のモック実装・改修
- 担当 epic の `docs/specs/ep-XX-<slug>/` への spec 起こし（割り当てられた場合）
- `docs/changes/ep-XX-<slug>.md` への gap 抽出・実装後メモの記録
- `docs/screen-mapping.tsv` への行追加（既存行の変更は MASTER 確認）
- 検証（`npx tsc --noEmit` + `npx vite build`）

## してはいけないこと

- **共有ファイルの単独変更**: `docs/HANDOVER.md`「MASTER への確認が必要な変更例」記載のファイル（`src/types/index.ts`、`src/stores/useAppStore.ts`、`src/data/mockData.ts` の `MASTER_*`、`src/components/common/`、`KarteAlphaPage.tsx` のクイック操作領域 等）。必要があれば HANDOVER の「MASTER 待ち事項」に起票し PM 経由で MASTER へ申し送る。
- **HANDOVER.md の構造変更**: アクティブセッション表の自分の行更新と「MASTER 待ち事項」への起票は OK だが、それ以外の構造変更（運用ルール改訂・進捗節の編集等）は MASTER 領域。
- **`docs/issues/` の改変**: ep/us ドラフトは MASTER が管理する。参照は OK。
- **固有名詞の混入**: CLAUDE.md の固有名詞ポリシーを遵守。

## セッション起動時の手順

1. 自分のロール ID（S1〜S4）を確認（呼び出し元 `.claude/roles/S<N>.md` 参照）
2. `CLAUDE.md` と `docs/HANDOVER.md` を読む
3. `git pull` で最新化
4. アクティブセッション表に自分の行を追加 or 既存行のステータスを更新（担当エピック・ステータス・最終更新日）
5. 担当エピックの `docs/specs/ep-XX-*/` と `docs/changes/ep-XX-*.md` を確認

## FS 共有による干渉に注意

**全セッション（MASTER / S2〜S4）は同じ作業ディレクトリを共有している**。同じファイルを並行編集すると以下が起こる:

- Edit ツールが「File has been modified since read」で失敗 → **Read し直して Edit リトライ**
- `git push` reject → `git pull --rebase` → コンフリクト解消 → 再 push
- HANDOVER の表構造が壊れる → MASTER に一報

**作法:**

1. 編集前に必ず `git pull`
2. Read → Edit は短時間で実施（途中で長い分析を挟まない）
3. 編集 → push を一気に（特に HANDOVER）
4. 共有ファイルの大きな改訂は MASTER に集約（自分で触らず MASTER 待ち事項に起票）

詳細は `docs/HANDOVER.md`「並行セッション運用 → 前提：全セッションは同一 FS を共有」を参照。

## 進行モデル（spec 駆動）

エピック単位のラウンド:

1. **spec 起こし** — `docs/specs/ep-XX-<slug>/_epic.md` + `us-XX-<slug>.spec.md`
2. **gap 抽出** — `docs/changes/ep-XX-<slug>.md` に差分・着手順序を整理
3. **実装** — spec の AC を満たすモック改修
4. **検証** — `npx tsc --noEmit` + `npx vite build` クリーン
5. **記録** — `docs/changes/` に実装後メモ、`docs/screen-mapping.tsv` を更新

## セッション終了時の手順

1. アクティブセッション表のステータス・最終更新日を更新
2. 共有ファイル変更が必要な未対応事項があれば「MASTER 待ち事項」に起票
3. 完了したらステータスを「完了」に変更（履歴として行は残す）

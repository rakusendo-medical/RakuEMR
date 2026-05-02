# HANDOVER — 並行セッション・引き継ぎ用ガイド

複数の Claude Code セッションでこのリポジトリを同時に進行する場合の引き継ぎ・共有情報。
新しいセッションは **このファイルと CLAUDE.md を最初に読む** ことを推奨。

---

## アクティブセッション

| セッション名 | 役割 | 対応中エピック | ステータス | 最終更新 |
| --- | --- | --- | --- | --- |
| MASTER | マスターセッション | ep-04 入退院歴（us-10）— spec 起こしから着手 | 進行中 | 2026-05-02 |
| S2 | ワーカー | ep-05〜ep-08（隔離拘束系）— ep-05 から着手 | 進行中 | 2026-05-02 |
| S3 | ワーカー | ep-10 看護実施（フローシート, us-17〜26）— spec 起こしから着手 | 進行中 | 2026-05-02 |
| S4 | ワーカー | ep-09 患者情報（us-16）— 看護計画クラスタは複雑につき切替 | 進行中 | 2026-05-02 |

**運用ルール:**
- 新しくセッションを開始する場合は、上記表に **自分の名前と対応中エピックを追記** すること（例: `S2`, `claude-2`, `worker-A` など任意の識別子）
- 終了したセッションは行を残しつつステータスを「完了」に変更（履歴として残す）
- **共通ライブラリ・共有箇所**（下記「共有ファイル」参照）を変更する場合は、必ず **MASTER に確認・指示を仰ぐ** こと
- 共通ファイル外の修正なら独立に進めて OK

### MASTER への確認が必要な変更例

- `src/types/index.ts` の型追加・変更
- `src/stores/useAppStore.ts` の state / action 追加
- `src/data/mockData.ts` の MASTER\_\* 定数の追加・改変
- `src/components/common/` への新規追加・変更
- `docs/screen-mapping.tsv` の既存行の変更（行追加は OK）
- 既存ダイアログ（`MedicalInstitutionSearchDialog`, `DeleteReasonDialog`, `OrderConfirmDialog` 等）の API 変更
- `KarteAlphaPage.tsx` のクイック操作領域への追加

これらは PR / ブランチ運用に乗せても、まず MASTER の合意を取ってから進めると衝突が少ない。

---

## プロジェクト概要

精神科病棟も含む入院機能を中心とした電子カルテのワイヤーフレーム実装。

- 技術: React + TypeScript + MUI + Vite
- 進行モデル: spec 駆動（SDD）

## 進行モデル

エピック単位でラウンドを切る。手順は以下の通り。

1. **spec 起こし** — `docs/issues/` の GitHub 投入用ドラフトを参照しつつ、`docs/specs/ep-XX-<slug>/` に詳細仕様を起こす
   - `_epic.md` (エピック spec) + `us-XX-<slug>.spec.md` (ストーリー spec)
2. **gap 抽出** — `docs/changes/ep-XX-<slug>.md` に現状モックとの差分・着手順序を整理
3. **実装** — spec の AC（受け入れ基準）チェックリストを満たす形でモック改修
4. **検証** — `npx tsc --noEmit` + `npx vite build` でクリーン確認
5. **記録** — `docs/changes/` に実装後メモを追記、`docs/screen-mapping.tsv` を更新

## 参考システムマニュアル

`docs/manuals/` 配下の PDF が参考システムのマニュアル。`参考システムマニュアル対応表.xlsx` で機能 ↔ ページ範囲を確認できる。

各 spec の冒頭メタ情報に該当ページ範囲を必ず記載すること（[CLAUDE.md](../CLAUDE.md) 参照）。

## 固有名詞ポリシー（重要）

製品名・ベンダー名は記載しない。参照元を指す必要があるときは一律で **「参考システム」** と表記する。詳細は [CLAUDE.md](../CLAUDE.md) を参照。

## 重要ファイル一覧

| パス | 用途 |
| --- | --- |
| `CLAUDE.md` | 固有名詞ポリシー・プロジェクト方針 |
| `docs/HANDOVER.md` | 本ファイル |
| `docs/specs/_template.spec.md` | spec テンプレ |
| `docs/specs/README.md` | spec 運用ルール |
| `docs/screen-mapping.tsv` | 画面 ↔ epic/story 対応表 |
| `docs/changes/` | エピック単位の改修一覧 |
| `docs/issues/` | GitHub 投入用 Issue ドラフト（変更不可、参照用） |
| `docs/入院機能一覧.xlsx` | 入院機能の元データ |
| `docs/manuals/` | 参考システムマニュアル一式 |

## エピック進捗

### ✅ 完了

| Epic | 子ストーリー | 主要画面 |
| --- | --- | --- |
| ep-01 病棟マップ | us-01〜us-04 | `/`, `/karte-alpha/:patientId` |
| ep-02 入退院手続き | us-05〜us-07 | `/admission` |
| ep-03 入退院指示 | us-08, us-09 | `/karte-alpha/:patientId`（クイック操作） |

### 🟡 残

| Epic | 業務領域 | 子ストーリー |
| --- | --- | --- |
| ep-04 入退院歴 | 病床管理 | us-10 |
| ep-05 隔離拘束指示 | 隔離拘束 | us-11 |
| ep-06 隔離拘束一覧 | 隔離拘束 | us-12 |
| ep-07 観察記録 | 隔離拘束 | us-13, us-14 |
| ep-08 隔離拘束歴 | 隔離拘束 | us-15 |
| ep-09 患者情報 | 共通 | us-16 |
| ep-10 看護実施（フローシート） | 看護 | us-17〜us-26 |
| ep-12 看護診断 | 看護 | us-28 |
| ep-13 看護計画 | 看護 | us-29 |
| ep-14 看護評価 | 看護 | us-30, us-31 |

### 全エピック完了後

- サイドメニュー整理（最終タスク）

---

## 並行セッション運用

### 推奨: 業務領域で分担

| セッション | 担当領域 | エピック |
| --- | --- | --- |
| A | 隔離拘束系 | ep-05, ep-06, ep-07, ep-08 |
| B | 看護系 | ep-10, ep-12, ep-13, ep-14 |
| C | 共通／病床管理残 | ep-04, ep-09 |

別領域同士は同時進行で衝突しにくい。

### 注意：共有ファイル

複数エピックから触られる頻度が高いファイル。**並行作業時はこれらの編集を同期させる必要がある**。

- `src/types/index.ts` — 型定義の集約
- `src/data/mockData.ts` — モックデータ・MASTER\_\* セクション
- `src/stores/useAppStore.ts` — グローバル状態（zustand）
- `src/components/common/` — 共通コンポーネント
- `docs/screen-mapping.tsv` — 画面対応表（行追加が中心、衝突は起こりにくい）
- `src/components/karteAlpha/KarteAlphaPage.tsx` — 多くのエピックの起点

#### 同期戦略

1. 共有ファイルへの追加は **明示的なセクション** を切って配置（例: `// ===== ep-05 隔離拘束指示 =====`）
2. 既存定義に「干渉しない追加」を意識（既存型・関数のシグネチャは変えない）
3. マージは main ブランチ経由で
4. セッション開始時は `git pull` して最新化

### 並行で問題が起きやすいパターン

- 同じ Patient 型に複数セッションがフィールド追加 → 解決: PR で順次統合
- 同じ store action 名の重複 → 解決: エピック prefix を付ける（例: `addIsolationOrder`）
- 同じカルテタブのレイアウト変更 → 解決: タブごとにコンポーネント分割を先に済ませる

---

## 設計の足場（既に整った仕組み）

### 型・状態

- **`Patient.admissionState`** (`'inpatient' | 'outpatient' | 'discharged'`) — 入院／外来／退院の判定。退院指示ボタン表示などで利用
- **`Bed.flags: BedFlag[]`** — 複数ステータス（隔離・拘束・外出・外泊・要報告・預り金）を 1 ベッドで重畳表示
- **`Bed.disabled`** — マスタ「使用不可」相当
- **`Patient.primaryRecordType`** — カルテ初期表示の標準診療種類分岐
- **`useAppStore.pendingOrders`** — 「指示」段階の入退院指示（カレンダー反映用、localStorage 永続化）
- **`useAppStore.scheduledMoves`** — 病床移動の予定一覧（移動アイコン動的計算）
- **`useAppStore.dynamicMedicalRecords`** — カルテ記事の動的追加（入退院確定時など）
- **`useAppStore.optionalFeatures`** — 医療観察法／地域連携／精神科連携のトグル
- **`useAppStore.currentUserRole`** — 操作者ロール（医師／事務）

### 共通 UI

- **`BedFlagIcons` / `BedFlagLegend`** (`src/components/wardMap/BedFlagIcons.tsx`) — フラグ重畳とその凡例
- **`StatusBadge`** (`src/components/common/StatusBadge.tsx`) — 単一ステータスチップ
- **`SectionHeader`** (`src/components/common/SectionHeader.tsx`) — 開閉セクション
- **`MedicalInstitutionSearchDialog`** (`src/components/admission/`) — 医療機関検索（再利用可）
- **`DeleteReasonDialog`** (`src/components/admission/`) — 削除理由／削除コメント（variant で切替）
- **`OrderConfirmDialog`** (`src/components/admission/`) — 未実施オーダ確認（リハビリ転帰区分含む）

### マスタ参照

固定値はすべて `src/data/mockData.ts` の **`MASTER_*`** セクションに集約してある。
新規エピックでマスタ系を扱う場合も、同じ命名（`MASTER_<対象>`）で末尾に追加する。

---

## 開発コマンド

```bash
# 型チェック
npx tsc --noEmit

# 開発サーバー
npx vite --port 5173 --host 0.0.0.0

# 本番ビルド
npx vite build
```

---

## 現セッション末時点の未対応エピック扱い

下記の項目は本セッションでは扱わず、それぞれのエピックで対応すべきもの。

| 項目 | 振り分け先 | 経緯 |
| --- | --- | --- |
| us-02 履歴欄からの更新／削除フロー | ep-04 入退院歴 | 移動歴管理を含めて一括対応が筋 |
| us-02 移動取消時の病床自動有効化 | ep-04 入退院歴 | 同上 |
| 退院確定後の未実施オーダ削除のデータ反映 | オーダ管理（既存エピック未割当） | `/orders` 周辺に再構成必要 |
| 指示簿タブからの「変更／中止」起点 | カルテ整備（既存エピック未割当） | 指示簿タブ自体が placeholder |
| 印刷フロー一元化 | リファクタタスク | エピック非帰属 |

この他、各 `docs/changes/ep-XX.md` の「残課題」「対応不要」セクションも参照。

---

## トラブルシューティング

### `npx tsc --noEmit` が型エラーを出す
- 共有ファイルの編集が衝突している可能性。`git status` と `git diff` を確認。

### dev server で画面が真っ白
- ブラウザのコンソールでスタックトレースを確認。インポート漏れか、store の Hook 利用順違反が多い。

### localStorage の永続化が壊れた
- DevTools → Application → Local Storage → `useAppStore` キーを削除して再読み込み。

---

## 参考: メモリ（個人プリファレンス）

`/root/.claude/projects/-workspaces-RakuEMR/memory/` 配下に作業上の好みなどのメモあり。
セッション開始時に `MEMORY.md` を見るとフィードバック傾向がわかる。

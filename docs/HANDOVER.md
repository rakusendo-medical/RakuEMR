# HANDOVER — 並行セッション・引き継ぎ用ガイド

複数の Claude Code セッションでこのリポジトリを同時に進行する場合の引き継ぎ・共有情報。
新しいセッションは **このファイルと CLAUDE.md を最初に読む** ことを推奨。

---

## アクティブセッション

| セッション名 | 役割 | 対応中エピック | ステータス | 最終更新 |
| --- | --- | --- | --- | --- |
| MASTER | マスターセッション | ep-15 段階 1 進行中。S2 \[1\]\[2\] / S4 us-32 完了。S3 us-34 本格実装中。**新規起票**: ep-10 us-17 バイタルグラフ補修（リグレッション、commit `1a3ec15` で旧 VitalChart 削除を確認）→ 担当 S3、PM 採用案 (1)「急がずゆっくり、us-34 完了後の次タスク」。詳細は `docs/changes/ep-10-flowsheet.md` 末尾「補修予定（2026-05-06 起票）」。次の MASTER アクション: ① S3 us-34 完了報告受領 → ② ep-15 段階 1 統合確認 → ③ 段階 1 クローズ判定 → ④ S3 を ep-10 補修にローテーション（GO サインを PM 経由） | 進行中 | 2026-05-06 |
| S2 | ワーカー | ep-05〜ep-08 隔離拘束系すべて実装完了・push 済（モック実装。ブラウザ目視は未実施）。追加: サイドバー整理完了（19 エントリを「病床管理／看護／共通・運用／開発」の 4 セクションに分割。MainLayout のみ変更、ルート・画面コンポーネントは未変更。tsc / build クリーン、ブラウザ目視は MASTER 側で実施依頼） | 完了 | 2026-05-04 |
| S2 | ワーカー | ep-15 着手順序 \[1\]\[2\] **両方完了**。\[1\] design-rules §12「mode 切替（外来／入院）」本文（§12.1〜§12.6）+ 改訂履歴追記。\[2\] us-33 骨組み: `/karte/:patientId` 新規ルート / `KartePage.tsx`（既存上書き刷新）/ `KartePatientHeader.tsx` 新規 / `KarteActionBar.tsx` 新規 / 7 タブ枠 / mode prop API 確立（後述）/ mode 判定（`location.state.from` → `navigationSource` → `admissionState` の優先順）/ 戻り先判定 / 看護過程タブの outpatient disabled + Tooltip / フローシート埋込（ep-10 `<FlowsheetPage embedded patientId>`） / mode 識別 Chip。`docs/screen-mapping.tsv` 行追加 / `docs/changes/ep-15-outpatient-emr.md` に \[2\] 完了メモ + mode prop API 仕様 + S3/S4 申し送り を追記。**`useAppStore` 型変更なし**（state.from 経由で回避）/ `MASTER_*` 追加なし / `types/index.ts` 変更なし。tsc + build クリーン。**S3/S4 は本格着手可能**。MASTER のレビュー + ブラウザ目視待ち | \[1\] / \[2\] 完了 | 2026-05-06 |
| S3 | ワーカー | ep-10 看護実施（フローシート, us-17〜26）モック実装完了（10 ストーリー全 push 済）。残: KarteAlphaPage タブ統合は MASTER 待ち事項として継続管理。FlowsheetPage には `embedded` / `patientId` prop 追加済（統合準備済み） | 完了 | 2026-05-02 |
| S3 | ワーカー | ep-15 段階 1 **us-34 患者情報サブタブ** 実装完了（着手順序 \[4\]）。新規: `karte/PatientInfoTab.tsx` + `karte/patientInfo/{BasicInfo,Attributes,Insurance,Contacts,Diagnoses,Episodes,Memo}Subview.tsx` + 共通 `useDirtyForm.ts` / `SubviewActionBar.tsx`。既存改修: `karte/KartePage.tsx`（S2 提供）の `KarteTabContent` `patient-info` 分岐に PatientInfoTab を埋込、メインタブ切替・「一覧に戻る」時の未保存検知ダイアログを追加（discardSignal で全サブビュー reset）。`screen-mapping.tsv` に PatientInfoTab.tsx 行追加。AC-1〜AC-8 全達成。tsc / build クリーン。**共有ファイル変更なし**（types / store / mockData / common 触らず）。`PatientBasicPage` 撤去判断は PM 確認事項 #5 待ちで温存。詳細は `docs/changes/ep-15-outpatient-emr.md`「## 段階 1 着手順序 \[4\] 完了メモ」。ブラウザ目視は MASTER 段階 1 統合確認時に依頼 | 完了 | 2026-05-06 |
| S4 | ワーカー | ep-15 段階 1 **PM 確認事項 #3 / #5 完了**・push 済。**#3 OutpatientKartePage 即撤去**: `karteOutpatient/OutpatientKartePage.tsx`（947 行）削除 + ディレクトリ削除 + `routes/index.tsx` から `/karte-outpatient/:patientId` ルートと import 削除 + `MainLayout.tsx` の AppBar 非表示ガード `karte-outpatient` 削除。**#5 `/outpatient/:patientId/basic` 互換リダイレクト**: `outpatient/PatientBasicPage.tsx`（582 行）削除 + `routes/index.tsx` で `RedirectToPatientInfo` コンポーネント新設し `/karte/:patientId#patient-info`（us-33 AC-10 ハッシュ仕様準拠）へ `<Navigate replace>` で転送。実装本体は **S2 のコミット `30151eb`（AC-10 ハッシュ反映）に並行編集で巻き込まれて push 済**（前回の S3 巻き込みと同パターン）。記録メモは `bc12a57` で個別 push。tsc / build クリーン、参照残存ゼロ、`types`/`store`/`mockData`/`common` 変更なし。**前段の us-32 仕上げも含めて全タスク完了** | 完了 | 2026-05-06 |
| S3 | ワーカー | **ep-10 us-17 バイタルグラフ補修** 完了。新規 `src/features/flowsheet/components/VitalChart.tsx`（recharts LineChart、5 系統 BP/R/P/T/S、7 日連続時間軸、3 軸構成で T/S は軸 hide+Tooltip 値表示、日境目 ReferenceLine）。`FlowsheetGrid.renderVitalRow` を VitalChart 埋込に置換。`docs/changes/ep-10-flowsheet.md` 冒頭サマリ表 us-17 を 8/9 → 9/9 ✅ に戻し、末尾「補修予定」を「補修完了」に書き換え＋実装内容追記。tsc / build クリーン、共有ファイル変更なし（`src/features/flowsheet/` 内に閉じる）。ブラウザ目視は未実施 → MASTER 段階 1 統合確認時に併せて依頼 | 完了 | 2026-05-06 |

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

### MASTER 待ち事項（PM 経由・着手中ワーカーから）

各ワーカーが共有ファイル変更を要する作業に当たった際、PM 経由で MASTER に相談する事項を記録する。完了したら行ごと削除する。

| 起票 | 依頼元 | 内容 | 対象ファイル | 想定タイミング |
| --- | --- | --- | --- | --- |
| _（現在なし）_ | | | | |

**過去の MASTER 待ち事項の処理:**

- 2026-05-02 起票・S3（ep-10） フローシートタブ統合 → **ep-15 us-33 AC-8** に吸収（新カルテ画面で `<FlowsheetPage embedded patientId={...} />` 埋込として実装予定）。`KarteAlphaPage` 側の同統合は **段階 2**（後続エピック）扱い。
- 2026-05-06 起票・S2（ep-15 着手順序 \[1\]） design-rules §12 リナンバー方針 → **案 B 採用**（既存 §12〜§19 を §13〜§20 にリナンバー、新 §12 として「mode 切替」を割込み）。リナンバー作業は MASTER が直接実施済（design-rules.md 編集 + 改訂履歴追記、新 §12 はスタブ）。S2 は **着手順序 \[1\] = §12 本文の執筆** に専念可能。

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

### ✅ 完了（モック実装済）

| Epic | 子ストーリー | 主要画面 |
| --- | --- | --- |
| ep-01 病棟マップ | us-01〜us-04 | `/`, `/karte-alpha/:patientId` |
| ep-02 入退院手続き | us-05〜us-07 | `/admission` |
| ep-03 入退院指示 | us-08, us-09 | `/karte-alpha/:patientId`（クイック操作） |
| ep-04 入退院歴 | us-10 | `/admission`（タブ「入院歴」「移動歴」） |
| ep-05 隔離拘束指示 | us-11 | `/restraint/order` 系 |
| ep-06 隔離拘束一覧 | us-12 | `/restraint/list` |
| ep-07 観察記録 | us-13, us-14 | `/restraint/observation` |
| ep-08 隔離拘束歴 | us-15 | `/restraint/history` |
| ep-09 患者情報 | us-16 | `/patients` |

### 🟠 進行中

| Epic | 業務領域 | 子ストーリー | 状態 |
| --- | --- | --- | --- |
| ep-12 看護診断 | 看護 | us-28 | spec 確定（方針 Y）／mock 改修フェーズ 2 進行中 |
| ep-13 看護計画 | 看護 | us-29 | 同上（期間複数計画モデル実装中） |
| ep-14 看護評価 | 看護 | us-30, us-31 | 同上 |
| ep-10 看護実施（フローシート） | 看護 | us-17 | バイタル「7 日 × 時間軸の格子状グラフ」未実装の補修待ち（リグレッション・2026-05-06 起票）。担当 S3、着手は us-34 完了後 |
| ep-15 外来 EMR 刷新 | 外来・共通 | us-32, us-33, us-34 | us-32 / us-33 完了。us-34 は S3 が本格実装中 |

### 🟡 残（未着手）

現時点で新規エピックなし。ep-15 完了後に段階 2 / 段階 3（入院 mode 統合・KarteAlphaPage 置換）を後続エピックとして起票予定。

### 全エピック完了後

- ~~サイドメニュー整理（最終タスク）~~ → 2026-05-04 S2 が先行実施済み（4 セクション化）

---

## 並行セッション運用

### 前提：全セッションは同一 FS を共有

MASTER / S2 / S3 / S4 は **同じ作業ディレクトリ・同じファイルを共有** している。複数セッションが同じファイルを並行編集すると以下の干渉が発生する。

#### 干渉パターンと対処

| 症状 | 原因 | 対処 |
| --- | --- | --- |
| Edit ツールが「File has been modified since read」で失敗 | Read してから Edit するまでの間に別セッションがそのファイルを書き換えた | **そのファイルを Read し直してから Edit リトライ**。エラーは安全装置なので素直に従う |
| `git push` で reject される（non-fast-forward） | 別セッションが先に push 済 | `git pull --rebase` → コンフリクト解消 → 再 push |
| `git pull` でコンフリクト | 同じ行を同時に編集 | 手動マージ。HANDOVER の場合は両方の行を残す方向で解決 |
| HANDOVER のアクティブセッション表が壊れる | 表の構造を破壊する形でマージ | MASTER に一報。表構造を MASTER が再整備 |

#### 並行編集を最小化する作法

1. **編集前に必ず `git pull`**（既存ルール再掲・徹底）
2. **Read → Edit は短時間で実施**（Read 後に長い分析・他作業を挟むと干渉確率が上がる）
3. **編集 → push を一気に**（特に HANDOVER は変更頻度が高い）
4. **同じ共有ファイルへの大きな改訂は MASTER に集約**（並行ワーカーは触らずに MASTER 待ち事項に起票）
5. **干渉を検知したら状況を HANDOVER に共有**（MASTER 待ち事項 or 該当行に注記）

#### 特に干渉しやすいファイル

- `docs/HANDOVER.md` — 全セッションが書く本ファイル
- `docs/changes/ep-XX-*.md` — 同じエピックを複数ワーカーが触ると衝突
- `src/routes/index.tsx` — ルート追加で衝突しやすい
- 下記「注意：共有ファイル」一覧

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

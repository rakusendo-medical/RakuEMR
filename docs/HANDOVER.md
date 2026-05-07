# HANDOVER — 並行セッション・引き継ぎ用ガイド

複数の Claude Code セッションでこのリポジトリを同時に進行する場合の引き継ぎ・共有情報。
新しいセッションは **このファイルと CLAUDE.md を最初に読む** ことを推奨。

---

## アクティブセッション

| セッション名 | 役割 | 対応中エピック | ステータス | 最終更新 |
| --- | --- | --- | --- | --- |
| MASTER | マスターセッション | **ep-15 段階 1 クローズ済**（commit `93bf3eb`）。**ep-16 立ち上げ + Phase 0 完了**（spec 4 本、changes、briefings 3 本配備済）。**S3 us-35 完了**（HANDOVER L21）／**S4 us-38 完了**（HANDOVER L20）／**S2 us-36 アサイン済**（PM 起動待ち）。**worktree 分離運用へ移行**（2026-05-07）: `scripts/setup-worktrees.sh` 配備、CLAUDE.md / HANDOVER 並行運用セクション全面改訂、briefings 3 本に worktree 起動手順反映。FS 共有 + 並行 `git add → commit` の index 競合に起因する 3 件の commit 巻き込み事故が構造的に解消される。**次のアクション**: ① PM が `bash scripts/setup-worktrees.sh` を実行して worktree を作成／② S2/S3/S4 セッションを各 worktree で再起動／③ S3/S4 完了分の統合動作確認（ブラウザ目視）／④ ep-12〜14 進捗ヒアリング（PM 経由・us-37 着手判定材料）／⑤ S2 を `~/project/RakuEMR-s2/` で起動して us-36 開始 + 高密度監督モード | ep-16 立ち上げ + Phase 0 完了・worktree 移行 | 2026-05-07 |
| S2 | ワーカー | ep-05〜ep-08 隔離拘束系すべて実装完了・push 済（モック実装。ブラウザ目視は未実施）。追加: サイドバー整理完了（19 エントリを「病床管理／看護／共通・運用／開発」の 4 セクションに分割。MainLayout のみ変更、ルート・画面コンポーネントは未変更。tsc / build クリーン、ブラウザ目視は MASTER 側で実施依頼） | 完了 | 2026-05-04 |
| S2 | ワーカー | ep-15 着手順序 \[1\]\[2\] **+ AC-10 完了 + 履歴挙動修正完了**。\[1\] design-rules §12「mode 切替（外来／入院）」本文（§12.1〜§12.6）+ 改訂履歴追記。\[2\] us-33 骨組み: `/karte/:patientId` 新規ルート / `KartePage.tsx` / `KartePatientHeader.tsx` / `KarteActionBar.tsx` / 7 タブ枠 / mode prop API 確立 / mode 判定 / 戻り先判定 / 看護過程タブ disabled + Tooltip / フローシート埋込 / mode 識別 Chip。**\[3\] AC-10 タブ状態の URL ハッシュ反映**（commit `30151eb`）: `useLocation().hash` から初期 currentTab 解決 / 戻る・進む追従 / 看護過程の語彙差（tabId=`care-plan` / hash=`nursing-process`）/ 患者情報未保存検知の確認ダイアログ経由でも URL 揃え。spec us-33 に AC-10 + URL ハッシュ ↔ タブ ID 対応表を追加（commit `25b884f`）。**\[4\] AC-10 履歴挙動修正**（PM フィードバック・本コミット）: ユーザー操作によるタブ切替を `replace: false`（履歴に積む）に変更。`commitTab(nextTab, opts?: { replace })` シグネチャ拡張、初期化時の URL 自動補正は `replace: true` を維持するルールを spec / コードコメントに明文化。spec AC-10 末尾 Note 改訂 + 「ブラウザバックで前タブに戻る」Given/When/Then 追加。changes に「AC-10 フォローアップ修正」節を追記。tsc + build クリーン、共有ファイル変更なし。**`30151eb` には S4 の段階 1 クローズ作業（#3 / #5）が並行編集で巻き込まれている**（後述・経緯記録あり）。**MASTER のレビュー + ブラウザ目視（履歴挙動含む AC-10 動作確認）待ち** | \[1\] / \[2\] / AC-10 + 履歴挙動修正 完了 | 2026-05-06 |
| S3 | ワーカー | ep-10 看護実施（フローシート, us-17〜26）モック実装完了（10 ストーリー全 push 済）。残: KarteAlphaPage タブ統合は MASTER 待ち事項として継続管理。FlowsheetPage には `embedded` / `patientId` prop 追加済（統合準備済み） | 完了 | 2026-05-02 |
| S3 | ワーカー | ep-15 段階 1 **us-34 患者情報サブタブ** 実装完了（着手順序 \[4\]）。新規: `karte/PatientInfoTab.tsx` + `karte/patientInfo/{BasicInfo,Attributes,Insurance,Contacts,Diagnoses,Episodes,Memo}Subview.tsx` + 共通 `useDirtyForm.ts` / `SubviewActionBar.tsx`。既存改修: `karte/KartePage.tsx`（S2 提供）の `KarteTabContent` `patient-info` 分岐に PatientInfoTab を埋込、メインタブ切替・「一覧に戻る」時の未保存検知ダイアログを追加（discardSignal で全サブビュー reset）。`screen-mapping.tsv` に PatientInfoTab.tsx 行追加。AC-1〜AC-8 全達成。tsc / build クリーン。**共有ファイル変更なし**（types / store / mockData / common 触らず）。`PatientBasicPage` 撤去判断は PM 確認事項 #5 待ちで温存。詳細は `docs/changes/ep-15-outpatient-emr.md`「## 段階 1 着手順序 \[4\] 完了メモ」。ブラウザ目視は MASTER 段階 1 統合確認時に依頼 | 完了 | 2026-05-06 |
| S4 | ワーカー | ep-15 段階 1 **PM 確認事項 #3 / #5 完了**・push 済。**#3 OutpatientKartePage 即撤去**: `karteOutpatient/OutpatientKartePage.tsx`（947 行）削除 + ディレクトリ削除 + `routes/index.tsx` から `/karte-outpatient/:patientId` ルートと import 削除 + `MainLayout.tsx` の AppBar 非表示ガード `karte-outpatient` 削除。**#5 `/outpatient/:patientId/basic` 互換リダイレクト**: `outpatient/PatientBasicPage.tsx`（582 行）削除 + `routes/index.tsx` で `RedirectToPatientInfo` コンポーネント新設し `/karte/:patientId#patient-info`（us-33 AC-10 ハッシュ仕様準拠）へ `<Navigate replace>` で転送。実装本体は **S2 のコミット `30151eb`（AC-10 ハッシュ反映）に並行編集で巻き込まれて push 済**（前回の S3 巻き込みと同パターン）。記録メモは `bc12a57` で個別 push。tsc / build クリーン、参照残存ゼロ、`types`/`store`/`mockData`/`common` 変更なし。**前段の us-32 仕上げも含めて全タスク完了** | 完了 | 2026-05-06 |
| S3 | ワーカー | **ep-10 us-17 バイタルグラフ補修** 完了。新規 `src/features/flowsheet/components/VitalChart.tsx`（recharts LineChart、5 系統 BP/R/P/T/S、7 日連続時間軸、3 軸構成で T/S は軸 hide+Tooltip 値表示、日境目 ReferenceLine）。`FlowsheetGrid.renderVitalRow` を VitalChart 埋込に置換。`docs/changes/ep-10-flowsheet.md` 冒頭サマリ表 us-17 を 8/9 → 9/9 ✅ に戻し、末尾「補修予定」を「補修完了」に書き換え＋実装内容追記。tsc / build クリーン、共有ファイル変更なし（`src/features/flowsheet/` 内に閉じる）。ブラウザ目視は未実施 → MASTER 段階 1 統合確認時に併せて依頼 | 完了 | 2026-05-06 |
| S3 | ワーカー | **ep-10 文字サイズ・情報密度 調査メモ追記**（実装なし・観察のみ）。PM「文字の小ささ懸念」事前調査として `docs/changes/ep-10-flowsheet.md` 末尾に「## 文字サイズ・情報密度の改善候補（S3 調査メモ・2026-05-06）」を追記。観点 **A 文字（§6.3 / §1.3）/ B 密度（§6.2 / §6.3）/ C 色覚（§13.5）/ D 階層（§1.3 / §3.3 / §2.1）** の 4 観点 × 5 ページ + 主要 4 ダイアログ + 共通 2 コンポーネント で **32 件の観察** を表 + A/B/C/D 詳細の二段構成で記載。改善候補は **高 8 / 中 14 / 低 6 / 維持 4 件**。実装スコープ目安（小：1〜2h / 中：+1〜2h / 大：3〜4h）と採用候補 A/B/C/据え置き を PM 判断用にたたき台として提示。**コード変更なし、共有ファイル変更なし**。詳細は `docs/changes/ep-10-flowsheet.md` 末尾セクション。push 戦略は `git add docs/changes/ep-10-flowsheet.md` + `git diff --cached --stat` 確認 + `git pull --rebase` 実施でブリーフィング指示通り | 完了 | 2026-05-06 |
| S4 | ワーカー | **ep-16 段階 2 us-38「病棟マップ等の遷移元修正」完了**。① `wardMap/WardMap.tsx:77`（`state.from='ward-map'` 添付）／② `patientList/PatientList.tsx:158`（`state.from='patient-list'` 添付）に `KartePageLocationState` 型を import + `satisfies` で型検証。AC-1〜AC-6 全達成、tsc / build クリーン、`types`/`store`/`mockData`/`common`/`routes` 変更なし。実装本体は **MASTER のコミット `cfc0e83`（Phase 0 完了）に並行編集で巻き込まれて push 済**（段階 1 から 3 例目の同パターン・FS 共有 index 巻き込み）。続く S4 のコミット `9ba5894` には実装本体が含まれず HANDOVER + ep-16 changes 新設 + S3 の patientInfo 3 ファイルが混入する事故が発生 → MASTER の `3f55277` でフォロー。実装後メモは `eb56741` で個別 push（changes/ep-16 末尾「## us-38 ... 完了メモ」）。ブラウザ目視は MASTER 段階 2 統合確認時に依頼 | 完了 | 2026-05-07 |
| S3 | ワーカー | **ep-16 段階 2 us-35「入院 mode 本実装」完了**（着手順序 [Phase 1]）。AC-1/AC-2/AC-3 は段階 1（ep-15 us-33）で実装済のため確認のみ・コード変更なし。AC-4 属性サブタブ入院専用情報セクション本実装: `AttributesSubview.tsx` に **受け持ち看護師** フィールド追加（既存 4 フィールド構成、Grid md=3 で 4 列均等、read-only）。AC-5 預かり金セクション非表示: `BasicInfoSubview.tsx` の Paper 削除 + コメントで「別システム連携で復活予定」明示（state は温存）。AC-6 メモ表示位置ラベル: `BasicInfoSubview.tsx`（基本情報メモ）と `MemoSubview.tsx`（患者メモ）両方に `<Chip label="このタブのみ表示">` を追加、caption で用途差を明文化。AC-7 design-rules §12 準拠（段階 1 延長）。tsc / build クリーン、共有ファイル変更なし（types / store / mockData / common 触らず）。詳細は `docs/changes/ep-16-outpatient-emr-stage2.md`「## us-35 入院 mode 本実装 完了メモ」。ブラウザ目視は MASTER 段階 2 統合確認時に依頼 | 完了 | 2026-05-06 |
| S2 | ワーカー | **ep-16 段階 2 us-36「入院アクション本実装」アサイン済**（PM 起動待ち・briefing 配備完了）。MASTER から spec（`us-36-inpatient-actions.spec.md`）+ Phase 0 インベントリ（`docs/changes/ep-16-outpatient-emr-stage2.md`）+ briefing（`.claude/briefings/s2.md`）を提供済。**進め方**: 1 us 単独 + 内部 3 サブタスク（A 入退院指示 → B 隔離拘束指示 → C 看護ケア記録）。各サブタスク完了で commit を区切る。**着手前提**: S3 の us-35 完了確認（KartePage.tsx・KarteActionBar.tsx の競合回避）。MASTER は本 us 期間中、高密度監督で待機（既存ダイアログ API 変更の合議 + サブ C 要件確定） | アサイン済・PM 起動待ち | 2026-05-06 |

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
| 2026-05-06 | MASTER（ep-16 us-37 着手判定） | **ep-12〜14 進捗ヒアリング**: ① mock 改修フェーズ 2 の担当ワーカー／② 残ストーリー（us-28 看護診断・us-29 看護計画・us-30/31 評価）の状況／③ 完了見込み時期／④ 看護過程タブ統合 API（`embedded`/`patientId` prop の有無、既存 `PatientCarePlan` のシグネチャ） | `docs/changes/ep-12-13-14-integration.md` 参照／PM が直接ヒアリング | us-37 着手前（S2 us-36 完了後が望ましい） |

**過去の MASTER 待ち事項の処理:**

- 2026-05-02 起票・S3（ep-10） フローシートタブ統合 → **ep-15 us-33 AC-8** に吸収（新カルテ画面で `<FlowsheetPage embedded patientId={...} />` 埋込として実装予定）。`KarteAlphaPage` 側の同統合は **段階 2**（後続エピック）扱い。
- 2026-05-06 起票・S2（ep-15 着手順序 \[1\]） design-rules §12 リナンバー方針 → **案 B 採用**（既存 §12〜§19 を §13〜§20 にリナンバー、新 §12 として「mode 切替」を割込み）。リナンバー作業は MASTER が直接実施済（design-rules.md 編集 + 改訂履歴追記、新 §12 はスタブ）。S2 は **着手順序 \[1\] = §12 本文の執筆** に専念可能。

### 並行運用の干渉事例（履歴注記）

- **2026-05-06 commit `30151eb`**: メッセージは「feat(ep-15/us-33): AC-10 タブ状態の URL ハッシュ反映」（S2 担当）だが、実体は以下の混在 commit。
  - S2 の AC-10 実装: `src/components/karte/KartePage.tsx` (+66 / -1)
  - S4 の段階 1 クローズ作業: `src/components/karteOutpatient/OutpatientKartePage.tsx` 削除 (-947) / `src/components/outpatient/PatientBasicPage.tsx` 削除 (-582) / `src/layouts/MainLayout.tsx` (+2 / -1) / `src/routes/index.tsx` (+9 / -7)
  - **原因**: S2 が `git add KartePage.tsx` してから `git commit` する間に、S4 セッションが同時並行で他ファイルをステージし index に積まれた。S2 commit が走った瞬間に S4 の index 内変更も巻き込まれて 1 commit に。
  - **判断**: コードは正しい状態（MASTER 推奨と一致）にあるため revert はしない。**案 A: 現状維持 + 履歴注記で吸収**（S2 提案・MASTER 採用）。force push や履歴改変は HANDOVER ルール違反のため不採用。
  - **記録 commit**: S4 が `bc12a57` で `docs/changes/ep-15-outpatient-emr.md` に #3 / #5 完了メモ + 巻き込み経緯を別途追記し push。
  - **教訓**: ワーカーは `git add <file>` の直後に `git diff --cached --stat` で **必ず** ステージ範囲を確認してから commit する（feedback_parallel_session_fs_interference.md 追記予定）。

- **2026-05-06 ep-16 立ち上げ時のダブル巻き込み（commit `cfc0e83` と `9ba5894`）**: メッセージと実体が双方向に交差する事故。
  - **commit `cfc0e83`**: メッセージは「docs(ep-16): Phase 0 完了 — KarteAlphaPage インベントリ + us-36/37 spec + S2 アサイン」（MASTER 担当）。**実体は S4 の us-38 work**（`src/components/wardMap/WardMap.tsx` +5/-1 / `src/components/patientList/PatientList.tsx` +5/-1）のみ。MASTER が staged した 4 ファイル（HANDOVER / changes/ep-16 / us-36 spec / us-37 spec）は **1 つも入らなかった**。
  - **commit `9ba5894`**: メッセージは「feat(ep-16/us-38): 病棟マップ・入院患者一覧から /karte/:patientId に切替」（S4 担当）。**実体は HANDOVER + changes/ep-16-outpatient-emr-stage2.md（213 行新規）+ S3 の us-35 work**（`src/components/karte/patientInfo/{Attributes,BasicInfo,Memo}Subview.tsx`）。S4 自身の WardMap/PatientList は **`cfc0e83` に飲まれていた**。
  - **原因**: MASTER が大量の `git add` → `git commit` 間に、S3 / S4 が並行で `git add` を実行。git index がプロセス間で共有されているため、commit 実行時に **直近 staged の塊** が消費される。MASTER の commit は S4 の index を、S4 の commit は MASTER + S3 の index を、それぞれ拾ってしまった。
  - **判断**: コードと doc の整合は取れているため revert しない。本注記で履歴を補足。**段階 1 と同パターン・3 回目**。
  - **未 push のまま残ったファイル**: `docs/specs/ep-16-outpatient-emr-stage2/us-36-inpatient-actions.spec.md`、`us-37-nursing-process-tab.spec.md`（後続 commit で push）。
  - **教訓・再強調**: 並行ワーカーが多い時間帯は **`git add` から `git commit` までを文字通り即時** に閉じる（`git add file && git commit` を 1 行で）。`git add → 確認コマンド → git commit` の間に他セッションが挟むと巻き込まれる。共通 briefing `.claude/briefings/common.md` §3 の git 衛生プロトコルにこの事例を追加すべき（PM 検討）。

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
| ep-10 看護実施（フローシート） | us-17〜us-26 | `/nursing/*`、カルテタブ埋込済（S3 が us-17 バイタルグラフ補修を 2026-05-06 完了 push 済） |
| ep-15 外来 EMR 刷新（段階 1） | us-32, us-33, us-34 | `/outpatient`, `/karte/:patientId`（外来 mode）。段階 1 完了（2026-05-06 PM OK）。`OutpatientKartePage` 撤去済、`/outpatient/:patientId/basic` は `/karte/:patientId#patient-info` に互換リダイレクト |

### 🟠 進行中

| Epic | 業務領域 | 子ストーリー | 状態 |
| --- | --- | --- | --- |
| ep-12 看護診断 | 看護 | us-28 | spec 確定（方針 Y）／mock 改修フェーズ 2 進行中 |
| ep-13 看護計画 | 看護 | us-29 | 同上（期間複数計画モデル実装中） |
| ep-14 看護評価 | 看護 | us-30, us-31 | 同上 |
| ep-16 外来 EMR 刷新（段階 2） | 外来・共通 | us-35, us-36（後続）, us-37（後続）, us-38 | spec 起こし済（`docs/specs/ep-16-outpatient-emr-stage2/`）。**S3 が us-35（入院 mode 本実装）にアサイン済**、**S4 が us-38（呼び出し元修正）にアサイン済**（並列）。us-36 / us-37 は後続（Phase 0 / ep-12〜14 進捗依存） |

### 🟡 残（未着手）

ep-15 段階 1 完了に伴い、段階 3 を後続エピックとして manifest 登録済:

- **ep-17** 外来 EMR 刷新・段階 3（`docs/issues/epics/ep-17-outpatient-emr-stage3.md`）: `/karte-alpha` を新カルテに置換、`KarteAlphaPage` 撤去。想定子ストーリー us-39〜41（仮、ep-16 完了後に確定）

### 全エピック完了後

- ~~サイドメニュー整理（最終タスク）~~ → 2026-05-04 S2 が先行実施済み（4 セクション化）

---

## 並行セッション運用

### 前提: git worktree による物理的な分離（2026-05-07 移行済）

段階 1〜2 で **3 回の commit 巻き込み事故**（FS 共有 + git index 並行アクセスが原因）が発生したため、各 AI セッションを独立した worktree に分離する運用に切り替えた。

```text
~/project/
├── RakuEMR/         ← MASTER 専用（main ブランチ）
├── RakuEMR-s2/      ← S2 専用（worker/s2 ブランチ）
├── RakuEMR-s3/      ← S3 専用（worker/s3 ブランチ）
└── RakuEMR-s4/      ← S4 専用（worker/s4 ブランチ）
```

セットアップは `scripts/setup-worktrees.sh` を MASTER の worktree で 1 度実行（冪等）。各 Claude Code セッションは対応する worktree のディレクトリで起動する。

| ロール | 作業ディレクトリ | 担当ブランチ | push 先 |
| --- | --- | --- | --- |
| MASTER | `~/project/RakuEMR/` | `main` | `origin/main`（ワーカー branch のマージ集約） |
| S2 | `~/project/RakuEMR-s2/` | `worker/s2` | `origin/worker/s2` のみ |
| S3 | `~/project/RakuEMR-s3/` | `worker/s3` | `origin/worker/s3` のみ |
| S4 | `~/project/RakuEMR-s4/` | `worker/s4` | `origin/worker/s4` のみ |

### 標準フロー（ワーカー）

```bash
# セッション開始時
cd ~/project/RakuEMR-s<N>             # 自 worktree へ
git fetch origin main                 # main の最新を取得
git merge origin/main --ff-only       # 自 branch に取り込み（または rebase）

# ... 編集 ...

# 完了時
git add <変更したファイルを明示で>     # 「.」「-A」は禁止
git diff --cached --stat              # ステージ範囲を確認
git commit -m "..."
git push origin worker/s<N>           # 自 branch のみ push
# → HANDOVER の自 row を「完了」に更新
# → PM へ完了報告
# → MASTER がワーカーブランチを main にマージ
```

### 標準フロー（MASTER）

```bash
cd ~/project/RakuEMR                  # main worktree
git pull --ff-only                    # main の最新を取得

# ワーカーの完了報告を受けて main にマージ
git fetch origin worker/s<N>
git merge origin/worker/s<N>          # 通常 fast-forward or 自動マージ
# 競合があれば MASTER が解決
git push origin main
```

### 干渉パターンと対処（worktree 移行後）

| 症状 | 発生箇所 | 対処 |
| --- | --- | --- |
| Edit ツールが「File has been modified since read」で失敗 | **基本発生しない**（worktree が物理分離済）。HANDOVER の自 row を MASTER と worker が同時編集した場合のみ稀に発生 | Read し直してから Edit リトライ |
| `git push` で reject される | ワーカーが `worker/s<N>` 以外に push した（ルール違反） | 自 branch に push し直す |
| `git merge` で HANDOVER のコンフリクト | ワーカーが他 row を触った（ルール違反） or MASTER 行と同時編集 | MASTER が解決。ワーカーは「自分の row のみ編集」を再徹底 |

### HANDOVER 編集規律（重要）

**ワーカーは `docs/HANDOVER.md` の自分の row のみ編集する**。他のワーカー / MASTER の row は読むだけ。

- 他 row を更新したい場合 → MASTER 待ち事項に起票
- 表構造（ヘッダ・運用ルール・MASTER 待ち事項表 等）の変更は MASTER のみ
- これを守れば worktree 間の merge は ROW レベルで競合しない

### 共有ファイルの取り扱い

worktree 分離後も、論理的には複数 us から書く可能性のあるファイルがある。基本方針:

| ファイル | 取り扱い |
| --- | --- |
| `src/types/index.ts` | 既存シグネチャ変更は MASTER 待ち事項。追加は末尾に。複数 us で同時追加が発生する場合は MASTER が事前合議 |
| `src/stores/useAppStore.ts` | 同上 |
| `src/data/mockData.ts` の `MASTER_*` | 同上 |
| `src/components/common/` | 新規追加・既存改変ともに MASTER 待ち事項 |
| `docs/screen-mapping.tsv` | 行追加は OK、既存行変更は MASTER 待ち事項 |
| `docs/changes/ep-XX-*.md` | 末尾追記が安全。同 us を 1 worker で完結させる前提 |
| `src/components/karteAlpha/KarteAlphaPage.tsx` | クイック操作領域への追加は MASTER 待ち事項（段階 3 で撤去予定） |

### 業務領域での分担（参考）

| セッション | 担当領域 | エピック |
| --- | --- | --- |
| S2 | 隔離拘束系・入院アクション | ep-05, ep-06, ep-07, ep-08, ep-16/us-36 |
| S3 | 看護・カルテ画面 | ep-10, ep-15/us-34, ep-16/us-35 |
| S4 | 共通・病床管理残・遷移系 | ep-04, ep-09, ep-15/us-32, ep-16/us-38 |

別領域同士は同時進行しても衝突しにくい（worktree 分離で物理的にも保証される）。

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

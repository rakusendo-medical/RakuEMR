# us-29 [看護] 看護計画編集

## メタ

| 項目 | 内容 |
| --- | --- |
| 対応エピック | [ep-13 看護計画](./_epic.md) |
| 対応モック画面 | パス: `/care-plan/patients/:patientId`<br>実装: `src/features/carePlan/pages/PatientCarePlan.tsx` ／ `CarePlanCreate.tsx`<br>関連ダイアログ: `CarePlanEditDialog.tsx` ／ `ProblemItemEditDialog.tsx` ／ `CopyFromDialog.tsx` ／ `NandaSelectDialog.tsx`（[ep-12]） |
| 想定ロール | 受け持ち看護師 |
| ステータス | draft |

### 参考システムマニュアル

| ファイル | ページ範囲 | 対象画面 |
| --- | --- | --- |
| 02 看護支援オプション.pdf | p.87-111 | 看護計画／問題点 |

> **方針 Y / 既存実装尊重 + 例外 1 件で mock 改修**: 詳細は [docs/changes/ep-12-13-14-integration.md](../../changes/ep-12-13-14-integration.md) 参照。
> - **方針 Y 例外**: 「期間で区切る複数計画」は mock 改修フェーズ 2 で導入
> - 採用しない: ラベルパターン1/2 / 並び替えダイアログ / アセスメント・問題点タブ構成 / 「看護診断より追加」独立フロー / 同期間複数計画並立 UI 警告

## ユーザーストーリー

- **As a** 受け持ち看護師
- **I want** 患者の看護計画を期間単位で立案・編集し、計画明細を柔軟に追加・更新・クローズしたい
- **So that** 病状変化に応じて計画を区切って管理し、月次評価まで一貫した運用ができる

## 画面要素（要素ツリー）

```
- 看護過程画面 (/care-plan/patients/:patientId)
  - 患者ヘッダー（PatientHeader）
    - 患者番号 / 氏名 / 年齢 / 性別 / 病室 / 主診断 / 受け持ち看護師 / 入院日
  - 期間プルダウン（mock 改修フェーズ 2 で導入）
    - 既存計画一覧（期間表示、最新が先頭）
    - 各項目: 「YYYY/MM/DD - YYYY/MM/DD（または継続中）」+ ステータス
    - 末尾: 「+ 新規期間で計画立案」
  - 計画メタ操作群（ボタン列）
    - [看護過程を編集] = CarePlanEditDialog
    - [印刷] = window.print() で PrintLayout
    - [評価する] = MonthlyEvaluation 画面へ遷移（[ep-14]）
    - 「過去診断を参照」リンク = NandaSelectDialog 履歴参照モード（[ep-12]、mock 改修フェーズ 1）
  - 長期目標セクション（折りたたみ）
    - SectionHeader: 「長期目標」
    - 内容: longTermGoal テキスト
    - 立案日 / 立案者表示
  - 有効計画明細セクション
    - SectionHeader: 「計画 (N件)」+ 全件展開 / 全件折りたたみボタン
    - 計画明細カード × N（優先度+#No 順自動ソート）
      - ヘッダー部
        - #番号 / StatusChip / PriorityChip / 領域 Chip
        - [編集] / [削除] ボタン
      - 本文部（折りたたみ）
        - 「問題点」（problemStatement、太字、NANDA 名フォールバック）
        - 「看護診断 (NANDA)」（コード + 名称、薄字）
        - 「短期目標」
        - OTE（観察 O / 援助 T / 指導 E、3 区分カラー表示）
      - フッター部
        - 立案日 / 最終評価 / 次回期限
  - 解決済みセクション（折りたたみ、グレーアウト）
    - SectionHeader: 「解決済み (N件)」
    - 計画明細カード × N（dimmed 表示）
      - ヘッダー部のみ（アコーディオン折りたたみで展開可、内容同上）
      - クローズ理由 / クローズ日表示
  - 明細追加ボタン群
    - [看護計画を追加] = ProblemItemEditDialog (create mode)
    - [引用コピー] = CopyFromDialog
  - 改善: 全件展開 / 全件折りたたみトグル

- 計画立案画面 (/care-plan/patients/:patientId/create) — 新規期間として作成
  - 3 ステップワークフロー（Stepper UI）
    - ステップ 1: 長期目標入力
      - テキストエリア（長期目標）
      - テンプレート長期目標引用（Collapse）
    - ステップ 2: 計画明細を追加
      - [看護計画を追加] = ProblemItemEditDialog
      - [引用コピー] = CopyFromDialog（allowLongTermGoalCopy=true）
      - 追加済み明細リスト（編集 / 削除可能）
    - ステップ 3: 立案確定
      - [下書き保存] = status='draft' で保存
      - [立案確定] = status='active' で保存（評価期限を立案日 + 1 ヶ月で初期化）

- ProblemItemEditDialog
  - ヘッダー: タイトル「看護計画を追加 / 編集」
  - フォーム
    - 領域分類（PROBLEM_DOMAINS から選択）
    - 優先度（高 / 中 / 低、ラジオ）
    - 看護診断（NANDA）
      - 表示: NANDA 名 (コード) / 領域
      - [選択...] ボタン → NandaSelectDialog 起動（[ep-12]）
    - 問題点（手入力可・必須、最大 500 文字）
      - NANDA 選択時に診断名で自動補完、ユーザー編集後は上書きしない
    - 短期目標（テキストエリア、必須）
    - OTE（観察 / 援助 / 指導、3 区分の行リスト編集 = OteInput）
  - フッター
    - [この看護計画をクローズ...] = メニュー（解決 / 中止 / 変更、編集モードのみ）
    - [キャンセル]
    - [保存（下書き）] = status='draft'
    - [保存して有効化] = status='active'

- CarePlanEditDialog
  - 立案日（編集可、評価期限には影響しない注記）
  - 長期目標
  - 期間情報（mock 改修フェーズ 2 で拡張: periodStart / 継続中チェック / periodEnd）
  - [更新]
  - 注: 期間情報の編集は同期間並立制約に違反する場合エラー表示

- CopyFromDialog（3 ソース統合 UI）
  - ソース選択タブ
    - テンプレート
    - 他患者
    - 同一患者の過去計画
  - 検索フィルタ（タブ別）
    - テンプレート: 名称検索
    - 他患者: 患者氏名 / 患者ID 検索
    - 過去計画: 立案日範囲 / 長期目標キーワード
  - 「長期目標も含めて取り込む」チェック（テンプレートタブのみ表示）
  - 取込明細リスト
    - 各明細にチェックボックス
    - 表示: 領域 / 優先度 / 看護診断（NANDA 名）/ 短期目標
  - フッター
    - [キャンセル]
    - [取り込み] = 選択明細を draft で複写、ダイアログを閉じる

- PrintLayout（印刷専用ビュー）
  - .print-only クラスで通常時非表示、印刷時のみ表示
  - 患者情報（氏名・年齢・性別・病室・主診断）
  - 立案日 / 立案者 / 印刷日
  - 長期目標
  - 計画明細毎: #番号 / 領域 / 優先度 / ステータス / 問題点 / 看護診断 / 短期目標 / OTE / 立案日 / 最終評価
```

## 振る舞い

- **画面初期表示**: 当該患者の最新有効計画を取得して表示。複数計画ある場合は期間プルダウンで切替（mock 改修フェーズ 2）
- **期間プルダウン変更**: 当該期間の計画 + 明細を表示
- **期間プルダウン「+ 新規期間で計画立案」**: `/care-plan/patients/:patientId/create` に遷移
- **[看護過程を編集] クリック**: CarePlanEditDialog 起動 → [更新] で立案日・長期目標・期間を保存
- **[印刷] クリック**: window.print() で PrintLayout 出力
- **[評価する] クリック**: `/care-plan/patients/:patientId/evaluate` に遷移
- **「過去診断を参照」クリック** (mock 改修フェーズ 1): NandaSelectDialog を履歴参照モードで起動
- **計画明細カード [編集] クリック**: ProblemItemEditDialog edit mode で起動
- **計画明細カード [削除] クリック**: 確認ダイアログ → 削除（mock では closedAt 設定相当）
- **明細追加 [看護計画を追加]**: ProblemItemEditDialog create mode → [保存（下書き）] / [保存して有効化]
- **明細追加 [引用コピー]**: CopyFromDialog → ソース選択 → 明細チェック → [取り込み]
- **明細クローズ（編集ダイアログ内 [この看護計画をクローズ...]）**: メニュー（解決 / 中止 / 変更）→ クローズ理由テキスト入力 → 確定で status を closed_resolved / closed_cancelled / closed_changed に遷移、closedAt = TODAY
- **計画立案画面 [立案確定]**: 計画 status='active' に遷移、各明細 status='draft' → 'active'、nextEvaluationDueAt = 立案日 + 1 ヶ月
- **計画立案画面 [下書き保存]**: 計画 status='draft' のまま保持
- **同期間並立違反**: 新規期間作成時 / 期間編集時に既存計画と期間重複する場合、保存をエラーで止める

## 受け入れ基準（AC）

- [ ] **AC-1: 看護過程画面を表示できる**
  - **Given** 患者の有効計画が存在する
  - **When** `/care-plan/patients/:patientId` を開く
  - **Then** 患者ヘッダー / 計画メタ操作 / 長期目標 / 有効計画明細 / 解決済み の各セクションが表示される

- [ ] **AC-2: 期間プルダウンで計画を切替できる**（mock 改修フェーズ 2）
  - **Given** 患者に複数期間の計画がある
  - **When** 期間プルダウンで別の期間を選択する
  - **Then** 当該期間の計画 + 明細が画面に表示される

- [ ] **AC-3: 同期間に複数計画が並立しない**（mock 改修フェーズ 2）
  - **Given** 既存計画 A（2026-01-01 〜 2026-03-31）が存在する
  - **When** 新規計画 B を 2026-02-15 〜 で作成しようとする
  - **Then** 期間重複エラーが表示され保存できない

- [ ] **AC-4: 計画立案画面で 3 ステップで立案できる**
  - **Given** `/care-plan/patients/:patientId/create` を開いている
  - **When** ステップ 1 で長期目標入力 → ステップ 2 で明細を 1 件以上追加 → ステップ 3 で [立案確定] をクリック
  - **Then** 計画 status='active'、各明細 status='active'、nextEvaluationDueAt 設定済みで `/care-plan/patients/:patientId` に遷移

- [ ] **AC-5: 立案確定で next evaluation due が設定される**
  - **Given** 計画立案で [立案確定] を実行した
  - **When** 計画明細を確認する
  - **Then** 各明細の nextEvaluationDueAt = 立案日 + 1 ヶ月

- [ ] **AC-6: 計画明細を新規追加できる**
  - **Given** 看護過程画面を表示している
  - **When** [看護計画を追加] → ProblemItemEditDialog で領域 / 優先度 / NANDA / 問題点 / 短期目標 / OTE を入力 → [保存して有効化]
  - **Then** 計画明細が追加され、優先度+#No 順で表示される

- [ ] **AC-7: NANDA + 問題点が必須で計画明細を作成できる**
  - **Given** ProblemItemEditDialog を開いている
  - **When** NANDA 選択 + 問題点記述 + 短期目標 を入力
  - **Then** 保存可能（[保存] ボタン disabled 解除）。いずれか欠如すれば disabled

- [ ] **AC-8: 計画明細を編集できる**
  - **Given** 既存の計画明細がある
  - **When** カード [編集] → ProblemItemEditDialog edit mode で内容変更 → [保存]
  - **Then** 内容が更新され、changeLogs に記録される

- [ ] **AC-9: 計画明細をクローズできる（解決 / 中止 / 変更）**
  - **Given** 編集中の計画明細がある
  - **When** [この看護計画をクローズ...] メニュー → 「解決でクローズ」「中止でクローズ」「変更でクローズ」 のいずれか → 理由入力 → 確定
  - **Then** 当該明細の status が closed_resolved / closed_cancelled / closed_changed に遷移、closedAt 設定、画面で解決済みセクションに移動（dimmed 表示）

- [ ] **AC-10: 引用コピーで計画明細を追加できる（3 ソース）**
  - **Given** 看護過程画面を表示している
  - **When** [引用コピー] → CopyFromDialog → ソースタブ（テンプレート / 他患者 / 過去計画）から選択 → 明細チェック → [取り込み]
  - **Then** 選択明細が draft で複写され、編集して有効化できる

- [ ] **AC-11: テンプレートからの長期目標引用ができる**
  - **Given** CopyFromDialog のテンプレートタブを開いている
  - **When** 「長期目標も含めて取り込む」をチェック → テンプレート選択 → [取り込み]
  - **Then** 計画の longTermGoal がテンプレートの値で上書きされる

- [ ] **AC-12: 優先度+#No 順で自動ソートされる**
  - **Given** 計画明細が複数ある（優先度: 高×2 / 中×1 / 低×1）
  - **When** 看護過程画面を表示する
  - **Then** 優先度高 (#No 昇順) → 中 (#No 昇順) → 低 (#No 昇順) の順で表示される

- [ ] **AC-13: 解決済み計画明細はグレーアウト表示**
  - **Given** クローズ済み計画明細がある
  - **When** 看護過程画面を表示する
  - **Then** 解決済みセクションに dimmed（opacity 低下 + グレー背景）で表示される

- [ ] **AC-14: 印刷レイアウトで一覧出力できる**
  - **Given** 計画明細が登録されている
  - **When** [印刷] をクリック
  - **Then** PrintLayout が表示され、患者情報・長期目標・各明細詳細が印刷向けに整形される

- [ ] **AC-15: 評価画面に遷移できる**
  - **Given** 看護過程画面を表示している
  - **When** [評価する] をクリック
  - **Then** `/care-plan/patients/:patientId/evaluate` （[ep-14]）に遷移する

- [ ] **AC-16: 看護過程メタ情報を編集できる**
  - **Given** 既存計画がある
  - **When** [看護過程を編集] → CarePlanEditDialog で立案日 / 長期目標 を変更 → [更新]
  - **Then** 内容が更新される。注: 評価期限・各明細には影響しない（注記表示）

- [ ] **AC-17: 過去診断を履歴参照モードで開ける**（mock 改修フェーズ 1）
  - **Given** 看護過程画面を表示している
  - **When** 「過去診断を参照」リンクをクリック
  - **Then** NandaSelectDialog が履歴参照モードで起動し、過去診断をページめくりで閲覧できる

## 状態遷移 / バリデーション

### CarePlan ステータス遷移

```
draft → active → closed
```

- draft: 立案中（CarePlanCreate で「下書き保存」した状態）
- active: 有効（運用中）
- closed: 終了（mock 改修フェーズ 2 で periodEnd 設定時に自動遷移想定）

### ProblemItem ステータス遷移

```
draft ─→ active ─→ evaluating ─→ active or closed_*
                  ↑              ↓
                  └─ closed_resolved / closed_cancelled / closed_changed
```

- draft: 下書き
- active: 有効（評価期限あり）
- evaluating: 評価中（修正検討中）
- closed_resolved / closed_cancelled / closed_changed: クローズ（解決 / 中止 / 変更）

### バリデーション

- 計画明細編集: NANDA 必須 + 問題点 必須 + 短期目標 必須
- 期間バリデーション（mock 改修フェーズ 2）:
  - periodStart 必須
  - 継続中 ON: periodEnd 不要
  - 継続中 OFF: periodEnd 必須、periodEnd ≥ periodStart
  - 同患者の他計画と期間重複しないこと
- クローズ時: クローズ理由テキスト推奨（任意）

## 補足

### 既存実装の状況

実装済み（本 spec の準拠率高い）:
- `PatientCarePlan.tsx`: 看護過程画面の主要表示（長期目標 / 有効 / 解決済みの 3 セクション、優先度自動ソート、グレーアウト、印刷、評価遷移）
- `CarePlanCreate.tsx`: 3 ステップワークフロー、テンプレート引用
- `CarePlanEditDialog.tsx`: 立案日・長期目標編集
- `ProblemItemEditDialog.tsx`: 計画明細の追加・編集・クローズ（NANDA + 問題点 必須、OTE 編集、クローズメニュー）
- `CopyFromDialog.tsx`: 3 ソース統合 UI（テンプレート / 他患者 / 過去計画）
- `OteInput.tsx`: OTE 行リスト編集
- `PrintLayout.tsx`: 印刷専用ビュー
- 優先度自動ソート、ステータス遷移 6 値、changeLogs

未実装（mock 改修対象）:
- 期間プルダウン / 期間情報（mock 改修フェーズ 2）
- 「継続中」チェック / 終了日入力（mock 改修フェーズ 2）
- 同期間並立制約（mock 改修フェーズ 2）
- 「過去診断を参照」リンク → 履歴参照モード起動（mock 改修フェーズ 1）

### 削除した参考システム機能

- ラベルパターン1/2 — 採用しない
- 並び替えダイアログ（手動並び替え）— 優先度+#No 自動ソートで運用
- アセスメントタブ / 問題点タブ構成 — タブ無し単一画面で運用
- 「看護診断より追加」独立フロー — NANDA は ProblemItemEditDialog のサブで完結
- 同期間複数計画並立 UI 警告 — 並立を許可しない（保存時エラー）
- 看護経過記録ダイアログ常設リンク — 評価フロー経由で連携
- FOCUS 連携時の自動関連付け — 将来検討（看護経過記録ダイアログ統合時）

### 用語

- 「**計画明細**」 = `ProblemItem`、UI 上の見出しは「問題点」
- 「**問題点**」 = `ProblemItem.problemStatement`（手入力テキスト、必須）
- 「**看護診断**」 = `ProblemItem.nandaCode`（NANDA コード）+ マスタ参照
- 詳細は [docs/specs/_terminology.md](../_terminology.md) 参照

# ep-09 患者情報 — 改修一覧

## 対象

- 画面: `/patients`
- 実装: `src/components/patientList/PatientList.tsx`（既存。本エピックで拡張）
- 参照 spec: [docs/specs/ep-09-patient-list/](../specs/ep-09-patient-list/)

## サマリ

| ストーリー | 改修前 AC | 想定後 AC | 状態 |
| --- | --- | --- | --- |
| us-16 入院患者一覧 (Phase 1) | 2/9 | 9/9 | ✅ 完了 |
| us-16 入院患者一覧 (Phase 2) | 0/6 | 6/6 | ✅ 完了（報告連携は Phase 3 へ） |

## 段階的実装方針

ep-09 は共有ファイル（`src/types/index.ts`、`src/data/mockData.ts`、`src/stores/useAppStore.ts`）に追加が必要な要素を含む。並行セッション運用上の干渉を避けるため、本ラウンドでは **Phase 1**（共有ファイル無修正）のみを完了させる。

### Phase 1（本ラウンド・共有ファイル無修正）

#### 既存実装と本フェーズの関係

- `src/components/patientList/PatientList.tsx` は `WardFilterTabs` + キーワード検索 + テーブル表示の最低限機能のみ
- 本フェーズでは **既存 Patient 型のフィールドのみで実装可能な範囲** を拡張する

#### 既存ファイル更新

- `src/components/patientList/PatientList.tsx`
  - 検索条件バーを拡張: 日付セレクト + 主治医プルダウン（既存タブ・キーワードと共存）
  - 並び替え: 病棟・病室／入院日／主治医（昇順 → 降順 → 解除のサイクル）
  - 患者番号セルクリックでカルテ遷移（既存の行クリックは維持）
  - ウィンドウ幅 < 1100px で ICD10・病名列を非表示（matchMedia）
  - 件数表示を強調

#### 新規ファイル

- なし（Phase 1 は既存 PatientList 単一ファイルの拡張で完了）

### Phase 2（後続ラウンド・MASTER 調整必須）

別ラウンドで対応。Patient 型変更は **ep-04（入退院歴）と協調必須**。

#### 共有ファイル変更

- `src/types/index.ts`
  - `Patient.assignedStaffIds: string[]` — 担当職員1〜10
  - `Patient.admissionFormType?: string` — 入院形態（ep-04 と共通定義化）
  - `Patient.responsibilityLevel?: string` — 責任レベル
  - `Patient.examinerIds?: string[]` — 診察医
- `src/data/mockData.ts`
  - `MASTER_STAFF` — 職員マスタ
  - `MASTER_RESPONSIBILITY_LEVELS` — 責任レベル区分
- `src/stores/useAppStore.ts`
  - `consultationFinishedMap: Record<string, { staffId: string; at: string }>` — 診察終了状態
  - `patientListSearchCondition: PatientListSearchCondition | null` — 検索条件のセッション保持

#### 新規コンポーネント

- `src/components/common/StaffSelectDialog.tsx` — 担当職員選択ダイアログ（複数選択 + 全/いずれかに一致）
- `src/components/common/DatePickerDialog.tsx` — 日付選択ダイアログ（MUI DatePicker 採用 or 自前）

#### 既存ファイル更新

- `src/components/patientList/PatientList.tsx`
  - 担当職員フィルタ条件設定
  - 「診察医登録分も表示」チェック
  - 入院形態列・責任レベル列・報告列・終了列の追加
  - 検索条件のセッション永続化

#### 報告連携

- 報告データ／報告一覧画面が現状未実装。Phase 2 で報告ストアと一覧画面を一体で設計する必要あり

## 着手順序（Phase 1 提案）

1. 並び替え state（sortKey: 'wardRoom' | 'admitDate' | 'doctor' | null + sortDir: 'asc' | 'desc'）を追加
2. 日付フィルタ追加（操作日初期値、`<input type="date">`）
3. 主治医プルダウン追加（PATIENTS から重複排除して動的生成）
4. 並び替え結合（既存フィルタとキーワード検索の後段に sort）
5. 患者番号セルにクリックハンドラ + カーソル変更
6. ICD10・病名列にレスポンシブ非表示（useMediaQuery('(min-width:1100px)')）
7. 件数表示の視認性向上
8. 動作確認 → tsc/build → screen-mapping 更新

## 完了確認

Phase 1 の AC-1〜AC-9 を全件チェックした時点で本ラウンド完了。Phase 2 は別ラウンドで対応。

## 実装後メモ（2026-05-02 / Phase 1）

### 追加・変更ファイル

- `src/components/patientList/PatientList.tsx` — 既存実装を拡張
  - 検索条件バーを追加: 基準日（`<input type="date">`）+ 主治医プルダウン
  - 並び替え対応（MUI `TableSortLabel`、昇順 → 降順 → 解除のサイクル）
    - 病棟・病室列、入院日列、主治医列
  - 患者番号セルにクリックハンドラ追加（`stopPropagation` で行クリックと併存）
  - 氏名列を「性別アイコン + 氏名 + （年齢）」表示に整形
  - 入院日列に在院日数（基準日基準）を併記
  - ICD10・病名列を `useMediaQuery('(min-width:1100px)')` で幅 < 1100px 非表示
  - 在院判定: `admissionState !== 'discharged'` かつ `admitDate <= baseDate`

### 実装上の判断・割り切り

- **病棟フィルタ**: spec の「プルダウン」ではなく既存 `WardFilterTabs`（タブ UI）を維持。他画面との UI 統一性を優先。Phase 2 でプルダウン化を再検討
- **入院日列の並び替え方向**: MUI の `asc` 矢印を「入院日昇順 = 古い順 = 在院日数降順」と扱う。spec の「ヘッダクリックで日数降順並び替え」は asc クリックで満たす
- **在院日数表記**: `admitDate` から `baseDate` までの日数 + 1（入院当日を 1 日目とカウント）
- **検索条件保持**: コンポーネント内 state のため、別画面に遷移して戻ると初期化される。spec の「ログアウトまで保持」は Phase 2 で `useAppStore` に移管
- **件数表示**: `Typography variant="body2"` + `fontWeight: 600` で視認性向上
- **「該当なし」表示**: キーワード以外のフィルタでも同じメッセージ（既存の「{query} に一致する患者が見つかりませんでした」を汎用化）

### 動作確認

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン

### UI 動作確認は未実施

ブラウザでの実操作確認（並び替えの動作、ウィンドウリサイズ時の列非表示、患者番号クリック動線、空フィルタ条件の表示）は未実施。Phase 1 の AC は型・ビルドレベルでの整合確認まで。

### Phase 2 引き継ぎ事項

- 担当職員1〜10 フィルタは `Patient.assignedStaffIds` + `MASTER_STAFF` + `StaffSelectDialog` の追加が必要
- 入院形態列は ep-04（入退院歴）と協調し、`AdmissionHistory.admitForm` から最新の値を引く設計が筋
- 検索条件保持は `useAppStore.patientListSearchCondition` に集約（既存の `wardFilter` と統合検討）
- 報告列・終了列は対応するデータストアが現状未整備のため、画面と一体で設計

## 実装後メモ（2026-05-02 / Phase 2）

### 追加・変更ファイル

- `src/components/common/StaffSelectDialog.tsx` — 新規。担当職員選択ダイアログ（複数選択 + 全/いずれかに一致 + 名前/ロール検索 + クリア）
- `src/data/mockData.ts` — 末尾に Phase 2 マスタ・拡張データを追加（commit 2c8f60c）
  - `MASTER_STAFF`（10名: 看護師長／主任／看護師／准看護師／看護助手）
  - `MASTER_RESPONSIBILITY_LEVELS`（L1〜L4）
  - `PATIENT_PHASE2_EXTRAS`（既存 PATIENTS への追加フィールドを別マップで提供）
  - `MASTER_STAFF_BY_ID`（ID 索引）
- `src/types/index.ts` — Patient に optional フィールド追加（commit 84e03b1）
  - `assignedStaffIds?: string[]`
  - `responsibilityLevel?: string`
  - `examinerIds?: string[]`
- `src/stores/useAppStore.ts` — Phase 2 状態追加（S2 commit d53b2ca に同梱して push 済）
  - `consultationFinishedMap` + `toggleConsultationFinished`
  - `patientListSearchCondition` + `setPatientListSearchCondition`
  - `PatientListSearchCondition` 型を export
  - 永続化対象に2項目追加（partialize）
- `src/components/patientList/PatientList.tsx` — Phase 2 統合（commit d94b007）
  - 担当職員フィルタ（StaffSelectDialog 起動 + Chip 表示）
  - 診察医チェック（主治医指定時のみ活性化）
  - 入院形態列（ADMISSION_HISTORY から status='入院中' の最新 admitForm 派生）
  - 責任レベル列（PATIENT_PHASE2_EXTRAS から取得、< 1100px 非表示）
  - 報告列（モック報告フラグでアイコン表示、クリックで snackbar 通知）
  - 終了列（useAppStore でトグル、ツールチップで職員名・時刻）
  - 検索条件を useAppStore.patientListSearchCondition から読出/保存（永続化）

### 実装上の判断・割り切り

- **PATIENTS 配列直書きを避けた理由**: 既存配列が複数エピックから参照されているため、別マップ `PATIENT_PHASE2_EXTRAS` で追加フィールドを提供。PatientList 側で合成
- **入院形態の派生**: Patient 型に重複保存せず、ADMISSION_HISTORY から `status === '入院中'` のうち admitDate 最大のレコードの admitForm を表示。ep-04 が形態変更を追加すれば自動追従する
- **「診察医登録分も表示」**: 主治医プルダウンが「全主治医」のときは disabled。主治医を個別指定したときのみ有効化。examinerIds は職員IDなので、フィルタ氏名と職員氏名が一致する場合に該当患者をマッチ
- **報告連携**: 報告ストア・報告一覧画面が未実装のため、`MOCK_PATIENTS_WITH_REPORTS` セット（4患者）にアイコン表示。クリックで snackbar 通知のみ。Phase 3 で報告ストアと一体化
- **診察終了の操作者**: モックではログオン者を `STF001 山田 看護師長` 固定。`useAppStore.currentUserRole` 連動は未対応（実装すると ep-09 のスコープ外）
- **検索条件の永続化**: useAppStore に集約。`baseDate` だけは初回マウント時に空文字を今日にフォールバック保存（持ち越しで「未指定」を区別する余地を残すため）
- **担当職員 Chip の onDelete**: 一括クリアのみ（個別解除はダイアログから再選択する想定）

### 動作確認

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン

### UI 動作確認は未実施

ブラウザでの実操作確認（StaffSelectDialog の挙動、診察終了トグルの永続化、診察医チェックの活性化判定、責任レベル列のレスポンシブ非表示、検索条件の画面遷移後の保持）は未実施。

### Phase 3 残課題

- 報告ストア・報告一覧画面の整備（ep-09 スコープ外、別エピック起こしを要検討）
- 診察終了の操作者を `useAppStore.currentUserRole` 連動に
- 病棟・病室列の並び替え順序を「病床管理マスタ」順に厳密化（現状は wardId + roomNumber のロケール順）
- 入院形態列が ep-04 の形態変更履歴と完全連動するかの動作確認

## 残課題（Phase 2 で扱う）

- 担当職員1〜10 フィルタ
- 入院形態列（ep-04 と要協調）
- 責任レベル列
- 報告列・遷移
- 終了列・操作
- 診察医登録分も表示
- 検索条件のセッション永続化
- 日付ピッカーダイアログ（カレンダー UI）

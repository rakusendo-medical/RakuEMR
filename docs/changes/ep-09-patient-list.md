# ep-09 患者情報 — 改修一覧

## 対象

- 画面: `/patients`
- 実装: `src/components/patientList/PatientList.tsx`（既存。本エピックで拡張）
- 参照 spec: [docs/specs/ep-09-patient-list/](../specs/ep-09-patient-list/)

## サマリ

| ストーリー | 改修前 AC | 想定後 AC | 状態 |
| --- | --- | --- | --- |
| us-16 入院患者一覧 (Phase 1) | 2/9 | 9/9 | 🟡 着手中 |
| us-16 入院患者一覧 (Phase 2) | 0/6 | — | ⏸ 後続ラウンド（要 MASTER 調整） |

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

## 残課題（Phase 2 で扱う）

- 担当職員1〜10 フィルタ
- 入院形態列（ep-04 と要協調）
- 責任レベル列
- 報告列・遷移
- 終了列・操作
- 診察医登録分も表示
- 検索条件のセッション永続化
- 日付ピッカーダイアログ（カレンダー UI）

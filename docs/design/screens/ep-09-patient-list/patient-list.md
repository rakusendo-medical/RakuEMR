# 入院患者一覧 画面設計書

## メタ

| 項目 | 内容 |
| --- | --- |
| 画面パス | `/patients` |
| 主要コンポーネント | [src/components/patientList/PatientList.tsx](../../../../src/components/patientList/PatientList.tsx) |
| 対応エピック | [ep-09 患者情報](../../../specs/ep-09-patient-list/_epic.md) |
| 対応ストーリー | us-16 |
| 対応 spec | [us-16-patient-list.spec.md](../../../specs/ep-09-patient-list/us-16-patient-list.spec.md) |
| 対応 API 設計書 | [api/ep-09-patient-list/patients.md](../../api/ep-09-patient-list/patients.md) |
| 対応ロール | 病棟看護師、主治医（医師ロール時は自分が主治医プルダウン初期選択） |
| ステータス | draft |

## 概要

入院中の患者集合を一覧で参照する共通基盤画面。日付・病棟・主治医・担当職員でフィルタし、業務開始時に必要な患者集合をすぐ取り出せる。一覧から各機能（カルテ・報告・診察終了）への入口を担う。

検索条件はセッション中（ログアウトまで）保持され、別画面に遷移して戻った際も前回条件で再表示される。

## 画面構成

### レイアウト

```
┌──────────────────────────────────────────────────────────────────┐
│ [全病棟] [第1病棟] [第2病棟]                          病棟タブ    │
├──────────────────────────────────────────────────────────────────┤
│ 基準日 [date]  主治医 [select▾]  □診察医登録分も表示             │
│ [👥担当職員] [Chip: 担当職員(全): 山田、佐藤 他1名×]              │
│                          氏名・患者番号・担当医・診断名 [🔍]      │
├──────────────────────────────────────────────────────────────────┤
│ ┌─────┬──────┬──────────┬─────┬──────────┬──────┬──────┬──┬───┐ │
│ │病棟▾│番号  │氏名(年齢) │状態 │入院日(日数)│形態  │ICD10│..│終了│ │
│ ├─────┼──────┼──────────┼─────┼──────────┼──────┼──────┼──┼───┤ │
│ │1棟/101│P001 │♂山田太郎 │安定 │2026-01-10│任意 │統失 │..│ ✓ │ │
│ └─────┴──────┴──────────┴─────┴──────────┴──────┴──────┴──┴───┘ │
├──────────────────────────────────────────────────────────────────┤
│ 12 件表示                                                         │
└──────────────────────────────────────────────────────────────────┘

[StaffSelectDialog]（担当職員ボタン押下時）
┌────────────────────────┐
│ 職員名・ロールで絞込み │
│ ○全てに一致 ●いずれか │
│ 選択中: 2 名           │
│ ☑ 山田 看護師長        │
│ ☑ 佐藤 主任            │
│ □ 鈴木 Ns              │
│ [クリア] [キャンセル][確定]│
└────────────────────────┘
```

### コンポーネント分割

| コンポーネント | パス | 役割 |
| --- | --- | --- |
| `PatientList` | `src/components/patientList/PatientList.tsx` | 画面ルート（フィルタ・テーブル・終了トグルを統合） |
| `WardFilterTabs` | `src/components/common/WardFilterTabs.tsx` | 病棟タブ（共通） |
| `StatusBadge` | `src/components/common/StatusBadge.tsx` | 患者状態のチップ表示（共通） |
| `StaffSelectDialog` | `src/components/common/StaffSelectDialog.tsx` | 担当職員選択ダイアログ（共通） |

### 表示要素

| 要素 | 役割 | データソース | 表示条件 |
| --- | --- | --- | --- |
| 病棟タブ | 病棟絞り込み | `WARD_LABELS`（types） | 常時 |
| 基準日 input | 在院判定の基準日 | local + `useAppStore.patientListSearchCondition.baseDate` | 常時、初期 = 操作日 |
| 主治医 Select | 主治医絞り込み | `PATIENTS` から重複排除 | 常時 |
| 診察医登録分も表示 | examinerIds に主治医候補が含まれる患者も表示 | `condition.includeExaminer` | 主治医 Select が「全主治医」のとき disabled |
| 担当職員ボタン + Chip | StaffSelectDialog 起動 + 選択結果表示 | `MASTER_STAFF` / `condition.staffIds` | 常時、選択ありで Chip 表示 |
| キーワード検索 | 氏名・番号・主治医名・診断名 部分一致 | `condition.query` | 常時 |
| 病棟・病室列 | 病棟 + 病室番号 | Patient.wardId + roomNumber | 常時、ヘッダクリックで sort |
| 患者番号セル | カルテ遷移リンク | Patient.id | 常時、クリックで `/karte-alpha/:patientId` |
| 氏名（年齢）セル | 性別アイコン + 氏名 + 年齢 | Patient.gender, name, age | 常時 |
| 状態 | StatusBadge | Patient.status | 常時 |
| 入院日（日数）セル | 入院日 + 在院日数 | Patient.admitDate, baseDate | 常時、ヘッダクリックで sort |
| 入院形態セル | 直近の admitForm | `ADMISSION_HISTORY` 派生（status='入院中' で admitDate 最大） | 常時、無ければ「—」 |
| ICD10・病名 | 診断名 | Patient.diagnosis | ウィンドウ幅 ≥ 1100px |
| 責任レベル | 責任レベル区分 | `PATIENT_PHASE2_EXTRAS[id].responsibilityLevel` | ウィンドウ幅 ≥ 1100px |
| 報告アイコン | 報告ありで色付き、なしでグレー | `MOCK_PATIENTS_WITH_REPORTS` セット（モック） | 常時 |
| 主治医列 | 主治医名 | Patient.doctorName | 常時、ヘッダクリックで sort |
| 終了アイコン | 診察終了状態トグル | `useAppStore.consultationFinishedMap[id]` | 常時 |
| 件数表示 | 結果件数 | sorted.length | 常時 |

## 状態管理

### ローカル state

| state | 型 | 初期値 | 用途 |
| --- | --- | --- | --- |
| `sortKey` | `'wardRoom' \| 'admitDate' \| 'doctor' \| null` | `null` | 並び替えキー |
| `sortDir` | `'asc' \| 'desc'` | `'asc'` | 並び替え方向 |
| `staffDialogOpen` | `boolean` | `false` | 担当職員ダイアログ開閉 |

### グローバル state（zustand `useAppStore`）

| store key | 型 | 用途 | 永続化 |
| --- | --- | --- | --- |
| `patientListSearchCondition` | `PatientListSearchCondition` | 検索条件（基準日・病棟・主治医・診察医・職員・キーワード） | localStorage |
| `consultationFinishedMap` | `Record<patientId, { staffId, staffName, finishedAt }>` | 診察終了状態 | localStorage |
| `setPatientListSearchCondition(patch)` | action | 検索条件部分更新 | — |
| `toggleConsultationFinished(patientId, staff)` | action | 診察終了の切替 | — |

### 派生値（useMemo）

- `doctorOptions`: `PATIENTS` から `doctorName` を重複排除してソート
- `filtered`: 在院判定（`admissionState !== 'discharged' && admitDate <= baseDate`）→ 病棟 → 主治医（+ 診察医オプション）→ 担当職員（all/any）→ キーワード の順で絞込
- `sorted`: `filtered` を `sortKey` / `sortDir` で並び替え
- `staffFilterLabel`: 担当職員 Chip 用ラベル（先頭 2 名 + 超過分は「他N名」）

### 派生関数

- `latestAdmitForm(patientId)`: `ADMISSION_HISTORY` から status='入院中' の admitDate 最大の admitForm を返す
- `matchesStaffFilter(patientId)`: 担当職員フィルタの照合（all/any）
- `matchesDoctor(patientId, doctorName)`: 主治医（+ examinerIds）照合
- `daysBetween(admitISO, baseISO)`: 在院日数

## 画面遷移

### 入口

- サイドメニュー「入院患者一覧」 → `/patients`
- 他画面からブラウザ戻る

### 出口

| トリガー | 遷移先 | 備考 |
| --- | --- | --- |
| 患者番号セルクリック | `/karte-alpha/:patientId` | `setSelectedPatient` で zustand に保存後 navigate |
| 行クリック | `/karte-alpha/:patientId` | 患者番号セルと同等動作 |
| 報告アイコンクリック | `/reports?patientId=...`（未実装） | 現状は snackbar 通知のみ |

## 操作シナリオ

### シナリオ 1: 受け持ち患者の確認

1. 看護師がサイドメニューから「入院患者一覧」を開く
2. 担当職員フィルタで自分を選択（StaffSelectDialog で「いずれかに一致」）
3. 担当患者のみ表示
4. 患者番号クリックでカルテ画面へ遷移
5. 戻ると検索条件が保持されている

### シナリオ 2: 主治医による診察前確認

1. 医師ロールでログオン → 主治医プルダウンが自分で初期選択（注: 現状モックでは未対応、Phase 2.5 で対応）
2. 「診察医登録分も表示」をチェックして担当外の診察対象も表示
3. 各患者の診察終了アイコンをクリックして終了状態に変更

### シナリオ 3: 病棟全体把握

1. 病棟タブで「第1病棟」選択
2. 入院日ヘッダクリックで日数降順並び替え
3. ICD10・病名で重症度を確認

## バリデーション

- 基準日: HTML5 date input のバリデーションに依存。空文字時は今日にフォールバック
- キーワード検索: 入力値そのまま（trim + 小文字化のみ）。SQL/HTMLインジェクション対策はバックエンド任せ
- 担当職員選択: 最大選択数の制限なし（マスタの全 10 名選択可）

## レスポンシブ

| ブレークポイント | 挙動 |
| --- | --- |
| `min-width: 1100px` | 全列表示 |
| `< 1100px` | ICD10・病名列、責任レベル列を非表示（`useMediaQuery`） |

## エラー・空状態

| 状況 | 表示 |
| --- | --- |
| 該当患者なし | テーブル中央「該当する患者が見つかりませんでした」 |
| 報告アイコンクリック（未実装画面） | snackbar 「報告一覧画面は未実装です」 |
| 通信エラー（実 API 想定） | （Phase 3 で要検討。現状モックは zustand 完結） |

## 連携 API

| 操作 | API | 設計書 |
| --- | --- | --- |
| 一覧取得 | `GET /api/patients?...` | [patients.md - 一覧取得](../../api/ep-09-patient-list/patients.md#一覧取得) |
| 担当職員マスタ取得 | `GET /api/master/staff` | [patients.md - マスタ](../../api/ep-09-patient-list/patients.md#関連マスタ-api) |
| 入院形態派生 | （ADMISSION_HISTORY から派生、独立 API なし） | [api/ep-04-admission-history/admission-histories.md](../../api/ep-04-admission-history/admission-histories.md)（未作成） |
| 診察終了切替 | `POST /api/patients/{id}/consultation-finished` | [patients.md - 診察終了切替](../../api/ep-09-patient-list/patients.md#診察終了切替) |
| 検索条件保持 | （クライアント側ストアのみ。実 API 不要） | — |

## 連携画面

| 連携先 | 受け渡し情報 | 経路 |
| --- | --- | --- |
| `/karte-alpha/:patientId` | patientId | URL parameter + `useAppStore.selectedPatient` |
| `/reports?patientId=...`（未実装） | patientId | URL query |

## 補足・残課題

### 実装済（Phase 1+2）

- 検索条件のセッション永続化、担当職員フィルタ、入院形態派生、診察終了トグル

### Phase 3 残課題

- 主治医プルダウンの「医師ロールでログオン時に自分を初期選択」（要 `currentUserRole` 連動）
- 報告ストア + 報告一覧画面（`/reports`）の整備
- 診察終了の操作者を `currentUserRole` 連動に
- 病棟・病室列の並び替え順序を「病床管理マスタ」順に厳密化（現状は wardId + roomNumber のロケール順）

### 既知の挙動メモ

- 行クリックと患者番号セルクリックが同等動作（行全体がリンクとして機能）
- 担当職員 Chip の onDelete は一括クリア（個別解除はダイアログから再選択）
- 在院判定の境界: `admitDate <= baseDate` を採用（同日入院は表示）
- 入院日列の並び替え: asc = 入院日昇順 = 在院日数降順（spec の「日数降順」初期動作と整合）

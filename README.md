# RakuEMR — 電子カルテシステム（フロントエンド）

精神科病院向け電子カルテシステムのフロントエンドモックアップです。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | React 18 + TypeScript |
| UI ライブラリ | MUI (Material UI) v5 |
| データグリッド | MUI X DataGrid v7 |
| 日付ピッカー | MUI X DatePickers v7 |
| 状態管理 | Zustand v4 |
| ルーティング | React Router v6 |
| チャート | Recharts |
| 日付処理 | Day.js |
| ビルドツール | Vite |

## セットアップ

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください（devcontainer 環境では自動起動しません）。

---

## 実装機能一覧

### サイドバーメニュー（14機能）

| # | 機能名 | パス |
|---|--------|------|
| 1 | 病棟マップ | `/` |
| 2 | 入院患者一覧 | `/patients` |
| 3 | 外来一覧 | `/outpatient` |
| 4 | 患者検索 | `/patient-search` |
| 5 | 入退院管理 | `/admission` |
| 6 | 看護記録 | `/nursing` |
| 7 | 隔離拘束 | `/isolation` |
| 8 | 行動範囲 | `/behavior` |
| 9 | 外出外泊 | `/outing` |
| 10 | 病棟管理 | `/ward-management` |
| 11 | 書類管理 | `/documents` |
| 12 | オーダ管理 | `/orders` |
| 13 | 看護ケア予定 | `/nursing-care` |
| 14 | 看護計画 | `/care-plan` |

### ルートのみ（サイドバー非表示）

| 機能名 | パス | 備考 |
|--------|------|------|
| 入院カルテ (Alpha) | `/karte-alpha/:patientId` | 患者一覧からアクセス |
| 外来カルテ | `/karte-outpatient/:patientId` | 外来一覧からアクセス |
| フローシート | `/flowsheet` | 入院カルテ内タブ |
| 患者スケジュール | `/schedule` | 入院カルテ内タブ |
| 一括入力 | `/batch-input` | 病棟マップから |
| リハビリ | `/rehab` | ルート残存（未掲載）|
| 患者登録 (ORCA連携) | `/patient-registration` | ルート残存（未掲載）|

---

## 看護計画モジュール（`src/features/carePlan/`）

サイドバーの「看護計画」から入る独立モジュールです。

### 画面構成

| 画面 | パス | 説明 |
|------|------|------|
| ダッシュボード | `/care-plan` | 担当看護師ごとの患者一覧・評価期限アラート |
| 患者計画詳細 | `/care-plan/patients/:id` | 長期目標・問題点一覧 |
| 新規計画立案 | `/care-plan/patients/:id/create` | 3ステップウィザード |
| 月次評価 | `/care-plan/patients/:id/evaluate` | 問題点ごとの達成度評価 |

### 主な機能

- **看護計画立案ウィザード** — 長期目標テンプレート選択（疾患別4種）→ 問題点追加 → 立案確定
- **問題点管理** — NANDA看護診断選択、領域分類、OTE（観察/援助/指導）入力
- **月次評価** — 問題点ごとの達成度・所見入力、評価完了後に看護記録へ転記可能
- **引用コピー** — 疾患別標準テンプレート・他患者・過去計画からの問題点コピー
- **評価期限アラート** — ダッシュボードで期限超過・今月評価必要を色分け表示

---

## プロジェクト構造

```
src/
├── main.tsx
├── App.tsx
├── types/
│   └── index.ts                  # 共通型定義（NursingRecord, VitalSign 等）
├── data/
│   ├── mockData.ts               # 汎用モックデータ（看護記録・バイタル等）
│   └── flowsheetMockData.ts      # フローシート用モックデータ
├── stores/
│   ├── useAppStore.ts            # グローバル状態（サイドバー・スナックバー等）
│   └── useNursingRecordStore.ts  # 看護記録ストア（評価転記に対応）
├── theme/
│   └── theme.ts
├── layouts/
│   └── MainLayout.tsx            # サイドバー + トップバー
├── routes/
│   └── index.tsx
├── features/
│   └── carePlan/                 # 看護計画モジュール（独立Feature）
│       ├── types.ts
│       ├── mockData.ts
│       ├── store.ts              # Zustand ストア
│       ├── routes.tsx
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── PatientCarePlan.tsx
│       │   ├── CarePlanCreate.tsx
│       │   └── MonthlyEvaluation.tsx
│       └── components/
│           ├── EvaluationForm.tsx
│           ├── ProblemItemCard.tsx
│           ├── ProblemItemEditDialog.tsx
│           ├── NandaSelectDialog.tsx
│           ├── OteInput.tsx
│           ├── CopyFromDialog.tsx
│           ├── PatientHeader.tsx
│           ├── PriorityChip.tsx
│           └── StatusChip.tsx
└── components/
    ├── common/
    ├── wardMap/
    ├── patientList/
    ├── patientMain/
    ├── karteAlpha/
    ├── karteOutpatient/
    ├── outpatient/
    ├── patientSearch/
    ├── admission/
    ├── nursing/
    ├── flowsheet/
    ├── batchInput/
    ├── isolation/
    ├── behaviorRange/
    ├── outing/
    ├── schedule/
    ├── wardManagement/
    ├── documents/
    ├── orders/
    ├── nursingCare/
    ├── rehab/
    └── patientRegistration/
```

---

## 設計方針

### モックデータ層
- `src/data/mockData.ts` に汎用モックデータを集約
- 看護計画モジュール固有のデータは `src/features/carePlan/mockData.ts` に分離
- 将来のAPI移行時は import 元を API フックに差し替えるだけで対応可能

### 状態管理（Zustand）
- `useAppStore` — サイドバー開閉、スナックバー通知、病棟フィルタ等のグローバル状態
- `useNursingRecordStore` — 看護記録（評価転記で動的追加に対応）
- `carePlan/store` — 看護計画・問題点・評価のCRUD + 変更履歴ログ

### 看護計画モジュールの独立性
- `src/features/carePlan/` に型・データ・ストア・ページ・コンポーネントをすべて内包
- 他モジュールへの依存は `useNursingRecordStore`（評価転記）と `useAppStore`（通知）のみ

---

## 今後の拡張ポイント

1. **バックエンドAPI接続** — モックデータ層を TanStack Query + REST/GraphQL に置換
2. **認証・ロール管理** — 医師 / 看護師 / 事務の権限分離
3. **ORCA連携** — 患者登録画面の API 実装（ルート・コンポーネントは実装済み）
4. **帳票出力** — 看護計画書・月次評価報告書・行動制限台帳の PDF 出力
5. **リアルタイム通知** — WebSocket によるオーダ・評価期限アラート
6. **リハビリモジュール** — リハビリオーダ・日報・評価（ルート・コンポーネントは実装済み）

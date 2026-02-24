# EMR - 電子カルテシステム（フロントエンド）

精神科病院向け電子カルテシステムのフロントエンドモックアップです。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | React 18 + TypeScript |
| UIライブラリ | MUI (Material UI) v5 |
| 状態管理 | Zustand |
| ルーティング | React Router v6 |
| チャート | Recharts |
| ビルドツール | Vite |
| 日付処理 | Day.js |

## セットアップ

```bash
cd emr-frontend
npm install
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスしてください。

## 実装機能一覧（全17機能）

| # | 機能名 | パス | 状態 |
|---|--------|------|------|
| 1 | 病棟マップ | `/` | ✅ 完全実装 |
| 2 | 入院患者一覧 | `/patients` | ✅ 完全実装 |
| 3 | 一括入力 | `/batch-input` | ✅ 完全実装 |
| 4 | 一括オーダ | `/batch-order` | ✅ 完全実装 |
| 5 | 入退院管理 | `/admission` | ✅ 完全実装 |
| 6 | 看護録 | `/nursing` | ✅ 完全実装 |
| 7 | フローシート | `/flowsheet` | ✅ 完全実装 |
| 8 | 隔離拘束 | `/isolation` | ✅ 完全実装 |
| 9 | 行動範囲 | `/behavior` | ✅ 完全実装 |
| 10 | 外出外泊 | `/outing` | ✅ 完全実装 |
| 11 | 患者スケジュール | `/schedule` | ✅ 完全実装 |
| 12 | 病棟管理 | `/ward-management` | ✅ 完全実装 |
| 13 | 書類管理 | `/documents` | ✅ 完全実装 |
| 14 | オーダ管理 | `/orders` | ✅ 完全実装 |
| 15 | リハビリ（作業療法） | `/rehab` | ✅ 完全実装 |
| 16 | 看護ケア予定 | `/nursing-care` | ✅ 完全実装 |
| 17 | 患者登録（ORCA連携） | `/patient-registration` | ✅ 完全実装 |

## プロジェクト構造

```
src/
├── main.tsx                    # エントリポイント
├── App.tsx                     # ルートコンポーネント
├── types/
│   └── index.ts                # 全型定義（30+ types）
├── data/
│   └── mockData.ts             # モックデータ層（将来のAPI切替用）
├── stores/
│   └── useAppStore.ts          # Zustand グローバルストア
├── theme/
│   └── theme.ts                # MUIカスタムテーマ
├── layouts/
│   └── MainLayout.tsx          # サイドバー + ヘッダーレイアウト
├── components/
│   ├── common/                 # 共通コンポーネント
│   │   ├── StatusBadge.tsx
│   │   └── WardFilterTabs.tsx
│   ├── wardMap/                # 1. 病棟マップ
│   ├── patientList/            # 2. 入院患者一覧
│   ├── patientMain/            # 入院メイン画面
│   ├── batchInput/             # 3. 一括入力
│   ├── batchOrder/             # 4. 一括オーダ
│   ├── admission/              # 5. 入退院管理
│   ├── nursing/                # 6. 看護録
│   ├── flowsheet/              # 7. フローシート
│   ├── isolation/              # 8. 隔離拘束
│   ├── behaviorRange/          # 9. 行動範囲
│   ├── outing/                 # 10. 外出外泊
│   ├── schedule/               # 11. 患者スケジュール
│   ├── wardManagement/         # 12. 病棟管理
│   ├── documents/              # 13. 書類管理
│   ├── orders/                 # 14. オーダ管理
│   ├── rehab/                  # 15. リハビリ
│   ├── nursingCare/            # 16. 看護ケア予定
│   └── patientRegistration/    # 17. 患者登録
└── routes/
    └── index.tsx               # ルーティング定義
```

## 設計方針

### モックデータ層
- `src/data/mockData.ts` にすべてのモックデータを集約
- 将来のAPI層追加時は、各コンポーネントのimport元をAPI hookに差し替えるだけで移行可能
- 生成関数（`generateVitalSigns`, `generateFlowsheetDaily`等）でダイナミックデータに対応

### 状態管理（Zustand）
- 軽量かつ型安全なグローバルストア
- 選択中の患者、病棟フィルタ、サイドバー状態、通知を管理
- 将来のサーバー状態管理にはTanStack Queryの追加を推奨

### 画面遷移
- 病棟マップ → 患者クリック → 入院メイン画面（サマリ/オーダ/看護録/フローシート）
- 病棟マップ → 病室選択 → 一括入力画面
- 各一覧画面は全病棟/第１病棟/第２病棟のフィルタ付き

## 今後の拡張ポイント

1. **バックエンドAPI接続** — モックデータ層をAPIフック（TanStack Query）に置換
2. **認証・ロール管理** — 医師/看護師/事務の3ロール対応
3. **ORCA連携** — 患者登録画面のAPI実装
4. **帳票出力** — 行動制限一覧性台帳、看護管理日誌等のPDF出力
5. **リアルタイム通知** — WebSocketによるオーダ通知

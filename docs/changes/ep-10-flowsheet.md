# ep-10 看護実施（フローシート） — 改修一覧

## 対象

- 画面（新規）:
  - `/flowsheet/:patientId`（個別フローシート起点）
  - `/nursing/records`（部門記録簿）
  - `/nursing/bulk-vitals`（一括バイタル）
  - `/nursing/sleep-table`（睡眠表）
  - `/nursing/bulk-records`（一括看護記録）
- 既存画面（連携）:
  - `/karte-alpha/:patientId` — 「フローシート」タブからフローシート画面に遷移
- 参照 spec: [docs/specs/ep-10-flowsheet/](../specs/ep-10-flowsheet/)

## サマリ

| ストーリー | 改修前 AC | 実装後 AC | 状態 |
| --- | --- | --- | --- |
| us-17 フローシート表示 | 0/9 | - | ⏳ 未着手 |
| us-18 フローシート編集 | 0/10 | - | ⏳ 未着手 |
| us-19 サイン記載 | 0/8 | - | ⏳ 未着手 |
| us-20 個別バイタル入力 | 0/10 | - | ⏳ 未着手 |
| us-21 フローシートパターン | 0/9 | - | ⏳ 未着手 |
| us-22 看護記録表示 | 0/8 | - | ⏳ 未着手 |
| us-23 個別看護記録 | 0/10 | - | ⏳ 未着手 |
| us-24 一括バイタル入力 | 0/12 | - | ⏳ 未着手 |
| us-25 一括睡眠活動入力 | 0/9 | - | ⏳ 未着手 |
| us-26 一括看護記録 | 0/13 | - | ⏳ 未着手 |

## 既存実装と本エピックの関係

- `src/features/carePlan/` は ep-13 看護計画（看護過程）専用で、フローシート系の実装は **存在しない**
- `src/components/karteAlpha/KarteAlphaPage.tsx` の「フローシート」「看護過程」タブは現状プレースホルダ「準備中」のみ
- サイドメニュー (`MainLayout.tsx`) に「看護記録（`/nursing`）」「看護過程（`/care-plan`）」エントリは存在するが、`/nursing` の中身は未実装
- 一括入力系の画面パスは未割当て。本エピックで `/nursing/bulk-vitals`、`/nursing/sleep-table`、`/nursing/bulk-records` を新設
- 個別フローシートは `/flowsheet/:patientId` を新設（KarteAlphaPage の「フローシート」タブからも遷移可能）

## 共通実装方針（案・PM 確認待ち）

### ファイル構造（提案）

[src/features/carePlan/](../../src/features/carePlan/) を踏襲し、`src/features/flowsheet/` を新設する。

```
src/features/flowsheet/
├── routes.tsx                  # /flowsheet/:patientId, /nursing/* のルート
├── store.ts                    # zustand: vitals/careRecords/signs/patterns/nursingRecords/sleepLogs
├── types.ts                    # Vital, CareRecord, Sign, FlowsheetPattern, NursingRecord, SleepLog 等
├── mockData.ts                 # MASTER_FLOWSHEET_PATTERNS, MASTER_CARE_ITEMS, NURSING_RECORD_TEMPLATES 等
├── pages/
│   ├── FlowsheetPage.tsx       # 個別フローシート（us-17）
│   ├── NursingRecordsPage.tsx  # 部門記録簿（us-22, us-23）
│   ├── BulkVitalsPage.tsx      # 一括バイタル（us-24）
│   ├── SleepTablePage.tsx      # 睡眠表（us-25）
│   └── BulkNursingRecordsPage.tsx  # 一括看護記録（us-26）
└── components/
    ├── FlowsheetHeader.tsx
    ├── FlowsheetGrid.tsx
    ├── FlowsheetMovementBar.tsx
    ├── VitalGraph.tsx
    ├── OrderColumn.tsx
    ├── SignRow.tsx
    ├── FlowsheetEditDialog.tsx     # us-18
    ├── VitalEditDialog.tsx         # us-20
    ├── SignInputDialog.tsx         # us-19
    ├── PatternChangeDialog.tsx     # us-21
    ├── PatternHistoryDialog.tsx    # us-21
    ├── OrderListDialog.tsx         # us-17（指示状況）
    ├── ExecutionConfirmDialog.tsx  # us-17（実施確認表）
    ├── LabResultGraphDialog.tsx    # us-17
    ├── NursingRecordDialog.tsx     # us-22, us-23
    ├── BulkInputDialog.tsx         # us-24, us-26（共通）
    ├── ShiftSelectDialog.tsx       # us-26
    ├── TimeSetDialog.tsx           # us-24, us-26（共通）
    └── SleepRecordDialog.tsx       # us-25
```

### ルート追加

[src/routes/index.tsx](../../src/routes/index.tsx) に下記ルートを追加（PM 確認事項）:

```
<Route path="/flowsheet/:patientId" element={<FlowsheetPage />} />
<Route path="/nursing" element={<NursingRecordsPage />} />        # /nursing トップを部門記録簿にする
<Route path="/nursing/records" element={<NursingRecordsPage />} />
<Route path="/nursing/bulk-vitals" element={<BulkVitalsPage />} />
<Route path="/nursing/sleep-table" element={<SleepTablePage />} />
<Route path="/nursing/bulk-records" element={<BulkNursingRecordsPage />} />
```

### KarteAlphaPage 連携

「フローシート」タブ（現プレースホルダ）に `<FlowsheetPage embedded />` または同等のコンポーネントを埋め込む案。**KarteAlphaPage の編集は HANDOVER 上で MASTER 確認が必要なので、PM 経由で確認**。

### 共有ファイルへの干渉

- `src/types/index.ts`: Patient 型への新フィールド追加が必要かは spec 起こし段階では未確定（フローシート系は `src/features/flowsheet/types.ts` に閉じる方針）。発生時は PM 経由で MASTER 確認
- `src/data/mockData.ts`: `MASTER_FLOWSHEET_PATTERNS`, `MASTER_CARE_ITEMS` 等の追加が必要だが、`src/features/flowsheet/mockData.ts` 側に閉じる方針で衝突回避
- `src/stores/useAppStore.ts`: ep-10 の状態は `src/features/flowsheet/store.ts` に閉じる方針で衝突回避（`useFlowsheetStore`）

## 着手順序（提案）

実装ボリュームが大きいため、以下の段階で進める：

### フェーズ 1: 土台（type / store / mockData / route）

1. `src/features/flowsheet/types.ts` — 型定義
2. `src/features/flowsheet/mockData.ts` — マスタ・サンプルデータ
3. `src/features/flowsheet/store.ts` — zustand ストア
4. `src/features/flowsheet/routes.tsx` — ルート定義
5. `src/routes/index.tsx` への組込
6. サイドメニュー (`MainLayout.tsx`) の `/nursing` ナビ調整（メニュー多階層化は PM 確認）

### フェーズ 2: 個別フローシート（us-17 / us-18 / us-19 / us-20）

7. `FlowsheetPage.tsx` 骨格（7 日表示・移動状況・体温表・予定オーダ・看護記録欄・サイン欄）
8. `VitalEditDialog` (us-20)
9. `FlowsheetEditDialog` (us-18)
10. `SignInputDialog` (us-19)
11. `OrderListDialog` / `ExecutionConfirmDialog` / `LabResultGraphDialog` (us-17)

### フェーズ 3: パターン（us-21）

12. `PatternChangeDialog` / `PatternHistoryDialog`

### フェーズ 4: 看護記録（us-22 / us-23）

13. `NursingRecordsPage` (us-22)
14. `NursingRecordDialog` (us-23)

### フェーズ 5: 一括入力系（us-24 / us-25 / us-26）

15. `BulkVitalsPage` + `BulkInputDialog` + `TimeSetDialog` (us-24)
16. `SleepTablePage` + `SleepRecordDialog` (us-25)
17. `BulkNursingRecordsPage` + `ShiftSelectDialog` (us-26)

### フェーズ 6: KarteAlphaPage 連携

18. KarteAlphaPage の「フローシート」タブを FlowsheetPage に差し替え（**PM 確認必須**）

各フェーズはコミットを細かく分け、各フェーズ完了時に push。

## 完了確認

各 spec の AC チェックリストを全件チェックした時点でクローズ。

## 残課題（着手前）

- **PM 確認事項**:
  - ファイル構造（`src/features/flowsheet/` 新設）の合意
  - ルート追加（`/flowsheet/:patientId`、`/nursing/*`）の合意
  - `KarteAlphaPage` 「フローシート」タブ差し替え
  - サイドメニュー多階層化（`/nursing` 配下に「部門記録簿／一括バイタル／睡眠表／一括看護記録」を入れるか、新トップ「看護実施」を切り出すか）
- 隔離拘束観察記録 [ep-07] とのフローシート上の入力切替タブ連携（タブ自体の枠は本エピックで用意するが、本体は ep-07 の S2 セッション完了後に統合）
- 一括看護記録の「氏名タイトル部クリックでかな順並び替え」のキーボード操作対応は将来検討

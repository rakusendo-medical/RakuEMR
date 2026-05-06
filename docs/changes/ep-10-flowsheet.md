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
| us-17 フローシート表示 | 0/9 | 8/9 | 🟠 補修待ち（バイタル「7 日 × 時間軸の格子状グラフ」未実装。詳細: 末尾「補修予定（2026-05-06 起票）」） |
| us-18 フローシート編集 | 0/10 | 10/10 | ✅ 完了（モック実装） |
| us-19 サイン記載 | 0/8 | 8/8 | ✅ 完了（モック実装） |
| us-20 個別バイタル入力 | 0/10 | 10/10 | ✅ 完了（モック実装） |
| us-21 フローシートパターン | 0/9 | 9/9 | ✅ 完了（モック実装） |
| us-22 看護記録表示 | 0/8 | 8/8 | ✅ 完了（モック実装） |
| us-23 個別看護記録 | 0/10 | 10/10 | ✅ 完了（モック実装。関連付け UI は将来） |
| us-24 一括バイタル入力 | 0/12 | 11/12 | ✅ 完了（モック実装。入力時間外グレー表示は将来） |
| us-25 一括睡眠活動入力 | 0/9 | 8/9 | ✅ 完了（モック実装。連続時間ドラッグは終了時刻セレクトで等価表現） |
| us-26 一括看護記録 | 0/13 | 12/13 | ✅ 完了（モック実装。連携ダイアログは行内チェックで簡素化） |

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
  - ファイル構造（`src/features/flowsheet/` 新設）の合意 — ✅ PM 承諾済み
  - ルート追加（`/flowsheet/:patientId`、`/nursing/*`）の合意 — ✅ PM 承諾済み
  - `KarteAlphaPage` 「フローシート」タブ差し替え — 🟡 HANDOVER に MASTER 待ち事項として起票（フェーズ 6）
  - サイドメニュー多階層化 — 🟡 HANDOVER に MASTER 待ち事項として起票
- 隔離拘束観察記録 [ep-07] とのフローシート上の入力切替タブ連携（タブ自体の枠は本エピックで用意するが、本体は ep-07 の S2 セッション完了後に統合）
- 一括看護記録の「氏名タイトル部クリックでかな順並び替え」のキーボード操作対応は将来検討

## 実装後メモ（2026-05-02）

### 追加・変更ファイル

すべて `src/features/flowsheet/` 配下に新設。共有 `src/types/index.ts` / `src/data/mockData.ts` /
`src/stores/useAppStore.ts` には触れず、本 feature 内に閉じる方針で統一。

| パス | 役割 |
| --- | --- |
| `types.ts` | Vital / CareRecord / Sign / FlowsheetPattern / NursingRecord / SleepLog / FlowsheetPropertyConfig 等の型定義 |
| `mockData.ts` | パターン 3 種・ケア項目 11 種・看護記録テンプレ 3 種・P001 サンプル一式・FLOWSHEET_WARDS・MASTER_BULK_VITAL_KINDS・MASTER_SLEEP_STATES |
| `store.ts` | zustand `useFlowsheetStore`（add/update/delete + changeLogs）+ resolveShift / getActivePatternForDate / last7Dates ヘルパ |
| `routes.tsx` | 5 ルート定義 |
| `pages/FlowsheetPage.tsx` | 個別フローシート画面（us-17 起点） |
| `pages/NursingRecordsPage.tsx` | 部門記録簿（us-22） |
| `pages/BulkVitalsPage.tsx` | 一括バイタル（us-24） |
| `pages/SleepTablePage.tsx` | 睡眠表（us-25） |
| `pages/BulkNursingRecordsPage.tsx` | 一括看護記録（us-26） |
| `components/FlowsheetHeader.tsx` | 入力切替タブ・日付ナビ・パターンボックス |
| `components/MovementBar.tsx` | 移動状況のオレンジ帯（病室/隔離/拘束/行動制限/外出/外泊） |
| `components/FlowsheetGrid.tsx` | 7 日 × ラベル列の格子（バイタル T 行・予定オーダ・ケア項目・検査結果・看護記録・サイン） |
| `components/VitalEditDialog.tsx` | バイタル複数行入力＋履歴（us-20） |
| `components/FlowsheetEditDialog.tsx` | ケア項目入力＋履歴（us-18） |
| `components/SignInputDialog.tsx` | サイン入力（us-19） |
| `components/PatternChangeDialog.tsx` | パターン適用／変更／削除（us-21） |
| `components/PatternHistoryDialog.tsx` | パターン編集履歴（us-21） |
| `components/OrderListDialog.tsx` | 1 ヶ月分の指示状況（us-17） |
| `components/ExecutionConfirmDialog.tsx` | 実施確認表（us-17） |
| `components/LabResultGraphDialog.tsx` | Recharts による検査結果グラフ（us-17） |
| `components/NursingRecordDialog.tsx` | 看護記録 FOCUS/SOAP/フリー（us-22, us-23） |
| `routes/index.tsx`（既存修正） | `FLOWSHEET_ROUTES` の import + 配置（2 行追加、CARE_PLAN_ROUTES と同パターン） |

### 実装上の判断・割り切り

- **状態は本セッションのみ保持**: `useFlowsheetStore` は永続化なし。リロードで初期化。サンプル
  データ込みでも開発時の動作確認には十分
- **入力切替タブの非フローシートタブ**: 隔離拘束は ep-07 連携、睡眠・活動はフェーズ 5 (us-25) で
  別画面として実装、観察は医療観察法対象患者向けで、患者型に `isMedicalObservation` フラグを
  入れる前提。本モックでは表示のみ false 固定で枠だけ用意
- **未来日制御**: `validateFuture=true / confirmFuture=false` を初期マスタ。バイタル編集・
  看護記録ダイアログのみ未来日チェック。フローシートグリッド側は表示日に依存する `isFutureDisabled`
  で各日アイコンを disabled
- **パターン適用日以降のデータ削除**: spec の不可逆挙動どおり `applyPattern` で当該患者の
  当該日以降の `careRecords` を物理削除。確認サブダイアログは `PatternChangeDialog` 側で実装
- **看護記録の FOCUS タイトル連動**: タブ FOCUS 時はタイトルを readOnly にし `bodyFocus.focus`
  と双方向同期（最大 20 文字スライス）
- **公開フラグ**: spec の薄赤背景挙動を `Card.bgcolor` で再現
- **記事削除**: 論理削除（`deletedAt`/`deletedBy` を埋めるのみ）。「全て」表示で取消線で表現
- **一括バイタルの「種類」**: spec の「ケア項目マスタの種類」は本モックでは BulkVitalKindMaster
  3 種（基本（昼）/体温のみ/血圧のみ）に簡素化。将来は MASTER_CARE_ITEMS とのマッピング拡張が筋
- **睡眠表の連続ドラッグ**: spec のドラッグ範囲指定は実装重いため、終了時刻セレクトで等価
  表現（spec AC-4 を満たす）
- **一括看護記録の本文形式**: 本モックでは「1 つの textarea」で受け、formType に応じて
  FOCUS=D / SOAP=O / フリー=free に格納する簡素化。spec の専用フィールド毎入力は将来拡張
- **「氏名タイトル部クリックでかな順並び替え」**: ヘッダリンクで asc / desc 切替実装
- **入力時間外グレー表示**（us-24 AC-9）: 本モックは未対応（マスタ inputWindow は既に型に持たせて
  あるので将来対応）
- **報告先・連携設定ダイアログ**（us-23 / us-26）: 本モックではダイアログ化せず行内チェック
  で簡素化

### 動作確認

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン
- ブラウザでの実操作確認は未実施。各ダイアログのフィールド配置、ガード挙動（パターン適用時の
  確認、未来日制御、記録形式切替、一括登録時の選択チェック）は目視確認推奨

### MASTER 連携が残る項目（HANDOVER 起票済）

- `src/components/karteAlpha/KarteAlphaPage.tsx` の「フローシート」タブ（現プレースホルダ）を
  `<FlowsheetPage />` に差し替え。タブ切替時の状態保持、URL ルーティングとの整合は MASTER と要相談
- `src/layouts/MainLayout.tsx` のサイドメニューに `/nursing/*` 配下 4 画面と `/flowsheet/:patientId`
  への導線を追加。フラット化が縦に伸びるため、PM 提案の「セクション分け」（折り畳み or 見出し）の
  導入を MASTER と要相談

---

## 補修予定（2026-05-06 起票）

### バイタル「7 日 × 時間軸の格子状グラフ」未実装（us-17 AC リグレッション）

#### 経緯

- PM から「フローシートのバイタル表示欄が数字の列挙だけ」と指摘あり（2026-05-06）
- 調査結果: 旧 `src/components/flowsheet/VitalChart.tsx`（recharts LineChart で BP・脈拍・体温を折れ線表示）が **2026-05-02 commit `1a3ec15`「フェーズ 1 — flowsheet feature の土台を新設」** で削除された
- 新実装の `src/features/flowsheet/components/FlowsheetGrid.tsx`（行 113）には `// バイタル簡易表示行（T のみ。次ステップで VitalChart に置換）` のコメントのみ残存
- spec [us-17-flowsheet-view.spec.md L45-48](../specs/ep-10-flowsheet/us-17-flowsheet-view.spec.md) は「**7 日 × 時間軸の格子状グラフ（BP・R・P・T・S）**」を要求しており、現状実装は AC 未充足
- 上記 AC 表記「9/9 完了」を **「8/9」** に訂正（本ファイル冒頭サマリ表）

#### 補修方針

- **新規**: `src/features/flowsheet/components/VitalChart.tsx`（recharts LineChart、BP/P/R/T/S の複数系統、7 日 × 時間軸）
- **更新**: `src/features/flowsheet/components/FlowsheetGrid.tsx` の `renderVitalRow` を VitalChart 埋込に置換
- **参考実装**: `src/features/flowsheet/components/LabResultGraphDialog.tsx`（既存の recharts 利用パターン）
- **追補**: 実装後に本ファイル冒頭サマリ表の us-17 を 9/9 に戻し、状態を ✅ に変更

#### 担当・タイミング

- **担当**: S3（ep-10 既任ワーカー）
- **着手タイミング**: ep-15 us-34 患者情報サブタブ完了後の次タスク
- **MASTER 採用案**: 案 (1) — 急がずゆっくり、ep-15 段階 1 を阻害せず順次対応

#### 共有ファイル変更

`src/features/flowsheet/` 内に閉じる見込み。`Vital` 型は既存活用、`useFlowsheetStore` も既存。共有ファイル変更が必要になったら HANDOVER「MASTER 待ち事項」起票。

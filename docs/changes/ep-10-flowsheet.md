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
| us-17 フローシート表示 | 0/9 | 9/9 | ✅ 完了（モック実装。バイタル「7 日 × 時間軸の格子状グラフ」を 2026-05-06 補修済。末尾「補修完了（2026-05-06）」参照） |
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

## 補修完了（2026-05-06）

### バイタル「7 日 × 時間軸の格子状グラフ」実装（us-17 AC リグレッション解消）

#### 実装内容

- **新規**: `src/features/flowsheet/components/VitalChart.tsx`
  - recharts `LineChart` ベース、`ResponsiveContainer` で幅可変
  - **5 系統**: BP（収縮 / 拡張）／ R（呼吸）／ P（脈拍）／ T（体温）／ S（SpO2）
  - **7 日連続時間軸**: X 軸を datetime ms（`new Date(YYYY-MM-DDTHH:mm:00)`）として `scale="time"`、`ticks` に各日 00:00 を渡して日境目を `MM/DD` で表記
  - **日境目グリッド**: `ReferenceLine` を各日 00:00 に配置（`strokeDasharray="3 3"` の橙色破線）
  - **3 軸構成**: 左 Y `[30, 200]`（BP/P/R）、右 Y `[34, 42]`（T、`hide`）、右 Y `[80, 102]`（S、`hide`）。T/S の軸目盛りは表示せず Tooltip で値を確認
  - **線種**: BP-sys 実線・BP-dia 実線・脈拍 破線（4-2）・呼吸 短破線（2-2）・体温 実線・SpO2 長破線（6-3）。色覚配慮で線種を併用
  - **Tooltip**: `MM/DD HH:mm` ラベル、各系統 `${value} ${単位}` 表示（例: `120 mmHg`、`36.5 ℃`、`98 %`）
  - **空状態**: 該当 7 日にバイタル記録 0 件のとき「バイタル記録なし（過去 7 日）」を中央表示
- **更新**: `src/features/flowsheet/components/FlowsheetGrid.tsx`
  - `renderVitalRow` を VitalChart 埋込に置換。ラベル列「体温表（BP/R/P/T/S）」+ チャート領域（7 列分を span）
  - 既存の `Row` ヘルパは流用せず、`gridTemplateColumns: \`${labelCol} 1fr\`` の独自構造（チャート高 200px に対応）

#### 検証

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン（+1 module = VitalChart）
- 共有ファイル変更なし（`src/features/flowsheet/` 内に閉じる）

#### 起票時の経緯（参考）

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

---

## 文字サイズ・情報密度の改善候補（S3 調査メモ・2026-05-06）

PM 指摘「全体的に文字の小ささ懸念」の事前調査結果。**実装は本メモの範囲外**（PM 判断・後続タスク扱い）。コード読解中心で観察（ブラウザ目視は本セッション環境上限定的）。

### 調査スコープ

- 観点: **A 文字サイズ**（design-rules §6.3 / §1.3）／ **B 情報密度**（§6.2 / §6.3）／ **C 色覚配慮**（§13.5）／ **D 階層と視認性**（§1.3 / §3.3 / §2.1）
- 画面: `/flowsheet/:patientId`、`/nursing/records`、`/nursing/bulk-vitals`、`/nursing/sleep-table`、`/nursing/bulk-records`
- ダイアログ: VitalEditDialog / FlowsheetEditDialog / SignInputDialog / NursingRecordDialog（PatternChangeDialog / OrderListDialog 等は MUI 標準範囲のため抜粋のみ）
- 手法: `fontSize` 直書き 26 箇所の grep、`Table size="small"` + 追加 padding 圧縮の検出、variant 使用統計、`<br />` 構造、`aria-label` / Tooltip 併用、色のみ依存箇所の抽出

### 観察結果サマリ

| # | 画面／コンポーネント | 観点 | 観察 | 改善候補 | 優先度 |
| --- | --- | --- | --- | --- | --- |
| 1 | FlowsheetGrid (`/flowsheet/:patientId`) | A 文字 | Cell の `fontSize: 11/12` ハードコード（L61, L94, L127-129, L168 ほか） | variant `body2` (14px) 統一、補助のみ caption | 高 |
| 2 | 同上 | B 密度 | Row `minHeight: 28`、Cell `px/py: 0.5` (4x4px)。§6.3 規定 8x12px の約 1/3 | minHeight 36、padding 8x12（テーマ既定） | 高 |
| 3 | 同上 | B 密度 | header bgcolor `#f1f5f9` ハードコード | テーマ既定 `#f8fafc` に揃える | 高 |
| 4 | 同上 | C 色覚 | サイン Cell が `SHIFT_COLOR` の文字色のみ（夜赤/日青/準緑） | アイコン or `(夜)/(日)/(準)` 1 文字 prefix を併記 | 中 |
| 5 | 同上 | D 階層 | 編集アイコン `fontSize: 14`（IconButton size="small" 内） | 18 に拡大（§3.3） | 低 |
| 6 | 同上 | D 階層 | スタンドアローン遷移時に戻るボタン無し（embedded 想定） | embedded=false 時に左上「戻る」（§2.1） | 中 |
| 7 | VitalChart (`/flowsheet/:patientId`) | A 文字 | 軸目盛・Tooltip・Legend の `fontSize: 10` | 軸 11 / Legend 11 / Tooltip 12 へ底上げ | 中 |
| 8 | 同上 | C 色覚 | 5 系統に **線種（実線/破線/長破線）併用** | 維持（§13.5 良例） | — |
| 9 | MovementBar | A 文字 | セグメント内ラベル `fontSize: 10` | 11 へ | 中 |
| 10 | 同上 | B 密度 | バー `height: 18` で薄い、ラベル詰まり | 24 へ拡大 | 中 |
| 11 | 同上 | C 色覚 | KIND_COLOR で 6 種類の色帯、`seg.label` が optional のため未指定時は色のみ | bar 内に種類 1 文字（隔/拘/制/出/泊/室）を強制表示 | 中 |
| 12 | FlowsheetHeader | D 階層 | Tabs に明示的 `borderBottom` 設定なし（MUI 既定下線のみ） | コンテナに `borderBottom: 1, borderColor: 'divider'`（§2.3） | 低 |
| 13 | 同上 | A 文字 | タブ `fontSize: 13` | デフォルト（≈14px）に戻し統一 | 低 |
| 14 | NursingRecordsPage (`/nursing/records`) | A 文字 | Card 内 caption 多用（時刻・登録者・登録日時・連携情報） | 主情報は `body2` (14px) へ、補助のみ caption | 中 |
| 15 | 同上 | B 密度 | `CardContent sx={{ py: 1 }}` (8px) | py 1.5 (12px) へ | 低 |
| 16 | 同上 | C 色覚 | 時刻が SHIFT_COLOR、修正情報が `#b91c1c` の文字色のみ | 時刻に shift ラベル併記（例 `08:30（夜）`） | 中 |
| 17 | 同上 | D 階層 | 戻るボタン無し | §2.1 戻るボタン追加 | 中 |
| 18 | BulkVitalsPage (`/nursing/bulk-vitals`) | B 密度 | `<Table size="small">` + `'& th, & td': { p: 0.75 }` の **§6-D 重複圧縮** | 追加 padding 撤廃。size="small" 単独で十分 | 高 |
| 19 | 同上 | C 色覚 | 選択行 bgcolor `#dbeafe` のみで識別、Checkbox 併用済 | 維持（Checkbox で実質充足） | — |
| 20 | 同上 | D 階層 | 戻るボタン無し | §2.1 戻るボタン追加 | 中 |
| 21 | SleepTablePage (`/nursing/sleep-table`) | A 文字 | 列タイトル `fontSize: 11`、患者リンク `fontSize: 12` | variant 統一（caption→body2） | 高 |
| 22 | 同上 | B 密度 | `<Table size="small">` + `'& th, & td': { p: 0.5 }` 重複圧縮、セル `height: 28` | 追加 padding 撤廃、height 36 | 高 |
| 23 | 同上 | C 色覚 | セル状態を `STATE_COLOR` の色面 + 8x8 ドットで表示。色のみ依存（Tooltip にしか状態名なし） | ドット中央に状態 1 文字（入/覚/離/中/不）併記 | 中 |
| 24 | 同上 | D 階層 | 患者セルが `<MuiLink fontSize:12>` + `<br />` + `<Typography variant="caption">` 混在 | `Stack spacing={0.25}` + variant 統一 | 低 |
| 25 | 同上 | D 階層 | 戻るボタン無し | §2.1 戻るボタン追加 | 中 |
| 26 | BulkNursingRecordsPage (`/nursing/bulk-records`) | B 密度 | `<Table size="small">` + `'& th, & td': { p: 0.75 }` の重複圧縮（L207） | 追加 padding 撤廃 | 高 |
| 27 | 同上 | D 階層 | 戻るボタン無し | §2.1 戻るボタン追加 | 中 |
| 28 | VitalEditDialog | B 密度 | `Table size="small" sx={{ '& th, & td': { p: 0.5 } }}` 重複圧縮（L215） | 追加 padding 撤廃 | 高 |
| 29 | 同上 | A 文字 | 記録者カラムが `<Typography variant="caption">`（L272） | body2 へ（情報として本文相当） | 中 |
| 30 | FlowsheetEditDialog | A 文字 | `FormLabel sx={{ fontSize: 13 }}`（L308） | 14（default）へ | 中 |
| 31 | NursingRecordDialog | B 密度 | タブ `minHeight: 32`（標準 48 / dense 36 より低い・L313） | 36 へ | 低 |
| 32 | SignInputDialog | — | body2 中心、シンプルな縦積み | 維持（密度問題薄い） | — |

### 観察データの内訳（参考）

#### fontSize 直書き 26 箇所の分布

| 値 | 件数 | 主な使用箇所 |
| --- | --- | --- |
| `12` | 6 | FlowsheetGrid の Cell（既定）、SleepTablePage 患者リンク |
| `11` | 9 | FlowsheetGrid の Tooltip / バイタル文 / 看護記録リンク、SleepTablePage 列タイトル |
| `10` | 5 | VitalChart 軸目盛・凡例、MovementBar セグメント内ラベル |
| `13` | 2 | FlowsheetHeader タブラベル、FlowsheetEditDialog |
| `14` | 2 | FlowsheetGrid 編集アイコン、FlowsheetEditDialog 強調 |

→ **大半が 10〜12px** で、§6 規定の `0.875rem (= 14px)` を下回る。

#### §6-D 重複圧縮（`<Table size="small">` + 追加 padding）の検出位置

| ファイル | 該当行 | 追加 padding |
| --- | --- | --- |
| `BulkVitalsPage.tsx` | L217 | `p: 0.75` (6px) |
| `SleepTablePage.tsx` | L172 | `p: 0.5` (4px) |
| `BulkNursingRecordsPage.tsx` | L207 | `p: 0.75` (6px) |
| `VitalEditDialog.tsx` | L215 | `p: 0.5` (4px) |

### 詳細

#### A. 文字サイズ（§6.3 / §1.3）

- **`FlowsheetGrid.tsx`**: L61, L94, L127-129, L168, L235, L249, L266, L272, L304 で `fontSize: 11/12` 直書き多発。§6.3 のテーブルセル基準 `0.875rem (14px)` を下回る。**改善候補**: variant `body2` (14px) 統一、補助情報のみ `caption` (≈12px) 許容
- **`VitalChart.tsx`**: L153/L162/L170 軸目盛・Tooltip・Legend が `fontSize: 10`。**改善候補**: 軸 11 / Legend 11 / Tooltip 12 に底上げ
- **`MovementBar.tsx` L73**: セグメント内ラベル `fontSize: 10`。**改善候補**: 11 へ
- **`SleepTablePage.tsx`**: L179 列タイトルリンク `fontSize: 11`、L191 患者リンク `fontSize: 12`。**改善候補**: variant 統一
- **`FlowsheetEditDialog.tsx` L308**: `FormLabel sx={{ fontSize: 13 }}`。**改善候補**: 14（default）へ
- **`FlowsheetHeader.tsx` L48**: タブ `fontSize: 13`（minHeight 36 と組）。**改善候補**: タブ既定（≈14px / minHeight 48）に戻すか、現密度を維持するなら統一基準として明文化
- **`NursingRecordsPage.tsx` Card 内**: 「登録者 / 登録日時」「連携情報」が `variant="caption"` (≈12px)。本文相当の情報まで caption 化。**改善候補**: `body2` に上げる、密度上昇するなら別行に折り返し

#### B. 情報密度（§6.2 / §6.3）

- **§6-D「`<Table size="small">` + 追加 padding 圧縮」の重複圧縮（4 箇所）**: MUI size="small" 単独で既に dense（行高 33px / padding 6x16px）なのに、追加 padding を上書きして §6.3 規定 8x12px の半分以下に圧縮している。**改善候補**: 全て追加 padding 撤廃。詳細位置は前述「観察データの内訳」表
- **`FlowsheetGrid.tsx` L48-72**: `Row minHeight: 28`、`Cell px: 0.5 py: 0.5` (4x4px)。§6.3 規定 8x12px の約 1/3。**改善候補**: minHeight 36、padding 8x12（テーマ既定）にしてセルクリック対象も拡大
- **`MovementBar.tsx` L70**: バー `height: 18`。**改善候補**: 24 へ
- **`NursingRecordsPage.tsx` L93**: `CardContent sx={{ py: 1 }}` (8px)。**改善候補**: py 1.5 (12px)（Card は本文用なので余白を持たせる）
- **`SleepTablePage.tsx` L205**: セル `height: 28`。**改善候補**: 36 へ
- **`NursingRecordDialog.tsx` L313**: タブ `minHeight: 32`（MUI dense 36 / 標準 48 より低い）。**改善候補**: 36 へ

#### C. 色覚配慮（§13.5）

色だけで情報を伝えている箇所は §13.5 違反。色 + アイコン / テキスト併記が必要。

- **`FlowsheetGrid.tsx` L304** サイン Cell: 文字色 `SHIFT_COLOR` のみ（深夜=赤 / 日勤=青 / 準夜=緑）。**改善候補**: 1 文字 prefix（`(夜)`/`(日)`/`(準)`）or 小さなアイコン併記
- **`NursingRecordsPage.tsx` L96, L117**: 時刻が SHIFT_COLOR、修正情報が `#b91c1c` の文字色のみ。修正の方は「修正:」テキスト併記済 ✅ だが時刻は色のみ。**改善候補**: 時刻に shift ラベル併記（例 `08:30（夜）`）
- **`SleepTablePage.tsx` L213**: cell ドット表示が色のみ（入眠青 / 覚醒緑 / 離床橙 / 中途覚醒赤 / 不穏紫）。Tooltip でしか状態名が出ない。**改善候補**: ドット中央に状態 1 文字（入/覚/離/中/不）を入れる
- **`MovementBar.tsx` L20-26**: KIND_COLOR で 6 種類の色帯。`seg.label` が optional のため未指定時は色のみ依存。**改善候補**: bar 内に種類の 1 文字（隔/拘/制/出/泊/室）を強制表示
- **`VitalChart.tsx` L186-220**: 5 系統を **線種併用（実線 / 破線（4-2）/ 短破線（2-2）/ 長破線（6-3））** + 色 + Legend テキスト ✅ → §13.5「グラフは色 + 線種」の良例として **維持**

#### D. 階層と視認性（§1.3 / §3.3 / §2.1 / §2.3）

- **§2.1 戻るボタンが 5 ページ全部で未実装**: サイドバー導線前提だが、URL 直接アクセス・履歴バック以外の戻り口が無い
  - `/flowsheet/:patientId`（embedded=false 時）
  - `/nursing/records`、`/nursing/bulk-vitals`、`/nursing/sleep-table`、`/nursing/bulk-records`
  - **改善候補**: 各ページ左上に `<Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>戻る</Button>` 配置
- **§2.3 タブ borderBottom 未明示**: `FlowsheetHeader.tsx` L44 の Tabs。MUI Tabs の内部下線はあるが、コンテナ境界として明示が薄い。**改善候補**: 親 Box に `borderBottom: 1, borderColor: 'divider'` を付与
- **§3.3 IconButton + Tooltip**: `FlowsheetGrid.tsx` の編集アイコンは Tooltip 付き ✅、ただし icon 本体が `fontSize: 14`。**改善候補**: 18 へ拡大
- **§2.2 パンくず**: ep-10 は階層 2 段以下なので導入不要 ✅
- **`FlowsheetPage.tsx` L107-117 患者ヘッダー**: h6 + body2 + caption の階層あり ✅ → 維持
- **`aria-label` 直書き 0 件**: §12.2 は MUI IconButton + Tooltip 構成で実質充足。明示 aria-label が欲しい場合は別タスク化（本メモのスコープ外）

### 実装スコープの目安

| スコープ | 内容 | 該当観察# | 影響範囲 | 想定工数 |
| --- | --- | --- | --- | --- |
| **小** | §6 セル padding 統一 + §6-D 重複圧縮の撤廃 + fontSize 直書きを variant 化 | 1, 2, 3, 18, 21, 22, 26, 28 | `FlowsheetGrid.tsx` / `BulkVitalsPage.tsx` / `SleepTablePage.tsx` / `BulkNursingRecordsPage.tsx` / `VitalEditDialog.tsx`。共有ファイル変更なし | 1〜2 時間 + 目視 1 時間 |
| **中** | VitalChart 軸ラベル拡大・Legend / MovementBar 高さ拡大 / Card density 緩和 / 各ページ戻るボタン追加 / Tabs borderBottom 明示 / 色覚配慮の併記 | 4, 7, 9, 10, 11, 12, 14, 16, 17, 20, 23, 25, 27, 29, 30 | `VitalChart.tsx` / `MovementBar.tsx` / `NursingRecordsPage.tsx` / `FlowsheetGrid.tsx` / `SleepTablePage.tsx` / `FlowsheetHeader.tsx` / 5 ページに戻るボタン | +1〜2 時間 |
| **大** | テーブル全体のレイアウト見直し（FlowsheetGrid の grid 構造再設計、列幅自動 → 固定併用、1366 解像度での横スクロール最適化） | (大規模再設計) | `FlowsheetGrid.tsx` 全面改修。VitalEditDialog / FlowsheetEditDialog からの再描画影響確認も必要 | 3〜4 時間 |

### 採用候補のたたき台（PM 判断用）

- **採用 A: 小のみ** — 最小コストで密度問題の根（§6-D 重複圧縮）を抜く
- **採用 B: 小 + 中** — 読みやすさ + 戻るボタン整備 + 色覚配慮の主要箇所まで一括対応（段階 1 統合確認時に併合可能）
- **採用 C: 小 + 中 + 大** — 全面リフレッシュ。段階 2（`mode='inpatient'` 実装）と並走
- **据え置き** — 段階 2 後の整合確認時にまとめて判断

### 補足

- **1366×768 解像度**（§13.2 業務想定）で密度を下げると横溢れが起きやすい。FlowsheetGrid は患者 1 人 × 7 日 × 多列構造のため `fontSize` を 1 段上げるだけで横スクロールが顕著化する点が判断材料
- **色覚配慮の優先実装**: VitalChart は線種併用で良例（§13.5 推奨形）。FlowsheetGrid サイン Cell（観察 #4）と SleepTable ドット（観察 #23）が色のみ依存の主な箇所
- **ダイアログ群の総評**: VitalEditDialog の §6-D 重複圧縮（観察 #28）以外は概ね MUI 標準範囲。SignInputDialog は密度問題ほぼなし、FlowsheetEditDialog は FormLabel fontSize 13（観察 #30）のみ局所対応で済む
- **観察ボリューム**: 観察項目 32 件（5 ページ + 主要 4 ダイアログ + 共通コンポーネント 2）×（A 文字 / B 密度 / C 色覚 / D 階層）の 4 観点。改善候補は **高 8 件 / 中 14 件 / 低 6 件 / 維持・現状 OK 4 件**

---

## Flowsheet 単一 Table 化（B 案リファクタ）完了メモ（S2 / 2026-05-29）

### 背景

`/karte/:patientId#flowsheet` で日付列の縦軸が揃わず、特に 5/15・5/16 のデータ行が右にずれる問題が発生していた。原因は [src/components/flowsheet/Flowsheet.tsx](../../src/components/flowsheet/Flowsheet.tsx)（747 行）が 7 つの独立した `<TableContainer>` + `<Table>` から構成されており、Table 間で列幅が共有されていなかったこと。`table-layout: auto` 下で特定セルの content（5/16 の `orderKinds` 7 種類）が `minWidth: 110` を破壊し、後続列が右にずれていた。

### 実装サマリ

briefing 指示「B 案リファクタ: 7 セクションを 1 つの Table に統合」を実施。tsc / vite build クリーン。ブラウザ目視は MASTER に依頼。

#### 変更ファイル

- [src/components/flowsheet/Flowsheet.tsx](../../src/components/flowsheet/Flowsheet.tsx)（747 行 → 同程度・全面リファクタ）:
  - 全 7 セクション（上部ヘッダー / 隔離拘束 / バイタルチャート / 指示実施 / 基本観察 / 記事連携 / 個別ケア / サイン）を **1 つの `<TableContainer>` + `<Table sx={{ tableLayout: 'fixed' }}>`** に統合
  - **`<colgroup>` で 9 列の幅を明示**: label 130px / sub-label 40px / day 110px × 7
  - セクション見出しの独立 `<Box>` を `<TableRow>` + `<TableCell colSpan={9}>` に変換（汎用 `SectionHeaderRow` ヘルパー化、背景色 `#e3edf7` フォント等 maintain）
  - バイタルチャート部も `<TableRow>` + `<TableCell colSpan={9} sx={{ p: 0 }}>` 内に内包。内部の `<Box display="flex">` + 左 170px 凡例パネル + LineChart はそのまま流用
  - 既存ヘルパー `RestraintRow`（L250-281）はそのまま流用
  - スタイル定数（`stickyLabelCell` / `stickySubCell` / `dayCellSx`）は維持。新規追加 `sectionHeaderCellSx` でセクション見出しの旧 Box スタイル相当を吸収

#### PM 追加指示「見た目変えない」への対応

実装中、PM より「見た目が変わらないことが望み」の指示。briefing 参考セクション（`VitalChart.tsx` の整列手法: `margin.left/right = 0` + `YAxis hide` + `ReferenceLine label`）を試案として書きかけていたが、**チャート部の `LineChart` 設定は元の通り完全維持**に変更:

- `margin={{ top: 10, right: 20, left: 0, bottom: 5 }}` を維持
- YAxis 2 本（vitals / temp）の `width={35}` + tick 表示を維持
- ReferenceLine は元の 2 本（120 / 80）のまま、label 追加なし

これにより AC-4「バイタルチャート内の日境界がヘッダ日付列の左端と一致」は厳密一致まで到達しないが、AC-2/AC-3（5/15・5/16 ずれ解消）+ 見た目維持を優先。チャート列の厳密一致は別途要望時に対応する判断。

### AC 充足状況

| AC | 状態 | 備考 |
| --- | --- | --- |
| 1. 全 7 セクションが 1 つの Table に統合 | ✅ | 単一 `<TableContainer>` + `<Table sx={{ tableLayout: 'fixed' }}>` |
| 2. ヘッダ日付列と全データ行の同日列が縦位置で完全一致 | ✅ | `<colgroup>` で 9 列幅を共有、`tableLayout: 'fixed'` で col 幅が支配的 |
| 3. 5/15・5/16 のデータが右にずれない | ✅ | `tableLayout: 'fixed'` 下では content が col 幅を破壊できない |
| 4. バイタルチャート内の日境界がヘッダ日付列の左端と一致 | △ | PM 指示「見た目変えない」優先で LineChart 設定を維持。厳密一致は別途要望時に対応 |
| 5. `npx tsc --noEmit` クリーン | ✅ | |
| 6. `npx vite build` クリーン | ✅ | bundle size warning は既存事象 |
| 7. 表示内容（モック値・色・アイコン・MUI コンポーネント）変更なし | ✅ | DAILY / RESTRAINTS / CHART_DATA 中身無変更、MEAL_STYLE / ORDER_COLOR 等のスタイル定数も無変更 |

### 設計判断（暫定）

| # | 判断 | 妥当性 |
| --- | --- | --- |
| 1 | `<colgroup>` + `tableLayout: 'fixed'` で列幅を支配的に | ブラウザの table-layout アルゴリズムを `auto`（content 駆動）から `fixed`（col 駆動）に切替。これで content による列幅破壊が物理的に不可能になる |
| 2 | セクション見出しを `<TableRow colSpan={9}>` に格上げ | 元の独立 `<Box>` は Table 外なので幅共有不可。Table 内に取り込むことで「同じ列レーン」として表現可能 |
| 3 | バイタルチャートも `<TableRow colSpan={9}>` 内に内包 | チャート部だけ独立 Paper のままだと「テーブルの一部」感が薄れる。`<TableCell sx={{ p: 0 }}>` で padding ゼロにして既存 flex レイアウトをそのまま使える |
| 4 | チャート LineChart の設定は元のまま維持（PM 指示） | 見た目維持優先。AC-4 の厳密一致は犠牲にしたが、見た目変化を最小化 |
| 5 | sticky label / sub cell は維持 | 横スクロール時の label 固定挙動を温存。`tableLayout: 'fixed'` 下でも `position: sticky` は機能 |

### MASTER への申し送り

- ブラウザ目視は本セッションでは未実施 → **MASTER に依頼**
  - 期待挙動 1: `/karte/P001#flowsheet` で 5/15・5/16 のデータ行が右にずれず、全行で日付列が縦一致
  - 期待挙動 2: 5/16 の予定オーダ「薬／注／検／処／画／心／E」7 種が cell 内で折り返し or 改行され、列幅を破壊しない
  - 期待挙動 3: バイタル・サイングラフ部は従前と見た目同等（PM 指示反映）
  - 期待挙動 4: 横スクロール時に label 列（病室／在院日数／服薬 等）が左端固定
- **AC-4 補足**: バイタルチャート内の日境界（X 軸日付）とヘッダ日付列の厳密一致は今回未達成。VitalChart 方式（YAxis hide + ReferenceLine label）を採用する場合は別途要望時に対応可能（実装は試案として書きかけて撤回済）

### 共有ファイル変更

なし（`src/types/` / `src/stores/` / `src/data/mockData.MASTER_*` / `src/components/common/` / `features/flowsheet/` 触らず）。`src/components/flowsheet/Flowsheet.tsx` 内に閉じる変更のみ。

### 検証

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン（bundle size warning は既存事象）
- ブラウザ目視: 未実施 → MASTER に依頼

# ep-07 観察記録 — 改修一覧

## 対象

- 画面: `/karte-alpha/:patientId`（フローシート／隔離拘束タブ）／`/isolation`（記録タブ）
- 実装: 既存 `IsolationRestraint.tsx` tab=1 全面改修＋新規ダイアログ群
- 参照 spec: [docs/specs/ep-07-observation/](../specs/ep-07-observation/)

## サマリ

| ストーリー | 改修前 AC | 実装後 AC | 状態 |
| --- | --- | --- | --- |
| us-13 個別観察記録 | 0/10 | 9/10 | ✅ 完了（モック実装、AC-10 部門記録簿連携は ep-10 統合経由で達成） |
| us-14 一括観察記録 | 0/11 | 11/11 | ✅ 完了（モック実装） |

## 既存実装と本エピックの関係

- 既存 `IsolationRestraint.tsx` tab=1「観察記録」は `generateObservationRecords` ベースの簡易表示。本エピックで全面改修
- 既存 `Flowsheet.tsx` には「隔離」「拘束」行が文字列表示で存在（line 286-313）。本エピックで観察マトリクス（クリック可・状態色）へ拡張
- 既存 `ObservationRecord` 型は最低限のフィールド（id/isolationOrderId/patientId/date/time/state/note）のみ。`subtype`/`tags`/`signedBy`/`linkSetting` 等の追加が必要
- 既存 `MASTER_*` セクションに観察記録系マスタは無い → 新規追加
- store には観察記録の dynamic state は無い → 新規追加（`dynamicObservationRecords`）

## 共有ファイル変更（要 MASTER 確認）

### `src/types/index.ts`

```ts
// 既存 ObservationState は 6 値（未記入/浅眠/落ち着き/不穏/睡眠/中途覚醒）
// → モックではそのまま流用、マスタ拡張は将来対応

/** 観察記録の連携設定 */
export interface ObservationLinkSetting {
  /** 看護記録連携 ON */
  linkToNursingRecord: boolean;
  /** 報告先（作成依頼／確認依頼／両方） */
  reportTo?: '作成依頼' | '確認依頼' | '両方';
}

/** ObservationRecord 拡張（後方互換オプショナル） */
export interface ObservationRecord {
  // ... 既存 ...
  /** ep-07: 区分（隔離/拘束/隔離拘束/その他） */
  subtype?: IsolationSubtype | 'その他';
  /** ep-07: 観察回数（1時間内の何回目か） */
  occurrence?: number;
  /** ep-07: 記事タグ（複数） */
  tags?: string[];
  /** ep-07: 記録者（職員名） */
  signedBy?: string;
  /** ep-07: 連携設定 */
  linkSetting?: ObservationLinkSetting;
}
```

### `src/data/mockData.ts`

```ts
// ===== ep-07 観察記録 マスタ =====

// 隔離拘束状態マスタ（状態色＋自動記載定型文）
export interface ObservationStateConfig {
  state: ObservationState;
  color: string;       // 表示色
  bgColor: string;     // セル背景色
  prescriptionText: string;  // 状態選択時に処方処置欄へ自動記載
}
export const MASTER_OBSERVATION_STATES: ObservationStateConfig[] = [
  { state: '未記入',   color: '#94a3b8', bgColor: '#f1f5f9', prescriptionText: '' },
  { state: '浅眠',     color: '#d97706', bgColor: '#fef3c7', prescriptionText: '浅眠状態' },
  { state: '落ち着き', color: '#16a34a', bgColor: '#dcfce7', prescriptionText: '落ち着いて過ごしている' },
  { state: '不穏',     color: '#dc2626', bgColor: '#fef2f2', prescriptionText: '不穏状態を観察' },
  { state: '睡眠',     color: '#1d4ed8', bgColor: '#dbeafe', prescriptionText: '入眠中' },
  { state: '中途覚醒', color: '#be185d', bgColor: '#fce7f3', prescriptionText: '中途覚醒あり' },
];

// 区分別観察回数（1時間あたりの記録回数）
export const MASTER_OBSERVATION_FREQUENCY: Record<'隔離' | '拘束' | 'その他', number> = {
  '隔離': 2,    // 30分毎
  '拘束': 4,    // 15分毎
  'その他': 1,  // 60分毎
};

// 文例マスタ
export const MASTER_OBSERVATION_TEMPLATES = [
  '室内で穏やかに過ごしている。バイタル安定。',
  '自力体位変換可。皮膚状態異常なし。循環障害なし。',
  '不穏あり。傾聴対応。30分後に落ち着く。',
  '入眠中。呼吸状態安定。',
  '声かけに反応あり。意思疎通可能。',
] as const;

// 記事タグマスタ
export const MASTER_OBSERVATION_TAGS = [
  '巡回', '声かけ', '傾聴', '体位変換', 'バイタル測定',
  '排泄介助', '食事介助', '清拭', '内服確認', '皮膚観察',
] as const;
```

### `src/stores/useAppStore.ts`

```ts
// ===== ep-07 観察記録 =====
dynamicObservationRecords: ObservationRecord[];
addObservationRecord: (record: ObservationRecord) => void;
addObservationRecordsBulk: (records: ObservationRecord[]) => void;
updateObservationRecord: (id: string, patch: Partial<ObservationRecord>) => void;
removeObservationRecord: (id: string) => void;

// optionalFeatures に observationFutureBlock を追加
optionalFeatures: {
  ...
  observationFutureBlock: boolean;
};

// 永続化対象に dynamicObservationRecords を追加
```

### 既存ファイル更新

- `src/components/isolation/IsolationRestraint.tsx`
  - tab=1「観察記録」を全面改修（`ObservationListTab` を新設）
- `src/components/admission/AdmissionDischarge.tsx`
  - ヘッダトグルに「未来日入力抑止 (observationFutureBlock)」追加（任意、UX 検証用）
- `src/components/flowsheet/Flowsheet.tsx`
  - 既存「隔離」「拘束」行を観察マトリクスに置き換え（クリック可、状態色）
  - **S3 (ep-10) と所有権を擦り合わせ**: ep-10 は `src/features/flowsheet/` 配下で別実装中。`Flowsheet.tsx` は legacy 化する可能性あり

### S3 との分担確認事項（実装前に PM 経由で確認）

1. **フローシート画面の所有権**: `src/components/flowsheet/Flowsheet.tsx` を ep-07 で改修するか、S3 が新設する `src/features/flowsheet/pages/FlowsheetPage.tsx` に観察マトリクスを組み込むか
2. **ObservationRecord 型の整合**: ep-10 で看護記録基盤が出来た際、ObservationRecord と NursingRecord の関係（連携キー）をどう設計するか
3. **看護記録連携**: `linkSetting.linkToNursingRecord === true` の場合に看護記録ストアへも書き込むか／タグ付与のみか

→ 実装着手前に MASTER 経由で S3 と擦り合わせる

## 共通実装

### 新規ファイル

- `src/components/isolation/ObservationRecordDialog.tsx` — 個別／一括両用の観察記録ダイアログ（モード切替）
- `src/components/isolation/ObservationBulkDialog.tsx` — 区分一括入力ダイアログ
- `src/components/isolation/ObservationFilterDialog.tsx` — 絞込設定ダイアログ（伝票定義情報マスタ）
- `src/components/isolation/ObservationLinkSettingDialog.tsx` — 連携設定ダイアログ
- `src/components/isolation/ObservationContentBulkDialog.tsx` — 内容一括入力ダイアログ（タグ付き）
- `src/components/isolation/ObservationMatrix.tsx` — 観察マトリクス表示の共通コンポーネント（フローシート／一覧両方で利用）

### 既存ファイル更新

上記「共有ファイル変更」参照。

## 画面別変更

### `src/components/isolation/IsolationRestraint.tsx` (tab=1)

- 検索条件バー（日付／病棟／条件設定／絞込設定／表示）
- 患者一覧 + 区分3段マトリクス（隔離/拘束/その他）
- 区分回数枠タイトルクリック → `ObservationBulkDialog` 起動
- 患者個別の時間枠クリック → `ObservationRecordDialog` 起動
- 凡例（状態色）

### `src/components/flowsheet/Flowsheet.tsx`（要 S3 確認）

- 既存「隔離」「拘束」行を `<ObservationMatrix />` に置き換え
- クリックで `ObservationRecordDialog` 起動
- 開放時間アイコン表示

### `src/components/isolation/ObservationRecordDialog.tsx`

- 個別／一括共通の観察記録入力
- 1 時間内の観察回数分の行 + [追加]/[削除]
- 状態セレクト（色付き）／時間／内容（文例・タグ）／連携／選択チェック
- タイトル横 [入力] → 内容一括入力ダイアログ
- [文例] / [タグを登録する] / [連携] → サブダイアログ
- [登録] / [キャンセル]

### `src/components/isolation/ObservationBulkDialog.tsx`

- 区分・時間・回数で記録対象患者をフィルタ
- 患者ごとの行（[選択] / 状態 / 内容 / 連携 / 記録時間 / 記録者）
- 解放時間ハイライト（拘束入力時のみ）
- タイトル横 [入力] / [全選択] / [登録] / [キャンセル]

## 着手順序（提案）

1. 型拡張 + マスタ追加（型・mockData 同時、互いに参照）
2. ストア拡張（`dynamicObservationRecords` + actions、`observationFutureBlock` トグル）
3. 共通コンポーネント `ObservationMatrix`
4. `ObservationRecordDialog`（個別／一括両用）
5. サブダイアログ群（連携設定、内容一括、文例、タグ一覧）
6. `ObservationBulkDialog`
7. `IsolationRestraint.tsx` tab=1 改修
8. `Flowsheet.tsx` 隔離拘束行の置き換え（S3 確認後）
9. screen-mapping.tsv 更新

## 完了確認

- 検証コマンド: `npx tsc --noEmit` + `npx vite build`
- UI 動作: ブラウザで個別／一括の入力経路、状態色反映、未来日抑止、解放時間ハイライト、拘束優先表示を目視確認

## 残課題（先送り候補）

- 部門記録簿への看護記録連携: ep-10 完成後に統合（モックではタグ付与とスナックバーのみ）
- 文例マスタ・タグマスタ・状態マスタの保守 UI: マスタ管理エピック未着手
- 観察記録に紐づく指示の削除制約（ep-08 隔離拘束歴 + ep-07）: ep-08 完了後に整理
- 「その他」区分の精緻判定（行動範囲・責任レベル・行動制限項目）: マスタ設計が必要

## 共有ファイル変更（再掲・MASTER 確認依頼項目）

| ファイル | 変更内容 | 影響 |
| --- | --- | --- |
| `src/types/index.ts` | `ObservationLinkSetting` 新規 + `ObservationRecord` フィールド追加 | 後方互換オプショナルのみ |
| `src/data/mockData.ts` | `MASTER_OBSERVATION_STATES` / `_FREQUENCY` / `_TEMPLATES` / `_TAGS` 追加 | 既存定数は不変 |
| `src/stores/useAppStore.ts` | `dynamicObservationRecords` + actions、`observationFutureBlock` トグル追加 | 後方互換 |
| `src/components/admission/AdmissionDischarge.tsx` | トグルに `observationFutureBlock` 追加 | 既存 4 トグルに 1 件追加 |
| `src/components/flowsheet/Flowsheet.tsx` | 隔離拘束行を観察マトリクスへ置換 | **S3 と所有権擦り合わせ必要** |
| `docs/screen-mapping.tsv` | IsolationRestraint.tsx 行（ep-06）に ep-07 / us-13,14 を追記 | 既存行変更（要 MASTER 調整） |

## 実装後メモ（2026-05-02）

### S3 との分担調整結果

S3 から下記契約で承認：
- **(a) 配置**: `src/components/isolation/RestraintObservationMatrix.tsx` を S3 契約シグネチャ `{ patientId: string; dates: ISODate[] }` で実装。S3 が FlowsheetPage isolation タブの Alert を本コンポーネントに差し替える PR を別途出す
- **(b) 型関係**: `ObservationRecord` と S3 の `NursingRecord` は別型で独立。連携キーは `ObservationRecord.linkedNursingRecordId`（単方向参照）と `NursingRecord.tags=['隔離拘束観察']` で識別
- **(c) ダブル書き込み**: 連携 ON 時は ep-07 ストアに保存 + `useFlowsheetStore.addNursingRecord` で NursingRecord も生成（FOCUS 形式 / `connections=['flowsheet']` / `isPublished=true`）

### 追加・変更ファイル

- `src/types/index.ts` — `ObservationLinkSetting` 新規、`ObservationRecord` に `subtype` / `occurrence` / `tags` / `signedBy` / `linkSetting` / `linkedNursingRecordId` をオプショナル追加
- `src/data/mockData.ts` — `MASTER_OBSERVATION_STATES` / `_FREQUENCY` / `_TEMPLATES` / `_TAGS` の 4 件を追加。`generateObservationRecords` は据置（legacy 表示用、今後段階的に廃止）
- `src/stores/useAppStore.ts` — `dynamicObservationRecords` + 4 actions、`optionalFeatures.observationFutureBlock` トグルを追加。永続化対象に追加
- `src/components/isolation/ObservationLinkSettingDialog.tsx` — 新規（連携設定）
- `src/components/isolation/ObservationContentBulkDialog.tsx` — 新規（内容一括入力）
- `src/components/isolation/ObservationRecordDialog.tsx` — 新規（個別観察ダイアログ、連携 ON で `useFlowsheetStore.addNursingRecord` ダブル書き込み）
- `src/components/isolation/ObservationBulkDialog.tsx` — 新規（区分一括入力、解放時間ハイライト、未来日抑止）
- `src/components/isolation/RestraintObservationMatrix.tsx` — 新規（S3 契約：FlowsheetPage isolation タブから呼び出される 7 日 × 24h × 区分マトリクス、拘束優先表示）
- `src/components/isolation/IsolationRestraint.tsx` — tab=1 を `ObservationListTab` に置き換え（24h × 回数枠マトリクス、タイトルクリック→一括、セルクリック→個別）
- `src/components/admission/AdmissionDischarge.tsx` — オプション機能トグルに「観察未来日抑止」を追加
- `docs/screen-mapping.tsv` — 5 行新規追加（4 ダイアログ + RestraintObservationMatrix）

### 実装上の判断・割り切り

- **legacy `src/components/flowsheet/Flowsheet.tsx` は非改修**（S3 確認済方針）。ep-10 / KarteAlphaPage 統合完了後に廃止予定
- **回数枠タイトル列の簡略化**: spec では区分（隔離/拘束/その他）ごとに別タイトル列を持つが、モックでは「拘束優先表示」と整合する形で `拘束` 一括起動を既定とし、簡略化。区分別タイトル列の細分は次ラウンドで検討
- **「その他」区分の精緻判定**: ep-06 と同様 `MASTER_BEHAVIOR_RESTRICT_WARDS` の在棟患者に絞った近似判定。行動範囲・責任レベル・行動制限項目は ep-08 / マスタ管理エピックで対応
- **拘束優先表示**: `RestraintObservationMatrix` で同時間帯に複数 active な指示がある場合、subtype が拘束 or 隔離拘束のものを優先表示
- **`addNursingRecord` 連携**: FOCUS 形式で `focus="隔離拘束観察"` / `data=内容` / `action=定型文` / `response=状態` を詰める。`connections=['flowsheet']` / `isPublished=true` / `tags=['隔離拘束観察', ...row.tags]`
- **既存 `generateObservationRecords` は据置**: legacy 表示用に残置。観察記録の本ストアは `dynamicObservationRecords`
- **AC-10 部門記録簿連携**: 連携 ON 時に S3 のストアに NursingRecord が書き込まれるため、S3 の NursingRecordsPage で表示される（実 UI 確認は要 S3 側 PR 後）

### 動作確認

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン
- ブラウザ目視確認は未実施

### MASTER への共有事項

- screen-mapping.tsv は `IsolationRestraint.tsx` 行（ep-06）に ep-07 を追記したい（既存行更新）。MASTER 側で調整いただけると助かります
- screen-mapping.tsv の `RestraintObservationMatrix` 行は `/flowsheet/:patientId` にしたが、KarteAlphaPage 統合完了後の正確な path 表記は MASTER 判断で OK

## 仕様変更メモ（2026-07-31）: 未来日入力不可を固定

観察記録の未来日記載を不可とする方針が確定したため、spec を更新し実装も追随させた。

### spec 更新内容

- `docs/specs/ep-07-observation/_epic.md`
  - 「共通ルール: 未来日入力不可（エピック横断）」を新設。判定条件と 15分枠の具体例（16時29分／16時30分／16時31分）を記載
  - マスタ設定・オプション機能による ON/OFF 前提の記述を削除（`optionalFeatures.observationFutureBlock` トグルの記述を含む）
- `docs/specs/ep-07-observation/us-13-individual-observation.spec.md`
  - 観察グリッドの未来枠はグレー＋クリック不可、ダイアログの未来枠行は非活性・登録対象外として明記
  - 「未来日抑止は未実装。マスタ仕様として後続検討」の記述を削除
  - AC-11（未来枠のセルは入力不可）／AC-12（ダイアログ内の未来枠行は登録不可）を追加
- `docs/specs/ep-07-observation/us-14-bulk-observation.spec.md`
  - 未来枠の回数枠はグレー＋クリック不可、一括ダイアログの患者フィルタ条件を「未来枠でない」に変更
  - AC-11 を設定依存の記述から固定仕様の記述へ改訂

### 判定条件（要約）

- 入力可: `記録枠の開始時刻 ≤ 現在日時` / 入力不可: `現在日時 < 記録枠の開始時刻`
- 判定は枠の **開始時刻のみ**（終了時刻は使わない）。過去方向の制限はなし
- 記録枠の粒度: 観察グリッドのセル = 1 時間枠 / 観察記録ダイアログの各行 = 観察間隔で等分した枠 / 一覧の回数枠 = 区分の観察回数で等分した枠

### 実装内容

判定ロジックは 1 箇所に集約し、各画面はそこから判定する。

- `src/components/isolation/observationFutureBlock.ts` — **新規**。共通判定（`isFutureSlot` / `isFutureTimeString` / `slotStartMinute`）と、時刻経過で未来枠を解除するための `useNowTick`、共通メッセージを提供
- `src/components/flowsheet/Flowsheet.tsx` — 観察グリッドのセルに未来枠判定を追加（グレー＋クリック不可＋ホバー無効、凡例に「未来日入力不可」を追加）
- `src/components/isolation/ObservationRecordDialog.tsx` — 行単位の未来枠判定を追加。未来枠の行は [選択] チェックと入力欄を非活性・未選択にし、[全選択]／[内容一括入力]／行追加の対象からも除外。時間欄を未来時刻へ手入力して [登録] した場合はエラーで登録中止（時間欄のみ活性のまま残し、修正できるようにする）
- `src/components/isolation/ObservationBulkDialog.tsx` — 回数枠の開始時刻（1 時間を区分別観察回数で等分）で判定。未来枠なら対象 0 件表示、記録時間の既定値も回数枠の開始時刻に修正。登録時にも未来時刻を弾く
- `src/components/isolation/IsolationRestraint.tsx`（記録タブ）— 回数枠タイトル・各セルの判定を「時のみ」から「回数枠の開始時刻」へ修正し、未来枠はグレー＋クリック不可。「未来日入力抑止 ON」チップを削除
- `src/components/isolation/RestraintObservationMatrix.tsx` — 常時適用へ変更（ツールチップ文言も設定依存の表記を撤去）
- `src/stores/useAppStore.ts` — `optionalFeatures.observationFutureBlock` を削除。persist を version 3 に上げ、既存 localStorage の同キーを migrate で掃除
- `src/components/admission/AdmissionDischarge.tsx` — オプション機能トグル「観察未来日抑止」を削除
- `e2e/observation-future-block.spec.ts` — **新規**。`page.clock.setFixedTime` で 2026-05-19 16:29／16:30／16:31 を再現し、spec の 15分枠の例をそのまま検証（6 ケース）

### 動作確認

- `npx tsc --noEmit` クリーン / `npm run build` クリーン
- E2E: 新規 `observation-future-block.spec.ts` 6 件パス。既存 `flowsheet.spec.ts` / `isolation.spec.ts`（36 件）もパス（回帰なし）
- `npm run lint` は本改修前から実行不可（ESLint 10 系に対し flat config 未整備）。今回は対応範囲外

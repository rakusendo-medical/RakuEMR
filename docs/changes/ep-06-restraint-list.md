# ep-06 隔離拘束一覧 — 改修一覧

## 対象

- 画面: `/isolation`（既存）
- 実装: `src/components/isolation/IsolationRestraint.tsx`「指示」タブ全面改修＋新規ダイアログ群
- 参照 spec: [docs/specs/ep-06-restraint-list/](../specs/ep-06-restraint-list/)

## サマリ

| ストーリー | 改修前 AC | 実装後 AC | 状態 |
| --- | --- | --- | --- |
| us-12 隔離拘束指示受け／一覧 | 0/10 | 0/10 | 🟡 着手前 |

## 既存実装と本エピックの関係

- `src/components/isolation/IsolationRestraint.tsx` には既に 4 タブ（隔離拘束一覧／観察記録／隔離歴／行動制限台帳）が存在するが、「指示」相当の現「隔離拘束一覧」タブは固定列の読み取りビュー。本エピックでは検索条件バー・カルテ／看護／指示受けセル・ガバナンス警告・台帳出力を実装
- ep-05 で導入した `RestraintOrderDialog` をカルテ作成／編集の起動に再利用（`editOrderId` 渡しで編集モード）
- 既存 `BedMoveDialog` を患者番号クリックの転棟・転室ダイアログとして再利用
- 既存 `KarteAlphaPage` 遷移パターン（`Patient.primaryRecordType` 分岐）を踏襲
- 観察記録タブ／隔離歴タブ／行動制限台帳タブは本エピックでは触らない（ep-07 / ep-08 で再整理）

## 共有ファイル変更（要 MASTER 確認）

### `src/types/index.ts`

- 新規型: `OrderConfirmSign`（一次／二次サイン共通）

```ts
/** 隔離拘束指示の指示受けサイン（一次／二次） */
export interface OrderConfirmSign {
  /** 職員 ID（マスタ） */
  staffId: string;
  /** 表示用職員氏名 */
  staffName: string;
  /** 登録日時（ISO 文字列） */
  signedAt: string;
}
```

- `IsolationOrder` に `confirmSigns?: { startPrimary?: OrderConfirmSign; startSecondary?: OrderConfirmSign; endPrimary?: OrderConfirmSign; endSecondary?: OrderConfirmSign }` を追加（オプショナル）
  - キー名は「開始/終了」「一次/二次」の 4 区分
  - 既存 `primaryConfirmedBy?: string` / `secondaryConfirmedBy?: string` フィールドは残置（後方互換、`@deprecated` 注記）

### `src/data/mockData.ts`

- 新規マスタ:

```ts
/** 職員マスタ（指示受けサイン用、精神保健指定医フラグ含む） */
export interface StaffForSign {
  id: string;
  name: string;
  /** 精神保健指定医か（true=精神保健指定医） */
  isPsychiatristCertified: boolean;
}
export const MASTER_STAFF_FOR_SIGN: StaffForSign[] = [
  { id: 'D001', name: '田村 医師', isPsychiatristCertified: true },
  { id: 'D002', name: '森田 医師', isPsychiatristCertified: true },
  { id: 'D003', name: '岸本 医師', isPsychiatristCertified: false },
  { id: 'N001', name: '山本 看護師', isPsychiatristCertified: false },
  // ... 数件
];

/** 病床管理マスタの「行動制限判定対象」相当（その他区分の判定用） */
export const MASTER_BEHAVIOR_RESTRICT_WARDS: WardId[] = ['ward1']; // 例: 第１病棟が判定対象
```

- 既存 `ISOLATION_ORDERS` に `confirmSigns` のサンプル付与（数件）

### `src/stores/useAppStore.ts`

```ts
// ep-06 隔離拘束一覧
upsertConfirmSign: (orderId: string, kind: 'startPrimary' | 'startSecondary' | 'endPrimary' | 'endSecondary', sign: OrderConfirmSign) => void;
removeConfirmSign: (orderId: string, kind: 'startPrimary' | 'startSecondary' | 'endPrimary' | 'endSecondary') => void;
```

- 操作対象は `dynamicIsolationOrders`（ep-05 で導入済）。既存 `ISOLATION_ORDERS`（マスタサンプル）への上書きは、`updateIsolationOrder` と同じく **マスタは触らず、差分は `dynamicIsolationOrders` 側に正規化** する戦略を採用

### 既存ダイアログの API 変更

- `RestraintOrderDialog` (ep-05): 既存 `editOrderId` 引数で編集モード対応済 → ep-06 から流用するだけで API 変更不要

### `src/components/isolation/IsolationRestraint.tsx`

- 「隔離拘束一覧」タブ（現 tab=0）を本 spec の構成へ全面改修
- 観察記録／隔離歴／行動制限台帳タブは触らない

## 共通実装

### 新規ファイル

- `src/components/isolation/SignInputDialog.tsx` — サイン入力ダイアログ（一次／二次サイン共通、登録／更新／削除）
- `src/components/isolation/IsolationFilterDialog.tsx` — 条件設定ダイアログ（入院形態フィルタ）
- `src/components/isolation/NursingRecordDialog.tsx` — 看護記録ダイアログ（FOCUS/SOAP/フリー、モック簡易版）
  - 注: ep-10 で看護記録基盤が出てくるが、ep-06 で必要な最小実装をスタブで作る。実体は ep-10 / ep-07 完了後に統合予定。S3 担当領域との関係は MASTER に確認

### 既存ファイル更新

- `src/components/isolation/IsolationRestraint.tsx` — tab=0 を全面改修

### モックデータ拡張

- 上記 `MASTER_STAFF_FOR_SIGN` / `MASTER_BEHAVIOR_RESTRICT_WARDS`
- `ISOLATION_ORDERS` の confirmSigns サンプル数件

## 画面別変更

### `src/components/isolation/IsolationRestraint.tsx`（tab=0）

- 検索条件バー（期間／病棟／終了者を表示しない／条件設定／表示／印刷）
- 一覧テーブル（spec 通りの 14 列）
- 一覧行のセル → 各種ダイアログ起動
  - 患者番号 → `BedMoveDialog`
  - カルテアイコン → `KarteAlphaPage` 遷移
  - カルテ(開始/終了) [未]/[済] → `RestraintOrderDialog`（タイトル固定 or 編集モード）
  - 看護(開始/終了) [未]/[済] → `NursingRecordDialog`（カルテ済時のみ enabled）
  - 指示受け(開始/終了) [未]/職員名 → `SignInputDialog`
- ガバナンス警告（赤字）の color 算定
  - 開始指示医が精神保健指定医でない → 開始指示医セル赤
  - 開始日時から現在まで > 12h かつ active → 開始日時セル赤
- 台帳出力（モック）: スナックバー通知（後続実装で Excel 化）

### `src/components/isolation/SignInputDialog.tsx`

- サイン種別バナー（startPrimary / startSecondary / endPrimary / endSecondary）
- 職員プルダウン（`MASTER_STAFF_FOR_SIGN`、初期値=ログオン職員 = 暫定 `currentUserRole` 由来でモック）
- [登録] / [更新] / [削除] / [キャンセル]

### `src/components/isolation/IsolationFilterDialog.tsx`

- 入院形態の複数選択（`MASTER_ADMIT_FORM_TYPES`）
- [OK] / [キャンセル]

### `src/components/isolation/NursingRecordDialog.tsx`（モック簡易版）

- 形式セレクト（FOCUS / SOAP / フリー）
- 本文 textarea
- [登録] / [キャンセル]
- 注: 実体としての看護記録ストアは ep-10 で整備予定。ep-06 ではローカル state + スナックバー通知のみで動作させる

## 着手順序（提案）

1. 型拡張: `OrderConfirmSign` + `IsolationOrder.confirmSigns`
2. マスタ追加: `MASTER_STAFF_FOR_SIGN` / `MASTER_BEHAVIOR_RESTRICT_WARDS` + `ISOLATION_ORDERS` サンプル拡張
3. ストア拡張: `upsertConfirmSign` / `removeConfirmSign`
4. `SignInputDialog`
5. `IsolationFilterDialog`
6. `NursingRecordDialog`（モック簡易版）
7. `IsolationRestraint.tsx` tab=0 改修
8. screen-mapping.tsv に行追加

## 完了確認

- 検証コマンド: `npx tsc --noEmit` + `npx vite build`
- UI 動作: ブラウザで検索条件・並び替え・各種ダイアログ起動・サイン登録更新削除・看護記録のカルテ済前提・赤字警告を目視確認

## 残課題（先送り候補）

- 行動制限一覧性台帳の実 Excel 出力（マスタ管理エピックに依存）
- 観察記録対象判定（行動範囲 × 責任レベル × 行動制限項目）の細かいロジック: ep-07 と合わせて整備
- 看護記録ダイアログの本実装は ep-10 完了後に統合
- ログオン職員の本格管理（現在は `currentUserRole` で 'doctor'/'staff' のみ。職員 ID は持っていない）

## 共有ファイル変更（再掲・MASTER 確認依頼項目）

| ファイル | 変更内容 | 影響 |
| --- | --- | --- |
| `src/types/index.ts` | `OrderConfirmSign` 新規 + `IsolationOrder.confirmSigns` 追加 | 後方互換オプショナルのみ |
| `src/data/mockData.ts` | `MASTER_STAFF_FOR_SIGN` / `MASTER_BEHAVIOR_RESTRICT_WARDS` 追加 + `ISOLATION_ORDERS` サンプル拡張 | 既存定数は不変 |
| `src/stores/useAppStore.ts` | `upsertConfirmSign` / `removeConfirmSign` action 追加 | 既存 state 構造を変えない（dynamicIsolationOrders 経由） |
| `docs/screen-mapping.tsv` | `IsolationRestraint.tsx` 行に ep-06 / us-12 を追記 | 既存行変更（要 MASTER 調整） |

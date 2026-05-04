# ep-08 隔離拘束歴 — 改修一覧

## 対象

- 画面: 隔離・拘束歴ダイアログ（複数経路から起動）
- 実装: 既存 `IsolationRestraint.tsx` tab=2「隔離歴」の全面改修＋新規ダイアログ
- 参照 spec: [docs/specs/ep-08-restraint-history/](../specs/ep-08-restraint-history/)

## サマリ

| ストーリー | 改修前 AC | 実装後 AC | 状態 |
| --- | --- | --- | --- |
| us-15 隔離拘束歴 | 0/6 | 6/6 | ✅ 完了（モック実装） |

## 既存実装と本エピックの関係

- 既存 `IsolationRestraint.tsx` tab=2「隔離歴」は `ISOLATION_ORDERS` 全件のシンプル一覧。本エピックで全面改修
- ep-04 `AdmissionHistoryView.tsx` には既に「隔離歴」リンクが存在 → 本エピックで `IsolationHistoryDialog` 起動に接続
- ep-06 で導入した `dynamicIsolationOrders` を履歴ソースとして利用
- 既存 `DeleteReasonDialog`（ep-03 で導入）を削除理由入力に再利用
- 削除順序ルールが本エピックの肝。`subtype` × `operation` × `restraintChange` トグルで判定ロジックを構築

## 共有ファイル変更（要 MASTER 確認）

### `src/types/index.ts`

```ts
// ===== ep-08 隔離拘束歴 =====

/** 削除監査ログ */
export interface IsolationHistoryAudit {
  id: string;
  orderId: string;
  /** 削除日時（ISO） */
  deletedAt: string;
  /** 削除者識別子（モック: currentUserRole） */
  deletedBy: string;
  /** 削除理由分類 */
  reasonCategory: string;
  /** 削除理由テキスト（任意） */
  reasonText?: string;
}
```

### `src/stores/useAppStore.ts`

```ts
// ===== ep-08 隔離拘束歴 =====
isolationHistoryAudits: IsolationHistoryAudit[];
deleteIsolationOrderWithAudit: (
  orderId: string,
  reason: { category: string; text?: string },
  deletedBy: string,
) => void;
// 永続化対象に isolationHistoryAudits を追加
```

削除順序チェックは **呼び出し側（ダイアログ）** で実施し、store にはチェック済みの削除のみ通知する設計とする（store はバリデーション責務を持たない）。

### `src/data/mockData.ts`

- `MASTER_DELETE_REASON_CATEGORIES` を流用（変更なし）

### 既存ファイル更新

- `src/components/isolation/IsolationRestraint.tsx`
  - tab=2「隔離歴」を `IsolationHistoryDialog` の **inline 表示版** で置き換え（patient フィルタは検索条件で対応）
- `src/components/admission/AdmissionHistoryView.tsx`
  - 既存の「隔離歴」リンクに `IsolationHistoryDialog` 起動を接続
  - `onIsolationHistoryClick(patientId)` のような callback を追加 or 直接 import
- `src/components/wardMap/WardMap.tsx`
  - フッターメニューに「隔離歴」追加（既存 `RelatedFeatureDialogs` の枠を流用）

## 共通実装

### 新規ファイル

- `src/components/isolation/IsolationHistoryDialog.tsx` — 隔離・拘束歴ダイアログ（複数経路共通）
- `src/components/isolation/IsolationHistoryView.tsx` — `IsolationHistoryDialog` から `Dialog` 殻を抜いた中身。tab=2 inline 表示で再利用

### 既存ファイル更新

上記参照。

## 削除順序ルールの実装方針

### 履歴列の構築（同 patient × 同 subtype）

```
sortByStartDatetimeAsc(orders for patient × subtype) → ordersAsc[]
```

### `restraintChange === false` の場合

```
deletable(target):
  if target.operation === '開始':
    pair = orders.find(o => o.operation === '解除' && o starts after target)
    後続に他 開始 がある → エラー（先に消せ）
  if target.operation === '解除':
    pair = 対応する 開始
  → ペアで削除
```

### `restraintChange === true` の場合

```
deletable(target):
  return target === ordersAsc[ordersAsc.length - 1]
```

### エラーメッセージ生成

```
「以降の {operation} 指示 ({datetime}) を先に削除してください」
```

## 着手順序（提案）

1. 型追加: `IsolationHistoryAudit`
2. ストア拡張: `isolationHistoryAudits` + `deleteIsolationOrderWithAudit`（永続化）
3. `IsolationHistoryView`（中身）と `IsolationHistoryDialog`（殻）の 2 段構成
4. 削除順序ルールのユーティリティ関数
5. `IsolationRestraint.tsx` tab=2 改修（`IsolationHistoryView` を inline）
6. `AdmissionHistoryView.tsx` の「隔離歴」リンク接続
7. `WardMap.tsx` フッターに「隔離歴」メニュー追加
8. screen-mapping.tsv 更新

## 完了確認

- 検証コマンド: `npx tsc --noEmit` + `npx vite build`
- UI 動作: 各起動経路から開く、降順表示、終了日時表示ロジック、削除順序エラー、削除完了通知を目視確認

## 残課題（先送り候補）

- 観察記録が紐づく指示の削除制約: ep-07 完了後に整理
- 患者情報画面（ep-09）からの起動: ep-09 Phase 3 と整合確認
- 削除権限の本格管理: マスタ管理エピック
- 物理削除 vs 論理削除の最終判断: モックは物理削除

## 共有ファイル変更（再掲・MASTER 確認依頼項目）

| ファイル | 変更内容 | 影響 |
| --- | --- | --- |
| `src/types/index.ts` | `IsolationHistoryAudit` 新規 | 既存型は不変 |
| `src/stores/useAppStore.ts` | `isolationHistoryAudits` + `deleteIsolationOrderWithAudit` action 追加 | 後方互換 |
| `src/components/admission/AdmissionHistoryView.tsx` | 既存「隔離歴」リンクに onClick 接続 | リンクハンドラ追加のみ |
| `src/components/wardMap/WardMap.tsx` | フッターメニューに「隔離歴」追加 | 既存 RelatedFeatureDialogs の枠流用、新規メニュー項目 1 件 |
| `docs/screen-mapping.tsv` | IsolationRestraint.tsx 行に ep-08 / us-15 を追記 | 既存行変更（要 MASTER 調整） |

## 実装後メモ（2026-05-04）

### 追加・変更ファイル

- `src/types/index.ts` — `IsolationHistoryAudit` を追加（ep-07 と同タイミングで追加済）
- `src/stores/useAppStore.ts` — `isolationHistoryAudits` state + `deleteIsolationOrderWithAudit` action を追加（ep-07 と同タイミングで追加済）
- `src/components/isolation/IsolationHistoryView.tsx` — 新規（中身。tab=2 inline と Dialog の両方で再利用）
- `src/components/isolation/IsolationHistoryDialog.tsx` — 新規（殻。AdmissionHistoryView / WardMap から起動）
- `src/components/isolation/IsolationRestraint.tsx` — tab=2 を `<IsolationHistoryView />` に置き換え
- `src/components/admission/AdmissionHistoryView.tsx` — 既存「隔離歴」リンクを `IsolationHistoryDialog` 起動に接続（show snackbar の暫定実装を撤去）
- `src/components/wardMap/WardMap.tsx` — フッター操作メニューに「隔離歴」ボタンを追加（既存退院手続き／退院指示と並列）
- `docs/screen-mapping.tsv` — IsolationHistoryView / IsolationHistoryDialog の 2 行を追加

### 実装上の判断・割り切り

- **削除順序ルール** は `IsolationHistoryView` 内の `computeDeletability` 関数で実装。`restraintChange` トグル ON/OFF で分岐
  - OFF: 「開始」と「解除」のみ削除可。後続に同 subtype の開始があれば削除不可。ペア削除（開始 → 対応する解除も同時削除、逆も同様）
  - ON: 同 patient × 同 subtype の series で **最終指示のみ削除可**
  - 削除不可時はホバーツールチップ + Snackbar (error) で「以降の {operation} 指示 ({datetime}) を先に削除してください」を表示
- **終了日時表示ロジック** は `computeDisplayEnd`:
  - 後続なし → `endDatetime` または「継続中」
  - 後続が「開始」 → 新開始 - 1 分
  - 後続が「継続/変更/解除」 → 新指示の開始（同時刻）
- **削除権限** はモック: `currentUserRole === 'doctor'` のみ削除アイコンを表示。それ以外は Alert で「削除権限なし」を案内（表示は可能）
- **物理削除** を採用: `dynamicIsolationOrders` から filter で除去し、`isolationHistoryAudits` にスナップショット込みの監査ログを永続化
- **マスタ ISOLATION_ORDERS の削除**: マスタ由来の指示は `dynamicIsolationOrders` に居ない。`deleteIsolationOrderWithAudit` は dynamic から filter のみ実行するため、マスタサンプルは削除されないまま再表示される（リロード後元に戻る）。本格運用では論理削除フラグの導入が必要だが、モックでは現状の挙動で十分（ユーザは新規追加した動的指示のみ削除すれば動作確認可能）
- **AC-1 の起動経路** は AdmissionHistoryView / WardMap フッターを実装。患者情報画面（ep-09 経由）からの起動は ep-09 Phase 3 と整合確認の上で別ラウンド
- **観察記録が紐づく指示の削除制約** は spec の補足通りスコープ外（ep-07 完了後の別ラウンドで検討）

### 動作確認

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン
- ブラウザ目視確認は未実施

### MASTER への共有事項

- screen-mapping.tsv の `IsolationRestraint.tsx` 行（ep-06 / ep-07）には ep-08 / us-15 を追記したい（既存行更新）。MASTER 側で調整いただけると助かります
- screen-mapping.tsv の `IsolationHistoryDialog.tsx` 行は起動経路が複数あるため `screen_path` を `*` としています。命名運用は MASTER 判断で OK

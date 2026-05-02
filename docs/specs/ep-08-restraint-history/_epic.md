# ep-08 [隔離拘束] 隔離拘束歴

## メタ

| 項目 | 内容 |
| --- | --- |
| 業務領域 | 隔離拘束 |
| 想定ロール | 主治医、病棟看護師長 |
| 主要画面 | 隔離・拘束歴ダイアログ（複数経路から起動）<br>実装: `src/components/isolation/IsolationHistoryDialog.tsx`（新規）<br>　　　 既存 `IsolationRestraint.tsx` tab=2「隔離歴」を全面改修 |
| 子ストーリー | us-15 |
| ステータス | draft |

### 参考システムマニュアル（エピック横断）

| ファイル | ページ範囲 | 対象 |
| --- | --- | --- |
| 01 基本システム.pdf | p.2232-2237 | 入院歴／隔離・拘束歴ダイアログ |

## 概要

患者の隔離・拘束履歴を時系列で参照できるようにする。誤入力等への対応として履歴の削除も可能とするが、継続・変更指示の有無で削除順序の制約が変わる。複数経路（患者情報／入院歴／病床管理／隔離拘束一覧／カルテ）から同一ダイアログへ遷移できるようにする。

## ゴール

- 患者ごとの隔離・拘束履歴を **開始日時降順** で確認できる
- 誤登録等への対応として履歴を削除できる（操作者・操作時刻の監査が残る）
- 継続・変更指示の整合性を壊さない **削除順序ルール** を画面で強制する

## スコープ

### 含む

- 隔離・拘束歴ダイアログの新規作成
- 複数経路からの起動（患者情報／入院歴／病床管理／一覧／カルテ）
- 開始日時降順の一覧表示
- 終了日時表示ルール（継続方式で異なる）
- 状態列の表示（種別×アクション、ep-05 で導入した `subtype` × `operation` を活用）
- 履歴の削除（既存 `DeleteReasonDialog` を再利用）
- 削除順序ルールのバリデーション + エラーメッセージ
- 削除監査ログ（モック: スナックバー通知 + ストア記録）

### 含まない

- 指示の発行（[ep-05 隔離拘束指示]）
- 観察記録の入力（[ep-07 観察記録]）
- 削除権限の本格管理（モックでは `currentUserRole` で簡易判定）

## 子ストーリー

| ID | タイトル | spec |
| --- | --- | --- |
| us-15 | 隔離拘束歴 | [us-15-restraint-history.spec.md](./us-15-restraint-history.spec.md) |

## 主要画面要素（エピック俯瞰）

```
- 隔離拘束歴ダイアログ起動経路
  - 患者情報画面（ep-09 us-16 完成後に追記想定）
  - 入院歴画面 (ep-04 AdmissionHistoryView)（既に「隔離歴」リンクが存在 → 接続）
  - 病床管理画面下部メニュー（ep-01 WardMap、フッター）
  - 隔離拘束一覧画面 (ep-06 / ep-07 ともリンク追加)
  - カルテ画面（オプション）
- 隔離・拘束歴ダイアログ
  - ヘッダー: 患者基本情報サマリ
  - 一覧テーブル
    - 列: 開始日時 / 終了日時 / 種別 / アクション / 拘束部位 / 開放時間 / 指示医 / 削除アイコン
    - 並び順: 開始日時降順
    - 終了日時表示:
      - 「開始」による継続: 前指示の終了 = 新開始 - 1 分
      - 「継続/変更」による継続: 前指示の終了 = 新指示の開始（同時刻）
    - 削除アイコン: 削除理由ダイアログを起動
  - フッター: [閉じる]
- 削除理由ダイアログ（既存 DeleteReasonDialog 再利用）
- 削除順序エラーアラート
  - 「以降の継続/変更指示 (xx) を先に削除してください」
```

## 完了条件

- 子ストーリー us-15 の AC がすべてチェック済み
- 履歴削除が監査ログ（モック: ストアの `isolationHistoryAudits` 配列 + スナックバー）に残る
- 一覧画面・カルテ・入院歴・病床管理いずれの入口からも本ダイアログへ遷移できる
- 削除順序ルールがUI側でブロックされ、エラーメッセージが分かりやすい

## 依存

- ep-05 で導入した `IsolationOrder.subtype` / `operation` / `restraintParts` / `releaseTimes`
- ep-06 で導入した `dynamicIsolationOrders`（履歴も dynamic として扱う）
- 既存 `DeleteReasonDialog`（再利用、AdmissionDischarge と共通）
- 既存 `IsolationRestraint.tsx` tab=2「隔離歴」を改修
- 既存 `AdmissionHistoryView.tsx` の「隔離歴」リンク（ep-04 で既に存在）

## 共有ファイル変更見込み（要 MASTER 確認）

実装着手前に MASTER と擦り合わせる項目（gap doc で詳細化）。

- `src/types/index.ts`
  - 新規型: `IsolationHistoryAudit`（削除監査ログ）
- `src/data/mockData.ts`
  - `MASTER_DELETE_REASON_CATEGORIES` を共通流用（変更不要）
- `src/stores/useAppStore.ts`
  - 新規 state: `isolationHistoryAudits: IsolationHistoryAudit[]`（永続化対象）
  - 新規 action: `deleteIsolationOrderWithAudit(orderId, reason)` — 削除順序チェックは呼び出し側 or store 内で実装（後述）
- `src/components/isolation/IsolationRestraint.tsx`
  - tab=2「隔離歴」を全面改修（`IsolationHistoryDialog` の inline 表示版として）
- `src/components/admission/AdmissionHistoryView.tsx`
  - 既存「隔離歴」リンク（ep-04 で実装済）を本ダイアログ起動に接続
- `src/components/wardMap/WardMap.tsx`
  - フッター「隔離歴」メニュー追加（既存 RelatedFeatureDialogs の枠を流用可）

## 関連

- 業務領域: 隔離拘束
- 想定ロール: 主治医、病棟看護師長
- 依存マスタ: 隔離拘束指示、観察記録、削除理由マスタ

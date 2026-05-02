# us-15 [隔離拘束] 隔離拘束歴

## メタ

| 項目 | 内容 |
| --- | --- |
| 対応エピック | [ep-08 隔離拘束歴](./_epic.md) |
| 対応モック画面 | 隔離・拘束歴ダイアログ（複数経路から起動）<br>実装: `src/components/isolation/IsolationHistoryDialog.tsx`（新規）<br>　　　 `src/components/isolation/IsolationRestraint.tsx` tab=2 改修（dialog の inline 版） |
| 想定ロール | 主治医、病棟看護師長 |
| ステータス | draft |

### 参考システムマニュアル

| ファイル | ページ範囲 | 対象画面 |
| --- | --- | --- |
| 01 基本システム.pdf | p.2232-2237 | 入院歴／隔離・拘束歴ダイアログ |

## ユーザーストーリー

- **As a** 主治医
- **I want** 患者の隔離・拘束履歴を時系列で参照し、必要に応じて整合性を保ちながら履歴を削除したい
- **So that** 過去の行動制限経過を治療判断に用いつつ、誤入力時には履歴を是正できる

## 画面要素（要素ツリー）

```
- 起動経路
  - 患者情報画面 [隔離歴] リンク（ep-09 完成後に組込）
  - 入院歴画面 [隔離歴] リンク（既存 AdmissionHistoryView に存在）
  - 病床管理画面 フッター [隔離歴] メニュー（新規追加）
  - 隔離拘束一覧画面 患者行 [履歴] アイコン（オプション、本 spec ではスキップ可）
- 隔離・拘束歴ダイアログ
  - ヘッダー
    - 患者基本情報サマリ（患者番号・氏名・年齢・性別）
    - [閉じる] ボタン
  - 一覧テーブル
    - ヘッダ: 開始日時 / 終了日時 / 種別 / アクション / 拘束部位 / 開放時間 / 指示医 / 削除
    - 並び順: 開始日時の **降順**
    - 各行:
      - 開始日時: `IsolationOrder.startDatetime`
      - 終了日時: 表示ルール（後述「終了日時表示ロジック」参照）
      - 種別: `subtype`（隔離 / 拘束 / 隔離拘束）チップ表示
      - アクション: `operation`（開始 / 解除 / 継続 / 変更）
      - 拘束部位: `restraintParts.join(', ')`（あれば）
      - 開放時間: `releaseTimes` 件数表示（ホバーで一覧）
      - 指示医: `doctorName`
      - 削除アイコン（権限がある場合のみ enabled、無ければ非表示）
        - クリック → 削除順序チェック → OK なら DeleteReasonDialog 起動
- 削除理由ダイアログ（既存 DeleteReasonDialog 再利用）
  - 分類セレクト（必須）
  - 理由テキスト（任意）
  - [設定] / [キャンセル]
- 削除順序エラーアラート
  - 削除不可な履歴の場合、Snackbar (error) で「以降の {operation} 指示 (datetime) を先に削除してください」を表示
- 監査ログ（モック）
  - ストアの `isolationHistoryAudits` 配列に { orderId, deletedAt, deletedBy, reason } を append
  - スナックバーで「削除しました（{deletedBy} {deletedAt}）」通知
```

## 振る舞い

- **ダイアログ起動**: 患者 ID + 起動元を引数に IsolationHistoryDialog を mount
- **履歴抽出**: `ISOLATION_ORDERS` + `dynamicIsolationOrders` をマージ → 当該患者の指示のみフィルタ → 開始日時降順ソート
- **削除権限チェック**: モックでは `currentUserRole === 'doctor'` の場合のみ削除アイコンを enabled
- **削除アイコンクリック**: 削除順序ルール（後述）でチェック
  - OK → DeleteReasonDialog 起動
  - NG → エラーアラート表示
- **DeleteReasonDialog [設定]**:
  - 対象 order を `dynamicIsolationOrders` から削除（マスタ ISOLATION_ORDERS の場合は削除フラグを dynamic 側に積む or 物理削除）
  - 監査ログ append
  - スナックバー通知
- **削除後の一覧再描画**: 自動的に再フィルタ（store の subscribe）

## 受け入れ基準（AC）

- [ ] **AC-1: 隔離拘束歴ダイアログを複数経路から開ける**
  - **Given** 患者を選択している
  - **When** 患者情報／入院歴の [隔離歴] リンク、または病床管理画面下部メニューの [隔離歴] をクリックする
  - **Then** 隔離・拘束歴ダイアログが開かれ、当該患者の履歴が表示される
  - **モック範囲:** 入院歴画面のリンクと病床管理フッターは本エピックで接続。患者情報画面は ep-09 完成後の別ラウンドで対応

- [ ] **AC-2: 履歴を時系列で参照できる**
  - **Given** 隔離・拘束歴ダイアログを表示している
  - **When** 一覧を確認する
  - **Then** 開始日時／終了日時／種別／アクション／拘束部位／開放時間／指示医が **開始日時の降順** で一覧表示される

- [ ] **AC-3: 終了日時表示が継続方式で異なる**
  - **Given** 隔離拘束に継続指示が含まれている
  - **When** 履歴を表示する
  - **Then** 「開始」による継続では前指示の終了時間が新開始時間の **1分前** として表示される。「継続／変更」による継続では前指示の終了時間と新指示の開始時間が **同時刻** として表示される

- [ ] **AC-4: 履歴を削除できる**
  - **Given** 削除権限のあるユーザー（モック: `currentUserRole === 'doctor'`）が履歴を選択している
  - **When** 削除アイコンをクリックする
  - **Then** 削除理由ダイアログが表示される。任意の分類と理由を設定して [設定] すると履歴が削除され、削除者・削除日時が監査ログ（store の `isolationHistoryAudits`）に残る。スナックバーで完了通知

- [ ] **AC-5: 削除順序の制約が守られる（継続・変更を使わない運用）**
  - **Given** `optionalFeatures.restraintChange === false` の運用、または開始・解除のみで運用している
  - **When** 「開始」と「解除」がペアで存在する履歴を削除する
  - **Then** ペアで削除される（開始を消すと対応する解除も削除）。終了日時以降に継続された開始記事が存在する場合はエラーとなり、先に後続記事を削除する必要がある

- [ ] **AC-6: 削除順序の制約が守られる（継続・変更を使う運用）**
  - **Given** `optionalFeatures.restraintChange === true` の運用で、複数の継続／解除が積み重なっている履歴がある
  - **When** 中間の履歴の削除アイコンをクリックする
  - **Then** 削除する履歴以降に変更・継続指示がある場合エラーメッセージが表示される。**最終指示から逆順でのみ削除可能**。エラーメッセージには「以降の {operation} 指示 ({datetime}) を先に削除してください」と表示される

## 状態遷移 / バリデーション

### 終了日時表示ロジック

履歴 i の終了日時を計算する際、後続指示 i+1（開始日時順）が存在するかで分岐：

| 後続 i+1 の operation | 表示する終了日時 |
| --- | --- |
| なし（最終指示） | `IsolationOrder.endDatetime`（無ければ「継続中」） |
| 「開始」（再開始）| 後続の `startDatetime - 1分` |
| 「継続」「変更」| 後続の `startDatetime`（同時刻） |
| 「解除」 | 後続の `startDatetime`（解除日時） |

実装: 一覧表示時に同 patient × 同 subtype 内で順次計算。

### 削除順序ルール

#### 継続・変更を使わない運用 (`restraintChange === false`)

- 削除対象 = 「開始」または「解除」
- 「開始」削除時:
  - 対応する「解除」も同時に削除（ペア）
  - 終了日時以降に同 subtype の開始指示が存在 → エラー
- 「解除」削除時:
  - 「開始」も同時に削除（ペア）

#### 継続・変更を使う運用 (`restraintChange === true`)

- 同 patient × 同 subtype の指示列を時系列で構築
- 削除可能なのは **最後の指示のみ**
- 中間指示の削除アイコンをクリックすると即エラー

### 削除権限

- モック: `currentUserRole === 'doctor'` のみ削除可能
- それ以外は削除アイコン非表示

### 監査ログ

```ts
interface IsolationHistoryAudit {
  id: string;
  orderId: string;
  deletedAt: string;  // ISO
  deletedBy: string;  // userRole or staffId（モックでは role）
  reasonCategory: string;
  reasonText?: string;
}
```

永続化対象（`localStorage`）。リセットには store クリアが必要。

## 補足

- 削除は **論理削除** とし、`IsolationOrder.deletedAt` などのフラグを立てる方式と、**物理削除**（`dynamicIsolationOrders` から filter）の 2 案あり
  - モック実装では **物理削除** とし、削除前のスナップショットを `isolationHistoryAudits` に保持する案を採用（後で論理削除に変更可能）
- 削除権限の付与範囲は別途検討（マスタ管理エピック未着手）。モックでは `currentUserRole === 'doctor'` のみ
- エラー時のメッセージは「どの後続指示を先に削除する必要があるか」を明示する案内が望ましい（spec 通り）
- 観察記録の存在チェック（観察記録が紐づく指示は削除不可、等）は本 spec ではスコープ外（ep-07 完了後の別ラウンドで検討）

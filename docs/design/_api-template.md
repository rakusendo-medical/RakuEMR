# <リソース名> API 設計書

## メタ

| 項目 | 内容 |
| --- | --- |
| リソース | <リソース名（例: patients, admission-orders）> |
| 対応エピック | [ep-XX](../../specs/ep-XX-<slug>/_epic.md) |
| 対応画面 | [screens/ep-XX/<screen>.md](../../screens/ep-XX-<slug>/<screen>.md) |
| ステータス | draft / in-review / approved |

## 概要

1〜2 段落でリソースの位置付け、関連する業務フロー、他リソースとの関係を述べる。

## エンドポイント一覧（想定）

| メソッド | パス | 概要 | 詳細 |
| --- | --- | --- | --- |
| GET | `/api/xxxs` | 一覧取得 | [#一覧取得](#一覧取得) |
| GET | `/api/xxxs/{id}` | 単件取得 | [#単件取得](#単件取得) |
| POST | `/api/xxxs` | 新規作成 | [#新規作成](#新規作成) |
| PATCH | `/api/xxxs/{id}` | 更新 | [#更新](#更新) |
| DELETE | `/api/xxxs/{id}` | 削除 | [#削除](#削除) |

## 概念型（共通）

リソース本体の型を概念レベルで列挙。本番開発時に詳細化する。

```ts
interface Xxx {
  id: ID;                    // 必須、サーバ採番
  name: string;              // 必須
  status: 'a' | 'b' | 'c';  // enum
  createdAt: ISODateTime;    // サーバ採番
  updatedAt: ISODateTime;    // サーバ採番
  // ... 主要フィールド
}
```

マスタ参照型は `<MasterEntity>Id` で表記。

## 一覧取得

### 業務動作

- いつ・誰が・何のために呼ぶか
- 結果の使われ方

### エンドポイント想定

```
GET /api/xxxs?wardId=ward1&doctorId=DOC001&from=2026-05-01&to=2026-05-31
```

### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `wardId` | `WardId` | 任意 | 病棟絞り込み |
| `doctorId` | `string` | 任意 | 主治医絞り込み |
| `from` / `to` | ISO date | 任意 | 期間絞り込み |
| `cursor` | string | 任意 | ページネーション |
| `limit` | number | 任意 | 1〜100、既定 20 |

### レスポンス

```ts
{
  items: Xxx[],
  nextCursor?: string,    // 次ページがある場合のみ
  total?: number,         // 任意、件数表示用
}
```

### 権限

| ロール | 可否 |
| --- | --- |
| 医師 | ◯ |
| 看護師 | ◯ |
| 事務 | ◯（自院担当範囲のみ） |

### 主なエラー

- `400 INVALID_PARAM`: 不正なパラメータ
- `403 FORBIDDEN`: 権限不足

## 単件取得

### エンドポイント想定

```
GET /api/xxxs/{id}
```

### レスポンス

```ts
Xxx
```

### エラー

- `404 NOT_FOUND`

## 新規作成

### 業務動作

- 副作用（カルテ記事追加、別リソース更新、通知発火等）
- トランザクション境界

### エンドポイント想定

```
POST /api/xxxs
```

### リクエスト型（概念レベル）

```ts
interface CreateXxxRequest {
  name: string;              // 必須
  status?: 'a' | 'b';       // 任意、既定 'a'
  // ...
}
```

### バリデーション

- `name`: 1〜100 文字、禁則文字 `# @`
- `status`: enum 範囲内

### レスポンス

```ts
Xxx  // 作成された完全形
```

### エラー

- `400 VALIDATION_ERROR`: バリデーション失敗（フィールドと理由を返す）
- `409 CONFLICT`: 一意制約違反など

## 更新

### エンドポイント想定

```
PATCH /api/xxxs/{id}
```

### リクエスト型

```ts
interface UpdateXxxRequest {
  // すべて任意（部分更新）
  name?: string;
  status?: 'a' | 'b';
  // ...
  expectedUpdatedAt?: ISODateTime;  // 楽観ロック用
}
```

### 楽観ロック

`expectedUpdatedAt` を送り、サーバ側で現状の `updatedAt` と一致しなければ `409 STALE` を返す。

### エラー

- `400 VALIDATION_ERROR`
- `404 NOT_FOUND`
- `409 STALE`: 他者の更新と競合

## 削除

### エンドポイント想定

```
DELETE /api/xxxs/{id}
```

### 業務動作

- 物理削除 / 論理削除（ソフトデリート） どちらか明示
- 削除理由が必要な場合、リクエストボディで受け取る

### エラー

- `404 NOT_FOUND`
- `409 IN_USE`: 他リソースから参照中で削除不可

## 関連 API

このリソースと関連する別リソースの API。リンクで誘導。

- [api/ep-XX/yyys.md](./yyys.md)

## 補足・残課題

- 認証（Bearer JWT 想定）等の共通仕様は `_common.md` を参照
- ページネーション・フィルタ仕様の詳細化は本番開発時
- リアルタイム更新（WebSocket / SSE / polling）の要否は別途検討

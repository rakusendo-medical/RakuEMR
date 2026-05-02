# <画面名> 画面設計書

## メタ

| 項目 | 内容 |
| --- | --- |
| 画面パス | `/xxx`（複数なら箇条書き） |
| 主要コンポーネント | `src/components/.../Xxx.tsx` |
| 対応エピック | [ep-XX](../../specs/ep-XX-<slug>/_epic.md) |
| 対応ストーリー | us-XX |
| 対応 spec | [us-XX-xxx.spec.md](../../specs/ep-XX-<slug>/us-XX-xxx.spec.md) |
| 対応 API 設計書 | [api/ep-XX/<resource>.md](../../api/ep-XX-<slug>/<resource>.md) |
| 対応ロール | 主治医・看護師・事務 等 |
| ステータス | draft / in-review / approved |

## 概要

1〜2 段落で画面の目的と業務上の位置付けを述べる。

## 画面構成

### レイアウト

ASCII 図 or 箇条書きで画面ブロック配置を示す。

```
┌──────────────────────────────────────┐
│ ヘッダー（タイトル + ナビ）          │
├──────────────────────────────────────┤
│ 検索条件バー                         │
├──────────────────────────────────────┤
│ メインコンテンツ                     │
│  - テーブル / フォーム / ...         │
├──────────────────────────────────────┤
│ フッター（件数表示・ページャ等）     │
└──────────────────────────────────────┘
```

### コンポーネント分割

| コンポーネント | パス | 役割 |
| --- | --- | --- |
| `XxxPage` | `src/components/xxx/XxxPage.tsx` | 画面ルート |
| `XxxFilterBar` | （内包 or 別ファイル） | 検索条件 |
| `XxxTable` | （内包 or 別ファイル） | 一覧表示 |
| `XxxDialog` | `src/components/xxx/XxxDialog.tsx` | モーダル |

### 表示要素

各セクション・要素の役割・表示条件・データソースを記述。

| 要素 | 役割 | データソース | 表示条件 |
| --- | --- | --- | --- |
| 病棟タブ | 病棟絞り込み | `WARD_LABELS` | 常時 |
| 患者一覧テーブル | 患者表示 | `useAppStore.patients` | 検索条件適用後 |
| 件数表示 | 結果件数 | 計算値 | 常時 |

## 状態管理

### ローカル state

コンポーネント内 useState を列挙。

| state | 型 | 初期値 | 用途 |
| --- | --- | --- | --- |
| `sortKey` | `'a' \| 'b' \| null` | `null` | 並び替えキー |
| `sortDir` | `'asc' \| 'desc'` | `'asc'` | 並び替え方向 |
| `dialogOpen` | `boolean` | `false` | ダイアログ開閉 |

### グローバル state（zustand 等）

| store / key | 用途 | 永続化 |
| --- | --- | --- |
| `useAppStore.patientListSearchCondition` | 検索条件保持 | localStorage |
| `useAppStore.consultationFinishedMap` | 診察終了状態 | localStorage |

### 派生値（useMemo）

主な計算ロジックを記述。

- `filtered`: PATIENTS から在院判定 + 病棟 + 主治医 + キーワード で絞込み
- `sorted`: `filtered` を `sortKey` / `sortDir` で並び替え

## 画面遷移

### 入口

- サイドメニュー「入院患者一覧」 → `/patients`
- 他画面からの戻り（例: `/karte-alpha/:patientId` → ブラウザ戻る）

### 出口

| トリガー | 遷移先 | 備考 |
| --- | --- | --- |
| 患者番号クリック | `/karte-alpha/:patientId` | `setSelectedPatient` を呼ぶ |
| 報告アイコンクリック | `/reports?patientId=...` | 未実装（snackbar 通知） |

## 操作シナリオ

主要ユースケースを 1〜N 個、ステップで記述。

### シナリオ 1: ◯◯

1. ユーザーが △△ を入力
2. 一覧が即座に絞り込まれる
3. ◯◯ をクリックすると ✕✕ 画面に遷移

### シナリオ 2: ...

## バリデーション

- 入力値の検証ルール（必須・形式・範囲）
- フロントエンド側で行うもの／バックエンド任せのものを明示

## レスポンシブ

| ブレークポイント | 挙動 |
| --- | --- |
| 1100px 未満 | ICD10・病名列、責任レベル列を非表示 |

## エラー・空状態

| 状況 | 表示 |
| --- | --- |
| 該当患者なし | 「該当する患者が見つかりませんでした」 |
| 通信エラー（実 API 想定） | エラー Alert + 再試行ボタン |
| 権限不足 | 操作ボタン非表示 / disabled |

## 連携 API

設計書側と対応する。本画面で呼ぶ API 一覧を表記。

| 操作 | API | 設計書 |
| --- | --- | --- |
| 一覧取得 | `GET /api/patients?...` | [api/ep-XX/patients.md](../../api/ep-XX/patients.md) |
| 診察終了切替 | `POST /api/patients/{id}/consultation-finished` | 同上 |

## 連携画面

他画面との連携（データ受け渡しを伴うもの）を記述。

| 連携先 | 受け渡し情報 | 経路 |
| --- | --- | --- |
| `/karte-alpha/:patientId` | patientId | URL parameter + selectedPatient store |

## 補足・残課題

- 後回し項目、未確定事項、関連ストーリーへの参照
- Phase X 残課題があれば明記

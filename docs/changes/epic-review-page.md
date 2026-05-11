# エピック評価画面（`/epic-review/:epicId`）— 改修一覧

## 対象

- 画面: `/epic-review/:epicId`（サイドバー「開発」セクション）
- 実装:
  - `src/components/epicReview/EpicReviewPage.tsx`
  - `src/components/epicReview/epicData.ts`
  - `src/components/epicReview/storyContent.ts`（本セッションで新設）

## 経緯

| 日付 | 内容 | 担当 |
| --- | --- | --- |
| 2026-05-07 | MASTER がサイドバー「開発」セクションに `/epic-review/:epicId` を追加。ep-01〜ep-17 のメタ（`epicData.ts`）+ ダッシュボード（`EpicReviewPage.tsx`）。子ストーリーは ID + ラベルのみ表示 | MASTER |
| 2026-05-08 | PM 指示: 子ストーリーから spec / issue 本文を読めるよう拡張 | — |

---

## 子ストーリー本文表示拡張 完了メモ（S3 / 2026-05-08）

### 実装サマリ

子ストーリー行をアコーディオン化（既定: 折りたたみ）し、展開時に対応する spec / issue ドラフトの markdown 本文を埋込表示。tsc / vite build クリーン。ブラウザ目視は MASTER 段階 2 統合確認時に依頼。

#### 新規ファイル

- **`src/components/epicReview/storyContent.ts`**（約 60 行）
  - Vite の `import.meta.glob` で `docs/specs/**/us-*.spec.md` と `docs/issues/user-story/us-*.md` を `?raw` で eager load
  - ファイル名から us-id（2 桁ゼロ埋め `us-XX`）を抽出して `Map<string, StoryDoc>` にインデックス化
  - 優先順: spec → issue → 未起票（null）
  - 公開 API: `getStoryDoc(storyId): StoryDoc | null`

#### 既存改修

- **`src/components/epicReview/EpicReviewPage.tsx`**:
  - `List` / `ListItem` ベースの子ストーリー描画を MUI `Accordion` 群に置換
  - 各行右端にソース Chip（`spec`／`issue`／`未起票`）を表示
  - 展開時、`react-markdown` + `remark-gfm`（既存依存）でファイル本文を描画
  - markdown のスタイリング: 見出し階層、`code` / `pre` ブロック、テーブル、blockquote、リスト、`hr`、`a` を MUI sx で整形（背景グレー / ダーク pre / 罫線テーブル）
  - 内部の小コンポーネント `StoryAccordion` として分離（ファイル末尾）
  - パス表示は先頭 `../../../` を剥がしてプロジェクトルート起点に正規化（`storyContent.normalizePath`）

### マッチング規則

- ファイル名先頭の `us-<数字>-` パターンから数字を抽出し、`String(parseInt(n, 10)).padStart(2, '0')` で 2 桁ゼロ埋め化
- `epicData.ts` の `stories[].id`（`us-01` 〜 `us-52`、すべて 2 桁ゼロ埋め）と直接比較
- spec ファイル名（`us-32-outpatient-list.spec.md` 等の 0 埋めなし）と issue ファイル名（`us-08-admission-order.md` 等の 0 埋めあり）の双方を吸収

### 未起票表示

- `getStoryDoc(storyId)` が `null` を返す場合は Chip「未起票」（warning）+ AccordionDetails に「spec / issue ドラフトが見つかりませんでした」のプレースホルダ
- 例（manifest にあるが spec/issue 未起票）: us-49 など
- アコーディオン自体は開けるが、本文プレースホルダのみ表示する仕様（s3.md「判断は実装時で OK」に従い「開ける + 未起票表示」を選択）

### スタイリング判断

| # | 判断 | 妥当性 |
| --- | --- | --- |
| 1 | `Accordion disableGutters elevation={0} square` で MUI 既定影 / マージンを抑止 | List の dense 表示に近い密度を保つ |
| 2 | `borderBottom: '1px dashed'` で旧 List の区切り感を継承 | UI 変化を最小化、ヘッダだけ展開 UI に差替 |
| 3 | `AccordionDetails` の背景を `grey.50` に | 本文と一覧行を視覚分離 |
| 4 | `pre` のダーク背景 + monospace | コードブロックの可読性確保 |
| 5 | `table` を `display: block; overflow-x: auto` でラップ | spec 内の幅広テーブル（AC 表 等）が画面外にはみ出さないよう |
| 6 | spec ファイル内 `[..](..)` 形式の相対リンクは markdown 描画でクリック可能（同一オリジン遷移を試みるが、404 になるのみ・UX 上問題なし） | 専用リンクハンドラは付与せず簡素化（必要なら将来追加） |

### 共有ファイル変更

なし。`src/components/epicReview/` 内に閉じる変更のみ。`types` / `store` / `mockData.MASTER_*` / `common` / 既存ダイアログ API 触らず。

### 検証

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン（bundle 2222 kB / gzip 611 kB・spec/issue raw 文字列を全て embed しているため us-50 時点 1505 kB から +717 kB 増。s3.md 想定「対象ファイル現状 50 ファイル以下・eager load で問題なし」と整合）
- ブラウザ目視: 未実施 → MASTER 段階 2 統合確認時に `http://localhost:5173/epic-review/ep-01` 〜 `/ep-17` を順に開いて確認依頼

### 未対応・将来検討

- bundle サイズ増加が将来課題になる場合、`import.meta.glob({ eager: false })` での遅延読み込みに切替可能（dynamic import になる）
- spec 内の相対リンク（`[../specs/...](../specs/...)`）をクリックしたときの挙動は現状 SPA のルータが拾うため 404。本文内リンクハンドラを追加して同画面内で別 spec を開く UX も検討余地あり
- markdown 内の画像（現状なし）は `react-markdown` 既定で `<img>` 描画。raw 文字列に画像が増えたら base64 化 / 外部参照 / `import.meta.glob` の対象拡張のいずれかが必要

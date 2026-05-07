# us-51 [外来・共通] 指示状況タブ実装（カルテ画面 / order-status タブ・最小実装）

## メタ

| 項目 | 内容 |
| --- | --- |
| 対応エピック | [ep-16](./_epic.md) |
| 対応モック画面 | パス: `/karte/:patientId#order-status`<br>実装: `src/components/karte/OrderStatusTab.tsx`（新規）、`src/components/karte/KartePage.tsx`（埋込） |
| 想定ロール | 主治医、病棟看護師、外来看護師 |
| ステータス | draft |

### 経緯

KartePage の `order-status` タブは段階 1 でプレースホルダ。本 us で **オーダの実施状況・受け持ち情報** の最小可視化を実装する。

## ユーザーストーリー

- **As a** 看護師・主治医
- **I want** カルテ画面の「指示状況」タブで、その患者の **指示の実施進捗（指示済・実施中・実施済・予定・中止）と受け持ち** を一目で把握したい
- **So that** 当日や直近の指示の漏れ・滞留を発見でき、指示簿タブ（us-50）と連動して詳細確認に進める

## 画面要素（要素ツリー）

```text
- OrderStatusTab（mode 別配色 SectionHeader）
  - サマリ Chip 行（ステータス別の件数バッジ）:
    - 指示済 X / 実施中 X / 予定 X / 中止 X / 実施済 X
  - フィルタ Chip 行（ステータス別）: 全て / 指示済 / 実施中 / 予定 / 中止 / 実施済
  - 期間切替: 今日 / 今週 / 全期間（既定: 今週）
  - リスト本体（カード風・dense）:
    - 行ごとに: ステータス Chip / type Chip / 内容 / 担当医 / 受け持ち看護師（mock） / 実施予定 or 実施完了日
    - 状態が「指示済」「予定」のものは強調（未対応マーカー）
  - 上部右: 「指示簿タブを開く」ボタン（commitTab で 'orders' へ）
```

## 振る舞い

- **タブ初期表示**: 患者別 ORDERS のうち、期間条件（既定: 今週）+ 全ステータスを表示
- **ステータスフィルタ**: クリックで絞込
- **期間切替**: 今日 / 今週 / 全期間
- **強調マーカー**: 「指示済」「予定」のレコードに右端のドット表示で未対応を可視化（mock）

## 受け入れ基準（AC）

- [ ] **AC-1: ステータス別件数サマリ**: 5 ステータスの件数 Chip 表示
- [ ] **AC-2: ステータスフィルタ Chip**: 6 種（全て + 5 OrderStatus）
- [ ] **AC-3: 期間切替**: 今日 / 今週 / 全期間（既定 今週）
- [ ] **AC-4: 行表示**: ステータス Chip / type Chip / 内容 / 担当医 / 受け持ち看護師 / 期間
- [ ] **AC-5: 未対応マーカー**: 「指示済」「予定」に右端ドット
- [ ] **AC-6: 「指示簿タブを開く」ボタン**: commitTab('orders')
- [ ] **AC-7: 0 件時の空状態表示**
- [ ] **AC-8: design-rules §3 / §6 / §7（ステータス Chip+アイコン）/ §12 準拠**

## 補足

- データソース: 既存 `mockData.ts` の `ORDERS`。受け持ち看護師は `Patient.nurse` を流用 or `OrderStatusTab.tsx` 内に mock
- 共有ファイル変更:
  - `KartePage.tsx`: `KarteTabContent` の `order-status` 分岐に埋込
  - `OrderStatusTab.tsx`: 新規
  - `types/index.ts` / `mockData.ts` の `MASTER_*`: 触らず
- **「今週」の定義**: 当該週の月〜日（mock では `startDate` が直近 7 日以内）
- 段階 2 では read-only 表示に限定。実施記入・ステータス更新操作は別エピック
- us-50 と編集ファイル域がほぼ独立（OrdersTab.tsx vs OrderStatusTab.tsx）。`KartePage.tsx` の同分岐部に追記する点だけ MASTER の merge で吸収

## 担当・進め方

- **担当**: S4
- **作業ディレクトリ**: `~/project/RakuEMR-s4/`（`worker/s4` ブランチ）
- **着手前提**: C-2（ep-12〜14 進捗ヒアリング材料整備）完了済（commit `cece2bf`）→ 即着手可
- **着手前**: `git fetch origin main && git merge origin/main --ff-only` で main 同期（us-50 の S3 commit が先に main にマージされている可能性あり、その場合は ff-only でも OK）
- **完了時**: `git push origin worker/s4` → PM に報告 → MASTER が main にマージ

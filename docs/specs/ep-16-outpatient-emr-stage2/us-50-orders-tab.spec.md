# us-50 [外来・共通] 指示簿タブ実装（カルテ画面 / orders タブ・最小実装）

## メタ

| 項目 | 内容 |
| --- | --- |
| 対応エピック | [ep-16](./_epic.md) |
| 対応モック画面 | パス: `/karte/:patientId#orders`<br>実装: `src/components/karte/OrdersTab.tsx`（新規）、`src/components/karte/KartePage.tsx`（埋込） |
| 想定ロール | 主治医、外来看護師、病棟看護師 |
| ステータス | draft |

### 経緯

KartePage の `orders` タブは段階 1 でプレースホルダ。本 us で **既存 ORDERS データを患者別フィルタで一覧表示** する最小実装に置き換える。本格的な指示作成・編集は別エピック（オーダ管理本実装）扱い。

## ユーザーストーリー

- **As a** 主治医・看護師
- **I want** カルテ画面の「指示簿」タブで、その患者の **定時処方・処方・注射・検査・ECT・リハビリ・入院定時・IF・テキスト** オーダを一覧したい
- **So that** カルテを離れず実施中・予定のオーダを把握でき、指示状況タブ（us-51）への動線で管理画面に飛べる

## 画面要素（要素ツリー）

```text
- OrdersTab（mode 別配色 SectionHeader）
  - フィルタ Chip 行: 全て / 定時処方 / 処方 / 注射 / 検査 / ECT / リハビリ / 入院定時 / IF / テキスト
  - ステータス Chip 行: 全て / 指示済 / 実施中 / 予定 / 中止 / 実施済
  - オーダ一覧（テーブル風 or カード風・dense）:
    - 行ごとに: type Chip / 内容 / スケジュール / ステータス Chip / 期間（startDate + days） / 担当医
  - 件数表示: 「X 件」
  - 上部右: 「指示状況タブを開く」ボタン（commitTab で 'order-status' へ）
```

## 振る舞い

- **タブ初期表示**: その患者の ORDERS 全件を新しい順で表示
- **type フィルタ**: クリックで該当 type のみ
- **status フィルタ**: クリックで該当ステータスのみ
- **type + status は AND 条件**

## 受け入れ基準（AC）

- [ ] **AC-1: 患者別オーダ一覧表示**: `ORDERS.filter(o => o.patientId === patient.id)` で抽出
- [ ] **AC-2: type フィルタ Chip**: 10 種（全て + 9 OrderType）
- [ ] **AC-3: status フィルタ Chip**: 6 種（全て + 5 OrderStatus）
- [ ] **AC-4: テーブル / カード行表示**: type Chip / 内容 / スケジュール / ステータス Chip / 期間 / 担当医
- [ ] **AC-5: 「指示状況タブを開く」ボタン**: クリックで `commitTab('order-status')`（us-33 AC-10 ハッシュ仕様準拠）
- [ ] **AC-6: 件数表示**
- [ ] **AC-7: 0 件時の空状態表示**
- [ ] **AC-8: design-rules §3 / §6 / §12 準拠**

## 補足

- **オーダ種別「定時処方」「処方」の区別**（旧「臨時処方」は「処方」に改称。ver0.20 で区分）:
  - **定時処方**: 入院時に決まったタイミング（朝・夕・就寝前など定時）で医薬品を処方するもの
  - **処方**: 定時に限らないタイミング（頓服・不眠時など）で医薬品を処方するもの
  - `OrderType` は計 9 種（定時処方／処方／注射／検査／ECT／リハビリ／入院定時／IF／文字）。フローシート [us-17] の 1 文字種名「薬」は定時処方・処方の両方に対応する
- データソース: 既存 `mockData.ts` の `ORDERS`。新規データ追加なし
- 共有ファイル変更:
  - `KartePage.tsx`: `KarteTabContent` の `orders` 分岐に `<OrdersTab patient={patient} mode={mode} onOpenOrderStatusTab={...} />` を埋込（meta プレースホルダから移動）
  - `OrdersTab.tsx`: 新規
  - `types/index.ts` / `mockData.ts` の `MASTER_*`: 触らず
- 段階 2 では **read-only 一覧表示** に絞る。新規指示作成・編集は別エピック
- 看護用オーダ（一括バイタル等）の扱いは us-49 サイドバー拡張で別途対応

## 担当・進め方

- **担当**: S3
- **作業ディレクトリ**: `~/project/RakuEMR-s3/`（`worker/s3` ブランチ）
- **着手前**: `git fetch origin main && git merge origin/main --ff-only` で main 同期
- **完了時**: `git push origin worker/s3` → PM に報告 → MASTER が main にマージ
- **共有ファイル変更要請が出たら** HANDOVER「MASTER 待ち事項」に起票

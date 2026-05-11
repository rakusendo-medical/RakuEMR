# ep-16 [外来・共通] 外来 EMR 刷新・段階 2（入院 mode 本実装と入院機能の段階移植）

## メタ

| 項目 | 内容 |
| --- | --- |
| 業務領域 | 外来・共通（入院機能の刷新） |
| 想定ロール | 主治医、病棟看護師、入院担当 |
| 主要画面 | カルテ画面 `/karte/:patientId`（mode='inpatient'）、病棟マップ `/`、入院患者一覧 `/patients` |
| 子ストーリー | us-35 / us-36（後続） / us-37（後続） / us-38 / us-43（診療録タブ）/ us-44〜47（患者ヘッダー・生活歴・診療情報・診療録追補）/ us-50〜52（指示簿・指示状況・スケジュール）— 2026-05-07 PM 指示で順次追加起票 |
| ステータス | draft |

### 参考システムマニュアル（エピック横断）

入院 mode の本実装に伴い、参考システムの **入院機能** マニュアルを参照する。

| ファイル | ページ範囲 | 用途 |
| --- | --- | --- |
| `docs/manuals/01 基本システム.pdf` | 該当ページは `参考システムマニュアル対応表.xlsx` で確認 | 入院系操作（入退院指示／隔離拘束指示 等） |
| `docs/manuals/02 看護支援オプション.pdf` | 同上 | 看護過程・看護記録 |
| `docs/specs/ep-15-outpatient-emr/_epic.md` | — | 段階 1 で確立した mode prop API・タブ構成・遷移元判定の前提 |

## 概要

ep-15（段階 1）で確立した新カルテ画面コンポーネント（`/karte/:patientId`、`mode` prop API）に **`mode='inpatient'` を本実装** し、既存 `KarteAlphaPage` が担っている入院系機能を段階的に新カルテ画面へ移植する。

段階 1 では入院 mode は **タブ可視性切替・テーマ切替・アクションバー枠** まで実装済（中身はプレースホルダ）。本エピックでこれらの中身を本実装する。

## ゴール

- `/karte/:patientId` を病棟マップ・入院患者一覧から開いたとき、`mode='inpatient'` で完全動作する
- 入院系アクション（入退院指示／隔離拘束指示／看護記録）が新カルテ画面から起動できる
- 看護過程タブが入院 mode で活性化し、ep-12〜14（看護診断・計画・評価）の機能と連携する
- `KarteAlphaPage`（`/karte-alpha/:patientId`）と新カルテ画面が **機能等価** になる（段階 3 での置換準備）
- 入院系 EP（ep-01〜10）のリグレッションがない

## スコープ

### 段階 2（本エピックの主スコープ）

- **us-35** 入院 mode 本実装:
  - 患者ヘッダーの mode 識別 Chip（「入院」+ 病棟・病室）の動的表示（段階 1 で枠あり → 本実装）
  - 入院専用情報の表示（属性サブタブ拡張、us-34 段階 1 で枠だけ用意済）
  - 入院 mode のテーマ色（primary）・タブ可視性（看護過程タブ活性）本実装
  - 段階 1 PM 判断の反映: 預かり金セクション非表示、メモの表示位置明示
- **us-36** 入院アクション本実装（後続）:
  - 入退院指示ボタン → 既存 `KarteAlphaPage` のクイック操作領域相当の起動（ep-03 連携）
  - 隔離拘束指示ボタン → ep-05 連携
  - 看護記録ボタン → 既存ダイアログ起動
  - **着手前提**: MASTER 主導の `KarteAlphaPage` 機能インベントリ（Phase 0）完了
- **us-37** 看護過程タブ統合（後続）:
  - 看護診断（ep-12）・看護計画（ep-13）・看護評価（ep-14）の各画面を看護過程タブ配下に統合
  - **着手前提**: ep-12〜14 の進捗が「mock 改修フェーズ 2」を抜けていること
- **us-38** 病棟マップ等の遷移元修正:
  - 病棟マップ／入院患者一覧からの遷移先を `/karte-alpha/:patientId` → `/karte/:patientId` に切替
  - `state.from='ward-map' | 'patient-list'` を必ず付与
- リグレッション確認: ep-01〜10 の振る舞いが新カルテ画面でも維持されているかの動線テスト（段階 2 末で MASTER 主導）

### 含まない（段階 2）

- `KarteAlphaPage.tsx` の撤去（段階 3 / ep-17 で実施）
- `/karte-alpha/:patientId` ルートの撤去（同上、段階 2 中は **温存**）
- 旧 `src/components/karte/` 素材（`PatientHeader.tsx` 等、`FlowsheetPage` 依存のため温存）の整理
- マスタ管理画面の刷新

## 子ストーリー

| ID | タイトル | spec | 着手 |
| --- | --- | --- | --- |
| us-35 | 入院 mode 本実装 | [us-35-inpatient-mode.spec.md](./us-35-inpatient-mode.spec.md) | **先行**（クリティカルパス） |
| us-36 | 入院アクション本実装 | （後続・Phase 0 後に起こす） | Phase 0 完了後 |
| us-37 | 看護過程タブ統合 | （後続・ep-12〜14 進捗確認後に起こす） | ep-12〜14 進捗依存 |
| us-38 | 病棟マップ等の遷移元修正 | [us-38-navigation-state-from.spec.md](./us-38-navigation-state-from.spec.md) | us-35 と並列可（KartePage の mode 判定が動けば良い） |
| us-43 | 診療録タブ実装（カルテ記載 + 過去カルテ参照） | [us-43-medical-record-tab.spec.md](./us-43-medical-record-tab.spec.md) | us-35 完了後着手可。us-36 サブ B（隔離拘束指示）と編集域が重なるため MASTER で調整 |
| us-44 | 患者ヘッダー強化（mode 配色 + 8 ピクトグラム + 業務情報） | [us-44-patient-header-enhanced.spec.md](./us-44-patient-header-enhanced.spec.md) | MASTER 担当・PM 指示 2026-05-07 |
| us-45 | 生活歴タイムラインパネル（5 行） | [us-45-life-history-timeline.spec.md](./us-45-life-history-timeline.spec.md) | デイケア列削除済（5 行構成）。後発 |
| us-46 | 診療情報パネル + サブセクションタブ（7 種） | [us-46-clinical-info-panel.spec.md](./us-46-clinical-info-panel.spec.md) | MASTER 担当 |
| us-47 | 診療録タブ追補（期間切替 / タグ filter / ナビ動作） | [us-47-medical-record-tab-refinements.spec.md](./us-47-medical-record-tab-refinements.spec.md) | us-43 拡張・MASTER 担当 |
| us-50 | 指示簿タブ実装（最小実装） | [us-50-orders-tab.spec.md](./us-50-orders-tab.spec.md) | **S3 担当**・即着手可 |
| us-51 | 指示状況タブ実装（最小実装） | [us-51-order-status-tab.spec.md](./us-51-order-status-tab.spec.md) | **S4 担当**・C-2 完了後着手 |
| us-52 | スケジュールタブ実装（最小実装） | [us-52-schedule-tab.spec.md](./us-52-schedule-tab.spec.md) | 後発・優先度低 |

## 段階 2 着手順序

```text
[Phase 0 / MASTER]
KarteAlphaPage 機能インベントリ + 段階 1 申し送り反映
        │
        ▼
[Phase 1] us-35 入院 mode 本実装  ←  クリティカルパス（S3）
        │  （mode='inpatient' API + テーマ + タブ可視性が確定）
        ▼
   ├─▶ [Phase 2a] us-36 入院アクション本実装（最重量・S2 + MASTER 高密度監督）
   ├─▶ [Phase 2b] us-38 呼び出し元 state.from 修正（最軽量・S4）
   └─▶ [Phase 2c] us-37 看護過程タブ統合（ep-12〜14 進捗前提）
        │
        ▼
[Phase 3 / MASTER] 統合確認・ep-01〜10 リグレッション・KarteAlphaPage との機能等価検証
```

## 並列分割（想定）

- **MASTER 監督下で Phase 0 → us-35 着手**
- us-35 の mode='inpatient' API が固まった後、**us-38 を S4 に並列着手させる**
- us-36 / us-37 は Phase 0 アウトプット次第で粒度を再判断

## 段階移行計画上の位置

| 段階 | 内容 | 対象 |
| --- | --- | --- |
| 1 | mode='outpatient' 実装、OutpatientKartePage 撤去 | ep-15（完了済） |
| **2（本エピック）** | **mode='inpatient' 本実装、入院機能の段階移植** | **新カルテに入院機能を持ち込む** |
| 3 | KarteAlphaPage 撤去・ルート統合 | ep-17（後続） |

## デザインルール統合

- `docs/design-rules.md` §12（mode 切替）に既に記載済（ep-15 で確立）。本エピックでは **準拠**
- 入院 mode のテーマ色割当（primary）、看護過程タブ活性、属性サブタブの入院専用情報セクションは §12 のパターンを延長

## 完了条件

- 配下ストーリー（us-35, us-36, us-37, us-38）が全てクローズ
- `/karte/:patientId` が病棟マップ・入院患者一覧経由で `mode='inpatient'` 完全動作
- 入院系アクション（入退院指示／隔離拘束指示／看護記録）すべて起動可能
- 看護過程タブで ep-12〜14 機能が利用可能
- ep-01〜10 のリグレッションがないことを動線テストで確認
- design-rules §12（mode 切替）に完全準拠

## 段階 1 申し送り（PM 判断・2026-05-06 確定）

us-34 spec の「段階 2 申し送り」表参照。本エピックの **us-35 で吸収**:

1. 預かり金セクション → 項目非表示化（別システム連携想定のスタブ）
2. メモの表示位置明示 → `MemoSubview` の各メモにラベル付け

## 関連

- 業務領域: 外来・共通（入院機能の刷新）
- 依存: ep-15（段階 1 完了が前提）、既存 ep-01〜10
- 後続: ep-17（段階 3：KarteAlphaPage 撤去）
- 参考: `docs/specs/ep-15-outpatient-emr/_epic.md`、`docs/design-rules.md` §12
- 配下: `docs/changes/ep-16-outpatient-emr-stage2.md`（着手時に起こす）

# ep-15 [外来] 外来 EMR 刷新（カルテ画面統一）

## メタ

| 項目 | 内容 |
| --- | --- |
| 業務領域 | 外来・共通 |
| 想定ロール | 外来受付、外来看護師、主治医 |
| 主要画面 | 外来一覧 `/outpatient`、カルテ画面 `/karte/:patientId`（段階 1 から最終形を先行採用）、患者基本情報 `/outpatient/:patientId/basic`（段階 1 で吸収予定） |
| 子ストーリー | us-32 / us-33 / us-34 |
| ステータス | draft |

### 参考システムマニュアル（エピック横断）

参考システム（外来 EMR クライアント）は別系統のため、`docs/manuals/01 基本システム.pdf` および `02 看護支援オプション.pdf` の対応ページは **入院機能向けの記述が主**。外来 EMR の参照は `docs/gairai/`（HTML 仕様書）を一次ソースとする。

| ソース | 用途 |
| --- | --- |
| `docs/gairai/overview.html` | 外来 EMR 全体像 |
| `docs/gairai/spec.html` | 機能仕様 |
| `docs/gairai/manual.html` | 操作手順 |
| `docs/gairai/screen-flow.html` | 画面遷移 |
| `docs/gairai/features/` | 機能別詳細（patient／medical-records 他） |

## 概要

外来 EMR 画面を `docs/design-rules.md` v1.1 に従って刷新する。最終形は **外来／入院で同一のカルテ画面コンポーネント** を使い、`mode` 切替（`outpatient` / `inpatient`）で振る舞いと配色を変える設計。本エピックは **段階 1（外来 mode のみ実装）** を主スコープとする。

## ゴール

- 段階 1 の終了時点で、外来一覧 → 外来カルテ → 患者情報サブタブ の動線が `design-rules.md` 準拠で完成
- カルテ画面コンポーネントの **mode prop ベース設計** を確立（`mode='outpatient'` 実装、`'inpatient'` は段階 2 のフックを残す）
- 利用不可機能のグレーアウト + Tooltip パターンを実装し、`design-rules.md` 新節に文書化
- 外来テーマ（緑系・`color="success"`）／入院テーマ（青系・`color="primary"`）の使い分けを統一

## スコープ

### 段階 1（本エピックの主スコープ）

- us-32 外来一覧の AC 完全充足（既実装は概ね達成済 → 遷移先 URL 切替が中心）
- us-33 カルテ画面（タブ式 TOP・mode 切替）の **構造再設計**（新ルート `/karte/:patientId` で実装）:
  - 7 タブ構成（診療録／フローシート／指示簿／指示状況／看護過程／患者情報／スケジュール）
  - mode 自動判定（患者属性 + 遷移元、矛盾時は遷移元優先）
  - 利用不可タブのグレーアウト + Tooltip
  - mode に応じたアクションバー切替
  - 既存 `src/components/karte/` 素材を design-rules v1.1 準拠で再構成しつつ取り込み（PatientHeader の tabColors hardcode 等の不適合箇所は廃棄／差し替え）
- us-34 患者情報サブタブの **再構成**:
  - 7 サブタブ（基本情報／属性／保険／連絡先／病名／エピソード／メモ）
  - 既存 `PatientBasicPage` を「基本情報」サブビューとして吸収
  - 編集単位ごとの保存・未保存検知

### 段階 2（後続エピック予定・本エピック対象外）

- カルテ画面コンポーネントへの `mode='inpatient'` 追加と入院機能（`KarteAlphaPage`）からの段階移植
- 入院系 EP（ep-01〜10）のリグレッション確認

### 段階 3（後続エピック予定・本エピック対象外）

- `/karte-alpha` を新カルテ画面へ置換し、`KarteAlphaPage` を撤去

### 含まない（段階 1）

- 入院 EMR（`KarteAlphaPage`）の振る舞い変更
- マスタ管理画面
- 受付・会計の業務 UI（外部システム連携で扱う想定）
- ORCA 連携実装（モックではトーストで完了通知）

## 子ストーリー

| ID | タイトル | spec |
| --- | --- | --- |
| us-32 | 外来一覧 | [us-32-outpatient-list.spec.md](./us-32-outpatient-list.spec.md) |
| us-33 | カルテ画面（タブ式 TOP・mode 切替） | [us-33-karte-screen.spec.md](./us-33-karte-screen.spec.md) |
| us-34 | 患者情報サブタブ | [us-34-patient-info-subtabs.spec.md](./us-34-patient-info-subtabs.spec.md) |

## カルテ画面のタブ構成

| タブ | 外来 (`outpatient`) | 入院 (`inpatient`) | 備考 |
| --- | --- | --- | --- |
| 診療録 | ○ | ○ | 既定タブ |
| フローシート | ○ | ○ | 既存 ep-10 を共有 |
| 指示簿 | ○ | ○ | オーダー一覧 |
| 指示状況 | ○ | ○ | 実施状況・受け持ち |
| 看護過程 | △ | ○ | 外来は disabled + Tooltip「外来では利用しません」 |
| 患者情報 | ○ | ○ | サブタブ 7 種（us-34） |
| スケジュール | ○ | ○ | 予約・受診計画 |

凡例: ○ = 表示・操作可、△ = 表示するが disabled

## mode 判定ロジック

1. **患者属性ベース（既定）**: `Patient.admissionState` が `outpatient` → `outpatient` mode、`inpatient` → `inpatient` mode
2. **遷移元ベース（オーバーライド）**:
   - 外来一覧 (`/outpatient`) から遷移 → `outpatient`
   - 病棟マップ (`/`) ／入院患者一覧 (`/patients`) から遷移 → `inpatient`
3. **両者が矛盾する場合**: **遷移元を優先**（業務文脈を尊重）

## デザインルール統合

- `docs/design-rules.md` に **§12 mode 切替（外来／入院）** を新設し、以下を言語化:
  - mode 判定ロジック
  - テーマ色割当（`outpatient` = `success` / `inpatient` = `primary`）
  - 利用不可タブ・アクションのグレーアウト + Tooltip パターン
  - 患者ヘッダーの mode 識別 Chip
- `§11 未保存検知` は変更しない（既存）
- ステータス Chip は `§7.1 ステータス Chip + アイコン併用` に従う

## 主要画面要素（エピック俯瞰）

```text
- 外来一覧 (/outpatient)
  - フィルタタブ: 全件 / 待機中 / 診察中 / 会計待ち / 完了
  - サマリ Chip
  - 患者一覧テーブル: 受付#／患者氏名／年齢／性別／区分／診療科／担当医／予約／受付／状態／備考
  - アクションバー: カルテ／オーダー／文書登録／通知／予約／ORCA 送信／会計完了／チェックイン取消

- カルテ画面 (/karte/:patientId)
  - 患者ヘッダー（mode Chip、戻るリンク）
  - メインタブバー（7 タブ）
    - 診療録タブ
    - フローシートタブ（ep-10 共有）
    - 指示簿タブ
    - 指示状況タブ
    - 看護過程タブ（mode='outpatient' で disabled + Tooltip）
    - 患者情報タブ（サブタブ 7 種、us-34）
    - スケジュールタブ
  - アクションバー（mode に応じて切替）

- 患者情報タブ内（us-34）
  - サブタブ Chip 群（7 種）
  - 編集領域（サブタブごとに切替）
  - サブタブ内アクションバー（保存／キャンセル）
```

## 完了条件

- 配下ストーリー（us-32〜34）が全てクローズ
- 外来一覧 → カルテ画面 → 各タブの遷移が確立
- mode 自動判定が患者属性 + 遷移元で動作
- グレーアウト + Tooltip で利用不可機能を一貫して表現
- `design-rules.md` §12 に mode 切替パターンが記載
- 入院 EP（ep-01〜10）のリグレッションがない（段階 1 では新カルテ画面に入院機能を入れないため、`KarteAlphaPage` 経路はそのまま動作することを目視確認）

## 段階 1 の段取り（着手順序）

1. **基盤**: `docs/design-rules.md` §12 新設（mode 切替パターン）
2. **us-33 骨組み**: 新カルテ画面コンポーネント `src/components/karte/KartePage.tsx`（仮称）の 7 タブ枠 + mode prop 受け口 + テーマ切替
3. **us-32 仕上げ**: 既実装 `OutpatientList` を spec の AC で照合し、不足箇所のみ修正
4. **us-34 構築**: 患者情報サブタブ（7 種）。既存 `PatientBasicPage` を「基本情報」サブビューに転用
5. **統合確認**: 外来一覧 → カルテ → 患者情報 → 戻る、の動線を目視確認

## 段階 1 の並列分割（想定）

- **MASTER 監督下で骨組み合意 → ワーカー並列**
- 骨組み合意後、`us-33` の枠と `mode` prop API が固まる
- 以降は `us-32`（仕上げ）と `us-34`（サブタブ）を並列化可能

## 決定事項（PM 合意済 2026-05-06）

| # | 決定 | 影響範囲 |
| --- | --- | --- |
| 1 | **URL は段階 1 から最終形 `/karte/:patientId` を先行採用**。`/karte-outpatient/:patientId` は新規実装せず（既存 `OutpatientKartePage` ルートは撤去）。`/karte-alpha/:patientId` は段階 3 まで温存（入院系現状維持） | us-33 ルート、us-32 遷移先 |
| 2 | **既存 `src/components/karte/` 素材は活用方針**。design-rules v1.1 への適合可否は MASTER がデザイン面で個別判断（適合可 → 取込／不適合 → 廃棄・差し替え） | us-33 実装方針 |

## 残 PM 確認事項（実装中に判断可・任意）

| # | 内容 | 影響範囲 |
| --- | --- | --- |
| 3 | 既存 `OutpatientKartePage`（6 タブ実装）の撤去タイミング: 段階 1 終了時に即撤去 vs 移行期間を設ける | 段階 1 の終わり方 |
| 4 | 看護過程タブの実体（外来 disabled・入院 ○）: 段階 1 では「タブ枠だけ」「中身は ep-12〜14 で別途」で良いか | us-33 タブ内コンポーネントのスコープ |
| 5 | `/outpatient/:patientId/basic` の扱い: 撤去 vs 互換リダイレクト | us-34 ルート整理 |

## 関連

- 業務領域: 外来・共通
- 依存: 既存 ep-09（共通患者情報）、既存 ep-10（フローシート）
- 参考: `docs/gairai/`、`docs/design-rules.md`
- 配下: `docs/changes/ep-15-outpatient-emr.md`（gap 抽出・段階 1 着手順序）

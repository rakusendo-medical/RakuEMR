# [外来・共通] 外来 EMR 刷新・段階 3（`KarteAlphaPage` 撤去とルート統合）

## 概要

ep-16（段階 2）で `KarteAlphaPage` と機能等価になった新カルテ画面（`/karte/:patientId`）を **唯一のカルテ画面** とし、旧 `KarteAlphaPage`（`/karte-alpha/:patientId`）を撤去する。

段階 1 では `OutpatientKartePage` を撤去（ep-15）、本エピックで `KarteAlphaPage` を撤去することで、最終形「カルテ画面 1 ファイル / 1 ルート」に到達する。

## ゴール

- `/karte-alpha/:patientId` ルートが撤去され、`/karte/:patientId` への互換リダイレクト or 完全削除になる
- `src/components/karteAlpha/KarteAlphaPage.tsx` が削除される
- `src/components/karte/KartePage.tsx` が **唯一のカルテ画面実装** になる
- `src/components/karte/` 内の旧素材（`PatientHeader.tsx` / `ActionBar.tsx` / `LifeTimeline.tsx` / `MedicalInfo.tsx` / `MedicalRecords.tsx`）の扱いを整理（撤去 or 残置の判断）

## スコープ

### 含む

- `/karte-alpha/:patientId` ルートの **撤去** または **`/karte/:patientId` への互換リダイレクト**（PM 確認事項とする）
- `src/components/karteAlpha/KarteAlphaPage.tsx` の削除
- `src/components/karteAlpha/` ディレクトリ自体の削除
- `KarteAlphaPage` を import している箇所（`src/routes/index.tsx` 他）の grep 修正
- 旧 `src/components/karte/` 素材の扱い:
  - `FlowsheetPage` の旧素材依存を切り離す（`FlowsheetPage` を新素材または独立実装に移行）
  - 依存切り離し後、不要になった旧素材を削除
- `docs/screen-mapping.tsv` から `/karte-alpha/:patientId` 行を削除
- リグレッション確認: ep-01〜10 / ep-15 / ep-16 で扱った機能がすべて正常動作

### 含まない

- 新カルテ画面の機能追加（段階 2 / ep-16 で完結している前提）
- マスタ管理画面の刷新

## 想定子ストーリー（暫定・段階 3 着手時に確定）

| ID | タイトル | 概要 |
| --- | --- | --- |
| us-39（仮） | `/karte-alpha` 撤去 + ルート統合 | KarteAlphaPage.tsx 削除、`/karte-alpha/:patientId` を `/karte/:patientId` にリダイレクト or 撤去 |
| us-40（仮） | 旧 `karte/` 素材整理 | `FlowsheetPage` の旧素材依存を切り離し、不要素材を削除 |
| us-41（仮） | リグレッション確認 | ep-01〜10 / ep-15 / ep-16 機能の最終動線確認 |

## 段階移行計画上の位置

| 段階 | 内容 | 対象 |
| --- | --- | --- |
| 1 | mode='outpatient' 実装、OutpatientKartePage 撤去 | ep-15（完了予定） |
| 2 | mode='inpatient' 本実装、入院機能の段階移植 | ep-16（後続） |
| **3（本エピック）** | **KarteAlphaPage 撤去・ルート統合** | **最終形へ収束** |

## 完了条件

- 配下ストーリーが全てクローズ
- `/karte-alpha/:patientId` が撤去または互換リダイレクト済
- `KarteAlphaPage.tsx` ファイル削除
- `src/components/karteAlpha/` ディレクトリ削除
- `src/components/karte/` の旧素材整理完了（`FlowsheetPage` 依存切り離し or 残置判断確定）
- ep-01〜10 / ep-15 / ep-16 機能のリグレッションなし
- カルテ画面が `/karte/:patientId` 1 ルート、`KartePage.tsx` 1 ファイル に収束（最終形達成）

## 関連

- 業務領域: 外来・共通（入院 EMR の最終収束）
- 想定ロール: 全ロール（最終形の整合確認）
- 依存: ep-15（段階 1）、ep-16（段階 2）の完了が前提
- 参考: `docs/specs/ep-15-outpatient-emr/_epic.md` 段階移行計画、`docs/design-rules.md` §12

## PM 確認事項（着手時）

| # | 内容 |
| --- | --- |
| 1 | `/karte-alpha/:patientId` の扱い: 撤去 vs 互換リダイレクト |
| 2 | 旧 `src/components/karte/` 素材の扱い: 一括撤去 vs `FlowsheetPage` リファクタ完了後撤去 |
| 3 | リグレッション確認の範囲: 自動テストなしのため、PM ブラウザ目視で網羅 |

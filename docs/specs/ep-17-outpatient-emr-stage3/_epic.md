# ep-17 [外来・共通] 外来 EMR 刷新・段階 3（KarteAlphaPage 撤去とルート統合）

## メタ

| 項目 | 内容 |
| --- | --- |
| 業務領域 | 外来・共通（入院 EMR の最終収束） |
| 想定ロール | 全ロール（最終形の整合確認） |
| 主要画面 | カルテ画面 `/karte/:patientId`（最終形・mode 切替）。撤去対象: `/karte-alpha/:patientId` |
| 子ストーリー | us-39（ルート完全撤去）／us-40（旧素材撤去）／us-41（リグレッション確認） |
| ステータス | draft（2026-05-11 着手） |

## 概要

ep-15（段階 1）で `OutpatientKartePage` を撤去、ep-16（段階 2）で `KarteAlphaPage` と機能等価以上になった新カルテ画面（`/karte/:patientId`）を **唯一のカルテ画面** とし、旧 `KarteAlphaPage`（`/karte-alpha/:patientId`）と旧素材（`src/components/karte/PatientHeader.tsx` 他）を **完全撤去** する。

最終形「カルテ画面 1 ファイル / 1 ルート」に到達することが本エピックの完了条件。

## ゴール

- `/karte-alpha/:patientId` ルートが **完全撤去** される（PM 確認: 互換リダイレクトは設けない）
- `src/components/karteAlpha/KarteAlphaPage.tsx` が削除される
- `src/components/karteAlpha/` ディレクトリ自体が削除される
- 残存する `navigate('/karte-alpha/...')` 呼び出し 2 件（`IsolationRestraint.tsx` / `AdmissionScheduleCalendar.tsx`）が `/karte/${id}` + 適切な `state.from` 付き遷移へ修正される
- 旧 `src/components/karte/` 素材 5 件（`PatientHeader.tsx` / `ActionBar.tsx` / `LifeTimeline.tsx` / `MedicalInfo.tsx` / `MedicalRecords.tsx`）と、その唯一の参照元である `src/components/flowsheet/FlowsheetPage.tsx`（ルート未接続の死にコード）が削除される
- ep-01〜10 / ep-15 / ep-16 機能のリグレッションが無いことを **PM ブラウザ目視** で確認

## PM 確認事項（2026-05-11 確定）

| # | 内容 | 決定 |
| --- | --- | --- |
| 1 | `/karte-alpha/:patientId` の扱い | **完全撤去**（互換リダイレクトは設けない） |
| 2 | 旧 `src/components/karte/` 素材の扱い | **FlowsheetPage 整理後に撤去**（us-39 で `/karte-alpha` 撤去 → us-40 で旧素材一括撤去） |
| 3 | リグレッション確認の範囲 | **PM ブラウザ目視**（自動テストなしの方針通り） |

## スコープ

### 含む

- `/karte-alpha/:patientId` ルートの **完全撤去**（`routes/index.tsx` から `Route` 削除 + `KarteAlphaPage` import 削除）
- `src/components/karteAlpha/KarteAlphaPage.tsx` と `src/components/karteAlpha/` ディレクトリの削除
- 残 `navigate('/karte-alpha/...')` 2 箇所の `/karte/${id}` + `state.from` 付き遷移への修正
- `src/components/flowsheet/FlowsheetPage.tsx`（死にコード）の削除
- 旧 `src/components/karte/` 素材 5 件の削除
- `MainLayout.tsx` の `/karte-alpha` 条件分岐削除（不要に）
- `docs/screen-mapping.tsv` から `/karte-alpha/:patientId` 行削除
- `docs/HANDOVER.md` および `epicData.ts` の `/karte-alpha/...` 表記更新
- `docs/specs/ep-09-patient-list/us-16-patient-list.spec.md` の `/karte-alpha/:patientId` を `/karte/:patientId` へ更新
- ep-01〜10 / ep-15 / ep-16 機能の PM ブラウザ目視リグレッションチェックリスト作成

### 含まない

- 新カルテ画面の機能追加（ep-16 で完結している前提）
- マスタ管理画面の刷新
- 履歴 docs（`docs/changes/ep-XX.md` 内の `/karte-alpha` 言及）の遡及修正 — 履歴的価値があるため残置

## 段階移行計画上の位置

| 段階 | 内容 | 対象 | ステータス |
| --- | --- | --- | --- |
| 1 | mode='outpatient' 実装、OutpatientKartePage 撤去 | ep-15 | ✅ 完了（2026-05-06） |
| 2 | mode='inpatient' 本実装、入院機能の段階移植 | ep-16 | ✅ 完了（2026-05-11） |
| **3（本エピック）** | **KarteAlphaPage 撤去・ルート統合** | **ep-17** | **🟠 進行中（2026-05-11 着手）** |

## 完了条件

- 配下ストーリー us-39 / us-40 / us-41 がすべてクローズ
- `/karte-alpha/:patientId` が撤去済（route 定義削除）
- `KarteAlphaPage.tsx` ファイル削除
- `src/components/karteAlpha/` ディレクトリ削除
- 旧 `src/components/karte/` 素材 5 件と `src/components/flowsheet/FlowsheetPage.tsx` 削除
- tsc + build クリーン
- ep-01〜10 / ep-15 / ep-16 機能の PM ブラウザ目視確認パス
- カルテ画面が `/karte/:patientId` 1 ルート、`KartePage.tsx` 1 ファイル に収束（最終形達成）

## 関連

- 依存: ep-15（段階 1・完了）、ep-16（段階 2・完了）
- 参考: `docs/specs/ep-15-outpatient-emr/_epic.md` 段階移行計画、`docs/design-rules.md` §12（mode 切替）
- 連動: S2 起票の死にコード対応（MASTER 待ち事項）も本エピックの整理スコープに統合候補

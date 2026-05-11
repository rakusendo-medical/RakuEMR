# us-40 [外来・共通] 旧 `karte/` 素材 + 死にコード `flowsheet/FlowsheetPage.tsx` 撤去

## メタ

| 項目 | 内容 |
| --- | --- |
| 対応エピック | [ep-17](./_epic.md) |
| 対応モック画面 | 撤去対象（ルート未接続の死にコード群）<br>- `src/components/flowsheet/FlowsheetPage.tsx`<br>- `src/components/karte/PatientHeader.tsx`<br>- `src/components/karte/ActionBar.tsx`<br>- `src/components/karte/LifeTimeline.tsx`<br>- `src/components/karte/MedicalInfo.tsx`<br>- `src/components/karte/MedicalRecords.tsx` |
| 想定ロール | 開発者（保守対象削減） |
| ステータス | draft（2026-05-11 着手） |

### 参考システムマニュアル

本 us は死にコード整理のため参考システムマニュアル対応箇所なし。

## ユーザーストーリー

- **As a** 開発者
- **I want** 旧 `src/components/karte/` 素材 5 件と、それらの唯一の参照元 `src/components/flowsheet/FlowsheetPage.tsx`（ルート未接続）をすべて削除したい
- **So that** 保守対象が新カルテ画面 (`KartePage.tsx` + 周辺コンポーネント) に収束し、誤参照リスクが消える

## 前提（事前調査結果）

- 実際に画面に表示される FlowsheetPage は `src/features/flowsheet/pages/FlowsheetPage.tsx`（独立実装・新カルテ画面の `KartePage.tsx` から import 済）
- `src/components/flowsheet/FlowsheetPage.tsx` は **どこからも import されていない死にコード**
- 旧 `src/components/karte/` 素材 5 件（`PatientHeader.tsx` / `ActionBar.tsx` / `LifeTimeline.tsx` / `MedicalInfo.tsx` / `MedicalRecords.tsx`）は、上記の死にコード `flowsheet/FlowsheetPage.tsx` のみが import 元
- 従って `flowsheet/FlowsheetPage.tsx` 削除 → 旧 5 素材削除 の順で安全に撤去可能

事前 grep の根拠コマンド:

```sh
grep -rn "from.*['\"]\\.\\.?/karte/\\(ActionBar\\|PatientHeader\\|LifeTimeline\\|MedicalInfo\\|MedicalRecords\\)['\"]" src/
# → src/components/flowsheet/FlowsheetPage.tsx の 2 件のみ

grep -rn "components/flowsheet/FlowsheetPage" src/
# → 0 件（ルート未接続・どこからも import されていない）
```

## 画面要素（要素ツリー・本 us での修正点）

```
- src/components/flowsheet/FlowsheetPage.tsx
  - 削除

- src/components/flowsheet/ ディレクトリ
  - 他にファイルがなければディレクトリごと削除

- src/components/karte/ 旧素材 5 件
  - PatientHeader.tsx
  - ActionBar.tsx
  - LifeTimeline.tsx
  - MedicalInfo.tsx
  - MedicalRecords.tsx
  → すべて削除（新カルテ画面の KartePatientHeader.tsx / KarteActionBar.tsx / LifeHistoryTimeline.tsx / ClinicalInfoPanel.tsx / MedicalRecordTab.tsx で代替済）
```

## 振る舞い

- **新カルテ画面**: 影響なし（独立実装の `features/flowsheet/pages/FlowsheetPage.tsx` を import しているため）
- **既存全画面**: 影響なし（旧素材を import している箇所は本撤去対象の死にコード `components/flowsheet/FlowsheetPage.tsx` のみ）
- **PM ブラウザ目視**: ep-01〜10 / ep-15 / ep-16 のいずれの画面でもリグレッションなし

## 受け入れ基準（AC）

- [ ] **AC-1: 死にコード `components/flowsheet/FlowsheetPage.tsx` が削除されている**
  - **Given** `src/components/flowsheet/FlowsheetPage.tsx`
  - **Then** ファイルが存在しない

- [ ] **AC-2: `src/components/flowsheet/` ディレクトリが整理されている**
  - **Given** `src/components/flowsheet/`
  - **Then** ディレクトリ自体が削除済（他ファイルが残らない前提で確認）

- [ ] **AC-3: 旧 `karte/` 素材 5 件が削除されている**
  - **Given** `src/components/karte/`
  - **Then** 次のファイルが存在しない:
    - `PatientHeader.tsx`
    - `ActionBar.tsx`
    - `LifeTimeline.tsx`
    - `MedicalInfo.tsx`
    - `MedicalRecords.tsx`

- [ ] **AC-4: 新カルテ画面の構成要素は残置**
  - **Given** `src/components/karte/`
  - **Then** 以下のファイルは存在する（誤削除がない）:
    - `KartePage.tsx`
    - `KartePatientHeader.tsx`
    - `KarteActionBar.tsx`
    - `ClinicalInfoPanel.tsx`
    - `LifeHistoryTimeline.tsx`
    - `MedicalRecordTab.tsx`
    - `OrdersTab.tsx`
    - `OrderStatusTab.tsx`
    - `NursingProcessTab.tsx`
    - `PatientInfoTab.tsx`
    - `ScheduleTab.tsx`

- [ ] **AC-5: 撤去後に他ファイルから旧素材への参照が残っていない**
  - **Given** 撤去後の grep
  - **Then** `grep -rn "components/karte/PatientHeader\\|components/karte/ActionBar\\|components/karte/LifeTimeline\\|components/karte/MedicalInfo\\|components/karte/MedicalRecords" src/` のヒット件数が 0

- [ ] **AC-6: tsc + build がクリーン**
  - **Given** `npx tsc --noEmit`
  - **Then** 0 件エラー
  - **Given** `npx vite build`
  - **Then** 成功

## 補足

- 本 us は **us-39 完了後に着手**（依存: `/karte-alpha` ルートと `KarteAlphaPage` 撤去で旧素材エコシステムへの最後のリンクも切れている前提）
- 本 us 単独では PM ブラウザ目視は不要（削除対象がルート未接続のため）。リグレッションは us-41 で網羅
- 旧素材のうち、もし将来「カルテ画面以外で再利用したい構造を持っているもの」があれば、削除前にコメント等で記録するか別途 us 起票。本 us 着手時点では再利用予定なしの判断

## 検証

1. `grep` で参照 0 件を確認
2. `npx tsc --noEmit`
3. `npx vite build`
4. PM ブラウザ目視は us-41 のリグレッションチェックリスト内で網羅

# us-35 [外来・共通] 入院 mode 本実装

## メタ

| 項目 | 内容 |
| --- | --- |
| 対応エピック | [ep-16](./_epic.md) |
| 対応モック画面 | パス: `/karte/:patientId`<br>実装: `src/components/karte/KartePage.tsx`、`src/components/karte/PatientInfoTab.tsx`、`src/components/karte/patientInfo/AttributesSubview.tsx`、`src/components/karte/patientInfo/BasicInfoSubview.tsx`、`src/components/karte/patientInfo/MemoSubview.tsx` |
| 想定ロール | 主治医、病棟看護師 |
| ステータス | draft |

### 参考システムマニュアル

| ファイル | ページ範囲 | 対象画面 |
| --- | --- | --- |
| `01 基本システム.pdf` | `参考システムマニュアル対応表.xlsx` で確認 | 入院患者カルテ画面の患者ヘッダー・属性表示 |
| `02 看護支援オプション.pdf` | 同上 | 受け持ち看護師・入院日表示 |

## ユーザーストーリー

- **As a** 主治医・病棟看護師
- **I want** 入院患者のカルテを開いた際、入院モードに即した表示（テーマ色・利用可能タブ・入院専用情報セクション）を見たい
- **So that** 外来モードとの違いを視覚的に把握でき、入院文脈に必要な情報（入院日・病棟・病室・受け持ち看護師）を一目で確認できる

## 画面要素（要素ツリー・mode='inpatient' 時の差分）

```
- KartePage (/karte/:patientId)
  - KartePatientHeader
    - mode 識別 Chip: 「入院」（color="primary"）+ 病棟・病室文字列  (mode='inpatient' のとき表示)
  - KarteTabBar (7 タブ)
    - 看護過程タブ: disabled 解除（活性化）  (mode='inpatient' のとき)
  - KarteActionBar
    - 入院モード ActionBar（テーマ primary）  (段階 1 で枠だけ実装済 → 段階 2 で本実装。本 us は枠維持のみ、本実装は us-36)
  - KarteTabContent
    - 患者情報タブ (PatientInfoTab)
      - 属性サブタブ (AttributesSubview)
        - 入院専用情報セクション  (mode='inpatient' のとき表示)
          - 入院日: read-only
          - 病棟・病室: read-only
          - 受け持ち看護師: read-only（既存 Patient.nurse から）
      - 基本情報サブタブ (BasicInfoSubview)
        - 預かり金セクション: 非表示  (mode に関わらず非表示。段階 1 PM 判断 #1)
        - 預かり金スタブコメント: 「別システム連携で表示予定」  (コードコメントのみ)
      - メモサブタブ (MemoSubview)
        - 各メモに表示位置ラベル  (例: 「カルテ画面トップに常時表示」「このタブのみ表示」)
```

## 振る舞い

- **病棟マップ／入院患者一覧から `/karte/:patientId` 遷移**: `state.from='ward-map' | 'patient-list'` → `mode='inpatient'`（既存 us-33 mode 判定優先順序の 3 番目）。テーマ primary・看護過程タブ活性・「入院」Chip 表示
- **外来一覧から遷移した患者が `Patient.admissionState='inpatient'` の場合**: `state.from='outpatient-list'` が優先されて `mode='outpatient'`（業務文脈尊重・既存仕様）
- **属性サブタブ表示**: `mode='inpatient'` のとき入院専用情報セクションが表示。`mode='outpatient'` のときは非表示
- **預かり金セクション非表示**: mode 関わらず常時非表示。コード上はセクションを `null` 返却し、コメントで「ep-XX で別システム連携実装予定」を残す
- **メモサブタブ各エントリにラベル付け**: 表示位置・スコープが視覚的に分かるよう Chip または小さい注記テキストを添える

## 受け入れ基準（AC）

- [ ] **AC-1: 入院 mode で「入院」Chip + 病棟・病室が表示される**
  - **Given** `state.from='ward-map'` または `'patient-list'` で `/karte/:patientId` を開く
  - **Then** 患者ヘッダーに `<Chip color="primary" label="入院" />` が表示され、隣に「病棟名・病室」文字列が併記される

- [ ] **AC-2: 入院 mode で看護過程タブが活性化する**
  - **Given** `mode='inpatient'`
  - **Then** 看護過程タブが disabled でなく、クリック可能（タブ内容自体は us-37 で実装、本 us では活性化のみ）

- [ ] **AC-3: 入院 mode でテーマ色が primary になる**
  - **Given** `mode='inpatient'`
  - **Then** タブインジケーター・Chip・主要ボタンが MUI `primary` 色で描画される（段階 1 で骨組み済 → 本 us で本実装と確認）

- [ ] **AC-4: 属性サブタブに入院専用情報セクションが表示される（mode='inpatient' のみ）**
  - **Given** カルテ画面の「患者情報」→「属性」サブタブを開いている
  - **Given** `mode='inpatient'`
  - **Then** 「入院専用情報」セクションが表示され、入院日・病棟・病室・受け持ち看護師（既存 `Patient.{admitDate, wardName, roomNumber, nurse}` から） が read-only で表示される
  - **Given** `mode='outpatient'`
  - **Then** 「入院専用情報」セクションは非表示

- [ ] **AC-5: 預かり金セクションが非表示（PM 判断 #1）**
  - **Given** カルテ画面の「患者情報」→「基本情報」サブタブを開いている
  - **Then** 預かり金セクションは表示されない（mode 関わらず）
  - **Then** コード上にスタブコメント「別システム連携で表示予定」が残されている

- [ ] **AC-6: メモサブタブの各メモに表示位置ラベルが付く（PM 判断 #2）**
  - **Given** メモサブタブを開いている
  - **Then** 各メモエントリに「カルテ画面トップに常時表示」「このタブのみ表示」等の表示位置・スコープを示すラベルが付く（Chip または注記テキスト）

- [ ] **AC-7: design-rules §12 準拠**
  - design-rules.md §12.1（mode 判定）／§12.2（テーマ色割当）／§12.3（mode 識別 Chip）／§12.4（タブ可視性）に準拠

## 状態遷移 / バリデーション

mode 判定の優先順序は **ep-15 us-33 で確立済**。本 us はその枠組みを変更せず、`mode='inpatient'` 分岐の中身を本実装する:

```text
location.state.from / Patient.admissionState
        │
        ▼
mode 判定（ep-15 us-33 仕様）
        │
   ┌────┴────┐
   ▼         ▼
outpatient  inpatient
（既実装）   （本 us で本実装）
```

## 補足

- 本 us は **画面表示・テーマ・属性表示** に閉じる。入院アクションバーボタン本実装（入退院指示／隔離拘束指示／看護ケア記録の起動先）は **us-36** で別途扱う
- 看護過程タブの「中身」（ep-12〜14 連携）は **us-37** で扱う。本 us は disabled 解除（活性化）のみ
- 病棟マップ・入院患者一覧から `/karte/:patientId` への遷移経路修正は **us-38** で扱う。本 us 単独では既存 `/karte-alpha` 経由で動作確認可能
- 共有ファイル変更:
  - `KartePage.tsx`（mode='inpatient' のテーマ・タブ可視性を本実装）
  - `PatientInfoTab.tsx` / `AttributesSubview.tsx`（入院専用情報セクション本実装）
  - `BasicInfoSubview.tsx`（預かり金セクション非表示化）
  - `MemoSubview.tsx`（表示位置ラベル付与）
  - `src/types/index.ts`、`src/stores/useAppStore.ts`、`src/data/mockData.ts` の `MASTER_*`、`src/components/common/` は **触らない見込み**（必要が生じたら MASTER 待ち事項に起票）
- 検証: `npx tsc --noEmit` + `npx vite build` 必須。ブラウザ目視は MASTER 段階 2 統合確認時に依頼

## 想定実装ステップ（ワーカー向けガイド）

1. `KartePage.tsx` の mode='inpatient' 分岐を確認（段階 1 で骨組み済 → そのまま継続）
2. `KartePatientHeader.tsx` の mode Chip 表示で「入院」Chip + 病棟・病室併記が動いていることを確認（既実装か要追補かをまず確認）
3. `AttributesSubview.tsx` の「入院専用情報」セクション枠を本実装に置き換え
4. `BasicInfoSubview.tsx` で預かり金セクションを `null` 返却 + スタブコメント
5. `MemoSubview.tsx` で各メモにラベル Chip / 注記テキストを追加
6. 検証 → 完了報告（HANDOVER 自セッション行 + `docs/changes/ep-16-outpatient-emr-stage2.md` 起こし）

# us-36 [外来・共通] 入院アクション本実装（入退院指示／隔離拘束指示／看護記録）

## メタ

| 項目 | 内容 |
| --- | --- |
| 対応エピック | [ep-16](./_epic.md) |
| 対応モック画面 | パス: `/karte/:patientId`（mode='inpatient'）<br>実装: `src/components/karte/KartePage.tsx`、`src/components/karte/KarteActionBar.tsx`、`src/components/admission/{AdmissionOrderDialog,DischargeOrderDialog}.tsx`（既存）、`src/components/restraint/RestraintOrderDialog.tsx`（既存）、看護記録ダイアログ（新規） |
| 想定ロール | 主治医、病棟看護師 |
| ステータス | draft（サブ C は実装着手時に AC 詳細追補） |

### 進め方の合議結果

#### サブ A（2026-05-07・PM）

サブ A の「ボタン分割可否」（briefing 想定の合議 1 回）について、PM 判断で **案 2: 2 ボタン分割（KarteAlphaPage 同パターン）** を採用した。spec の AC-A2 / AC-A3 / 振る舞い / 想定実装ステップは本確定に追従して書き換えてある（旧版は「1 ボタン + ダイアログ内タブ切替」案）。

採用理由（briefing で S2 が提示）:

- KarteAlphaPage（[L480-501](../../../src/components/karteAlpha/KarteAlphaPage.tsx)）と同じ UI パターンで利用者の習熟移行コスト 0
- 既存 `AdmissionOrderDialog` / `DischargeOrderDialog` を無変更で起動可能（API 安定）
- 既存ダイアログ内部リファクタ（446 行級）を回避でき「重さ:小」サブタスクの粒度に整合

#### サブ C（2026-05-11・PM）

サブ C の「看護ケア記録」用語と実装方針について、PM 判断で以下を採用:

1. **用語**: 「看護ケア記録」を **「看護記録」** に統一して廃止する。マニュアル調査（S2・2026-05-11）の結果、参考システムには「看護ケア記録」に対応する独立機能が存在せず、業務 `看護` 配下は `看護実施 / 看護記録（個別 / 一括）/ 看護診断 / 看護計画 / 看護評価` の構成で、本ボタンが対応すべきは「看護記録」と整理。
2. **実装方針**: **案 b（ep-10 既存 `NursingRecordDialog` を流用）** を採用。理由:
   - マニュアル整合: 看護記録 = ep-10 既存機能と一致
   - スコープ最小: 新規 types / store / mockData の追加なし
   - 段階 3（ep-17）撤去時も ep-10 はそのまま温存できる
   - 既存記録の閲覧動線は us-43 で実装済の集約タイムライン（診療録タブ）で賄える
3. **「看護経過記録」の概念**: 必要なら別 us で位置づけ、本 us では扱わない（PM 指示）

spec の AC-C1〜C4 / 振る舞い / 想定実装ステップは本確定に追従して書き換えてある（旧版は「実装方針 3 案から着手時に確定」TBD）。

### 参考システムマニュアル

| ファイル | ページ範囲 | 対象画面 |
| --- | --- | --- |
| `01 基本システム.pdf` | `参考システムマニュアル対応表.xlsx` で確認 | 入退院指示・隔離拘束指示（既存 ep-03 / ep-05 と同じ参照） |
| `02 看護支援オプション.pdf` | 同上 | 看護記録（実装方針確定時に該当ページ追記） |

## ユーザーストーリー

- **As a** 主治医・病棟看護師
- **I want** 新カルテ画面の入院モード ActionBar から、入退院指示／隔離拘束指示／看護記録を直接起動したい
- **So that** `KarteAlphaPage` 経由でしか出せなかった入院系操作が新カルテ画面で完結し、段階 3 の `KarteAlphaPage` 撤去に道筋がつく

## 進め方（PM 合意・2026-05-06）

本 us は **1 us 単独 + 内部 3 サブタスク** で進行する。各サブタスク完了で commit を区切る:

| サブ | 対象 | 重さ | MASTER 合議（想定） | 結果（2026-05-11 確定） |
| --- | --- | --- | --- | --- |
| **A** 入退院指示 | 既存 `AdmissionOrderDialog` / `DischargeOrderDialog` を新カルテから起動 | 小 | 1 回（ボタン分割可否） | 案 2 採用（2 ボタン分割・既存 API 無変更） |
| **B** 隔離拘束指示 | ActionBar 経由起動 + 診療録カードの `RestraintOrderLinks` 併存 | 中 | 2〜3 回 | 既存 API 無変更で全解消（合議発生 0 回） |
| **C** 看護記録 | ep-10 既存 `NursingRecordDialog` を流用 | 小 | 3〜4 回 | **マニュアル調査で「看護ケア記録」概念が参考システムに無いと判明 → 用語を「看護記録」に統一、案 b（ep-10 流用）採択。合議発生 1 回（用語＋方針確定）** |

進行順序: **A → B → C**（着手難度の昇順）。MASTER は本 us 期間中、高密度監督で待機。

---

## 画面要素（要素ツリー・mode='inpatient' 時の差分）

```text
- KartePage (/karte/:patientId, mode='inpatient')
  - KarteActionBar (INPATIENT_ACTIONS)
    - 入院指示ボタン           (サブ A・本 us で本実装。admissionState='outpatient' のときのみ活性)
      → AdmissionOrderDialog (既存・直接起動)
    - 退院指示ボタン           (サブ A・本 us で本実装。admissionState='inpatient' のときのみ活性)
      → DischargeOrderDialog (既存・直接起動)
    - 隔離拘束指示ボタン       (サブ B・本 us で disabled 解除 → 本実装)
      → RestraintOrderDialog (既存・ActionBar 経由起動)
    - 看護記録ボタン       (サブ C・同上)
      → NursingCareDialog (新規 or 既存流用・着手時確定)
    - オーダー入力             (本 us スコープ外、placeholder)
    - 印刷                     (本 us スコープ外)
    - 終了                     (本 us スコープ外)

  - 診療録タブ内
    - MedicalRecords (新カルテに移植)
      - 診療録カードヘッダー右
        - RestraintOrderLinks  (サブ B・KarteAlphaPage から移植 / 残置 / 廃止 を spec で確定)
```

## 振る舞い

### サブ A: 入退院指示（2 ボタン分割・案 2 採用）

- **ActionBar に「入院指示」「退院指示」の 2 ボタン**を表示する（KarteAlphaPage の Bottom Action Bar と同じ並び）
- **「入院指示」ボタンクリック**: 既存 `AdmissionOrderDialog` を直接起動（`open={true}` / `patient={patient}`）
- **「退院指示」ボタンクリック**: 既存 `DischargeOrderDialog` を直接起動（同上）
- **ボタン活性は `Patient.admissionState` に従う**（後述「状態遷移 / バリデーション」表）。disabled の場合は理由を Tooltip で表示
- **保存**: 既存 2 ダイアログの保存ロジック（`useAppStore.pendingOrders` に積む）をそのまま利用、API 変更なし

### サブ B: 隔離拘束指示

- **「隔離拘束指示」ボタンクリック**: 既存 `RestraintOrderDialog` が直接開く（タイトル選択は `RestraintOrderLinks` と同じ仕組み）
- **ActionBar 起動と `RestraintOrderLinks` 起動の併存**: 両方とも `RestraintOrderDialog` を開く同じ機能。差は **アクセスポイント**:
  - ActionBar: クイック起動（既定タイトル「隔離開始」）
  - 診療録カードヘッダー: 詳細選択（6/12 リンクから選択 → タイトル指定で開く）
- 看護師の業務動線で「すぐ起動したい」「特定種類で起動したい」両方をカバー

### サブ C: 看護記録（案 b: ep-10 流用・2026-05-11 PM 採択）

「看護ケア記録」用語はマニュアル調査で参考システムに対応機能が無いと判明したため **「看護記録」に統一**（PM 判断・2026-05-11）。実装方針は **案 b（ep-10 既存看護記録系を流用）** を採択。

- **「看護記録」ボタンクリック**: ep-10 既存 `NursingRecordDialog`（`src/features/flowsheet/components/NursingRecordDialog.tsx`）を **`initialMode='new'`** で直接起動
- **ダイアログ内容**: ep-10 のフォーム（FOCUS / SOAP / フリー の 3 形式選択 + 連携設定 + 報告先）をそのまま利用。新規入力モード固定
- **保存ロジック**: ep-10 既存 `useFlowsheetStore` への積み込みに完全委譲。`types` / 他 store の追加なし
- **既存記録の閲覧**: 新カルテの **診療録タブ**（`MedicalRecordTab` の集約タイムライン）で `'看護記録'` カテゴリとして混在表示済（us-43 で本実装済）。記録一覧の全画面表示が必要なら別途 `/nursing/records?patientId=<id>` へ手動 navigate（spec 範囲外）
- **「看護経過記録」の概念整理**: PM 指示で本 us では扱わない。必要なら別 us で位置づけ

## 受け入れ基準（AC）

### サブ A: 入退院指示（2 ボタン分割・案 2 採用）

- [ ] **AC-A1: ActionBar に「入院指示」「退院指示」の 2 ボタンが表示される**
  - **Given** `mode='inpatient'` の KartePage を表示
  - **Then** ActionBar に「入院指示」「退院指示」の 2 ボタンが並ぶ（既存「入退院指示」単一ボタンは廃止）

- [ ] **AC-A2: 各ボタンの活性は `Patient.admissionState` に従う**
  - **Given** `admissionState === 'outpatient'`
  - **Then** 「入院指示」が活性、「退院指示」が disabled（Tooltip「入院していません」）
  - **Given** `admissionState === 'inpatient'`
  - **Then** 「退院指示」が活性、「入院指示」が disabled（Tooltip「既に入院中です」）
  - **Given** `admissionState === 'discharged'`
  - **Then** 両方 disabled（Tooltip「既に退院済です」）

- [ ] **AC-A3: ボタンクリックで対応する既存ダイアログを直接起動**
  - **When** 「入院指示」クリック
  - **Then** 既存 `AdmissionOrderDialog` が開く（`patient` を渡し、API 変更なし）
  - **When** 「退院指示」クリック
  - **Then** 既存 `DischargeOrderDialog` が開く（同上）

- [ ] **AC-A4: 保存ロジックは既存 AdmissionOrderDialog / DischargeOrderDialog を踏襲**
  - **Given** 入院指示で保存
  - **Then** `useAppStore.pendingOrders` に積まれる（既存 ep-03 仕様踏襲）
  - 退院指示も同様

### サブ B: 隔離拘束指示

- [ ] **AC-B1: ActionBar の「隔離拘束指示」ボタンが活性化される**
  - **Given** `mode='inpatient'`
  - **Then** ActionBar の「隔離拘束指示」ボタンが有効

- [ ] **AC-B2: ActionBar 経由で隔離拘束指示ダイアログ起動**
  - **When** ボタンクリック
  - **Then** `RestraintOrderDialog` が既定タイトル「隔離開始」で開く

- [ ] **AC-B3: 診療録カードの `RestraintOrderLinks` が新カルテにも残置される**
  - **Given** 診療録タブを表示
  - **Then** 診療録カードヘッダー右に `RestraintOrderLinks`（KarteAlphaPage と同じ 6/12 リンク UI）が表示される
  - **When** いずれかのリンククリック
  - **Then** `RestraintOrderDialog` が **そのリンクに対応するタイトル** で開く（ActionBar 経由起動と同じダイアログだが、タイトル指定が異なる）

- [ ] **AC-B4: ActionBar 起動と RestraintOrderLinks 起動の動作整合**
  - 両経路とも同じ `RestraintOrderDialog` を起動。state 共有・併用問題なし

### サブ C: 看護記録（案 b: ep-10 流用・2026-05-11 PM 採択）

- [ ] **AC-C1: ActionBar の「看護記録」ボタンが mode='inpatient' で活性**
  - **Given** `mode='inpatient'` の KartePage を表示
  - **Then** ActionBar の「看護記録」ボタンが有効（disabled でなく Tooltip も無し）

- [ ] **AC-C2: ボタンクリックで ep-10 既存 `NursingRecordDialog` が新規入力モードで開く**
  - **When** 「看護記録」ボタンクリック
  - **Then** `<NursingRecordDialog open patientId={patient.id} initialMode='new' onClose />` が起動する
  - **Given** ダイアログ表示中
  - **Then** ep-10 既存の入力フォーム（FOCUS / SOAP / フリー の 3 形式選択）が表示される

- [ ] **AC-C3: 保存ロジックは ep-10 既存 `useFlowsheetStore` を踏襲**
  - **Given** 看護記録の入力 → 保存
  - **Then** ep-10 既存ロジックで `useFlowsheetStore.nursingRecords` に積まれる
  - **And** types / 他 store の追加なし

- [ ] **AC-C4: 既存記録の閲覧は診療録タブのタイムラインで行う**
  - **Given** mode='inpatient' で診療録タブを表示
  - **Then** us-43 の集約タイムラインに `'看護記録'` カテゴリが混在表示される（本 AC は確認のみ・us-43 実装済の挙動）

### 共通

- [ ] **AC-X1: design-rules §10（破壊的アクション warning）／§11（未保存検知）／§12（mode 切替）に準拠**
- [ ] **AC-X2: 入院アクション 3 つのいずれも、`mode='outpatient'` では非表示** （既存仕様踏襲）

## 状態遷移 / バリデーション

入退院指示の選択可否（サブ A）:

| `Patient.admissionState` | 入院指示 | 退院指示 |
| --- | --- | --- |
| `outpatient` | ✅ | ❌（disabled） |
| `inpatient` | ❌（disabled・既に入院中） | ✅ |
| `discharged` | ❌（disabled・既に退院済） | ❌ |
| 未指定（既存）| `inpatient` 扱い | 同上 |

## 補足

- **既存ダイアログ API 変更は MASTER 待ち事項** に必ず起票すること（`AdmissionOrderDialog` / `DischargeOrderDialog` / `RestraintOrderDialog`）
- **`RestraintOrderLinks` を新カルテへ移植する際の判断**:
  - 既存 `MedicalRecordsDense.tsx` 内で使われているコンポーネントを切り出して、新カルテの `KarteTabContent.tsx`（診療録タブ分岐）に埋込
  - 既存実装をなるべく崩さない方針（移植コストを抑える）
- 共有ファイル変更見込み（事前申告 → 実装後の最終結果・2026-05-11）:
  - `src/components/karte/KartePage.tsx`（`admission-order` / `discharge-order` / `isolation-order` / `nursing-record` の onAction ハンドラ追加、各種ダイアログ open state 追加。サブ C 用に `NursingRecordDialog` を import）
  - `src/components/karte/KarteActionBar.tsx`（INPATIENT_ACTIONS を 2 ボタン化、`admissionState` prop を追加して disabled を動的計算。`nursing-care` → `nursing-record` rename + 活性化）
  - 新規 `src/components/karte/MedicalRecordTab.tsx`（サブ B で SectionHeader + RestraintOrderLinks 埋込のスタブ。us-43 で本実装に置換済）
  - **`AdmissionOrderDialog.tsx` / `DischargeOrderDialog.tsx` の API 変更は不要**（サブ A 案 2 採用効果）
  - **`RestraintOrderDialog.tsx` / `RestraintOrderLinks.tsx` の API 変更は不要**（サブ B 既存再利用効果）
  - **`NursingRecordDialog.tsx` / `useFlowsheetStore` の API 変更は不要**（サブ C 案 b 採用効果）
- **触らない**: `src/types/index.ts`（既存 `pendingOrders` / `NursingRecord` で賄える）／`src/data/mockData.ts` の `MASTER_*`（変更要なら起票）／`src/components/common/`

## 想定実装ステップ（ワーカー向けガイド）

### サブ A（最初に着手・案 2: 2 ボタン分割）

1. `KarteActionBar.tsx` を 2 ボタン化:
   - `INPATIENT_ACTIONS` の `admission-order` 行を「入院指示」（disabled は admissionState で動的計算）に書き換え
   - 新規 `discharge-order` 行（「退院指示」）を `admission-order` の直後に挿入
   - `KarteActionBarProps` に `admissionState?: AdmissionState` を追加し、INPATIENT モードの actions を `admissionState` 連動で生成
2. `KartePage.tsx`:
   - `KarteActionBar` 呼び出しに `admissionState={patient.admissionState}` を渡す
   - `handleAction` に `admission-order` / `discharge-order` 分岐を追加し、それぞれ既存ダイアログの `open` state を `true` に
   - レンダー末尾で `<AdmissionOrderDialog open patient onClose />` / `<DischargeOrderDialog open patient onClose />` を追加
3. 既存ダイアログ API は **無変更**（案 2 採用効果）
4. 検証（`npx tsc --noEmit` + `npx vite build`）→ サブ A コミット → push

### サブ B

1. `KarteActionBar.tsx` の `isolation-order` の `disabled: true` を削除
2. `KartePage.tsx` で `onAction('isolation-order')` ハンドラ実装。`RestraintOrderDialog` を既定タイトルで起動
3. **`RestraintOrderLinks` を新カルテ診療録タブに移植**:
   - `MedicalRecordsDense.tsx` を新カルテ用にラップ or 切り出し
   - 診療録タブ分岐（`KarteTabContent`）に埋込
4. 検証 → サブ B コミット → push

### サブ C（案 b: ep-10 流用・2026-05-11 確定）

1. **用語修正**: 「看護ケア記録」を「看護記録」に一括置換（us-36 spec / changes / HANDOVER 自 row / `KarteActionBar.tsx` の label）。ep-15 系の過去文書は履歴として残置
2. `KarteActionBar.tsx` を更新:
   - `INPATIENT_ACTIONS` の `nursing-care` 行を **id `nursing-record` / label「看護記録」** に rename
   - `disabled: true` / `disabledTooltip` を削除（活性化）
3. `KartePage.tsx`:
   - `NursingRecordDialog`（`../../features/flowsheet/components/NursingRecordDialog`）を import
   - `useState<boolean>` で `nursingRecordOpen` を保持
   - `handleAction('nursing-record')` 分岐を追加し `setNursingRecordOpen(true)` を呼ぶ
   - レンダー末尾に `<NursingRecordDialog open patientId initialMode='new' onClose />` を追加
4. ep-10 既存 `NursingRecordDialog` / `useFlowsheetStore` の API は **無変更**（流用効果）
5. 検証（`npx tsc --noEmit` + `npx vite build`）→ サブ C コミット → push → 本 us 全体クローズ報告

## 注意（並行作業時）

- **us-35 と編集ファイルが重複する**: KartePage.tsx・KarteActionBar.tsx は両 us で触る。**us-35 完了後に us-36 着手** が安全
- **既存ダイアログ API 変更は別途 PR として扱う**: us-36 内で完結させず、必要なら独立コミットで先行 push し、影響範囲を見せる

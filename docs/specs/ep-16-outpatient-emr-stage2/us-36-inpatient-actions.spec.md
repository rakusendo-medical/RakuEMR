# us-36 [外来・共通] 入院アクション本実装（入退院指示／隔離拘束指示／看護ケア記録）

## メタ

| 項目 | 内容 |
| --- | --- |
| 対応エピック | [ep-16](./_epic.md) |
| 対応モック画面 | パス: `/karte/:patientId`（mode='inpatient'）<br>実装: `src/components/karte/KartePage.tsx`、`src/components/karte/KarteActionBar.tsx`、`src/components/admission/{AdmissionOrderDialog,DischargeOrderDialog}.tsx`（既存）、`src/components/restraint/RestraintOrderDialog.tsx`（既存）、看護ケア記録ダイアログ（新規） |
| 想定ロール | 主治医、病棟看護師 |
| ステータス | draft（サブ C は実装着手時に AC 詳細追補） |

### 参考システムマニュアル

| ファイル | ページ範囲 | 対象画面 |
| --- | --- | --- |
| `01 基本システム.pdf` | `参考システムマニュアル対応表.xlsx` で確認 | 入退院指示・隔離拘束指示（既存 ep-03 / ep-05 と同じ参照） |
| `02 看護支援オプション.pdf` | 同上 | 看護ケア記録（実装方針確定時に該当ページ追記） |

## ユーザーストーリー

- **As a** 主治医・病棟看護師
- **I want** 新カルテ画面の入院モード ActionBar から、入退院指示／隔離拘束指示／看護ケア記録を直接起動したい
- **So that** `KarteAlphaPage` 経由でしか出せなかった入院系操作が新カルテ画面で完結し、段階 3 の `KarteAlphaPage` 撤去に道筋がつく

## 進め方（PM 合意・2026-05-06）

本 us は **1 us 単独 + 内部 3 サブタスク** で進行する。各サブタスク完了で commit を区切る:

| サブ | 対象 | 重さ | MASTER 合議 |
| --- | --- | --- | --- |
| **A** 入退院指示 | 既存 `AdmissionOrderDialog` / `DischargeOrderDialog` を新カルテから起動 | 小 | 1 回（ボタン分割可否） |
| **B** 隔離拘束指示 | ActionBar 経由起動 + 診療録カードの `RestraintOrderLinks` 併存 | 中 | 2〜3 回 |
| **C** 看護ケア記録 | 新規ダイアログ（または既存ダイアログ流用）。**着手時に要件詰め直し** | 大 | 3〜4 回 |

進行順序: **A → B → C**（着手難度の昇順）。MASTER は本 us 期間中、高密度監督で待機。

---

## 画面要素（要素ツリー・mode='inpatient' 時の差分）

```
- KartePage (/karte/:patientId, mode='inpatient')
  - KarteActionBar (INPATIENT_ACTIONS)
    - 入退院指示ボタン         (サブ A・本 us で disabled 解除 → 本実装)
      → AdmissionOrDischargeOrderDialog (新設ラッパー or 既存 2 ダイアログを mode 切替で起動)
    - 隔離拘束指示ボタン       (サブ B・同上)
      → RestraintOrderDialog (既存・ActionBar 経由起動)
    - 看護ケア記録ボタン       (サブ C・同上)
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

### サブ A: 入退院指示

- **「入退院指示」ボタンクリック**: ダイアログが開く
- **ダイアログ内で「入院指示」「退院指示」を切替**（タブ or radio）。退院指示は `Patient.admissionState === 'inpatient'` のときのみ選択可能。`'discharged'` は両方無効、`'outpatient'` は入院指示のみ
- **保存**: 既存 `AdmissionOrderDialog` / `DischargeOrderDialog` の保存ロジック（`useAppStore.pendingOrders` に積む）に委譲

### サブ B: 隔離拘束指示

- **「隔離拘束指示」ボタンクリック**: 既存 `RestraintOrderDialog` が直接開く（タイトル選択は `RestraintOrderLinks` と同じ仕組み）
- **ActionBar 起動と `RestraintOrderLinks` 起動の併存**: 両方とも `RestraintOrderDialog` を開く同じ機能。差は **アクセスポイント**:
  - ActionBar: クイック起動（既定タイトル「隔離開始」）
  - 診療録カードヘッダー: 詳細選択（6/12 リンクから選択 → タイトル指定で開く）
- 看護師の業務動線で「すぐ起動したい」「特定種類で起動したい」両方をカバー

### サブ C: 看護ケア記録（**着手時に要件詰め直し・暫定**）

- **「看護ケア記録」ボタンクリック**: ダイアログが開く
- **ダイアログ内容**: 当面プレースホルダ。**実装方針 3 案**から着手時に確定:
  1. **新規ダイアログ起こし**: 看護ケア種別・実施日時・実施者・コメント
  2. **既存 ep-10 看護記録系を流用**（`/nursing/individual-record` へ navigate or 同コンポーネント埋込）
  3. **看護過程タブ（us-37）の中身と統合**（看護ケア = 看護介入の実施記録の一形態として扱う）

着手時に PM + MASTER で要件詰め、最終 spec を本ファイルに追記する。

## 受け入れ基準（AC）

### サブ A: 入退院指示

- [ ] **AC-A1: 「入退院指示」ボタンが mode='inpatient' で活性**
  - **Given** `mode='inpatient'` の KartePage を表示
  - **Then** ActionBar の「入退院指示」ボタンが有効（disabled でなく Tooltip も無し）

- [ ] **AC-A2: ボタンクリックでダイアログ起動**
  - **When** 「入退院指示」ボタンクリック
  - **Then** 入退院指示ダイアログが開く

- [ ] **AC-A3: ダイアログ内で入院／退院切替が可能**
  - **Given** ダイアログ表示中
  - **Then** 「入院指示」「退院指示」を切り替えるタブ or radio が表示される
  - **Given** `Patient.admissionState === 'inpatient'`
  - **Then** 退院指示が選択可能
  - **Given** `Patient.admissionState === 'discharged'`
  - **Then** 両方の選択肢が disabled（既に退院済）

- [ ] **AC-A4: 保存ロジックは既存 AdmissionOrder/DischargeOrderDialog を踏襲**
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

### サブ C: 看護ケア記録（**着手時に AC 詳細詰め直し**）

- [ ] **AC-C1: 「看護ケア記録」ボタンが mode='inpatient' で活性**
  - 段階 1 で disabled、本 us で disabled 解除

- [ ] **AC-C2 以降: 着手時に確定**
  - 実装方針 3 案（新規ダイアログ / ep-10 流用 / us-37 統合）から確定後、AC 詳細を追補

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
- 共有ファイル変更見込み（事前申告）:
  - `src/components/karte/KartePage.tsx`（onAction ハンドラ実装）
  - `src/components/karte/KarteActionBar.tsx`（INPATIENT_ACTIONS の disabled 解除）
  - `src/components/admission/AdmissionOrderDialog.tsx`（必要なら mode prop 追加・要 MASTER 合議）
  - `src/components/admission/DischargeOrderDialog.tsx`（同上）
  - `src/components/restraint/RestraintOrderDialog.tsx`（同上）
  - 看護ケア記録ダイアログ（新規・サブ C 着手時）
- **触らない**: `src/types/index.ts`（既存 `pendingOrders` 型・`Patient.admissionState` で賄える見込み）／`src/data/mockData.ts` の `MASTER_*`（変更要なら起票）

## 想定実装ステップ（ワーカー向けガイド）

### サブ A（最初に着手）

1. `KarteActionBar.tsx` の `admission-order` の `disabled: true` を削除、Tooltip も削除
2. `KartePage.tsx` で `onAction('admission-order')` ハンドラ実装。`AdmissionDischargeOrderDialog`（新設ラッパー or 既存 2 ダイアログを切替表示）を開く
3. ダイアログ内で `Patient.admissionState` 参照して入院／退院切替の活性制御
4. 保存ボタンで既存 `pendingOrders` 積み込みロジックを呼ぶ
5. 検証 → サブ A コミット → push

### サブ B

1. `KarteActionBar.tsx` の `isolation-order` の `disabled: true` を削除
2. `KartePage.tsx` で `onAction('isolation-order')` ハンドラ実装。`RestraintOrderDialog` を既定タイトルで起動
3. **`RestraintOrderLinks` を新カルテ診療録タブに移植**:
   - `MedicalRecordsDense.tsx` を新カルテ用にラップ or 切り出し
   - 診療録タブ分岐（`KarteTabContent`）に埋込
4. 検証 → サブ B コミット → push

### サブ C

1. **PM + MASTER と要件確定**（実装方針 3 案から選択）
2. spec 本ファイルに AC-C2 以降を追記
3. 実装 → 検証 → サブ C コミット → push
4. 本 us 全体クローズ報告

## 注意（並行作業時）

- **us-35 と編集ファイルが重複する**: KartePage.tsx・KarteActionBar.tsx は両 us で触る。**us-35 完了後に us-36 着手** が安全
- **既存ダイアログ API 変更は別途 PR として扱う**: us-36 内で完結させず、必要なら独立コミットで先行 push し、影響範囲を見せる

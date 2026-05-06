# us-38 [外来・共通] 病棟マップ等の遷移元修正（state.from 必須付与）

## メタ

| 項目 | 内容 |
| --- | --- |
| 対応エピック | [ep-16](./_epic.md) |
| 対応モック画面 | パス: `/`（病棟マップ）、`/patients`（入院患者一覧）<br>実装: `src/components/wardMap/*`、`src/components/patients/*` 系 |
| 想定ロール | 病棟看護師、主治医 |
| ステータス | draft |

### 参考システムマニュアル

本 us は内部ナビゲーション仕様の調整であり、参考システムマニュアルの直接対応箇所はなし。前提仕様は `docs/specs/ep-15-outpatient-emr/us-33-karte-screen.spec.md` の AC-2（mode 判定優先順序）。

## ユーザーストーリー

- **As a** 病棟看護師・主治医
- **I want** 病棟マップ・入院患者一覧から患者カルテを開いた際、入院モード（テーマ primary・看護過程タブ活性）で表示されてほしい
- **So that** 業務文脈（病棟マップから開いた = 入院文脈）が UI に反映され、外来モードと混在しない

## 画面要素（要素ツリー・本 us での修正点）

```
- 病棟マップ (/)
  - 患者ベッドダブルクリック / カルテボタン
    - 修正前: navigate(`/karte-alpha/${patientId}`)
    - 修正後: navigate(`/karte/${patientId}`, { state: { from: 'ward-map' } })

- 入院患者一覧 (/patients)
  - 患者行クリック / カルテボタン
    - 修正前: navigate(`/karte-alpha/${patientId}`)（既存実装の場合）
    - 修正後: navigate(`/karte/${patientId}`, { state: { from: 'patient-list' } })

- ルート定義 (src/routes/index.tsx)
  - /karte-alpha/:patientId  ←  段階 2 中は **温存**（直 URL アクセス用、段階 3 で撤去）
  - /karte/:patientId        ←  既存（ep-15 で追加済）
```

## 振る舞い

- **病棟マップ → 患者ベッドダブルクリック**: `/karte/:patientId` へ遷移、`state.from='ward-map'` を付与
- **入院患者一覧 → 患者行クリック**: `/karte/:patientId` へ遷移、`state.from='patient-list'` を付与
- **`/karte-alpha/:patientId` 直 URL アクセス**: 段階 2 中は KarteAlphaPage が表示される（temporary 維持・段階 3 で削除）
- **新カルテ画面の mode 判定**: `state.from='ward-map' | 'patient-list'` → `mode='inpatient'`（ep-15 us-33 仕様）

## 受け入れ基準（AC）

- [ ] **AC-1: 病棟マップから新カルテ画面に遷移する**
  - **Given** 病棟マップを表示
  - **When** 患者ベッドをダブルクリック（または「カルテ」ボタンクリック）
  - **Then** `/karte/:patientId` に遷移し、`location.state.from === 'ward-map'` が確認できる

- [ ] **AC-2: 入院患者一覧から新カルテ画面に遷移する**
  - **Given** 入院患者一覧 (`/patients`) を表示
  - **When** 患者行クリック（または「カルテ」ボタンクリック）
  - **Then** `/karte/:patientId` に遷移し、`location.state.from === 'patient-list'` が確認できる

- [ ] **AC-3: 遷移後の新カルテ画面が `mode='inpatient'` で動作する**
  - **Given** 病棟マップまたは入院患者一覧から遷移
  - **Then** 新カルテ画面が `mode='inpatient'` で表示される（テーマ primary、「入院」Chip 表示、看護過程タブ活性）
  - **Then** us-35 で本実装する入院専用情報セクションが属性サブタブで表示される

- [ ] **AC-4: 戻り先判定が新ルートで動作する**
  - **Given** 病棟マップから新カルテへ遷移済
  - **When** 「一覧に戻る」リンクをクリック
  - **Then** 病棟マップ (`/`) に戻る
  - **Given** 入院患者一覧から新カルテへ遷移済
  - **When** 「一覧に戻る」リンクをクリック
  - **Then** 入院患者一覧 (`/patients`) に戻る

- [ ] **AC-5: `/karte-alpha/:patientId` 経路が温存されている（段階 2 中）**
  - **Given** ブラウザに直接 `/karte-alpha/:patientId` を入力
  - **Then** KarteAlphaPage が表示される（段階 3 / ep-17 で撤去予定）

- [ ] **AC-6: 既存の `/karte-alpha` 経由のリグレッションがない**
  - **Given** 何らかの既存 UI から `/karte-alpha/:patientId` に遷移する経路がまだ残っている場合
  - **Then** その経路は段階 2 中は動作する（KarteAlphaPage が表示される）。本 us では撤去しない

## 状態遷移 / バリデーション

mode 判定の優先順序（ep-15 us-33 で確立済・本 us で前提）:

```text
1. props.modeOverride
2. location.state.from === 'outpatient-list'                   → outpatient
3. location.state.from === 'ward-map' | 'patient-list'         → inpatient   ← 本 us で確実に通す
4. useAppStore.navigationSource === 'ward-map'                 → inpatient   （後方互換）
5. Patient.admissionState === 'outpatient'                     → outpatient
6. else                                                         → inpatient
```

`state.from` を必ず付与することで、優先順序の **3 番目** で確定的に inpatient 判定される。フォールバック（4〜6）に頼らない。

## 補足

- 本 us は **軽量タスク**（routes/store/types を触らず、navigate 呼び出し箇所のみ修正）。共有ファイル変更は最小
- `useAppStore.navigationSource` の使い方は既存パターン踏襲。**新規 state 追加は不要**
- 修正対象ファイルの目安（実装時に grep で確認）:
  - `src/components/wardMap/*` 配下の `navigate` 呼び出し箇所
  - `src/components/patients/*`（`PatientList.tsx` 等）の `navigate` 呼び出し箇所
  - `KartePageLocationState` 型は `src/components/karte/KartePage.tsx` から `import type` で受ける（ep-15 us-32 で確立した呼び出し側パターン踏襲）
- `/karte-alpha/:patientId` ルート自体の撤去は **段階 3 / ep-17 us-39（仮）** で扱う
- 検証: `npx tsc --noEmit` + `npx vite build` 必須。ブラウザ目視は MASTER 段階 2 統合確認時に依頼

## 想定実装ステップ（ワーカー向けガイド）

1. `grep -rn "navigate.*karte-alpha" src/` で既存遷移箇所を全列挙
2. 病棟マップ系・入院患者一覧系で **新カルテに切替えるべき箇所** を特定
3. 各箇所の `navigate` 呼び出しを `/karte/:patientId` + `state: { from: 'ward-map' | 'patient-list' }` に置換
4. ep-15 us-32 で確立した型 `KartePageLocationState` を import して `satisfies` で型確認
5. `/karte-alpha/:patientId` ルート定義は **温存**（routes/index.tsx を変更する必要がない）
6. 検証 → 完了報告

## 注意（並行作業時）

- **us-35（S3 担当）と並列着手可能**: us-35 が KartePage 内部・PatientInfoTab を編集するのに対し、本 us は呼び出し側の `navigate` を修正するため衝突しない
- ただし `KartePageLocationState` 型を共通利用するため、**型定義変更は MASTER 待ち事項に起票**（us-35 と先行調整済の見込み）

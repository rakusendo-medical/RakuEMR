# us-39 [外来・共通] `/karte-alpha/:patientId` 完全撤去 + ルート統合

## メタ

| 項目 | 内容 |
| --- | --- |
| 対応エピック | [ep-17](./_epic.md) |
| 対応モック画面 | 撤去: `/karte-alpha/:patientId`（`src/components/karteAlpha/KarteAlphaPage.tsx`）<br>遷移先統一: `/karte/:patientId`（`src/components/karte/KartePage.tsx`） |
| 想定ロール | 全ロール（カルテ入口を新画面に統一） |
| ステータス | draft（2026-05-11 着手） |

### 参考システムマニュアル

本 us はルート撤去・コード整理のため参考システムマニュアル対応箇所なし。前提仕様は `docs/specs/ep-15-outpatient-emr/us-33-karte-screen.spec.md` AC-2（mode 判定優先順序）および `docs/specs/ep-16-outpatient-emr-stage2/us-38-navigation-state-from.spec.md`（state.from 付与パターン）。

## ユーザーストーリー

- **As a** 開発者 / PM
- **I want** `/karte-alpha/:patientId` ルートと旧 `KarteAlphaPage` を完全撤去し、カルテ画面を `/karte/:patientId` 1 ルートに統一したい
- **So that** カルテ画面の最終形「1 ファイル / 1 ルート」が達成され、保守対象が単一実装に収束する

## 画面要素（要素ツリー・本 us での修正点）

```
- ルート定義 (src/routes/index.tsx)
  - 修正前:
    import KarteAlphaPage from '../components/karteAlpha/KarteAlphaPage';
    <Route path="/karte-alpha/:patientId" element={<KarteAlphaPage />} />
  - 修正後:
    （import / Route 行とも削除）

- IsolationRestraint.tsx の navigateToKarte
  - 修正前: navigate(`/karte-alpha/${p.id}`)
  - 修正後: navigate(`/karte/${p.id}`, { state: { from: 'patient-list' } satisfies KartePageLocationState })

- AdmissionScheduleCalendar.tsx の handlePatientClick
  - 修正前: navigate(`/karte-alpha/${patient.id}`)
  - 修正後: navigate(`/karte/${patient.id}`, { state: { from: 'patient-list' } satisfies KartePageLocationState })

- MainLayout.tsx
  - 修正前: !location.pathname.startsWith("/karte-alpha") 条件でブレッドクラム制御
  - 修正後: 該当条件削除（不要に）

- src/components/karteAlpha/KarteAlphaPage.tsx
  - 削除

- src/components/karteAlpha/ ディレクトリ
  - 削除

- docs/screen-mapping.tsv
  - `/karte-alpha/:patientId` 行削除（6 行程度）

- docs/HANDOVER.md
  - 「ep-01 病棟マップ」「ep-03 入退院指示」の path 列を `/karte-alpha/:patientId` から `/karte/:patientId` に更新

- src/components/epicReview/epicData.ts
  - ep-03 / ep-05 の mainScreens の `/karte-alpha/...` を `/karte/...` に更新

- docs/specs/ep-09-patient-list/us-16-patient-list.spec.md
  - 本文中の `/karte-alpha/:patientId` を `/karte/:patientId` に更新
```

## 振る舞い

- **`/karte-alpha/:patientId` 直 URL アクセス**: 404（ルート未定義のため `routes/index.tsx` の `*` キャッチオールで「ページが見つかりません」表示）
- **隔離拘束一覧 → 患者クリック**: `/karte/:patientId` へ遷移し、`state.from='patient-list'` 付与 → `mode='inpatient'` で表示
- **入院予定カレンダー → 確定済予定の患者クリック**: `/karte/:patientId` へ遷移し、`state.from='patient-list'` 付与 → `mode='inpatient'` で表示
- **病棟マップ・入院患者一覧経由**: us-38 で既に修正済（`/karte/:patientId` + `state.from`）→ 影響なし
- **クイック操作（入退院指示ダイアログ・隔離拘束指示ダイアログ）**: 新カルテ画面の `KarteActionBar` から起動（ep-16 で実装済）→ 影響なし

## 受け入れ基準（AC）

- [ ] **AC-1: `/karte-alpha/:patientId` ルートが撤去されている**
  - **Given** `routes/index.tsx` を確認
  - **Then** `KarteAlphaPage` の import 文が存在しない
  - **Then** `<Route path="/karte-alpha/:patientId" ... />` 行が存在しない

- [ ] **AC-2: `KarteAlphaPage.tsx` ファイルとディレクトリが削除されている**
  - **Given** `src/components/karteAlpha/` を確認
  - **Then** ディレクトリ自体が存在しない（`KarteAlphaPage.tsx` も当然存在しない）

- [ ] **AC-3: 残存する `/karte-alpha` navigate 呼び出しが新カルテに置換されている**
  - **Given** `grep -rn "karte-alpha" src/ --include="*.tsx" --include="*.ts"` を実行
  - **Then** ソースコード中の `/karte-alpha` 文字列ヒットは **0 件**（コメント内の `KarteAlphaPage` 言及は履歴コメントとして残置可・必要に応じ整理）

- [ ] **AC-4: 隔離拘束一覧から新カルテに遷移する**
  - **Given** `/isolation` を表示
  - **When** 患者行をクリック（隔離拘束対象患者）
  - **Then** `/karte/:patientId` に遷移し、`location.state.from === 'patient-list'`
  - **Then** 新カルテ画面が `mode='inpatient'` で表示

- [ ] **AC-5: 入院予定カレンダーから確定済予定の新カルテに遷移する**
  - **Given** `/admission` の予定カレンダーを表示
  - **When** 確定済予定の患者セルをクリック
  - **Then** `/karte/:patientId` に遷移し、`location.state.from === 'patient-list'`
  - **Then** 新カルテ画面が `mode='inpatient'` で表示

- [ ] **AC-6: `MainLayout.tsx` の旧 path 条件が削除されている**
  - **Given** `src/layouts/MainLayout.tsx` を確認
  - **Then** `location.pathname.startsWith("/karte-alpha")` 条件が存在しない

- [ ] **AC-7: ドキュメント類の `/karte-alpha` 表記が新ルートに更新されている**
  - **Given** `docs/screen-mapping.tsv` を確認
  - **Then** `/karte-alpha/:patientId` 行が存在しない
  - **Given** `docs/HANDOVER.md` の「screen-mapping.tsv 一致表」を確認
  - **Then** ep-01 / ep-03 の path が `/karte/:patientId` になっている
  - **Given** `src/components/epicReview/epicData.ts` を確認
  - **Then** mainScreens の `path` が `/karte-alpha/...` から `/karte/...` に更新済
  - **Given** `docs/specs/ep-09-patient-list/us-16-patient-list.spec.md` を確認
  - **Then** 本文中の `/karte-alpha/:patientId` が `/karte/:patientId` に更新済（履歴 docs の `docs/changes/ep-XX.md` は対象外・残置）

- [ ] **AC-8: tsc + build がクリーン**
  - **Given** `npx tsc --noEmit`
  - **Then** 0 件エラー
  - **Given** `npx vite build`
  - **Then** 成功

## 補足

- 旧 `src/components/karte/` 素材（`PatientHeader.tsx` / `ActionBar.tsx` / `LifeTimeline.tsx` / `MedicalInfo.tsx` / `MedicalRecords.tsx`）および `src/components/flowsheet/FlowsheetPage.tsx`（死にコード）の撤去は **us-40 で扱う**（本 us のスコープ外）
- `useAppStore` 内のコメント（`KarteAlphaPage では PATIENTS 由来の…` 等）は履歴コメントとして残置。誤読の余地があれば最小限の文言修正は許容
- `src/components/karte/KartePage.tsx` 内のコメント（`KarteAlphaPage と同じパターン`）も同上
- `docs/changes/ep-XX.md` 内の `/karte-alpha` 言及は **履歴的価値があるため修正対象外**

## 検証

1. `grep -rn "/karte-alpha" src/ docs/specs/` → ソース 0 件 / spec は履歴 changes を除いて 0 件
2. `npx tsc --noEmit`
3. `npx vite build`
4. ブラウザ目視（PM 受領後）: `/karte-alpha/P001` 直 URL → 404 / `/isolation` から患者クリック → 新カルテ inpatient / `/admission` 確定済予定クリック → 新カルテ inpatient

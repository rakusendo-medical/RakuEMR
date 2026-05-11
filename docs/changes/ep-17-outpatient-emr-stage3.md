# ep-17 外来 EMR 刷新・段階 3 — 改修一覧

## 対象

- 撤去対象画面: `/karte-alpha/:patientId`（`src/components/karteAlpha/KarteAlphaPage.tsx`）
- 統合先画面: `/karte/:patientId`（`src/components/karte/KartePage.tsx`）
- 撤去対象（旧素材）:
  - `src/components/flowsheet/FlowsheetPage.tsx`（ルート未接続の死にコード）
  - `src/components/karte/PatientHeader.tsx` / `ActionBar.tsx` / `LifeTimeline.tsx` / `MedicalInfo.tsx` / `MedicalRecords.tsx`
- 参照 spec: [docs/specs/ep-17-outpatient-emr-stage3/](../specs/ep-17-outpatient-emr-stage3/)
- 段階 1/2 前提: [docs/specs/ep-15-outpatient-emr/_epic.md](../specs/ep-15-outpatient-emr/_epic.md)、[docs/specs/ep-16-outpatient-emr-stage2/_epic.md](../specs/ep-16-outpatient-emr-stage2/_epic.md)

## 決定事項（PM 合意済）

| # | 決定 | 合意日 | 影響範囲 |
| --- | --- | --- | --- |
| 1 | **`/karte-alpha/:patientId` ルートは完全撤去**（互換リダイレクトは設けない）。直 URL アクセス時はキャッチオール `*` で `/` に Navigate | 2026-05-11 | us-39 / `routes/index.tsx` |
| 2 | **旧 `src/components/karte/` 素材は FlowsheetPage（死にコード）整理後に一括撤去**。us-39 → us-40 の順で進める | 2026-05-11 | us-40 / 旧素材 5 件 + 死にコード 1 件 |
| 3 | **リグレッション確認は PM ブラウザ目視**（自動テストなしの既定方針通り） | 2026-05-11 | us-41 |

## サマリ

| ストーリー | 状態 | commit | 担当 |
| --- | --- | --- | --- |
| us-39 `/karte-alpha` 完全撤去 + ルート統合 | ✅ 完了 | `4d1c8af` | MASTER |
| us-40 旧 `karte/` 素材 + 死にコード `flowsheet/FlowsheetPage` 撤去 | ✅ 完了 | `97937f6` | MASTER |
| us-41 リグレッション確認 + ep-17 クローズ | 🟠 PM 目視待ち | — | PM + MASTER |

## us-39 実装メモ

### 変更点

1. **ルート定義** (`src/routes/index.tsx`)
   - `import KarteAlphaPage` 削除
   - `<Route path="/karte-alpha/:patientId" element={<KarteAlphaPage />} />` 削除
   - キャッチオール `<Route path="*" element={<Navigate to="/" replace />} />` を追加（404 安全ネット）

2. **`KarteAlphaPage` 本体削除**
   - `src/components/karteAlpha/KarteAlphaPage.tsx` 削除（1117 行）
   - `src/components/karteAlpha/` ディレクトリ削除

3. **残 navigate 呼び出し 2 件の修正**
   - `src/components/isolation/IsolationRestraint.tsx`:
     ```diff
     - else navigate(`/karte-alpha/${p.id}`);
     + else navigate(`/karte/${p.id}`, { state: { from: 'patient-list' } satisfies KartePageLocationState });
     ```
   - `src/components/admission/AdmissionScheduleCalendar.tsx`:
     ```diff
     - navigate(`/karte-alpha/${patient.id}`);
     + navigate(`/karte/${patient.id}`, { state: { from: 'patient-list' } satisfies KartePageLocationState });
     ```

4. **`MainLayout.tsx`** の `!location.pathname.startsWith("/karte-alpha")` 条件分岐削除（不要に）

5. **ドキュメント整合**
   - `docs/screen-mapping.tsv`: KarteAlphaPage 行を削除、残行は `/karte/:patientId` に書き換え
   - `docs/HANDOVER.md`: ep-01 / ep-03 の path を `/karte/:patientId` に更新
   - `src/components/epicReview/epicData.ts`: ep-03 / ep-05 mainScreens の path を `/karte/...` に更新
   - `docs/specs/ep-09-patient-list/us-16-patient-list.spec.md`: 本文中 `/karte-alpha/:patientId` を `/karte/:patientId` に更新
   - ソースコメント内の `KarteAlphaPage` 言及を整理（参照置換または削除）

### 影響範囲

- `/karte-alpha/:patientId` への直 URL アクセス → `/` にリダイレクト（キャッチオール）
- 隔離拘束一覧から患者クリック → 新カルテ（inpatient mode）
- 入院予定カレンダー（確定済予定）から患者クリック → 新カルテ（inpatient mode）
- ブレッドクラム表示は全画面で統一（旧 KarteAlphaPage 限定の非表示制御を撤去）

### 検証

- `npx tsc --noEmit` → 0 件エラー
- `npx vite build` → 成功
- `grep -rn "karte-alpha" src/` → ソースヒット 0 件（履歴 docs/changes は対象外）

## us-40 実装メモ

### 撤去ファイル一覧

| ファイル | 行数（削除前） | 削除理由 |
| --- | --- | --- |
| `src/components/flowsheet/FlowsheetPage.tsx` | — | ルート未接続の死にコード。旧 karte/ 素材の唯一の参照元 |
| `src/components/karte/PatientHeader.tsx` | — | 死にコード FlowsheetPage 以外に参照なし。新カルテは `KartePatientHeader` を使用 |
| `src/components/karte/ActionBar.tsx` | — | 同上。新カルテは `KarteActionBar` を使用 |
| `src/components/karte/LifeTimeline.tsx` | — | 同上。新カルテは `LifeHistoryTimeline` を使用 |
| `src/components/karte/MedicalInfo.tsx` | — | 同上。新カルテは `ClinicalInfoPanel` を使用 |
| `src/components/karte/MedicalRecords.tsx` | — | 同上。新カルテは `MedicalRecordTab` を使用 |

### 残置（誤削除防止のための確認）

- `src/components/flowsheet/Flowsheet.tsx`: `/flowsheet` 単独ルートと `PatientMain` で利用継続
- `src/components/flowsheet/FlowsheetGrid.tsx` / `VitalChart.tsx`: `Flowsheet.tsx` の構成要素として継続
- `src/features/flowsheet/pages/FlowsheetPage.tsx`: 新カルテ画面の埋込 + `/flowsheet/:patientId` ルートで利用継続（実装本体）
- `src/components/karte/` の新カルテ構成要素 11 件はすべて残置

### 検証

- `npx tsc --noEmit` → 0 件エラー
- `npx vite build` → 成功
- `grep -rn "components/karte/PatientHeader\|components/karte/ActionBar\|components/karte/LifeTimeline\|components/karte/MedicalInfo\|components/karte/MedicalRecords" src/` → 0 件

## us-41 PM ブラウザ目視リグレッションチェックリスト

### ep-01 病棟マップ

- [ ] **AC-1-1**: `/` 表示 → 病棟マップが正常レンダリング（タブ・関連機能エントリ・凡例・操作メニュー）
- [ ] **AC-1-2**: 患者ベッドをダブルクリック → `/karte/:patientId`（inpatient mode）へ遷移
- [ ] **AC-1-3**: カルテヘッダーから「一覧に戻る」 → `/`（病棟マップ）に戻る

### ep-02 入退院手続き

- [ ] **AC-2-1**: `/admission` 表示 → タブ「入退院情報」のカレンダー表示が正常
- [ ] **AC-2-2**: AdmissionConfirmDialog / DischargeConfirmDialog から確定 → 状態反映

### ep-03 入退院指示

- [ ] **AC-3-1**: 新カルテ（inpatient）の `KarteActionBar` 「入院指示」ボタン → `AdmissionOrderDialog` 起動
- [ ] **AC-3-2**: 入院確定後の状態反映（入院形態 / 文書連動 / 紹介元 / 空床照会）が ep-16 段階 2 と同じく動作
- [ ] **AC-3-3**: 入院中患者カルテで「退院指示」ボタン → `DischargeOrderDialog` 起動 → 退院確定動作
- [ ] **AC-3-4**: `/admission` 予定カレンダー → 確定済予定患者クリック → `/karte/:patientId`（inpatient mode）へ遷移

### ep-04 入退院歴

- [ ] **AC-4-1**: `/admission` タブ「入院歴」 → `AdmissionHistoryView` 表示
- [ ] **AC-4-2**: 期間グルーピング / 形態変更 / 入退院取消 / 関連履歴リンクが動作

### ep-05 隔離拘束指示

- [ ] **AC-5-1**: 新カルテの診療録タブ右側に `RestraintOrderLinks`（隔離拘束指示リンク群）表示
- [ ] **AC-5-2**: 各リンクから `RestraintOrderDialog` 起動 → 開始/解除/継続/変更の操作
- [ ] **AC-5-3**: `/isolation` 隔離拘束一覧 → 患者行クリック → `/karte/:patientId`（inpatient mode）へ遷移

### ep-06 隔離拘束一覧

- [ ] **AC-6-1**: `/isolation` tab=0 「指示」が 14 列で表示、検索条件・台帳出力・サイン入力が動作

### ep-07 観察記録 / ep-08 隔離拘束歴

- [ ] **AC-7-1**: 新カルテのフローシートタブ → 隔離拘束タブ → 観察記録の入力 / 一覧 / 取消が動作
- [ ] **AC-8-1**: 隔離拘束歴ビューが正常表示（ep-08）

### ep-09 患者基本情報

- [ ] **AC-9-1**: 新カルテの「患者情報」タブ → 7 サブタブ（基本情報 / 属性 / 保険 / 連絡先 / 病名 / エピソード / メモ）切替動作
- [ ] **AC-9-2**: 編集 → 保存 / 未保存検知ダイアログ動作

### ep-10 看護実施（フローシート）

- [ ] **AC-10-1**: 新カルテのフローシートタブ → バイタル / IN-OUT / 観察 / 処置 / 看護記録 のいずれも正常表示
- [ ] **AC-10-2**: `/nursing/*` の独立ルート（フローシート / 部門記録簿 / 一括バイタル / 睡眠表 / 一括看護記録）も動作

### ep-15 外来 EMR 段階 1

- [ ] **AC-15-1**: `/outpatient` → 患者クリック → `/karte/:patientId`（outpatient mode）へ遷移
- [ ] **AC-15-2**: 外来 mode 配色が success（緑系）で表示
- [ ] **AC-15-3**: 看護過程タブが disabled + Tooltip 表示

### ep-16 外来 EMR 段階 2

- [ ] **AC-16-1**: 入院 mode で新カルテ表示 → 7 タブ（診療録 / フローシート / 指示簿 / 指示状況 / 看護過程 / 患者情報 / スケジュール）すべて表示
- [ ] **AC-16-2**: 患者ヘッダーに 8 ピクトグラム / 主治医 / 入院日 / 病名 / 隔離拘束バッジが表示
- [ ] **AC-16-3**: 診療情報パネル（7 サブタブ・固定高さ 140px）が表示
- [ ] **AC-16-4**: 生活歴タイムライン（5 行）が表示
- [ ] **AC-16-5**: 診療録タブの集約タイムライン（カテゴリ / タグ / 期間フィルタ）が動作
- [ ] **AC-16-6**: 指示簿 / 指示状況 / スケジュール各タブで P001〜P003 のデータが表示

### 撤去確認（段階 3 固有）

- [ ] **AC-X-1**: ブラウザで `/karte-alpha/P001` を直接入力 → `/` にリダイレクト（キャッチオール）
- [ ] **AC-X-2**: ソースツリーに `src/components/karteAlpha/` が存在しない
- [ ] **AC-X-3**: ソースツリーに `src/components/flowsheet/FlowsheetPage.tsx` が存在しない
- [ ] **AC-X-4**: ソースツリーに `src/components/karte/PatientHeader.tsx` 等の旧素材 5 件が存在しない

## 最終リグレッション結果（PM 受領後に追記）

- 確認日: __未__
- 結果: __未__
- 不具合検出時の対応: 軽微 → 即時修正 + 再目視 / 深刻 → 新規 us 起票 + 修正後再目視

## 関連 commit

- spec 起票: `73d3c67`
- us-39 完了: `4d1c8af`
- us-40 完了: `97937f6`
- HANDOVER + us-41 チェックリスト: 本コミット（後続）

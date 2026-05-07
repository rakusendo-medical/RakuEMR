# ep-16 外来 EMR 刷新・段階 2 — 改修一覧

## 対象

- 画面: `/karte/:patientId`（mode='inpatient' 本実装）、`/`（病棟マップ）、`/patients`（入院患者一覧）
- 実装:
  - `src/components/karte/KartePage.tsx`（mode='inpatient' 本実装・us-35）
  - `src/components/karte/KartePatientHeader.tsx`（mode Chip 拡張・us-35）
  - `src/components/karte/KarteActionBar.tsx`（入院 ActionBar の disabled 解除・us-36）
  - `src/components/karte/PatientInfoTab.tsx` + `patientInfo/AttributesSubview.tsx`（入院専用情報セクション本実装・us-35）
  - `src/components/karte/patientInfo/{BasicInfoSubview,MemoSubview}.tsx`（PM 判断 2 件反映・us-35）
  - `src/components/wardMap/*` / `src/components/patients/*`（state.from 付与・us-38）
  - 看護過程タブ統合（us-37・ep-12〜14 進捗依存）
- 参照 spec: [docs/specs/ep-16-outpatient-emr-stage2/](../specs/ep-16-outpatient-emr-stage2/)
- 段階 1 前提: [docs/specs/ep-15-outpatient-emr/_epic.md](../specs/ep-15-outpatient-emr/_epic.md)

## 決定事項（PM 合意済）

| # | 決定 | 合意日 | 影響範囲 |
| --- | --- | --- | --- |
| 1 | **預かり金セクションは外来・入院ともに非表示**（別システム連携でリンク／API 表示する想定）。現時点ではスタブコメントを残置 | 2026-05-06 | us-35 / `BasicInfoSubview` |
| 2 | **メモは複数残置するが、各メモに表示位置・スコープのラベルを付与**（例: 「カルテ画面トップに常時表示」「このタブのみ表示」） | 2026-05-06 | us-35 / `MemoSubview` |
| 3 | **us-36 は 1 us 単独 + 内部 3 サブタスク（A 入退院指示 / B 隔離拘束指示 / C 看護ケア記録）方式**。MASTER 高密度監督下で S2 が順次実装、各サブタスク完了で commit を区切る | 2026-05-06 | us-36 進め方 |
| 4 | **`/karte-alpha/:patientId` ルートは段階 2 中は温存**（直 URL アクセス用、段階 3 / ep-17 で撤去） | 2026-05-06 | 段階 2 のスコープ境界 |

## サマリ

| ストーリー | 状態 | 着手順 | 担当 |
| --- | --- | --- | --- |
| us-35 入院 mode 本実装 | 🟠 spec 起こし完了 / 着手指示済 | 1（クリティカルパス） | S3 |
| us-36 入院アクション本実装 | 🟠 spec 起こし完了 / 着手指示準備中 | 2（us-35 後・並列可） | S2（高密度 MASTER 監督） |
| us-37 看護過程タブ統合 | 🟡 spec 起こし完了（TBD あり）/ ep-12〜14 進捗依存 | 3（ep-12〜14 完了後） | 未アサイン（S2 か後発） |
| us-38 病棟マップ等の遷移元修正 | 🟠 spec 起こし完了 / 着手指示済 | 1（並列）| S4 |

凡例: 🟠 進行中 / 🟡 着手前提待ち

---

## Phase 0: KarteAlphaPage 機能インベントリ（MASTER / 2026-05-06）

us-36 着手前に MASTER が `KarteAlphaPage.tsx`（1117 行）を解析し、新カルテ画面 ActionBar への移植対象を整理した記録。

### 既存 KarteAlphaPage の入院系アクション 4 グループ

| グループ | 場所 | ボタン | 起動先 | 備考 |
| --- | --- | --- | --- | --- |
| **A** プレースホルダ | `ACTION_BUTTONS` 配列（L208-215） | オーダ送信／事後入力／看護ケア／オーダ入力／患者予約／記事作成 | onClick 未実装（プレースホルダ） | 「看護ケア」が us-36 看護ケア記録の前身候補 |
| **B** ep-03 入退院指示 | `Bottom Action Bar` 内（L480-501） | 入院指示／退院指示 | `AdmissionOrderDialog` / `DischargeOrderDialog`（既存） | 退院指示は `admissionState === 'inpatient'` のみ表示 |
| **C** 共通フッター | `Bottom Action Bar` 末尾（L503-508） | 印刷／終了 | onClick 未実装 | KartePage の `OUTPATIENT_ACTIONS` / `INPATIENT_ACTIONS` に既に存在（活性） |
| **D** ep-05 隔離拘束指示 | **ActionBar ではなく** 診療録カード（`MedicalRecordsDense`）のヘッダー右（L880-906） | `RestraintOrderLinks` コンポーネント（6/12 リンク・マスタトグルで切替） | `RestraintOrderDialog`（既存）を `onRequestRestraintOrder` prop で起動 | 隔離拘束指示は **ActionBar の外** にある点に注意 |

### 新カルテ KartePage の `INPATIENT_ACTIONS` との対応（段階 1 で枠だけ実装済）

| KartePage `id` | KartePage の状態（段階 1） | KarteAlphaPage の対応元 | 段階 2 で本実装する内容 |
| --- | --- | --- | --- |
| `admission-order` | disabled / Tooltip「段階 2 で実装予定」 | グループ B（入院指示・退院指示） | **us-36 サブ A**: 既存 `AdmissionOrderDialog` / `DischargeOrderDialog` を起動。1 ボタンか 2 ボタンかは spec で決定（spec で **1 ボタン「入退院指示」+ ダイアログ内 mode 切替** 案を採用） |
| `isolation-order` | disabled / Tooltip 同上 | グループ D（`RestraintOrderLinks`） | **us-36 サブ B**: ActionBar 経由で `RestraintOrderDialog` を起動。`RestraintOrderLinks` を診療録カードに残すかは設計判断（spec で **両方残す**: ActionBar はクイック起動、診療録カードは詳細選択） |
| `nursing-care` | disabled / Tooltip 同上 | グループ A の「看護ケア」（プレースホルダ） | **us-36 サブ C**: 新規ダイアログ起こし（または ep-10 看護記録系との重複確認）。spec で実装方針確定 |
| `order-input` | 既に活性（onClick 未実装） | グループ A の「オーダ入力」 | 段階 2 では **本 us スコープ外**（toast プレースホルダのまま）。本格実装は別エピック |
| `print` / `close` | 既に活性（onClick 未実装） | グループ C | 同上（段階 2 スコープ外） |

### 共有ファイル変更見込み（us-36 着手時）

| ファイル | 変更内容 | MASTER 合議 |
| --- | --- | --- |
| `src/components/karte/KartePage.tsx` | ActionBar の onAction ハンドラ実装、ダイアログ管理 state 追加 | 不要（karte/ 内） |
| `src/components/karte/KarteActionBar.tsx` | INPATIENT_ACTIONS の disabled 解除、Tooltip 削除 | 不要 |
| `src/components/admission/AdmissionOrderDialog.tsx`（既存） | 必要に応じて mode prop 追加 or 既存シグネチャ流用 | **要 MASTER 合議**（既存ダイアログ API 変更） |
| `src/components/admission/DischargeOrderDialog.tsx`（既存） | 同上 | **要 MASTER 合議** |
| `src/components/restraint/RestraintOrderDialog.tsx`（既存） | 起動経路追加に伴うシグネチャ調整 | **要 MASTER 合議** |
| 看護ケア記録ダイアログ（新規） | 新規実装 | 設計時に PM/MASTER 合意必要 |

### 「看護ケア記録」未確定論点

us-36 サブ C の前提整理:

1. ep-10（フローシート）の **看護記録**（NursingRecord）系と機能が重複しないか
2. 看護ケア記録は「**実施済の看護ケア**」を記録する想定か、「**指示**」か（業務的位置付け確認）
3. 既存ダイアログがあるなら流用、無ければ新規 spec 必要

**MASTER の暫定判断**: us-36 サブ C 着手時に S2 と PM が改めて要件詰める。spec では「**新規ダイアログ要件は着手時確定**」として TBD 残置。

---

## ストーリー別 gap

### us-35 入院 mode 本実装（🟠 spec 起こし完了）

S3 担当。spec: [`us-35-inpatient-mode.spec.md`](../specs/ep-16-outpatient-emr-stage2/us-35-inpatient-mode.spec.md)

#### 主要改修

- mode='inpatient' のテーマ・タブ可視・「入院」Chip 本実装（段階 1 枠 → 補追）
- 属性サブタブの入院専用情報セクション本実装
- PM 判断 2 件の反映（預かり金非表示・メモ表示位置ラベル）

詳細は spec 参照。

### us-36 入院アクション本実装（🟠 spec 起こし完了）

S2 担当（MASTER 高密度監督）。spec: [`us-36-inpatient-actions.spec.md`](../specs/ep-16-outpatient-emr-stage2/us-36-inpatient-actions.spec.md)

内部 3 サブタスク。Phase 0 インベントリを前提として詳細は spec 参照。

### us-37 看護過程タブ統合（🟡 ep-12〜14 進捗依存）

担当未アサイン。spec: [`us-37-nursing-process-tab.spec.md`](../specs/ep-16-outpatient-emr-stage2/us-37-nursing-process-tab.spec.md)

ep-12〜14 が「mock 改修フェーズ 2」を完了するまで待機。spec の AC のうち ep-12〜14 統合 API に依存する部分は **TBD** で残置。

### us-38 病棟マップ等の遷移元修正（🟠 spec 起こし完了）

S4 担当。spec: [`us-38-navigation-state-from.spec.md`](../specs/ep-16-outpatient-emr-stage2/us-38-navigation-state-from.spec.md)

軽量タスク。詳細は spec 参照。

---

## 残課題（段階 2 で扱わない）

- `KarteAlphaPage.tsx` 撤去 → 段階 3 / ep-17
- `/karte-alpha/:patientId` ルート撤去 → 同上
- 旧 `src/components/karte/` 素材整理 → 同上
- マスタ管理画面の刷新 → 別エピック
- `ACTION_BUTTONS` 配列の「オーダ送信」「事後入力」「記事作成」「患者予約」本実装 → 別エピック（オーダ管理／カルテ整備）

---

## 並行運用の注意

段階 1 で 2 回の commit 巻き込み事故が発生した（commit `30151eb` の S2/S4 巻き込み・既知）。段階 2 では以下を徹底:

- **`git add <ファイル名>` を明示**（`.` や `-A` は禁止）
- **`git add` 直後に `git diff --cached --stat` で範囲確認** が必須
- 詳細は `.claude/briefings/common.md` §3 参照

並列着手の編集域分離:

- **us-35（S3）**: `src/components/karte/` 配下に閉じる
- **us-36（S2）**: `src/components/karte/` + 既存ダイアログ（admission/, restraint/）
- **us-38（S4）**: `src/components/wardMap/` + `src/components/patients/`
- **us-35 と us-38 は完全分離**で衝突リスク低
- **us-35 と us-36 は同一ディレクトリで衝突リスク中**: us-35 完了後に us-36 着手が安全

---

## us-35 入院 mode 本実装 完了メモ（S3 / 2026-05-06）

### 実装サマリ

着手順序 [Phase 1] の us-35「入院 mode 本実装」を実装完了。`npx tsc --noEmit` / `npx vite build` クリーン。ブラウザ目視は MASTER 段階 2 統合確認時に依頼。

#### 段階 1 で確立済（変更不要・本 us は確認のみ）

- **`KartePage.tsx`**: `textColor={mode === 'outpatient' ? 'inherit' : 'primary'}` で mode 連動テーマ（AC-3）。`disabledIn: ['outpatient']` で `mode='inpatient'` のとき看護過程タブ活性（AC-2）
- **`KartePatientHeader.tsx`**: `<Chip color="primary" label="入院" />`（mode='inpatient' 時）+ 病棟・病室併記 `[patient.wardName, patient.roomNumber].filter(Boolean).join(' / ')`（AC-1）

→ いずれも段階 1（ep-15 us-33）で完成済のため、本 us では **コード変更なし**。動作確認のみ。

#### 本 us での実装

- **`patientInfo/AttributesSubview.tsx`**: 入院専用情報セクションを本実装
  - 段階 1 では「入院日・病棟・病室」の 3 フィールド（read-only、注記「枠のみ」）
  - 段階 2 で **「受け持ち看護師」を追加して 4 フィールド構成**（既存 `Patient.{admitDate, wardId → wardLabel, roomNumber, nurse}` から read-only 表示）
  - Grid レイアウトを md=4（3 列）→ md=3（4 列均等）に変更
  - caption を「段階 1 では枠のみ」→「既存 Patient フィールドから read-only 表示。担当看護師の編集 UI（複数割当・受け持ち変更履歴 等）は将来拡張予定」に書き換え
  - mode='outpatient' では非表示（既存条件 `mode === 'inpatient'` 維持）
- **`patientInfo/BasicInfoSubview.tsx`**: 預かり金セクション削除（PM 判断 #1 反映）
  - Paper ブロック全体を削除し、コードコメントで「ep-16 us-35 で非表示化、別システム連携で復活予定」を明示
  - `BasicForm.depositManaged` / `depositMemo` の state は **連携時の復活を見越して温存**（INITIAL_FORM の値も維持）。dirty 検出に影響なし
  - 同ファイル「基本情報メモ（補足）」の見出しに **`<Chip label="このタブのみ表示" variant="outlined" size="small">`** を追加（PM 判断 #2 反映）
  - placeholder を「自由記述」→「基本情報サブタブの中だけで参照する補足メモ。長文の運用メモはメモサブタブに記載。」に書き換え
- **`patientInfo/MemoSubview.tsx`**: 表示位置ラベル付与（PM 判断 #2 反映）
  - 「患者メモ」見出しに **`<Chip label="このタブのみ表示" variant="outlined" size="small">`** + caption「運用上の長文自由メモ（基本情報サブタブの『基本情報メモ（補足）』とは用途を分ける）」を追加
  - 末尾 caption を「表示位置: 患者情報タブ &gt; メモサブタブ。カルテ画面トップに常時表示する運用は将来拡張（現在は本タブ内のみ）」に書き換え（spec AC-6 例「カルテ画面トップに常時表示」への将来拡張余地を明示）

### AC 充足状況

| AC | 状態 | 備考 |
| --- | --- | --- |
| AC-1 「入院」Chip + 病棟・病室併記 | ✅ | 段階 1 で実装済（KartePatientHeader）。本 us は確認のみ |
| AC-2 看護過程タブ活性化（mode='inpatient'） | ✅ | 段階 1 で実装済（KartePage の `disabledIn: ['outpatient']`）。本 us は確認のみ |
| AC-3 テーマ primary（mode='inpatient'） | ✅ | 段階 1 で実装済（KartePage の `textColor`）。本 us は確認のみ |
| AC-4 属性サブタブの入院専用情報セクション本実装 | ✅ | 受け持ち看護師フィールドを追加して 4 フィールド構成。read-only 表示 |
| AC-5 預かり金セクション非表示（PM 判断 #1） | ✅ | Paper ブロック削除 + スタブコメント残置 |
| AC-6 メモサブタブの表示位置ラベル（PM 判断 #2） | ✅ | 基本情報メモ・患者メモ両方に Chip「このタブのみ表示」付与 |
| AC-7 design-rules §12 準拠 | ✅ | §12.1（mode 判定）／§12.2（テーマ色）／§12.3（識別 Chip）／§12.4（タブ可視性）すべて段階 1 確立済の延長 |

### 設計判断（暫定）

| # | 判断 | 妥当性 |
| --- | --- | --- |
| 1 | 預かり金 state（`depositManaged` / `depositMemo`）は **削除せず温存**（コードコメントで明示） | 別システム連携で復活する想定。state スキーマを残しておくと復活時の差分が小さい |
| 2 | 表示位置ラベルは **両方とも「このタブのみ表示」** | spec AC-6 例「カルテ画面トップに常時表示」は将来拡張余地として末尾 caption に明示。現状実装ではどちらも該当タブに閉じる |
| 3 | 入院専用情報の Grid を md=4（3 列）→ md=3（4 列）に変更 | フィールド数増加（3 → 4）に伴う均等配置 |
| 4 | KartePage / KartePatientHeader の **コード変更なし**（確認のみ） | 段階 1 で完成済。本 us スコープ「画面表示・テーマ・属性表示」と整合 |

### MASTER への申し送り

- ブラウザ目視は本セッションでは未実施 → **段階 2 統合確認時に MASTER に依頼**
- 預かり金セクションの「別システム連携」具体仕様は将来エピック扱い（HANDOVER 起票なし、コードコメントのみ）
- 「カルテ画面トップに常時表示」のメモ運用は将来要件として保留（現状はメモサブタブ内 only）
- KarteAlphaPage との機能等価検証は MASTER の Phase 0 / Phase 3 担当範囲

### 共有ファイル変更

なし（types / store / mockData の `MASTER_*` / common 触らず）。`src/components/karte/patientInfo/` 配下に閉じる変更のみ。

### 検証

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン（既存と同程度の bundle サイズ）
- ブラウザ目視: 未実施 → MASTER 段階 2 統合確認時に依頼

---

## us-38 病棟マップ等の遷移元修正 完了メモ（S4 / 2026-05-07）

### 実装サマリ

着手順序 [Phase 2b]「病棟マップ・入院患者一覧から /karte/:patientId への遷移先切替 + state.from 付与」を実装完了。tsc / vite build クリーン。

- `src/components/wardMap/WardMap.tsx` (L77 `navigateToKarte`):
  - `navigate(`/karte-alpha/${patientId}`)` → `navigate(`/karte/${patientId}`, { state: { from: 'ward-map' } satisfies KartePageLocationState })`
  - 冒頭に `import type { KartePageLocationState } from '../karte/KartePage';` を追加
- `src/components/patientList/PatientList.tsx` (L158 `navigateToKarte`):
  - 同様に `/karte-alpha/...` → `/karte/...` + `state: { from: 'patient-list' }` 添付
  - 冒頭に同型を import

ep-15 us-32（`OutpatientList.tsx`）で確立した呼び出し側パターン（`satisfies KartePageLocationState` 付き）を踏襲。

### AC 充足状況

| AC | 状態 | 備考 |
| --- | --- | --- |
| AC-1 病棟マップから新カルテ画面に遷移 | ✅ | `state.from='ward-map'` を確認可 |
| AC-2 入院患者一覧から新カルテ画面に遷移 | ✅ | `state.from='patient-list'` を確認可 |
| AC-3 mode='inpatient' で動作 | ✅ | `KartePage` の優先順序 3（`state.from` ベース）で確定。フォールバック不要 |
| AC-4 戻り先判定が新ルートで動作 | ✅ | `KartePage` 内部で同 state を参照（既実装） |
| AC-5 `/karte-alpha/:patientId` 経路温存 | ✅ | `routes/index.tsx` 変更なし、ルート定義は段階 2 中保持 |
| AC-6 既存 `/karte-alpha` 経路リグレッションなし | ✅ | spec の「それ以外（管理画面など）: 触らない」原則に従い `patientMain/`、`isolation/`、`karteAlpha/` 内部、`admission/AdmissionScheduleCalendar.tsx` は温存 |

### スコープ外（温存判断）

`grep -rn "navigate.*karte-alpha" src/` で 6 箇所列挙、修正対象を 2 箇所に絞込。残り 4 箇所は段階 3（ep-17）で扱う:

- `src/components/patientMain/PatientMain.tsx:129` — 「カルテ(α)を開く」ボタン（α 版意図的なデバッグ用）
- `src/components/isolation/IsolationRestraint.tsx:270` — 隔離拘束一覧画面の遷移（管理系）
- `src/components/karteAlpha/KarteAlphaPage.tsx:258` — KarteAlphaPage 内部の前後ナビ
- `src/components/admission/AdmissionScheduleCalendar.tsx:90` — 入退院手続き配下の管理画面

### 並行干渉の経緯（記録）

実装本体は **MASTER のコミット `cfc0e83`（Phase 0 完了）に並行編集で巻き込まれて push 済**。S4 が編集中に MASTER がコミットしたタイミングで `WardMap.tsx` / `PatientList.tsx` の差分が `cfc0e83` に取り込まれた（MASTER のコミットメッセージは Phase 0 だが実態には us-38 実装も含む）。

その後 S4 自身のコミット `9ba5894`（メッセージ「feat(ep-16/us-38)」）には実装本体が含まれず、代わりに HANDOVER + ep-16 changes ファイル新設 + S3 の patientInfo 3 ファイル（`AttributesSubview` / `BasicInfoSubview` / `MemoSubview`）が混入した。MASTER が `3f55277` でフォロー（未 push の us-36/37 spec を push、HANDOVER に干渉事例追記）。

これは段階 1 で 2 度発生した同パターン（FS 共有による index 巻き込み）の 3 例目。本セッションでは **stash 戦略**（HANDOVER 編集前に S3 の未コミット変更を `git stash` で退避）を試みたが、`git add <file>` 時点で他セッションのインデックス取り込みが発生する根本問題は防げなかった。

### 共有ファイル変更

なし（`types` / `store` / `mockData` の `MASTER_*` / `common` / `routes` 触らず）。`src/components/wardMap/` と `src/components/patientList/` 内に閉じる変更のみ（各 1 ファイル、+5/-1 行）。

### 検証

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン
- ブラウザ目視: 未実施 → MASTER 段階 2 統合確認時に依頼

---

## us-43 診療録タブ実装 完了メモ（MASTER / 2026-05-07）

### 経緯

PM フィードバック「Alpha では各部門の診療録やオーダーが全てタイムライン形式で集約されていた、その部分は大きく変更が必要」を踏まえ、KartePage の `medical-record` タブのプレースホルダを置換。

### 実装サマリ

新規ファイル: `src/components/karte/MedicalRecordTab.tsx`（約 380 行）

**集約タイムライン**（PM 強調点）:

- KarteAlphaPage の `MOCK_RECORDS` から代表 10 エントリを内部に保持（4 カテゴリ: 医師記録 / 看護記録 / 看護サマリ / 入退院記録）
- `mockData.ts` の `ORDERS` を `patient.id` でフィルタしてオーダー型タイムラインレコードに変換（カテゴリ「オーダー」・色 `#0891b2`）
- 統合後 `timestamp` 降順ソート → カテゴリ Chip + 著者 + ロール + タイムスタンプ + orderNumber + tags + 本文（100 字超は「展開」可）
- カテゴリフィルタ Chip 6 種 + 件数表示
- スクロール可能（max-height 360px）

**新規 SOAP 記載（折りたたみ可）**:

- 4 セクション TextField（S/O/A/P・各 multiline・helper 付き）
- テンプレート選択 4 種（初診 / 再診 / 経過観察 / カンファ）+ 「テンプレート挿入」
- dirty 検出は 4 値の OR → `onDirtyChange` で KartePage に上げる
- 添付ファイルエリア + 描画ツールエリア（家系図 / シェーマ・プレースホルダダイアログ）

**診療録専用アクションバー**（sticky bottom・8 ボタン）:

- 保存（mock snackbar・SOAP リセット）／診察終了／閉じる／予約登録（プレースホルダ）／印刷（`window.print()`）／添付（mock）／家系図／シェーマ
- 保存ボタンは mode に応じて `success`（外来）/`primary`（入院）色

**KartePage 統合**:

- `medicalRecordDirty` state + `onMedicalRecordDirty` callback 追加
- `attemptTabChange` / `handleBack` / `handleConfirmDiscard` を双方 dirty の OR 評価に拡張
- `KarteTabContent` の `medical-record` 分岐を `<MedicalRecordTab />` に差替（meta プレースホルダから移動）
- `onOpenOrdersTab = () => attemptTabChange('orders')` を渡し、「指示簿タブを開く」が us-33 AC-10 ハッシュ仕様準拠で動作

**プレースホルダ範囲**（別ストーリー予定）:

- Fabric.js キャンバス描画（家系図 / シェーマ）
- ファイルアップロード実機能
- リビジョン管理（履歴アイコン → snackbar）
- ORCA 連携 / 実 API 永続化
- 予約登録ダイアログ

### AC 充足

- [x] AC-1 過去カルテエリア（フィルタ Chip + 集約タイムライン + 件数表示）
- [x] AC-2 SOAP 4 セクション
- [x] AC-3 テンプレート選択 + 挿入
- [x] AC-4 添付ファイル mock（snackbar）
- [x] AC-5 家系図 / シェーマ プレースホルダダイアログ
- [x] AC-6 アクションバー 8 ボタン
- [x] AC-7 未保存検知が KartePage 共通フローに統合（patient-info と同型・OR 評価）
- [x] AC-8 「指示簿タブを開く」→ `attemptTabChange('orders')` で URL ハッシュも更新
- [x] AC-9 design-rules §3 / §6 / §10 / §11 / §12 準拠

### 共有ファイル変更

- `src/components/karte/KartePage.tsx`: 1 ファイル更新（medical-record 分岐差替 + dirty 双方評価 + onOpenOrdersTab 配線）
- `src/components/karte/MedicalRecordTab.tsx`: 新規
- `src/types/index.ts` / `src/stores/useAppStore.ts` / `src/data/mockData.ts` の `MASTER_*` / `src/components/common/`: 触らず

### 検証（us-43）

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン
- dev server 上で HMR 反映確認 → ブラウザ目視は PM に依頼

### 設計判断（暫定・MASTER 単独実装は PM 判断による例外）

| # | 判断 | 妥当性 |
| --- | --- | --- |
| 1 | MOCK_RECORDS は MedicalRecordTab.tsx 内にインライン | 患者横断の固定サンプル、データソース統合は段階 3 で再整理。共有ファイル変更を回避 |
| 2 | オーダーをタイムラインに統合（カテゴリ「オーダー」追加） | PM 強調点に直接対応 |
| 3 | 隔離拘束指示リンク群（`RestraintOrderLinks`）は本 us では埋込まず | us-36 サブ B との編集域重複回避。サブ B 着手時に MASTER で結合 |
| 4 | テンプレート 4 種はハードコード | gairai `useFetchTemplateEntrySetsQuery()` 相当は段階 3 で API 化想定 |
| 5 | 過去カルテのページングは scroll で代用 | 「最初へ ▲」「続き ▼」相当は段階 3（API 連携時に詰める） |

---

## us-50 指示簿タブ実装 完了メモ（S3 / 2026-05-07）

### 実装サマリ

KartePage の `orders` タブ（段階 1 では meta プレースホルダ）を、患者別 ORDERS の read-only 一覧に置き換えた。`npx tsc --noEmit` / `npx vite build` クリーン。ブラウザ目視は MASTER 段階 2 統合確認時に依頼。

#### 新規ファイル

- **`src/components/karte/OrdersTab.tsx`**（約 215 行）
  - `ORDERS.filter((o) => o.patientId === patient.id)` で抽出（AC-1）
  - type Chip 8 種（全て + 7 OrderType・AND 条件）／ status Chip 6 種（全て + 5 OrderStatus・AND 条件）（AC-2/3）
  - MUI `Table` size="small"・dense 表示で 6 列（種別 / 内容 / スケジュール / 状態 / 期間 / 担当医）（AC-4）
  - 上部右に「指示状況タブを開く」ボタン（`LaunchIcon` + `onOpenOrderStatusTab` callback）（AC-5）
  - 件数表示 + フィルタ後 ≠ 全件のとき「（全 X 件中）」併記（AC-6）
  - 0 件時: 患者にオーダーゼロ／フィルタ該当ゼロを別文言で表示（AC-7）
  - mode 別アクセント: `accent`（`success`/`primary`）を SectionHeader 背景・フィルタ Chip 選択色・「指示状況タブを開く」ボタン色に反映（AC-8 / design-rules §12）
  - type Chip カラーは既存 `OrderManagement.tsx` の `ORDER_TYPE_COLORS` を踏襲（処方=青 / 注射=ピンク / 心理検査・ECT=黄 / 入院定時=緑 / IF=紺 / 文字=灰）
  - OrderType 値「文字」→ 表示ラベル「テキスト」変換は既存 `MedicalRecordTab.ORDER_TYPE_DESCRIPTION` 規約と同一（spec の Chip ラベル「テキスト」と整合）

#### 既存改修

- **`src/components/karte/KartePage.tsx`**:
  - `OrdersTab` import 追加
  - `KarteTabContent` の prop に `onOpenOrderStatusTab: () => void` を追加し、KartePage 本体から `() => attemptTabChange('order-status')` を渡す（us-33 AC-10 ハッシュ仕様準拠で URL ハッシュも揃う）
  - `tabId === 'orders'` 分岐を `<OrdersTab patient mode onOpenOrderStatusTab />` 埋込に置換
  - `meta` プレースホルダから `orders` エントリを削除（残: `order-status` / `care-plan` / `schedule`）

### AC 充足状況

| AC | 状態 | 備考 |
| --- | --- | --- |
| AC-1 患者別オーダ一覧（`patientId` フィルタ） | ✅ | `useMemo` でフィルタ |
| AC-2 type フィルタ Chip 8 種 | ✅ | OrderType 7 種 + 全て |
| AC-3 status フィルタ Chip 6 種 | ✅ | OrderStatus 5 種 + 全て |
| AC-4 行表示（type Chip / 内容 / スケジュール / 状態 Chip / 期間 / 担当医） | ✅ | dense Table 形式 |
| AC-5 「指示状況タブを開く」 → `commitTab('order-status')` | ✅ | KartePage 経由で `attemptTabChange('order-status')`（URL ハッシュ更新含む） |
| AC-6 件数表示 | ✅ | フィルタ後件数 + 全件併記 |
| AC-7 0 件時の空状態 | ✅ | 患者ゼロ／フィルタ該当ゼロで別文言 |
| AC-8 design-rules §3 / §6 / §12 準拠 | ✅ | §3 ボタン階層・§6 dense Table・§12 mode 別アクセント |

### 設計判断

| # | 判断 | 妥当性 |
| --- | --- | --- |
| 1 | type Chip ラベル「文字」→「テキスト」変換（OrderType 値はコード上「文字」のまま） | 既存 `MedicalRecordTab.ORDER_TYPE_DESCRIPTION` 規約踏襲。spec 画面要素「テキスト」表記とも整合 |
| 2 | type Chip 配色は既存 `OrderManagement.tsx` の `ORDER_TYPE_COLORS` を踏襲（インライン定義） | 共有ファイル化は段階 3 で集約予定。本 us では編集域を `karte/` 内に閉じる |
| 3 | テーブル風で実装（カード風は不採用） | 既存 `OrderManagement.tsx` のパターンと整合。dense 表示で件数増加にも対応しやすい |
| 4 | 期間表示: `days > 0` のとき `startDate〜（X日）`、`days <= 0` で `startDate〜（継続）` | 既存 `OrderManagement.tsx` は「日数」列で `'—'` 表記。本 us では「期間」1 列に統合し、無期限オーダ（IF / 文字）の業務的意味（継続）を明示 |
| 5 | sort は `startDate` 降順（spec「新しい順」） | `confirmedAt` は未設定エントリが多いため `startDate` 基準。仕様の「新しい順」を満たす |
| 6 | mode 別アクセントは `accent: 'success' \| 'primary'` 1 トークンに集約し、SectionHeader 背景 / フィルタ Chip 選択色 / Launch ボタンに反映 | design-rules §12.3 のテーマ色割当に整合。タブバー本体は既定 primary 維持（§12.3） |

### 並行衝突状況

- **`KartePage.tsx` 編集域**: `KarteTabContent` 関数の prop 拡張（`onOpenOrderStatusTab` 追加）+ `tabId === 'orders'` 分岐追加 + `meta` から `orders` 削除。S4（us-51）は同関数の `tabId === 'order-status'` 分岐 + `meta` から `order-status` 削除を行う見込みで **編集行が隣接する**。本セッションでは `add → 確認 → commit → push` を短時間で閉じる方針
- **新規ファイル `OrdersTab.tsx`**: 単独所有（衝突なし）

### 共有ファイル変更

なし（`types` / `store` / `mockData.MASTER_*` / `common` 触らず）。`SectionHeader` は既存共通コンポーネントを **import only** で利用（API 変更なし）。`src/components/karte/` 内に閉じる変更のみ（新規 1 + 既存 1 ファイル）。

### 検証

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン（bundle 1505 kB / gzip 429 kB・既存と同程度）
- ブラウザ目視: 未実施 → MASTER 段階 2 統合確認時に依頼

### MASTER への申し送り

- ブラウザ目視は本セッションでは未実施 → 段階 2 統合確認時に MASTER に依頼
- 「新規指示作成・編集 / ステータス更新」「看護用オーダ（一括バイタル等）」は本 us スコープ外（spec 補足どおり別エピック）
- ORDERS の各患者件数が薄い（多くの患者で 0〜1 件）ため、ブラウザ目視時は P001（山田 太郎）/ P003（鈴木 一郎）あたりで確認すると Chip フィルタ・テーブル表示・「指示状況タブを開く」遷移が一通り見える
- type Chip 配色のうち「心理検査」と「ECT」が同色（黄系）。spec の意図不明瞭のため既存 `OrderManagement.tsx` を踏襲。視認性改善は将来検討（共有化と合わせて）
## us-51 指示状況タブ実装 完了メモ（S4・2026-05-07）

spec: [us-51-order-status-tab.spec.md](../specs/ep-16-outpatient-emr-stage2/us-51-order-status-tab.spec.md)

### 実装内容

`src/components/karte/OrderStatusTab.tsx`（新規）+ `KartePage.tsx` の `KarteTabContent` 分岐差替で、新カルテ画面 `/karte/:patientId#order-status` の「指示状況」タブを read-only で実装。

#### 新規: `OrderStatusTab.tsx`

- props: `{ patient: Patient; mode: KarteMode; onOpenOrdersTab: () => void }`
- 状態: `statusFilter: OrderStatus | 'all'`、`period: 'today' | 'week' | 'all'`（既定 `week`）
- データ: `ORDERS.filter((o) => o.patientId === patient.id)`、受け持ち看護師は `Patient.nurse` を参照（未設定時 `—` フォールバック）

#### 変更: `KartePage.tsx`

- `import OrderStatusTab from './OrderStatusTab';` を追加
- `KarteTabContent` 内に `if (tabId === 'order-status') return <OrderStatusTab ... />;` 分岐を追加
- meta テーブルから `'order-status'` プレースホルダエントリを削除

### AC 充足

- [x] AC-1 ステータス別件数サマリ Chip（5 ステータス、件数 0 は outlined / >0 は filled で密度差表現）
- [x] AC-2 ステータスフィルタ Chip 6 種（`全て` + 5 OrderStatus、active 時のみ filled + 該当色）
- [x] AC-3 期間切替（今日 / 今週 / 全期間、`ToggleButtonGroup` 既定 `week`、color は §12 mode 連動）
- [x] AC-4 行表示: ステータス Chip / type Chip / 内容（noWrap + ellipsis） / 担当医 / 受け持ち看護師 / 期間（`startDate` + `days` から導出 / `days <= 1` は単発で開始日のみ）
- [x] AC-5 未対応マーカー: 「指示済」「予定」のみ右端 `<CircleIcon fontSize=10 color=warning>` を `aria-label="未対応"` 付与
- [x] AC-6 「指示簿タブを開く」ボタン: `onOpenOrdersTab` 経由で `attemptTabChange('orders')`（spec の `commitTab('orders')` と同等、既存 `MedicalRecordTab` と同一配線）
- [x] AC-7 0 件空状態: 「該当する指示はありません（{期間} / {ステータス}）」メッセージ表示
- [x] AC-8 design-rules 準拠（§3 ボタン MUI 標準 / §6 行密度 dense / §7.1 Chip 色対応 + §7.2 size="small" / §12.3 業務ステータス色を mode より優先）

### 共有ファイル変更（us-51）

- `src/components/karte/OrderStatusTab.tsx`: 新規
- `src/components/karte/KartePage.tsx`: 1 ファイル更新（import 1 行 + 分岐 1 ブロック追加 + meta から `order-status` 削除）
- `src/types/index.ts` / `src/stores/useAppStore.ts` / `src/data/mockData.ts` の `MASTER_*` / `src/components/common/`: **触らず**

### 検証（us-51）

- `npx tsc --noEmit`: クリーン
- `npx vite build`: 成功（chunk size 警告は既存・本変更と無関係）
- ブラウザ目視は MASTER 段階 2 統合確認時に依頼

### 設計判断（us-51）

| # | 判断 | 妥当性 |
| --- | --- | --- |
| 1 | OrderStatus → 色対応は info / primary / warning / default / success（§7.1 準拠） | 「指示済」を info に割当、§12.3 末尾「§7.1 Chip 色は mode より優先」に従う |
| 2 | 「期間」は `startDate` + `days` から導出（`days <= 1` は単発） | Order 型に endDate がないため。spec L31「実施予定 or 実施完了日」は mock では具体日付がないので開始期間表示で代替 |
| 3 | 「今日」「今週」は `startDate` 基準 | mock 既存データは 2026-02 の startDate のため、現在日（2026-05）から見ると今日・今週は 0 件想定（空状態 AC-7 のテストにもなる） |
| 4 | フィルタ「全て」アクティブ時の色は mode 連動（outpatient=success / inpatient=primary）、各 status Chip アクティブ時は §7.1 の業務色を維持 | spec L34 mode 別配色 + §12.3 末尾の優先関係に整合 |
| 5 | 件数表示: 「表示 N 件 / 期間内 M 件 / 全 K 件」の 3 段階 | フィルタ作用度合いを把握しやすくするため。spec L33「件数表示」を強化解釈 |

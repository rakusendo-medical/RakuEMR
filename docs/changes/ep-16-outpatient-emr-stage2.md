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

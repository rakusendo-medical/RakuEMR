# ep-15 外来 EMR 刷新 — 改修一覧

## 対象

- 画面: `/outpatient`、`/karte/:patientId`（段階 1 から最終形を先行採用）、`/outpatient/:patientId/basic`（段階 1 で吸収予定）
- 実装:
  - `src/components/outpatient/OutpatientList.tsx`（既実装）
  - `src/components/outpatient/PatientBasicPage.tsx`（既実装。us-34「基本情報」サブビューに転用予定）
  - `src/components/karteOutpatient/OutpatientKartePage.tsx`（既実装。段階 1 終了時に撤去）
  - `src/components/karte/`（既存素材: `KartePage.tsx` / `ActionBar.tsx` / `LifeTimeline.tsx` / `MedicalInfo.tsx` / `MedicalRecords.tsx` / `PatientHeader.tsx` — **素材として活用方針**。design-rules v1.1 適合可否で個別判断）
- 参照 spec: [docs/specs/ep-15-outpatient-emr/](../specs/ep-15-outpatient-emr/)

## 決定事項（PM 合意済）

| # | 決定 | 合意日 | 影響範囲 |
| --- | --- | --- | --- |
| 1 | **URL は段階 1 から最終形 `/karte/:patientId` を先行採用**。`/karte-outpatient/:patientId` は新規実装せず | 2026-05-06 | us-33 ルート、us-32 遷移先 |
| 2 | **既存 `src/components/karte/` 素材は活用方針**。design-rules v1.1 適合可否は MASTER がデザイン面で個別判断 | 2026-05-06 | us-33 実装方針 |
| 3 | **段階 1 終了時に `OutpatientKartePage` 即撤去**（commit `30151eb` で実施済） | 2026-05-06 | 段階 1 の終わり方 |
| 4 | **看護過程タブは段階 1 では「タブ枠だけ」**。中身は ep-12〜14 / 段階 2 で別途 | 2026-05-06 | us-33 スコープ |
| 5 | **`/outpatient/:patientId/basic` は互換リダイレクト** → `/karte/:patientId#patient-info`（commit `30151eb` で実施済）。`PatientBasicPage.tsx` 本体は削除済（機能は `BasicInfoSubview` に継承） | 2026-05-06 | us-34 ルート整理 |

## サマリ

| ストーリー | 改修前 AC | 想定後 AC | 状態 |
| --- | --- | --- | --- |
| us-32 外来一覧 | 7/8 | 8/8 | 🟢 微修正中心（仕上げ） |
| us-33 カルテ画面（タブ式 TOP・mode 切替） | 1/9 | 9/9 | 🟠 構造再設計（骨組みから） |
| us-34 患者情報サブタブ | 1/8 | 8/8 | 🟠 構造再構成（独立ページ → タブ内サブビュー化） |

凡例: 🟢 仕上げ系 / 🟠 構造変更を伴う

## 既実装の現状（棚卸し結果サマリ）

| 領域 | 既実装 | 主な特徴 |
| --- | --- | --- |
| 外来一覧 | `OutpatientList.tsx` | フィルタタブ・ステータス Chip（icon 併用）・選択ベースアクションバー・確認ダイアログ ほぼ全 AC 充足 |
| 外来カルテ | `OutpatientKartePage.tsx` | 6 タブ（看護過程欠落）、テーマ色 hardcode（#2e7d32）、`Patient.admissionState` 未参照、戻り先 `/outpatient` 固定 |
| 患者基本情報 | `PatientBasicPage.tsx` | 独立ページ（`/outpatient/:patientId/basic`）、TriStateField／ChipInput／未保存検知 完備 |
| 既存素材 | `karte/*` | 細粒度コンポーネント群。位置付け不明確（PM 確認事項 #2） |
| design-rules.md | §11「未保存検知」既存 | ep-15 で参照する mode 切替パターンは **§12 として新設予定**（既存 §11 は変更しない） |

## 段階的実装方針

### 段階 1（本ラウンド・主スコープ）

外来 mode のみで新カルテ画面コンポーネントを確立する。`mode='inpatient'` の振る舞いは **タブの活性切替・テーマ切替の枠だけ**を実装し、入院機能本体は段階 2 で移植する。

### 段階 2（後続ラウンド・本エピック対象外）

`mode='inpatient'` を本実装。`KarteAlphaPage` の機能を新カルテ画面へ段階移植。ep-01〜10 のリグレッション確認。

### 段階 3（後続ラウンド・本エピック対象外）

`/karte-alpha` を新カルテ画面に置換。`KarteAlphaPage` 撤去。

---

## 段階 1 の着手順序

```text
[1] design-rules.md §12 新設（mode 切替パターンの言語化）
        │
        ▼
[2] us-33 骨組み: 新カルテ画面コンポーネント KartePage（仮）
    - 7 タブ枠 + mode prop + テーマ切替 + グレーアウト+Tooltip
    - mode 判定ロジック（遷移元優先 → admissionState）
    - 戻る先判定（navigationSource 踏襲）
        │
        ▼ （骨組み合意・mode prop API 確定）
        ├─▶ [3] us-32 仕上げ（OutpatientList の AC-7 遷移先確認等）
        └─▶ [4] us-34 患者情報サブタブ（PatientBasicPage を「基本情報」サブビューに転用）
        │
        ▼
[5] 統合確認: 外来一覧 → カルテ → 患者情報 → 戻る の動線目視
```

`[2]` が共有度最大のクリティカルパス。`[3]` `[4]` は `[2]` 合意後に並列化可能。

---

## ストーリー別 gap

### us-32 外来一覧（🟢 仕上げ）

#### 既実装で充足している AC

- AC-1〜AC-6, AC-8 ほぼ全て充足（OutpatientList が design-rules v1.1 で実装済）

#### 改修必要

- **AC-7 ダブルクリック遷移**: 遷移先を `/karte/:patientId` に切替（既存実装が `/karte-outpatient/:patientId` の場合）。

#### 既存ファイル更新

- `src/components/outpatient/OutpatientList.tsx`
  - ダブルクリック / 「カルテ」ボタンの遷移先を `/karte/:patientId` に統一

#### 新規ファイル

- なし

#### 実装後メモ（S4 / 2026-05-06）

**コミット**: `a7c1398` (URL 切替 + コメント追従) → `2db9346` (state.from 必須対応)

**実施内容**:

1. **URL 切替**（`a7c1398`）
   - L117 「カルテ」ボタン (`handleOpenDashboard`) と L332 ダブルクリック の `navigate` 先を `/karte-outpatient/:patientId` → `/karte/:patientId` に統一
   - 冒頭コメントの design-rules 参照を `§12.5 色覚配慮` → `§13.5 色覚配慮` に追従更新（§12 リナンバー案 B 反映）

2. **state.from 添付**（`2db9346`）
   - 初回コミットで漏れていた `state: { from: 'outpatient-list' }` を両遷移箇所に追加
   - `KartePageLocationState` 型を `../karte/KartePage` から import
   - `navigateTo` シグネチャを `(path, state?)` に拡張し、state があれば `navigate(path, { state })` で渡す形に
   - これで `KartePage` の mode 判定が一次ソース（`location.state.from === 'outpatient-list'` → `outpatient`）で確定。フォールバックの `admissionState` 判定に頼らずに済む
   - 戻り先判定も同 state を参照するため、「一覧に戻る」が正しく `/outpatient` に戻れる

**検証**: `npx tsc --noEmit` + `npx vite build` 両方クリーン（環境メモ: 既定シェルの Node が v12 だったため `nvm use --lts` で v24 に切替えて実行）

**共有ファイル**: 変更なし（types / store / mockData / routes に手を入れず完了）

**ブラウザ目視**: S4 セッションでは未実施。MASTER 段階 1 統合確認時に併せて確認依頼

**AC 達成**: 全 8 件 ✅（spec チェックボックスを `[x]` に更新済）

---

### us-33 カルテ画面（🟠 構造再設計）

#### 既実装で充足している AC

- AC-6 戻るリンク: `/outpatient` 固定で戻りはする（ただし mode='inpatient' 用の `/` 戻りは未対応）

#### 全面再設計が必要な AC

| AC | 現状 | 改修内容 |
| --- | --- | --- |
| AC-1 タブ式 TOP | 6 タブ（看護過程欠落） | 7 タブ構成へ（看護過程タブ追加） |
| AC-2 mode 自動判定 | 未実装（テーマ hardcode） | `mode` prop + 遷移元/admissionState 判定 |
| AC-3 グレーアウト+Tooltip | 未実装 | mode='outpatient' で看護過程タブ disabled + Tooltip |
| AC-4 外来モード ActionBar | 部分実装 | 「オーダー入力／患者予約／印刷／終了」に整理 |
| AC-5 入院モード ActionBar | 未実装 | mode='inpatient' のとき入退院/隔離拘束/看護ケア記録 等を表示（枠だけ。実装は段階 2） |
| AC-7 mode Chip 表示 | 未実装 | 患者ヘッダーに「外来」Chip（success）／「入院」Chip（primary）+ 病棟・病室 |
| AC-8 フローシート埋込 | 未実装 | `<FlowsheetPage embedded patientId={...} />` を埋込（既存 ep-10 の prop 対応済） |
| AC-9 design-rules §12 準拠 | §12 未存在 | §12 新設後に適用 |

#### 新規ファイル

- `src/components/karte/KartePage.tsx`（仮称・**新規実装**。既存 `karte/KartePage.tsx` がある場合は PM 確認事項 #2 で活用方針確定後に決める）
- 必要に応じて `src/components/karte/KarteHeader.tsx`、`src/components/karte/KarteActionBar.tsx`、`src/components/karte/KarteTabs.tsx` 等の分割

#### 既存ファイル更新

- `src/routes/index.tsx`
  - 段階 1 暫定: `/karte-outpatient/:patientId` を新 `KartePage` に差し替え（OutpatientKartePage 撤去前提）
  - 最終形（段階 3）: `/karte/:patientId` に統一

#### 撤去候補（段階 1 終了時）

- `src/components/karteOutpatient/OutpatientKartePage.tsx`（新カルテ画面に置換後）
- `src/components/karte/` 内の既存素材（PM 確認事項 #2 の判断による）

---

### us-34 患者情報サブタブ（🟠 構造再構成）

#### 既実装で充足している AC

- AC-2 基本情報サブタブの内容: `PatientBasicPage` がほぼ実装済（主訴／アレルギー／感染症／服薬／問診／状態／その他／預かり金）

#### 構造変更が必要な AC

| AC | 現状 | 改修内容 |
| --- | --- | --- |
| AC-1 サブタブ表示 | 独立ページ（サブタブなし） | カルテ画面の「患者情報」メインタブ内に 7 サブタブを配置 |
| AC-3 Chip 風小型タブ | サブタブ自体無し | サブタブを Chip 風小型表示で実装 |
| AC-4 サブタブ切替時の未保存保持 | 該当機構なし | サブタブごとに編集状態を分離保持 |
| AC-5 編集単位ごとの保存 | 単一ページ保存のみ | サブタブごとの保存ボタン |
| AC-6 離脱時の未保存検知 | 既実装あり（独立ページ用） | カルテ画面外（メインタブ切替・「一覧に戻る」）でも作動するよう移行 |
| AC-7 mode 別表示差分 | 未実装 | mode='inpatient' で属性サブタブに入院専用情報セクション（枠のみ） |

#### 新規ファイル

- `src/components/karte/PatientInfoTab.tsx`（仮称・サブタブ管理）
- `src/components/karte/patientInfo/BasicInfoSubview.tsx`（PatientBasicPage 内容をサブビュー化）
- `src/components/karte/patientInfo/AttributesSubview.tsx`
- `src/components/karte/patientInfo/InsuranceSubview.tsx`
- `src/components/karte/patientInfo/ContactsSubview.tsx`
- `src/components/karte/patientInfo/DiagnosesSubview.tsx`
- `src/components/karte/patientInfo/EpisodesSubview.tsx`
- `src/components/karte/patientInfo/MemoSubview.tsx`

#### 既存ファイル更新

- `src/components/outpatient/PatientBasicPage.tsx` → BasicInfoSubview へ機能移植後、ページとしては撤去 or リダイレクト化
- `src/routes/index.tsx`
  - `/outpatient/:patientId/basic` の扱い: **撤去** または **`/karte-outpatient/:patientId?tab=patient-info&sub=basic` 相当へ互換リダイレクト**（PM 確認事項とする）

#### 準備メモ（S3 起こし・2026-05-06）

S2 の us-33 骨組み合意前に、S3 が us-34 着手前提条件を整理した検討メモ。本格実装着手時の出発点として残す。

##### 1. PatientBasicPage → 基本情報サブビューのマッピング

`PatientBasicPage` は 8 セクション + 患者ヘッダー + 戻るボタン + アクションバー + 離脱確認ダイアログで構成。新カルテ画面では、サブタブ単位の保存・未保存検知は上位 `PatientInfoTab` に集約し、各サブビューは「コンテンツのみ」を担う構成にする。

| `PatientBasicPage` の構成要素 | 新サブビューでの扱い |
| --- | --- |
| 戻るボタン + パンくず | **削除**（カルテ画面ヘッダーで集約） |
| 患者ヘッダー（簡略版） | **削除**（カルテ画面ヘッダーで mode Chip と共に表示） |
| 主訴 / アレルギー / 感染症・既往 / 服薬・基礎疾患 / 問診表 / 現在の状態 / その他 | `BasicInfoSubview` 内に移植（セクション構造そのまま） |
| 預かり金 | 段階 1 では基本情報内に残置（spec AC-2 に明記）。**外来運用での妥当性は PM 確認候補**（後述 §8） |
| アクションバー（保存／キャンセル） | サブタブ内アクションバーとして `PatientInfoTab` 階層で再構築（編集単位 = サブタブごと） |
| 離脱確認ダイアログ | カルテ画面共通の `useBlocker` と組合せ、全サブタブの dirty 統合判定で発火 |
| `TriStateField` / `ChipInput` | `BasicInfoSubview` 内の private 実装として一旦温存（共通化検討は §4） |

##### 2. サブタブ別コンテンツ詳細（参考システム `docs/gairai/features/patient.html` 準拠）

参考システムは複数の独立画面に分散しているのを、新カルテ画面では 7 サブタブに集約する。**段階 1 は各サブタブ枠と最小コンテンツのみ実装**し、フィールド網羅は段階 2 以降で詰める方針。

| サブタブ | 段階 1 実装範囲 | 主要フィールド |
| --- | --- | --- |
| 基本情報 | フル実装（PatientBasicPage 移植） | 主訴／アレルギー／感染症／服薬／問診／状態／その他／預かり金 |
| 属性 | 枠 + 主要項目のみ | ニックネーム／職業／初診日／身長／体重／血液型（枠）／死亡フラグ（枠）／担当スタッフ（主治医・担当医・看護師×2） |
| 保険 | 枠 + read-only 表示 | 法別番号／本人家族区分／自己負担割合／有効期間／保険者番号／記号番号／枝番（既存 `InsuranceInfo` 活用） |
| 連絡先 | 枠 + サンプル 1 件 | 連絡先（氏名・続柄・電話）／勤務先／郵送先（複数登録 UI は「+ 追加」モックボタンのみ） |
| 病名 | 枠 + 主要項目（既存 `DiagnosisInfo` 活用） | 主病名／コード／開始日／副病名／コード／開始日／転帰 |
| エピソード | 枠 + 一覧のみ | 一覧（年月＋内容）モック表示。新規追加・編集はモックフォーム（保存処理は snackbar のみ） |
| メモ | 枠 + 自由記述 | multiline TextField のみ |

**段階 2 以降に持ち越す要素**: 属性のスタッフ細粒度（SW／心理士／スタッフ 1〜6）、住所自動補完、死亡日時 Picker／連絡先の複数行追加・並び替え／病名 ICD10 マスタ検索／エピソードの MonthPicker・4000 文字バリデーション・削除フロー。

##### 3. mock データ・`Patient` 型の仮設計

**結論**: 段階 1 で `Patient` 型に追加するのは **ゼロを目標**。データの大半はサブビュー内の `useState` で初期値（mock）から立ち上げ、保存は snackbar 通知のみ（永続化なし）で済ませる。

| サブビュー | 既存型／データの活用 | 不足分の扱い |
| --- | --- | --- |
| 基本情報 | `allergyInfo` を初期値に転用 | `PatientBasicPage` の `INITIAL_FORM` をローカル state に流用 |
| 属性 | `Patient.{name, age, gender, doctorName, wardName, nurse, daycare}` + `staffInfo` | ニックネーム／職業／初診日／血液型／身長／体重 はサブビュー内 mock |
| 保険 | `InsuranceInfo` 型は既存 | mock オブジェクトをサブビュー内に直書き（`MASTER_INSURANCE_TYPES` 新設は不要） |
| 連絡先 | 既存型なし | サブビュー内に `MockContact[]` 仮型を閉じ込める |
| 病名 | `DiagnosisInfo` を流用 | 転帰のみ追加項目（ローカル state） |
| エピソード | 既存型なし | サブビュー内に `MockEpisode[]` 仮型を閉じ込める |
| メモ | 基本情報の「患者メモ」と概念重複あり（後述 §8） | 自由記述 1 フィールド（独立 state） |

**AC-7 入院専用セクション**（属性サブタブ内・段階 1 では「枠だけ」）は既存 `Patient.{admitDate, wardId, roomNumber, nurse}` で賄える見込み → **型追加なしで実装可能**。

`MASTER_*` への新規追加なし／`useAppStore` 拡張なし／`localStorage` 永続化なし、という方針で着手予定。**いずれも MASTER 確認が必要な共有ファイル変更を回避する選択**。実装中に必要が判明した時点で「MASTER 待ち事項」に起票する。

##### 4. TriStateField / ChipInput 共通化の検討

| 候補 | 段階 1 推奨 | 理由 |
| --- | --- | --- |
| `TriStateField` | **抽出しない** | 他サブビューの利用予定なし。`BasicInfoSubview` に閉じる方が変更影響を最小化（YAGNI） |
| `ChipInput` | **抽出しない** | 同上。基本情報の禁忌薬剤・食物アレルギーのみで使用 |

将来「他サブタブからも使いたい」要件が出たタイミングで `src/components/common/` に抽出する（その際に MASTER 確認）。design-rules に共通化を強制する記述はない。

##### 5. PatientInfoTab 階層構成（実装スケッチ）

```text
src/components/karte/
  PatientInfoTab.tsx          // サブタブ Chip 群、サブタブごとの dirty 集約、サブタブ内アクションバー、mode prop 受け渡し
  patientInfo/
    BasicInfoSubview.tsx      // PatientBasicPage 内訳を移植
    AttributesSubview.tsx     // mode により入院専用セクション枠の表示切替
    InsuranceSubview.tsx
    ContactsSubview.tsx
    DiagnosesSubview.tsx
    EpisodesSubview.tsx
    MemoSubview.tsx
```

**設計上の肝**:

- AC-4「サブタブ切替で未保存変更を保持」のため、サブタブ切替時に **アンマウントしない**。`display: none` で全サブビューを常時マウント保持し、内部 state を破棄しない実装にする
- サブタブ単位の dirty フラグは各サブビューから `onDirtyChange` で `PatientInfoTab` に上げる
- 保存はアクションバーから現アクティブサブタブの `onSave()` を呼ぶ
- カルテ離脱検知（AC-6）は `PatientInfoTab` から上位 `KartePage` へ「いずれかのサブタブが dirty」を通知し、`KartePage` 側の `useBlocker` でダイアログを発火（design-rules §11）

##### 6. ルート

- 段階 1 は **新ルート追加なし**。`PatientInfoTab` はカルテ画面 (`/karte/:patientId`) のメインタブ「患者情報」内に埋込
- `/outpatient/:patientId/basic` の扱い（PM 確認事項 #5）は **PM 判断待ちで触らない**（撤去 vs 互換リダイレクトは S3 の判断領域外）
- サブタブの URL クエリ反映（`?sub=insurance` 等）は spec で明示なし → 段階 1 は内部 state で割り切り

##### 7. 着手順（本格実装フェーズ・S2 の us-33 骨組み合意後）

1. 型整合チェック（`Patient` / `InsuranceInfo` / `DiagnosisInfo` の現状で賄えるか最終確認、必要なら MASTER 待ちに起票）
2. `PatientInfoTab` の枠 + サブタブ Chip 切替 + dirty 集約 + アクションバー
3. `BasicInfoSubview`（`PatientBasicPage` 移植、ヘッダー・戻るボタン・離脱ダイアログ除去）
4. その他 6 サブビュー（最小モック）
5. `KartePage`（S2 提供）の「患者情報」タブに `<PatientInfoTab>` 埋込
6. 未保存検知ダイアログを `KartePage` 階層と接続
7. 検証（`npx tsc --noEmit` + `npx vite build`）／ブラウザ目視

##### 8. PM／MASTER 確認候補（実装フェーズ着手時にまとめて起票）

実装着手前に MASTER 経由で PM 確認したい論点。準備フェーズの段階では起票せず、本格実装着手時に判断状況を見て「MASTER 待ち事項」に集約する。

1. **預かり金セクションの mode 別表示**: 外来 mode で預かり金管理を表示する業務的妥当性。mode='inpatient' のみ表示が筋ではないか
2. **段階 1 の永続化方針**: サブタブ切替で値保持は当然必要だが、ブラウザリロード後の保持（localStorage）まで段階 1 で実装するか
3. **「基本情報内の患者メモ」と「メモサブタブ」の住み分け**: 同名フィールドが二重に存在することの整理（一方を非表示にする／用途を明示する／統合する のいずれか）
4. **AC-7 mode='inpatient' 入院専用セクション**: 段階 1 では「枠だけ」（spec 補足通り）で、データソースは既存 `Patient` フィールドで賄う前提でよいか

---

## 共有ファイル変更（MASTER 確認必須）

段階 1 で以下の共有ファイル変更が見込まれる。実装着手前に MASTER（=私）と PM の合意を取る:

### 確実に変更が必要

- `src/routes/index.tsx`
  - `/karte/:patientId` 新規追加
  - `/karte-outpatient/:patientId` 撤去
  - `/outpatient/:patientId/basic` の扱い決定（残 PM 確認事項 #5）
- `docs/design-rules.md`
  - §12「mode 切替（外来／入院）」新設
- `docs/screen-mapping.tsv`
  - 新カルテ画面 `/karte/:patientId` の行追加、`/karte-outpatient/:patientId` 行は撤去

### 変更可能性あり（実装方針による）

- `src/types/index.ts`
  - 既存 `Patient.admissionState` を mode 判定に活用するため、追加型は不要の見込み
  - mode='inpatient' で属性サブタブに表示する入院情報（既存型で賄えるか要確認）
- `src/stores/useAppStore.ts`
  - `navigationSource` の使い方は既存パターン踏襲。状態追加は不要見込み
- `src/data/mockData.ts`
  - 新規 `MASTER_*` セクション追加なしの見込み（既存外来モックを継続利用）

---

## 残 PM 確認事項（実装中に判断可・任意）

段階 1 中の確認事項はすべて 2026-05-06 にクローズ。冒頭「決定事項（PM 合意済）」表参照。

---

## ワーカー割り振り想定（参考）

骨組み合意後の並列化案:

| ワーカー | 担当 | 着手 |
| --- | --- | --- |
| S2（先行） | 着手順序 [1][2]（design-rules §12 + us-33 骨組み） | 最初 |
| S3 | 着手順序 [4]（us-34 患者情報サブタブ） | 順序 \[2\] 合意後 |
| S4 | 着手順序 [3]（us-32 仕上げ） | 順序 \[2\] 合意後 |

`[5] 統合確認` は MASTER 主導で実施。

---

## 段階 1 着手順序 [2] 完了メモ（S2 / 2026-05-06）

### 実装サマリ

着手順序 [2]「us-33 カルテ画面骨組み」を実装完了。`npx tsc --noEmit` / `npx vite build` クリーン（ブラウザ目視は MASTER 側で実施依頼）。

- 新規ファイル
  - `src/components/karte/KartePage.tsx`（既存 KartePage.tsx を上書き刷新）
  - `src/components/karte/KartePatientHeader.tsx`
  - `src/components/karte/KarteActionBar.tsx`
- 既存温存（旧 `src/components/flowsheet/FlowsheetPage.tsx` が依存しているため触らない）
  - `src/components/karte/PatientHeader.tsx` / `ActionBar.tsx` / `LifeTimeline.tsx` / `MedicalInfo.tsx` / `MedicalRecords.tsx`
- ルート追加
  - `/karte/:patientId` → `KartePage`（`src/routes/index.tsx`）
  - `/karte-outpatient/:patientId`（`OutpatientKartePage`）は段階 1 では温存（撤去タイミングは PM 確認事項 #3）
- `docs/screen-mapping.tsv` に `/karte/:patientId` 行追加

### KartePage の mode prop API（S3 / S4 連携用契約）

**型定義**（`src/components/karte/KartePage.tsx` で export）:

```ts
export type KarteMode = 'outpatient' | 'inpatient';

export type KarteNavigationFrom = 'outpatient-list' | 'ward-map' | 'patient-list';

export interface KartePageLocationState {
  from?: KarteNavigationFrom;
}

interface KartePageProps {
  /** mode を強制指定する（テスト・将来の埋込用エスケープハッチ）。通常は内部判定。 */
  modeOverride?: KarteMode;
}
```

**遷移時の契約（呼び出し側）**:

呼び出し側は `useNavigate()` で `/karte/<patientId>` に遷移する際、`state.from` に **必ず遷移元種別** を渡すこと。`location.state` を使うのは `useAppStore` の型変更（共有ファイル変更）を避けるための統一インタフェース。

```tsx
// 外来一覧から（us-32 / S4 担当）
navigate(`/karte/${patient.id}`, {
  state: { from: 'outpatient-list' } satisfies KartePageLocationState,
});

// 病棟マップから（既存 KarteAlphaPage の置換時、段階 3）
navigate(`/karte/${patient.id}`, {
  state: { from: 'ward-map' } satisfies KartePageLocationState,
});

// 入院患者一覧から（PatientList の置換時、段階 3）
navigate(`/karte/${patient.id}`, {
  state: { from: 'patient-list' } satisfies KartePageLocationState,
});
```

**mode 判定の優先順序**（`KartePage` 内部で実装済）:

1. `props.modeOverride`（明示指定があれば最優先）
2. `location.state.from === 'outpatient-list'` → `outpatient`
3. `location.state.from === 'ward-map' | 'patient-list'` → `inpatient`
4. `useAppStore.navigationSource === 'ward-map'` → `inpatient`（既存 `KarteAlphaPage` パターンの後方互換）
5. `Patient.admissionState === 'outpatient'` → `outpatient`
6. それ以外（`inpatient` / `discharged` / 未設定） → `inpatient`

**戻り先判定**（`一覧に戻る` リンク）:

- `state.from === 'outpatient-list'` → `/outpatient`
- `state.from === 'ward-map'` → `/`
- `state.from === 'patient-list'` → `/patients`
- 未指定（直接 URL アクセス等） → mode に応じてフォールバック（`outpatient` → `/outpatient` / `inpatient` → `/`）

### 段階 1 のスコープ充足状況（AC 別）

| AC | 状態 | 備考 |
| --- | --- | --- |
| AC-1 タブ式 TOP（7 タブ） | ✅ 骨組み | 既定タブ「診療録」。各タブ中身は段階 1 ではプレースホルダ（フローシートのみ ep-10 埋込で実体あり） |
| AC-2 mode 自動判定 | ✅ | 上記優先順で実装 |
| AC-3 グレーアウト + Tooltip | ✅ | 看護過程タブが mode=outpatient で disabled。Tooltip「外来では利用しません」を `<span>` でラップ適用 |
| AC-4 外来モード ActionBar | ✅ | 「オーダー入力／患者予約／印刷／終了（カルテを閉じる）」 |
| AC-5 入院モード ActionBar | ✅ 枠のみ | 「入退院指示／隔離拘束指示／看護ケア記録／オーダー入力／印刷／終了」。前 3 ボタンは段階 2 で本実装するため `disabled + Tooltip「段階 2 で実装予定」` |
| AC-6 戻るリンク | ✅ | `state.from` ベース |
| AC-7 mode Chip | ✅ | 外来=success「外来」、入院=primary「入院」+ 病棟・病室併記。退院済補足 Chip も対応 |
| AC-8 フローシート埋込 | ✅ | `<FlowsheetPage embedded patientId={patient.id} />`（`src/features/flowsheet/pages/FlowsheetPage.tsx`） |
| AC-9 design-rules §12 準拠 | ✅ | §12.1〜§12.6 に従う |

**未対応（後続ストーリー）**:

- 患者情報タブの中身（us-34 / S3 担当）
- 外来一覧からの遷移先 URL 切替（us-32 / S4 担当）
- 看護過程タブ実体（ep-12〜14 配下）
- 入退院指示／隔離拘束指示／看護ケア記録ボタンの本実装（段階 2）

### S3 / S4 への申し送り

- **S3（us-34）**: 患者情報タブの実装は `KartePage.tsx` 内 `KarteTabContent` の `tabId === 'patient-info'` 分岐に差し込む形で OK。または別コンポーネント `PatientInfoTab.tsx`（S3 が起こす想定）を `KartePage.tsx` から呼ぶ形が望ましい。`mode` と `patientId` は `KarteTabContent` の props で受けられる
- **S4（us-32）**: `OutpatientList` の `navigate` 呼び出しを `/karte-outpatient/:patientId` から `/karte/:patientId` に切替え、`state: { from: 'outpatient-list' }` を必ず添える。型は `import type { KartePageLocationState } from '../karte/KartePage'` で共有可能

---

## 段階 1 着手順序 [4] 完了メモ（S3 / 2026-05-06）

### 実装サマリ

着手順序 [4]「us-34 患者情報サブタブ」を実装完了。`npx tsc --noEmit` / `npx vite build` クリーン（ブラウザ目視は MASTER 側で実施依頼）。

- 新規ファイル
  - `src/components/karte/PatientInfoTab.tsx` — サブタブ Chip 群と dirty 集約
  - `src/components/karte/patientInfo/BasicInfoSubview.tsx` — `PatientBasicPage` の内訳を移植
  - `src/components/karte/patientInfo/AttributesSubview.tsx`
  - `src/components/karte/patientInfo/InsuranceSubview.tsx`
  - `src/components/karte/patientInfo/ContactsSubview.tsx`
  - `src/components/karte/patientInfo/DiagnosesSubview.tsx`
  - `src/components/karte/patientInfo/EpisodesSubview.tsx`
  - `src/components/karte/patientInfo/MemoSubview.tsx`
  - `src/components/karte/patientInfo/useDirtyForm.ts` — 共通フック（dirty 検出 + 破棄シグナルでの reset）
  - `src/components/karte/patientInfo/SubviewActionBar.tsx` — 共通フッター（保存・キャンセル・未保存 Chip）
- 既存ファイル更新
  - `src/components/karte/KartePage.tsx`（S2 提供）— `KarteTabContent` の `patient-info` 分岐に `<PatientInfoTab>` を埋込。メインタブ切替（`attemptTabChange`）と「一覧に戻る」(`handleBack`) で **未保存検知ダイアログ** を発火。確定時は `discardSignal` を inc して全サブビューを reset
  - `docs/screen-mapping.tsv` — `/karte/:patientId` の `PatientInfoTab.tsx` 行を追加
- 既存温存
  - `src/components/outpatient/PatientBasicPage.tsx` — 段階 1 では `/outpatient/:patientId/basic` 経路含めそのまま動作維持（撤去判断は PM 確認事項 #5）
- 共有ファイル変更なし
  - `src/types/index.ts` / `src/stores/useAppStore.ts` / `src/data/mockData.ts` の `MASTER_*` / `src/components/common/` いずれも変更なし
  - 既存マスタの追加なし、`localStorage` 永続化なし

### 段階 1 のスコープ充足状況（AC 別）

| AC | 状態 | 備考 |
| --- | --- | --- |
| AC-1 サブタブ表示（7 サブタブ） | ✅ | Chip 風小型タブで横並び、既定「基本情報」 |
| AC-2 基本情報サブタブの内容 | ✅ | PatientBasicPage の 8 セクション（主訴／アレルギー／感染症・既往／服薬・基礎疾患／問診表／現在の状態／その他／預かり金）を移植 |
| AC-3 Chip 風小型タブ | ✅ | メインタブ = `Tabs`（標準サイズ）／サブタブ = `Chip size="small"` で階層差を視覚化 |
| AC-4 サブタブ切替時の未保存保持 | ✅ | 全サブビューを `display: none` で常時マウントし内部 state を保持 |
| AC-5 編集単位ごとの保存 | ✅ | サブビュー内 `SubviewActionBar` で「保存／キャンセル」を実装。サブビュー間で独立 |
| AC-6 離脱時の未保存検知 | ✅ | `KartePage` で「メインタブ切替」「一覧に戻る」時に dirty なら確認ダイアログ（design-rules §10/§11 準拠） |
| AC-7 mode 別表示差分 | ✅ 枠のみ | mode='inpatient' で属性サブタブに「入院専用情報」セクション（入院日／病棟／病室を read-only 表示）を追加表示。受け持ち看護師の正式割当 UI は段階 2 |
| AC-8 設計ルール準拠 | ✅ | §3.2 アクションバー右寄せ／§10 破壊的（warning ボタン）／§11 未保存検知／§12 mode 切替（外来=success／入院=primary）に準拠 |

### 設計判断（暫定）

実装中に S3 が暫定判断した事項。妥当性検証は MASTER レビュー時 or PM 確認時に。

| # | 判断 | 妥当性 |
| --- | --- | --- |
| 1 | **預かり金セクションを mode に関わらず両方で表示**（spec AC-2 通り） | 外来 mode で預かり金管理を表示する業務的妥当性は不明。mode='inpatient' のみ表示が筋という案は段階 2 で再判断 |
| 2 | **`localStorage` 永続化なし**（保存は snackbar のみ） | サブタブ切替で値保持は実装済（AC-4）。リロード後の保持は段階 2 以降で判断 |
| 3 | **基本情報の「メモ」は「基本情報メモ（補足）」とラベル変更**、メモサブタブは「患者メモ」で長文の運用メモ | 二重存在の運用整理。完全統合は段階 2 以降 |
| 4 | **AC-7 入院専用情報セクションは枠のみ**（既存 `Patient` フィールドを read-only 表示） | spec 補足通り。`Patient` 型追加なし |
| 5 | **`TriStateField` / `ChipInput` は `BasicInfoSubview` 内 private** に温存 | 他サブビューでの利用予定なし。`src/components/common/` への抽出は YAGNI で見送り |
| 6 | **`PatientBasicPage` は段階 1 終了時点でも撤去せず温存** | PM 確認事項 #5 の判断待ち。撤去 vs 互換リダイレクトは MASTER / PM 領域 |

### MASTER への申し送り

- **PM 確認事項 #5（`/outpatient/:patientId/basic` の扱い）** は段階 1 終了時の判断待ち。S3 として現実装は新カルテ画面の患者情報タブで完全代替可能だが、撤去判断は MASTER / PM 領域として触らず温存
- 「**未保存検知ダイアログ**」は段階 1 では「メインタブ切替」「一覧に戻る」のみ対応。`useBlocker` を使った **ブラウザ back / 直接 URL 変更** はスコープ外（段階 2 以降で要検討）
- S3 のサブビュー実装は「最小モック」方針で、参考システム HTML の網羅は段階 2 以降に譲る項目が多い（属性のスタッフ細粒度、連絡先の複数行追加、病名 ICD10 マスタ検索、エピソードの MonthPicker・4000 文字バリデーション）
- 段階 1 統合確認時には外来一覧 → カルテ → 患者情報タブ → サブタブ切替（未保存変更を残して別サブタブへ → 値保持の確認）→ 別メインタブクリック（未保存検知ダイアログ発火確認）→ 「破棄して進む」で reset の動線が想定パス

---

## 段階 1 クローズ作業: PM 確認事項 #3 / #5 完了メモ（S4 / 2026-05-06）

PM 確認事項 #3「OutpatientKartePage 即撤去」と #5「`/outpatient/:patientId/basic` 互換リダイレクト」を処理。段階 1 統合確認の前段として外来カルテ系を最終形に整理。

### #3 OutpatientKartePage 即撤去

- 削除: `src/components/karteOutpatient/OutpatientKartePage.tsx`（947 行）
- 削除: `src/components/karteOutpatient/` ディレクトリ（中身は本ファイルのみ）
- `src/routes/index.tsx` から `/karte-outpatient/:patientId` ルートと `OutpatientKartePage` import を削除
- `src/layouts/MainLayout.tsx` の AppBar 非表示ガード `!startsWith("/karte-outpatient")` を削除（撤去後は不要）

撤去理由: 新カルテ画面 `KartePage`（`/karte/:patientId`）で `mode='outpatient'` の機能を完全代替済（us-33 で骨組み、us-34 で患者情報サブタブ、us-32 仕上げで遷移先切替）。OutpatientKartePage は段階 1 終了時の撤去候補として `_epic.md` でも予告済。

### #5 `/outpatient/:patientId/basic` 互換リダイレクト

- 削除: `src/components/outpatient/PatientBasicPage.tsx`（582 行・S3 us-34 で `BasicInfoSubview` に内訳移植済）
- `src/routes/index.tsx` の `/outpatient/:patientId/basic` ルートを `RedirectToPatientInfo` コンポーネントに置換し、`/karte/:patientId#patient-info` へ `replace` リダイレクト
- `<Navigate>` + `useParams()` で `:patientId` を保持して新カルテ画面の患者情報タブに転送
- ハッシュ `#patient-info` は S2 us-33 AC-10（タブ状態の URL ハッシュ反映）で定義された tabId に準拠

旧 URL を踏んだリンク・ブックマーク・履歴は自動で新カルテ画面に転送される。

### 参照残存チェック

`grep -rn "OutpatientKartePage\|PatientBasicPage\|karte-outpatient\|karteOutpatient" src/` で参照残存ゼロを確認済。

### 検証

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン
- 共有ファイル: `routes/index.tsx`（ルート 1 削除 + 1 置換 + `RedirectToPatientInfo` 追加 + `useParams` import）と `MainLayout.tsx`（AppBar ガード 1 行削除）を変更。`types` / `store` / `mockData` / `common` は変更なし

### コミット記録

実装本体は **S2 のコミット `30151eb`（`feat(ep-15/us-33): AC-10 タブ状態の URL ハッシュ反映`）に巻き込まれて push 済**。S2 が並行で全ファイルをまとめてコミットしたタイミングで、S4 のローカル変更（4 ファイル）も同コミットに含まれた。S2 のコミットメッセージは AC-10 内容のみで「routes に手を入れず完了」と書かれているが、実態としては `routes/index.tsx` / `MainLayout.tsx` / `karteOutpatient/` / `outpatient/PatientBasicPage.tsx` も同コミットで変更されている。並行運用の FS 共有による既知の干渉パターン（前段で S3 → S4 の巻き込みも発生済）。

---

## AC-10 フォローアップ修正（S2 / 2026-05-06）

### 経緯

PM ブラウザ目視で「診療録 → フローシート と遷移した際、ブラウザバックは診療録に戻るのが自然」との指摘。初版 `30151eb` は履歴を汚さない方針で `navigate({hash}, {replace: true})` 一択だったが、ユーザーのタブ切替操作だけは履歴に積む挙動に変更。

### 修正内容

- `commitTab` のシグネチャを `commitTab(nextTab, opts?: { replace?: boolean })` に拡張。**既定は `replace: false`**（ユーザー操作経路）
- 既存呼び出し（`attemptTabChange` / `handleConfirmDiscard`）は `commitTab(nextTab)` のまま → 自動的に `replace: false` 適用
- 「初期化時の URL 自動補正」（無効ハッシュ → 既定タブ等の内部書換）は `commitTab(nextTab, { replace: true })` で履歴に積まないルールを spec / コードコメントに明文化（現状コードでは該当経路の navigate 呼び出しは未実装。将来の拡張用ルール）
- `useEffect` での `location.hash` 追従（戻る／進むイベント由来の再描画）は `setCurrentTab` のみで `navigate` を呼ばないため、本修正の対象外

### spec / changes の整合

- `docs/specs/ep-15-outpatient-emr/us-33-karte-screen.spec.md` の AC-10 末尾 Note を「ユーザー操作は `replace: false`、内部補正は `replace: true`」に書き換え + 「ブラウザバックで前タブに戻る」 Given/When/Then を追加

### 動作

| 操作 | 結果 |
| --- | --- |
| 診療録 → フローシート と切替 → ブラウザバック | 診療録に戻る |
| フローシート → 指示簿 → 患者情報 と切替 → ブラウザバック × 2 | 診療録に戻る（フローシート → 診療録） |
| 直打ち `/karte/P001#orders` から開いてブラウザバック | カルテ画面の手前のページ（外来一覧等）に戻る |
| 患者情報タブで編集 → 別タブクリック → 確認ダイアログ「破棄して進む」 → ブラウザバック | 患者情報タブに戻る（確認ダイアログは再表示しない・dirty は破棄済のため） |

### 検証結果

`npx tsc --noEmit` + `npx vite build` クリーン。共有ファイル（types / store / mockData / common / routes）に変更なし。`KartePage.tsx` 単一ファイル変更。

### 並行運用注意（前回干渉の再発防止）

- 編集前 `git pull --ff-only`、編集ファイルを **明示** で `git add`、`git diff --cached --stat` で範囲確認、それから `git commit && git push` を一気に
- 今回は `KartePage.tsx` + spec + changes の 3 ファイルを 1 コミットでまとめて push

---

## 残課題（段階 1 で扱わない）

- 段階 2（mode='inpatient' 実装）／段階 3（KarteAlphaPage 置換）は別エピックで管理
- 看護過程タブ中身（ep-12〜14 配下）
- 印刷フロー（design-rules §16 想定。エピック非帰属の継続課題）
- ORCA 連携実装（モックではトーストのまま）

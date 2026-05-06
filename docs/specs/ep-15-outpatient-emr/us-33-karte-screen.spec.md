# us-33 [外来] カルテ画面（タブ式 TOP・mode 切替）

## メタ

| 項目 | 内容 |
| --- | --- |
| 対応エピック | [ep-15 外来 EMR 刷新](./_epic.md) |
| 対応モック画面 | パス: `/karte/:patientId`（段階 1 から最終形を先行採用）<br>実装予定: `src/components/karte/KartePage.tsx`（mode prop 対応）<br>既実装参考: `src/components/karteOutpatient/OutpatientKartePage.tsx`（6 タブ・テーマ hardcode・mode 未対応 → 段階 1 終了時に撤去）<br>素材取込元: `src/components/karte/`（ActionBar / LifeTimeline / MedicalInfo / MedicalRecords / PatientHeader。design-rules v1.1 適合可否で個別判断） |
| 想定ロール | 外来看護師、主治医（将来は入院看護師・主治医も） |
| ステータス | draft |

### 参考システムマニュアル

| ファイル | ページ範囲 | 対象画面 |
| --- | --- | --- |
| `docs/gairai/features/medical-records.html` | 該当節 | カルテ／診療記録 |
| `docs/gairai/screen-flow.html` | 該当節 | 画面遷移 |
| `docs/gairai/spec.html` | 該当節（タブ構成） | カルテ画面 |

## ユーザーストーリー

- **As a** 外来看護師／主治医（および将来は入院看護師・主治医）
- **I want** 患者ごとのカルテ画面で、診療録／フローシート／指示簿／指示状況／看護過程／患者情報／スケジュール をタブで切り替えて閲覧したい
- **So that** 同じ患者が外来→入院→外来と動いても同じ操作感で診療情報にアクセスできる

## 画面要素（要素ツリー）

```text
- カルテ画面 (/karte/:patientId)
  - 患者ヘッダー
    - 戻るリンク: 「一覧に戻る」（遷移元判定）
    - 患者基本属性: 患者番号／氏名／年齢／性別
    - mode 識別 Chip:
      - mode='outpatient': 「外来」Chip（success 色）
      - mode='inpatient':  「入院」Chip（primary 色）+ 病棟・病室番号併記
  - メインタブバー（7 タブ）
    - 診療録タブ（既定選択）
    - フローシートタブ（埋込: ep-10 FlowsheetPage を embedded prop で）
    - 指示簿タブ
    - 指示状況タブ
    - 看護過程タブ
      - mode='outpatient' のとき disabled + Tooltip「外来では利用しません」
      - mode='inpatient'  のとき活性
    - 患者情報タブ（サブタブ 7 種、us-34 で詳細）
    - スケジュールタブ
  - タブ内コンテンツ領域（タブごとに切替）
  - アクションバー（フッター固定、mode に応じて切替）
    - mode='outpatient': オーダー入力／患者予約／印刷／終了（カルテを閉じる）
    - mode='inpatient':  入退院指示／隔離拘束指示／看護ケア記録／オーダー入力／印刷／終了
```

## 振る舞い

- **画面遷移時**: 患者 ID と遷移元から `mode` を決定。テーマ色とタブ可視性／活性を適用。既定タブは「診療録」
- **mode 判定**:
  1. 患者属性ベース（既定）: `Patient.admissionState` が `outpatient` → `outpatient`、`inpatient` → `inpatient`
  2. 遷移元ベース（オーバーライド）: 外来一覧から遷移 → `outpatient`、病棟マップ／入院患者一覧から遷移 → `inpatient`
  3. 矛盾時は **遷移元を優先**
- **タブ切替**: クリックで切替。disabled タブのクリックは無視
- **disabled タブのホバー**: Tooltip 表示（`design-rules.md` §12 準拠）
- **「一覧に戻る」クリック**: 遷移元へ戻る（`navigationSource` に基づく）
  - 外来一覧から来た場合 → `/outpatient`
  - 病棟マップから来た場合 → `/`
- **アクションバーのボタンクリック**: 各機能へ遷移またはダイアログ起動（モックではトースト or 該当画面遷移）

## 受け入れ基準（AC）

- [ ] **AC-1: タブ式 TOP として動作する**
  - **Given** 外来一覧（または病棟マップ）から患者選択で遷移
  - **When** カルテ画面を表示
  - **Then** 患者ヘッダー + 7 タブ（診療録／フローシート／指示簿／指示状況／看護過程／患者情報／スケジュール）が表示され、既定で「診療録」タブが選択される

- [ ] **AC-2: mode は患者属性 + 遷移元から自動判定される**
  - **Given** 外来一覧から遷移
  - **Then** `mode='outpatient'`、テーマカラー = success（緑系）
  - **Given** 病棟マップから遷移
  - **Then** `mode='inpatient'`、テーマカラー = primary（青系）
  - **Given** 患者属性と遷移元が矛盾
  - **Then** 遷移元を優先

- [ ] **AC-3: 利用不可なタブはグレーアウト + Tooltip で説明される**
  - **Given** `mode='outpatient'` で表示
  - **When** 「看護過程」タブを確認
  - **Then** disabled 状態で、ホバー時 Tooltip「外来では利用しません」が表示される
  - **When** 該当タブをクリック
  - **Then** タブ切替が発生しない

- [ ] **AC-4: 外来モードで表示されるアクション**
  - **Given** `mode='outpatient'`
  - **When** アクションバーを確認
  - **Then** 「オーダー入力」「患者予約」「印刷」「終了（カルテを閉じる）」が表示。「入退院指示」「隔離拘束指示」は非表示または disabled

- [ ] **AC-5: 入院モードで表示されるアクション**
  - **Given** `mode='inpatient'`
  - **When** アクションバーを確認
  - **Then** 「入退院指示」「隔離拘束指示」「看護ケア記録」「オーダー入力」「印刷」「終了」が表示

- [ ] **AC-6: 戻るリンクは遷移元へ戻る**
  - **Given** 外来一覧から遷移（`mode='outpatient'`）
  - **When** 「一覧に戻る」クリック
  - **Then** `/outpatient` に戻る
  - **Given** 病棟マップから遷移（`mode='inpatient'`）
  - **Then** `/` に戻る

- [ ] **AC-7: 患者ヘッダーには mode に応じた識別が表示される**
  - **Given** `mode='outpatient'`
  - **Then** 「外来」Chip（success）が表示される
  - **Given** `mode='inpatient'`
  - **Then** 「入院」Chip（primary）と病棟・病室番号が併記される

- [ ] **AC-8: フローシートタブは ep-10 を埋込で再利用する**
  - **Given** カルテ画面でフローシートタブを選択
  - **Then** `<FlowsheetPage embedded patientId={...} />` 相当が描画される
  - **Note**: ep-10 既実装 FlowsheetPage は `embedded` / `patientId` prop 対応済（HANDOVER の S3 申し送り参照）

- [ ] **AC-9: 設計ルール準拠**
  - design-rules.md §12（新設・mode 切替）に従う
  - §11（未保存検知）はタブ切替時にも適用

## 状態遷移 / バリデーション

mode 判定の決定木:

```text
遷移元 = 外来一覧 (/outpatient) ?
  ├─ Yes ─▶ mode = 'outpatient'
  └─ No
      └─ 遷移元 = 病棟マップ (/) or 入院患者一覧 (/patients) ?
          ├─ Yes ─▶ mode = 'inpatient'
          └─ No (直接 URL アクセス等)
              └─ Patient.admissionState で判定
                  ├─ 'outpatient' ─▶ mode = 'outpatient'
                  ├─ 'inpatient'  ─▶ mode = 'inpatient'
                  └─ 'discharged' ─▶ mode = 'inpatient'（既定。退院後は最後の在院 mode）
```

## 補足

- 段階 1 のスコープは **mode='outpatient' の実装と mode prop API の確立**。`mode='inpatient'` は段階 2 で追加（タブ枠の disabled 切替・テーマ切替の実装は段階 1 で済ませる）
- 戻る先判定: zustand `navigationSource`（既存 KarteAlphaPage パターン）を踏襲
- フローシート／看護過程／指示簿／指示状況／スケジュール の各タブ内コンポーネントは **本ストーリーではタブ枠と既存埋込のみ**。各タブの中身詳細は別ストーリー扱い（看護過程は ep-12〜14、指示簿系は別エピック）
- 既存 `OutpatientKartePage` は段階 1 終了時に撤去（撤去タイミングは _epic.md「残 PM 確認事項」#3）
- 既存 `src/components/karte/` の素材取込方針:
  - **PatientHeader**: tabColors hardcode は廃棄。design-rules §12（mode 識別 Chip）に置換
  - **ActionBar**: フッター固定の枠は流用可。ボタン配置は design-rules §3.2（MUI 標準）で再構成、mode 切替に対応
  - **LifeTimeline / MedicalInfo / MedicalRecords**: 診療録／患者情報タブの内部素材として取込候補。design-rules §1.3（Paper + outlined）への適合確認のうえ採否を決定
  - 上記は実装担当ワーカーが個別に判断し、不適合な場合は新規実装または差し替え

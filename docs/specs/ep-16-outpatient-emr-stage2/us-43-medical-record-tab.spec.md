# us-43 [外来・共通] 診療録タブ実装（カルテ記載 + 過去カルテ参照）

## メタ

| 項目 | 内容 |
| --- | --- |
| 対応エピック | [ep-16](./_epic.md) |
| 対応モック画面 | パス: `/karte/:patientId#medical-record`<br>実装: `src/components/karte/KartePage.tsx`（タブ分岐の差替）、`src/components/karte/MedicalRecordTab.tsx`（新規） |
| 想定ロール | 主治医、外来看護師、病棟看護師 |
| ステータス | draft |

### 参考システム / 参考仕様

| ソース | 用途 |
| --- | --- |
| `docs/gairai/features/medical-records.html` | 外来診療録（カルテ記載）の機能・アクション・API 仕様（一次ソース） |
| `docs/gairai/spec.html` | 共通 UI コンポーネント／フォーム入力／ファイルアップロード／キャンバス描画 |
| `src/components/karteAlpha/KarteAlphaPage.tsx` の `MedicalRecordsDense` | 既存モックの過去カルテタイムライン表示パターン（流用素材） |

### 段階 1〜2 のスコープ整合

- `mode='outpatient'`（外来）／`mode='inpatient'`（入院）両方で動作する。診療科分岐（外来診療科コード等）は段階 2 では未実装で OK
- 看護過程タブ（us-37）と分離。診療録タブは医師主体の SOAP 記載 + 過去カルテ参照に集中

## ユーザーストーリー

- **As a** 主治医・看護師
- **I want** カルテ画面の「診療録」タブで過去のカルテ記事を参照しつつ、新規 SOAP 記載・テンプレート挿入・ファイル添付・家系図／シェーマ描画ができる
- **So that** 外来 / 入院問わず一貫した UI でカルテ記載・参照を完結でき、KarteAlphaPage の診療録タブから新カルテ画面への置換準備（段階 3）が整う

## 画面要素（要素ツリー）

```text
- 診療録タブパネル（KartePage の tabId='medical-record' 分岐）
  - 上段: 過去カルテエリア
    - フィルタ Chip: 全て / 6 日分 / 入退院記録 / 看護記録 / 経過記録 等  (KarteAlphaPage の filterActive を踏襲)
    - 過去カルテリスト
      - エントリ:
        - 日付 + 時刻
        - カテゴリ Chip（色付き・参考実装と整合）
        - 記載者 (医師名 / 看護師名 + ロール)
        - 本文プレビュー（最初の 100 字 + 「展開」ボタン）
        - リビジョン履歴アイコン  (mock・クリックで未実装ダイアログ)
    - 「最初へ ▲」「続き ▼」ボタン  (ページング mock)
  - 中段: 新規記載エリア
    - テンプレート選択 SelectField  (mock 候補: 初診 SOAP / 再診 SOAP / 経過観察 / カンファ記録 等)
    - 「テンプレート挿入」ボタン
    - 複数セクション TextField（multiline）
      - S（主観的所見・症状）
      - O（客観的所見・所見）
      - A（評価・診断）
      - P（計画・処置）
    - 添付ファイル一覧
      - ドロップゾーン（PDF / JPG / PNG・mock・「アップロード」ボタンで snackbar）
      - 添付済ファイル（モック 1〜2 件・「ダウンロード」「削除」ボタン）
    - 描画エリア（家系図 / シェーマ）
      - 「家系図を描画」「シェーマを描画」ボタン（mock・クリックで「Fabric.js キャンバスを別ストーリーで実装予定」プレースホルダダイアログ）
      - 既存描画があれば read-only サムネイル表示（mock）
    - オーダー参照リンク（指示簿タブへの誘導）
      - 「指示簿タブを開く」ボタン（クリックで commitTab('orders')）
  - 下段: 診療録専用アクションバー
    - 保存                      (mock: snackbar 「保存しました」)
    - 診察終了                  (mock: 確認ダイアログ → snackbar)
    - 閉じる                    (未保存変更があれば確認ダイアログ・なければ commitTab で別タブに戻す)
    - 予約登録                  (mock: 「予約登録ダイアログを開く」プレースホルダ)
    - 印刷                      (mock: window.print() or snackbar)
    - 添付ファイル              (添付エリアにスクロール or アップロードボタン起動)
    - 家系図                    (描画エリアの家系図ボタンと同等)
    - シェーマ                  (同上)
```

> **デザイン方針**: 現行モックの `MedicalRecordsDense` / `BasicInfoSubview` / `KarteActionBar` と同じ MUI コンポーネント・design-rules v1.1 §3 / §6 / §10 / §11 に準拠する。新規外部コンポーネント（Fabric.js 等）は段階 2 では入れない。

## 振る舞い

- **タブ初期表示**: 過去カルテリストが上段に展開、新規記載エリアは折りたたみ展開可能（design-rules §3.3 開閉セクション踏襲）
- **テンプレート選択 + 挿入**: 選択 → 「挿入」ボタンで該当 SOAP セクションにテキストが投入される（既存テキストに append）
- **テキスト編集**: 各 SOAP セクションは `useDirtyForm` 系のパターンで dirty 検出。タブ離脱時に未保存検知ダイアログ（既存 KartePage の `attemptTabChange` フローに統合）
- **保存**: クリックで全 SOAP セクション + 添付モック情報を snackbar で「保存しました」通知。実際の永続化は未実装（mock）
- **過去カルテ展開**: 各エントリの「展開」ボタンで本文全文表示
- **ファイル添付**: ドラッグ & ドロップ もしくは「アップロード」ボタン（mock）。ファイル名・形式バリデーション表示のみ
- **家系図 / シェーマ**: ボタンクリックで「Fabric.js 描画キャンバスは別ストーリーで実装予定（gairai spec §9 参照）」のプレースホルダダイアログ
- **指示簿タブ誘導**: 「指示簿タブを開く」で同 KartePage 内の orders タブにスイッチ（commitTab('orders')）

## 受け入れ基準（AC）

- [ ] **AC-1: 診療録タブで過去カルテエリアが表示される**
  - **Given** KartePage の 診療録 タブを開いている
  - **Then** 過去カルテリストがフィルタ Chip + ページングボタン付きで表示される
  - **Then** 既存 mock データから 5 件以上のカルテ記事が表示される

- [ ] **AC-2: 新規記載エリアが SOAP 4 セクションで表示される**
  - **Then** S / O / A / P の 4 つの multiline TextField が縦に並ぶ
  - **Then** 各セクションは初期空欄、ヘルパーテキストで「主観的所見」等のラベル

- [ ] **AC-3: テンプレートを選択して挿入できる**
  - **Given** テンプレート SelectField から「初診 SOAP」を選択
  - **When** 「挿入」ボタンクリック
  - **Then** 該当 SOAP セクションにテンプレート文字列が append され、TextField の値が更新される

- [ ] **AC-4: 添付ファイルエリアが表示される（mock）**
  - **Then** ドロップゾーン + 既存添付モック 1〜2 件 が表示される
  - **When** 「アップロード」ボタンクリック
  - **Then** snackbar 「アップロード処理は別ストーリーで実装予定」が表示される
  - **対応形式表示**: PDF / JPG / PNG（gairai spec §8 整合）

- [ ] **AC-5: 家系図 / シェーマ描画ボタンがプレースホルダで動作する**
  - **When** 「家系図を描画」「シェーマを描画」ボタンクリック
  - **Then** 「Fabric.js キャンバスは別ストーリーで実装予定」のプレースホルダダイアログ表示

- [ ] **AC-6: 診療録専用アクションバーが 8 ボタンで構成される**
  - **Then** 保存 / 診察終了 / 閉じる / 予約登録 / 印刷 / 添付ファイル / 家系図 / シェーマ の順で配置
  - **Given** 各ボタンクリック → 対応する mock 動作（snackbar / ダイアログ / commitTab）

- [ ] **AC-7: 未保存検知が KartePage 共通フローと統合される**
  - **Given** SOAP セクションに編集を加えた dirty 状態
  - **When** 別メインタブクリック / 「閉じる」ボタン / 「一覧に戻る」
  - **Then** 既存 KartePage の `attemptTabChange` が dirty を検知して確認ダイアログを発火
  - 「破棄して進む」「編集に戻る」の挙動は patient-info タブと同等

- [ ] **AC-8: 「指示簿タブを開く」ボタンで commitTab('orders') が呼ばれる**
  - **When** クリック
  - **Then** メインタブが「指示簿」に切り替わり、URL ハッシュも `#orders` になる（履歴 push、AC-10 仕様準拠）

- [ ] **AC-9: design-rules 準拠**
  - §3（カード・アクションバー）／§6（タイポグラフィ・密度）／§10（破壊的アクション warning）／§11（未保存検知）／§12（mode 切替の Chip / テーマ）に準拠

## 状態遷移 / バリデーション

```text
新規記載エリア:
  clean ─編集─▶ dirty ─保存─▶ clean (snackbar)
                      ├─キャンセル（mock 未実装）─▶ clean
                      └─別タブクリック─▶ 確認ダイアログ
```

タブ切替の dirty 集約は KartePage `attemptTabChange` 既存フローを流用。診療録タブの dirty は新設 prop `onMedicalRecordDirty: (d: boolean) => void` で KartePage に上げる（patient-info タブと同パターン）。

## 補足

- **段階 2 でのスコープ縮約**:
  - リビジョン管理: 過去カルテエントリにアイコン表示のみ。クリックは未実装ダイアログ
  - Fabric.js 描画: ボタンとプレースホルダのみ（実装は別ストーリー）
  - ORCA 連携 / 実 API: 一切なし（gairai spec §10 / §6 はモック範囲外）
  - リアル永続化: snackbar のみ
- **既存 KarteAlphaPage `MedicalRecordsDense` の関係**: 過去カルテリスト UI は同コンポーネントから **意匠を流用**（カテゴリ別の色マッピング `RECORD_CATEGORY_COLORS` 等）するが、本 us では新規 `MedicalRecordTab.tsx` に閉じる形で再実装する。`MedicalRecordsDense` は KarteAlphaPage から引き続き使われるため触らない（段階 3 で撤去予定）
- **過去カルテのデータソース**: 既存 `mockData.ts` の `MEDICAL_RECORDS` / `NURSING_RECORDS` 等を統合表示（KarteAlphaPage と同データ）
- **隔離拘束指示リンク群**（`RestraintOrderLinks`）: us-36 サブ B で診療録カードへの埋込が決まっている。本 us とは **編集ファイルが重なる**（MedicalRecordTab に埋込 vs us-36 で同コンポーネントを移植）ため、**us-36 サブ B の進捗を見ながら最終配置を決める**。本 us では一旦リンク群を載せず、us-36 サブ B 完了時点で結合
- **共有ファイル変更**:
  - `src/components/karte/KartePage.tsx` の `KarteTabContent` の `medical-record` 分岐を `<MedicalRecordTab />` に差し替え
  - `src/components/karte/MedicalRecordTab.tsx`（新規）
  - `src/types/index.ts` / `src/data/mockData.ts` の `MASTER_*` は **触らない見込み**（既存 `MedicalRecord` 型 + `MEDICAL_RECORDS` モックで賄える）
  - 触る必要が出たら MASTER 待ち事項に起票

## 想定実装ステップ

1. `MedicalRecordTab.tsx` の枠組（過去カルテエリア + 新規記載エリア + アクションバー）
2. 過去カルテリストを `MedicalRecordsDense` の意匠流用で実装（フィルタ Chip / ページングボタン / カテゴリ色）
3. SOAP 4 セクション TextField を `useDirtyForm` 系で dirty 集約
4. テンプレート選択 SelectField + 挿入ロジック
5. 添付ファイルドロップゾーン + ボタン（mock）
6. 家系図 / シェーマ プレースホルダダイアログ
7. アクションバー 8 ボタン（保存 = snackbar / 印刷 = window.print() / 他は placeholder）
8. KartePage `KarteTabContent` の `medical-record` 分岐を差替、dirty を上げる prop 追加
9. KartePage `attemptTabChange` ダイアログに「診療録」も統合（既存 patient-info dirty 集約と同型）
10. 検証 → 完了報告（changes/ep-16 末尾に「## us-43 診療録タブ実装 完了メモ」追記）

## 注意（並行作業時）

- **us-36 サブ B（隔離拘束指示）と編集域が重なる**: `KartePage.tsx` の `KarteTabContent` 分岐／診療録カードへの `RestraintOrderLinks` 埋込位置。us-36 サブ B 着手時に MASTER で調整
- **段階 1 既存実装に影響しない**: フローシート / 患者情報 タブの埋込 API は変更なし

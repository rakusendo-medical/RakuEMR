# ep-03 入退院指示 — 改修一覧

## 対象

- 画面: `/karte-alpha/:patientId`（入口）+ `/admission`（一覧画面・連動）
- 実装: 入退院指示ダイアログ群（新規）
- 参照 spec: [docs/specs/ep-03-admission-discharge-order/](../specs/ep-03-admission-discharge-order/)

## サマリ

| ストーリー | 改修前 AC | 実装後 AC | 状態 |
| --- | --- | --- | --- |
| us-08 入院指示 | 0/12 | 12/12 | ✅ 完了（モック実装） |
| us-09 退院指示 | 0/14 | 14/14 | ✅ 完了（モック実装） |

## 既存実装と本エピックの関係

- `src/components/admission/AdmissionDischarge.tsx` のタブ 3「新規入退院指示」は簡易フォームのみ。本エピックで入院/退院指示ダイアログを新設し、入口は **カルテ画面（KarteAlphaPage）のクイック操作領域** に変更する
- ep-02 の `ADMISSION_ORDERS` を発生源としていた指示ストアに「指示」段階の登録機能を追加することで、ep-02 カレンダーへ自動反映させる
- カルテ画面の「指示」「指示簿」タブは `[変更]` `[中止]` の起点だが、本モックではクイック操作からのみダイアログを開く構成にする（タブ内連携は将来）

## 共通実装

### 新規ファイル

- `src/components/admission/AdmissionOrderDialog.tsx` — 入院指示ダイアログ（us-08）
- `src/components/admission/DischargeOrderDialog.tsx` — 退院指示ダイアログ（us-09）
- `src/components/admission/MedicalInstitutionSearchDialog.tsx` — 医療機関検索（us-08, us-09 共通）
- `src/components/admission/DeleteReasonDialog.tsx` — 削除理由／削除コメント（us-08, us-09 共通）

### 既存ファイル更新

- `src/components/karteAlpha/KarteAlphaPage.tsx` — クイック操作に「入院指示」「退院指示」ボタンを追加（退院指示は入院患者のみ表示）
- `src/components/admission/AdmissionDischarge.tsx` — タブ 3 を「指示登録への入口」に変更（カルテ画面へ誘導するメッセージ + 指示ダイアログ起動ボタン）
- `src/components/admission/OrderConfirmDialog.tsx` — リハビリ転帰区分「継続」の disable オプションを追加（既存実装は転帰区分を任意指定にしているが、退院確定時は必須化）

### モックデータ拡張（`src/data/mockData.ts`）

- `MEDICAL_INSTITUTIONS`: 医療機関一覧（検索ダイアログ用）
- `REFERRAL_ROUTES_ADMIT`: 入院紹介経路（6 区分、医療観察オプションは別配列）
- `REFERRAL_ROUTES_DISCHARGE`: 退院紹介経路（6 区分）
- `ADMIT_FORM_TYPES`: 入院形態（任意入院・医療保護入院・措置入院 等）
- `ADMIT_DOCS_BY_FORM`: 入院形態 → 入院時文書チェック群のマップ
- `DISCHARGE_DOCS_BY_CATEGORY`: 退院後診療区分（不要／通院／転院）→ 退院時文書チェック群のマップ
- `DELETE_REASON_CATEGORIES`: 削除理由分類（マスタ）
- `REHAB_OUTCOME_CATEGORIES`: リハビリ転帰区分（「継続」を含むが選択不可フラグ）
- `THERAPY_HISTORY_SAMPLES`: 治療歴サンプル（治療歴複写用、患者IDキー）

### ストア拡張（`src/stores/useAppStore.ts`）

- `pendingOrders: Map<string, { type: '入院'|'退院'; data: ... }>` — 「指示」段階の登録結果（カレンダー反映用）
- `addPendingAdmissionOrder(order)` / `addPendingDischargeOrder(order)`
- `cancelOrder(orderId, reason)`

### オプション機能トグル（モック）

- `optionalFeatures: { medicalProtection: boolean; psychiatricLink: boolean }` — 医療観察法／外部精神科システム連携の有無切替

## 画面別変更

### `src/components/karteAlpha/KarteAlphaPage.tsx`

- クイック操作領域（既存 QUICK_ACTIONS）に追加:
  - 「入院指示」ボタン → AdmissionOrderDialog を開く
  - 「退院指示」ボタン (入院患者のみ表示) → DischargeOrderDialog を開く
- 患者の在床状態（`bed.status` または `Patient.status`）から「入院患者」判定し、退院指示ボタンの表示制御
- 外出中判定（`Patient.status === 'outing'`）を退院指示ダイアログに渡す

### `src/components/admission/AdmissionOrderDialog.tsx`

- フォーム要素: 入院日 / 食事開始日 / 病室情報（仮病棟可・空床照会連携） / 備考 / 入院形態 / 入院時文書チェック群（形態連動） / 紹介元医療機関＋検索＋治療歴複写 / 紹介経路 / 入院決定理由 / 入院後の診療 / 指示内容 / 指示箋印刷チェック
- 操作ボタン: 指示 / 入院確定 / 変更 / 中止 / キャンセル
- 入院確定 → OrderConfirmDialog (kind=admission) → 状態反映
- 変更/中止 → 既存指示閲覧時のみ表示

### `src/components/admission/DischargeOrderDialog.tsx`

- フォーム要素: 退院日 / 転帰 / 食事終了日（自動連動・編集可否） / 備考 / 退院後診療区分 / 退院時文書チェック群（区分連動） / 紹介先医療機関＋検索＋治療歴複写 / 紹介経路 / 退院決定理由 / 退院後の診療 / カルテ記載 / 指示箋印刷チェック
- 操作ボタン: 指示 / 退院確定 / 変更 / 中止 / キャンセル
- 退院確定 → OrderConfirmDialog (kind=discharge) → 状態反映、入院専用オーダ自動削除通知
- 外出中の患者: 退院確定不可（無効化 + 警告 Alert）

### `src/components/admission/MedicalInstitutionSearchDialog.tsx`

- キーワード入力 + 結果リスト
- 行クリックで親ダイアログに値返却

### `src/components/admission/DeleteReasonDialog.tsx`

- 分類セレクト（必須）+ 理由テキスト + 削除指示箋印刷チェック
- onConfirm(reason) でクローズ

## 着手順序（提案）

1. モックデータ拡張（医療機関・紹介経路・入院形態・文書マップ・削除理由・治療歴）
2. ストア拡張（pendingOrders + オプション機能トグル）
3. MedicalInstitutionSearchDialog
4. DeleteReasonDialog
5. AdmissionOrderDialog（フォーム + 指示/確定/変更/中止）
6. DischargeOrderDialog（食事終了日連動 + 外出中判定）
7. OrderConfirmDialog 改修（リハビリ「継続」disable）
8. カルテ画面のエントリーボタン追加
9. AdmissionDischarge タブ 3 の差し替え

## 完了確認

各 spec の AC チェックリストを全件チェックした時点でクローズ。

## 実装後メモ（2026-05-02）

### 追加・変更ファイル

- `src/data/mockData.ts` — `MEDICAL_INSTITUTIONS`, `REFERRAL_ROUTES_*`, `ADMIT_FORM_TYPES`, `ADMIT_DOCS_BY_FORM`, `DISCHARGE_DOCS_BY_CATEGORY`, `DELETE_REASON_CATEGORIES`, `REHAB_OUTCOME_OPTIONS`, `THERAPY_HISTORY_SAMPLES` を追加
- `src/stores/useAppStore.ts` — `optionalFeatures`（医療観察法/精神科連携）と `pendingOrders` ストア（「指示」段階の登録結果）を追加
- `src/components/admission/AdmissionOrderDialog.tsx` — 新規（us-08）
- `src/components/admission/DischargeOrderDialog.tsx` — 新規（us-09）
- `src/components/admission/MedicalInstitutionSearchDialog.tsx` — 新規（共通）
- `src/components/admission/DeleteReasonDialog.tsx` — 新規（共通、入院/退院でラベルとオプション項目切替）
- `src/components/admission/OrderConfirmDialog.tsx` — リハビリ転帰区分に「継続（選択不可）」を表示、必須化＋未入力で確定不可に変更
- `src/components/admission/AdmissionDischarge.tsx` — タブ 3 を「カルテ画面誘導 + カレンダーへの戻り口」に置換、ヘッダーにオプション機能トグル（医療観察法/精神科連携）を追加
- `src/components/admission/AdmissionScheduleCalendar.tsx` — `pendingOrders` ストアを参照し、「指示」段階で登録された患者をカレンダー（赤字）と日付未定者パネルに反映
- `src/components/karteAlpha/KarteAlphaPage.tsx` — クイック操作バーに「入院指示」「退院指示（入院患者のみ）」ボタンを追加。両ダイアログを起動

### 実装上の判断・割り切り

- **「指示」段階の登録は本セッションのみ保持**: `useAppStore.pendingOrders` は永続化なし。リロードでクリア。本実装はカレンダー反映の挙動確認用
- **食事時間帯マスタの代替**: `MEAL_SLOTS = [朝食 08:00, 昼食 12:00, 夕食 18:00]` をハードコード。AC-2/AC-4 は当日入院時の現在時刻直前以前を選択不可としマスタ依存挙動を再現
- **「食無し／臨時欠食」自動生成**: モックでは Alert 通知のみ。実際の指示生成は対応エピックで実装
- **入院定時オーダの中止日設定**: 退院指示ダイアログ内のセレクト（当日以降 / 翌日以降）でモック切替。退院確定スナックバーに反映文言を含めた
- **医療観察法・精神科連携**: いずれもオプション機能トグル（AdmissionDischarge ヘッダー）でセッション切替可
- **入退院歴・治療歴への書込**: 確定スナックバーで文言通知のみ。データ反映は ep-04 にて

### 残課題（次イテレーションで検討）

- 既存指示の「変更／中止」起点を診療録／指示簿タブに用意（現状はクイック操作のみ）
- カルテ画面の患者状態判定（入院中／外来中）を Patient データ拡張で正規化（現状は `status !== 'empty'` の暫定判定）
- pendingOrders の永続化・確定後の自動除去
- 中止箋／削除箋／移動削除箋／食事指示削除箋の印刷フローの一元化

### 動作確認

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン

### UI 動作確認は未実施

ブラウザでの実操作確認は未実施。各ダイアログのフィールド配置、選択不可表示、オプション機能切替時の表示差分などは目視確認推奨です。

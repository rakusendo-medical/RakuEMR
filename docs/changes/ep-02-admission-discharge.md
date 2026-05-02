# ep-02 入退院手続き — 改修一覧

## 対象

- 画面: `/admission`
- 実装: `src/components/admission/AdmissionDischarge.tsx`
- 参照 spec: [docs/specs/ep-02-admission-discharge/](../specs/ep-02-admission-discharge/)

## サマリ

| ストーリー | 改修前 AC | 実装後 AC | 状態 |
| --- | --- | --- | --- |
| us-05 入院手続き | 0/9 | 9/9 | ✅ 完了（モック実装） |
| us-06 退院手続き | 0/10 | 10/10 | ✅ 完了（モック実装） |
| us-07 入退院情報 | 0/7 | 7/7 | ✅ 完了（モック実装） |

## 既存実装と本エピックの関係

`src/components/admission/AdmissionDischarge.tsx` は現状 4 タブ構成（入退院一覧・入院歴・移動歴・新規入退院指示）。本エピックは:

- **タブ 0 「入退院一覧」を「入退院情報（カレンダー）」に置換** — us-07 の主要画面
- **新規ダイアログ群を追加** — 入院手続き／退院手続き／オーダ確認／代行入力認証／空床照会
- **タブ 1〜3 はそのまま残置** — それぞれ ep-04（入院歴・移動歴）・ep-03（新規入退院指示）の対象。これらは当該エピックで再整理する

## 画面: `src/components/admission/AdmissionDischarge.tsx`

### 改修項目

#### [us-07] タブ 0 を入退院情報カレンダーに置換

- 既存テーブル表示を撤去し、カレンダーレイアウトに置換
- ヘッダー: 病棟プルダウン（全病棟／第１／第２）+ 種別タブ（入院予定／退院予定）+ カレンダーナビ（<<／現在／>>）+ 表示中年月
- カレンダー本体: 月マス（日〜土の 7 列）、各マスに予定患者リスト
- 患者表示色: 確定済 = 青／黒、未確定 = 赤
- 日付未定者パネル: カレンダー右側 or 下部に固定
- 凡例: カレンダー下部に色対応表

#### [us-05] 入院手続きダイアログ新設

- 新規コンポーネント: `src/components/admission/AdmissionConfirmDialog.tsx`
- フォーム要素: 入院日 / 食事開始日 / 病室セレクト（仮病棟対応） / メモ / 入院時文書チェック群 / 紹介医療機関 / 入院決定理由 / 指示内容 / 入院確定時の記事 / 指示箋印刷チェック
- アクション: 更新 / 入院確定 / キャンセル / 空床照会
- バリデーション: 入院日 ≤ 現在 で確定可、食事開始日 ≥ 入院日

#### [us-06] 退院手続きダイアログ新設

- 新規コンポーネント: `src/components/admission/DischargeConfirmDialog.tsx`
- フォーム要素: 退院日 / 転帰 / 食事終了日（食事を伴わない退院日では disabled） / メモ / 退院時文書チェック群 / 紹介医療機関 / 退院決定理由 / 指示内容 / 退院確定時の記事 / 帰住先 / 指示箋印刷チェック
- アクション: 更新 / 退院確定 / キャンセル
- バリデーション: 退院日 ≤ 現在 で確定可、食事終了日 ≤ 退院日

#### [us-05/us-06] オーダ確認ダイアログ新設（共通）

- 新規コンポーネント: `src/components/admission/OrderConfirmDialog.tsx`
- 入院確定時: 未実施の外来専用オーダ一覧
- 退院確定時: 未実施の入院専用オーダ + 移動・給食オーダ + リハビリ転帰区分
- アクション: 中止確定 / スキップ

#### [us-05/us-06] 代行入力認証ダイアログ新設

- 新規コンポーネント: `src/components/admission/ProxyAuthDialog.tsx`
- 操作者ロールの仮想切替（モックでは `useAppStore` に `currentUserRole: 'doctor' | 'staff'` を追加）

#### [us-05] 空床照会ダイアログ

- ep-01 の `RelatedFeatureDialogs.tsx` 内 VacancyContent を再利用
- ダイアログ起動関数を export して入院手続きから呼び出す形にする

### モックデータ拡張

- `ADMISSION_ORDERS` を本日（2026-05-02）周辺に拡張：未確定（指示済）と確定済（手続完了）が当月内に混在するよう日付を再設定
- 日付未定者用のサンプル（既存 `UNASSIGNED_PATIENTS` を流用または別途追加）
- 未実施の外来オーダ／入院オーダ（オーダ確認ダイアログ用のサンプル）

### ストア拡張

- `currentUserRole: 'doctor' | 'staff'`（モックの代行認証フロー切替用）
- 確定操作の結果ストア（`confirmedAdmissions`, `confirmedDischarges`）— カレンダー再描画用

### ナビゲーション連携

- ep-01 の関連機能ダイアログ「入退院情報」スタブから本画面（`/admission`）への遷移を追加
- 病棟マップの患者操作メニューから入院／退院手続きダイアログを直接起動する導線（フェーズ 2 検討）

## 着手順序（提案）

1. モックデータ拡張（ADMISSION_ORDERS の日付シフト + 外来/入院オーダサンプル）
2. ストア拡張（currentUserRole + 確定状態の保持）
3. [us-07] カレンダー本体（CalendarGrid + 病棟プルダウン + 種別タブ + 凡例 + 日付未定者）
4. [us-05] 入院手続きダイアログ（フォーム + 空床照会連携）
5. [us-06] 退院手続きダイアログ（食事終了日連動）
6. [us-05/06] オーダ確認ダイアログ
7. [us-05/06] 代行入力認証ダイアログ
8. ナビゲーション連携（ep-01 → ep-02）

## 完了確認

各 spec の AC チェックリストを全件チェックした時点でクローズ。

## 実装後メモ（2026-05-02）

### 追加・変更ファイル

- `src/data/mockData.ts` — `ADMISSION_ORDERS` を 2026-05 周辺に再構成（指示済／手続完了／日付未定 を混在）。`PendingOrderSample` 型と `PENDING_ORDERS_SAMPLES`（オーダ確認ダイアログ用）追加
- `src/stores/useAppStore.ts` — `currentUserRole`（doctor/staff）、`confirmedAdmissionIds`、`confirmAdmission`/`confirmDischarge` 追加
- `src/components/admission/AdmissionDischarge.tsx` — タブ 0 を新カレンダー画面に差し替え。操作者ロール切替トグルをヘッダーに追加。タブ 1〜3（入院歴・移動歴・新規入退院指示）は ep-03/ep-04 のスコープのため残置
- `src/components/admission/AdmissionScheduleCalendar.tsx` — 新規。月カレンダー / 病棟プルダウン / 種別タブ / カレンダーナビ / 日付未定者パネル / 凡例 / 確定済→カルテ遷移 / 未確定→各手続きダイアログ
- `src/components/admission/AdmissionConfirmDialog.tsx` — 新規。入院手続きフォーム + 仮病棟チェック + 空床照会連携 + 未来日時抑止 + オーダ確認ダイアログ連携 + 代行認証連携
- `src/components/admission/DischargeConfirmDialog.tsx` — 新規。退院手続きフォーム + 食事終了日連動・編集可否制御 + 「食無し」自動生成案内 + オーダ確認（リハビリ転帰区分含む）+ 代行認証連携
- `src/components/admission/OrderConfirmDialog.tsx` — 新規（入院/退院共通）
- `src/components/admission/ProxyAuthDialog.tsx` — 新規
- `src/components/wardMap/RelatedFeatureDialogs.tsx` — 「入退院情報画面で開く」ボタンを追加（`/admission` へ遷移）

### ロール切替について

代行入力認証フローの動作確認のため、画面ヘッダーに `操作者ロール（モック切替）` トグル（医師／事務）を配置しています。デフォルトは「事務」。「医師」に切り替えると食事日時変更時の代行認証ダイアログが省略されます。本実装では同トグルが残置されますが、本番運用ではログインユーザーのロールを参照するべき項目です。

### 残課題（次イテレーションで検討）

- 入院確定後にカルテ画面・医師指示簿への書込（モックでは `confirmedAdmissionIds` ストアのみ。書込先は対応エピックで実装）
- 退院確定後の未実施移動・給食オーダ削除のデータ反映（モックではメッセージ通知のみ）
- 期限管理マスタ・医療機関情報マスタ・食事時間設定の取り込み（現状はダミー値）
- 病棟マップ患者操作メニューからの直接起動（フェーズ 2）

### 動作確認

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン
- `npx vite` 起動 + 主要モジュール（`AdmissionDischarge.tsx`, `AdmissionScheduleCalendar.tsx`, `AdmissionConfirmDialog.tsx`, `DischargeConfirmDialog.tsx`）の HTTP 200 を確認

### UI 動作確認は未実施

ブラウザでの実操作確認は未実施。各ダイアログの開閉・フォーカス挙動、カレンダーの日付配置、未来日時のエラー表現などは目視で要確認です。

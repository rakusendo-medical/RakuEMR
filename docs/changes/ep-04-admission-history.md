# ep-04 入退院歴 — 改修一覧

## 対象

- 画面: `/admission`（タブ「入院歴」「移動歴」）
- 実装: `src/components/admission/AdmissionHistoryView.tsx`（新規）／`AdmissionDischarge.tsx` から呼び出し
- 参照 spec: [docs/specs/ep-04-admission-history/](../specs/ep-04-admission-history/)

## サマリ

| ストーリー | 改修前 AC | 想定実装後 AC | 改修ボリューム |
| --- | --- | --- | --- |
| us-10 入院歴・退院歴 | 0/11 | 11/11 | 大（左右ペイン UI + 5 ダイアログ + 形態変更ロジック） |

## 既存実装と本エピックの関係

- `src/components/admission/AdmissionDischarge.tsx` のタブ 1「入院歴」は現状フラットなテーブル表示。ep-04 で **左ペイン履歴リスト + 右ペイン詳細** 構成に置換する
- タブ 2「移動歴」は既存のフラット表示を維持しつつ、入院歴ビューから「移動歴」リンクで遷移できるようにする
- ep-02/03 の確定操作で入院歴が自動生成される設計を、本実装で `useAppStore` のストアに反映できるようにする（ストア書込は ep-02/03 ダイアログから実施済の `confirmedAdmissionIds` を流用、より構造化したい場合は別途 admissionHistory 派生計算）

## 共通実装

### 新規ファイル

- `src/components/admission/AdmissionHistoryView.tsx` — メインビュー（左右ペイン + ヘッダー）
- `src/components/admission/AdmitFormChangeDialog.tsx` — 入院形態変更ダイアログ

### 既存ファイル更新

- `src/components/admission/AdmissionDischarge.tsx` — タブ 1 を新ビューに差し替え
- `src/types/index.ts` — `AdmissionHistory` を ep-04 仕様に合わせて拡張（admitForm / admitReason / dischargeReason / dischargeCategory / outcome / postDischargeAction / returnTo / periodId / isAdmitFormChange）
- `src/data/mockData.ts` — `ADMISSION_HISTORY` を新スキーマに移行、形態変更チェーンのサンプルを 1〜2 件追加。`MASTER_RESIDENCE_TYPES`（住居区分マスタ）を追加

### モックデータ拡張

- 各 ADMISSION_HISTORY レコードに以下を追加:
  - `periodId`: 入院期間の識別子（同一期間内の形態変更レコードは同 ID）
  - `admitForm`: 入院形態（任意入院／医療保護入院 等）
  - `admitReason`, `dischargeReason`, `dischargeCategory`, `outcome`, `postDischargeAction`, `returnTo`
  - `isAdmitFormChange`: 形態変更レコードか
- 形態変更チェーンのサンプル: P003 鈴木一郎 で 任意入院 → 医療保護入院 → 措置入院 の遷移を表現
- 住居区分マスタ: `MASTER_RESIDENCE_TYPES = ['自宅', 'グループホーム', '老人ホーム', '転院先', '不明', 'その他']`

### ストア拡張

- 必要に応じて `dynamicAdmissionHistory: Record<patientId, AdmissionHistory[]>` を追加（形態変更・取消の動的反映用）。形態変更登録・取消で更新

## 画面別変更

### `src/components/admission/AdmissionHistoryView.tsx` (新規)

- ヘッダー領域: 患者選択セレクト + 入院時/退院時タブ + 関連履歴リンク（食事歴/移動歴/隔離歴）
- 左ペイン: 入院期間グループ × 形態レコード（admitDate 昇順、最新が最下部）
- 右ペイン: 詳細フォーム（入院時/退院時タブで切替）+ 操作ボタン群

### `src/components/admission/AdmitFormChangeDialog.tsx` (新規)

- 新形態セレクト（ADMIT_FORM_TYPES 再利用）
- 形態変更日時 (datetime-local)
- 入院時文書チェック群（ADMIT_DOCS_BY_FORM 再利用）
- 操作: 登録（旧形態の dischargeDate を更新 + 新形態レコード追加）/ キャンセル

### `src/components/admission/AdmissionDischarge.tsx`

- タブ 1「入院歴」を `<AdmissionHistoryView />` に置換
- タブ 2「移動歴」: 既存フラット表示を維持（ep-04 のスコープ外、リンク先として残置）
- タブ 3「新規入退院指示」: 既存の誘導表示を維持

### 関連履歴リンクの遷移先

- 食事歴: 別エピック未割当のためスナックバー通知のみ（実装エピック決定次第差替）
- 移動歴: タブ 2 に切替（同画面内）
- 隔離歴: ep-08 隔離拘束歴で本実装。本エピックではスナックバー通知

## 後方統合（後回し項目の引き受け）

ep-01/02/03 の改修で本エピックに振った項目を、本実装と並行で対応する：

| 項目 | 対応 |
| --- | --- |
| us-02 履歴欄からの更新／削除フロー | 本ビューに集約せず、移動歴タブをリンク先として残置（移動編集 UI は別途検討） |
| us-02 移動取消時の病床自動有効化 | 移動歴タブ側の取消フローでマスタ更新（モックでは通知のみ） |
| `Patient.admissionState` の動的切替 | 入院取消/退院取消で admissionState を更新する経路を追加（store の `setPatientAdmissionState` を新設、もしくは派生計算に切替） |

`Patient.admissionState` の dynamic 切替は本エピック内では「派生計算（ADMISSION_HISTORY と pendingOrders から導出）」を優先し、Patient 型のミューテーションは行わない方針とする。

## 着手順序

1. types 拡張 + mockData 拡張（ADMISSION_HISTORY 新スキーマ、形態変更サンプル、住居区分マスタ）
2. AdmissionHistoryView の骨格（ヘッダー + 左右ペイン + 患者選択 + 形態レコードクリック）
3. 詳細ペイン（入院時/退院時タブ + フォーム + 登録ボタン）
4. AdmitFormChangeDialog（形態変更）
5. 取消フロー（変更取消 / 入院取消 / 退院取消、DeleteReasonDialog 再利用）
6. 関連履歴リンク（食事歴/移動歴/隔離歴）
7. AdmissionDischarge タブ 1 への組み込み
8. screen-mapping.tsv 更新

## 完了確認

各 spec の AC チェックリストを全件チェックした時点でクローズ。

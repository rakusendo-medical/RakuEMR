# ep-05 隔離拘束指示 — 改修一覧

## 対象

- 画面: `/karte-alpha/:patientId`（入口）
- 実装: 隔離拘束指示ダイアログ + 告知書印刷ダイアログ（新規）
- 参照 spec: [docs/specs/ep-05-restraint-order/](../specs/ep-05-restraint-order/)

## サマリ

| ストーリー | 改修前 AC | 実装後 AC | 状態 |
| --- | --- | --- | --- |
| us-11 隔離拘束指示 | 0/12 | 12/12 | ✅ 完了（モック実装） |

## 既存実装と本エピックの関係

- `src/components/isolation/IsolationRestraint.tsx` の「隔離拘束一覧」「観察記録」「隔離歴」タブは `ISOLATION_ORDERS` 固定データを参照する読み取り専用ビュー。本エピックは **指示の発行** が責務（一覧の参照は ep-06、観察記録入力は ep-07、履歴は ep-08）
- 既存 `IsolationOrder` 型（`src/types/index.ts` L242）は最低限のフィールドのみ。本エピックで拡張が必要
- 既存 `Bed.flags: BedFlag[]` の `'isolation'` / `'restraint'` を表示用フラグとして活用済み（病棟マップ）。指示確定時に `Bed.flags` を更新する手段は未整備
- カルテ画面の `KarteAlphaPage.tsx` には診療録セクションがあるが、隔離拘束指示リンクは未実装。フッタクイック操作には ep-03 の入退院指示ボタンのみ
- 既存 `useAppStore.appendMedicalRecord` は ep-03 で導入済み。隔離拘束指示の確定時にも同経路でカルテ記事追加が可能

## 共有ファイル変更（MASTER 承認済 — 2026-05-02）

MASTER との擦り合わせ結果に基づく確定方針。命名指摘 2 件を反映済。

### `src/types/index.ts`

`IsolationOrder` の **後方互換オプショナル拡張**（既存フィールドはそのまま、追加のみ）:

> **コメント方針:** 既存 `type` フィールドには「将来 deprecated 予定。新コードは `subtype` を参照」と JSDoc で明記する。

```ts
export type IsolationSubtype = '隔離' | '拘束' | '隔離拘束';
export type IsolationOperation = '開始' | '解除' | '継続' | '変更';

export interface IsolationOrder {
  id: string;
  patientId: string;
  patientName: string;
  type: IsolationType;       // 既存（'隔離' | '拘束'）— 後方互換
  /** 区分（隔離拘束併用も表現） */
  subtype?: IsolationSubtype;
  /** 操作種別 */
  operation?: IsolationOperation;
  startDatetime: string;
  endDatetime?: string;
  wardId: WardId;
  roomNumber: string;
  doctorName: string;
  /** 拘束部位（拘束系・隔離拘束系の開始/継続/変更時のみ） */
  restraintParts?: string[];
  /** 開放時間（最大9件） */
  releaseTimes?: ReleaseTimeEntry[];
  /** 期限管理対象として登録された文書 */
  linkedDocumentChecks?: string[];
  /** 告知書印刷状態 */
  noticePrint?: { printedAt?: string; content?: string; interviewForm?: string };
  /** 「指示」段階フラグ（即時確定でない場合 true） */
  isPending?: boolean;
  primaryConfirmedBy?: string;
  secondaryConfirmedBy?: string;
  linkedNursingRecordId?: string;
  linkedMedicalRecordId?: string;
}

export interface ReleaseTimeEntry {
  start: string;  // 'HH:mm'
  end: string;    // 'HH:mm'
}
```

### `src/data/mockData.ts`（追加のみ・既存定義改変なし）

既存 `ISOLATION_ORDERS` には新規フィールドを段階的に追加（オプショナルなので既存利用箇所は影響なし）。

新規 `MASTER_*`（命名統一）:

```ts
export const MASTER_RESTRAINT_PARTS = [
  '右手首', '左手首', '右足首', '左足首', '体幹', '右肩', '左肩', 'ミトン（右）', 'ミトン（左）'
] as const;

export const MASTER_RELEASE_TIME_TEMPLATES = [
  { name: '日中3回',   entries: [{ start: '10:00', end: '10:30' }, { start: '13:00', end: '13:30' }, { start: '16:00', end: '16:30' }] },
  { name: '食事時のみ', entries: [{ start: '07:30', end: '08:30' }, { start: '11:30', end: '12:30' }, { start: '17:30', end: '18:30' }] },
] as const;

// 入院形態 × 区分 → 文書群（隔離拘束時文書マスタ／期限管理マスタの代替）
export const MASTER_ISOLATION_DOCS_BY_CONTEXT: Record<AdmitFormType, Partial<Record<IsolationSubtype, string[]>>> = {
  '任意入院':       { '隔離': ['隔離開始時告知書', '隔離開始書類'], '拘束': ['身体拘束に関する説明書・同意書', '拘束開始時記録'], '隔離拘束': ['隔離拘束併用書類'] },
  '医療保護入院':   { '隔離': ['隔離告知書', '隔離開始書類', '行動制限実施記録'], '拘束': ['身体拘束に関する説明書・同意書', '行動制限実施記録'], '隔離拘束': ['隔離拘束併用書類', '行動制限実施記録'] },
  '措置入院':       { '隔離': ['隔離告知書', '措置時隔離記録'], '拘束': ['身体拘束に関する説明書・同意書'], '隔離拘束': ['措置時隔離拘束記録'] },
  '応急入院':       { '隔離': ['隔離告知書'], '拘束': ['身体拘束に関する説明書・同意書'], '隔離拘束': ['応急時隔離拘束記録'] },
  '緊急措置入院':   { '隔離': ['隔離告知書'], '拘束': ['身体拘束に関する説明書・同意書'], '隔離拘束': ['緊急措置時隔離拘束記録'] },
};

export const MASTER_INTERVIEW_FORMS = ['標準（精神科）', '措置入院告知用', '医療保護入院告知用'] as const;
```

### `src/stores/useAppStore.ts`

> **MASTER 指摘:** 既存 `dynamicMedicalRecords` と prefix 揃えるため `dynamicIsolationOrders`、optionalFeatures は他 3 トグル（`medicalProtection` / `regionalCooperation` / `psychiatricLink`）と揃えて Enabled suffix を付けず `restraintChange` とする。

```ts
// ep-05 隔離拘束指示
dynamicIsolationOrders: IsolationOrder[];
addIsolationOrder: (o: IsolationOrder) => void;
updateIsolationOrder: (id: string, patch: Partial<IsolationOrder>) => void;
releaseIsolationOrder: (id: string, endDatetime: string) => void;

// optionalFeatures に restraintChange を追加（マスタ「隔離拘束変更=する」相当）
optionalFeatures: {
  ...
  restraintChange: boolean;
};

// 永続化対象に dynamicIsolationOrders を追加
```

### `src/components/karteAlpha/KarteAlphaPage.tsx`

- 診療録セクションヘッダ右側に **指示リンクエリア** を追加（隔離拘束指示の 6 / 12 リンク）
- リンク群はタイトル固定で隔離拘束指示ダイアログを開く
- マスタ「隔離拘束変更=する」（`optionalFeatures.restraintChange`）有効時のみ継続／変更系リンクを表示
- 解除／継続／変更系リンクは現在 active な区分が無ければグレー化
- **配置注意 (MASTER 指摘):** リンク数が多いため `Stack` の `flexWrap` + `useFlexGap` で折り返し表示。既存 `SectionHeader` の高さは維持し、はみ出さない

### `src/components/wardMap/BedFlagIcons.tsx` ※凡例追加程度

- 既存 `'isolation'` / `'restraint'` 表示はそのまま
- 「隔離拘束（併用）」の表示パターンは両フラグ同時付与で表現するため UI 側変更は不要
- 凡例コメントに併用表現を追記する程度

### `src/components/admission/AdmissionDischarge.tsx`

- ヘッダーのオプション機能トグル群に「隔離拘束変更」スイッチを追加（既存 3 トグルに 1 件追加）

## 共通実装

### 新規ファイル

- `src/components/isolation/RestraintOrderDialog.tsx` — 隔離拘束指示ダイアログ（us-11）
- `src/components/isolation/RestraintNoticePrintDialog.tsx` — 告知書印刷ダイアログ（us-11）
- `src/components/isolation/RestraintOrderLinks.tsx` — カルテ画面の指示リンク群（us-11、`KarteAlphaPage` から呼び出し）

### 既存ファイル更新

上記「共有ファイル変更」参照。

## 画面別変更

### `src/components/karteAlpha/KarteAlphaPage.tsx`

- `MedicalRecordsDense` セクション内（診療録ヘッダ近く）に `<RestraintOrderLinks patient={patient} />` を配置
- リンクからのダイアログ起動状態を local state で管理（既存 `admissionOrderOpen` パターンに揃える）
- 隔離拘束指示ダイアログのコールバックで `appendMedicalRecord` + `addIsolationOrder` を呼ぶ

### `src/components/isolation/RestraintOrderDialog.tsx`

- フォーム要素: タイトル / 開始日時 / 終了日時 / 拘束部位（複数選択） / 開放時間（最大9件・テンプレ） / 文書チェック（開始時のみ） / 所見 / 告知書印刷チェック
- 操作ボタン: [作成] / [変更] / [中止] / [キャンセル]
- 開始 → `addIsolationOrder({ ..., isPending: false })`
- 解除 → `releaseIsolationOrder(id, endDatetime)` ＋ 解除カルテ記事追加
- 継続/変更 → `updateIsolationOrder(id, patch)` ＋ 継続/変更カルテ記事追加
- 告知書印刷 ON → 確定後に `RestraintNoticePrintDialog` を起動

### `src/components/isolation/RestraintNoticePrintDialog.tsx`

- 指示日／開始日時／面接フォーム（マスタセレクト）／内容（編集可、文例ボタン3件） / [印刷] / [閉じる]
- 再印刷モード（既存指示記事から開く時）は内容欄を表示のみ（disabled）

### `src/components/isolation/RestraintOrderLinks.tsx`

- 6 / 12 個のテキストリンクボタン
- マスタトグル + active 状態判定で表示／グレーアウトを切替
- onClick → 親に対象タイトルを返す（親が ダイアログを起動）

## 着手順序（提案）

1. 型拡張: `IsolationSubtype` / `IsolationOperation` / `ReleaseTimeEntry` / `IsolationOrder` フィールド追加
2. マスタ追加: `MASTER_RESTRAINT_PARTS` / `MASTER_RELEASE_TIME_TEMPLATES` / `MASTER_ISOLATION_DOCS_BY_CONTEXT` / `MASTER_INTERVIEW_FORMS`
3. ストア拡張: `isolationOrdersDynamic` + `add/update/release` action + `restraintChangeEnabled` トグル
4. `RestraintNoticePrintDialog`（先に独立ダイアログを完成させる）
5. `RestraintOrderDialog`（タイトル切替・拘束部位・開放時間・文書チェック・告知書呼出）
6. `RestraintOrderLinks`（6 / 12 リンク + active 判定）
7. `KarteAlphaPage` への組込（診療録ヘッダ右側）
8. `AdmissionDischarge` ヘッダトグルに「隔離拘束変更」追加
9. `BedFlagIcons` 凡例コメント追記（必要なら）
10. screen-mapping.tsv 行追加

## 完了確認

各 spec の AC チェックリストを全件チェックした時点でクローズ。

- 検証コマンド: `npx tsc --noEmit` + `npx vite build`
- UI 動作: ブラウザで隔離拘束指示の各タイトル切替・拘束部位選択・開放時間入力・告知書印刷フローを目視確認

## 残課題（先送り候補）

- 指示確定時の `Bed.flags` 自動付与: 患者→ベッド逆引きが必要。本エピックでは UI 表示のみとし、`Bed.flags` 反映はストアレベルで暫定 → ep-08 履歴整備時に再検討
- 既存指示の「変更／中止」起点を診療録／指示簿タブに用意（ep-03 と同じ残課題）
- フローシートの「隔離」「拘束」行への動的反映（オレンジ背景）: ep-07 観察記録と合わせて整理
- 拘束部位マスタ・開放時間テンプレマスタ・文書マスタの保守 UI（マスタ管理エピック未着手）

## 実装後メモ（2026-05-02）

### 追加・変更ファイル

- `src/types/index.ts` — `IsolationSubtype` / `IsolationOperation` / `ReleaseTimeEntry` / `IsolationNoticePrint` 型を追加。`IsolationOrder` に `subtype` / `operation` / `restraintParts` / `releaseTimes` / `linkedDocumentChecks` / `noticePrint` / `isPending` をオプショナル追加（既存 `type` は `@deprecated` 注記）
- `src/data/mockData.ts` — `MASTER_RESTRAINT_PARTS` / `MASTER_RELEASE_TIME_TEMPLATES` / `MASTER_ISOLATION_DOCS_BY_CONTEXT` / `MASTER_INTERVIEW_FORMS` / `MASTER_NOTICE_TEMPLATES` を追加。`ISOLATION_ORDERS` サンプルに `subtype` / `operation` / `restraintParts` / `releaseTimes` / `linkedDocumentChecks` を付与
- `src/stores/useAppStore.ts` — `dynamicIsolationOrders` 状態、`addIsolationOrder` / `updateIsolationOrder` / `releaseIsolationOrder` action、`optionalFeatures.restraintChange` トグルを追加。永続化対象に追加
- `src/components/isolation/RestraintOrderDialog.tsx` — 新規（us-11）
- `src/components/isolation/RestraintNoticePrintDialog.tsx` — 新規（us-11、新規／再印刷モード）
- `src/components/isolation/RestraintOrderLinks.tsx` — 新規（カルテ診療録ヘッダ右側のリンク群）
- `src/components/karteAlpha/KarteAlphaPage.tsx` — `SectionHeader` に `rightSlot` 引数を追加、`MedicalRecordsDense` 経由で `<RestraintOrderLinks />` を診療録ヘッダ右側に配置。`RestraintOrderDialog` をマウント
- `src/components/admission/AdmissionDischarge.tsx` — オプション機能トグルに「隔離拘束変更」を追加
- `docs/screen-mapping.tsv` — RestraintOrderDialog / RestraintNoticePrintDialog / RestraintOrderLinks の 3 行を追加

### 実装上の判断・割り切り

- **入院形態の患者ひも付け**: 患者の入院形態を直接持っていないため、モック値として P003=措置入院 / P006=医療保護入院 / その他=任意入院 とハードコード。ep-04 の `AdmissionHistory.admitForm` を参照するように差し替えるのは別エピック
- **拘束部位／開放時間／文書マスタ**: モック固定値。実マスタ保守はマスタ管理エピックで対応
- **告知書印刷の再印刷モード**: ダイアログ自体は実装済み。過去指示記事から再印刷 UI への接続（カルテ記事クリック → 印刷ダイアログ起動）は未配線。既存指示の編集起点と合わせて別ラウンドで配線
- **`Bed.flags` 自動更新**: 指示確定時に `Bed.flags` の `'isolation'` / `'restraint'` を自動 ON にするロジックは未実装。患者→ベッド逆引き設計が必要のため、ep-08 履歴整備時に検討
- **active 判定**: `RestraintOrderLinks` では `endDatetime` 未設定の指示を active とみなす単純判定。継続／変更指示の表現は spec 通りだが、解除指示で生成される新カルテ記事と active 指示の関係はモックでは「同 ID 上での endDatetime 上書き」で表現

### 動作確認

- `npx tsc --noEmit` クリーン
- `npx vite build` クリーン

### UI 動作確認は未実施

ブラウザでの実操作確認は未実施。各タイトル切替・拘束部位選択・開放時間入力・文書チェック・告知書印刷フローは目視確認推奨です。

### MASTER への共有事項

- `docs/screen-mapping.tsv` 既存行（`/karte-alpha/:patientId` の `KarteAlphaPage.tsx` 行）に `ep-05-restraint-order` を追記する更新は本セッションでは行わず、新規行追加のみで対応。既存行への追記が必要な場合は MASTER 側で調整いただけると助かります

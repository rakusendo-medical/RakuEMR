# patients API 設計書

## メタ

| 項目 | 内容 |
| --- | --- |
| リソース | `patients`（入院患者）+ `consultation-finished`（診察終了状態） |
| 対応エピック | [ep-09 患者情報](../../../specs/ep-09-patient-list/_epic.md) |
| 対応画面 | [screens/ep-09-patient-list/patient-list.md](../../screens/ep-09-patient-list/patient-list.md) |
| ステータス | draft |

## 概要

入院患者の一覧取得・単件取得・診察終了状態管理を扱う API 群。患者基本情報そのものの新規作成・削除は本エピックでは扱わない（入退院フロー [ep-02/03] の責務）。

本エピックでは「業務開始時の患者集合の取得」と「診察終了状態のトグル」を主目的とする。

## エンドポイント一覧（想定）

| メソッド | パス | 概要 | 詳細 |
| --- | --- | --- | --- |
| GET | `/api/patients` | 入院患者一覧取得 | [#一覧取得](#一覧取得) |
| GET | `/api/patients/{patientId}` | 単件取得 | [#単件取得](#単件取得) |
| POST | `/api/patients/{patientId}/consultation-finished` | 診察終了 | [#診察終了切替](#診察終了切替) |
| DELETE | `/api/patients/{patientId}/consultation-finished` | 診察終了解除 | [#診察終了切替](#診察終了切替) |

関連マスタ API は [#関連マスタ-api](#関連マスタ-api) を参照。

## 概念型（共通）

### Patient

```ts
interface Patient {
  id: PatientId;                    // 例: "P001"、サーバ採番（入院手続き時）
  name: string;
  nameKana?: string;
  age: number;                      // 計算値（birthDate から）
  birthDate: ISODate;
  gender: 'M' | 'F';
  bloodType?: string;
  // 在床情報
  wardId: WardId;                   // ward1 | ward2
  roomNumber: string;
  bedLabel: string;
  status: PatientStatus;            // stable | observation | isolation | ...
  // 入院・診療情報
  admitDate: ISODate;
  doctorName: string;               // ※ 本来は doctorId 参照が望ましい。モックは氏名直接保存
  diagnosis?: string;
  insuranceType?: string;
  primaryRecordType?: 'karte' | 'nursing-record';
  admissionState?: 'inpatient' | 'outpatient' | 'discharged';
  // ep-09 Phase 2 追加
  assignedStaffIds?: StaffId[];     // 担当職員1〜10
  examinerIds?: StaffId[];          // 診察医
  responsibilityLevel?: ResponsibilityLevel;  // L1〜L4
}
```

### ConsultationFinishedEntry

```ts
interface ConsultationFinishedEntry {
  patientId: PatientId;
  staffId: StaffId;                 // 終了操作した職員
  staffName: string;                // 表示用キャッシュ
  finishedAt: ISODateTime;
}
```

### 派生情報

入院形態は本リソースには持たず、`AdmissionHistory`（[ep-04]）から派生する。一覧取得時にレスポンスに含める場合は `latestAdmitForm: string` を計算して付与（後述）。

## 一覧取得

### 業務動作

- 看護師・主治医が業務開始時に「自分が今日見るべき患者集合」を取得する用途
- 検索条件（日付・病棟・主治医・担当職員・診察医含む・キーワード）でサーバ側絞込
- 結果は **入院形態を派生** して付与される（フロント側で再計算しなくて済む）

### エンドポイント想定

```
GET /api/patients?baseDate=2026-05-02&wardId=ward1&doctorId=DOC001
                 &staffIds=STF001,STF003&staffMatchMode=all
                 &includeExaminer=true&query=山田
                 &cursor=...&limit=50
```

### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
| --- | --- | --- | --- |
| `baseDate` | ISO date | 任意 | 在院判定の基準日。既定 = サーバ日付。`admitDate <= baseDate AND (dischargeDate IS NULL OR dischargeDate > baseDate)` で在院判定 |
| `wardId` | `WardId \| 'all'` | 任意 | 病棟絞り込み |
| `doctorId` | string | 任意 | 主治医絞り込み |
| `includeExaminer` | boolean | 任意 | true で `examinerIds` に doctorId が含まれる患者も含める。doctorId 未指定時は無視 |
| `staffIds` | string[] (CSV) | 任意 | 担当職員 ID 列 |
| `staffMatchMode` | `'all' \| 'any'` | 任意 | 担当職員照合モード。既定 'all' |
| `query` | string | 任意 | 氏名・患者番号・主治医名・診断名 部分一致 |
| `sortKey` | `'wardRoom' \| 'admitDate' \| 'doctor'` | 任意 | 並び替えキー |
| `sortDir` | `'asc' \| 'desc'` | 任意 | 並び替え方向 |
| `cursor` | string | 任意 | ページネーション |
| `limit` | number | 任意 | 1〜100、既定 50 |

### レスポンス

```ts
{
  items: PatientWithDerived[],
  nextCursor?: string,
  total?: number,
}

interface PatientWithDerived extends Patient {
  // 一覧表示で使う派生情報
  latestAdmitForm?: string;          // ADMISSION_HISTORY から派生（status='入院中' の admitDate 最大）
  inResidenceDays: number;           // baseDate - admitDate + 1
  hasReport: boolean;                // 報告ストアから派生（Phase 3 で追加）
  consultationFinished?: ConsultationFinishedEntry;  // 診察終了情報（baseDate ベース）
}
```

### 権限

| ロール | 可否 |
| --- | --- |
| 医師 | ◯ |
| 看護師 | ◯ |
| 事務 | ◯（自院担当範囲のみ） |

### 主なエラー

- `400 INVALID_PARAM`: `staffMatchMode` が enum 範囲外、`limit` が 1〜100 外、など
- `401 UNAUTHORIZED`: 未認証
- `403 FORBIDDEN`: 別院の患者へのアクセス

### 設計判断・補足

- フロント側の絞込（モック実装）と同じロジックを **サーバ側で正規実装** する想定。フロント側は `useAppStore.patientListSearchCondition` を URL パラメータに変換して呼ぶ
- 入院形態は本来 `AdmissionHistory` から派生するが、N+1 を避けるため一覧 API で派生付与する（バックエンド側 JOIN 想定）

## 単件取得

### エンドポイント想定

```
GET /api/patients/{patientId}
```

### レスポンス

```ts
PatientWithDerived
```

### エラー

- `404 NOT_FOUND`

### 設計判断

- カルテ画面遷移時のフェッチ用途。一覧で取得済の場合はクライアントキャッシュ可（cacheKey: patientId + baseDate）

## 診察終了切替

### 業務動作

- 主治医・看護師が外来診察終了 / 入院患者の本日確認終了を記録する操作
- 医師ロールでは「診察終了」、看護師ロールでは「確認終了」と呼称が異なる場合あり（マスタ管理）
- トグル動作: 既に終了済 = `DELETE` で解除、未登録 = `POST` で登録

### エンドポイント想定

```
POST /api/patients/{patientId}/consultation-finished
DELETE /api/patients/{patientId}/consultation-finished
```

### POST リクエスト型

```ts
interface FinishConsultationRequest {
  baseDate?: ISODate;        // 既定 = サーバ日付。日次でリセット運用想定
  // staffId はサーバ側で認証情報から自動取得
}
```

### POST レスポンス

```ts
ConsultationFinishedEntry
```

### DELETE レスポンス

`204 No Content`

### 権限

| ロール | 可否 |
| --- | --- |
| 医師 | ◯（自分が担当する患者のみ） |
| 看護師 | ◯ |
| 事務 | ✗ |

### 主なエラー

- `400 ALREADY_FINISHED`: 既に終了済（POST 時）／既に未登録（DELETE 時）
- `403 FORBIDDEN`: 担当外患者
- `404 NOT_FOUND`: 患者が存在しない

### 設計判断・補足

- モック実装では `useAppStore.consultationFinishedMap` で永続化。実 API では日次リセット（`baseDate` 単位）
- 操作履歴は `consultation_finished_log` テーブル（仮）に蓄積想定。本 API レスポンスには直近の終了情報のみ含める

## 関連マスタ API

検索条件で使うマスタ。本リソース外で定義するが、画面実装の都合上ここに参照を集約。

```
GET /api/master/staff?role=nurse        # 担当職員マスタ
GET /api/master/responsibility-levels   # 責任レベル区分
GET /api/master/wards                   # 病棟マスタ
GET /api/master/doctors                 # 医師（主治医候補）
```

詳細は `api/master/` 配下に別途整備予定（本ラウンドではモック前提で省略）。

## 関連 API

| リソース | 用途 |
| --- | --- |
| `admission-orders`（[ep-03]） | 入院・退院指示 |
| `admission-histories`（[ep-04]） | 入退院歴。`latestAdmitForm` 派生元 |
| `karte-articles`（カルテ記事） | 患者番号クリックで遷移 |
| `reports`（[Phase 3 未整備]） | 報告アイコンの遷移先 |

## 補足・残課題

### モック実装との差分

- モック: `PATIENTS` 全件を localStorage で保持、フロントで絞込
- 実 API: サーバ側で絞込 + ページネーション。`PATIENT_PHASE2_EXTRAS` のフィールドは `Patient` レコードに統合される想定

### Phase 3 で詰める

- 報告アイコン関連の API（`hasReport` の派生 + `/reports` 連携）
- 検索条件のサーバ側保持（複数端末同期するか、クライアントローカルか）
- リアルタイム更新（病室移動・患者状態変化）の WebSocket / polling 方針

### 認証・共通エラー

`docs/design/_common.md`（後日整備）に集約予定:
- Bearer JWT 認証
- 共通エラー型（`{ code, message, fields? }`）
- 楽観ロック（`expectedUpdatedAt`）の標準仕様
- ページネーション（cursor 形式）の標準仕様

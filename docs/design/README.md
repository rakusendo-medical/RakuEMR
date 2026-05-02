# 設計書（design）

完了エピックを対象に、画面設計書（screen design）と API 設計書（API design）を集約する。

## 目的

- spec（`docs/specs/`）はビジネス上の AC（受け入れ基準）に集中
- 設計書は **実装に近い詳細** を扱う
  - 画面設計書: 画面構成・コンポーネント分割・状態・遷移
  - API 設計書: エンドポイント・リクエスト/レスポンス概念型・エラー・権限

実装エンジニアが spec + 設計書を読めば、追加質問なしで開発に着手できる粒度を目指す（モックフェーズなので「概念レベル」の精度で OK）。

## ディレクトリ構成

```
docs/design/
├── README.md
├── _screen-template.md       # 画面設計書テンプレート
├── _api-template.md          # API 設計書テンプレート
├── _common.md                # 共通仕様（認証・エラー・ページネーション等、後日整備）
├── screens/
│   └── ep-XX/
│       └── <screen-slug>.md  # 1 画面 1 ファイル
└── api/
    └── ep-XX/
        └── <resource-slug>.md # リソース単位（patients / admission-orders 等）
```

### 命名規則

| 種別 | パス | 例 |
| --- | --- | --- |
| 画面設計書 | `screens/ep-XX-<slug>/<screen-slug>.md` | `screens/ep-09-patient-list/patient-list.md` |
| API 設計書 | `api/ep-XX-<slug>/<resource-slug>.md` | `api/ep-09-patient-list/patients.md` |

エピックスラグは `docs/specs/ep-XX-<slug>/` と揃える。

### 「1 画面 1 ファイル」の判定

- ルートパス（例: `/patients`, `/admission`, `/karte-alpha/:patientId`）= 1 ファイル
- カルテのタブはタブ群を 1 画面として扱う（タブ毎にセクション分け）
- モーダルダイアログは親画面に内包（独立ファイルにしない）。ただし共通ダイアログ（`MedicalInstitutionSearchDialog` 等）は別途 `screens/_common-dialogs.md`（必要時に整備）

## API 設計の方針（モック前提のハイブリッド方式）

モックアップなので OpenAPI 厳密形式は過剰。**振る舞い記述ベース + 主要操作にスキーマ風型補足** のハイブリッド方式で書く。

- **業務動作**（中心）: 何が起きるか、副作用、トランザクション境界
- **エンドポイント想定**: HTTP メソッド + URL（実装時のヒント）
- **リクエスト型（概念レベル）**: 主要フィールド + 必須/任意、enum、マスタ参照
- **レスポンス**: 成功時のリソース型、競合・バリデーションエラーは要点
- **権限**: ロール（医師／事務／看護師等）

詳細な JSON Schema や全エラーコード網羅は本番開発時に詳細化する。

## spec / 設計書 / 実装の役割分担

| 文書 | 役割 |
| --- | --- |
| `docs/issues/` | GitHub 投入用 Issue ドラフト（変更不可、参照用） |
| `docs/specs/ep-XX/` | ビジネス AC（Given/When/Then）と画面要素ツリー（責務記述） |
| `docs/changes/ep-XX.md` | spec と現状モックの差分・着手順序 |
| `docs/design/screens/ep-XX/` | 画面の **実装に近い** 詳細（コンポーネント分割・状態・遷移） |
| `docs/design/api/ep-XX/` | API の **概念レベル** の詳細（エンドポイント・型輪郭・権限） |
| `src/` | 実装 |

重複を避けるため:
- 業務 AC は spec、UI 詳細は画面設計書、データ操作は API 設計書
- spec の「振る舞い」と画面設計書の「操作シナリオ」は粒度が異なる（spec=AC、設計書=画面操作と内部状態）

## 着手順序

1. `_screen-template.md` / `_api-template.md` を整備
2. 完了 ep（ep-01〜ep-09）から 1 エピックずつ書く
3. 1 エピック書き終えるごとに PM レビュー
4. 未着手 ep（ep-12〜14 等）は実装前に書く必要が出たタイミングで対応

## 完了済 ep の対象画面

| Epic | 画面パス | 設計書ファイル |
| --- | --- | --- |
| ep-01 病棟マップ | `/`, `/karte-alpha/:patientId` | `screens/ep-01-bed-map/ward-map.md`, `screens/ep-01-bed-map/karte-alpha.md` |
| ep-02 入退院手続き | `/admission` | `screens/ep-02-admission-discharge/admission.md` |
| ep-03 入退院指示 | `/karte-alpha/:patientId` (クイック操作) | `screens/ep-03-admission-discharge-order/admission-order-dialog.md` ほか（ダイアログ群は親画面に内包する場合は ep-01 側） |
| ep-04 入退院歴 | `/admission` (タブ 1) | `screens/ep-04-admission-history/admission-history.md` |
| ep-05 隔離拘束指示 | `/karte-alpha/:patientId` (リンク群) | `screens/ep-05-restraint-order/restraint-order.md` |
| ep-06 隔離拘束一覧 | `/isolation` | `screens/ep-06-restraint-list/isolation-list.md` |
| ep-09 患者情報 | `/patients` | `screens/ep-09-patient-list/patient-list.md` |

## 注意

- 固有名詞ポリシー（[CLAUDE.md](../../CLAUDE.md)）を順守。製品名・ベンダー名は記載せず「参考システム」表記
- API 設計はモックを前提にするが、エンドポイント想定は実装時に再検討する余地を残して書く
- 画面設計書のスクリーンショット添付は今ラウンドでは省略（画像管理ポリシー未定のため）

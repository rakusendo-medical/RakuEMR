# ep-12 / ep-13 / ep-14 統合整理（方針 Y）

看護過程クラスタ（看護診断 / 看護計画 / 看護評価）の **既存モック実装を「正」とした spec 改訂方針** での整理ドキュメント。

> 方針 Y: 既存モック (`src/features/carePlan/`) を尊重し、`docs/specs/` および `docs/入院機能一覧.xlsx` を実装に合わせる方向で改訂する。
>
> ただし下記 1 項目は **方針 Y の例外として mock 側を改修**：
> - 期間で区切る複数計画（後述 ep-13 #6 + #8）

> 用語: 本ドキュメントで使う「看護記録 / 看護経過記録 / 問題点 / 看護計画明細」等の意味は [docs/specs/_terminology.md](../specs/_terminology.md) 参照。

## ユーザー判定結果（2026-05-04）

下表のとおり 19 項目の判定が確定。

| # | 項目 | 判定 | 補足 |
| --- | --- | --- | --- |
| 1 | ep-12 看護診断セット（マスタ） | 🔴 削除 | マスタ管理機能は別途開発、US 含めず |
| 2 | ep-12 履歴タブ | 🟢 残置（縮小） | **参照のみ + ページめくり** に縮小 |
| 3 | ep-12 候補プール（候補化トグル） | 🔴 削除 | 1 ダイアログ = 1 診断追加で十分 |
| 4 | ep-12 大分類 / 小分類 / 項目の階層編集 | 🔴 削除 | マスタ側の問題、US 含めず（データ構造→API→マスタ設計の順） |
| 5 | ep-12 適用日 / 診断日 | 🟢 残置 | `ProblemItem.diagnosedAt` 追加。日付概念は他にも出てくる可能性あり、後で再検討 |
| 6 | ep-13 期間プルダウン（複数計画切替） | 🟡 **方針 Y 例外 / mock 改修** | 1 期間 1 計画、期間重複不可、病状変化で期間区切り可 |
| 7 | ep-13 ラベルパターン1/2 | 🔴 削除 | 参考システム独自で意味が分かりづらい |
| 8 | ep-13 継続中チェック / 終了日入力 | 🟡 **方針 Y 例外 / mock 改修** | #6 と一体で対応 |
| 9 | ep-13 「看護診断より追加」ボタン（独立フロー） | 🔴 削除 | NANDA は ProblemItemEditDialog のサブで完結 |
| 10 | ep-13 並び替えダイアログ | 🔴 削除 | 優先度自動ソート実装済 |
| 11 | ep-13 アセスメントタブ | 🔴 削除 | 廃止予定 |
| 12 | ep-13 問題点タブ / アセスメントタブ構成 | 🔴 削除 | 同上 |
| 13 | ep-13 同期間に複数計画並立制約（UI 警告） | 🔴 削除 | 並立させない制約は #6 の期間管理で実現、UI 警告は不要 |
| 14 | ep-14 us-30 評価項目立案（spec ファイル） | 🔴 削除 | mock では成立しない想定。spec ファイルごと削除 |
| 15 | ep-14 添付ファイル | 🟡 将来検討 | 拡張可能性あり |
| 16 | ep-14 特記報告ダイアログ | 🟡 将来検討 | 今後実装可能性 |
| 17 | ep-14 評価点数合計（スコア計算） | 🟡 将来検討 | 同上 |
| 18 | ep-14 評価レベル + レベルコメント抽象モデル | 🟡 将来検討 | 拡張可能性あり |
| 19 | ep-14 評価項目マスタ / セットマスタ | 🔴 削除 | マスタは別途 EP/US で起草 |

凡例: 🟢 採用（mock 準拠 or 縮小残置）／🟡 保留（将来検討 / 改修対象）／🔴 削除（spec から落とす）

### 方針 Y の例外として mock を改修する項目

#### #6 + #8. 期間で区切る複数計画（mock 改修）

mock 現状: 1 患者 1 `CarePlan`、status だけ遷移。

新仕様（mock を改修）:

- `CarePlan` に `periodStart: ISODate` / `periodEnd?: ISODate` を追加
- 1 患者に対し複数 `CarePlan` を保持可能、同期間に並立しない制約
- 「継続中」 = `periodEnd === undefined`、外したら終了日入力必須
- 期間プルダウンで切替（既存計画一覧 + 「新規」）
- 新計画作成時は前計画 `periodEnd` を自動設定（重複回避）
- 期間切替動機: 病状改善・増悪・治療方針変更 等

影響範囲（mock 改修）:
- `src/features/carePlan/types.ts`: `CarePlan` 型拡張
- `src/features/carePlan/store.ts`: 期間管理ロジック追加
- `src/features/carePlan/mockData.ts`: 既存データに `periodStart` を補完
- `src/features/carePlan/pages/PatientCarePlan.tsx`: 期間プルダウン追加、選択計画切替
- `src/features/carePlan/pages/Dashboard.tsx`: 「最新の有効計画」抽出ロジック調整
- `src/features/carePlan/pages/CarePlanCreate.tsx`: 新規期間として作成、前計画 periodEnd 設定
- `src/features/carePlan/pages/MonthlyEvaluation.tsx`: 期間内の計画明細を対象とする

#### #2. 履歴タブ（参照のみ + ページめくり）

参照モードのみ、編集 UI なし、過去診断を時系列でページめくりして閲覧。実装影響：

- 看護診断ダイアログに「履歴」タブを追加（参照専用）
- 過去診断 = ProblemItem の changeLogs から導出 OR 別途履歴データを保持
- ページめくり: 1 件ずつ前へ／次へボタンで切替

#### #5. 適用日 / 診断日

- `ProblemItem.diagnosedAt?: ISODate` 追加（看護診断として確定した日）
- `createdAt` = 立案日／適用日として継続利用
- 用語ガイドに「立案日 / 評価日 / 適用日 / 診断日」のすべての日付概念を整理（現用語ガイドに既に枠あり、要更新）

---

## 整理の前提

3 つのソース：

| 層 | 内容 | 役割 |
| --- | --- | --- |
| 1 | `docs/入院機能一覧.xlsx` + `docs/issues/` ドラフト | GitHub 投入用の元仕様（参考システム由来） |
| 2 | `docs/specs/ep-12-14/` | spec（参考システムマニュアルベースで S4 が起こした） |
| 3 | `src/features/carePlan/` | 既存モック実装（看護過程の動作するワイヤーフレーム） |

方針 Y では **3 を正とし、2 と 1 を改訂**。

ラベル定義（各 gap 項目に付与）：

| ラベル | 意味 |
| --- | --- |
| 🟢 既存採用 | mock の挙動に合わせて spec を改訂、xlsx は注釈追記 |
| 🟡 spec 追加機能 | mock 未実装だが spec は価値あり、後続実装で追加検討 |
| 🔴 spec 削除推奨 | mock に無く、spec も過剰仕様。spec から落とす |
| ⚪ 用語整合のみ | 機能差ではなく用語ズレ、表記合わせ |

---

## ep-12 看護診断 (us-28)

### gap マトリクス

| 項目 | spec | mock | ラベル | 推奨方針 |
| --- | --- | --- | --- | --- |
| **ダイアログタブ構成** | 検索 / セット / 履歴 + 問題点テキスト常設 | 単一フィルタリスト + 問題点テキスト（最近追加） | 🟡 | 単一フィルタを 3 タブ拡張は将来課題。spec を「単一リスト + フィルタ」案併記に緩和 |
| **キーワード検索** | 複数 AND 条件 | 単一テキストで絞込 (name / code) | ⚪ | spec を mock 仕様に揃える（単一クエリで OK） |
| **領域フィルタ** | spec 未明記 | あり（領域セレクト） | 🟢 | spec に追記 |
| **「よく使う診断」分類** | spec 未明記 | あり（`frequentlyUsed` フラグでグルーピング） | 🟢 | spec に追記 |
| **看護診断セット（マスタ）** | あり | なし | 🔴 | spec から削除（または実装課題として明記）。マスタ管理は本リポジトリで未対応 |
| **履歴タブ（過去診断参照・編集）** | あり | なし | 🔴 | spec から削除（過去履歴は changeLogs で監査のみ。編集 UI は不要） |
| **候補プール（候補化トグル）** | あり（ チェック / 編集 / 削除 / 追加で候補化） | なし（即時選択） | 🔴 | spec から削除。1 ダイアログで 1 診断を選ぶだけの単純フローを採用 |
| **大分類 / 小分類 / 項目編集** | あり | なし | 🔴 | spec から削除（マスタ階層を編集する UI は本リポジトリでは不要） |
| **適用日 / 診断日** | あり | なし（即時反映） | 🔴 | spec から削除（適用日 = ProblemItem.createdAt で代用） |
| **問題点テキスト（手入力可）** | あり（最近追加） | あり（最近追加・必須） | 🟢 | 既に整合済 |
| **NANDA コード必須** | あり | あり | 🟢 | 整合済 |
| **OK 確定 vs × 破棄の挙動区別** | あり（[閉じる] vs ×） | キャンセル / 選択（× = キャンセル相当） | ⚪ | mock の挙動が標準的。spec から「[閉じる] = 候補保存」を削除 |

### 用語ズレ

- spec の「**候補化**」概念は mock に存在しない（即時選択モデル）
- spec の「**領域 / 大分類 / 小分類 / 項目**」階層は mock に存在しない（領域のみ）

### 方針 Y での ep-12 改訂方針

**spec を大幅に縮小する**。mock の単純な「NANDA リスト + フィルタ + 問題点テキスト」モデルに合わせる。

新 spec の主要画面要素（要素ツリー、案）:

```
- 看護診断ダイアログ
  - ヘッダー: 患者基本情報サマリ
  - フィルタ部
    - キーワード入力（name / code 単一クエリ）
    - 領域フィルタセレクト（all / 安全 / 身体 / 精神 / 社会 / 日常生活 / 服薬 / セルフケア）
  - 診断リスト
    - 「よく使う診断」セクション（frequentlyUsed=true のみ）
    - 「すべての診断」セクション（残り全件）
    - 各行: ラジオ + コード + 診断名 + 領域
  - 問題点テキスト欄（必須・手入力可、最大 500 文字、NANDA 選択時に診断名で自動補完）
  - フッター
    - [キャンセル] = 破棄
    - [選択] = NANDA + 問題点テキストを返却（NANDA + 問題点 両方必須）
```

xlsx 改訂方針: 「NANDA 選択 + 問題点手入力」のシンプルフロー、参考システムにあった検索・セット・履歴タブ機能はオプション機能として「将来検討」で別箇所注記。

---

## ep-13 看護計画 (us-29)

### gap マトリクス

| 項目 | spec | mock | ラベル | 推奨方針 |
| --- | --- | --- | --- | --- |
| **計画モデル** | 期間単位で複数計画併存可 | 1 患者 1 計画（status 遷移のみ） | 🟢 | spec を mock 仕様に揃える（patient × carePlan = 1 対 1 + status 遷移） |
| **期間プルダウン** | あり（計画切替） | なし | 🔴 | spec から削除（モデル変更しないため） |
| **長期目標管理** | 計画ごとに 1 つ | 計画ごとに 1 つ | 🟢 | 整合済 |
| **長期目標編集** | spec で並ぶ | あり（CarePlanEditDialog で立案日・長期目標のみ編集可） | 🟢 | spec に「立案日も編集可」を追記 |
| **ラベルパターン1/2** | あり | なし | 🔴 | spec から削除（参考システム独自概念） |
| **継続中チェック** | あり（外したとき終了日入力） | なし（status='active' で継続表現） | 🔴 | spec から削除 |
| **「前回の計画を引き継ぐ」** | あり | あり（CopyFromDialog で「同一患者の過去計画」） | 🟢 | 整合済、spec の文言を CopyFromDialog 仕様に合わせる |
| **CopyFromDialog の 3 ソース** | spec 未明記（ template + 看護診断のみ） | あり（template / other_patient / past_plan） | 🟢 | spec に追記 |
| **明細追加: 新規追加** | あり | あり（ProblemItemEditDialog） | 🟢 | 整合済 |
| **明細追加: テンプレートより追加** | あり | あり（CopyFromDialog template モード） | 🟢 | 整合済 |
| **明細追加: 看護診断より追加** | あり（看護診断ダイアログ→適用日→明細生成） | なし（NandaSelectDialog はサブ呼出のみ） | 🔴 | spec から削除（NANDA は ProblemItemEditDialog 内のサブダイアログで完結） |
| **明細修正ダイアログ** | あり | あり（ProblemItemEditDialog edit mode） | 🟢 | 整合済 |
| **並び替え（ドラッグ or 手動）** | あり（並び替えダイアログ） | なし（優先度自動ソート） | 🟢 | spec を mock に揃える。「優先度（高/中/低）+ #No で自動ソート」を spec の正とする |
| **明細クローズ（解決/中止/変更）** | spec 未明記 | あり（closed_resolved / cancelled / changed） | 🟢 | spec に追記 |
| **解決済み明細のグレーアウト表示** | spec 未明記 | あり | 🟢 | spec に追記 |
| **印刷レイアウト** | spec 未明記 | あり（PrintLayout） | 🟢 | spec に追記 |
| **看護経過記録ダイアログ起動リンク** | あり（[看護経過記録] リンク） | あり（PatientCarePlan から看護記録ストアに転記する MonthlyEvaluation の機能、UI 上の常設リンクは無し） | 🟡 | spec に「リンクは 評価フロー 経由のみ」と追記。常設 [看護経過記録] リンクの設置は次イテレーション |
| **FOCUS 連携時の自動関連付け** | あり（タイトルに No と診断、A欄に介入自動設定） | なし（MonthlyEvaluation で評価内容のみ転記） | 🟡 | spec の FOCUS 連携機能は 看護経過記録ダイアログ（ep-10）と統合時に再検討 |
| **最終評価日リンク** | あり | あり（PatientCarePlan で「評価する」ボタン → MonthlyEvaluation） | ⚪ | UI 表現は異なるが目的同じ。spec を mock に揃える（明細ごとリンクではなく、計画一括の「評価する」ボタン） |
| **アセスメントタブ** | spec で「参考、別エピック」 | なし | 🔴 | spec から削除（別エピックも未起草、深追い不要） |
| **問題点タブ / アセスメントタブの構成** | あり（メイン = 問題点） | なし（タブ無し、単一画面） | 🔴 | spec からタブ構成削除 |

### 方針 Y での ep-13 改訂方針

**計画モデルは 1 患者 1 計画に縮小**。期間複数併存・ラベルパターン・継続中チェックは削除。
3 ボタン明細追加 → 「新規追加」「引用コピー（template/他患者/過去計画 統合 UI）」の 2 系統に整理。
並び替えは優先度自動ソート、明細クローズは 3 種類（解決/中止/変更）。

新 spec の主要画面要素（要素ツリー、案）:

```
- 看護過程画面 (/care-plan/patients/:patientId)
  - 患者ヘッダー（PatientHeader）
  - 計画メタ操作
    - [看護過程を編集] = CarePlanEditDialog（立案日 + 長期目標）
    - [印刷] = PrintLayout で印刷
    - [評価する] = MonthlyEvaluation 画面へ遷移
  - 長期目標セクション（折りたたみ）
  - 有効計画セクション
    - 明細カード（優先度+#No 順、展開で OTE 表示）
      - [編集] = ProblemItemEditDialog edit mode
      - [削除] = closeProblemItem（理由 + ステータス選択）
    - 明細追加ボタン群
      - [看護計画を追加] = ProblemItemEditDialog create mode
      - [引用コピー] = CopyFromDialog（template / 他患者 / 過去計画）
  - 解決済みセクション（グレーアウト、折りたたみ）
- ProblemItemEditDialog
  - 領域 / 優先度 / 看護診断（NANDA）/ 問題点（手入力可）/ 短期目標 / OTE
  - 内部呼出: NandaSelectDialog（NANDA 選択 + 問題点テキスト）
  - [保存（下書き）] / [保存して有効化]
  - 編集モード時: [この看護計画をクローズ] メニュー（解決 / 中止 / 変更）
- CarePlanEditDialog
  - 立案日（編集可、評価期限には影響しない注記あり）
  - 長期目標
- CopyFromDialog
  - ソース選択タブ: テンプレート / 他患者 / 同一患者過去
  - 検索フィルタ
  - 「長期目標も含めて取り込む」チェック（テンプレートのみ）
  - 取込明細を複数チェック
- PrintLayout（印刷専用ビュー）
```

---

## ep-14 看護評価 (us-30, us-31)

### gap マトリクス

#### us-30 評価項目立案

| 項目 | spec | mock | ラベル | 推奨方針 |
| --- | --- | --- | --- | --- |
| **評価項目立案フェーズ** | あり（評価項目選択ダイアログで事前立案） | なし（mock では明細単位の達成度入力が直接行われる） | 🔴 | spec から削除。明細 = 評価対象、で十分 |
| **評価項目マスタ** | あり | なし | 🔴 | spec から削除 |
| **評価項目セットマスタ** | あり | なし | 🔴 | spec から削除 |

→ **us-30 自体を削除推奨**（mock では「評価項目の事前立案」概念が無い。明細単位で達成度を入力するシンプルモデル）

#### us-31 定期評価

| 項目 | spec | mock | ラベル | 推奨方針 |
| --- | --- | --- | --- | --- |
| **評価入力ダイアログ** | あり | あり（EvaluationForm） | 🟢 | 整合済 |
| **評価モデル** | 評価レベル + レベルコメント + 評価内容 + 添付ファイル + 備考 | 達成度 + 所見 + 次ステータスのみ | 🟢 | spec を mock に縮小 |
| **達成度（達成 / 一部達成 / 未達）** | spec で評価レベルとして抽象化 | 3 値固定（'achieved' / 'partial' / 'not_achieved'） | 🟢 | spec を「3 値固定」に揃える |
| **次ステータス選択** | spec 未明記（評価結果でステータス遷移は spec に書かれている） | あり（active / evaluating / closed_resolved / closed_cancelled / closed_changed の 5 値） | 🟢 | spec に追記 |
| **添付ファイル** | あり | なし | 🔴 | spec から削除 |
| **特記報告ダイアログ** | あり（報告先・種別） | なし | 🔴 | spec から削除 |
| **カルテ記事作成連携** | あり（標準診療種類連動） | あり（看護経過記録への評価結果転記、buildTransferText） | 🟢 | spec を「看護経過記録への自動転記（フリー形式）」に縮小 |
| **過去評価履歴表示** | あり | あり（EvaluationForm 内に前回評価サマリ） | 🟢 | 整合済 |
| **計画明細毎に評価入力** | あり | あり | 🟢 | 整合済 |
| **一括保存** | spec 未明記 | あり（「すべて保存して評価完了」） | 🟢 | spec に追記 |
| **評価点数合計（スコア計算）** | あり | なし | 🔴 | spec から削除 |
| **「評価無し」リンク** | spec 未明記 | spec 未明記 | — | mock 挙動を整理して spec 明文化 |

### 方針 Y での ep-14 改訂方針

- **us-30 評価項目立案は削除推奨**（明細 = 評価対象モデルに統一、立案フェーズ不要）
- **us-31 定期評価は mock 仕様に縮小**。達成度 3 値、所見テキスト、次ステータス遷移、看護経過記録への自動転記、過去評価サマリ表示

新 spec の主要画面要素（要素ツリー、案）:

```
- 月次評価画面 (/care-plan/patients/:patientId/evaluate)
  - 患者ヘッダー（PatientHeader）
  - 計画サマリ（長期目標 + 立案日 + 立案者）
  - 計画明細毎の評価フォーム（EvaluationForm）
    - 計画明細サマリ（番号 + 看護診断 + 短期目標）
    - 達成度ラジオ（達成 / 一部達成 / 未達）
    - 所見テキスト
    - 次ステータスセレクト（継続 / 修正して継続（評価中）/ 解決 / 中止 / 変更）
    - 前回評価履歴表示（折りたたみ）
  - スティッキー操作バー
    - 入力済 N / 総 M 件 表示
    - [すべて保存して評価完了] = 一括保存 + 看護経過記録転記ダイアログ表示
- 評価完了確認ダイアログ
  - 看護経過記録への転記内容プレビュー（buildTransferText）
  - [看護記録に転記] = useNursingRecordStore.addRecord
  - [スキップして閉じる]
```

---

## 方針 Y 適用後の spec / xlsx 改訂作業見積もり

### spec 改訂

| 対象 | 変更内容 | 規模 |
| --- | --- | --- |
| `docs/specs/ep-12-diagnosis/_epic.md` | 主要画面要素縮小（タブ/候補/詳細編集削除）、既存実装との乖離表は本ドキュメント参照に置換 | 中 |
| `docs/specs/ep-12-diagnosis/us-28-diagnosis.spec.md` | 全面書き直し（mock 準拠の単純フロー） | 中 |
| `docs/specs/ep-13-care-plan/_epic.md` | 計画モデル単一化、ラベルパターン削除、明細追加 2 系統に整理 | 中 |
| `docs/specs/ep-13-care-plan/us-29-care-plan.spec.md` | 全面書き直し（mock 準拠） | 大 |
| `docs/specs/ep-14-evaluation/_epic.md` | us-30 削除、評価モデル縮小 | 中 |
| `docs/specs/ep-14-evaluation/us-30-eval-criteria.spec.md` | **削除** | 削除 |
| `docs/specs/ep-14-evaluation/us-31-periodic-eval.spec.md` | 全面書き直し（mock 準拠） | 中 |

### xlsx / issues 改訂

`docs/入院機能一覧.xlsx` および `docs/issues/` ドラフトは **GitHub 投入用 SoT** なので原則変更不可（[docs/issues/README.md](../issues/README.md) に注記あり）。

ただし、本リポジトリで採用しない参考システム独自機能（看護診断セット、ラベルパターン、評価項目立案、特記報告、添付ファイル、評価点数合計）は **xlsx に「本リポジトリスコープ外」の注記** を入れることで spec / xlsx の整合を確保する。

xlsx 改訂は手動編集が必要（CLI で xlsx は安全に書けない）→ **PM 経由でユーザーに改訂依頼**。

### コード改訂

**方針 Y では原則コード改訂なし**。ただし以下は仕上げとして候補：

- `ProblemItem.problemStatement` の必須化（型定義は既にオプショナルだが UI で必須）→ 既に NandaSelectDialog で実装済
- 用語ガイドに沿って `NursingRecord` 関連の UI ラベル修正 → 既に実施済（[3bf62a4](https://github.com/rakusendo-medical/RakuEMR/commit/3bf62a4) 参照）

---

## 方針判定をいただきたいこと

ユーザー判定要請事項を以下に整理：

### Q1. 方針 Y で確定？
本ドキュメントの整理結果でよいか確認お願いします。`🔴 spec 削除推奨` 項目の中で「やはり残したい」ものがあれば指摘ください。

### Q2. spec 全面書き直しは MASTER で実施？
spec の書き直しは比較的大きな作業。MASTER で対応する／別途依頼する／後回しでよい のいずれにしますか？

### Q3. xlsx 注記対応
`docs/入院機能一覧.xlsx` への「本リポジトリスコープ外」注記。Excel 編集は手動が必要なので、ユーザー側で実施してもらう想定でよいですか？

### Q4. 看護経過記録ダイアログの統合タイミング
ep-13 spec で「看護経過記録ダイアログ起動リンク」「FOCUS 連携時の自動関連付け」が出てきます。これは ep-10（S3 担当・完了）の `NursingRecordDialog` と統合する必要があります。
- A. 今すぐ ep-13 から看護経過記録ダイアログを呼び出せるようにする
- B. 月次評価から看護経過記録に転記する現状のフローを継続、ep-13 は別途
- C. 後回し（用語整合だけ済ませて、機能統合は後）

### Q5. us-30 評価項目立案の削除
us-30 spec ファイルの削除は可ですか？ それとも「将来検討機能」として残置しますか？

---

## 改訂後の状態（イメージ）

ep-12 / ep-13 / ep-14 の spec が「mock の現状を spec として記述したもの」になり、`docs/changes/` に「mock 改修一覧」を新設して **mock 実装の細部見直しタスク** を 別途記述する形（他エピックの changes と同じ形式）。

このときの実装側の積み残しは：

- 既存実装の `MonthlyEvaluation.tsx` の見た目・操作の改善（必要なら）
- 看護経過記録ダイアログとの本格統合（評価転記時に NursingRecordDialog を呼ぶ）
- 印刷レイアウトの見直し

---

## 進捗ヒアリング材料整備（S4・2026-05-07）

ep-16 us-37「看護過程タブ統合」着手判定のため、ep-12 / ep-13 / ep-14 の現状を 4 観点で整理する。HANDOVER「MASTER 待ち事項」の起票（2026-05-06）に対応。

### 観点 1. 各 ep の現状サマリ

| epic | story | spec ステータス | spec AC 件数 | mock 改修状況 | 追加対応の要否（us-37 視点） |
| --- | --- | --- | --- | --- | --- |
| ep-12 看護診断 | us-28 | draft（方針 Y 適用済） | 9 件（AC-1〜AC-9） | **mock 改修フェーズ 1 完了**（commit `96ba0d4`）。`ProblemItem.diagnosedAt` 追加 + `DiagnosisHistoryDialog` 新規（履歴参照モード） | **不要**（NandaSelectDialog は `ProblemItemEditDialog` 内のサブ呼出のみ。タブ直下ではない） |
| ep-13 看護計画 | us-29 | draft（方針 Y + 1 例外適用済） | 17 件（AC-1〜AC-17） | **mock 改修フェーズ 2 完了**（commit `8125792`）。`CarePlan` に `periodStart` / `periodEnd?` 追加、期間プルダウン、自動クローズロジック実装 | **本丸**（`PatientCarePlan.tsx` がタブ直下の埋込本体） |
| ep-14 看護評価 | us-31 | draft（方針 Y 適用済） | 11 件（AC-1〜AC-11） | 既存 `MonthlyEvaluation.tsx` + `EvaluationForm.tsx` で要件充足、追加 mock 改修なし | **当面不要**（MonthlyEvaluation はサブ画面遷移として標準。ただし将来 embedded 対応の余地あり） |
| ep-14 旧 us-30 評価項目立案 | us-30 | **削除確定**（2026-05-04 ユーザー判定 #14） | — | spec ファイルは未削除のまま残置 | spec ファイル削除作業が積み残し（us-37 とは独立） |

**まとめ**:

- **mock 改修フェーズ 1 / 2 は両方とも 2026-05-04 commit 済**。HANDOVER L139-141 の「mock 改修フェーズ 2 進行中」記載は **古い**（2026-05-04 時点で完了している）。
- ep-12-13-14-integration.md 冒頭の Q1〜Q5（方針 Y 確定 / spec 全面書き直し / xlsx 注記 / 看護経過記録ダイアログ統合タイミング / us-30 削除）は **PM 判定済**（19 項目判定が 2026-05-04 に降りている）。残るのは spec 全面書き直し（Q2）の作業実施タイミング。
- us-37 の観点では、**ep-13 の `PatientCarePlan` 埋込が技術的にすぐ着手可能な状態**にある。

### 観点 2. 直近のコード変更（src/features/carePlan/ 履歴）

```
8125792  2026-05-04  feat(care-plan): mock 改修フェーズ 2 — 期間で区切る複数計画モデル
96ba0d4  2026-05-04  feat(care-plan): mock 改修フェーズ 1 — 診断日 + 履歴参照ダイアログ
54df12d  2026-05-04  feat(care-plan): 問題点（手入力）フィールドを ProblemItem に追加
e0b7311  ...         docs: ドキュメント整備とサイドバー導線の整理（横断）
2af95ed  ...         看護計画を看護過程として変更（用語統一）
7635ab3  ...         看護計画についてモックアップを開発（初期実装）
```

ep-12 / ep-13 / ep-14 専用の commit は上記 6 件のみ。**`8125792` 以降は新規変更なし**（直近 3 日間動きなし）。

#### 8125792（フェーズ 2）スコープ要約

- `types.ts` — `CarePlan` に `periodStart` / `periodEnd?` を追加（オプショナル、`createdAt` フォールバック）
- `mockData.ts` — 既存 CARE_PLANS 全件に `periodStart` 補完。P001 山田太郎に「過去期間（cp-001-prev / closed）+ 現在期間（cp-001 / active）」のサンプル
- `store.ts` — `createCarePlan` 拡張（前計画自動クローズ）、`updateCarePlanMeta` で期間重複バリデーション、`planPeriod` / `periodsOverlap` / `addDayISO` 補助
- `CarePlanEditDialog.tsx` — 期間開始日 / 継続中チェック / 期間終了日
- `PatientCarePlan.tsx` — 期間プルダウン（240px）+「+ 新規期間で計画立案」、患者切替時に最新期間自動選択
- `CarePlanCreate.tsx` — 既存有効計画ありでもブロック解除（自動クローズで吸収）

#### 96ba0d4（フェーズ 1）スコープ要約

- `types.ts` — `ProblemItem.diagnosedAt?: ISODate` を追加（任意・後方互換、未設定時 `createdAt` フォールバック）
- `ProblemItemEditDialog.tsx` — `DraftItem.diagnosedAt` 入力フィールド + Tooltip
- `store.ts` — `addProblemItem` で `problemStatement` / `diagnosedAt` を保持
- `ProblemItemCard.tsx` / `PrintLayout.tsx` — `diagnosedAt` 表示（`createdAt` と異なる場合のみ）
- `DiagnosisHistoryDialog.tsx`（新規）— 履歴参照モード（読み取り専用、ページめくり）

### 観点 3. 看護過程タブ統合 API の現状（embedded / patientId 対応）

| 対象 | ファイル | `embedded?` prop | `patientId?` prop | 統合可能性 |
| --- | --- | --- | --- | --- |
| **看護過程画面（タブ本体候補）** | `pages/PatientCarePlan.tsx` | ✅ あり（line 28） | ✅ あり（line 30、`useParams` フォールバック） | **即着手可能**。`<PatientCarePlan embedded patientId={...} />` で埋込可。`!embedded` 時に `PatientHeader` を非表示にする実装あり（L134, L159） |
| 計画立案画面 | `pages/CarePlanCreate.tsx` | ✅ あり（line 21） | ✅ あり（line 22） + `onActivated?` callback | **PatientCarePlan 内部で連携済**（L135 `<CarePlanCreate embedded patientId={...} />`）。タブ統合時に追加対応不要 |
| 月次評価画面 | `pages/MonthlyEvaluation.tsx` | ❌ なし | ❌ なし | **standalone のみ**（[評価する] ボタンで `/care-plan/patients/:patientId/evaluate` に遷移する設計）。タブ統合では現状の遷移を維持で OK。将来 embedded 化する場合は要対応 |
| ダッシュボード | `pages/Dashboard.tsx` | ❌ なし（不要） | ❌ なし | 担当看護師の患者一覧画面。タブ統合の対象外 |
| 看護診断ダイアログ | `components/NandaSelectDialog.tsx` | — | — | `ProblemItemEditDialog` 内のサブ呼出のみ。タブ直下ではない |
| 履歴参照ダイアログ | `components/DiagnosisHistoryDialog.tsx` | — | — | `PatientCarePlan` 内ボタンから起動。タブ統合時は自動的に追従 |

#### カルテ画面側（KartePage）の準備状況

- `src/components/karte/KartePage.tsx` で `tabId='care-plan'` / `hash='nursing-process'` の枠組みは既設定（L59-61, L383）
- 現状は `KarteActionBar` 側で disabled + Tooltip（HANDOVER L14 で S2 が us-33 着手時に対応済）
- **us-37 でやるべきこと**: `KartePage.tsx` の `KarteTabContent` 内 `'care-plan'` 分岐に `<PatientCarePlan embedded patientId={patient.id} />` を埋込み、`KarteActionBar` の disabled を解除

### 観点 4. PM ヒアリング設問素案（5〜8 件）

mock 改修フェーズ 2 が 2026-05-04 完了済の前提で、us-37 着手判定に必要な未確定事項を抽出。**HANDOVER MASTER 待ち事項記載「ep-12〜14 担当者」「mock 改修フェーズ 2 完了見込み」は実態と乖離**しているため、設問は「現状確認 + spec 書き直しのタイミング判断」に再フォーカスする。

#### Q-1. mock 改修フェーズ 2 の追加作業有無

> commit `8125792`（2026-05-04）で「期間で区切る複数計画モデル」は実装完了している認識でよいか？ 残作業（バグ修正・追加要件）は無いか？

期待回答: 完了 / 追加要件あり（具体内容）

#### Q-2. spec 全面書き直し（Q2 再掲）の作業タイミング

> 2026-05-04 整理ドキュメント Q2 で「spec の書き直しは大きい」とユーザーに尋ねている件。**MASTER で実施 / 別途依頼 / 後回し** のいずれか確定したか？ us-37 着手前に書き直しを完了させたいか？

期待回答: 着手前必須 / 着手と並行で OK / us-37 完了後でも可

#### Q-3. us-30 spec ファイルの削除

> 2026-05-04 ユーザー判定 #14 で「us-30 評価項目立案 spec ごと削除」確定済だが、ファイルはまだ残っている。削除を MASTER に依頼してよいか？ それとも「将来検討」コメント追記で残置か？

期待回答: 削除 / 残置 + 注記

#### Q-4. 看護経過記録ダイアログ統合（Q4 再掲）

> 2026-05-04 整理ドキュメント Q4 で 3 案（A 即統合 / B 月次評価経由のみ / C 後回し）。us-37 タブ統合と同時に踏み込むか？ ep-13 spec の「過去診断を参照」リンクは us-37 で実装するか別タスクか？

期待回答: A / B / C ＋ 実装担当ワーカー

#### Q-5. 月次評価画面（MonthlyEvaluation）のタブ埋込スコープ

> 現状 `MonthlyEvaluation.tsx` は `embedded` 未対応・standalone 専用（`/care-plan/patients/:patientId/evaluate` 遷移）。us-37 では PatientCarePlan のみタブ埋込し、評価画面は遷移を維持してよいか？ それとも評価画面も埋込対象にしたいか？

期待回答: PatientCarePlan のみ embedded / 評価画面も embedded / 別タスクで段階対応

#### Q-6. us-37 担当ワーカーアサイン

> us-37 着手の準備が整った場合、担当は誰にするか？ 候補: S2（us-36 完了後）/ S3（us-35 完了済・継続）/ S4（us-38 完了済・継続）/ MASTER 直轄

期待回答: 担当ワーカー名

#### Q-7. ep-12-13-14 担当ワーカーの不在前提の確認

> HANDOVER MASTER 待ち事項に「ep-12〜14 担当ワーカー（不明）にヒアリング」とあるが、実態は **2026-05-04 にユーザー（PM）が判定 + mock 改修も同日完了** で、専従ワーカーは存在しない（恐らく PM 直轄 + MASTER 補佐）。この認識でよいか？

期待回答: その通り / 別の担当者あり

#### Q-8. ep-13 期間モデルの動作確認状況

> commit `8125792` 後にブラウザ目視は実施済か？ 「過去期間 cp-001-prev + 現在期間 cp-001」の切替動作・自動クローズ動作を確認したか？ 未実施なら us-37 着手前に確認したいか？

期待回答: 確認済 / 未確認、着手前に必要 / 未確認、着手と並行で OK

### 結論（S4 推奨）

us-37 は **技術的に即着手可能**。前提となる ep-13 mock 改修フェーズ 2 は 2026-05-04 完了済で、`PatientCarePlan` の `embedded` / `patientId` prop もすでに整備されている。

判断必要な残事項は以下のみ:

1. **spec 全面書き直し（Q-2）の実施タイミング** — us-37 着手前 / 並行 / 後回し
2. **看護経過記録ダイアログ統合（Q-4）のスコープ** — us-37 に含めるか別タスクか
3. **us-37 担当ワーカー（Q-6）** — S2/S3/S4 のいずれか or MASTER

これらが PM 判定で確定すれば、us-37 の spec 起こし → 担当ワーカーアサイン → 着手 が連続して進められる。**HANDOVER MASTER 待ち事項の「ep-12〜14 担当者ヒアリング」は実質的に不要**で、上記 Q-1〜Q-8 を PM 自身が判定すれば前提が揃う。

整理担当: S4（worker/s4） / 2026-05-07
コード変更: なし（ドキュメント整理のみ）

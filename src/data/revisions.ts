/**
 * 改定履歴データ（source of truth）。
 *
 * `RevisionHistory` コンポーネントの表示、`MainLayout` ヘッダーの最新表示、
 * および `vite.config.ts` のプラグインが提供する `/api/version`,
 * `/api/version/detail` 応答すべてでこの配列を単一のソースとして参照する。
 */

export type Commit = {
  hash: string;
  time: string;
  subject: string;
};

export type ChangeItem = {
  title: string;  // 改定項目の見出し
  detail: string; // 説明
};

export type Revision = {
  version: string;
  date: string;       // 表示用（M/D）
  fullDate: string;   // YYYY-MM-DD
  context: string;    // 合意・改修の相手／場
  summary: string;    // 改定概要
  items?: ChangeItem[]; // 改定項目リスト（見出し＋説明。summary はリード文として短く）
  commits?: Commit[]; // 当日のコミット履歴
};

export const REVISIONS: Revision[] = [
  {
    version: 'ver0.19',
    date: '7/13',
    fullDate: '2026-07-13',
    context: '病床移動（転棟・転室）改修',
    summary: '病棟マップの病床移動（転棟・転室ダイアログ）を当院運用（布団運用・削除不可・取消運用）に合わせて改修し、移動履歴の表示も刷新しました（SPEC us-02 反映。取消・戻し・更新はモックのためセッション限定）。',
    items: [
      {
        title: '移動先ベッド欄を削除（布団運用）',
        detail: 'ベッド指定を廃止し、移動先は「病棟（初期表示は現病棟）＋病室」まで指定。病室内の空き枠へ自動割当し、満床の病室は登録不可とした。',
      },
      {
        title: '病棟移動は前提なしだが機能は残す',
        detail: '当院は原則、同一病棟内の病室移動のため病棟移動は前提としないが、病棟セレクトは残し、必要時は病棟間移動も登録できるようにした。',
      },
      {
        title: '移動履歴は削除不可・「取消」で代替',
        detail: '移動履歴の削除ボタン・削除モード・移動削除箋を廃止。削除の代わりに「取消」を用い、取り消した移動は履歴から消えず取消状態で残す。',
      },
      {
        title: '取消時の病室反映',
        detail: '移動済（過去）の取消は患者を移動前の病室へ戻す（空き枠へ自動割当・空きが無ければ戻さない）。予定（未来）の取消は病室を動かさず取消履歴のみ残す。',
      },
      {
        title: '移動履歴の表示を刷新',
        detail: '列を「移動日／病室／状態／種別／操作」に整理（移動元は非表示）。先頭に入院（最初の病室）行を表示。状態は未／済／取消、種別は入院／移動／転棟で表示。履歴行クリックでフォームに読み込み更新できる（更新モード）。',
      },
    ],
  },
  {
    version: 'ver0.18',
    date: '7/13',
    fullDate: '2026-07-13',
    context: '退院指示・病棟マップ 改修',
    summary: '退院指示と病棟マップまわりを 4 点改修しました（SPEC us-09／us-01／ep-03 ほか関連ドキュメントも整合。外来化・退院区分反映はモックのためセッション限定）。',
    items: [
      {
        title: '退院指示「地域連携（逆紹介）」オプションを削除',
        detail: '機能として不要になったため、逆紹介設定・地域連携トグル・optionalFeatures.regionalCooperation を撤去（医療観察法・外部精神科システム連携は維持）。SPEC us-09／ep-03 も整合。',
      },
      {
        title: '病棟マップ「入退院情報」ボタンの SPEC 記述を削除',
        detail: 'ver0.16 で廃止済みのボタン記述（ep-01 us-01／_epic・ep-02 _epic）を削除。別物である「入退院情報画面 (/admission)」の月次カレンダーは保持。',
      },
      {
        title: '入院者情報パネルの性別内訳から「他」区分を削除',
        detail: '右サイドバー「入院者情報」パネルの患者／在院者／不在者 各列を、男・女の 2 区分表示に変更（「他」に該当する区分が存在しないため）。SPEC us-01・docs/changes に反映。',
      },
      {
        title: '通院退院で患者を外来化・入院歴の退院区分を反映',
        detail: '退院後診療区分＝通院で退院確定した時、①対象患者を外来化（admissionState を outpatient に上書き＝カルテ表示の外来化・入院患者一覧から除外）、②入院歴の当該入院を退院済・退院区分「退院後通院」に反映。あわせて完了通知から実在しない「医師指示簿への書込」記述を削除。',
      },
    ],
  },
  {
    version: 'ver0.17',
    date: '7/6',
    fullDate: '2026-07-06',
    context: '入院オーダー・病室割当整理',
    summary: '入院オーダー・病室割当のライフサイクルを整理しました。',
    items: [
      {
        title: '入院オーダー時の病棟を必須化',
        detail: '病棟を必須（validation）とし、これにより「病棟未割当」は発生しなくなったため、未割当の用語を「病室未割当」に統一。',
      },
      {
        title: '「病室割当状況」バッジで判別',
        detail: '病室の割当状況を色＋アイコン＋文言で判別（割当済み＝青＋病室アイコン＋「N号室」／未割当＝アンバー＋？＋「病室未割当」）。',
      },
      {
        title: '未割当者パネル／導線を撤去',
        detail: '病棟必須化で不要になった、残存していた死にコードを削除。',
      },
      {
        title: '右サイドバーを3パネルに一本化',
        detail: '入院予定者・不在者・入院者情報（いずれも選択中病棟スコープ）に集約。参考システムは病室割当まで踏み込まない運用のため、本画面は参考システムに準拠せず当院運用に合わせる。',
      },
    ],
  },
  {
    version: 'ver0.16',
    date: '7/6',
    fullDate: '2026-07-06',
    context: '右サイドバー3パネル刷新',
    summary: '病棟マップ右サイドバーの3パネルを刷新しました。',
    items: [
      {
        title: '「入退院情報」ボタンを廃止・パネルへ統合',
        detail: 'ver0.15 以降オーファン化していたボタンを廃止し、ダイアログのサマリ（稼働率・隔離・拘束・観察）を「入院者情報」パネルへ統合。オーファンなダイアログ本体（AdmissionInfoContent）も撤去。',
      },
      {
        title: '入院者情報をダッシュボード型に再設計',
        detail: '病床稼働バー＋稼働率／本日日付（M/D 時点）、患者・在院者・不在者の3列内訳、状態別チップ、平均年齢を表示。外出は「不在者」列と重複するため状態別チップからは除外。',
      },
      {
        title: '入院予定者・不在者をカード行に整理',
        detail: '氏名＋バッジ＋操作ボタンのカード行に整理。',
      },
      {
        title: '3パネルを白背景カードに刷新',
        detail: '淡色背景の低コントラストを是正し、文字色を濃く調整。',
      },
    ],
  },
  {
    version: 'ver0.15',
    date: '6/30',
    fullDate: '2026-06-30',
    context: '病棟マップ再設計',
    summary: '病棟マップ右サイドバーを再設計しました。',
    items: [
      {
        title: '入院オーダー時の病棟指定を必須化',
        detail: '「仮病棟」チェックを「病室未定」に是正し、「病棟未割当」状態を解消。',
      },
      {
        title: '未割当者パネルを廃止・3パネルに統一',
        detail: '「入院予定者／不在者／入院者情報」をいずれも選択中病棟スコープに統一。',
      },
      {
        title: '入院予定者に予定日・病室バッジを表示',
        detail: '入院予定日と病室バッジ（病室未／確定を色＋アイコンで判別）を表示。入院手続き導線を病室確定済の行へ移設し、病室確定が手続きの前提であることを UI で表現。',
      },
      {
        title: '入院ライフサイクルを設計書に整備',
        detail: 'フローチャート・状態モデルを画面設計書（docs/design/screens/ep-01-bed-map/ward-map.md）に整備。',
      },
    ],
  },
  {
    version: 'ver0.14',
    date: '6/11',
    fullDate: '2026-06-11',
    context: '観察グリッド勤務帯切替',
    summary: '隔離拘束観察グリッドに勤務帯切替を追加しました。',
    items: [
      {
        title: '勤務帯切替を追加',
        detail: '24時間／日勤9〜16時／夜勤17〜翌8時を切り替え可能に。',
      },
      {
        title: 'e2e テストを拡充',
        detail: '最大9行・最小1行での登録反映、既存セルへの上書き書換え、勤務帯切替後の入力反映、行の追加削除・上限9件、絞込設定の全チェック・クローズなど。',
      },
    ],
    commits: [
      { hash: 'e157d20', time: '11:22', subject: 'test/flowsheet: 隔離拘束観察グリッドの e2e を補強（最大9行/上書き書換え/勤務帯切替後の入力反映）' },
      { hash: '236ce98', time: '11:13', subject: 'test/flowsheet: 隔離拘束観察グリッドの e2e カバレッジを追加（行追加削除・上限・トースト・絞込・勤務帯ほか）' },
      { hash: 'f55c00a', time: '09:59', subject: 'flowsheet: 隔離拘束観察グリッドに勤務帯切替（24時間/日勤/夜勤）を追加' },
    ],
  },
  {
    version: 'ver0.13',
    date: '6/10',
    fullDate: '2026-06-10',
    context: '隔離拘束観察グリッド追加',
    summary: '隔離拘束サブタブに 24時間×7日の観察グリッドを追加しました。',
    items: [
      {
        title: 'フローシートタブを改称・サブタブ化',
        detail: '「フローシート・隔離拘束」に改称し、サブタブ（フローシート／隔離拘束）で外出・外泊行から下を切り替え可能に。',
      },
      {
        title: '24時間×7日の観察グリッドを追加',
        detail: '隔離拘束サブタブに追加。各記録を色セグメントで均等分割表示。',
      },
      {
        title: '観察記録ダイアログを起動',
        detail: 'セルクリックで起動（00分/30分の2行を既定、15分/30分単位の切替）。',
      },
      {
        title: '各種ダイアログ導線',
        detail: '診察記録の[未診察]セルから診療録作成ダイアログ、[絞込設定]から絞込ダイアログを起動。',
      },
      {
        title: 'ヘッドレスCI用 Playwright 設定を追加',
        detail: 'CI でヘッドレス実行するための設定を追加。',
      },
    ],
    commits: [
      { hash: '2ca1477', time: '22:14', subject: 'e2e: ヘッドレスCI用の Playwright 設定とスクリプトを追加' },
      { hash: '436600b', time: '22:04', subject: 'test/flowsheet: 観察記録ダイアログ系 e2e の検証手法を修正' },
      { hash: '2b3eb53', time: '18:10', subject: 'flowsheet: フローシートタブに隔離拘束サブタブ（24h観察グリッド）を追加' },
    ],
  },
  {
    version: 'ver0.12',
    date: '6/2',
    fullDate: '2026-06-02',
    context: '隔離拘束指示ダイアログ改修',
    summary: '隔離拘束指示ダイアログを改修しました。',
    items: [
      {
        title: '不要項目を削除',
        detail: '開放時間・文書チェック・所見を削除。',
      },
      {
        title: '日時入力を datetime-local に統一',
        detail: '開始日時・終了日時の入力形式を統一。',
      },
      {
        title: '配膳先変更日時を追加',
        detail: '配膳先の切替日時を入力できるように。',
      },
      {
        title: '移動先セレクトを追加',
        detail: '移動先病棟・病室・ベッドのセレクトを追加。病室・ベッド未選択時は作成ボタンを非活性化。',
      },
    ],
    commits: [
      { hash: '—', time: '—', subject: 'isolation: 隔離拘束指示ダイアログから開放時間・文書チェック・所見を削除' },
      { hash: '—', time: '—', subject: 'isolation: 開始日時・終了日時の入力をdatetime-local形式に統一' },
      { hash: '—', time: '—', subject: 'isolation: 配膳先変更日時フィールドを追加' },
      { hash: '—', time: '—', subject: 'isolation: 移動先病棟・病室・ベッドのセレクトを追加' },
      { hash: '—', time: '—', subject: 'isolation: 病室・ベッド未選択時に作成ボタンを非活性化' },
    ],
  },
  {
    version: 'ver0.11',
    date: '5/30',
    fullDate: '2026-05-30',
    context: '楽仙堂と改修',
    summary: '改定履歴ページを追加し、フローシート等を調整しました。',
    items: [
      {
        title: '改定履歴ページを追加',
        detail: 'アコーディオン形式でバージョンごとの改定履歴を表示。',
      },
      {
        title: 'フローシートを調整',
        detail: '排便系項目の再構成・日列クリック入力・看護記録の新規登録を追加。',
      },
      {
        title: 'オーダ管理・隔離拘束まわりを調整',
        detail: 'オーダ管理のフィルター追加、行動制限台帳のUI整備、サイドナビ再編など。',
      },
    ],
    commits: [
      { hash: '65ae582', time: '15:35', subject: 'karte/flowsheet: 看護記録の新規登録ダイアログを追加' },
      { hash: 'fd6f946', time: '15:10', subject: 'karte/flowsheet: 日列クリックで当日項目を入力できる編集ダイアログを追加' },
      { hash: '0b5403e', time: '14:54', subject: 'karte/flowsheet: 便(性状)セルに番号＋性状名を併記' },
      { hash: '9030ee5', time: '14:49', subject: 'karte/flowsheet: 排便系項目を再構成（便回数/性状/下剤/尿量）＋睡眠非表示' },
      { hash: '2167484', time: '14:35', subject: 'flowsheet: 排便系項目の再構成（便の回数/性状/下剤/尿量）＋睡眠タブ非表示' },
      { hash: '5556580', time: '14:20', subject: 'orders: オーダー管理に「調整中・仮実装」の注意書きを追加' },
      { hash: 'ada758f', time: '13:45', subject: 'isolation/ledger: 行動制限台帳に月・病棟指定UIとダミーデータ表示を実装' },
      { hash: '0a3d7cb', time: '13:41', subject: 'orders: オーダ管理に患者/種類フィルター追加＋リハオーダー種別を新設' },
      { hash: '4ae52ea', time: '12:49', subject: 'flowsheet/bulk-vitals: 病棟マップで選択した複数病室を一括入力へ引き継ぎ' },
      { hash: '36ad4bb', time: '12:47', subject: 'layout: サイドナビ再編（外来セクション新設・共通運用を病床管理へ統合）' },
      { hash: '941ec30', time: '12:39', subject: 'flowsheet/bulk: 一括バイタル・看護経過記録のUI統一＋保存トースト右上化' },
      { hash: '305aa6a', time: '12:24', subject: 'layout: サイドナビから睡眠表項目を一旦除外' },
      { hash: 'e2f03a9', time: '12:19', subject: 'flowsheet/bulk-vitals: 設定ボタンを画面下部固定の保存バーに変更' },
      { hash: 'a739aae', time: '11:57', subject: 'ward-map: 病室/床数の見直し＋患者番号8桁化＋status新モデル統合' },
    ],
  },
  {
    version: 'ver0.10',
    date: '5/29',
    fullDate: '2026-05-29',
    context: 'AMTC側で合意',
    summary: '初版を作成。',
  },
];

/** 最新バージョン（サイドメニュー等の ver 表記はここを参照する） */
export const LATEST_VERSION = REVISIONS[0].version;

/** `ver` プレフィックスを外した最新バージョン。API `/api/version` の応答に使う。 */
export const LATEST_VERSION_NUMBER = LATEST_VERSION.replace(/^ver/, '');

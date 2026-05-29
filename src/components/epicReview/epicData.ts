/**
 * エピック評価画面用のメタデータ。
 * docs/HANDOVER.md「エピック進捗」セクションと
 * docs/issues/manifest.tsv をベースに整理。
 *
 * status:
 *   - 'completed':   モック実装済（PM 受入確認済または同等）
 *   - 'in-progress': 進行中（一部 us が未完了）
 *   - 'planned':     未着手・計画段階
 */

export type EpicStatus = 'completed' | 'in-progress' | 'planned';

export interface EpicScreenLink {
  label: string;
  path: string;
  /** patientId 等パラメータが必要な場合のサンプル */
  hint?: string;
}

export interface EpicMeta {
  id: string;
  title: string;
  area: string;
  status: EpicStatus;
  stories: { id: string; label: string }[];
  mainScreens: EpicScreenLink[];
  description: string;
  /** 段階区分があるエピック（ep-15 / ep-16 / ep-17）の補足 */
  stageNote?: string;
}

export const EPICS: EpicMeta[] = [
  {
    id: 'ep-01',
    title: '病棟マップ',
    area: '病床管理',
    status: 'completed',
    stories: [
      { id: 'us-01', label: '病床表示' },
      { id: 'us-02', label: '病床移動' },
      { id: 'us-03', label: '病床割り当て' },
      { id: 'us-04', label: 'カルテ画面遷移' },
    ],
    mainScreens: [
      { label: '病棟マップ', path: '/', hint: '患者ベッドを単クリックでメニュー、ダブルクリックで新カルテ' },
    ],
    description: '病棟内のベッド配置と患者状態（隔離・拘束・外出・要報告等）を一目で把握できる画面。病室移動・割り当て・カルテ画面への遷移の起点。',
  },
  {
    id: 'ep-02',
    title: '入退院手続き',
    area: '病床管理',
    status: 'completed',
    stories: [
      { id: 'us-05', label: '入院手続き' },
      { id: 'us-06', label: '退院手続き' },
      { id: 'us-07', label: '入退院情報' },
    ],
    mainScreens: [
      { label: '入退院管理', path: '/admission' },
    ],
    description: '入院確定・退院確定・予定一覧の管理画面。AdmissionScheduleCalendar 系。',
  },
  {
    id: 'ep-03',
    title: '入退院指示',
    area: '病床管理',
    status: 'completed',
    stories: [
      { id: 'us-08', label: '入院指示' },
      { id: 'us-09', label: '退院指示' },
    ],
    mainScreens: [
      { label: 'カルテ（入院 mode・KarteActionBar から起動）', path: '/karte/P001', hint: 'AdmissionOrderDialog / DischargeOrderDialog' },
    ],
    description: '主治医による入退院指示。新カルテ画面のアクションバーから起動（ep-16 us-36 サブ A で統合完了）。',
  },
  {
    id: 'ep-04',
    title: '入退院歴',
    area: '病床管理',
    status: 'completed',
    stories: [
      { id: 'us-10', label: '入院歴・退院歴' },
    ],
    mainScreens: [
      { label: '入退院管理（タブ「入院歴」「移動歴」）', path: '/admission' },
    ],
    description: '入院・退院の履歴と病床移動の履歴を一覧で確認。',
  },
  {
    id: 'ep-05',
    title: '隔離拘束指示',
    area: '隔離拘束',
    status: 'completed',
    stories: [
      { id: 'us-11', label: '隔離拘束指示' },
    ],
    mainScreens: [
      { label: '隔離拘束', path: '/isolation' },
      { label: 'カルテ（診療録タブの RestraintOrderLinks）', path: '/karte/P003' },
    ],
    description: '隔離開始 / 隔離解除 / 拘束開始 / 拘束解除 等の指示モーダル。',
  },
  {
    id: 'ep-06',
    title: '隔離拘束一覧',
    area: '隔離拘束',
    status: 'completed',
    stories: [
      { id: 'us-12', label: '隔離拘束指示受け' },
    ],
    mainScreens: [
      { label: '隔離拘束', path: '/isolation' },
    ],
    description: '隔離拘束指示の一覧と受け処理。',
  },
  {
    id: 'ep-07',
    title: '観察記録',
    area: '隔離拘束',
    status: 'completed',
    stories: [
      { id: 'us-13', label: '個別観察記録' },
      { id: 'us-14', label: '一括観察記録' },
    ],
    mainScreens: [
      { label: '隔離拘束（観察タブ）', path: '/isolation' },
    ],
    description: '隔離拘束対象患者の観察記録。個別・一括 入力に対応。',
  },
  {
    id: 'ep-08',
    title: '隔離拘束歴',
    area: '隔離拘束',
    status: 'completed',
    stories: [
      { id: 'us-15', label: '隔離拘束歴' },
    ],
    mainScreens: [
      { label: '隔離拘束（歴タブ）', path: '/isolation' },
    ],
    description: '過去の隔離拘束指示・観察記録の履歴。',
  },
  {
    id: 'ep-09',
    title: '患者情報',
    area: '共通',
    status: 'completed',
    stories: [
      { id: 'us-16', label: '入院患者一覧' },
    ],
    mainScreens: [
      { label: '入院患者一覧', path: '/patients' },
      { label: '患者詳細', path: '/karte/P001#patient-info' },
    ],
    description: '入院患者の一覧と個別ページ。担当者・診察医フィルタ等を提供。',
  },
  {
    id: 'ep-10',
    title: '看護実施（フローシート）',
    area: '看護',
    status: 'completed',
    stories: [
      { id: 'us-17', label: 'フローシート表示' },
      { id: 'us-18', label: 'フローシート編集' },
      { id: 'us-19', label: 'サイン記載' },
      { id: 'us-20', label: '個別バイタル入力' },
      { id: 'us-21', label: 'フローシートパターン' },
      { id: 'us-22', label: '看護記録表示' },
      { id: 'us-23', label: '個別看護記録' },
      { id: 'us-24', label: '一括バイタル入力' },
      { id: 'us-25', label: '一括睡眠活動入力' },
      { id: 'us-26', label: '一括看護経過記録' },
    ],
    mainScreens: [
      { label: 'フローシート', path: '/flowsheet' },
      { label: '看護記録', path: '/nursing' },
      { label: '一括バイタル', path: '/nursing/bulk-vitals' },
      { label: '睡眠表', path: '/nursing/sleep-table' },
      { label: '一括看護経過記録', path: '/nursing/bulk-records' },
    ],
    description: 'フローシート（バイタル・看護記録）の表示・編集・一括入力。VitalChart 等の埋込ビューも本エピック範囲。',
  },
  {
    id: 'ep-12',
    title: '看護診断',
    area: '看護',
    status: 'in-progress',
    stories: [
      { id: 'us-28', label: '看護診断編集' },
    ],
    mainScreens: [
      { label: '看護過程', path: '/care-plan' },
    ],
    description: 'NANDA-I に準拠した看護診断の編集。mock 改修フェーズ 2 進行中。',
    stageNote: '段階: mock 改修フェーズ 2 進行中（期間複数計画モデル整備中）',
  },
  {
    id: 'ep-13',
    title: '看護計画',
    area: '看護',
    status: 'in-progress',
    stories: [
      { id: 'us-29', label: '看護計画編集' },
    ],
    mainScreens: [
      { label: '看護過程', path: '/care-plan' },
    ],
    description: '期間で区切る複数計画モデルの実装。',
    stageNote: '段階: mock 改修フェーズ 2 進行中',
  },
  {
    id: 'ep-14',
    title: '看護評価',
    area: '看護',
    status: 'in-progress',
    stories: [
      { id: 'us-30', label: '評価項目立案' },
      { id: 'us-31', label: '定期評価' },
    ],
    mainScreens: [
      { label: '看護過程', path: '/care-plan' },
    ],
    description: '評価項目の立案と定期評価。',
    stageNote: '段階: mock 改修フェーズ 2 進行中',
  },
];

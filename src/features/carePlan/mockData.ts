import type {
  CarePlan,
  ChangeLog,
  Evaluation,
  NandaDiagnosis,
  Nurse,
  Patient,
  ProblemItem,
  Template,
} from './types';

export const TODAY = '2026-04-21';

export const NURSES: Nurse[] = [
  { id: 'ns-a', name: '田村 幸子' },
  { id: 'ns-b', name: '中野 由佳' },
  { id: 'ns-c', name: '吉田 美里' },
];

export const DEFAULT_NURSE_ID = 'ns-a';

export const NANDA_MASTER: NandaDiagnosis[] = [
  { code: '00078', name: '非効果的健康自主管理', domain: '服薬', frequentlyUsed: true },
  { code: '00138', name: '他者に対する暴力リスク状態', domain: '安全', frequentlyUsed: true },
  { code: '00140', name: '自己に対する暴力リスク状態', domain: '安全', frequentlyUsed: true },
  { code: '00150', name: '自殺行動リスク状態', domain: '安全', frequentlyUsed: true },
  { code: '00120', name: '状況的自尊感情低下', domain: '精神', frequentlyUsed: true },
  { code: '00124', name: '絶望感', domain: '精神', frequentlyUsed: true },
  { code: '00146', name: '不安', domain: '精神', frequentlyUsed: true },
  { code: '00148', name: '恐怖', domain: '精神', frequentlyUsed: false },
  { code: '00069', name: '非効果的コーピング', domain: '精神', frequentlyUsed: true },
  { code: '00052', name: '社会的相互作用障害', domain: '社会', frequentlyUsed: false },
  { code: '00054', name: '孤独感リスク状態', domain: '社会', frequentlyUsed: false },
  { code: '00096', name: '睡眠パターン混乱', domain: '日常生活', frequentlyUsed: true },
  { code: '00095', name: '不眠', domain: '日常生活', frequentlyUsed: true },
  { code: '00108', name: 'セルフケア不足:入浴', domain: 'セルフケア', frequentlyUsed: true },
  { code: '00109', name: 'セルフケア不足:更衣', domain: 'セルフケア', frequentlyUsed: false },
  { code: '00102', name: 'セルフケア不足:摂食', domain: 'セルフケア', frequentlyUsed: false },
  { code: '00011', name: '便秘', domain: '身体', frequentlyUsed: true },
  { code: '00002', name: '栄養摂取バランス異常:必要量以下', domain: '身体', frequentlyUsed: false },
  { code: '00085', name: '身体可動性障害', domain: '身体', frequentlyUsed: false },
  { code: '00155', name: '転倒転落リスク状態', domain: '安全', frequentlyUsed: true },
  { code: '00004', name: '感染リスク状態', domain: '身体', frequentlyUsed: false },
  { code: '00027', name: '体液量不足', domain: '身体', frequentlyUsed: false },
  { code: '00046', name: '皮膚統合性障害', domain: '身体', frequentlyUsed: false },
  { code: '00126', name: '知識不足', domain: '精神', frequentlyUsed: false },
  { code: '00132', name: '急性疼痛', domain: '身体', frequentlyUsed: false },
  { code: '00133', name: '慢性疼痛', domain: '身体', frequentlyUsed: false },
  { code: '00199', name: '非効果的活動計画', domain: '日常生活', frequentlyUsed: false },
  { code: '00214', name: '安楽障害', domain: '日常生活', frequentlyUsed: false },
  { code: '00168', name: '坐位中心ライフスタイル', domain: '日常生活', frequentlyUsed: false },
  { code: '00051', name: '言語的コミュニケーション障害', domain: '社会', frequentlyUsed: false },
];

// 10 患者 - Ns A担当 4名、B担当 3名、C担当 3名
export const PATIENTS: Patient[] = [
  { id: 'p-001', name: '山田太郎', age: 75, sex: 'M', roomNo: '101', admissionDate: '2025-11-10', primaryDiagnosis: '統合失調症', primaryNurseId: 'ns-a' },
  { id: 'p-002', name: '佐藤花子', age: 68, sex: 'F', roomNo: '203', admissionDate: '2025-12-05', primaryDiagnosis: 'うつ病', primaryNurseId: 'ns-a' },
  { id: 'p-003', name: '鈴木一郎', age: 82, sex: 'M', roomNo: '105', admissionDate: '2026-04-10', primaryDiagnosis: '認知症', primaryNurseId: 'ns-a' },
  { id: 'p-004', name: '田中良子', age: 55, sex: 'F', roomNo: '207', admissionDate: '2026-01-20', primaryDiagnosis: '双極性障害', primaryNurseId: 'ns-a' },
  { id: 'p-005', name: '高橋健', age: 45, sex: 'M', roomNo: '102', admissionDate: '2025-10-15', primaryDiagnosis: '統合失調症', primaryNurseId: 'ns-b' },
  { id: 'p-006', name: '伊藤美香', age: 38, sex: 'F', roomNo: '208', admissionDate: '2026-02-01', primaryDiagnosis: '適応障害', primaryNurseId: 'ns-b' },
  { id: 'p-007', name: '渡辺正雄', age: 70, sex: 'M', roomNo: '103', admissionDate: '2026-03-12', primaryDiagnosis: 'アルコール依存症', primaryNurseId: 'ns-b' },
  { id: 'p-008', name: '中村早苗', age: 62, sex: 'F', roomNo: '201', admissionDate: '2025-09-20', primaryDiagnosis: 'うつ病', primaryNurseId: 'ns-c' },
  { id: 'p-009', name: '小林拓也', age: 29, sex: 'M', roomNo: '106', admissionDate: '2026-02-18', primaryDiagnosis: 'パニック障害', primaryNurseId: 'ns-c' },
  { id: 'p-010', name: '加藤由美', age: 51, sex: 'F', roomNo: '205', admissionDate: '2025-11-25', primaryDiagnosis: '統合失調症', primaryNurseId: 'ns-c' },
];

// CarePlans - 全10名のうち p-003 (鈴木一郎) のみ計画未立案
export const CARE_PLANS: CarePlan[] = [
  { id: 'cp-001', patientId: 'p-001', longTermGoal: '服薬自己管理ができ、自宅退院を目指す', status: 'active', createdAt: '2026-01-15', createdBy: 'ns-a' },
  { id: 'cp-002', patientId: 'p-002', longTermGoal: '気分の安定を保ち、日常生活動作を自立して行える', status: 'active', createdAt: '2026-01-20', createdBy: 'ns-a' },
  { id: 'cp-004', patientId: 'p-004', longTermGoal: '気分の波をコントロールし、社会復帰の準備を進める', status: 'active', createdAt: '2026-02-10', createdBy: 'ns-a' },
  { id: 'cp-005', patientId: 'p-005', longTermGoal: '幻聴への対処方法を習得し、生活リズムを整える', status: 'active', createdAt: '2025-11-01', createdBy: 'ns-b' },
  { id: 'cp-006', patientId: 'p-006', longTermGoal: 'ストレス対処行動を身に付け、職場復帰を目指す', status: 'active', createdAt: '2026-02-15', createdBy: 'ns-b' },
  { id: 'cp-007', patientId: 'p-007', longTermGoal: '断酒継続のセルフモニタリングを確立する', status: 'active', createdAt: '2026-03-20', createdBy: 'ns-b' },
  { id: 'cp-008', patientId: 'p-008', longTermGoal: '希死念慮を訴えることができ、安全に療養生活を送れる', status: 'active', createdAt: '2025-10-05', createdBy: 'ns-c' },
  { id: 'cp-009', patientId: 'p-009', longTermGoal: '予期不安のコントロール方法を獲得する', status: 'active', createdAt: '2026-02-25', createdBy: 'ns-c' },
  { id: 'cp-010', patientId: 'p-010', longTermGoal: '陰性症状への対応と生活リズムの確立', status: 'active', createdAt: '2025-12-01', createdBy: 'ns-c' },
];

// ProblemItems
// p-001 (山田太郎, Ns-A): 評価期限超過 - lastEvaluated 3/15, 次回期限 4/15 (6日超過)
// p-002 (佐藤花子, Ns-A): 今月評価必要 - 次回期限 4/28
// p-004 (田中良子, Ns-A): 評価中のまま
// p-005 (高橋健, Ns-B): 評価期限超過
// p-006 (伊藤美香, Ns-B): 今月評価必要
// p-007 (渡辺正雄, Ns-B): 通常
// p-008 (中村早苗, Ns-C): 今月評価必要
// p-009 (小林拓也, Ns-C): 通常
// p-010 (加藤由美, Ns-C): 通常
export const PROBLEM_ITEMS: ProblemItem[] = [
  // --- cp-001 山田太郎 (期限超過) ---
  {
    id: 'pi-001-1', carePlanId: 'cp-001', domain: '服薬', priority: 'high', nandaCode: '00078',
    shortTermGoal: '処方薬を自身で管理して服薬できる',
    ote: {
      observation: ['服薬状況の確認', '副作用の有無観察', '服薬に対する患者の認識の把握'],
      therapy: ['服薬時に見守りを行う', '服薬カレンダーの使用を支援する'],
      education: ['服薬の重要性について説明する', '副作用時の対応を指導する'],
    },
    status: 'active', createdAt: '2026-01-15', createdBy: 'ns-a',
    lastEvaluatedAt: '2026-03-15', nextEvaluationDueAt: '2026-04-15',
  },
  {
    id: 'pi-001-2', carePlanId: 'cp-001', domain: '安全', priority: 'medium', nandaCode: '00138',
    shortTermGoal: '他者への暴力行為を起こさず過ごせる',
    ote: {
      observation: ['攻撃的言動の有無', '興奮兆候の観察', '表情・声のトーン'],
      therapy: ['クールダウン場所への誘導', '傾聴・共感的対応'],
      education: ['感情コントロール方法を一緒に考える'],
    },
    status: 'active', createdAt: '2026-01-15', createdBy: 'ns-a',
    lastEvaluatedAt: '2026-03-15', nextEvaluationDueAt: '2026-04-15',
  },
  {
    id: 'pi-001-3', carePlanId: 'cp-001', domain: '社会', priority: 'low', nandaCode: '00052',
    shortTermGoal: '他患者と1日1回以上会話ができる',
    ote: {
      observation: ['他患との関わりの観察', '表情・発語量'],
      therapy: ['レクリエーションへの声かけ'],
      education: ['自己表現の仕方を一緒に練習する'],
    },
    status: 'active', createdAt: '2026-01-15', createdBy: 'ns-a',
    lastEvaluatedAt: '2026-03-15', nextEvaluationDueAt: '2026-04-15',
  },
  // --- cp-002 佐藤花子 (今月評価必要) ---
  {
    id: 'pi-002-1', carePlanId: 'cp-002', domain: '精神', priority: 'high', nandaCode: '00124',
    shortTermGoal: '絶望感を言語化できるようになる',
    ote: {
      observation: ['表情・発語の観察', '睡眠状況', '食事摂取量'],
      therapy: ['定期的な声かけと傾聴', '希死念慮の確認'],
      education: ['気分の変化を記録する方法を指導する'],
    },
    status: 'active', createdAt: '2026-01-20', createdBy: 'ns-a',
    lastEvaluatedAt: '2026-03-28', nextEvaluationDueAt: '2026-04-28',
  },
  {
    id: 'pi-002-2', carePlanId: 'cp-002', domain: '日常生活', priority: 'medium', nandaCode: '00095',
    shortTermGoal: '夜間6時間以上の睡眠が取れる',
    ote: {
      observation: ['入眠時間・中途覚醒', '日中の傾眠'],
      therapy: ['就寝前の環境整備', '入眠前のリラクゼーション支援'],
      education: ['睡眠衛生について指導する'],
    },
    status: 'active', createdAt: '2026-01-20', createdBy: 'ns-a',
    lastEvaluatedAt: '2026-03-28', nextEvaluationDueAt: '2026-04-28',
  },
  // --- cp-004 田中良子 (評価中のまま) ---
  {
    id: 'pi-004-1', carePlanId: 'cp-004', domain: '精神', priority: 'high', nandaCode: '00069',
    shortTermGoal: '気分変動時の対処法を1つ以上習得する',
    ote: {
      observation: ['気分変動の有無と程度', '衝動的言動'],
      therapy: ['気分記録の支援', 'ストレス対処の一緒の検討'],
      education: ['病識・再発予防を指導する'],
    },
    status: 'evaluating', createdAt: '2026-02-10', createdBy: 'ns-a',
    lastEvaluatedAt: '2026-03-10', nextEvaluationDueAt: '2026-04-10',
  },
  {
    id: 'pi-004-2', carePlanId: 'cp-004', domain: '服薬', priority: 'medium', nandaCode: '00078',
    shortTermGoal: '処方薬の意味を理解して服薬継続できる',
    ote: {
      observation: ['服薬状況', '副作用の有無'],
      therapy: ['服薬時の声かけ'],
      education: ['気分安定薬の必要性を説明する'],
    },
    status: 'active', createdAt: '2026-02-10', createdBy: 'ns-a',
    lastEvaluatedAt: '2026-03-10', nextEvaluationDueAt: '2026-04-10',
  },
  // --- cp-005 高橋健 (期限超過) ---
  {
    id: 'pi-005-1', carePlanId: 'cp-005', domain: '精神', priority: 'high', nandaCode: '00069',
    shortTermGoal: '幻聴時の対処行動を実践できる',
    ote: {
      observation: ['幻聴の頻度と内容', '対処行動の実施状況'],
      therapy: ['安全確保と声かけ', 'リラクセーションの導入'],
      education: ['対処行動(音楽を聴く等)を一緒に練習する'],
    },
    status: 'active', createdAt: '2025-11-01', createdBy: 'ns-b',
    lastEvaluatedAt: '2026-03-10', nextEvaluationDueAt: '2026-04-10',
  },
  {
    id: 'pi-005-2', carePlanId: 'cp-005', domain: 'セルフケア', priority: 'medium', nandaCode: '00108',
    shortTermGoal: '週3回以上の入浴ができる',
    ote: {
      observation: ['清潔保持状況', '更衣の実施'],
      therapy: ['入浴の声かけ・準備支援'],
      education: ['清潔保持の重要性を説明する'],
    },
    status: 'active', createdAt: '2025-11-01', createdBy: 'ns-b',
    lastEvaluatedAt: '2026-03-10', nextEvaluationDueAt: '2026-04-10',
  },
  // --- cp-006 伊藤美香 (今月評価必要) ---
  {
    id: 'pi-006-1', carePlanId: 'cp-006', domain: '精神', priority: 'high', nandaCode: '00146',
    shortTermGoal: '不安発生時のリラクセーションを実施できる',
    ote: {
      observation: ['不安の程度(SUD)', '身体症状'],
      therapy: ['深呼吸・漸進的筋弛緩法の実施支援'],
      education: ['不安のメカニズムを説明する'],
    },
    status: 'active', createdAt: '2026-02-15', createdBy: 'ns-b',
    lastEvaluatedAt: '2026-03-15', nextEvaluationDueAt: '2026-04-15',
  },
  {
    id: 'pi-006-2', carePlanId: 'cp-006', domain: '社会', priority: 'medium', nandaCode: '00052',
    shortTermGoal: '集団療法に週2回以上参加できる',
    ote: {
      observation: ['参加時の表情・発言'],
      therapy: ['参加前の声かけ・同伴'],
      education: ['集団療法の意義を説明する'],
    },
    status: 'active', createdAt: '2026-02-15', createdBy: 'ns-b',
    lastEvaluatedAt: '2026-03-20', nextEvaluationDueAt: '2026-04-20',
  },
  // --- cp-007 渡辺正雄 (通常) ---
  {
    id: 'pi-007-1', carePlanId: 'cp-007', domain: '精神', priority: 'high', nandaCode: '00078',
    shortTermGoal: '断酒プログラムに毎日参加できる',
    ote: {
      observation: ['参加状況', '飲酒欲求の訴え'],
      therapy: ['参加への声かけ', '達成時のフィードバック'],
      education: ['依存症の病気教育'],
    },
    status: 'active', createdAt: '2026-03-20', createdBy: 'ns-b',
    nextEvaluationDueAt: '2026-05-10',
  },
  {
    id: 'pi-007-2', carePlanId: 'cp-007', domain: '身体', priority: 'medium', nandaCode: '00002',
    shortTermGoal: '3食の食事摂取量80%以上を維持する',
    ote: {
      observation: ['食事摂取量', '体重推移'],
      therapy: ['食事の嗜好確認', '必要時の栄養補助'],
      education: ['栄養バランスの指導'],
    },
    status: 'active', createdAt: '2026-03-20', createdBy: 'ns-b',
    nextEvaluationDueAt: '2026-05-10',
  },
  // --- cp-008 中村早苗 (今月評価必要) ---
  {
    id: 'pi-008-1', carePlanId: 'cp-008', domain: '安全', priority: 'high', nandaCode: '00150',
    shortTermGoal: '希死念慮出現時にスタッフに伝えることができる',
    ote: {
      observation: ['希死念慮の有無・程度', '危険物の有無確認'],
      therapy: ['訪室頻度の増加', '傾聴と共感的対応'],
      education: ['SOSを発信することの重要性を伝える'],
    },
    status: 'active', createdAt: '2025-10-05', createdBy: 'ns-c',
    lastEvaluatedAt: '2026-03-22', nextEvaluationDueAt: '2026-04-22',
  },
  {
    id: 'pi-008-2', carePlanId: 'cp-008', domain: '精神', priority: 'medium', nandaCode: '00124',
    shortTermGoal: '1日1つ以上楽しめることを見つける',
    ote: {
      observation: ['活動への関心', '表情の変化'],
      therapy: ['作業療法への同伴'],
      education: ['小さな達成体験を一緒に振り返る'],
    },
    status: 'active', createdAt: '2025-10-05', createdBy: 'ns-c',
    lastEvaluatedAt: '2026-03-22', nextEvaluationDueAt: '2026-04-22',
  },
  {
    id: 'pi-008-3', carePlanId: 'cp-008', domain: '日常生活', priority: 'low', nandaCode: '00096',
    shortTermGoal: '規則正しい生活リズムを維持する',
    ote: {
      observation: ['起床・就寝時刻', '日中の活動量'],
      therapy: ['日課表を用いた生活支援'],
      education: ['生活リズムの重要性を説明する'],
    },
    status: 'active', createdAt: '2025-10-05', createdBy: 'ns-c',
    lastEvaluatedAt: '2026-03-22', nextEvaluationDueAt: '2026-04-22',
  },
  // --- cp-009 小林拓也 (通常) ---
  {
    id: 'pi-009-1', carePlanId: 'cp-009', domain: '精神', priority: 'high', nandaCode: '00146',
    shortTermGoal: 'パニック発作時の対処行動を実施できる',
    ote: {
      observation: ['発作の頻度・誘因'],
      therapy: ['落ち着ける環境提供', '呼吸法の実施支援'],
      education: ['認知行動療法の基本を説明する'],
    },
    status: 'active', createdAt: '2026-02-25', createdBy: 'ns-c',
    nextEvaluationDueAt: '2026-05-05',
  },
  {
    id: 'pi-009-2', carePlanId: 'cp-009', domain: '社会', priority: 'low', nandaCode: '00069',
    shortTermGoal: '外出訓練を段階的に進められる',
    ote: {
      observation: ['外出時の不安程度'],
      therapy: ['段階的曝露の同伴'],
      education: ['曝露療法の意味を説明する'],
    },
    status: 'active', createdAt: '2026-02-25', createdBy: 'ns-c',
    nextEvaluationDueAt: '2026-05-05',
  },
  // --- cp-010 加藤由美 (通常) ---
  {
    id: 'pi-010-1', carePlanId: 'cp-010', domain: '精神', priority: 'high', nandaCode: '00120',
    shortTermGoal: '自己肯定的な発言が1日1回以上できる',
    ote: {
      observation: ['発言内容の傾向', '他者との関わり'],
      therapy: ['肯定的フィードバック'],
      education: ['自己受容について一緒に考える'],
    },
    status: 'active', createdAt: '2025-12-01', createdBy: 'ns-c',
    lastEvaluatedAt: '2026-03-30', nextEvaluationDueAt: '2026-04-30',
  },
  {
    id: 'pi-010-2', carePlanId: 'cp-010', domain: 'セルフケア', priority: 'medium', nandaCode: '00109',
    shortTermGoal: '毎日清潔な服装を整えられる',
    ote: {
      observation: ['更衣の実施状況', '身だしなみ'],
      therapy: ['更衣の声かけ・支援'],
      education: ['身だしなみの重要性を説明する'],
    },
    status: 'active', createdAt: '2025-12-01', createdBy: 'ns-c',
    lastEvaluatedAt: '2026-03-30', nextEvaluationDueAt: '2026-04-30',
  },
];

export const EVALUATIONS: Evaluation[] = [
  {
    id: 'ev-001', problemItemId: 'pi-001-1', evaluatedAt: '2026-02-15', evaluatedBy: 'ns-a',
    achievement: 'not_achieved', findings: '服薬時の見守りがないと飲み忘れが目立つ', nextStatus: 'active',
  },
  {
    id: 'ev-002', problemItemId: 'pi-001-1', evaluatedAt: '2026-03-15', evaluatedBy: 'ns-a',
    achievement: 'partial', findings: '服薬に声かけが必要だが一部は自主的に内服できる', nextStatus: 'active',
  },
  {
    id: 'ev-003', problemItemId: 'pi-001-2', evaluatedAt: '2026-03-15', evaluatedBy: 'ns-a',
    achievement: 'achieved', findings: '暴力行為なく落ち着いて過ごせている', nextStatus: 'active',
  },
  {
    id: 'ev-004', problemItemId: 'pi-002-1', evaluatedAt: '2026-02-28', evaluatedBy: 'ns-a',
    achievement: 'partial', findings: '少しずつ発語が増えているが、絶望感の言語化は限定的', nextStatus: 'active',
  },
  {
    id: 'ev-005', problemItemId: 'pi-002-1', evaluatedAt: '2026-03-28', evaluatedBy: 'ns-a',
    achievement: 'partial', findings: '信頼関係が構築されてきた。気分の波を自覚できる日も出てきた', nextStatus: 'active',
  },
  {
    id: 'ev-006', problemItemId: 'pi-004-1', evaluatedAt: '2026-03-10', evaluatedBy: 'ns-a',
    achievement: 'not_achieved', findings: '躁状態がみられ対処行動の獲得に至っていない', nextStatus: 'evaluating',
  },
  {
    id: 'ev-007', problemItemId: 'pi-008-1', evaluatedAt: '2026-03-22', evaluatedBy: 'ns-c',
    achievement: 'partial', findings: '希死念慮は出現するが、スタッフへの訴えが増えている', nextStatus: 'active',
  },
];

export const TEMPLATES: Template[] = [
  {
    id: 'tpl-sz', name: '統合失調症 標準計画',
    longTermGoal: '服薬自己管理ができ、安定した地域生活を送れる',
    problemItems: [
      {
        domain: '服薬', priority: 'high', nandaCode: '00078',
        shortTermGoal: '処方薬を自身で管理して服薬できる',
        ote: {
          observation: ['服薬状況の確認', '副作用の有無観察'],
          therapy: ['服薬時の見守り'],
          education: ['服薬の重要性を説明する'],
        },
      },
      {
        domain: '精神', priority: 'high', nandaCode: '00069',
        shortTermGoal: '幻聴等の症状への対処行動を実施できる',
        ote: {
          observation: ['症状の頻度と内容'],
          therapy: ['リラクセーションの導入'],
          education: ['対処行動を一緒に練習する'],
        },
      },
      {
        domain: '社会', priority: 'medium', nandaCode: '00052',
        shortTermGoal: '集団活動に参加できる',
        ote: {
          observation: ['集団場面での様子'],
          therapy: ['活動への声かけ・同伴'],
          education: ['集団活動の意義を説明する'],
        },
      },
    ],
  },
  {
    id: 'tpl-dep', name: 'うつ病 標準計画',
    longTermGoal: '気分の安定を保ち、日常生活動作を自立して行える',
    problemItems: [
      {
        domain: '安全', priority: 'high', nandaCode: '00150',
        shortTermGoal: '希死念慮出現時にスタッフに伝えることができる',
        ote: {
          observation: ['希死念慮の有無と程度'],
          therapy: ['訪室頻度の増加', '傾聴'],
          education: ['SOS発信の重要性を伝える'],
        },
      },
      {
        domain: '日常生活', priority: 'medium', nandaCode: '00095',
        shortTermGoal: '夜間の睡眠時間を確保できる',
        ote: {
          observation: ['入眠・中途覚醒'],
          therapy: ['就寝前の環境調整'],
          education: ['睡眠衛生の指導'],
        },
      },
    ],
  },
  {
    id: 'tpl-bp', name: '双極性障害 標準計画',
    longTermGoal: '気分の波をコントロールし、再発予防行動がとれる',
    problemItems: [
      {
        domain: '精神', priority: 'high', nandaCode: '00069',
        shortTermGoal: '気分変動時の対処法を身につける',
        ote: {
          observation: ['気分の変動'],
          therapy: ['気分記録の支援'],
          education: ['再発のサインを指導する'],
        },
      },
    ],
  },
  {
    id: 'tpl-anx', name: '不安障害 標準計画',
    longTermGoal: '不安症状を自分でコントロールできる',
    problemItems: [
      {
        domain: '精神', priority: 'high', nandaCode: '00146',
        shortTermGoal: '不安発生時のリラクセーションを実施できる',
        ote: {
          observation: ['不安の程度(SUD)'],
          therapy: ['呼吸法の実施支援'],
          education: ['不安のメカニズムを説明する'],
        },
      },
    ],
  },
];

export const INITIAL_CHANGE_LOGS: ChangeLog[] = [
  {
    id: 'log-001', targetType: 'care_plan', targetId: 'cp-001', action: 'create',
    actorId: 'ns-a', actorName: '田村 幸子', at: '2026-01-15T09:30:00', summary: '看護計画を立案',
  },
  {
    id: 'log-002', targetType: 'evaluation', targetId: 'ev-002', action: 'evaluate',
    actorId: 'ns-a', actorName: '田村 幸子', at: '2026-03-15T14:20:00', summary: '月次評価を実施',
  },
];

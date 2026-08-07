/**
 * ep-11 us-61: リハ（リハビリ指示＝治療形態）のモックマスタ。
 * 参考システムマニュアル（リハビリ支援オプション 第4章 指示入力／マスタ保守 第37部 リハビリプログラムマスタ）の
 * 「活動種目」を、精神科リハ（作業療法・SST・集団プログラム 等）向けにワイヤーフレーム用へ簡略化した固定データ。
 */

/** リハビリプログラム（活動種目）1 件。category で折り畳み表示する。 */
export interface RehaProgram {
  code: number;
  name: string;
  /** かな検索・並び用の読み。 */
  kana: string;
  /** カテゴリ（治療形態のまとまり）。 */
  category: string;
}

export const REHA_PROGRAMS: RehaProgram[] = [
  // 作業療法（OT）
  { code: 101, name: '作業療法（個別プログラム）', kana: 'さぎょうりょうほうこべつ', category: '作業療法' },
  { code: 102, name: '作業療法（集団プログラム）', kana: 'さぎょうりょうほうしゅうだん', category: '作業療法' },
  { code: 103, name: '調理活動', kana: 'ちょうりかつどう', category: '作業療法' },
  { code: 104, name: '手工芸', kana: 'しゅこうげい', category: '作業療法' },
  { code: 105, name: '園芸活動', kana: 'えんげいかつどう', category: '作業療法' },
  { code: 106, name: '書道・絵画', kana: 'しょどうかいが', category: '作業療法' },
  // 生活技能訓練
  { code: 201, name: 'SST（社会技能訓練）', kana: 'えすえすてぃしゃかいぎのうくんれん', category: '生活技能訓練' },
  { code: 202, name: '服薬自己管理プログラム', kana: 'ふくやくじこかんり', category: '生活技能訓練' },
  { code: 203, name: '金銭管理プログラム', kana: 'きんせんかんり', category: '生活技能訓練' },
  // 心理教育
  { code: 301, name: '疾病理解プログラム', kana: 'しっぺいりかい', category: '心理教育' },
  { code: 302, name: '再発予防プログラム', kana: 'さいはつよぼう', category: '心理教育' },
  // 運動・レク・芸術
  { code: 401, name: '運動プログラム', kana: 'うんどうぷろぐらむ', category: '運動・レク・芸術' },
  { code: 402, name: 'レクリエーション', kana: 'れくりえーしょん', category: '運動・レク・芸術' },
  { code: 403, name: '音楽療法', kana: 'おんがくりょうほう', category: '運動・レク・芸術' },
];

/** 実施頻度の候補。 */
export const REHA_FREQUENCIES = ['週1回', '週2回', '週3回', '週5回', '毎日'];

/** 転帰区分（終了・変更時に使用。マスタ保守／区分マスタ／リハビリ_転帰区分 相当）。 */
export const REHA_OUTCOMES = ['継続', '軽快', '終了', '中止'];

/**
 * リハビリ（治療形態）オーダの 3 画面。参考システム実機（リハビリオーダ画面）に準拠。
 * 作業療法／服薬指導／栄養指導。上部ボタンで切替、初期は作業療法。
 */
export type RehaTreatment = '作業療法' | '服薬指導' | '栄養指導';
export const REHA_TREATMENTS: RehaTreatment[] = ['作業療法', '服薬指導', '栄養指導'];

/** 治療形態ごとの通達先。 */
export const REHA_DESTINATION: Record<RehaTreatment, string> = {
  作業療法: '作業療法室', 服薬指導: '薬局', 栄養指導: '栄養科',
};

/** 診断病名・病名の候補（モック）。 */
export const REHA_DIAGNOSES = ['統合失調症', 'うつ病', '双極性障害', '認知症', 'アルコール依存症', '不安障害'];

// ── 作業療法 ──
export const OT_PURPOSES = ['生活技術の獲得・学習', '対人関係技能の改善・学習', '生活リズムの獲得', '活動性の向上・賦活', '情緒の安定・正常化', '身体機能の維持・向上', '退院・就労準備'];
export const OT_SYMPTOMS = ['感情鈍麻', '意欲低下', '好辱的生活', '対人緊張感', '妄想', '幻聴', '無為・自閉', '独語', '不安', '興奮', '多弁・多動', '抑うつ', '失見当識', '空笑'];
export const OT_CAUTIONS = ['暴力', '易怒性', '拒絶', '衝動行為', '離院', '他患とのトラブル', 'ふらつき転倒', '盗食', '異食', '早食い', '誤嚥', '多飲水', '痙攣発作'];

// ── 服薬指導 ──
export const MED_REQUESTS = ['服薬アドヒアランスの向上', '薬効・副作用の説明', '副作用のチェック'];

// ── 栄養指導 ──
export const NUTRI_TOPICS = ['減塩食のコツについて', 'コレステロール対策', '糖尿病食事療法のポイントについて', '中性脂肪対策', 'バランスの良い食事のポイント'];
export const NUTRI_LABS = ['クレアチニン', '尿素窒素', '血糖値', 'HbA1C', 'GOT', 'GPT', 'γGTP', 'ALP', 'LDL', '総ビリルビン', 'コレステロール', 'TG'];
export const NUTRI_DIETS = ['常食', '軟菜', '糖尿', '潰瘍食', '肝臓', '腎臓食', '脂質異常症', '減塩食', '肥満'];
export const NUTRI_ENERGY = ['1200kcal', '1400kcal', '1600kcal', '1800kcal', '2000kcal'];
export const NUTRI_PROTEIN = ['35g', '45g', '55g', '60g', '65g', '70g', '75g', '80g'];
export const NUTRI_FAT = ['30g', '35g', '40g', '45g', '50g', '55g'];
export const NUTRI_CARB = ['190g', '240g', '270g', '300g', '330g', '350g', '400g', '450g'];
export const NUTRI_SALT = ['5g', '6g', '10g'];

/** リハビリ（治療形態）フォームの状態。履歴から復元できるよう全項目を保持。 */
export interface RehaForm {
  treatment: RehaTreatment;
  ward: string;
  room: string;
  height: string;
  weight: string;
  diagnosis: string;
  diseaseName: string;
  orderDate: string;
  destination: string;
  // 作業療法
  otPurposes: string[]; otPurposeOther: string;
  otSymptoms: string[]; otSymptomOther: string;
  otCautions: string[]; otCautionOther: string;
  suicideHistory: '無' | '有';
  deathWish: '無' | '有';
  // 服薬指導
  medRequests: string[]; medRequestOther: string;
  pharmacistNote: string;
  // 栄養指導
  nutriTopics: string[]; nutriFreeComment: string;
  bmiDate: string;
  labChecked: string[]; labValues: Record<string, string>;
  diets: string[];
  energy: string; protein: string; fat: string; carb: string; salt: string;
  waterKind: 'なし' | 'あり'; water: string;
}

/**
 * 指定した治療形態の空フォームを作る。病棟/病室/身長/体重は患者情報から初期化（defaults）。
 * 病名（diseaseName）の下段編集欄は主病名を初期表示する（defaults.diseaseName）。
 */
export function emptyRehaForm(
  treatment: RehaTreatment, orderDate: string,
  defaults?: { ward?: string; room?: string; height?: string; weight?: string; diseaseName?: string },
): RehaForm {
  return {
    treatment,
    ward: defaults?.ward ?? '', room: defaults?.room ?? '',
    height: defaults?.height ?? '', weight: defaults?.weight ?? '',
    diagnosis: '', diseaseName: defaults?.diseaseName ?? '',
    orderDate, destination: REHA_DESTINATION[treatment],
    otPurposes: [], otPurposeOther: '',
    otSymptoms: [], otSymptomOther: '',
    otCautions: [], otCautionOther: '',
    suicideHistory: '無', deathWish: '無',
    medRequests: [], medRequestOther: '',
    pharmacistNote: '',
    nutriTopics: [], nutriFreeComment: '',
    bmiDate: '',
    labChecked: [], labValues: {},
    diets: [],
    energy: '', protein: '', fat: '', carb: '', salt: '',
    waterKind: 'なし', water: '',
  };
}

/** フォーム内容をオーダ content 用の要約文字列にする。 */
export function rehaFormSummary(f: RehaForm): string {
  const lines: string[] = [`【${f.treatment}指示】`];
  if (f.diagnosis) lines.push(`診断病名: ${f.diagnosis}`);
  if (f.treatment === '作業療法') {
    const purposes = [...f.otPurposes, ...(f.otPurposeOther ? [f.otPurposeOther] : [])];
    if (purposes.length) lines.push(`依頼目的: ${purposes.join('・')}`);
    const sym = [...f.otSymptoms, ...(f.otSymptomOther ? [f.otSymptomOther] : [])];
    if (sym.length) lines.push(`主症状: ${sym.join('・')}`);
    const caution = [...f.otCautions, ...(f.otCautionOther ? [f.otCautionOther] : [])];
    if (caution.length) lines.push(`注意事項: ${caution.join('・')}`);
    lines.push(`自殺企図歴: ${f.suicideHistory}／希死念慮: ${f.deathWish}`);
  } else if (f.treatment === '服薬指導') {
    const req = [...f.medRequests, ...(f.medRequestOther ? [f.medRequestOther] : [])];
    if (req.length) lines.push(`依頼内容: ${req.join('・')}`);
    if (f.pharmacistNote) lines.push(`薬剤師へ: ${f.pharmacistNote}`);
  } else {
    const topics = [...f.nutriTopics, ...(f.nutriFreeComment ? [f.nutriFreeComment] : [])];
    if (topics.length) lines.push(`指導内容: ${topics.join('・')}`);
    if (f.diets.length) lines.push(`指示食種: ${f.diets.join('・')}`);
    const diet2 = [f.energy, f.protein && `蛋白${f.protein}`, f.fat && `脂質${f.fat}`, f.carb && `炭水化物${f.carb}`, f.salt && `塩分${f.salt}`].filter(Boolean);
    if (diet2.length) lines.push(diet2.join('・'));
    if (f.labChecked.length) lines.push(`検査結果: ${f.labChecked.map((k) => `${k}${f.labValues[k] ? `=${f.labValues[k]}` : ''}`).join('・')}`);
  }
  return lines.join('\n');
}

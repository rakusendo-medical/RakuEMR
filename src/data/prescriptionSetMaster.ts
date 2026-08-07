/**
 * ep-11 us-54 処方セットマスタ（モック）。
 * 参考システムの実マスタ入力ファイルから抽出した精神科向けの処方セット。
 * 構造: 処方セット → 処方マスタ(用量・単位・用法) → 医薬品マスタ(名称)。
 * 単位・用法は単位マスタ／用法マスタで解決済み。日数は処方マスタ由来（本モックの Rp では order 側の日数を使用）。
 */

export interface SetMedication { code: number; name: string; kana: string; }
export interface SetPrescription { code: number; medCode: number; dose: string; unit: string; usage: string; days: number | null; }
export interface PrescriptionSetDef { code: number; name: string; prescriptionCodes: number[]; }

/** 医薬品マスタ（05・抽出）: 外部連携コードを code とする。 */
export const SET_MEDICATIONS: SetMedication[] = [
  { code: 610453040, name: '【般】カルバマゼピン錠１００ｍｇ', kana: 'かるばまぜぴんじよう１００ＭＧ' },
  { code: 620003080, name: 'スルピリド錠５０ｍｇ「アメル」', kana: 'するぴりどじよう０５０ＭＧあめる' },
  { code: 620003151, name: '【般】ジアゼパム錠２ｍｇ', kana: 'じあぜぱむじよう２ＭＧ' },
  { code: 620003954, name: '酸化マグネシウム錠３３０ｍｇ「ＴＸ」', kana: 'さんかまぐねしうむじよう３３０ＭＧＴ' },
  { code: 620004028, name: 'バルプロ酸ナトリウムＳＲ錠２００ｍｇ「アメル」', kana: 'ばるぷろさんなとりうむＳＲじよう２' },
  { code: 620005517, name: 'タンドスピロンクエン酸塩錠１０ｍｇ「トーワ」', kana: 'たんどすぴろんくえんさんえんじょう' },
  { code: 620006836, name: 'アルプラゾラム錠０．４ｍｇ「トーワ」', kana: 'あるぷらぞらむじょう0.4MGとー' },
  { code: 620006897, name: 'クロチアゼパム錠５ｍｇ「トーワ」', kana: 'くろちあぜぱむじょう5MGとーわ' },
  { code: 620008165, name: 'リスペリドン内用液１ｍｇ／ｍＬ「タカタ」　０．１％', kana: 'りすぺりどんないようえき1MG/ML' },
  { code: 620049101, name: '【般】ロラゼパム錠０．５ｍｇ', kana: 'ろらぜぱむじよう０．５ＭＧ' },
  { code: 620150302, name: 'エチゾラム錠１ｍｇ「アメル」', kana: 'えちぞらむじょう1MGあめる' },
  { code: 620339604, name: 'ベザフィブラート徐放錠２００ｍｇ「ＮＩＧ」', kana: 'べざふぃぶらーとじょほうじょう' },
  { code: 620476901, name: '【般】酸化マグネシウム錠２５０ｍｇ', kana: 'さんかまぐねしうむじよう２５０ＭＧ' },
  { code: 620488501, name: 'ピコスルファートナトリウム錠２．５ｍｇ「イワキ」', kana: 'ぴこするふあーとなとりうむじよう２．' },
  { code: 621470101, name: '【般】カルベジロール錠１０ｍｇ', kana: 'かるべじろーるじよう１０ＭＧ' },
  { code: 622134201, name: 'ゾルピデム酒石酸塩錠１０ｍｇ「明治」', kana: 'ぞるぴでむしゅせきさんえんじょう' },
  { code: 622180101, name: 'クエチアピン錠１００ｍｇ「明治」', kana: 'くえちあぴんじょう100MGめいじ' },
  { code: 622182901, name: 'アミティーザカプセル２４μｇ', kana: 'あみていーざかぷせる２４まいくろＧ' },
  { code: 622374201, name: 'ベルソムラ錠１５ｍｇ', kana: 'べるそむらじよう１５ＭＧ' },
  { code: 622472401, name: 'オランザピン錠２．５ｍｇ「ＹＤ」', kana: 'おらんざぴんじょう2.5MGYD' },
  { code: 622546701, name: 'インチュニブ錠１ｍｇ', kana: 'いんちゆにぶじよう１ＭＧ' },
  { code: 622611700, name: 'オランザピン５ｍｇ口腔内崩壊錠', kana: 'おらんざぴん5MGこうくうないほうか' },
  { code: 622611900, name: 'オランザピン１０ｍｇ口腔内崩壊錠', kana: 'おらんざぴん10MGこうくうないほう' },
  { code: 622670901, name: 'ブロナンセリン錠８ｍｇ「タカタ」', kana: 'ぶろなんせりんじょう8MGたかた' },
  { code: 622703101, name: 'デエビゴ錠２．５ｍｇ', kana: 'でえびごじよう２．５ＭＧ' },
  { code: 622703201, name: 'デエビゴ錠５ｍｇ', kana: 'でえびごじよう５ＭＧ' },
  { code: 622908301, name: '【般】ラメルテオン錠８ｍｇ', kana: 'らめるておんじよう８' },
  { code: 622925601, name: 'ラメルテオン錠８ｍｇ「サワイ」', kana: 'らめるておんじょう8MGさわい' },
  { code: 622937401, name: 'アジルサルタン錠１０ｍｇ「トーワ」', kana: 'あじるさるたんじょう10MGとーわ' },
];

/** 処方マスタ（06・抽出）: 医薬品CD＝外部連携コードを参照。 */
export const SET_PRESCRIPTIONS: SetPrescription[] = [
  { code: 26, medCode: 620006897, dose: '3', unit: '錠', usage: '１日３回　毎食前', days: 30 },
  { code: 27, medCode: 620003080, dose: '3', unit: '錠', usage: '１日３回　毎食前', days: 30 },
  { code: 28, medCode: 620339604, dose: '1', unit: '錠', usage: '１日１回　夕食後', days: 30 },
  { code: 29, medCode: 622937401, dose: '1', unit: '錠', usage: '１日１回　夕食後', days: 30 },
  { code: 30, medCode: 621470101, dose: '1', unit: '錠', usage: '１日１回　朝食前', days: 30 },
  { code: 111, medCode: 620008165, dose: '2', unit: '包', usage: '１日２回　朝夕食後', days: 28 },
  { code: 112, medCode: 622374201, dose: '1', unit: '錠', usage: '１日１回　寝る前', days: 28 },
  { code: 113, medCode: 622703201, dose: '1', unit: '錠', usage: '１日１回　寝る前', days: 28 },
  { code: 114, medCode: 622703201, dose: '1', unit: '錠', usage: '１日１回　寝る前', days: 14 },
  { code: 149, medCode: 620004028, dose: '2', unit: '錠', usage: '１日２回　朝夕食前', days: 30 },
  { code: 150, medCode: 622703101, dose: '1', unit: '錠', usage: '１日１回　寝る前', days: 30 },
  { code: 151, medCode: 622472401, dose: '1', unit: '錠', usage: '１日１回　寝る前', days: 30 },
  { code: 152, medCode: 622546701, dose: '3', unit: '錠', usage: '１日１回　寝る前', days: 30 },
  { code: 153, medCode: 620003954, dose: '2', unit: '錠', usage: '１日２回　朝夕食前', days: 30 },
  { code: 154, medCode: 622182901, dose: '2', unit: 'カプセル', usage: '１日２回　朝夕食前', days: 30 },
  { code: 155, medCode: 620488501, dose: '3', unit: '錠', usage: '１日３回　毎食後', days: 30 },
  { code: 156, medCode: 622611900, dose: '1', unit: '錠', usage: '１日１回　夕食後', days: 30 },
  { code: 157, medCode: 622925601, dose: '1', unit: '錠', usage: '１日１回　夕食後', days: 30 },
  { code: 158, medCode: 610453040, dose: '1', unit: '錠', usage: '１日１回　朝食後', days: 30 },
  { code: 159, medCode: 620006836, dose: '3', unit: '錠', usage: '１日３回　毎食前', days: 30 },
  { code: 160, medCode: 622134201, dose: '1', unit: '錠', usage: '１日１回　寝る前', days: 30 },
  { code: 161, medCode: 620005517, dose: '1', unit: '錠', usage: '１日１回　夕食後', days: 30 },
  { code: 162, medCode: 620049101, dose: '3', unit: '錠', usage: '１日３回　毎食後', days: 14 },
  { code: 179, medCode: 620003151, dose: '1', unit: '錠', usage: '不眠時', days: 10 },
  { code: 209, medCode: 622908301, dose: '1', unit: '錠', usage: '１日１回　寝る前', days: 30 },
  { code: 210, medCode: 622180101, dose: '1', unit: '錠', usage: '１日１回　寝る前', days: 30 },
  { code: 211, medCode: 622611700, dose: '1', unit: '錠', usage: '１日１回　夕食後', days: 30 },
  { code: 212, medCode: 620150302, dose: '2', unit: '錠', usage: '１日２回　朝夕食後', days: 30 },
  { code: 213, medCode: 622670901, dose: '2', unit: '錠', usage: '１日２回　朝夕食後', days: 30 },
  { code: 214, medCode: 622182901, dose: '2', unit: 'カプセル', usage: '１日２回　朝夕食後', days: 30 },
  { code: 215, medCode: 620006897, dose: '1', unit: '錠', usage: '１日１回　夕食後', days: 30 },
  { code: 216, medCode: 620476901, dose: '2', unit: '錠', usage: '１日２回　朝夕食後', days: 30 },
];

/** 処方セットマスタ（07・抽出）: 処方マスタCD を参照。 */
export const PRESCRIPTION_SETS: PrescriptionSetDef[] = [
  { code: 31, name: 'ロラゼパム錠セット', prescriptionCodes: [162] },
  { code: 22, name: 'デエビゴ錠5mg', prescriptionCodes: [114] },
  { code: 35, name: 'ジアゼパム錠２mgセット(不眠時)', prescriptionCodes: [179] },
  { code: 30, name: 'アルプラゾラム錠０．４mgセット', prescriptionCodes: [159, 160, 161] },
  { code: 29, name: 'オランザピン口腔内崩壊錠１０ｍｇセット', prescriptionCodes: [156, 157, 158] },
  { code: 41, name: 'ラメルテオン錠8mgセット', prescriptionCodes: [209, 210, 211, 212] },
  { code: 28, name: 'バルプロ酸ナトリウムSR錠セット', prescriptionCodes: [149, 150, 151, 152, 153, 154, 155] },
  { code: 42, name: 'ブロナンセリン錠セット(8mg)', prescriptionCodes: [213, 214, 215, 216] },
  { code: 21, name: 'リスペリドン経口液０．１セット', prescriptionCodes: [111, 112, 113] },
  { code: 6, name: 'クロチアゼパム錠セット', prescriptionCodes: [26, 27, 28, 29, 30] },
];

const MED_BY_CODE = new Map(SET_MEDICATIONS.map((m) => [m.code, m]));
const PRESC_BY_CODE = new Map(SET_PRESCRIPTIONS.map((p) => [p.code, p]));

/** 処方セットを解決し、処方追加ダイアログの選択薬剤（名称・用量・単位・用法）に展開する。 */
export function resolveSetDrugs(setCode: number): { name: string; dose: string; unit: string; usage: string }[] {
  const set = PRESCRIPTION_SETS.find((s) => s.code === setCode);
  if (!set) return [];
  return set.prescriptionCodes.flatMap((pc) => {
    const p = PRESC_BY_CODE.get(pc);
    if (!p) return [];
    const m = MED_BY_CODE.get(p.medCode);
    if (!m) return [];
    return [{ name: m.name, dose: p.dose, unit: p.unit, usage: p.usage }];
  });
}

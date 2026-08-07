/**
 * ep-11 us-54 処方オーダ入力のモックマスタ。
 * 参考システムの医薬品マスタ・用法選択・単位を、ワイヤーフレーム用に簡略化した固定データ。
 */

/** 医薬品マスタ（モック）。name は「名称（最大用量）」相当、defaultUnit は既定単位。 */
export interface Medication {
  name: string;
  /** 検索用の読み（かな）。かな検索の対象。 */
  kana: string;
  defaultUnit: string;
}

export const MEDICATIONS: Medication[] = [
  { name: 'アキネトン錠1mg', kana: 'あきねとん', defaultUnit: '錠' },
  { name: 'アキネトン細粒1%', kana: 'あきねとん', defaultUnit: 'g' },
  { name: 'リスペリドン錠1mg', kana: 'りすぺりどん', defaultUnit: '錠' },
  { name: 'リスペリドン内用液1mg', kana: 'りすぺりどん', defaultUnit: 'mL' },
  { name: 'レンドルミン錠0.25mg', kana: 'れんどるみん', defaultUnit: '錠' },
  { name: 'ロラゼパム錠1mg', kana: 'ろらぜぱむ', defaultUnit: '錠' },
  { name: 'アセトアミノフェン錠200mg', kana: 'あせとあみのふぇん', defaultUnit: '錠' },
  { name: 'クエチアピン錠25mg', kana: 'くえちあぴん', defaultUnit: '錠' },
  { name: 'バルプロ酸ナトリウム錠200mg', kana: 'ばるぷろさん', defaultUnit: '錠' },
  { name: '酸化マグネシウム錠330mg', kana: 'さんかまぐねしうむ', defaultUnit: '錠' },
];

/** 単位の候補。 */
export const UNIT_OPTIONS = ['錠', '包', 'g', 'mg', 'mL', '管', '枚'];

/**
 * 用法の定型パターン（モック）。参考システムの「処方/用法選択」ダイアログのカテゴリを
 * ワイヤーフレーム用にフラットな選択肢へ簡略化したもの。
 */
export const USAGE_PATTERNS: { group: string; label: string }[] = [
  { group: '食後', label: '1日1回 朝食後' },
  { group: '食後', label: '1日1回 昼食後' },
  { group: '食後', label: '1日1回 夕食後' },
  { group: '食後', label: '1日2回 朝夕食後' },
  { group: '食後', label: '1日3回 毎食後' },
  { group: '食後', label: '1日3回 毎食後・寝る前' },
  { group: '食前', label: '1日3回 毎食前' },
  { group: '就寝前', label: '1日1回 就寝前' },
  { group: '頓服', label: '頓服 不眠時' },
  { group: '頓服', label: '頓服 疼痛時' },
  { group: '頓服', label: '頓服 不穏時' },
  { group: '頓服', label: '頓服 発熱時' },
];

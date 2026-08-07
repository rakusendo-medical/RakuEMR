/**
 * ep-11 us-58: ECT（修正型電気けいれん療法・m-ECT）オーダのモックマスタ。
 * 参考システムマニュアル（第5章 第8部 ECT オーダ／マスタ保守 第66部 ECT マスタ・第67部 ECT セットマスタ）の
 * 構造に合わせたワイヤーフレーム用の固定データ。
 *   - ECT マスタ区分: 手技／前処置／後処置／理由（指示時に指定）。前処置・後処置は用量・単位を持つ。
 *   - ECT セット → サブセット → 項目（手技／前処置／通電時間／後処置）。
 * ※実薬・実手技は参考であり、製品／ベンダー固有名詞は含まない。
 */

/** ECT 項目の区分（指示時に指定する 3 区分）。 */
export type EctCategory = '手技' | '前処置' | '後処置';

/** ECT 項目マスタ 1 件（手技／前処置／後処置。前処置・後処置は単位を持つ）。 */
export interface EctItem {
  code: number;
  category: EctCategory;
  name: string;
  /** かな検索用の読み。 */
  kana: string;
  /** 前処置・後処置の既定単位（手技は空）。 */
  unit?: string;
}

/** ECT 項目マスタ（区分別）。参考システム実機の項目検索（手技／前処置／後処置）に準拠。 */
export const ECT_ITEMS: EctItem[] = [
  // 手技（手技項目検索）
  { code: 8, category: '手技', name: '精神科電気痙攣療法', kana: 'せいしんかでんきけいれんりょうほう' },
  { code: 56, category: '手技', name: '電気痙攣療法薬剤追加', kana: 'でんきけいれんりょうほうやくざいついか' },
  { code: 23, category: '手技', name: '当日指示', kana: 'とうじつしじ' },
  // 前処置（前処置項目検索：麻酔・前投薬・前日/当日朝の与薬）
  { code: 40, category: '前処置', name: 'アトロピン硫酸塩注0.5mg', kana: 'あとろぴんりゅうさんえんちゅう' },
  { code: 3, category: '前処置', name: 'イソゾール注射用0.5g 500mg（溶解液付）', kana: 'いそぞーるちゅうしゃよう' },
  { code: 50, category: '前処置', name: 'インデラル注射液 2mg/A-2mL', kana: 'いんでらるちゅうしゃえき' },
  { code: 48, category: '前処置', name: 'エフェドリン「ナガイ」注射液 40mg/A-1mL', kana: 'えふぇどりんちゅうしゃえき' },
  { code: 55, category: '前処置', name: '塩化ナトリウム注射液【10%】-20mL', kana: 'えんかなとりうむちゅうしゃえき' },
  { code: 17, category: '前処置', name: '大塚蒸留水 20ml', kana: 'おおつかじょうりゅうすい' },
  { code: 54, category: '前処置', name: '生理食塩液 〈20mL〉/A', kana: 'せいりしょくえんえき' },
  { code: 44, category: '前処置', name: '前日内服薬変更 なし', kana: 'ぜんじつないふくやくへんこうなし' },
  { code: 32, category: '前処置', name: '前日内服薬変更 あり', kana: 'ぜんじつないふくやくへんこうあり' },
  { code: 51, category: '前処置', name: '注射用水 〈20mL〉/A', kana: 'ちゅうしゃようすい' },
  { code: 43, category: '前処置', name: 'mECT用追加薬 なし', kana: 'えむいーしーてぃーようついかやくなし' },
  { code: 33, category: '前処置', name: 'mECT用追加薬 あり', kana: 'えむいーしーてぃーようついかやくあり' },
  { code: 1, category: '前処置', name: 'テラプチク 1A 筋注', kana: 'てらぷちく' },
  { code: 34, category: '前処置', name: '当日朝薬（与薬）', kana: 'とうじつあさやくよやく' },
  { code: 36, category: '前処置', name: '当日朝薬（治療後与薬）', kana: 'とうじつあさやくちりょうごよやく' },
  // 後処置（後処置項目検索：覚醒後の与薬・当日昼薬/夕薬）
  { code: 5, category: '後処置', name: 'タスモリン', kana: 'たすもりん' },
  { code: 22, category: '後処置', name: '当日昼薬（中止）', kana: 'とうじつひるやくちゅうし' },
  { code: 24, category: '後処置', name: '当日昼薬（治療後与薬）', kana: 'とうじつひるやくちりょうごよやく' },
  { code: 25, category: '後処置', name: '当日昼薬（限定して与薬）', kana: 'とうじつひるやくげんていしてよやく' },
  { code: 26, category: '後処置', name: '当日昼薬（与薬）', kana: 'とうじつひるやくよやく' },
  { code: 28, category: '後処置', name: '当日夕薬（治療後与薬）', kana: 'とうじつゆうやくちりょうごよやく' },
  { code: 27, category: '後処置', name: '当日夕薬（中止）', kana: 'とうじつゆうやくちゅうし' },
  { code: 29, category: '後処置', name: '当日夕薬（限定して与薬）', kana: 'とうじつゆうやくげんていしてよやく' },
  { code: 30, category: '後処置', name: '当日夕薬（与薬）', kana: 'とうじつゆうやくよやく' },
  { code: 6, category: '後処置', name: 'ヒベルナ', kana: 'ひべるな' },
  { code: 4, category: '後処置', name: 'ヒルナミン（25mg）', kana: 'ひるなみん' },
  { code: 41, category: '後処置', name: 'ラクテック注500ml/袋', kana: 'らくてっくちゅう' },
  { code: 7, category: '後処置', name: 'リントン（5mg）', kana: 'りんとん' },
];

/** 理由マスタ（プルダウン＋所見の生成文章）。 */
export interface EctReason {
  code: number;
  name: string;
  /** [文章生成] で所見欄へ入力する文章。 */
  template: string;
}
export const ECT_REASONS: EctReason[] = [
  { code: 1, name: '重症うつ病（薬物抵抗性）', template: '薬物療法に抵抗性の重症うつ病エピソードに対し、修正型電気けいれん療法（m-ECT）の適応と判断した。' },
  { code: 2, name: '緊張病症候群', template: '緊張病症状に対し、速やかな改善を要するため m-ECT の適応と判断した。' },
  { code: 3, name: '切迫した自殺念慮', template: '切迫した自殺念慮を認め、緊急的に m-ECT の適応と判断した。' },
  { code: 4, name: '薬物療法困難（副作用等）', template: '副作用等により薬物療法の継続が困難なため、m-ECT の適応と判断した。' },
];

/** サブセットが持つ薬剤（前処置・後処置）1 行＝項目コード＋用量。 */
export interface EctSubsetDrug { code: number; dose: string; }

/** ECT サブセット（手技・前処置・通電時間・後処置のひとまとまり）。 */
export interface EctSubset {
  code: number;
  name: string;
  procedureCodes: number[];
  premeds: EctSubsetDrug[];
  /** 通電時間（秒）。 */
  stimSeconds: string;
  postmeds: EctSubsetDrug[];
}

/** ECT セット（伝票名配下・複数サブセットを持つ）。 */
export interface EctSet {
  code: number;
  name: string;
  subsets: EctSubset[];
}

export const ECT_SETS: EctSet[] = [
  {
    code: 1,
    name: '標準 m-ECT',
    subsets: [
      {
        code: 11, name: '両側・標準',
        procedureCodes: [8],
        premeds: [{ code: 40, dose: '' }, { code: 3, dose: '' }, { code: 1, dose: '' }],
        stimSeconds: '5',
        postmeds: [{ code: 5, dose: '' }, { code: 26, dose: '' }],
      },
      {
        code: 12, name: '両側・高用量',
        procedureCodes: [8, 56],
        premeds: [{ code: 40, dose: '' }, { code: 3, dose: '' }, { code: 33, dose: '' }],
        stimSeconds: '6',
        postmeds: [{ code: 5, dose: '' }, { code: 30, dose: '' }],
      },
    ],
  },
  {
    code: 2,
    name: '右片側 m-ECT',
    subsets: [
      {
        code: 21, name: '右片側・標準',
        procedureCodes: [8],
        premeds: [{ code: 40, dose: '' }, { code: 3, dose: '' }],
        stimSeconds: '5',
        postmeds: [{ code: 5, dose: '' }],
      },
    ],
  },
];

/** コードから ECT 項目を引く。 */
export function findEctItem(code: number): EctItem | undefined {
  return ECT_ITEMS.find((i) => i.code === code);
}

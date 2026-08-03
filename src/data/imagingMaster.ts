/**
 * ep-11: 画像オーダ（放射線）のマスタ。参考システム実機（画像オーダ画面）に準拠。
 * 左＝セット名グループ（プルダウン）→セット名一覧、右＝内容（部位／手技／薬剤／フィルムの4区分）。
 * セット名を選ぶと右の内容がロードされ、各区分は[追加]で項目検索から追加できる。
 */

/** 内容の4区分。 */
export type ImagingCategory = '部位' | '手技' | '薬剤' | 'フィルム';

/** [追加] の項目検索マスタ（コード｜名称）。 */
export interface ImagingMasterItem {
  code: number;
  name: string;
  kana: string;
  category: ImagingCategory;
  /** 薬剤の単位（造影剤等）。 */
  unit?: string;
}

/** セット内容テンプレートの1行（部位・手技）。 */
export interface ImagingTemplateItem {
  code?: number;
  name: string;
  checked?: boolean;
}
/** フィルムのテンプレート行（撮影回数＝分画・回）。 */
export interface ImagingFilmTemplate extends ImagingTemplateItem {
  /** 分画（空欄可）。 */
  bunkatsu?: string;
  /** 撮影回数（既定1）。 */
  kaisu?: string;
}

/** セット名（例: 胸部）の内容テンプレート。 */
export interface ImagingSet {
  name: string;
  bui: ImagingTemplateItem[];
  gijutsu: ImagingTemplateItem[];
  yakuzai: ImagingTemplateItem[];
  film: ImagingFilmTemplate[];
}

/** セット名グループ（プルダウン。例: 一般撮影）。 */
export interface ImagingGroup {
  name: string;
  sets: ImagingSet[];
}

// ===== [追加] 項目検索マスタ =====

/** 部位（74xxx）。参考システム実機「部位の追加」ダイアログ準拠。 */
export const BUI_MASTER: ImagingMasterItem[] = [
  { code: 74001, name: '胸部　正面', kana: 'きょうぶ', category: '部位' },
  { code: 74002, name: '胸部　立位　正面', kana: 'きょうぶりつい', category: '部位' },
  { code: 74003, name: '胸部　座位　正面', kana: 'きょうぶざい', category: '部位' },
  { code: 74005, name: '胸部　臥位　正面', kana: 'きょうぶがい', category: '部位' },
  { code: 74006, name: '胸部　立位　2R', kana: 'きょうぶりつい', category: '部位' },
  { code: 74007, name: '胸部　立位　側面', kana: 'きょうぶりつい', category: '部位' },
  { code: 74115, name: '↑撮影可能な体位で1方向撮影します', kana: 'さつえいかのう', category: '部位' },
  { code: 74004, name: 'ウォータース', kana: 'うぉーたーす', category: '部位' },
  { code: 74904, name: '横隔膜中心ポータブル（カテ先確認）', kana: 'おうかくまく', category: '部位' },
  { code: 74107, name: '右足　正面', kana: 'みぎあし', category: '部位' },
  { code: 74110, name: '左足　正面', kana: 'ひだりあし', category: '部位' },
  { code: 74106, name: '右足　2R', kana: 'みぎあし', category: '部位' },
  { code: 74109, name: '左足　2R', kana: 'ひだりあし', category: '部位' },
  { code: 74108, name: '右足　斜位', kana: 'みぎあし', category: '部位' },
  { code: 74111, name: '左足　斜位', kana: 'ひだりあし', category: '部位' },
  { code: 74101, name: '右足関節　正面', kana: 'みぎあしかんせつ', category: '部位' },
  { code: 74104, name: '左足関節　正面', kana: 'ひだりあしかんせつ', category: '部位' },
  { code: 74100, name: '右足関節　2R', kana: 'みぎあしかんせつ', category: '部位' },
  { code: 74103, name: '左足関節　2R', kana: 'ひだりあしかんせつ', category: '部位' },
  { code: 74102, name: '右足関節　側面', kana: 'みぎあしかんせつ', category: '部位' },
  { code: 74105, name: '左足関節　側面', kana: 'ひだりあしかんせつ', category: '部位' },
  { code: 74097, name: '左下腿　2R', kana: 'ひだりかたい', category: '部位' },
  { code: 74050, name: '腹部　臥位　正面', kana: 'ふくぶ', category: '部位' },
  { code: 74051, name: '腹部　立位　正面', kana: 'ふくぶ', category: '部位' },
];

/** 手技（71xxx）。参考システム実機「手技の追加」ダイアログ準拠。 */
export const GIJUTSU_MASTER: ImagingMasterItem[] = [
  { code: 71003, name: '胸部', kana: 'きょうぶ', category: '手技' },
  { code: 71903, name: '胸部', kana: 'きょうぶ', category: '手技' },
  { code: 71901, name: '胸部ポータブル', kana: 'きょうぶ', category: '手技' },
  { code: 71503, name: '胸部CT', kana: 'きょうぶしーてぃー', category: '手技' },
  { code: 71506, name: '胸腹部CT', kana: 'きょうふくぶしーてぃー', category: '手技' },
  { code: 71005, name: '胸骨', kana: 'きょうこつ', category: '手技' },
  { code: 71004, name: '胸椎', kana: 'きょうつい', category: '手技' },
  { code: 71002, name: '頸椎', kana: 'けいつい', category: '手技' },
  { code: 71502, name: '頸部CT', kana: 'けいぶしーてぃー', category: '手技' },
  { code: 71008, name: '肩関節', kana: 'かたかんせつ', category: '手技' },
  { code: 71012, name: '股関節', kana: 'こかんせつ', category: '手技' },
  { code: 71011, name: '骨盤', kana: 'こつばん', category: '手技' },
  { code: 71020, name: '下腿', kana: 'かたい', category: '手技' },
  { code: 71021, name: '足関節', kana: 'あしかんせつ', category: '手技' },
  { code: 71022, name: '足', kana: 'あし', category: '手技' },
  { code: 99001, name: '嚥下内視鏡検査', kana: 'えんげ', category: '手技' },
];

/** 薬剤（造影剤等）。3文字未満は検索不可（表示のみ）＝実機準拠。 */
export const YAKUZAI_MASTER: ImagingMasterItem[] = [
  { code: 62001, name: 'イオパミロン注300', kana: 'いおぱみろん', category: '薬剤', unit: 'mL' },
  { code: 62002, name: 'オムニパーク300注', kana: 'おむにぱーく', category: '薬剤', unit: 'mL' },
  { code: 62003, name: 'イオメロン350注', kana: 'いおめろん', category: '薬剤', unit: 'mL' },
  { code: 62010, name: 'ガドリニウム造影剤', kana: 'がどりにうむ', category: '薬剤', unit: 'mL' },
  { code: 62020, name: '硫酸バリウム', kana: 'りゅうさんばりうむ', category: '薬剤', unit: 'mL' },
  { code: 62004, name: 'イオヘキソール注300', kana: 'いおへきそーる', category: '薬剤', unit: 'mL' },
  { code: 62005, name: 'プロスコープ300注', kana: 'ぷろすこーぷ', category: '薬剤', unit: 'mL' },
  { code: 62011, name: 'マグネスコープ静注', kana: 'まぐねすこーぷ', category: '薬剤', unit: 'mL' },
  { code: 62012, name: 'EOB・プリモビスト注', kana: 'ぷりもびすと', category: '薬剤', unit: 'mL' },
  { code: 62030, name: 'ブスコパン注20mg', kana: 'ぶすこぱん', category: '薬剤', unit: 'A' },
];

/** フィルム（73xxx）。参考システム実機「フィルムの追加」ダイアログ準拠。 */
export const FILM_MASTER: ImagingMasterItem[] = [
  { code: 73001, name: '撮影回数', kana: 'さつえいかいすう', category: 'フィルム' },
];

/** 区分ごとの検索マスタ。 */
export const IMAGING_MASTER_OF: Record<ImagingCategory, ImagingMasterItem[]> = {
  部位: BUI_MASTER,
  手技: GIJUTSU_MASTER,
  薬剤: YAKUZAI_MASTER,
  フィルム: FILM_MASTER,
};

// ===== セット名グループ =====

/** 既定の内容テンプレート（部位=正面／手技=部位名／フィルム=撮影回数1回）。 */
const genSet = (name: string): ImagingSet => ({
  name,
  bui: [{ name: `${name}　正面`, checked: true }],
  gijutsu: [{ name, checked: true }],
  yakuzai: [],
  film: [{ name: '撮影回数', checked: true, kaisu: '1' }],
});

/** 胸部の内容テンプレート（参考システム実機「画像オーダレイアウト」準拠）。 */
const CHEST_SET: ImagingSet = {
  name: '胸部',
  bui: [
    { code: 74001, name: '胸部　正面', checked: true },
    { code: 74115, name: '↑撮影可能な体位で1方向撮影します', checked: false },
    { code: 74002, name: '胸部　立位　正面', checked: false },
    { code: 74003, name: '胸部　座位　正面', checked: false },
    { code: 74005, name: '胸部　臥位　正面', checked: false },
    { code: 74006, name: '胸部　立位　2R', checked: false },
    { code: 74007, name: '胸部　立位　側面', checked: false },
  ],
  gijutsu: [{ code: 71003, name: '胸部', checked: true }],
  yakuzai: [],
  film: [{ code: 73001, name: '撮影回数', checked: true, kaisu: '1' }],
};

/** 一般撮影のセット名一覧（参考システム実機準拠）。胸部のみ詳細、他は既定テンプレート。 */
const GENERAL_SET_NAMES = [
  '腹部', '頭部', '頸椎', '胸椎', '腰椎', '骨盤', '股関節', '胸骨', '鎖骨', '肋骨',
  '肩関節', '上腕', '肘関節', '前腕', '手関節', '手', '大腿', '膝関節', '下腿', '足関節', '足',
];

export const IMAGING_GROUPS: ImagingGroup[] = [
  {
    name: '一般撮影',
    sets: [CHEST_SET, ...GENERAL_SET_NAMES.map(genSet)],
  },
  {
    name: 'CT',
    sets: ['頭部CT', '胸部CT', '腹部CT', '胸腹部CT', '頸部CT'].map(genSet),
  },
  {
    name: 'MRI',
    sets: ['頭部MRI', '頸椎MRI', '腰椎MRI', '膝関節MRI'].map(genSet),
  },
];

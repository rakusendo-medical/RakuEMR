/**
 * ep-11 us-60: IF オーダ（症状に応じた指示）のモックマスタ。
 * 参考システム実機（IFオーダ画面／IF症状条件選択画面）に準拠したワイヤーフレーム用の固定データ。
 */
import type { OrderType } from '../types';

/** IF 症状条件：分類（category）と、その分類で選べる症状コメント候補（IF症状条件選択画面）。 */
export interface IfSymptom {
  category: string;
  comments: string[];
}

// 参考: IF症状条件選択画面（分類→コメント）。「フリーコメント」は自由入力用（コメント無し）。
export const IF_SYMPTOMS: IfSymptom[] = [
  { category: 'フリーコメント', comments: [] },
  { category: '不穏時', comments: ['不穏時（内服）', '不穏時（注射）', '不穏時（イライラ時）'] },
  { category: '不眠時', comments: ['入眠困難時', '中途覚醒時', '早朝覚醒時'] },
  { category: '不安時', comments: ['不安・焦燥時', 'パニック時'] },
  { category: '便秘時', comments: ['便秘時（3日以上排便なし）'] },
  { category: '疼痛時', comments: ['疼痛時', '創部痛時'] },
  { category: '頭痛時', comments: ['頭痛時'] },
  { category: '胃痛時', comments: ['胃痛・胃部不快時'] },
  { category: '吐き気時', comments: ['嘔気・嘔吐時'] },
  { category: 'めまい時', comments: ['めまい・ふらつき時'] },
  { category: '血圧上昇時', comments: ['血圧上昇時'] },
  { category: '低血糖時', comments: ['低血糖症状時'] },
  { category: '喘息発作時', comments: ['喘息発作時'] },
];

/** IF オーダの構成サブオーダ 1 件（種別・内容・スケジュール・日数）。 */
export interface IfSubOrder {
  type: OrderType;
  content: string;
  schedule: string;
  days: number;
}

/** IF セット（セット表示）。共通/個人・カテゴリ別に、登録済みのサブオーダを持つ。 */
export interface IfSet {
  name: string;
  scope: '共通' | '個人';
  /** セットのカテゴリ（左のドロップダウン）。 */
  group: string;
  orders: IfSubOrder[];
}

export const IF_SETS: IfSet[] = [
  {
    name: '一般入院時検査', scope: '共通', group: '検査・オーダー',
    orders: [
      { type: '検査', content: '検査：末梢血液一般5種 ／ 総蛋白(TP) ／ AST(GOT) ／ ALT(GPT) ／ ナトリウム(Na) ／ カリウム(K) ／ 血糖(空腹時) ／ CRP定量', schedule: '入院時', days: 0 },
    ],
  },
  {
    name: '外来検査一般', scope: '共通', group: '検査・オーダー',
    orders: [
      { type: '検査', content: '検査：末梢血液一般5種 ／ 総蛋白(TP) ／ 血糖(空腹時) ／ CRP定量', schedule: '外来', days: 0 },
    ],
  },
  {
    name: '不眠時', scope: '共通', group: '頓用',
    orders: [
      { type: '処方', content: 'Rp1　ブロチゾラム錠0.25mg 1錠（不眠時）', schedule: '不眠時', days: 0 },
    ],
  },
  {
    name: '不穏時', scope: '共通', group: '頓用',
    orders: [
      { type: '注射', content: 'Rp1　ハロペリドール注射液5mg 1管（不穏時 筋注）', schedule: '不穏時', days: 0 },
    ],
  },
  {
    name: '不安時', scope: '共通', group: '頓用',
    orders: [
      { type: '処方', content: 'Rp1　ロラゼパム錠1mg 1錠（不安時）', schedule: '不安時', days: 0 },
    ],
  },
  {
    name: '便秘時', scope: '共通', group: '頓用',
    orders: [
      { type: '処方', content: 'Rp1　酸化マグネシウム錠330mg 2錠（便秘時）', schedule: '便秘時', days: 0 },
    ],
  },
  {
    name: '疼痛時・発熱時', scope: '共通', group: '頓用',
    orders: [
      { type: '処方', content: 'Rp1　アセトアミノフェン錠200mg 2錠（疼痛・発熱時）', schedule: '疼痛・発熱時', days: 0 },
    ],
  },
  {
    name: 'ムズムズ時', scope: '個人', group: '頓用',
    orders: [
      { type: '処方', content: 'Rp1　クロナゼパム錠0.5mg 1錠（ムズムズ時）', schedule: 'ムズムズ時', days: 0 },
    ],
  },
  {
    name: '胃部不快時', scope: '個人', group: '頓用',
    orders: [
      { type: '処方', content: 'Rp1　モサプリドクエン酸塩錠5mg 1錠（胃部不快時）', schedule: '胃部不快時', days: 0 },
    ],
  },
];

/** セット表示のカテゴリ一覧（重複なし）。 */
export const IF_SET_GROUPS = Array.from(new Set(IF_SETS.map((s) => s.group)));

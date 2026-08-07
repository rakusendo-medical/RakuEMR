import type { Medication } from './prescriptionMaster';

/**
 * ep-11 us-56 注射セットマスタ（モック）。参考システムの実マスタ（08 注射マスタ／09 注射セットマスタ・有効フラグ=1）から抽出。
 * 構造: 注射セット → 注射マスタ（名称・単位）＋ セットが持つ 用量・用法（用法は用法マスタで解決）。
 */

/** 注射マスタ（08・抽出）: 注射追加のかな検索に使う。 */
export const INJECTION_MEDICATIONS: Medication[] = [
  { name: 'タゾピペ配合静注用４．５「明治」　（４．５ｇ）', kana: 'たぞぴぺはいごうじょうちゅうよ', defaultUnit: '瓶' },
  { name: 'ソル・コーテフ静注用２５０ｍｇ　（溶解液付）', kana: 'そるこーてふじょうちゅうよう250MG', defaultUnit: '瓶' },
  { name: 'ブロムヘキシン塩酸塩注射液４ｍｇ「タイヨー」　０．２％２ｍＬ', kana: 'ぶろむへきしんえんさんえんちゅうしゃえ', defaultUnit: '管' },
  { name: 'ベクルリー点滴静注用１００ｍｇ', kana: 'べくるりーてんてきじょうちゅうよう1', defaultUnit: '瓶' },
  { name: 'ホリゾン注射液１０ｍｇ', kana: 'ほりぞんちゅうしゃえき10MG', defaultUnit: '管' },
  { name: 'ガスター注射液２０ｍｇ　２ｍＬ', kana: 'がすたーちゅうしゃえき20MG', defaultUnit: '管' },
  { name: 'ＫＣＬ注１０ｍＥｑキット「テルモ」　１モル１０ｍＬ', kana: 'KCLちゅう10MEQきっとてるも', defaultUnit: 'キット' },
  { name: 'ブドウ糖注２０％ＰＬ「フソー」　２０ｍＬ', kana: 'ぶどうとうちゅう20%PLふそー', defaultUnit: '管' },
  { name: 'ドパストン静注２５ｍｇ　０．２５％１０ｍＬ', kana: 'どぱすとんじょうちゅう25MG', defaultUnit: '管' },
  { name: 'ゼプリオン水懸筋注２５ｍｇシリンジ', kana: 'ぜぷりおんすいけんきんちゅう25MG', defaultUnit: 'キット' },
  { name: '生理食塩液　１．３Ｌ', kana: 'せいりしょくえんえき', defaultUnit: '袋' },
  { name: '生理食塩液　１．５Ｌ', kana: 'せいりしょくえんえき', defaultUnit: '袋' },
  { name: '生理食塩液　２Ｌ', kana: 'せいりしょくえんえき', defaultUnit: '袋' },
  { name: 'ラシックス注２０ｍｇ', kana: 'らしっくすちゅう20MG', defaultUnit: '管' },
  { name: 'ラシックス注１００ｍｇ', kana: 'らしっくすちゅう100MG', defaultUnit: '管' },
  { name: '大塚糖液５０％　２００ｍＬ', kana: 'おおつかとうえき50%', defaultUnit: '袋' },
  { name: '大塚糖液５０％　５００ｍＬ', kana: 'おおつかとうえき50%', defaultUnit: '袋' },
  { name: 'カーミパック生理食塩液Ｌ　１．３Ｌ', kana: 'かーみぱっくせいりしょくえんえきL', defaultUnit: '袋' },
  { name: 'ネオフィリン注点滴用バッグ２５０ｍｇ　２５０ｍＬ', kana: 'ねおふぃりんちゅうてんてきようばっぐ', defaultUnit: '袋' },
  { name: 'カーミパック生理食塩液Ｌ　１．５Ｌ', kana: 'かーみぱっくせいりしょくえんえきL', defaultUnit: '袋' },
  { name: 'アドナ注（静脈用）２５ｍｇ　０．５％５ｍＬ', kana: 'あどなちゅうじょうみゃくよう25MG', defaultUnit: '管' },
  { name: 'アドナ注（静脈用）５０ｍｇ　０．５％１０ｍＬ', kana: 'あどなちゅうじょうみゃくよう50MG', defaultUnit: '管' },
  { name: 'アドナ注（静脈用）１００ｍｇ　０．５％２０ｍＬ', kana: 'あどなちゅうじょうみゃくよう100M', defaultUnit: '管' },
  { name: 'アドナ注１０ｍｇ　０．５％２ｍＬ', kana: 'あどなちゅう10MG', defaultUnit: '管' },
];

export interface InjectionSetDef { code: number; name: string; }
interface InjectionSetDrug { name: string; dose: string; unit: string; usage: string; }

/** 注射セットマスタ（09・抽出）: ドロップダウン表示用。 */
export const INJECTION_SETS: InjectionSetDef[] = [
  { code: 1, name: '橋本セット1' },
  { code: 12, name: '橋本セット2' },
  { code: 123, name: '橋本セット3' },
  { code: 9999, name: '武田セット1' },
];

const SET_DRUGS: Record<number, InjectionSetDrug[]> = {
  1: [{ name: 'ソル・コーテフ静注用２５０ｍｇ　（溶解液付）', dose: '1', unit: '瓶', usage: '自己注射' }, { name: 'ゼプリオン水懸筋注２５ｍｇシリンジ', dose: '1', unit: 'キット', usage: 'インスリン皮下注射' }],
  12: [{ name: 'ブロムヘキシン塩酸塩注射液４ｍｇ「タイヨー」　０．２％２ｍＬ', dose: '2', unit: '管', usage: '自己注射' }, { name: 'ブドウ糖注２０％ＰＬ「フソー」　２０ｍＬ', dose: '2', unit: '管', usage: 'インスリン皮下注射' }, { name: 'ドパストン静注２５ｍｇ　０．２５％１０ｍＬ', dose: '1', unit: '管', usage: '腕(点滴)' }, { name: 'ベクルリー点滴静注用１００ｍｇ', dose: '1', unit: '瓶', usage: '腕(注射)' }, { name: 'タゾピペ配合静注用４．５「明治」　（４．５ｇ）', dose: '1', unit: '瓶', usage: '腕(注射)' }],
  123: [{ name: 'ＫＣＬ注１０ｍＥｑキット「テルモ」　１モル１０ｍＬ', dose: '1', unit: 'キット', usage: '自己注射' }],
  9999: [{ name: 'ホリゾン注射液１０ｍｇ', dose: '1', unit: '管', usage: 'インスリン皮下注射' }, { name: 'ガスター注射液２０ｍｇ　２ｍＬ', dose: '3', unit: '管', usage: '自己注射' }],
};

/** 注射セットを解決し、注射追加ダイアログの選択薬剤（名称・用量・単位・用法）に展開する。 */
export function resolveInjectionSetDrugs(setCode: number): InjectionSetDrug[] {
  return SET_DRUGS[setCode] ?? [];
}

/**
 * ep-11 us-55: オーダセット（セット一覧）マスタ。参考システム実機「セット一覧」準拠。
 * セット名グループ（プルダウンで切替）→ セット名リストの2階層。
 * セット名を選ぶと、その内容に沿った複数オーダ（検査・画像・処方系）を「作成中のオーダ」へ一括展開する。
 * 内容は本モックに既にある各マスタ（検査／画像／処方セット）から解決する（新規マスタは作らない）。
 */
import type { OrderType, PrescriptionRpRow } from '../types';
import { TEST_ITEMS } from './testSetMaster';
import { IMAGING_GROUPS } from './imagingMaster';
import { resolveSetDrugs } from './prescriptionSetMaster';
import { buildRxContent, rxOrderDays, rxRenderConfig } from './prescriptionContent';

/** セット1件を構成するオーダ定義（種別ごと）。 */
export type OrderSetEntry =
  // 検査: 検査マスタ（TEST_ITEMS）のコード群を1オーダに束ねる。
  | { kind: '検査'; testCodes: number[] }
  // 画像: 画像マスタ（IMAGING_GROUPS）のグループ名＋セット名で1オーダを生成する。
  | { kind: '画像'; group: string; setName: string }
  // 処方系: 処方セットマスタ（PRESCRIPTION_SETS）のコードから1オーダを生成する。入院定時のみ dialogDays を使う。
  //   注射は処方セット（resolveSetDrugs）では解決できないため対象外（必要時は注射セット解決を別途実装）。
  | { kind: '処方' | '入院定時'; setCode: number; dialogDays?: number };

/** セット名（リストの1項目）。クリックで entries を一括展開する。 */
export interface OrderSetDef { name: string; entries: OrderSetEntry[]; }
/** セット名グループ（プルダウンの1項目）。 */
export interface OrderSetGroup { name: string; sets: OrderSetDef[]; }

/** 解決済みオーダ（オーダ送信画面が id・患者・予定日を補って Order 化する）。 */
export interface ResolvedSetOrder {
  type: OrderType;
  content: string;
  schedule: string;
  days: number;
  /** 処方系のみ: 作成中の2行表示・インライン編集に使う構造化データ。 */
  rx?: { rows: PrescriptionRpRow[]; dialogDays: number };
}

// ===== 一般入院時検査で束ねる検体検査コード（検査マスタ TEST_ITEMS より）=====
// 参考システム実機「一般入院時検査」の検体検査項目を、本モックの検査マスタにある項目へ置き換えたもの。
const ADMISSION_TEST_CODES: number[] = [
  // 末梢血液一般＋血液像
  59, 60, 62, 61, 63, 66,
  // 肝・胆道系
  1, 2, 21, 22, 14, 15, 3590, 17, 18, 19,
  // 腎・電解質
  5, 6, 188, 7, 8, 9, 10, 25, 31,
  // 脂質・糖・鉄
  11, 13, 445, 29, 225, 33, 38,
  // 甲状腺・炎症
  81, 266, 80, 306,
  // 感染症
  51, 55, 311, 102,
  // 尿一般（院内）
  451,
];

// 外来検査一般（一般的な基本セット。院内セット3＝code 2 相当のコード）。
const OUTPATIENT_GENERAL_TEST_CODES: number[] = [
  1, 2, 14, 15, 19, 38, 28, 445, 13, 5, 6, 7, 8, 29, 225, 60, 59, 62, 61, 63,
];

/** オーダセットマスタ。グループ→セット名の2階層。 */
export const ORDER_SET_GROUPS: OrderSetGroup[] = [
  {
    name: '検査・オーダーセット',
    sets: [
      {
        name: '一般入院時検査',
        entries: [
          { kind: '検査', testCodes: ADMISSION_TEST_CODES },
          { kind: '画像', group: '一般撮影', setName: '胸部' },
          { kind: '画像', group: '一般撮影', setName: '腹部' },
        ],
      },
      {
        name: '外来検査一般',
        entries: [{ kind: '検査', testCodes: OUTPATIENT_GENERAL_TEST_CODES }],
      },
    ],
  },
  {
    name: '頓用処方',
    sets: [
      { name: '不眠時', entries: [{ kind: '処方', setCode: 35 }] },
      { name: '睡眠導入', entries: [{ kind: '処方', setCode: 22 }] },
      { name: '不安時', entries: [{ kind: '処方', setCode: 30 }] },
      { name: '不穏時', entries: [{ kind: '処方', setCode: 29 }] },
    ],
  },
];

/** 検査項目コード群 → 検査オーダ（内容は名称を ／ 連結）。 */
function resolveTestEntry(codes: number[]): ResolvedSetOrder | null {
  const names = codes
    .map((c) => TEST_ITEMS.find((t) => t.code === c)?.name)
    .filter((n): n is string => Boolean(n));
  if (names.length === 0) return null;
  return { type: '検査', content: names.join(' ／ '), schedule: '', days: 0 };
}

/** 画像グループ＋セット名 → 画像オーダ（内容は ImagingOrderDialog と同じ表記）。 */
function resolveImagingEntry(groupName: string, setName: string): ResolvedSetOrder | null {
  const grp = IMAGING_GROUPS.find((g) => g.name === groupName);
  const set = grp?.sets.find((s) => s.name === setName);
  if (!set) return null;
  const lines: string[] = [`［${groupName}］-［${setName}］`];
  const bui = set.bui.filter((r) => r.checked).map((r) => r.name);
  if (bui.length) lines.push(`部位: ${bui.join('、')}`);
  const gijutsu = set.gijutsu.filter((r) => r.checked).map((r) => r.name);
  if (gijutsu.length) lines.push(`手技: ${gijutsu.join('、')}`);
  const yakuzai = set.yakuzai.filter((r) => r.checked).map((r) => r.name);
  if (yakuzai.length) lines.push(`薬剤: ${yakuzai.join('、')}`);
  const film = set.film
    .filter((r) => r.checked)
    .map((r) => {
      const parts = [r.name];
      if (r.bunkatsu) parts.push(`${r.bunkatsu}分画`);
      if (r.kaisu) parts.push(`${r.kaisu}回`);
      return parts.join(' ');
    });
  if (film.length) lines.push(`フィルム: ${film.join('、')}`);
  return { type: '画像', content: lines.join('\n'), schedule: '', days: 0 };
}

/** 処方セットコード → 処方系オーダ（用法で Rp 採番。作成中の2行表示・編集用の構造化データも返す）。 */
function resolveRxEntry(
  type: '処方' | '入院定時', setCode: number, dialogDaysOpt?: number,
): ResolvedSetOrder | null {
  const drugs = resolveSetDrugs(setCode);
  if (drugs.length === 0) return null;
  const { perRowDays } = rxRenderConfig(type);
  const rpByUsage = new Map<string, number>();
  let maxRp = 0;
  const rows: PrescriptionRpRow[] = drugs.map((d, i) => {
    let rpNo = rpByUsage.get(d.usage);
    if (rpNo === undefined) { maxRp += 1; rpNo = maxRp; rpByUsage.set(d.usage, rpNo); }
    return {
      id: `pr-set-${i}`,
      rpNo,
      name: d.name, dose: d.dose, unit: d.unit, usage: d.usage,
      ippouGroup: '1', noGeneric: false,
      days: perRowDays ? '7' : undefined,
    };
  });
  const dialogDays = perRowDays ? 0 : (dialogDaysOpt ?? 14);
  return {
    type,
    content: buildRxContent(rows, type, dialogDays),
    days: rxOrderDays(rows, type, dialogDays),
    schedule: rows[0]?.usage ?? '',
    rx: { rows, dialogDays },
  };
}

/** セット定義を解決済みオーダ配列へ展開する（解決できないエントリは除外）。 */
export function resolveOrderSet(def: OrderSetDef): ResolvedSetOrder[] {
  return def.entries
    .map((e): ResolvedSetOrder | null => {
      if (e.kind === '検査') return resolveTestEntry(e.testCodes);
      if (e.kind === '画像') return resolveImagingEntry(e.group, e.setName);
      return resolveRxEntry(e.kind, e.setCode, e.dialogDays);
    })
    .filter((r): r is ResolvedSetOrder => r !== null);
}

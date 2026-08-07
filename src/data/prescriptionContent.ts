/**
 * ep-11: 処方系オーダ（処方／注射／入院定時）の内容文字列ビルダー（共有）。
 * PrescriptionDialog と オーダ送信画面の「作成中のオーダ」の両方で同じ表記を使うために切り出す。
 */
import type { Order, OrderType, PrescriptionRpRow } from '../types';

export interface RxRenderConfig {
  /** 一包化・後発不可等の包装マークを表示するか（処方系＝true・注射＝false）。 */
  showPackaging: boolean;
  /** 日数を Rp（薬剤）単位に持つか（処方・注射＝true・入院定時＝false）。 */
  perRowDays: boolean;
}

/** OrderType から処方系の表示設定を得る。 */
export function rxRenderConfig(type: OrderType): RxRenderConfig {
  if (type === '注射') return { showPackaging: false, perRowDays: true };
  if (type === '処方') return { showPackaging: true, perRowDays: true };
  // 入院定時
  return { showPackaging: true, perRowDays: false };
}

/** 包装マーク（包N・後発不可・公費認定外・別袋）を配列で返す。 */
export function rxMarks(r: PrescriptionRpRow, showPackaging: boolean): string[] {
  if (!showPackaging) return [];
  return [
    r.ippouGroup && r.ippouGroup !== '-' ? `包${r.ippouGroup}` : null,
    r.noGeneric ? '後発不可' : null,
    r.publicExpense ? '公費認定外' : null,
    r.separateBag ? '別袋' : null,
  ].filter(Boolean) as string[];
}

/** 1 薬品の表記（名称 用量単位（用法）（包N…）《用量:…》《用法:…》）。 */
export function rxDrugStr(r: PrescriptionRpRow, showPackaging: boolean): string {
  const base = `${r.name}${r.dose ? ` ${r.dose}${r.unit}` : ''}（${r.usage}）`;
  const marks = rxMarks(r, showPackaging);
  let s = marks.length ? `${base}（${marks.join('・')}）` : base;
  if (r.doseComment && r.doseComment.trim()) s += `　《用量:${r.doseComment.trim()}》`;
  if (r.usageComment && r.usageComment.trim()) s += `　《用法:${r.usageComment.trim()}》`;
  return s;
}

/** Rp 行リストから内容文字列を組み立てる。hideDays（IF頓用）は日数を付けない。 */
export function buildRxContent(
  rows: PrescriptionRpRow[], type: OrderType, dialogDays: number, hideDays = false,
): string {
  const { showPackaging, perRowDays } = rxRenderConfig(type);
  const rpPrefix = (r: PrescriptionRpRow, i: number) =>
    (i === 0 || rows[i - 1].rpNo !== r.rpNo) ? `Rp${r.rpNo}　` : '　　　';
  let lines: string[];
  if (hideDays) {
    lines = rows.map((r, i) => `${rpPrefix(r, i)}${rxDrugStr(r, showPackaging)}`);
  } else if (perRowDays) {
    lines = rows.map((r, i) => {
      const isLastOfRp = i === rows.length - 1 || rows[i + 1].rpNo !== r.rpNo;
      const base = `${rpPrefix(r, i)}${rxDrugStr(r, showPackaging)}`;
      return isLastOfRp && r.days ? `${base}　×${r.days}日分` : base;
    });
  } else {
    lines = rows.map((r, i) => `${rpPrefix(r, i)}${rxDrugStr(r, showPackaging)}`);
    lines.push(dialogDays > 0 ? `${dialogDays}日分` : '継続');
  }
  return lines.join('\n');
}

/** Order.days（指示簿表示用の代表日数）を求める。 */
export function rxOrderDays(
  rows: PrescriptionRpRow[], type: OrderType, dialogDays: number, hideDays = false,
): number {
  if (hideDays) return 0;
  const { perRowDays } = rxRenderConfig(type);
  return perRowDays ? rows.reduce((m, r) => Math.max(m, Number(r.days) || 0), 0) : dialogDays;
}

/** 処方系オーダの型か。 */
export function isRxType(type: OrderType): boolean {
  return type === '処方' || type === '注射' || type === '入院定時';
}

/**
 * 過去に作成したオーダ（履歴）の content を、薬剤行（名称・用量・単位・用法・用量/用法コメント）へ復元する。
 * content は「Rp{番号}　名称 用量単位（用法）（包N…）《用量:…》《用法:…》　×N日分」を改行（または旧 ／）で連結した文字列。
 */
export function orderToDrugs(o: Order): { name: string; dose: string; unit: string; usage: string; doseComment?: string; usageComment?: string; days?: string }[] {
  return o.content
    .split(/\r?\n|\s*／\s*/)
    .map((seg) => seg.replace(/^Rp\d+[　\s]*/, '').replace(/^[　\s]+/, '').trim())
    .filter((seg) => seg !== '' && seg !== '継続' && !/^\d+日分$/.test(seg))
    .map((seg) => parseDrugSegment(seg, o.schedule));
}

/**
 * 1 薬品の表記を 名称・用量・単位・用法・用量/用法コメント・日数 へ分解する。
 * 用法＝最初の丸カッコ。《用量:…》《用法:…》はコメント、末尾「×N日分」は日数として取り出す。
 */
export function parseDrugSegment(seg: string, fallbackUsage: string): { name: string; dose: string; unit: string; usage: string; doseComment?: string; usageComment?: string; days?: string } {
  let rest = seg.trim();
  // 末尾の Rp 日数「×N日分」を分離。
  let days: string | undefined;
  const dayM = rest.match(/\s*×(\d+)日分\s*$/);
  if (dayM) { days = dayM[1]; rest = rest.slice(0, dayM.index).trim(); }
  // 《用量:…》《用法:…》コメントを分離。
  let doseComment: string | undefined;
  let usageComment: string | undefined;
  const dcM = rest.match(/《用量:([^》]*)》/);
  if (dcM) { doseComment = dcM[1]; rest = rest.replace(dcM[0], '').trim(); }
  const ucM = rest.match(/《用法:([^》]*)》/);
  if (ucM) { usageComment = ucM[1]; rest = rest.replace(ucM[0], '').trim(); }

  let usage = fallbackUsage || '';
  let name = rest;
  let dose = '';
  let unit = '';
  const pm = rest.match(/^([^（]+)（([^（）]+)）/); // head（用法）…
  if (pm) {
    const head = pm[1].trim();
    usage = pm[2].trim();
    name = head;
    const dm = head.match(/^(.*\S)\s+(\d+(?:\.\d+)?)\s*(\D+?)\s*$/);
    if (dm) { name = dm[1].trim(); dose = dm[2]; unit = dm[3].trim(); }
  }
  return { name, dose, unit, usage, doseComment, usageComment, days };
}

/**
 * 処方系オーダの content を、作成中の構造化データ（Rp 行＋ダイアログ日数）へ復元する。
 * 用法ごとに Rp を採番。用量/用法コメント・日数（perRowDays）も content から復元する。
 * idPrefix で行 id の一意性を担保する（呼び出し側で order id 等を渡す）。
 */
export function orderToPendingRx(o: Order, idPrefix = 'pr'): { rows: PrescriptionRpRow[]; dialogDays: number } | null {
  if (!isRxType(o.type)) return null;
  const drugs = orderToDrugs(o);
  if (drugs.length === 0) return null;
  const { perRowDays } = rxRenderConfig(o.type);
  let maxRp = 0;
  const rpByUsage = new Map<string, number>();
  const rows: PrescriptionRpRow[] = drugs.map((d, i) => {
    let rpNo = rpByUsage.get(d.usage);
    if (rpNo === undefined) { maxRp += 1; rpNo = maxRp; rpByUsage.set(d.usage, rpNo); }
    return {
      id: `${idPrefix}-${i}`,
      rpNo,
      name: d.name, dose: d.dose, unit: d.unit, usage: d.usage,
      ippouGroup: '1', noGeneric: false,
      doseComment: d.doseComment, usageComment: d.usageComment,
      days: perRowDays ? (d.days ?? (o.days > 0 ? String(o.days) : '7')) : undefined,
    };
  });
  const dialogDays = perRowDays ? 0 : (o.days > 0 ? o.days : 0);
  return { rows, dialogDays };
}

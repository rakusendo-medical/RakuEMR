/**
 * ep-11: 処方系オーダ（処方／注射／入院定時）の内容文字列ビルダー（共有）。
 * PrescriptionDialog と オーダ送信画面の「作成中のオーダ」の両方で同じ表記を使うために切り出す。
 */
import type { OrderType, PrescriptionRpRow } from '../types';

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

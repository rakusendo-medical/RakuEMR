// ===== フローシートパターン変更：マスタ =====
// ケア項目マスタ（CareItemMaster）＋ フローシートパターンマスタ（FlowsheetPatternMaster）。
// パターンは「項目 ID の並び」を参照する。型は ep-10 feature の正準マスタ型を再利用。
// パターンは SPEC us-21 AC-9 の「精神科基本 / 精神科隔離 / 身体管理」。項目は暫定・仮。

import type { CareItemMaster, FlowsheetPatternMaster } from '../../features/flowsheet/types';

// ---- ケア項目マスタ（パターン適用で子行として展開される入力項目・暫定/仮） ----
export const PATTERN_CARE_ITEMS: CareItemMaster[] = [
  // 精神科基本
  { id: 'ci-psy-basic-sleep', name: '睡眠', type: 'text' },
  { id: 'ci-psy-basic-meal',  name: '食事', type: 'text' },
  { id: 'ci-psy-basic-med',   name: '服薬', type: 'text' },
  // 精神科隔離
  { id: 'ci-psy-iso-obs',       name: '観察',     type: 'text' },
  { id: 'ci-psy-iso-excretion', name: '排泄',     type: 'text' },
  { id: 'ci-psy-iso-safety',    name: '安全確認', type: 'text' },
  // 身体管理
  { id: 'ci-phys-weight', name: '体重測定', type: 'text' },
  { id: 'ci-phys-bp',     name: '血圧',     type: 'text' },
  { id: 'ci-phys-fluid',  name: '水分',     type: 'text' },
];

const ITEM_BY_ID = new Map(PATTERN_CARE_ITEMS.map((it) => [it.id, it]));

// ---- フローシートパターンマスタ（SPEC us-21 AC-9・配列順＝プルダウン順） ----
export const FLOWSHEET_PATTERNS: FlowsheetPatternMaster[] = [
  { id: 'fp-psy-basic',     name: '精神科基本', careItemIds: ['ci-psy-basic-sleep', 'ci-psy-basic-meal', 'ci-psy-basic-med'] },
  { id: 'fp-psy-isolation', name: '精神科隔離', careItemIds: ['ci-psy-iso-obs', 'ci-psy-iso-excretion', 'ci-psy-iso-safety'] },
  { id: 'fp-physical',      name: '身体管理',   careItemIds: ['ci-phys-weight', 'ci-phys-bp', 'ci-phys-fluid'] },
];

// ---- 表示ヘルパ ----
// ケア項目の表示ラベル（標準所要時間があれば「名称(N分)」で表示）。
export const careItemLabel = (item: CareItemMaster): string =>
  item.standardMinutes != null ? `${item.name}(${item.standardMinutes}分)` : item.name;

// パターン選択肢（表示名の配列。既定＝先頭の「精神科基本」）。
export const PATTERN_OPTIONS: string[] = FLOWSHEET_PATTERNS.map((p) => p.name);

// パターン名 → 展開するケア項目マスタの配列（表示順）。未知のパターン名は空配列。
export const patternItems = (patternName: string): CareItemMaster[] => {
  const pattern = FLOWSHEET_PATTERNS.find((p) => p.name === patternName);
  if (!pattern) return [];
  return pattern.careItemIds
    .map((id) => ITEM_BY_ID.get(id))
    .filter((it): it is CareItemMaster => it != null);
};

// パターン名 → 展開する入力項目ラベルの配列（未知はそのまま 1 項目）。
export const itemsOf = (patternName: string): string[] => {
  const pattern = FLOWSHEET_PATTERNS.find((p) => p.name === patternName);
  if (!pattern) return [patternName];
  return patternItems(patternName).map((item) => careItemLabel(item));
};

// 記録サマリー帯（最近30日）の「記録種別 × 配色 × 擬似出現率」マスタ。
//
// 目的: フローシート左側の「最近の記録」を時系列で俯瞰するための色バッジ定義。
//   医師・相談員が「いつ・どの記録が・どの程度あるか」を把握するために使う（患者状態そのものではない）。
//
// 運用方針（PM 指示 2026-08-20）:
//   - バッジは「色のみ」。横幅を広げないため、同一日に同種記録が複数あっても 1 つに集約する。
//   - 配色は診療録タブと統一する。診療録タブの記録カテゴリ色は共有モジュール
//     `src/components/karte/recordCategoryColors.ts`（CATEGORY_COLORS）を単一ソースとして参照する
//     （＝色を変えるときはそのファイルを直せば診療録タブと本帯の両方に反映される）。
//   - 部門診療録は診療録タブに対応カテゴリが無いため、PM 指定色をここで直接持つ。
//
// 部門追加の手順: 本ファイルで ①`RecordBadgeKey` に key を足し、②`RECORD_BADGE_TYPES` に 1 行足す
//   （color と pseudoRate を含める）。擬似出現率（pseudoRate）も本マスタに集約しているため、
//   描画側（RecordSummaryStrip）の編集は不要。

import { CATEGORY_COLORS } from '../karte/recordCategoryColors';

export type RecordBadgeKey =
  | 'exam'       // 診療録（医師の診察記録）
  | 'nursing'    // 看護記録
  | 'order'      // オーダー（処方・注射・検査・処置・画像・心理・ECT を集約）
  | 'dept';      // 部門診療録

export interface RecordBadgeType {
  key: RecordBadgeKey;
  /** 帯の行ラベル（正式名） */
  label: string;
  /** ラベル列に出す短縮 1〜2 文字 */
  short: string;
  /** バッジ色（差し替え対象。診療録タブと共有する種別は CATEGORY_COLORS 由来） */
  color: string;
  /**
   * ワイヤーフレーム用の擬似出現率（0〜100・その日に記録がある確率の目安）。
   * 30 日分の実記録モックが無い種別を帯に表示するためのダミー生成に使う（実データと union）。
   */
  pseudoRate: number;
}

// 表示順 = この配列順（上から下）。
export const RECORD_BADGE_TYPES: RecordBadgeType[] = [
  { key: 'exam',    label: '診療録',   short: '診', color: CATEGORY_COLORS['医師記録'], pseudoRate: 45 },
  { key: 'nursing', label: '看護記録', short: '看', color: CATEGORY_COLORS['看護記録'], pseudoRate: 80 },
  { key: 'order',   label: 'オーダー', short: 'オ', color: CATEGORY_COLORS['オーダー'], pseudoRate: 35 },
  { key: 'dept',    label: '部門診療録', short: '部', color: '#16a34a', pseudoRate: 30 }, // PM 指定色（診療録タブに対応色なし）
];

// key → 色/ラベルの逆引き（描画・凡例で使う）。
export const RECORD_BADGE_BY_KEY: Record<RecordBadgeKey, RecordBadgeType> =
  Object.fromEntries(RECORD_BADGE_TYPES.map((t) => [t.key, t])) as Record<RecordBadgeKey, RecordBadgeType>;

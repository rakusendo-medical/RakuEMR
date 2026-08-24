// 診療録タブの記録カテゴリ配色（単一ソース）。
//
// 診療録タブ（MedicalRecordTab）と、フローシートの記録サマリー帯
// （recordBadgeMaster / RecordSummaryStrip）で共有し、2 画面の配色を一致させる。
// 色調整はこの 1 ファイルで行う（両画面へ同時反映される）。

export type RecordCategory =
  | '医師記録'
  | '看護記録'
  | '入退院記録'
  | 'オーダー';

export const CATEGORY_COLORS: Record<RecordCategory, string> = {
  '医師記録': '#1e40af',
  '看護記録': '#c2410c',
  '入退院記録': '#b91c1c',
  'オーダー': '#0891b2',
};

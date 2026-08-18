/**
 * 記録種別（カルテ記事のカテゴリ）の色を一元管理するモジュール。
 *
 * カルテ画面の集約タイムライン（記事見出しの種別ラベル色・日付サイドバーの種別バッジ色）で使用する。
 *
 * ■ 一元管理の方針
 * - 記録種別の配色を変えたい／部門（記録種別）を追加したいときは **このファイルだけ差し替えればよい**。
 *   呼び出し側は必ず `getRecordCategoryColor()` 経由で色を引き、色コードを画面側にハードコードしないこと。
 * - キーは `string` を許容する。`src/types/index.ts` の `RecordCategory`（7 値・オーダーを含まない）と
 *   カルテ集約タイムラインの種別（4 値・オーダーを含む）が一致していないため、型は統合せず
 *   「色マップだけが全種別をカバーする」折衷とする。未知の種別は `DEFAULT_RECORD_CATEGORY_COLOR` に落ちる。
 *
 * ■ 配色の考え方
 * - 種別ごとに色相を離し、同系色でも明度・彩度で識別できるようにする。
 * - 色だけに頼らないこと（design-rules §13.5）。バッジ等で使う場合は Tooltip・テキストで種別名を併記する。
 */

/** 記録種別 → 色コード。キー追加＝部門追加に対応する（型は縛らない）。 */
export const RECORD_CATEGORY_COLORS: Record<string, string> = {
  // --- カルテ集約タイムラインの基本 4 種（既存の配色を維持） ---
  '医師記録': '#1e40af',   // 濃青
  '看護記録': '#c2410c',   // 橙茶
  '入退院記録': '#b91c1c', // 濃赤
  'オーダー': '#0891b2',   // シアン
  // --- src/types の RecordCategory に存在する部門記録（既存 4 色と識別しやすいトーンを割り当て） ---
  '看護サマリ': '#7c3aed',     // 紫
  'クリニカルパス': '#15803d', // 緑
  '作業療法記録': '#a16207',   // 黄土
  '栄養指導記録': '#be185d',   // マゼンタ
};

/** 未知の記録種別に使うフォールバック色（グレー）。 */
export const DEFAULT_RECORD_CATEGORY_COLOR = '#64748b';

/**
 * 記録種別の色を取得する。未定義の種別には `DEFAULT_RECORD_CATEGORY_COLOR` を返す。
 * 画面側は色コードを直書きせず、必ずこの関数を経由すること。
 */
export function getRecordCategoryColor(category: string): string {
  return RECORD_CATEGORY_COLORS[category] ?? DEFAULT_RECORD_CATEGORY_COLOR;
}

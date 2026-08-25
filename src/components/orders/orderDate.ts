/**
 * オーダ入力ダイアログの日付初期値。
 * 本アプリはモックアップのため「今日」を固定日に合わせる。
 * これにより、作成したオーダの開始日/実施予定日/指示日がフローシート予定オーダ欄に反映される。
 *
 * 基準日の単一ソースは `src/data/mockToday.ts`。本モジュールはその再エクスポート。
 */
export { MOCK_TODAY } from '../../data/mockToday';
import { MOCK_TODAY } from '../../data/mockToday';

/** 日付初期値（モックの基準日）。実日付ではなく MOCK_TODAY を返す。 */
export function todayStr(): string {
  return MOCK_TODAY;
}

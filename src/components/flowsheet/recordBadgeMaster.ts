// 記録サマリー帯（最近30日）の「記録種別 × 配色」マスタ。
//
// 目的: フローシート左側の「最近の記録」を時系列で俯瞰するための色バッジ定義。
//   医師・相談員が「いつ・どの記録が・どの程度あるか」を把握するために使う（患者状態そのものではない）。
//
// 運用方針（PM 指示 2026-08-20）:
//   - 配色は後で差し替えられるよう、この 1 ファイルに集約する（色合い調整・部門追加を1箇所で行う）。
//   - バッジは「色のみ」。横幅を広げないため、同一日に同種記録が複数あっても 1 つに集約する（色は変えない）。
//   - 部門追加はこの配列に 1 行足すだけで済む（描画側は本マスタを走査する）。
//
// 色は色覚多様性に配慮し、隣接種別の色相を離す。差し替え時も同様の配慮を推奨。

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
  /** バッジ色（差し替え対象。ここを変えると帯・凡例とも一括で変わる） */
  color: string;
}

// 表示順 = この配列順（上から下）。部門追加時はここに 1 行足す。
//
// 診療録タブ（MedicalRecordTab の CATEGORY_COLORS）と配色を統一する（PM 指示 2026-08-20）:
//   診療録=医師記録 #1e40af ／ 看護記録 #c2410c ／ オーダー #0891b2。
//   この 3 種は診療録タブのカテゴリ色をそのまま使い、2 画面で色が一致するようにする。
//   ※差し替え時は診療録タブ側（CATEGORY_COLORS）と同時に更新すること。
//   部門記録（部門診療録）は診療録タブに専用色が無いため、別途 PM 指定色で管理する。
export const RECORD_BADGE_TYPES: RecordBadgeType[] = [
  { key: 'exam',    label: '診療録',   short: '診', color: '#1e40af' }, // = 診療録タブ 医師記録
  { key: 'nursing', label: '看護記録', short: '看', color: '#c2410c' }, // = 診療録タブ 看護記録
  { key: 'order',   label: 'オーダー', short: 'オ', color: '#0891b2' }, // = 診療録タブ オーダー
  { key: 'dept',    label: '部門診療録', short: '部', color: '#16a34a' }, // PM 指定色（診療録タブに対応色なし）
];

// key → 色/ラベルの逆引き（描画・凡例で使う）。
export const RECORD_BADGE_BY_KEY: Record<RecordBadgeKey, RecordBadgeType> =
  Object.fromEntries(RECORD_BADGE_TYPES.map((t) => [t.key, t])) as Record<RecordBadgeKey, RecordBadgeType>;

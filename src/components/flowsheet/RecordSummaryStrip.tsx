import React, { useMemo } from 'react';
import { Box, Paper, Stack, Typography, Tooltip } from '@mui/material';
import { ORDERS } from '../../data/mockData';
import { hasRecentRecords, recentRecordDateSets } from '../../data/recentRecords';
import type { RecentRecordCategory } from '../../data/recentRecords';
import { useAppStore } from '../../stores/useAppStore';
import {
  RECORD_BADGE_TYPES,
  type RecordBadgeKey,
} from './recordBadgeMaster';

// 最近 N 日（既定 30 日）の「記録サマリー帯」。
//
// 目的（PM 指示 2026-08-20）:
//   医師・相談員が「いつ・どの記録が・どの程度あるか」を時系列で俯瞰する。患者状態そのものではない。
//   横幅は広げず、記録種別ごとに「色のみ」のバッジを 1 日 1 セルで表示（同種は集約して 1 つ）。
//
// 種別・擬似出現率（pseudoRate）は recordBadgeMaster に集約（種別の差し替え・部門追加はそちら）。
// 配色は、診療録タブと共有する3種（診療録/看護記録/オーダー）は共有モジュール recordCategoryColors
// （CATEGORY_COLORS）が単一ソースで、部門診療録の色のみ recordBadgeMaster が持つ（色調整は前者、種別は後者）。
// 対象は 診療録・看護記録・オーダー・部門診療録 の 4 種。オーダーは実データ（mock の ORDERS ＋
// オーダー入力で追加された動的オーダー dynamicOrders）から導出する（擬似生成しない）。その他（診療録・
// 看護記録・部門診療録）は 30 日分の実記録モックが無いため決定的擬似データでワイヤーフレーム表示する。

interface Props {
  patientId?: string;
  /** 帯の右端（基準日・ISO）。フローシート本体の endDate と同期する。 */
  endDate: string;
  /** 表示日数（既定 30）。 */
  days?: number;
  /**
   * 「当日」として強調する日（ISO）。下の詳細フローシートが当日とみなす日を渡す
   * （モックでは実日付ではなくデータの基準日を当日扱いするため、詳細表と一致させる）。
   * 省略時は実日付。
   */
  today?: string;
  /** 下の詳細テーブルと左端・右端をそろえるためのラベル列幅（＝詳細のラベル+サブ列合計）。 */
  labelWidth?: number;
  /** 下の詳細テーブルと全体幅をそろえるための総幅（＝詳細テーブルの colgroup 合計）。 */
  totalWidth?: number;
  /** 下の詳細テーブルが表示している日数（帯の右端 N 日を青枠でハイライトして対応を示す）。 */
  detailDays?: number;
}

const DEFAULT_DAYS = 30;

/** ISO 日付を days 日ずらす */
function shiftIso(iso: string, days: number): string {
  const dt = new Date(`${iso}T00:00:00`);
  dt.setDate(dt.getDate() + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}
const WEEKDAY = ['日', '月', '火', '水', '木', '金', '土'];
function weekdayOf(iso: string): string {
  return WEEKDAY[new Date(`${iso}T00:00:00`).getDay()];
}
function isWeekend(iso: string): boolean {
  const w = new Date(`${iso}T00:00:00`).getDay();
  return w === 0 || w === 6;
}
/** 実際の当日（ISO） */
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** 文字列 → 安定ハッシュ（決定的擬似データ用・乱数を使わない） */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * (patientId, iso) → その日に存在する記録種別の集合（色バッジ用・同種は自然に 1 つ）。
 * オーダーは実データ（ORDERS + 動的オーダー）の開始日集合 orderDates から判定。
 * 診療録／看護記録／部門診療録は、主要患者（RECENT_RECORDS を持つ患者）は**実データ**、
 * それ以外はマスタの pseudoRate による決定的擬似データで埋める。
 */
function recordsForDay(
  patientId: string | undefined,
  iso: string,
  orderDates: Set<string>,
  realDates: Record<RecentRecordCategory, Set<string>> | null,
): Set<RecordBadgeKey> {
  const set = new Set<RecordBadgeKey>();
  if (!patientId) return set;
  if (orderDates.has(iso)) set.add('order');
  if (realDates) {
    // 実データを持つ患者は擬似生成しない（帯・診療録タブ・部門記録簿で同じ内容を見せるため）
    if (realDates['医師記録'].has(iso)) set.add('exam');
    if (realDates['看護記録'].has(iso)) set.add('nursing');
    if (realDates['部門診療録'].has(iso)) set.add('dept');
    return set;
  }
  for (const t of RECORD_BADGE_TYPES) {
    // pseudoRate 0（オーダー等）は擬似生成せず実データ由来のみ扱う。
    if (t.pseudoRate <= 0) continue;
    if (hashStr(`${patientId}|${t.key}|${iso}`) % 100 < t.pseudoRate) set.add(t.key);
  }
  return set;
}

const DEFAULT_LABEL_W = 170; // 詳細テーブルの label(130)+sub(40) に一致
const CELL_MIN = 18;  // 1 日あたり最小セル幅
const ROW_H = 20;     // 記録行の高さ
const FRAME_COLOR = '#2563eb'; // 青枠（詳細フローシートに表示中の範囲）

const RecordSummaryStrip: React.FC<Props> = ({
  patientId, endDate, days = DEFAULT_DAYS, today,
  labelWidth = DEFAULT_LABEL_W, totalWidth, detailDays = 7,
}) => {
  // 当日判定は下の詳細フローシート（buildDay）と揃える: 実日付（todayIso）に一致する日、または
  // 詳細がモックの当日として扱う基準日（today prop = アンカー日）に一致する日を「当日」とする。
  // これにより「当日」ナビで実日付へ移っても、モックのアンカー日でも、帯と詳細の当日強調が一致する。
  const realToday = todayIso();
  const isTodayIso = (iso: string): boolean => iso === realToday || (today !== undefined && iso === today);
  // オーダー入力で追加された動的オーダーも反映する（seed の ORDERS だけでは当日追加分が漏れる）。
  const dynamicOrders = useAppStore((s) => s.dynamicOrders);
  // 右端（endDate）から遡る days 日（昇順）。
  const dayIso = useMemo(
    () => Array.from({ length: days }, (_, i) => shiftIso(endDate, i - (days - 1))),
    [endDate, days],
  );
  // この患者のオーダー開始日集合（seed + 動的）。dynamicOrders 更新で再計算＝帯も追従する。
  const orderDates = useMemo(() => {
    const s = new Set<string>();
    if (!patientId) return s;
    for (const o of [...ORDERS, ...dynamicOrders]) {
      if (o.patientId === patientId) s.add(o.startDate);
    }
    return s;
  }, [patientId, dynamicOrders]);
  // 下の詳細テーブルはコンテナ幅いっぱいに伸びる。帯も 100% 伸長し、ラベル幅だけ詳細に一致させて
  // 左端・右端をそろえる。狭いコンテナ用に最小幅（ラベル + 最小セル×日数）を確保する。
  const minContentWidth = labelWidth + CELL_MIN * days;
  void totalWidth; // 現状は幅の直接指定には使わず、100% 伸長 + minWidth で詳細テーブルに追従する
  // 帯の右端 detailDays 日 = 下の詳細テーブルが表示している範囲。青枠ハイライトの開始 index。
  const detailStart = Math.max(0, days - detailDays);
  // 青枠の左端位置（ラベル幅 + グリッド領域の detailStart/days の割合）。右端はコンテナ右端。
  const frameLeft = `calc(${labelWidth}px + (100% - ${labelWidth}px) * ${detailStart / days})`;
  // 主要患者は直近 30 日の実データ（RECENT_RECORDS）を使い、それ以外は擬似生成にフォールバックする。
  const realDates = useMemo(
    () => (hasRecentRecords(patientId) ? recentRecordDateSets(patientId) : null),
    [patientId],
  );
  // 各日の記録集合。
  const dayRecords = useMemo(
    () => dayIso.map((iso) => recordsForDay(patientId, iso, orderDates, realDates)),
    [dayIso, patientId, orderDates, realDates],
  );

  return (
    <Paper data-testid="record-summary-strip" variant="outlined" sx={{ mb: 1, overflow: 'hidden' }}>
      {/* 見出し + 凡例（左寄せ＝帯がテーブル幅まで広がっても凡例が画面外に出ないように）。 */}
      <Stack
        direction="row" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap
        sx={{
          bgcolor: '#e3edf7', px: 1.5, py: 0.5, borderBottom: '1px solid #c5d5e8',
          position: 'sticky', left: 0,
        }}
      >
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a5f' }}>
          記録サマリー（最近{days}日）
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {RECORD_BADGE_TYPES.map((t) => (
            <Stack key={t.key} direction="row" spacing={0.3} alignItems="center">
              <Box sx={{ width: 10, height: 10, borderRadius: 0.3, bgcolor: t.color }} />
              <Typography sx={{ fontSize: '0.68rem', color: '#334155' }}>{t.label}</Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Box sx={{ overflowX: 'auto' }}>
        {/* position:relative の内側に、右端 detailDays 日を囲う青枠（閉じた四辺）をオーバーレイする。 */}
        <Box sx={{ width: '100%', minWidth: minContentWidth, position: 'relative' }}>
          {/* 青枠オーバーレイ（ヘッダー行＋記録行の全高を四辺で囲う。クリックは透過） */}
          <Box
            aria-hidden
            data-testid="record-summary-detail-frame"
            sx={{
              position: 'absolute', top: 0, bottom: 0, left: frameLeft, right: 0,
              border: `2px solid ${FRAME_COLOR}`, borderRadius: '4px',
              pointerEvents: 'none', zIndex: 3,
            }}
          />
          {/* 日付ヘッダー行（5 日ごとに月日、当日を強調） */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
            <Box sx={{ width: labelWidth, flex: '0 0 auto' }} />
            {dayIso.map((iso, i) => {
              const [, m, d] = iso.split('-');
              const isToday = isTodayIso(iso);
              const inDetail = i >= detailStart;
              const showLabel = i === 0 || i === dayIso.length - 1 || Number(d) === 1 || i % 5 === 0;
              return (
                <Box
                  key={iso}
                  sx={{
                    flex: '1 1 0', minWidth: CELL_MIN, textAlign: 'center',
                    fontSize: '0.6rem', lineHeight: 1.2, py: 0.2,
                    color: isToday ? '#b45309' : isWeekend(iso) ? '#94a3b8' : '#64748b',
                    fontWeight: isToday ? 700 : 400,
                    bgcolor: isToday ? '#fff8e1' : inDetail ? '#eef4fb' : undefined,
                    borderLeft: Number(d) === 1 ? '1px solid #cbd5e1' : undefined,
                  }}
                >
                  {showLabel ? `${Number(m)}/${Number(d)}` : ''}
                  <Box sx={{ fontSize: '0.55rem' }}>{weekdayOf(iso)}</Box>
                </Box>
              );
            })}
          </Box>

          {/* 記録種別ごとの行（色バッジのみ・同種は 1 セル 1 つ） */}
          {RECORD_BADGE_TYPES.map((t) => (
            <Box key={t.key} sx={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid #f1f5f9' }}>
              <Box
                sx={{
                  width: labelWidth, flex: '0 0 auto', display: 'flex', alignItems: 'center',
                  gap: 0.5, px: 0.75, bgcolor: '#f8fafc', fontSize: '0.68rem', color: '#334155',
                }}
              >
                <Box sx={{ width: 9, height: 9, borderRadius: 0.3, bgcolor: t.color, flex: '0 0 auto' }} />
                {t.label}
              </Box>
              {dayIso.map((iso, i) => {
                const present = dayRecords[i].has(t.key);
                // 連日で続く記録は色をつなげて 1 本のバーに見せる（1粒ずつだと見づらいため）。
                // 前後の日にも同種記録があれば、その境界の角を落として隣とつなぐ。孤立日は両端角丸のピル。
                const prevPresent = i > 0 && dayRecords[i - 1].has(t.key);
                const nextPresent = i < dayIso.length - 1 && dayRecords[i + 1].has(t.key);
                const isToday = isTodayIso(iso);
                const inDetail = i >= detailStart;
                const [, m, d] = iso.split('-');
                const R = '6px';
                return (
                  <Tooltip
                    key={iso}
                    title={present ? `${Number(m)}/${Number(d)}（${weekdayOf(iso)}）${t.label}あり` : ''}
                    disableHoverListener={!present}
                    arrow
                  >
                    <Box
                      role="img"
                      aria-label={`${iso} ${t.label}${present ? 'あり' : 'なし'}`}
                      sx={{
                        flex: '1 1 0', minWidth: CELL_MIN, height: ROW_H,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: isToday ? '#fff8e1' : inDetail ? '#eef4fb' : undefined,
                        borderLeft: Number(d) === 1 ? '1px solid #cbd5e1' : undefined,
                      }}
                    >
                      {present && (
                        <Box
                          sx={{
                            // width:100% でセル幅いっぱいに描き、隣接する present セルと接して 1 本に見せる。
                            width: '100%', height: '58%', bgcolor: t.color,
                            borderTopLeftRadius: prevPresent ? 0 : R,
                            borderBottomLeftRadius: prevPresent ? 0 : R,
                            borderTopRightRadius: nextPresent ? 0 : R,
                            borderBottomRightRadius: nextPresent ? 0 : R,
                          }}
                        />
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
      <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', px: 1.5, py: 0.3 }}>
        青枠内（右端{detailDays}日）が下の詳細フローシートに表示中の範囲です。バッジは「色のみ・同種は1つ」で件数は表しません。
      </Typography>
    </Paper>
  );
};

export default RecordSummaryStrip;

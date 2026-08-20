import React, { useMemo } from 'react';
import { Box, Paper, Stack, Typography, Tooltip } from '@mui/material';
import { ORDERS } from '../../data/mockData';
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
// 配色・種別は recordBadgeMaster に集約（差し替え・部門追加はそちらで）。
// 対象は 診療録・看護記録・オーダー・部門診療録 の 4 種。実データを持つオーダーは mock から導出し、
// その他（診療録・看護記録・部門診療録）は日付シードの決定的擬似データでワイヤーフレーム表示する。

interface Props {
  patientId?: string;
  /** 帯の右端（基準日・ISO）。フローシート本体の endDate と同期する。 */
  endDate: string;
  /** 表示日数（既定 30）。 */
  days?: number;
  /** 下の詳細テーブルと左端・右端をそろえるためのラベル列幅（＝詳細のラベル+サブ列合計）。 */
  labelWidth?: number;
  /** 下の詳細テーブルと全体幅をそろえるための総幅（＝詳細テーブルの colgroup 合計）。 */
  totalWidth?: number;
  /** 下の詳細テーブルが表示している日数（帯の右端 N 日をハイライトして対応を示す）。 */
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

// 記録種別 × 出現しやすさ（決定的擬似データの閾値。100 分率）。
// order は実データ（mock）由来の日にも出すが、実データが無い日でも帯の密度が
// 出るようワイヤーフレーム用のフォールバックとして本表にも登録する（実データと union）。
const PSEUDO_RATE: Record<RecordBadgeKey, number> = {
  exam: 45,    // 診療録: 数日おき
  nursing: 80, // 看護記録: ほぼ毎日
  order: 35,   // オーダー: 数日おき
  dept: 30,    // 部門診療録: 時々
};

/** その日に開始オーダがあるか（種別問わず 1 つでもあれば「オーダーあり」）。 */
function orderOn(patientId: string, iso: string): boolean {
  return ORDERS.some((o) => o.patientId === patientId && o.startDate === iso);
}

/** (patientId, iso) → その日に存在する記録種別の集合（色バッジ用・同種は自然に 1 つ）。 */
function recordsForDay(patientId: string | undefined, iso: string): Set<RecordBadgeKey> {
  const set = new Set<RecordBadgeKey>();
  if (!patientId) return set;
  // 実データ由来（mock のオーダー）
  if (orderOn(patientId, iso)) set.add('order');
  // ワイヤーフレーム用の決定的擬似データ（実データと union）
  for (const [key, rate] of Object.entries(PSEUDO_RATE) as [RecordBadgeKey, number][]) {
    if (hashStr(`${patientId}|${key}|${iso}`) % 100 < rate) set.add(key);
  }
  return set;
}

const DEFAULT_LABEL_W = 170; // 詳細テーブルの label(130)+sub(40) に一致
const CELL_MIN = 18;  // 1 日あたり最小セル幅
const ROW_H = 20;     // 記録行の高さ

const RecordSummaryStrip: React.FC<Props> = ({
  patientId, endDate, days = DEFAULT_DAYS,
  labelWidth = DEFAULT_LABEL_W, totalWidth, detailDays = 7,
}) => {
  const today = todayIso();
  // 右端（endDate）から遡る days 日（昇順）。
  const dayIso = useMemo(
    () => Array.from({ length: days }, (_, i) => shiftIso(endDate, i - (days - 1))),
    [endDate, days],
  );
  // 下の詳細テーブルはコンテナ幅いっぱいに伸びる（tableLayout:auto 相当で日列が均等伸長）。
  // 帯も同様にコンテナ幅いっぱいに伸ばし、ラベル幅だけ詳細に一致させることで左端・右端をそろえる。
  // totalWidth（詳細テーブルの実幅）が渡された場合は最大幅の目安に使うが、基本は 100% 伸長。
  // 狭いコンテナ用に最小幅（ラベル + 最小セル×日数）を確保しつつ、広い時は伸びる。
  const minContentWidth = labelWidth + CELL_MIN * days;
  void totalWidth; // 現状は幅の直接指定には使わず、100% 伸長 + minWidth で詳細テーブルに追従する
  // 帯の右端 detailDays 日 = 下の詳細テーブルが表示している範囲。ハイライトの開始 index。
  const detailStart = Math.max(0, days - detailDays);
  // 各日の記録集合。
  const dayRecords = useMemo(
    () => dayIso.map((iso) => recordsForDay(patientId, iso)),
    [dayIso, patientId],
  );

  return (
    <Paper data-testid="record-summary-strip" variant="outlined" sx={{ mb: 1, overflow: 'hidden' }}>
      {/* 見出し + 凡例（左寄せ＝帯がテーブル幅まで広がっても凡例が画面外に出ないように）。
          position:sticky/left:0 で横スクロールしても見出し・凡例を左端に留める。 */}
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
        <Box sx={{ width: '100%', minWidth: minContentWidth }}>
          {/* 日付ヘッダー行（5 日ごとに月日、当日を強調） */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
            <Box sx={{ width: labelWidth, flex: '0 0 auto' }} />
            {dayIso.map((iso, i) => {
              const [, m, d] = iso.split('-');
              const isToday = iso === today;
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
                    borderLeft: i === detailStart
                      ? '2px solid #2563eb'
                      : Number(d) === 1 ? '1px solid #cbd5e1' : undefined,
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
                const isToday = iso === today;
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
                      aria-label={`${iso} ${t.label}${present ? 'あり' : 'なし'}`}
                      sx={{
                        flex: '1 1 0', minWidth: CELL_MIN, height: ROW_H,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: isToday ? '#fff8e1' : inDetail ? '#eef4fb' : undefined,
                        borderLeft: i === detailStart
                          ? '2px solid #2563eb'
                          : Number(d) === 1 ? '1px solid #cbd5e1' : undefined,
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

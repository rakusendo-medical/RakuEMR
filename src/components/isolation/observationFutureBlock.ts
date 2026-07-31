// ===== ep-07 観察記録: 未来日入力不可の共通判定 =====
// spec: docs/specs/ep-07-observation/_epic.md「共通ルール: 未来日入力不可」
//
// 観察記録は未来日（未到来の時間帯）への記載を一切行えない。マスタ設定による ON/OFF は無く常時適用。
//   入力可  : 記録枠の開始時刻 <= 現在日時
//   入力不可: 現在日時 < 記録枠の開始時刻
// 判定に使うのは枠の「開始時刻」のみ（終了時刻は使わない）。過去方向の制限は無い。
//
//   例）15分枠・現在 16時29分 → 16:15枠 OK / 16:30枠 NG / 16:45枠 NG
//       15分枠・現在 16時30分 → 16:15枠 OK / 16:30枠 OK / 16:45枠 NG
//       15分枠・現在 16時31分 → 16:15枠 OK / 16:30枠 OK / 16:45枠 NG
import React from 'react';

/** 未来枠を操作しようとした際の共通メッセージ */
export const OBSERVATION_FUTURE_BLOCK_MESSAGE = '未来日は入力できません（記録枠の開始時刻に達していません）';

/** ツールチップ等に出す短縮ラベル */
export const OBSERVATION_FUTURE_BLOCK_LABEL = '未来日入力不可';

/** 記録枠の開始時刻（epoch ms）。date は YYYY-MM-DD */
export function slotStartEpoch(date: string, hour: number, minute = 0): number {
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  return new Date(`${date}T${hh}:${mm}:00`).getTime();
}

/** 記録枠（日付＋開始時・分）が未到来か */
export function isFutureSlot(date: string, hour: number, minute = 0, now: number = Date.now()): boolean {
  const start = slotStartEpoch(date, hour, minute);
  if (Number.isNaN(start)) return false;
  return start > now;
}

/** `HH:mm` 形式の記録時刻が未到来か。解釈できない文字列は判定対象外（false） */
export function isFutureTimeString(date: string, time: string, now: number = Date.now()): boolean {
  const m = /^(\d{1,2}):(\d{1,2})$/.exec(time.trim());
  if (!m) return false;
  return isFutureSlot(date, Number(m[1]), Number(m[2]), now);
}

/** 1 時間を frequency 分割したときの occurrence（1 始まり）番目の枠の開始分 */
export function slotStartMinute(occurrence: number, frequency: number): number {
  const interval = Math.max(1, Math.floor(60 / Math.max(1, frequency)));
  return Math.min(59, Math.max(0, occurrence - 1) * interval);
}

/**
 * 現在時刻（epoch ms）を一定間隔で更新する hook。
 * 未来枠は時刻経過で入力可へ変わるため、再レンダーの契機として使う
 * （useMemo 内で Date.now() を読むだけでは、他の再レンダーが起きるまで切り替わらない）。
 */
export function useNowTick(intervalMs = 30000): number {
  const [now, setNow] = React.useState<number>(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

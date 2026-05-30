// ===== ep-08 隔離拘束歴 =====
// 隔離・拘束歴の表示／削除コア（中身）。Dialog 殻なしで、tab inline 表示でも再利用できる。
// 参考システムマニュアル: 01 基本システム.pdf p.2232-2237
//
// 起動経路:
// - IsolationRestraint.tsx tab=2 から（全患者横断、患者フィルタなし）
// - IsolationHistoryDialog から（特定患者の履歴）
//
// 削除順序ルール（spec us-15 AC-5/AC-6）:
// - restraintChange === false: 「開始」と「解除」のペア削除、後続の継続開始がある場合エラー
// - restraintChange === true: 同 patient × 同 subtype の「最終指示のみ削除可」
import React from 'react';
import {
  Box, Stack, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Tooltip, Alert,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import type { IsolationOrder, IsolationSubtype, Patient } from '../../types';
import { ISOLATION_ORDERS, PATIENTS, patientNumberOf } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import DeleteReasonDialog from '../admission/DeleteReasonDialog';

interface DisplayRow {
  order: IsolationOrder;
  subtype: IsolationSubtype;
  /** 表示用の終了日時（後続指示から計算した結果） */
  displayEndDatetime: string;
  /** 削除可能か（順序ルールチェック後） */
  deletable: boolean;
  /** 削除不可の理由（エラーメッセージ用） */
  blockReason?: string;
  /** ペアで削除される対 ID（restraintChange OFF 時の解除/開始の対応） */
  pairedOrderId?: string;
}

function getSubtype(o: IsolationOrder): IsolationSubtype {
  return o.subtype ?? (o.type === '隔離' ? '隔離' : '拘束');
}

/** 同 patient × 同 subtype の指示を開始日時昇順に並べる */
function buildSeries(orders: IsolationOrder[]): Map<string, IsolationOrder[]> {
  const map = new Map<string, IsolationOrder[]>();
  for (const o of orders) {
    const sub = getSubtype(o);
    const key = `${o.patientId}|${sub}`;
    const arr = map.get(key) ?? [];
    arr.push(o);
    map.set(key, arr);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
  }
  return map;
}

/** 終了日時表示ロジック（spec us-15 AC-3） */
function computeDisplayEnd(current: IsolationOrder, next: IsolationOrder | undefined): string {
  if (!next) {
    if (current.endDatetime) return current.endDatetime;
    return '継続中';
  }
  const nextOp = next.operation;
  if (nextOp === '開始') {
    // 「開始」による継続: 前指示の終了 = 新開始 - 1 分
    const d = new Date(next.startDatetime.replace(' ', 'T'));
    d.setMinutes(d.getMinutes() - 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  // 「継続」「変更」「解除」: 前指示の終了 = 新指示の開始（同時刻）
  return next.startDatetime;
}

/**
 * 削除可否を計算（restraintChange トグルで分岐）
 * restraintChange === true: 各 series で最終指示のみ削除可
 * restraintChange === false: 「開始」「解除」のみ操作対象。後続の同 subtype 開始があれば削除不可
 */
function computeDeletability(
  series: IsolationOrder[],
  restraintChangeEnabled: boolean,
): Array<{ deletable: boolean; blockReason?: string; pairedOrderId?: string }> {
  if (restraintChangeEnabled) {
    return series.map((_, i) => {
      if (i === series.length - 1) return { deletable: true };
      const next = series[i + 1];
      return {
        deletable: false,
        blockReason: `以降の ${next.operation ?? '指示'}（${next.startDatetime}）を先に削除してください`,
      };
    });
  }
  // restraintChange === false
  return series.map((o, i) => {
    if (o.operation === '開始') {
      // 後続に同 subtype の開始があれば不可
      const followingStart = series.slice(i + 1).find((x) => x.operation === '開始');
      if (followingStart) {
        return {
          deletable: false,
          blockReason: `以降の開始指示（${followingStart.startDatetime}）を先に削除してください`,
        };
      }
      // 対応する解除があればペア
      const pair = series.slice(i + 1).find((x) => x.operation === '解除');
      return { deletable: true, pairedOrderId: pair?.id };
    }
    if (o.operation === '解除') {
      // 対応する開始（直前の最後の開始）
      const pair = [...series.slice(0, i)].reverse().find((x) => x.operation === '開始');
      return { deletable: true, pairedOrderId: pair?.id };
    }
    // 継続/変更（restraintChange off 運用では本来発生しないはず）
    return { deletable: false, blockReason: '継続/変更指示は「隔離拘束変更=する」運用でのみ削除可' };
  });
}

interface Props {
  /** 患者 ID（指定時は当該患者の履歴のみ表示） */
  patientId?: string;
  /** 「歴ダイアログ」のタイトル下に表示するヘッダー（dialog 殻なしで使う場合は省略可） */
  headerNote?: string;
  /** 表示密度（デフォルト 'standard'） */
  density?: 'standard' | 'compact';
}

const IsolationHistoryView: React.FC<Props> = ({ patientId, density = 'standard' }) => {
  const dynamicOrders = useAppStore((s) => s.dynamicIsolationOrders);
  const restraintChangeEnabled = useAppStore((s) => s.optionalFeatures.restraintChange);
  const currentUserRole = useAppStore((s) => s.currentUserRole);
  const deleteIsolationOrderWithAudit = useAppStore((s) => s.deleteIsolationOrderWithAudit);
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  const [deleteTarget, setDeleteTarget] = React.useState<IsolationOrder | null>(null);

  const canDelete = currentUserRole === 'doctor';

  // マスタ + dynamic マージ（同 id は dynamic 優先）
  const merged = React.useMemo<IsolationOrder[]>(() => {
    const m = new Map<string, IsolationOrder>();
    [...ISOLATION_ORDERS, ...dynamicOrders].forEach((o) => m.set(o.id, o));
    return Array.from(m.values()).filter((o) => !patientId || o.patientId === patientId);
  }, [dynamicOrders, patientId]);

  // 表示行を計算
  const rows = React.useMemo<DisplayRow[]>(() => {
    const seriesMap = buildSeries(merged);
    const result: DisplayRow[] = [];
    for (const series of seriesMap.values()) {
      const deletability = computeDeletability(series, restraintChangeEnabled);
      series.forEach((o, i) => {
        const next = series[i + 1];
        result.push({
          order: o,
          subtype: getSubtype(o),
          displayEndDatetime: computeDisplayEnd(o, next),
          deletable: deletability[i].deletable,
          blockReason: deletability[i].blockReason,
          pairedOrderId: deletability[i].pairedOrderId,
        });
      });
    }
    // 開始日時の **降順** で並べ替え
    result.sort((a, b) => b.order.startDatetime.localeCompare(a.order.startDatetime));
    return result;
  }, [merged, restraintChangeEnabled]);

  const handleDeleteClick = (row: DisplayRow) => {
    if (!row.deletable) {
      showSnackbar(row.blockReason ?? '削除順序ルールにより削除できません', 'error');
      return;
    }
    setDeleteTarget(row.order);
  };

  const handleConfirmDelete = (params: { category: string; reason: string }) => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    // ペア削除（restraintChange OFF 時）
    const targetRow = rows.find((r) => r.order.id === target.id);
    deleteIsolationOrderWithAudit(target.id, { category: params.category, text: params.reason || undefined }, currentUserRole);
    if (targetRow?.pairedOrderId) {
      deleteIsolationOrderWithAudit(targetRow.pairedOrderId, { category: params.category, text: params.reason || undefined }, currentUserRole);
      showSnackbar(`隔離拘束指示をペアで削除しました（${currentUserRole}, ${new Date().toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })}）`, 'success');
    } else {
      showSnackbar(`隔離拘束指示を削除しました（${currentUserRole}, ${new Date().toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })}）`, 'success');
    }
    setDeleteTarget(null);
  };

  const patientName: string | undefined = React.useMemo(() => {
    if (!patientId) return undefined;
    return PATIENTS.find((p: Patient) => p.id === patientId)?.name;
  }, [patientId]);

  return (
    <Box>
      {patientId && patientName && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{patientName}</Typography>
          <Chip
            label={restraintChangeEnabled ? '隔離拘束変更=する' : '隔離拘束変更=しない'}
            size="small" color={restraintChangeEnabled ? 'warning' : 'default'} variant="outlined"
          />
        </Stack>
      )}
      {!canDelete && (
        <Alert severity="info" sx={{ mb: 1, py: 0.3 }}>
          現在のロール（{currentUserRole}）では削除権限がありません。表示のみ可能です。
        </Alert>
      )}
      <Paper variant="outlined" sx={{ overflow: 'auto' }}>
        <Table size={density === 'compact' ? 'small' : 'small'} stickyHeader>
          <TableHead>
            <TableRow>
              {!patientId && <TableCell sx={{ minWidth: 140 }}>患者</TableCell>}
              <TableCell>開始日時</TableCell>
              <TableCell>終了日時</TableCell>
              <TableCell>区分</TableCell>
              <TableCell>アクション</TableCell>
              <TableCell>拘束部位</TableCell>
              <TableCell align="center">開放時間</TableCell>
              <TableCell>指示医</TableCell>
              {canDelete && <TableCell align="center" sx={{ width: 60 }}>削除</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={canDelete ? (patientId ? 8 : 9) : (patientId ? 7 : 8)} align="center" sx={{ py: 3 }}>
                  <Typography variant="caption" color="text.secondary">隔離拘束履歴はありません</Typography>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row.order.id} hover>
                {!patientId && (
                  <TableCell sx={{ fontSize: '0.75rem' }}>
                    [{patientNumberOf(row.order.patientId)}] {row.order.patientName}
                  </TableCell>
                )}
                <TableCell sx={{ fontSize: '0.75rem' }}>{row.order.startDatetime || '—'}</TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{row.displayEndDatetime}</TableCell>
                <TableCell>
                  <Chip label={row.subtype} size="small" variant="outlined"
                    color={row.subtype === '隔離' ? 'error' : row.subtype === '拘束' ? 'warning' : 'primary'} />
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>
                  {row.order.operation ?? '開始'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.7rem' }}>
                  {row.order.restraintParts && row.order.restraintParts.length > 0 ? row.order.restraintParts.join('・') : '—'}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.7rem' }}>
                  {row.order.releaseTimes && row.order.releaseTimes.length > 0 ? (
                    <Tooltip title={row.order.releaseTimes.map((r) => `${r.start}-${r.end}`).join(', ')}>
                      <Chip label={`${row.order.releaseTimes.length}件`} size="small" variant="outlined" />
                    </Tooltip>
                  ) : '—'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.75rem' }}>{row.order.doctorName}</TableCell>
                {canDelete && (
                  <TableCell align="center">
                    <Tooltip title={row.deletable ? '削除' : (row.blockReason ?? '削除不可')}>
                      <span>
                        <IconButton
                          size="small"
                          color={row.deletable ? 'error' : 'default'}
                          onClick={() => handleDeleteClick(row)}
                          sx={{ p: 0.3, opacity: row.deletable ? 1 : 0.4 }}
                          aria-label="削除"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <DeleteReasonDialog
        open={!!deleteTarget}
        variant="admit"
        onClose={() => setDeleteTarget(null)}
        onConfirm={(p) => handleConfirmDelete({ category: p.category, reason: p.reason })}
      />
    </Box>
  );
};

export default IsolationHistoryView;

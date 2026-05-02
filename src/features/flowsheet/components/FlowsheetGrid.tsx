import React from 'react';
import { Box, Stack, Tooltip, Typography, IconButton, Link as MuiLink } from '@mui/material';
import { Edit as EditIcon, Thermostat as ThermoIcon } from '@mui/icons-material';
import type {
  CareItemMaster, CareRecord, ISODate, LabResultEntry, NursingRecord, ScheduledOrder,
  SignEntry, ShiftType, VitalEntry,
} from '../types';

interface Props {
  patientId: string;
  dates: ISODate[];
  careItemIds: string[];
  careItemMaster: CareItemMaster[];
  vitals: VitalEntry[];
  careRecords: CareRecord[];
  signs: SignEntry[];
  scheduledOrders: ScheduledOrder[];
  labResults: LabResultEntry[];
  nursingRecords: NursingRecord[];
  staffName: (id: string) => string;
  isFutureDisabled: (date: ISODate) => boolean;
  onClickFlowsheetIcon: (date: ISODate) => void;
  onClickVitalIcon: (date: ISODate) => void;
  onClickSignCell: (date: ISODate, shift: ShiftType) => void;
  onClickOrderCell: (date: ISODate) => void;
  onClickOrderListLink: () => void;
  onClickLabTicket: (ticketName: string) => void;
  onClickNursingRecord: (recordId: string) => void;
  onClickNewNursingRecord: (date: ISODate) => void;
}

const SHIFT_LABEL: Record<ShiftType, string> = { night: '深夜', day: '日勤', evening: '準夜' };
const SHIFT_COLOR: Record<ShiftType, string> = { night: '#dc2626', day: '#1e40af', evening: '#16a34a' };

const formatDayHeader = (iso: ISODate): { mmdd: string; weekday: string } => {
  const d = new Date(iso);
  const wk = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return { mmdd: `${d.getMonth() + 1}/${d.getDate()}`, weekday: wk };
};

const labelCol = '128px';
const dayCol = 'minmax(0, 1fr)';

const Row: React.FC<{ label: React.ReactNode; children: React.ReactNode; bgcolor?: string }> = ({ label, children, bgcolor }) => (
  <Box sx={{
    display: 'grid', gridTemplateColumns: `${labelCol} repeat(7, ${dayCol})`,
    alignItems: 'center', borderTop: '1px solid', borderColor: 'divider', bgcolor: bgcolor ?? 'transparent',
    minHeight: 28,
  }}>
    <Box sx={{ pl: 1, py: 0.5, fontSize: 12, color: '#475569', fontWeight: 600 }}>{label}</Box>
    {children}
  </Box>
);

const Cell: React.FC<{ children?: React.ReactNode; onClick?: () => void; disabled?: boolean; sx?: any }> = ({ children, onClick, disabled, sx }) => (
  <Box
    onClick={disabled ? undefined : onClick}
    sx={{
      px: 0.5, py: 0.5,
      borderLeft: '1px solid', borderColor: 'divider',
      fontSize: 12, lineHeight: 1.2,
      bgcolor: disabled ? '#f1f5f9' : 'transparent',
      cursor: !disabled && onClick ? 'pointer' : 'default',
      '&:hover': !disabled && onClick ? { bgcolor: '#fef3c7' } : {},
      minHeight: 28,
      display: 'flex', flexDirection: 'column',
      ...sx,
    }}
  >
    {children}
  </Box>
);

const FlowsheetGrid: React.FC<Props> = ({
  patientId, dates, careItemIds, careItemMaster, vitals, careRecords, signs,
  scheduledOrders, labResults, nursingRecords, staffName, isFutureDisabled,
  onClickFlowsheetIcon, onClickVitalIcon, onClickSignCell, onClickOrderCell,
  onClickOrderListLink, onClickLabTicket, onClickNursingRecord, onClickNewNursingRecord,
}) => {
  const careItemMap = new Map(careItemMaster.map((c) => [c.id, c]));

  // 日付列ヘッダ
  const renderHeader = () => (
    <Box sx={{
      display: 'grid', gridTemplateColumns: `${labelCol} repeat(7, ${dayCol})`,
      alignItems: 'center', bgcolor: '#f1f5f9', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider',
    }}>
      <Box sx={{ p: 0.5, fontSize: 11, fontWeight: 700, color: '#1e3a5f' }}>{patientId}</Box>
      {dates.map((d) => {
        const { mmdd, weekday } = formatDayHeader(d);
        const disabled = isFutureDisabled(d);
        return (
          <Box key={d} sx={{ borderLeft: '1px solid', borderColor: 'divider', px: 0.5, py: 0.25, textAlign: 'center', bgcolor: disabled ? '#f8fafc' : undefined }}>
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 12, display: 'block' }}>{mmdd}（{weekday}）</Typography>
            <Stack direction="row" spacing={0.5} justifyContent="center">
              <Tooltip title={disabled ? '未来日入力不可' : 'フローシート編集'}><span>
                <IconButton size="small" disabled={disabled} onClick={() => onClickFlowsheetIcon(d)}>
                  <EditIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </span></Tooltip>
              <Tooltip title={disabled ? '未来日入力不可' : 'バイタル編集'}><span>
                <IconButton size="small" disabled={disabled} onClick={() => onClickVitalIcon(d)}>
                  <ThermoIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </span></Tooltip>
            </Stack>
          </Box>
        );
      })}
    </Box>
  );

  // バイタル簡易表示行（T のみ。次ステップで VitalChart に置換）
  const renderVitalRow = () => {
    const byDate = new Map<string, VitalEntry[]>();
    dates.forEach((d) => byDate.set(d, []));
    vitals.filter((v) => v.patientId === patientId && byDate.has(v.date))
      .forEach((v) => byDate.get(v.date)!.push(v));
    return (
      <Row label="バイタル(T)" bgcolor="#fffbeb">
        {dates.map((d) => {
          const list = (byDate.get(d) ?? []).sort((a, b) => a.time.localeCompare(b.time));
          return (
            <Cell key={d}>
              <Stack spacing={0}>
                {list.map((v) => (
                  <Tooltip key={v.id} title={`${v.time} BP ${v.bpSys ?? '-'}/${v.bpDia ?? '-'} P ${v.pulse ?? '-'} R ${v.resp ?? '-'} S ${v.spo2 ?? '-'}`} arrow>
                    <Typography sx={{ fontSize: 11, color: '#7c2d12' }}>
                      {v.time} {v.temp != null ? `${v.temp.toFixed(1)}℃` : ''}
                    </Typography>
                  </Tooltip>
                ))}
                {list.length === 0 && <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>—</Typography>}
              </Stack>
            </Cell>
          );
        })}
      </Row>
    );
  };

  // 予定オーダ行
  const renderOrderRow = () => {
    const byDate = new Map<string, ScheduledOrder[]>();
    dates.forEach((d) => byDate.set(d, []));
    scheduledOrders.filter((o) => o.patientId === patientId && byDate.has(o.date))
      .forEach((o) => byDate.get(o.date)!.push(o));

    return (
      <Row
        label={
          <Stack direction="row" spacing={0.5} alignItems="center">
            <span>予定オーダ</span>
            <MuiLink component="button" type="button" onClick={onClickOrderListLink} sx={{ fontSize: 11 }}>
              一覧
            </MuiLink>
          </Stack>
        }
      >
        {dates.map((d) => {
          const list = byDate.get(d) ?? [];
          const hasDone = list.some((o) => o.status === 'done');
          return (
            <Cell key={d} onClick={() => list.length > 0 && onClickOrderCell(d)} sx={{ bgcolor: hasDone ? '#fff7ed' : undefined }}>
              <Stack direction="row" spacing={0.25} flexWrap="wrap">
                {list.map((o) => (
                  <Tooltip key={o.id} title={`${o.kind} ${o.name} ${o.status === 'done' ? '実施済' : '未実施'}`} arrow>
                    <Typography sx={{
                      fontSize: 12, fontWeight: 700, lineHeight: 1.2,
                      color: o.status === 'done' ? '#94a3b8' : '#dc2626',
                    }}>
                      {o.kind}
                    </Typography>
                  </Tooltip>
                ))}
              </Stack>
            </Cell>
          );
        })}
      </Row>
    );
  };

  // ケア項目行
  const renderCareItemRow = (careItemId: string) => {
    const ci = careItemMap.get(careItemId);
    if (!ci) return null;
    return (
      <Row key={careItemId} label={ci.name}>
        {dates.map((d) => {
          const rec = careRecords.find(
            (c) => c.patientId === patientId && c.date === d && c.careItemId === careItemId,
          );
          const disabled = isFutureDisabled(d);
          let display: React.ReactNode = '—';
          if (rec) {
            if (typeof rec.value === 'boolean') display = rec.value ? '✓' : '';
            else if (Array.isArray(rec.value)) display = rec.value.join('・');
            else display = String(rec.value);
          }
          return (
            <Cell key={d} disabled={disabled} onClick={() => onClickFlowsheetIcon(d)}>
              <Typography sx={{ fontSize: 12, color: rec ? 'text.primary' : 'text.disabled' }}>
                {display}
              </Typography>
            </Cell>
          );
        })}
      </Row>
    );
  };

  // 検査結果行（available な伝票名のみ表示、クリックでグラフ）
  const renderLabResultRow = () => {
    const byDate = new Map<string, LabResultEntry[]>();
    dates.forEach((d) => byDate.set(d, []));
    labResults
      .filter((r) => r.patientId === patientId && r.status === 'available' && byDate.has(r.date))
      .forEach((r) => byDate.get(r.date)!.push(r));
    const totalAvailable = Array.from(byDate.values()).reduce((s, v) => s + v.length, 0);
    if (totalAvailable === 0) return null;
    return (
      <Row label="検査結果">
        {dates.map((d) => {
          const list = byDate.get(d) ?? [];
          return (
            <Cell key={d}>
              <Stack spacing={0}>
                {list.map((r) => (
                  <MuiLink
                    key={r.id}
                    component="button"
                    type="button"
                    onClick={() => onClickLabTicket(r.ticketName)}
                    sx={{ textAlign: 'left', fontSize: 11 }}
                  >
                    {r.ticketName}
                  </MuiLink>
                ))}
              </Stack>
            </Cell>
          );
        })}
      </Row>
    );
  };

  // 看護記録行
  const renderNursingRecordRow = () => {
    const byDate = new Map<string, NursingRecord[]>();
    dates.forEach((d) => byDate.set(d, []));
    nursingRecords
      .filter((n) => n.patientId === patientId && !n.deletedAt && n.connections.includes('flowsheet'))
      .forEach((n) => {
        const date = n.recordedAt.slice(0, 10);
        if (byDate.has(date)) byDate.get(date)!.push(n);
      });
    return (
      <Row label="看護記録">
        {dates.map((d) => {
          const list = byDate.get(d) ?? [];
          const disabled = isFutureDisabled(d);
          return (
            <Cell key={d}>
              <Stack spacing={0}>
                {list.map((n) => (
                  <MuiLink
                    key={n.id}
                    component="button"
                    type="button"
                    onClick={() => onClickNursingRecord(n.id)}
                    sx={{ textAlign: 'left', fontSize: 11, color: SHIFT_COLOR[n.shift] }}
                  >
                    {n.title}
                  </MuiLink>
                ))}
                {!disabled && (
                  <MuiLink
                    component="button"
                    type="button"
                    onClick={() => onClickNewNursingRecord(d)}
                    sx={{ fontSize: 11, color: '#0284c7' }}
                  >
                    [+ 新規]
                  </MuiLink>
                )}
              </Stack>
            </Cell>
          );
        })}
      </Row>
    );
  };

  // サイン行（3 段）
  const renderSignRow = (shift: ShiftType) => {
    return (
      <Row key={shift} label={`サイン（${SHIFT_LABEL[shift]}）`}>
        {dates.map((d) => {
          const sg = signs.find((s) => s.patientId === patientId && s.date === d && s.shift === shift);
          const disabled = isFutureDisabled(d);
          return (
            <Cell key={d} disabled={disabled} onClick={() => onClickSignCell(d, shift)}>
              <Typography sx={{ fontSize: 11, color: SHIFT_COLOR[shift], fontWeight: sg ? 600 : 400 }}>
                {sg ? staffName(sg.signerId) : '—'}
              </Typography>
            </Cell>
          );
        })}
      </Row>
    );
  };

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      {renderHeader()}
      {renderVitalRow()}
      {renderOrderRow()}
      {careItemIds.map((id) => renderCareItemRow(id))}
      {renderLabResultRow()}
      {renderNursingRecordRow()}
      {renderSignRow('night')}
      {renderSignRow('day')}
      {renderSignRow('evening')}
    </Box>
  );
};

export default FlowsheetGrid;

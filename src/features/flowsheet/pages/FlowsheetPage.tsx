import React, { useMemo, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Paper, Typography, Stack, Alert, Link } from '@mui/material';
import { PATIENTS } from '../../../data/mockData';
import { useFlowsheetStore, getActivePatternForDate, last7Dates } from '../store';
import type { FlowsheetTab, ISODate, ShiftType } from '../types';
import { TODAY } from '../mockData';
import FlowsheetHeader from '../components/FlowsheetHeader';
import MovementBar from '../components/MovementBar';
import FlowsheetGrid from '../components/FlowsheetGrid';
import VitalEditDialog from '../components/VitalEditDialog';
import FlowsheetEditDialog from '../components/FlowsheetEditDialog';

const daysBetween = (from: ISODate, to: ISODate): number => {
  const a = new Date(from).getTime();
  const b = new Date(to).getTime();
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
};

const FlowsheetPage: React.FC = () => {
  const { patientId = '' } = useParams<{ patientId: string }>();
  const patient = PATIENTS.find((p) => p.id === patientId);

  const property = useFlowsheetStore((s) => s.property);
  const patternMaster = useFlowsheetStore((s) => s.patternMaster);
  const careItemMaster = useFlowsheetStore((s) => s.careItemMaster);
  const applications = useFlowsheetStore((s) => s.patternApplications);
  const vitals = useFlowsheetStore((s) => s.vitals);
  const careRecords = useFlowsheetStore((s) => s.careRecords);
  const signs = useFlowsheetStore((s) => s.signs);
  const scheduledOrders = useFlowsheetStore((s) => s.scheduledOrders);
  const nursingRecords = useFlowsheetStore((s) => s.nursingRecords);
  const movementSegments = useFlowsheetStore((s) => s.movementSegments);
  const staffs = useFlowsheetStore((s) => s.staffs);

  const [endDate, setEndDate] = useState<ISODate>(TODAY);
  const [tab, setTab] = useState<FlowsheetTab>('flowsheet');
  const [vitalDialog, setVitalDialog] = useState<{ open: boolean; date: ISODate }>({ open: false, date: TODAY });
  const [flowsheetDialog, setFlowsheetDialog] = useState<{ open: boolean; date: ISODate }>({ open: false, date: TODAY });

  const dates = useMemo(() => last7Dates(endDate), [endDate]);

  if (!patient) {
    return (
      <Alert severity="error">
        患者が見つかりません: {patientId}{' '}
        <Link component={RouterLink} to="/patients">入院患者一覧へ</Link>
      </Alert>
    );
  }

  // 表示日範囲の最終日（または今日）時点で適用中のパターン
  const activeApp = getActivePatternForDate(applications, patientId, endDate);
  const activePattern = activeApp?.patternId
    ? patternMaster.find((p) => p.id === activeApp.patternId) ?? null
    : null;
  const careItemIds = activePattern?.careItemIds ?? [];

  const segs = movementSegments.filter((s) => s.patientId === patientId);

  const isFutureDisabled = (d: ISODate): boolean =>
    property.validateFuture && d > TODAY;

  const staffName = (id: string): string =>
    staffs.find((s) => s.id === id)?.name ?? id;

  // 暫定ハンドラ（フェーズ 2-2 以降でダイアログに置換）
  const todo = (label: string) => () => {
    // eslint-disable-next-line no-console
    console.log(`[ep-10 TODO] ${label}`);
  };

  // 観察タブ表示条件は将来 Patient 型に isMedicalObservation を持たせる想定。
  // 本モックでは患者 id の prefix 等で判定できないため、現状は false で固定（spec の non-trivial 条件）。
  const showObservationTab = false;

  // 在院日数（外来は将来 admissionState で判定。現状の Patient 型は admitDate のみあり、入院前提で算出）
  const daysOfStay = patient.admitDate ? daysBetween(patient.admitDate, TODAY) + 1 : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6">{patient.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {patient.age}歳 / {patient.gender === 'M' ? '男' : '女'} / {patient.roomNumber}-{patient.bedLabel}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            主病名: {patient.diagnosis ?? '—'} / 主治医: {patient.doctorName ?? '—'}
          </Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <FlowsheetHeader
          endDate={endDate}
          onChangeEndDate={setEndDate}
          tab={tab}
          onChangeTab={setTab}
          showObservationTab={showObservationTab}
          patternName={activePattern?.name ?? null}
          daysOfStay={daysOfStay}
          onClickPatternChange={todo('パターン変更ダイアログ起動')}
        />
      </Paper>

      {tab === 'flowsheet' && (
        <>
          <MovementBar dates={dates} segments={segs} />

          <FlowsheetGrid
            patientId={patientId}
            dates={dates}
            careItemIds={careItemIds}
            careItemMaster={careItemMaster}
            vitals={vitals}
            careRecords={careRecords}
            signs={signs}
            scheduledOrders={scheduledOrders}
            nursingRecords={nursingRecords}
            staffName={staffName}
            isFutureDisabled={isFutureDisabled}
            onClickFlowsheetIcon={(d) => setFlowsheetDialog({ open: true, date: d })}
            onClickVitalIcon={(d) => setVitalDialog({ open: true, date: d })}
            onClickSignCell={(_, shift) => todo(`サイン(${shift})入力`)()}
            onClickOrderCell={todo('実施確認表ダイアログ')}
            onClickOrderListLink={todo('指示状況ダイアログ')}
            onClickNursingRecord={(id) => todo(`看護記録閲覧 ${id}`)()}
            onClickNewNursingRecord={todo('看護記録新規作成')}
          />

          {!activePattern && careItemIds.length === 0 && (
            <Alert severity="info">
              フローシートパターン未適用。「パターン変更」からパターンを適用するとケア項目行が表示されます。
            </Alert>
          )}
        </>
      )}

      {tab === 'isolation' && (
        <Alert severity="info">隔離拘束タブは ep-07 観察記録と連携予定（本エピックでは枠のみ）。</Alert>
      )}
      {tab === 'sleep' && (
        <Alert severity="info">睡眠・活動タブはフェーズ 5（us-25）で実装。</Alert>
      )}
      {tab === 'observation' && (
        <Alert severity="info">観察タブは医療観察法対象患者向け（本エピックでは枠のみ）。</Alert>
      )}

      <VitalEditDialog
        open={vitalDialog.open}
        patientId={patientId}
        date={vitalDialog.date}
        onClose={() => setVitalDialog((s) => ({ ...s, open: false }))}
      />
      <FlowsheetEditDialog
        open={flowsheetDialog.open}
        patientId={patientId}
        date={flowsheetDialog.date}
        onClose={() => setFlowsheetDialog((s) => ({ ...s, open: false }))}
      />
    </Box>
  );
};

export default FlowsheetPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, Typography, Stack, Button, TextField, MenuItem,
  Checkbox, FormControlLabel, Tooltip,
} from '@mui/material';
import { Print, Settings as SettingsIcon } from '@mui/icons-material';
import {
  ISOLATION_ORDERS, generateObservationRecords,
  MASTER_STAFF_FOR_SIGN, MASTER_BEHAVIOR_RESTRICT_WARDS,
  MASTER_OBSERVATION_FREQUENCY, MASTER_OBSERVATION_STATES,
  PATIENTS, patientNumberOf,
  type AdmitFormType,
} from '../../data/mockData';
import type {
  ObservationState, IsolationOrder, IsolationConfirmSignKind, IsolationSubtype,
  Patient, WardId,
} from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import RestraintOrderDialog from './RestraintOrderDialog';
import SignInputDialog from './SignInputDialog';
import IsolationFilterDialog from './IsolationFilterDialog';
import RestraintNursingRecordStub from './RestraintNursingRecordStub';
import ObservationBulkDialog from './ObservationBulkDialog';
import ObservationRecordDialog from './ObservationRecordDialog';
import IsolationHistoryView from './IsolationHistoryView';
import BedMoveDialog, { type BedMoveTarget } from '../wardMap/BedMoveDialog';
import type { KartePageLocationState } from '../karte/KartePage';

const OBS_COLORS: Record<ObservationState, string> = {
  '未記入':   '#f1f5f9',
  '浅眠':     '#fef3c7',
  '落ち着き': '#dcfce7',
  '不穏':     '#fef2f2',
  '睡眠':     '#dbeafe',
  '中途覚醒': '#fce7f3',
};

// ===== ep-06 隔離拘束一覧: ヘルパ =====

const SUBTYPE_LABEL: Record<IsolationSubtype, { label: string; color: 'error' | 'warning' | 'default' | 'primary' }> = {
  '隔離':     { label: '隔離',   color: 'error' },
  '拘束':     { label: '拘束',   color: 'warning' },
  '隔離拘束': { label: '隔・拘', color: 'primary' },
};

function isPsychiatristCertifiedDoctor(doctorName: string): boolean {
  const staff = MASTER_STAFF_FOR_SIGN.find((s) => s.name === doctorName);
  // マスタに居なければ精神保健指定医「ではない」とみなして警告対象にする
  return staff?.isPsychiatristCertified ?? false;
}

function hoursBetween(startStr: string, end: Date): number {
  // 'YYYY-MM-DD HH:mm' or ISO
  const start = new Date(startStr.replace(' ', 'T'));
  return (end.getTime() - start.getTime()) / 3_600_000;
}

function getSubtype(o: IsolationOrder): IsolationSubtype {
  return o.subtype ?? (o.type === '隔離' ? '隔離' : '拘束');
}

function patientAdmitForm(patientId: string): AdmitFormType {
  // ep-05 と同じモック: P003=措置 / P006=医療保護 / 他=任意
  if (patientId === 'P003') return '措置入院';
  if (patientId === 'P006') return '医療保護入院';
  return '任意入院';
}

// ===== ep-06 隔離拘束一覧: 一覧データ算出 =====

interface IsolationListRow {
  order: IsolationOrder;
  subtype: IsolationSubtype;
  /** その他区分 (病棟が判定対象) */
  isOther: boolean;
  /** 表示用 patient（マスタ + dynamic 由来をマージ済） */
  patient: Patient | null;
  /** 開始指示医が精神保健指定医ではない */
  warnDoctor: boolean;
  /** 開始から12h超過 (active のみ判定) */
  warnElapsed: boolean;
  /** 終了日時表示文字列（継続/変更指示は「-」） */
  endDisplay: string;
  /** 終了済 */
  isEnded: boolean;
  /** カルテ済（モック: linkedMedicalRecordId 有無で判定） */
  karteStartDone: boolean;
  karteEndDone: boolean;
  /** 看護記録済（モック: linkedNursingRecordId 有無で判定） */
  nursingStartDone: boolean;
  nursingEndDone: boolean;
}

interface SearchCondition {
  fromDate: string; // YYYY-MM-DD
  toDate: string;
  ward: WardId | 'all';
  hideEnded: boolean;
  admitForms: AdmitFormType[]; // 空=絞り込みなし
}

function computeRows(
  baseOrders: IsolationOrder[],
  dynamicOrders: IsolationOrder[],
  patients: Patient[],
  cond: SearchCondition,
  now: Date,
): IsolationListRow[] {
  // dynamic とマスタをマージ（同 id は dynamic 優先）
  const merged = new Map<string, IsolationOrder>();
  baseOrders.forEach((o) => merged.set(o.id, o));
  dynamicOrders.forEach((o) => {
    const exist = merged.get(o.id);
    if (exist) {
      // confirmSigns はマスタの値を保持しつつ dynamic の差分で上書き
      merged.set(o.id, {
        ...exist,
        ...o,
        confirmSigns: { ...(exist.confirmSigns ?? {}), ...(o.confirmSigns ?? {}) },
      });
    } else {
      merged.set(o.id, o);
    }
  });

  // 「指示」あり患者の orders
  const orderRows: IsolationListRow[] = [];
  for (const o of merged.values()) {
    const subtype = getSubtype(o);
    const patient = patients.find((p) => p.id === o.patientId) ?? null;

    // 期間フィルタ: 開始日が範囲内 OR 終了日が範囲内 OR 範囲を跨ぐ
    const start = o.startDatetime.slice(0, 10);
    const end = o.endDatetime ? o.endDatetime.slice(0, 10) : null;
    if (cond.fromDate && cond.toDate) {
      const inRange = (
        (start >= cond.fromDate && start <= cond.toDate) ||
        (end && end >= cond.fromDate && end <= cond.toDate) ||
        (start <= cond.fromDate && (!end || end >= cond.toDate))
      );
      if (!inRange) continue;
    }

    // 病棟フィルタ
    if (cond.ward !== 'all' && o.wardId !== cond.ward) continue;

    // 終了者を表示しない
    const isEnded = !!o.endDatetime;
    if (cond.hideEnded && isEnded) continue;

    const warnDoctor = !isPsychiatristCertifiedDoctor(o.doctorName);
    const warnElapsed = !isEnded && hoursBetween(o.startDatetime, now) > 12;

    const endDisplay = (o.operation === '継続' || o.operation === '変更') && !o.endDatetime ? '-' : (o.endDatetime ?? '');

    orderRows.push({
      order: o,
      subtype,
      isOther: false,
      patient,
      warnDoctor,
      warnElapsed,
      endDisplay,
      isEnded,
      karteStartDone: !!o.linkedMedicalRecordId,
      karteEndDone: false, // 終了側カルテ済の判定はモックでは未記録 → 常に [未]
      nursingStartDone: !!o.linkedNursingRecordId,
      nursingEndDone: false,
    });
  }

  // 「その他」区分: 行動制限判定対象病棟の在棟患者で、かつ上記 orderRows に含まれない患者
  const orderedPatientIds = new Set(orderRows.map((r) => r.order.patientId));
  const otherRows: IsolationListRow[] = [];
  for (const p of patients) {
    if (orderedPatientIds.has(p.id)) continue;
    if (!(MASTER_BEHAVIOR_RESTRICT_WARDS as readonly WardId[]).includes(p.wardId)) continue;
    if (cond.ward !== 'all' && p.wardId !== cond.ward) continue;
    if (p.admissionState && p.admissionState !== 'inpatient') continue;
    // 入院形態フィルタ（その他区分のみ）
    if (cond.admitForms.length > 0) {
      const form = patientAdmitForm(p.id);
      if (!cond.admitForms.includes(form)) continue;
    }
    otherRows.push({
      // ダミー order
      order: {
        id: `OTHER-${p.id}`,
        patientId: p.id,
        patientName: p.name,
        type: '隔離',
        startDatetime: '',
        wardId: p.wardId,
        roomNumber: `${p.roomNumber}-${p.bedLabel}`,
        doctorName: p.doctorName,
      },
      subtype: '隔離', // 「その他」区分（subtype 列の表示は別ロジック）
      isOther: true,
      patient: p,
      warnDoctor: false,
      warnElapsed: false,
      endDisplay: '',
      isEnded: false,
      karteStartDone: false,
      karteEndDone: false,
      nursingStartDone: false,
      nursingEndDone: false,
    });
  }

  // 並び順: 病棟→病室→ベッド昇順
  const all = [...orderRows, ...otherRows];
  all.sort((a, b) => {
    const wardCmp = a.order.wardId.localeCompare(b.order.wardId);
    if (wardCmp !== 0) return wardCmp;
    return a.order.roomNumber.localeCompare(b.order.roomNumber);
  });
  return all;
}

// ===== ep-06 隔離拘束一覧: 「指示」タブ本体 =====

const IsolationOrderListTab: React.FC = () => {
  const navigate = useNavigate();
  const dynamicIsolationOrders = useAppStore((s) => s.dynamicIsolationOrders);
  const upsertConfirmSign = useAppStore((s) => s.upsertConfirmSign);
  const removeConfirmSign = useAppStore((s) => s.removeConfirmSign);
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const currentUserRole = useAppStore((s) => s.currentUserRole);

  const today = new Date().toISOString().slice(0, 10);
  const [cond, setCond] = useState<SearchCondition>({
    fromDate: today, toDate: today,
    ward: 'all', hideEnded: true, admitForms: [],
  });
  const [appliedCond, setAppliedCond] = useState<SearchCondition>(cond);

  const [filterOpen, setFilterOpen] = useState(false);

  const [restraintDialog, setRestraintDialog] = useState<{ open: boolean; title: string; editId?: string }>({
    open: false, title: '隔離開始',
  });
  const [signDialog, setSignDialog] = useState<{ open: boolean; orderId: string; kind: IsolationConfirmSignKind } | null>(null);
  const [nursingDialog, setNursingDialog] = useState<{ open: boolean; phase: '開始' | '終了'; patientName: string } | null>(null);
  const [bedMoveTarget, setBedMoveTarget] = useState<BedMoveTarget | null>(null);

  // 期間=操作日初期化（再表示）
  const handleSearch = () => setAppliedCond(cond);

  const rows = React.useMemo(() => {
    const expandedFromDate = appliedCond.fromDate || '0000-01-01';
    const expandedToDate = appliedCond.toDate || '9999-12-31';
    return computeRows(
      ISOLATION_ORDERS,
      dynamicIsolationOrders,
      PATIENTS,
      { ...appliedCond, fromDate: expandedFromDate, toDate: expandedToDate },
      new Date(),
    );
  }, [appliedCond, dynamicIsolationOrders]);

  const handlePrintLedger = () => {
    const month = appliedCond.fromDate.slice(0, 7);
    showSnackbar(`${month} の行動制限一覧性台帳をダウンロードしました（モック）`, 'success');
  };

  const navigateToKarte = (p: Patient) => {
    if (p.primaryRecordType === 'nursing-record') navigate('/nursing');
    else navigate(`/karte/${p.id}`, { state: { from: 'patient-list' } satisfies KartePageLocationState });
  };

  const openBedMove = (p: Patient) => {
    setBedMoveTarget({
      patient: p,
      currentWard: p.wardId,
      currentRoom: p.roomNumber,
      currentBed: p.bedLabel,
    });
  };

  const openKarteOrderStart = (row: IsolationListRow) => {
    const title = `${row.subtype}開始`;
    setRestraintDialog({ open: true, title, editId: row.karteStartDone ? row.order.id : undefined });
  };
  const openKarteOrderEnd = (row: IsolationListRow) => {
    const title = `${row.subtype}解除`;
    setRestraintDialog({ open: true, title, editId: row.order.id });
  };

  const openSign = (orderId: string, kind: IsolationConfirmSignKind) => {
    setSignDialog({ open: true, orderId, kind });
  };

  // 既存サイン取得
  const getExistingSign = (orderId: string, kind: IsolationConfirmSignKind) => {
    const dyn = dynamicIsolationOrders.find((o) => o.id === orderId);
    if (dyn?.confirmSigns?.[kind]) return dyn.confirmSigns[kind];
    const base = ISOLATION_ORDERS.find((o) => o.id === orderId);
    return base?.confirmSigns?.[kind];
  };

  // 看護(開始/終了)セル
  const renderNursingCell = (row: IsolationListRow, phase: '開始' | '終了') => {
    const karteDone = phase === '開始' ? row.karteStartDone : row.karteEndDone;
    const nursingDone = phase === '開始' ? row.nursingStartDone : row.nursingEndDone;
    if (row.isOther) return <Typography variant="caption" color="text.disabled">—</Typography>;
    return (
      <Tooltip title={karteDone ? '' : 'カルテ未のため看護記録は登録できません'}>
        <span>
          <Button
            size="small" variant="outlined"
            disabled={!karteDone}
            color={nursingDone ? 'success' : 'inherit'}
            onClick={(e) => {
              e.stopPropagation();
              setNursingDialog({ open: true, phase, patientName: row.order.patientName });
            }}
            sx={{ minWidth: 36, py: 0, px: 0.5, fontSize: '0.65rem' }}
          >
            {nursingDone ? '済' : '未'}
          </Button>
        </span>
      </Tooltip>
    );
  };

  // 指示受け(開始/終了)セル: 一次/二次の 2 段
  const renderConfirmCell = (row: IsolationListRow, phase: '開始' | '終了') => {
    if (row.isOther) return <Typography variant="caption" color="text.disabled">—</Typography>;
    const primaryKind = phase === '開始' ? 'startPrimary' as const : 'endPrimary' as const;
    const secondaryKind = phase === '開始' ? 'startSecondary' as const : 'endSecondary' as const;
    const primary = getExistingSign(row.order.id, primaryKind);
    const secondary = getExistingSign(row.order.id, secondaryKind);
    return (
      <Stack spacing={0.2}>
        {(['primary', 'secondary'] as const).map((rank) => {
          const sign = rank === 'primary' ? primary : secondary;
          const kind = rank === 'primary' ? primaryKind : secondaryKind;
          return (
            <Button
              key={rank}
              size="small"
              variant={sign ? 'text' : 'outlined'}
              onClick={(e) => {
                e.stopPropagation();
                openSign(row.order.id, kind);
              }}
              sx={{ minWidth: 36, py: 0, px: 0.5, fontSize: '0.65rem', justifyContent: 'flex-start' }}
            >
              {sign ? sign.staffName : '未'}
            </Button>
          );
        })}
      </Stack>
    );
  };

  return (
    <Box>
      {/* 検索条件バー */}
      <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
          <TextField
            size="small" type="date" label="期間 from"
            value={cond.fromDate}
            onChange={(e) => setCond((c) => ({ ...c, fromDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <Typography variant="caption">〜</Typography>
          <TextField
            size="small" type="date" label="期間 to"
            value={cond.toDate}
            onChange={(e) => setCond((c) => ({ ...c, toDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select size="small" label="病棟" sx={{ minWidth: 120 }}
            value={cond.ward}
            onChange={(e) => setCond((c) => ({ ...c, ward: e.target.value as WardId | 'all' }))}
          >
            <MenuItem value="all">全病棟</MenuItem>
            <MenuItem value="ward1">第１病棟</MenuItem>
            <MenuItem value="ward2">第２病棟</MenuItem>
          </TextField>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={cond.hideEnded}
                onChange={(e) => setCond((c) => ({ ...c, hideEnded: e.target.checked }))}
              />
            }
            label={<Typography variant="caption">終了者を表示しない</Typography>}
          />
          <Tooltip title={cond.admitForms.length > 0 ? `入院形態: ${cond.admitForms.join('、')}` : '入院形態フィルタなし'}>
            <Button
              size="small" variant="outlined" startIcon={<SettingsIcon />}
              onClick={() => setFilterOpen(true)}
            >
              条件設定 {cond.admitForms.length > 0 && `(${cond.admitForms.length})`}
            </Button>
          </Tooltip>
          <Button size="small" variant="contained" onClick={handleSearch}>表示</Button>
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant="outlined" startIcon={<Print />} onClick={handlePrintLedger}>
            印刷（行動制限一覧性台帳）
          </Button>
        </Stack>
      </Paper>

      {/* 一覧テーブル */}
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 'calc(100vh - 300px)' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '0.7rem' }}>患者番号</TableCell>
              <TableCell sx={{ fontSize: '0.7rem' }}>氏名(年齢)</TableCell>
              <TableCell sx={{ fontSize: '0.7rem' }}>入院形態</TableCell>
              <TableCell sx={{ fontSize: '0.7rem' }}>区分</TableCell>
              <TableCell sx={{ fontSize: '0.7rem' }}>開始日時</TableCell>
              <TableCell sx={{ fontSize: '0.7rem' }}>開始指示医</TableCell>
              <TableCell align="center" sx={{ fontSize: '0.7rem' }}>カルテ(開始)</TableCell>
              <TableCell align="center" sx={{ fontSize: '0.7rem' }}>看護(開始)</TableCell>
              <TableCell sx={{ fontSize: '0.7rem' }}>指示受け(開始)</TableCell>
              <TableCell sx={{ fontSize: '0.7rem' }}>終了日時</TableCell>
              <TableCell sx={{ fontSize: '0.7rem' }}>終了指示医</TableCell>
              <TableCell align="center" sx={{ fontSize: '0.7rem' }}>カルテ(終了)</TableCell>
              <TableCell align="center" sx={{ fontSize: '0.7rem' }}>看護(終了)</TableCell>
              <TableCell sx={{ fontSize: '0.7rem' }}>指示受け(終了)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 3 }}>
                  <Typography variant="caption" color="text.secondary">該当する患者はいません</Typography>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => {
              const subtypeConf = SUBTYPE_LABEL[row.subtype];
              return (
                <TableRow
                  key={row.order.id}
                  hover
                  onClick={row.patient ? () => navigateToKarte(row.patient!) : undefined}
                  sx={{ cursor: row.patient ? 'pointer' : 'default' }}
                >
                  <TableCell sx={{ fontSize: '0.7rem' }}>
                    {row.patient ? (
                      <Button size="small" sx={{ p: 0, minWidth: 0, fontSize: '0.7rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openBedMove(row.patient!);
                        }}>
                        {patientNumberOf(row.order.patientId)}
                      </Button>
                    ) : patientNumberOf(row.order.patientId)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {row.order.patientName}
                      {row.patient && `（${row.patient.age}）`}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>
                    {row.patient ? patientAdmitForm(row.patient.id) : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.isOther ? 'その他' : subtypeConf.label}
                      size="small"
                      color={row.isOther ? 'default' : subtypeConf.color}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', color: row.warnElapsed ? 'error.main' : 'text.primary', fontWeight: row.warnElapsed ? 700 : 400 }}>
                    {row.order.startDatetime || '—'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', color: row.warnDoctor ? 'error.main' : 'text.primary', fontWeight: row.warnDoctor ? 700 : 400 }}>
                    {row.order.doctorName || '—'}
                  </TableCell>
                  <TableCell align="center">
                    {row.isOther ? <Typography variant="caption" color="text.disabled">—</Typography> : (
                      <Button
                        size="small"
                        variant="outlined"
                        color={row.karteStartDone ? 'success' : 'inherit'}
                        onClick={(e) => {
                          e.stopPropagation();
                          openKarteOrderStart(row);
                        }}
                        sx={{ minWidth: 36, py: 0, px: 0.5, fontSize: '0.65rem' }}
                      >
                        {row.karteStartDone ? '済' : '未'}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell align="center">{renderNursingCell(row, '開始')}</TableCell>
                  <TableCell>{renderConfirmCell(row, '開始')}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>{row.endDisplay || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem' }}>{row.isEnded ? row.order.doctorName : '—'}</TableCell>
                  <TableCell align="center">
                    {row.isOther ? <Typography variant="caption" color="text.disabled">—</Typography> : (
                      <Button
                        size="small"
                        variant="outlined"
                        color={row.karteEndDone ? 'success' : 'inherit'}
                        onClick={(e) => {
                          e.stopPropagation();
                          openKarteOrderEnd(row);
                        }}
                        sx={{ minWidth: 36, py: 0, px: 0.5, fontSize: '0.65rem' }}
                      >
                        {row.karteEndDone ? '済' : '未'}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell align="center">{renderNursingCell(row, '終了')}</TableCell>
                  <TableCell>{renderConfirmCell(row, '終了')}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ダイアログ群 */}
      <RestraintOrderDialog
        open={restraintDialog.open}
        patient={(() => {
          const r = rows.find((x) => x.order.id === restraintDialog.editId) ?? rows[0];
          return r?.patient ?? null;
        })()}
        initialTitle={restraintDialog.title}
        editOrderId={restraintDialog.editId}
        onClose={() => setRestraintDialog((d) => ({ ...d, open: false }))}
      />
      {signDialog && (
        <SignInputDialog
          open={signDialog.open}
          kind={signDialog.kind}
          existing={getExistingSign(signDialog.orderId, signDialog.kind)}
          defaultStaffId={currentUserRole === 'doctor' ? 'D001' : 'N001'}
          onClose={() => setSignDialog(null)}
          onUpsert={(sign) => {
            upsertConfirmSign(signDialog.orderId, signDialog.kind, sign);
            showSnackbar(`指示受けサインを登録しました（${sign.staffName}）`, 'success');
            setSignDialog(null);
          }}
          onRemove={() => {
            removeConfirmSign(signDialog.orderId, signDialog.kind);
            showSnackbar('指示受けサインを削除しました', 'info');
            setSignDialog(null);
          }}
        />
      )}
      {nursingDialog && (
        <RestraintNursingRecordStub
          open={nursingDialog.open}
          phase={nursingDialog.phase}
          patientName={nursingDialog.patientName}
          onClose={() => setNursingDialog(null)}
          onSubmit={({ kind }) => {
            showSnackbar(`看護記録（${nursingDialog.phase}・${kind}）を登録しました（モック）`, 'success');
            setNursingDialog(null);
          }}
        />
      )}
      {bedMoveTarget && (
        <BedMoveDialog
          open={!!bedMoveTarget}
          mode="move"
          target={bedMoveTarget}
          onClose={() => setBedMoveTarget(null)}
          onSubmit={() => {
            showSnackbar('転棟・転室を登録しました（モック）', 'success');
            setBedMoveTarget(null);
          }}
        />
      )}
      <IsolationFilterDialog
        open={filterOpen}
        selected={cond.admitForms}
        onClose={() => setFilterOpen(false)}
        onApply={(forms) => setCond((c) => ({ ...c, admitForms: forms }))}
      />
    </Box>
  );
};

// ===== ep-07 観察記録: 「記録」タブ本体 =====

interface ObservationCellInfo {
  state: ObservationState;
  count: number;
}

const SUB_3SEG: Array<IsolationSubtype | 'その他'> = ['隔離', '拘束', 'その他'];

const ObservationListTab: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);
  const dynamicIsolationOrders = useAppStore((s) => s.dynamicIsolationOrders);
  const dynamicObservationRecords = useAppStore((s) => s.dynamicObservationRecords);
  const futureBlock = useAppStore((s) => s.optionalFeatures.observationFutureBlock);

  const [date, setDate] = useState(today);
  const [ward, setWard] = useState<WardId | 'all'>('all');
  const [admitForms, setAdmitForms] = useState<AdmitFormType[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const [bulkDialog, setBulkDialog] = useState<{
    open: boolean; subtype: IsolationSubtype | 'その他'; hour: number; occurrence: number;
    candidates: Array<{ patient: Patient; order: IsolationOrder }>;
  } | null>(null);

  const [individualDialog, setIndividualDialog] = useState<{
    open: boolean; patient: Patient; subtype: IsolationSubtype | 'その他'; hour: number; isolationOrderId?: string;
  } | null>(null);

  // 一覧データ算出: 候補患者 (active 指示あり OR その他区分病棟在棟)
  const rows = React.useMemo(() => {
    const merged = new Map<string, IsolationOrder>();
    [...ISOLATION_ORDERS, ...dynamicIsolationOrders].forEach((o) => merged.set(o.id, o));
    const ordersByPatient = new Map<string, IsolationOrder[]>();
    for (const o of merged.values()) {
      // 当該日に active な指示のみ
      const start = o.startDatetime.slice(0, 10);
      if (start > date) continue;
      if (o.endDatetime && o.endDatetime.slice(0, 10) < date) continue;
      if (ward !== 'all' && o.wardId !== ward) continue;
      const arr = ordersByPatient.get(o.patientId) ?? [];
      arr.push(o);
      ordersByPatient.set(o.patientId, arr);
    }
    const orderedRows: Array<{ patient: Patient; orders: IsolationOrder[]; isOther: false }> = [];
    for (const p of PATIENTS) {
      const ords = ordersByPatient.get(p.id);
      if (!ords) continue;
      orderedRows.push({ patient: p, orders: ords, isOther: false });
    }
    // その他区分（行動制限判定対象病棟の在棟患者で、上記に居ない者）
    const otherRows: Array<{ patient: Patient; orders: IsolationOrder[]; isOther: true }> = [];
    const includedIds = new Set(orderedRows.map((r) => r.patient.id));
    for (const p of PATIENTS) {
      if (includedIds.has(p.id)) continue;
      if (!(MASTER_BEHAVIOR_RESTRICT_WARDS as readonly WardId[]).includes(p.wardId)) continue;
      if (ward !== 'all' && p.wardId !== ward) continue;
      if (p.admissionState && p.admissionState !== 'inpatient') continue;
      if (admitForms.length > 0 && !admitForms.includes(patientAdmitForm(p.id))) continue;
      otherRows.push({ patient: p, orders: [], isOther: true });
    }
    return [...orderedRows, ...otherRows];
  }, [date, ward, admitForms, dynamicIsolationOrders]);

  // 観察記録の集計（patientId × subtype × hour × occurrence → state）
  const observationsByKey = React.useMemo(() => {
    const map = new Map<string, ObservationCellInfo>();
    dynamicObservationRecords.forEach((r) => {
      if (r.date !== date) return;
      const hour = parseInt(r.time.slice(0, 2), 10);
      const key = `${r.patientId}|${r.subtype ?? 'その他'}|${hour}|${r.occurrence ?? 1}`;
      const exist = map.get(key);
      map.set(key, { state: r.state, count: (exist?.count ?? 0) + 1 });
    });
    return map;
  }, [dynamicObservationRecords, date]);

  // タイトル回数枠クリック → 一括ダイアログ起動
  const openBulk = (subtype: IsolationSubtype | 'その他', hour: number, occurrence: number) => {
    const cands: Array<{ patient: Patient; order: IsolationOrder }> = [];
    rows.forEach((row) => {
      if (subtype === 'その他') {
        if (row.isOther) {
          cands.push({
            patient: row.patient,
            order: {
              id: `OTHER-${row.patient.id}`,
              patientId: row.patient.id, patientName: row.patient.name,
              type: '隔離', startDatetime: '',
              wardId: row.patient.wardId,
              roomNumber: `${row.patient.roomNumber}-${row.patient.bedLabel}`,
              doctorName: row.patient.doctorName,
            },
          });
        }
      } else {
        const matched = row.orders.find((o) => {
          const sub = o.subtype ?? (o.type === '隔離' ? '隔離' : '拘束');
          return sub === subtype || (subtype === '拘束' && sub === '隔離拘束');
        });
        if (matched) cands.push({ patient: row.patient, order: matched });
      }
    });
    setBulkDialog({ open: true, subtype, hour, occurrence, candidates: cands });
  };

  // セルクリック → 個別ダイアログ起動
  const openIndividual = (patient: Patient, subtype: IsolationSubtype | 'その他', hour: number, isolationOrderId?: string) => {
    setIndividualDialog({ open: true, patient, subtype, hour, isolationOrderId });
  };

  return (
    <Box>
      {/* 検索条件 */}
      <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
          <TextField
            type="date" size="small" label="日付"
            value={date} onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select size="small" label="病棟" sx={{ minWidth: 120 }}
            value={ward} onChange={(e) => setWard(e.target.value as WardId | 'all')}
          >
            <MenuItem value="all">全病棟</MenuItem>
            <MenuItem value="ward1">第１病棟</MenuItem>
            <MenuItem value="ward2">第２病棟</MenuItem>
          </TextField>
          <Tooltip title={admitForms.length > 0 ? `入院形態: ${admitForms.join('、')}` : '入院形態フィルタなし'}>
            <Button size="small" variant="outlined" startIcon={<SettingsIcon />} onClick={() => setFilterOpen(true)}>
              条件設定 {admitForms.length > 0 && `(${admitForms.length})`}
            </Button>
          </Tooltip>
          {futureBlock && <Chip label="未来日入力抑止 ON" size="small" color="warning" variant="outlined" />}
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1} alignItems="center">
            {MASTER_OBSERVATION_STATES.filter((s) => s.state !== '未記入').map((s) => (
              <Stack key={s.state} direction="row" spacing={0.3} alignItems="center">
                <Box sx={{ width: 10, height: 10, bgcolor: s.bgColor, border: '1px solid #cbd5e1' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  {s.state}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Paper>

      {/* 一覧マトリクス */}
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 'calc(100vh - 300px)' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell rowSpan={2} sx={{ minWidth: 140, position: 'sticky', left: 0, zIndex: 4, bgcolor: '#f8fafc' }}>患者</TableCell>
              <TableCell rowSpan={2} sx={{ width: 60 }}>区分</TableCell>
              {Array.from({ length: 24 }, (_, h) => h).map((h) => (
                <TableCell key={h} colSpan={Math.max(...SUB_3SEG.map((s) => MASTER_OBSERVATION_FREQUENCY[s === '隔離拘束' ? '拘束' : (s as '隔離' | '拘束' | 'その他')] ?? 1))}
                  align="center" sx={{ fontSize: '0.55rem', p: 0, borderLeft: '1px solid #e2e8f0' }}>
                  {h}時
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              {/* 1 時間内の回数枠タイトル（区分ごとに最大回数を取り、クリックで一括起動） */}
              {Array.from({ length: 24 }, (_, h) => h).flatMap((h) => {
                const maxFreq = Math.max(...SUB_3SEG.map((s) => MASTER_OBSERVATION_FREQUENCY[s === '隔離拘束' ? '拘束' : (s as '隔離' | '拘束' | 'その他')] ?? 1));
                return Array.from({ length: maxFreq }, (_, occ) => (
                  <TableCell key={`${h}-${occ}`} align="center" sx={{ p: 0, fontSize: '0.5rem', cursor: 'pointer' }}>
                    <Tooltip title={`${h}時 ${occ + 1}回目（クリックで一括入力）`}>
                      <Box
                        onClick={() => {
                          // デフォルト: 拘束区分（最も回数多い前提）。実 UX では区分タイトルを別行に分けるが、簡略化
                          openBulk('拘束', h, occ + 1);
                        }}
                        sx={{ p: 0.2, '&:hover': { bgcolor: '#dbeafe' } }}
                      >
                        {occ + 1}
                      </Box>
                    </Tooltip>
                  </TableCell>
                ));
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                  <Typography variant="caption" color="text.secondary">該当する患者はいません</Typography>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => {
              const subtypesToShow: Array<IsolationSubtype | 'その他'> = row.isOther
                ? ['その他']
                : Array.from(new Set(row.orders.map((o) => (o.subtype ?? (o.type === '隔離' ? '隔離' : '拘束'))))) as IsolationSubtype[];
              return subtypesToShow.map((sub, subIdx) => (
                <TableRow key={`${row.patient.id}-${sub}`} hover>
                  {subIdx === 0 && (
                    <TableCell rowSpan={subtypesToShow.length} sx={{ position: 'sticky', left: 0, zIndex: 1, bgcolor: '#fff', verticalAlign: 'top' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        [{row.patient.patientNumber ?? row.patient.id}] {row.patient.name}（{row.patient.age}）
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell sx={{ verticalAlign: 'middle' }}>
                    <Chip label={sub} size="small" variant="outlined"
                      color={sub === '隔離' ? 'error' : sub === '拘束' || sub === '隔離拘束' ? 'warning' : 'default'} />
                  </TableCell>
                  {Array.from({ length: 24 }, (_, h) => h).flatMap((h) => {
                    const maxFreq = Math.max(...SUB_3SEG.map((s) => MASTER_OBSERVATION_FREQUENCY[s === '隔離拘束' ? '拘束' : (s as '隔離' | '拘束' | 'その他')] ?? 1));
                    return Array.from({ length: maxFreq }, (_, occ) => {
                      const target = new Date(`${date}T${String(h).padStart(2, '0')}:00:00`).getTime();
                      const isFuture = futureBlock && target > Date.now();
                      const key = `${row.patient.id}|${sub}|${h}|${occ + 1}`;
                      const cell = observationsByKey.get(key);
                      const stateConf = cell ? MASTER_OBSERVATION_STATES.find((s) => s.state === cell.state) : undefined;
                      const order = !row.isOther
                        ? row.orders.find((o) => (o.subtype ?? (o.type === '隔離' ? '隔離' : '拘束')) === sub)
                        : undefined;
                      return (
                        <TableCell
                          key={`${h}-${occ}`}
                          align="center"
                          onClick={isFuture ? undefined : () => openIndividual(row.patient, sub, h, order?.id)}
                          sx={{
                            p: 0, fontSize: '0.5rem', cursor: isFuture ? 'not-allowed' : 'pointer',
                            bgcolor: isFuture ? '#e2e8f0' : (stateConf?.bgColor ?? '#fff'),
                            color: stateConf?.color, borderLeft: '1px solid #f1f5f9',
                            '&:hover': isFuture ? {} : { boxShadow: 'inset 0 0 0 1px #2563eb' },
                          }}
                        >
                          {cell && cell.state !== '未記入' ? cell.state.substring(0, 1) : ''}
                        </TableCell>
                      );
                    });
                  })}
                </TableRow>
              ));
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ダイアログ */}
      <IsolationFilterDialog
        open={filterOpen}
        selected={admitForms}
        onClose={() => setFilterOpen(false)}
        onApply={(forms) => setAdmitForms(forms)}
      />
      {bulkDialog && (
        <ObservationBulkDialog
          open={bulkDialog.open}
          onClose={() => setBulkDialog(null)}
          subtype={bulkDialog.subtype}
          date={date}
          hour={bulkDialog.hour}
          occurrence={bulkDialog.occurrence}
          candidates={bulkDialog.candidates}
        />
      )}
      {individualDialog && (
        <ObservationRecordDialog
          open={individualDialog.open}
          onClose={() => setIndividualDialog(null)}
          patient={{
            id: individualDialog.patient.id,
            name: individualDialog.patient.name,
            age: individualDialog.patient.age,
            wardId: individualDialog.patient.wardId,
          }}
          date={date}
          hour={individualDialog.hour}
          subtype={individualDialog.subtype}
          isolationOrderId={individualDialog.isolationOrderId}
        />
      )}
    </Box>
  );
};

// ===== 既存タブ（ep-08 で再構成予定）=====

const IsolationRestraint: React.FC = () => {
  const [tab, setTab] = useState(0);
  const activeOrders = ISOLATION_ORDERS.filter((o) => !o.endDatetime);

  // Generate 15-min slots for observation (show 6:00-22:00)
  const obsSlots = Array.from({ length: 64 }, (_, i) => {
    const totalMin = 6 * 60 + i * 15;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }).filter((_, i) => i < 48); // 6:00 to 18:00 for display

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="隔離拘束一覧" />
        <Tab label="観察記録" />
        <Tab label="隔離歴" />
        <Tab label="行動制限台帳" />
      </Tabs>

      {/* ===== ep-06 隔離拘束一覧: tab=0 改修済 ===== */}
      {tab === 0 && <IsolationOrderListTab />}

      {/* ===== ep-07 観察記録: tab=1 改修済 ===== */}
      {tab === 1 && <ObservationListTab />}

      {/* ===== ep-08 隔離拘束歴: tab=2 改修済 ===== */}
      {tab === 2 && <IsolationHistoryView />}

      {tab === 3 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">行動制限一覧性台帳</Typography>
            <Button variant="outlined" startIcon={<Print />}>印刷</Button>
          </Stack>
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">月と病棟を指定して台帳を表示・印刷できます</Typography>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default IsolationRestraint;

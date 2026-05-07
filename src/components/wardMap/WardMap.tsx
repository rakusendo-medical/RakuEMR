import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Checkbox, Button, Chip,
  Grid, Stack, Tabs, Tab, Paper, Divider, IconButton,
} from '@mui/material';
import {
  ArrowForward, Clear, BedOutlined, EventAvailable,
  PeopleAltOutlined, FlightTakeoff, InfoOutlined,
  OpenInFull as OpenInFullIcon, Close as CloseIcon, MoveDown as MoveDownIcon,
  ArticleOutlined as ArticleIcon,
  LogoutOutlined, AssignmentReturnedOutlined,
  Lock as LockIcon,
} from '@mui/icons-material';
import type { AdmissionOrder, Bed, Patient, UnassignedPatient, WardId } from '../../types';
import type { KartePageLocationState } from '../karte/KartePage';
import { ROOMS, STATUS_CONFIG, PATIENTS, ADMISSION_ORDERS } from '../../data/mockData';
import { WARD_LABELS } from '../../types';
import StatusBadge from '../common/StatusBadge';
import { useAppStore } from '../../stores/useAppStore';
import BedFlagIcons, { BedFlagLegend } from './BedFlagIcons';
import RelatedFeatureDialogs from './RelatedFeatureDialogs';
import type { RelatedFeatureKey } from './RelatedFeatureDialogs';
import UnassignedPatientsPanel from './UnassignedPatientsPanel';
import BedMoveDialog, { BedMoveMode, BedMoveTarget, BedMoveSubmitParams } from './BedMoveDialog';
import DischargeConfirmDialog from '../admission/DischargeConfirmDialog';
import DischargeOrderDialog from '../admission/DischargeOrderDialog';
import IsolationHistoryDialog from '../isolation/IsolationHistoryDialog';

const WardMap: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedRooms, toggleRoom, clearSelectedRooms,
    setSelectedPatient, bedMenuPatientId, setBedMenuPatientId,
    setWardMapNavigation, showSnackbar,
    scheduledMoves, addScheduledMove,
    pendingOrders, confirmedAdmissionIds,
  } = useAppStore();
  const [ward, setWard] = React.useState<WardId>('ward1');

  const [activeFeature, setActiveFeature] = React.useState<RelatedFeatureKey | null>(null);
  const [unassignedOpen, setUnassignedOpen] = React.useState(false);
  const [moveDialog, setMoveDialog] = React.useState<{ open: boolean; mode: BedMoveMode; target: BedMoveTarget | null }>({
    open: false,
    mode: 'move',
    target: null,
  });

  // 操作メニューから起動する退院手続き／退院指示ダイアログ。
  // ※ 隔離指示・拘束指示など他の指示系（ep-05 隔離拘束指示）は将来このセクションに追加する想定。
  const [dischargeConfirmOrder, setDischargeConfirmOrder] = React.useState<AdmissionOrder | null>(null);
  const [dischargeOrderPatient, setDischargeOrderPatient] = React.useState<Patient | null>(null);
  // ===== ep-08 隔離拘束歴 =====
  const [isolationHistoryPatientId, setIsolationHistoryPatientId] = React.useState<string | null>(null);

  const rooms = ROOMS.filter((r) => r.wardId === ward);

  // 病棟マップ表示順（カルテ画面の隣接ナビ用）
  const wardOrderedPatientIds = React.useMemo(
    () => rooms.flatMap((r) => r.beds.filter((b) => b.patientId).map((b) => b.patientId as string)),
    [rooms],
  );

  const selectedBedPatient: Patient | null = React.useMemo(() => {
    if (!bedMenuPatientId) return null;
    return PATIENTS.find((p) => p.id === bedMenuPatientId) ?? null;
  }, [bedMenuPatientId]);

  const navigateToKarte = React.useCallback((patientId: string) => {
    const patient = PATIENTS.find((p) => p.id === patientId);
    if (!patient) return;
    setSelectedPatient(patient);
    setWardMapNavigation(wardOrderedPatientIds);
    if (patient.primaryRecordType === 'nursing-record') {
      // 部門記録簿（看護記録）画面へ
      navigate('/nursing');
    } else {
      navigate(`/karte/${patientId}`, {
        state: { from: 'ward-map' } satisfies KartePageLocationState,
      });
    }
  }, [navigate, setSelectedPatient, setWardMapNavigation, wardOrderedPatientIds]);

  const handleBedClick = (bed: Bed) => {
    if (bed.disabled) return;
    if (!bed.patientId) return;
    setBedMenuPatientId(bed.patientId);
  };

  const handleAssign = (u: UnassignedPatient) => {
    setUnassignedOpen(false);
    setMoveDialog({
      open: true,
      mode: 'assign',
      target: { unassigned: u },
    });
  };

  const handleMove = (patient: Patient) => {
    setMoveDialog({
      open: true,
      mode: 'move',
      target: {
        patient,
        currentWard: patient.wardId,
        currentRoom: patient.roomNumber,
        currentBed: patient.bedLabel,
      },
    });
  };

  const closeMoveDialog = () => setMoveDialog((s) => ({ ...s, open: false }));

  const handleMoveSubmit = (params: BedMoveSubmitParams) => {
    // 移動日時が未来の場合は scheduledMoves に登録 → ベッド表示の「移動予定」アイコン動的計算に使う
    if (params.mode === 'move' && new Date(params.moveAt) > new Date()) {
      const t = moveDialog.target;
      addScheduledMove({
        id: `SM-${Date.now()}`,
        patientId: params.patientId,
        scheduledAt: params.moveAt,
        fromWardId: t?.currentWard ?? params.toWard,
        fromRoom: t?.currentRoom ?? '',
        fromBed: t?.currentBed ?? '',
        toWardId: params.toWard,
        toRoom: params.toRoom,
        toBed: params.toBed,
      });
    }
    showSnackbar(
      moveDialog.mode === 'assign' ? '割当を登録しました（モック）' : '移動を登録しました（モック）',
      'success',
    );
    closeMoveDialog();
  };

  /** 患者ID から「移動予定」かどうかを判定。scheduledMoves と未確定 pending orders を見て、
   *  現在時刻より未来の予定が 1 件でもあればアイコン表示。 */
  const hasScheduledMoveFor = React.useCallback((patientId: string) => {
    const now = new Date();
    return scheduledMoves.some((m) => m.patientId === patientId && new Date(m.scheduledAt) > now);
  }, [scheduledMoves]);

  /** 退院手続きダイアログを起動。対象患者の退院指示（ADMISSION_ORDERS + pendingOrders、未確定）を引き当てる。 */
  const handleOpenDischargeConfirm = (patient: Patient) => {
    const candidates: AdmissionOrder[] = [
      ...ADMISSION_ORDERS,
      ...pendingOrders.map((p): AdmissionOrder => ({
        id: p.id,
        patientId: p.patientId,
        patientName: p.patientName,
        type: p.type,
        status: '指示済',
        scheduledDate: p.scheduledDate,
        doctorName: p.doctorName,
        roomNumber: p.roomNumber,
        bedLabel: p.bedLabel,
        wardId: p.wardId,
      })),
    ];
    const order = candidates.find(
      (o) => o.patientId === patient.id && o.type === '退院' && !confirmedAdmissionIds.includes(o.id),
    );
    if (!order) {
      showSnackbar('退院指示が登録されていません。先に主治医による退院指示が必要です。', 'warning');
      return;
    }
    setDischargeConfirmOrder(order);
  };

  /** 退院指示ダイアログを起動 */
  const handleOpenDischargeOrder = (patient: Patient) => {
    setDischargeOrderPatient(patient);
  };

  return (
    <Box sx={{ pb: selectedBedPatient ? 14 : 0 }}>
      {/* ヘッダー: 病棟タブ + 関連機能エントリ群 */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Tabs value={ward} onChange={(_, v) => setWard(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`${WARD_LABELS.ward1}マップ`} value="ward1" />
          <Tab label={`${WARD_LABELS.ward2}マップ`} value="ward2" />
        </Tabs>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
          <Button size="small" variant="outlined" startIcon={<EventAvailable />} onClick={() => setActiveFeature('vacancy')}>
            空床照会
          </Button>
          <Button size="small" variant="outlined" startIcon={<PeopleAltOutlined />} onClick={() => setUnassignedOpen(true)}>
            未割当者
          </Button>
          <Button size="small" variant="outlined" startIcon={<BedOutlined />} onClick={() => setActiveFeature('admission-schedule')}>
            入退院予定
          </Button>
          <Button size="small" variant="outlined" startIcon={<FlightTakeoff />} onClick={() => setActiveFeature('absent')}>
            不在者
          </Button>
          <Button size="small" variant="outlined" startIcon={<InfoOutlined />} onClick={() => setActiveFeature('admission-info')}>
            入退院情報
          </Button>
          {selectedRooms.size > 0 && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              <Typography variant="body2" color="text.secondary">選択中: {selectedRooms.size}室</Typography>
              <Button variant="contained" size="small" endIcon={<ArrowForward />} onClick={() => navigate('/nursing/bulk-vitals')}>
                一括バイタル入力へ
              </Button>
              <Button size="small" startIcon={<Clear />} onClick={clearSelectedRooms}>解除</Button>
            </>
          )}
        </Stack>
      </Stack>

      {/* メイン: 病室カードグリッド */}
      <Grid container spacing={1.5}>
        {rooms.map((room) => {
          const isSelected = selectedRooms.has(room.roomNumber);
          return (
            <Grid item xs={12} sm={6} md={3} key={room.roomNumber}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: isSelected ? '2px solid' : '1px solid',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  bgcolor: isSelected ? 'primary.main' + '08' : 'background.paper',
                  boxShadow: isSelected ? '0 0 0 3px rgba(30,64,175,0.12)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                <Box sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  px: 1.5, py: 1, bgcolor: isSelected ? 'primary.main' + '12' : '#f8fafc',
                  borderBottom: '1px solid', borderColor: 'divider',
                }}>
                  <Typography variant="subtitle2" fontWeight={700}>{room.roomNumber}号室</Typography>
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleRoom(room.roomNumber)}
                    size="small"
                    sx={{ p: 0 }}
                  />
                </Box>
                <CardContent sx={{ p: 0, '&:last-child': { pb: 0 }, flex: 1 }}>
                  {room.beds.map((bed) => {
                    const isMenuActive = bed.patientId === bedMenuPatientId;
                    return (
                      <Box
                        key={bed.bed}
                        onClick={() => handleBedClick(bed)}
                        onDoubleClick={() => {
                          if (bed.disabled || !bed.patientId) return;
                          navigateToKarte(bed.patientId);
                        }}
                        sx={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          px: 1.5, py: 1, minHeight: 56, borderBottom: '1px solid #f1f5f9',
                          cursor: bed.disabled ? 'not-allowed' : (bed.patientId ? 'pointer' : 'default'),
                          position: 'relative',
                          bgcolor: bed.disabled
                            ? 'transparent'
                            : (isMenuActive ? '#eff6ff' : 'transparent'),
                          '&:hover': bed.disabled
                            ? {}
                            : (bed.patientId ? { bgcolor: '#f0f7ff' } : {}),
                          // 使用不可ベッドのグレー網掛け
                          backgroundImage: bed.disabled
                            ? 'repeating-linear-gradient(45deg, #e2e8f0 0 6px, #f1f5f9 6px 12px)'
                            : undefined,
                          color: bed.disabled ? 'text.disabled' : undefined,
                        }}
                      >
                        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{
                            width: 28, height: 28, borderRadius: 1,
                            bgcolor: bed.disabled
                              ? '#cbd5e1'
                              : (bed.patientId ? (bed.gender === 'M' ? '#dbeafe' : '#fce7f3') : '#f1f5f9'),
                            color: bed.disabled
                              ? '#fff'
                              : (bed.patientId ? (bed.gender === 'M' ? 'primary.main' : '#be185d') : 'text.disabled'),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 700,
                          }}>
                            {bed.bed}
                          </Box>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={bed.patientId ? 600 : 400} color={bed.disabled ? 'text.disabled' : (bed.patientId ? 'text.primary' : 'text.disabled')} noWrap>
                                {bed.disabled ? '使用不可' : (bed.patientName || '空床')}
                              </Typography>
                              {bed.patientId && (
                                <IconButton
                                  size="small"
                                  sx={{ p: 0.25 }}
                                  onClick={(e) => { e.stopPropagation(); navigateToKarte(bed.patientId as string); }}
                                  aria-label="カルテへ遷移"
                                >
                                  <ArticleIcon sx={{ fontSize: 14 }} color="primary" />
                                </IconButton>
                              )}
                            </Stack>
                            {bed.patientId && (
                              <Typography variant="caption" color="text.secondary">{bed.patientId}</Typography>
                            )}
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {bed.patientId && (hasScheduledMoveFor(bed.patientId) || bed.hasScheduledMove) && (
                            <Chip icon={<MoveDownIcon sx={{ fontSize: 12 }} />} label="移動予定" size="small" sx={{ height: 18, fontSize: '0.625rem', bgcolor: '#ecfeff', color: '#0e7490' }} />
                          )}
                          <BedFlagIcons flags={bed.flags} />
                          {!bed.disabled && <StatusBadge status={bed.status} />}
                        </Stack>
                      </Box>
                    );
                  })}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* 凡例: ステータス + 運用フラグ */}
      <Stack spacing={0.75} sx={{ mt: 2 }}>
        <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <Stack key={key} direction="row" spacing={0.5} alignItems="center">
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cfg.color }} />
              <Typography variant="caption" color="text.secondary">{cfg.label}</Typography>
            </Stack>
          ))}
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Box sx={{
              width: 16, height: 8, borderRadius: 0.5,
              backgroundImage: 'repeating-linear-gradient(45deg, #e2e8f0 0 4px, #f1f5f9 4px 8px)',
            }} />
            <Typography variant="caption" color="text.secondary">使用不可</Typography>
          </Stack>
        </Stack>
        <BedFlagLegend />
      </Stack>

      {/* フッター: 患者操作メニュー（選択時のみ） */}
      {selectedBedPatient && (
        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1100,
            borderTop: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 0,
          }}
        >
          <Box sx={{ maxWidth: 1280, mx: 'auto', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {selectedBedPatient.name}
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  ({selectedBedPatient.age}歳{selectedBedPatient.gender === 'M' ? '男性' : '女性'}) / {selectedBedPatient.roomNumber}号室 {selectedBedPatient.bedLabel} / 主治医 {selectedBedPatient.doctorName}
                </Typography>
              </Typography>
              {selectedBedPatient.diagnosis && (
                <Typography variant="caption" color="text.secondary">{selectedBedPatient.diagnosis}</Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="contained" size="small" startIcon={<OpenInFullIcon />} onClick={() => navigateToKarte(selectedBedPatient.id)}>
                カルテ
              </Button>
              <Button variant="outlined" size="small" startIcon={<MoveDownIcon />} onClick={() => handleMove(selectedBedPatient)}>
                移動
              </Button>
              {/* ep-02 入退院手続き: 退院指示済の入院患者向け */}
              {(selectedBedPatient.admissionState ?? 'inpatient') === 'inpatient' && (
                <Button variant="outlined" size="small" startIcon={<AssignmentReturnedOutlined />} onClick={() => handleOpenDischargeConfirm(selectedBedPatient)}>
                  退院手続き
                </Button>
              )}
              {/* ep-03 入退院指示: 主治医発行（入院患者のみ表示） */}
              {(selectedBedPatient.admissionState ?? 'inpatient') === 'inpatient' && (
                <Button variant="outlined" size="small" startIcon={<LogoutOutlined />} onClick={() => handleOpenDischargeOrder(selectedBedPatient)}>
                  退院指示
                </Button>
              )}
              {/* === 将来追加位置 ===
                  ep-05 隔離拘束指示: 隔離指示／拘束指示ボタンをここに追加する。
                  条件: 入院患者かつ既に隔離拘束指示が出ていない場合などをここで判定。 */}
              {/* ===== ep-08 隔離拘束歴 ===== */}
              <Button
                variant="outlined"
                size="small"
                startIcon={<LockIcon />}
                onClick={() => setIsolationHistoryPatientId(selectedBedPatient.id)}
              >
                隔離歴
              </Button>
              <IconButton size="small" onClick={() => setBedMenuPatientId(null)}><CloseIcon /></IconButton>
            </Stack>
          </Box>
        </Paper>
      )}

      {/* 関連機能ダイアログ */}
      <RelatedFeatureDialogs
        open={!!activeFeature}
        feature={activeFeature}
        ward={ward}
        onClose={() => setActiveFeature(null)}
      />

      {/* 未割当者一覧 */}
      <UnassignedPatientsPanel
        open={unassignedOpen}
        onClose={() => setUnassignedOpen(false)}
        onAssign={handleAssign}
      />

      {/* 転棟・転室ダイアログ */}
      <BedMoveDialog
        open={moveDialog.open}
        mode={moveDialog.mode}
        target={moveDialog.target}
        onClose={closeMoveDialog}
        onSubmit={handleMoveSubmit}
      />

      {/* 退院手続きダイアログ（操作メニュー起動） */}
      <DischargeConfirmDialog
        open={!!dischargeConfirmOrder}
        order={dischargeConfirmOrder}
        onClose={() => setDischargeConfirmOrder(null)}
        onConfirmed={() => setDischargeConfirmOrder(null)}
      />

      {/* 退院指示ダイアログ（操作メニュー起動） */}
      <DischargeOrderDialog
        open={!!dischargeOrderPatient}
        patient={dischargeOrderPatient}
        onClose={() => setDischargeOrderPatient(null)}
      />

      {/* ===== ep-08 隔離拘束歴 ===== */}
      <IsolationHistoryDialog
        open={!!isolationHistoryPatientId}
        patientId={isolationHistoryPatientId}
        onClose={() => setIsolationHistoryPatientId(null)}
      />
    </Box>
  );
};

export default WardMap;

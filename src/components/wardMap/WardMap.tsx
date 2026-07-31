import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Checkbox, Button, Chip,
  Grid, Stack, Tabs, Tab, Paper, IconButton,
} from '@mui/material';
import {
  ArrowForward, Clear, EventAvailable,
  Close as CloseIcon, MoveDown as MoveDownIcon,
  ArticleOutlined as ArticleIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import type { AdmissionOrder, Bed, Patient, WardId } from '../../types';
import type { KartePageLocationState } from '../karte/KartePage';
import { ROOMS, STATUS_CONFIG, PATIENTS, ADMISSION_ORDERS, patientNumberOf, MOVE_HISTORY_SAMPLES, applyDueMoves, applyCancelledMoves } from '../../data/mockData';
import { WARD_LABELS } from '../../types';
import StatusBadge from '../common/StatusBadge';
import { useAppStore } from '../../stores/useAppStore';
import BedFlagIcons, { BedFlagLegend } from './BedFlagIcons';
import RelatedFeatureDialogs from './RelatedFeatureDialogs';
import type { RelatedFeatureKey } from './RelatedFeatureDialogs';
import WardMapSidebar from './WardMapSidebar';
import BedMoveDialog, { BedMoveMode, BedMoveTarget, BedMoveSubmitParams } from './BedMoveDialog';
import DischargeConfirmDialog from '../admission/DischargeConfirmDialog';
import DischargeOrderDialog from '../admission/DischargeOrderDialog';
import AdmissionConfirmDialog from '../admission/AdmissionConfirmDialog';
import AdmissionOrderDialog from '../admission/AdmissionOrderDialog';
import IsolationHistoryDialog from '../isolation/IsolationHistoryDialog';

const WardMap: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedRooms, toggleRoom, clearSelectedRooms,
    setSelectedPatient, bedMenuPatientId, setBedMenuPatientId,
    setWardMapNavigation, showSnackbar,
    scheduledMoves, addScheduledMove,
    cancelledMoveIds, cancelMove, moveEdits, updateMove,
    pendingOrders, confirmedAdmissionIds,
    sidebarOpen,
  } = useAppStore();
  const sidebarWidth = sidebarOpen ? 220 : 60;
  const [ward, setWard] = React.useState<WardId>('ward1');
  // 「時刻経過で反映」を満たすため、一定間隔で現在時刻を更新して displayedRooms／移動予定アイコンを再計算させる。
  //   （useMemo 内で new Date() を作るだけだと、他の再レンダーが起きるまで未来→現在の切替が反映されない）
  const [now, setNow] = React.useState<Date>(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const [activeFeature, setActiveFeature] = React.useState<RelatedFeatureKey | null>(null);
  const [moveDialog, setMoveDialog] = React.useState<{ open: boolean; mode: BedMoveMode; target: BedMoveTarget | null }>({
    open: false,
    mode: 'move',
    target: null,
  });

  // 操作メニューから起動する退院手続き／退院指示ダイアログ。
  // ※ 隔離指示・拘束指示など他の指示系（ep-05 隔離拘束指示）は将来このセクションに追加する想定。
  const [dischargeConfirmOrder, setDischargeConfirmOrder] = React.useState<AdmissionOrder | null>(null);
  const [dischargeOrderPatient, setDischargeOrderPatient] = React.useState<Patient | null>(null);
  // 右サイドバーから直接起動する入院系ダイアログ
  const [admissionConfirmOrder, setAdmissionConfirmOrder] = React.useState<AdmissionOrder | null>(null);
  const [admissionOrderPatient, setAdmissionOrderPatient] = React.useState<Patient | null>(null);
  // ===== ep-08 隔離拘束歴 =====
  const [isolationHistoryPatientId, setIsolationHistoryPatientId] = React.useState<string | null>(null);

  // 全移動（seed＋登録分）に更新差分（moveEdits）を適用したもの
  const allMoves = React.useMemo(
    () => [...MOVE_HISTORY_SAMPLES, ...scheduledMoves].map((m) => (moveEdits[m.id] ? { ...m, ...moveEdits[m.id] } : m)),
    [scheduledMoves, moveEdits],
  );
  // ベッド配置に「登録済み移動（実施日時が現在以下）」を反映（applyDueMoves）→ さらに「取消」を反映（applyCancelledMoves）。
  //   過去・現在の移動は即時ベッド反映、未来の移動は移動予定アイコンのみ（時刻経過で反映）。いずれもモックのためリロードで元に戻る。
  const displayedRooms = React.useMemo(() => {
    const afterDue = applyDueMoves(ROOMS, allMoves, cancelledMoveIds, now);
    return applyCancelledMoves(afterDue, allMoves, cancelledMoveIds, now);
  }, [allMoves, cancelledMoveIds, now]);
  const rooms = displayedRooms.filter((r) => r.wardId === ward);

  /** 患者の現在位置を病棟マップの現況（displayedRooms＝反映後）から引く。見つからなければ null。 */
  const findCurrentLocation = React.useCallback((patientId: string): { wardId: WardId; room: string; bed: string } | null => {
    for (const r of displayedRooms) {
      const b = r.beds.find((bd) => bd.patientId === patientId);
      if (b) return { wardId: r.wardId, room: r.roomNumber, bed: b.bed };
    }
    return null;
  }, [displayedRooms]);

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
    // PM 指示（2026-05-08）: 病棟マップ → カルテ遷移は患者種別問わず新カルテに統一
    // （旧: primaryRecordType='nursing-record' のみ /nursing へ分岐していた）
    navigate(`/karte/${patientId}`, {
      state: { from: 'ward-map' } satisfies KartePageLocationState,
    });
  }, [navigate, setSelectedPatient, setWardMapNavigation, wardOrderedPatientIds]);

  const handleBedClick = (bed: Bed) => {
    if (bed.disabled) return;
    if (!bed.patientId) return;
    setBedMenuPatientId(bed.patientId);
  };

  const handleMove = (patient: Patient) => {
    // 現在位置は静的な PATIENTS ではなく現況（displayedRooms）から引く（登録済み移動の反映後に追従）。
    const cur = findCurrentLocation(patient.id);
    setMoveDialog({
      open: true,
      mode: 'move',
      target: {
        patient,
        currentWard: cur?.wardId ?? patient.wardId,
        currentRoom: cur?.room ?? patient.roomNumber,
        currentBed: cur?.bed ?? patient.bedLabel,
      },
    });
  };

  const closeMoveDialog = () => setMoveDialog((s) => ({ ...s, open: false }));

  const handleMoveSubmit = (params: BedMoveSubmitParams) => {
    // 移動（転棟・転室）は即時／未来を問わず scheduledMoves に登録する。
    //   過去・現在の移動 → applyDueMoves で即ベッド反映／未来の移動 → 移動予定アイコン表示（時刻経過で反映）。
    //   いずれもモックのためセッション限定（リロードで元に戻る）。
    if (params.mode === 'move') {
      const t = moveDialog.target;
      // 移動元は「登録時点の現況（displayedRooms）」から引き直す。
      //   静的な PATIENTS 現在位置（target）だと、連続移動・取消で在床表示が動いた後に
      //   履歴の移動元／取消の戻し先が実際の在床とズレるため。見つからなければ target をフォールバック。
      const cur = findCurrentLocation(params.patientId);
      addScheduledMove({
        id: `SM-${Date.now()}`,
        patientId: params.patientId,
        scheduledAt: params.moveAt,
        fromWardId: cur?.wardId ?? t?.currentWard ?? params.toWard,
        fromRoom: cur?.room ?? t?.currentRoom ?? '',
        fromBed: cur?.bed ?? t?.currentBed ?? '',
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
    // seed（MOVE_HISTORY_SAMPLES）＋登録分に更新差分（moveEdits）を適用した allMoves で判定。
    // 履歴欄の「未（予定）」表示とアイコンのデータソースを一致させる。now は定期更新され時刻経過で切り替わる。
    return allMoves.some((m) =>
      m.patientId === patientId && !cancelledMoveIds.includes(m.id) && new Date(m.scheduledAt) > now);
  }, [allMoves, cancelledMoveIds, now]);

  // 転棟・転室ダイアログの履歴欄用: 対象患者の移動（seed＋登録分・更新差分適用済み）。
  const movesForDialog = React.useMemo(() => {
    const pid = moveDialog.target?.patient?.id;
    if (!pid) return [];
    return allMoves.filter((m) => m.patientId === pid);
  }, [moveDialog.target, allMoves]);

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
        karteRecordId: p.karteRecordId,
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
    <Box sx={{ pb: selectedBedPatient ? 8 : 0 }}>
      {/* ヘッダー: 病棟タブ */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
        <Tabs value={ward} onChange={(_, v) => setWard(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label={`${WARD_LABELS.ward1}マップ`} value="ward1" />
          <Tab label={`${WARD_LABELS.ward2}マップ`} value="ward2" />
        </Tabs>
      </Stack>

      {/* アクションバー: 空床照会 + 一括入力 */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Button
          size="small"
          variant="contained"
          color="primary"
          startIcon={<EventAvailable />}
          onClick={() => setActiveFeature('vacancy')}
        >
          空床照会
        </Button>
        <Button
          size="small"
          variant="outlined"
          disabled={selectedRooms.size === 0}
          endIcon={<ArrowForward />}
          onClick={() => {
            // 選択中の病棟・病室を一括バイタル入力へ引き継ぐ
            navigate('/nursing/bulk-vitals', {
              state: { wardId: ward, rooms: [...selectedRooms].sort() },
            });
            clearSelectedRooms();
          }}
        >
          一括入力へ
        </Button>
        {selectedRooms.size > 0 && (
          <Button size="small" startIcon={<Clear />} onClick={clearSelectedRooms}>
            解除
          </Button>
        )}
        {selectedRooms.size > 0 && (
          <Typography variant="caption" color="text.secondary">
            選択中: {selectedRooms.size}室
          </Typography>
        )}
      </Stack>

      {/* メイン: 病室カードグリッド + 右サイドバー */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
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
                              <Typography variant="caption" color="text.secondary">{patientNumberOf(bed.patientId)}</Typography>
                            )}
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {bed.patientId && hasScheduledMoveFor(bed.patientId) && (
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
        </Box>
        {/* 右サイドバー: 入院予定者 / 不在者 / 入院者情報（いずれも選択中病棟スコープ） */}
        <Box sx={{ width: 220, flexShrink: 0 }}>
          <WardMapSidebar
            ward={ward}
            onOpenAdmissionProcedure={(orderId) => {
              // 入院予定者[手続き] → 入院手続きダイアログ（病室確定済の行のみ表示される）。
              // master(ADMISSION_ORDERS) を優先し、無ければ当該セッション登録分(pendingOrders)から合成。
              const master = ADMISSION_ORDERS.find((x) => x.id === orderId);
              const pending = pendingOrders.find((x) => x.id === orderId);
              const order: AdmissionOrder | null = master ?? (pending
                ? {
                    id: pending.id,
                    patientId: pending.patientId,
                    patientName: pending.patientName,
                    type: '入院',
                    status: '指示済',
                    scheduledDate: pending.scheduledDate,
                    doctorName: pending.doctorName,
                    roomNumber: pending.roomNumber,
                    bedLabel: pending.bedLabel,
                    wardId: pending.wardId,
                    karteRecordId: pending.karteRecordId,
                  }
                : null);
              if (order) setAdmissionConfirmOrder(order);
            }}
            onOpenAdmissionSchedule={(orderId) => {
              // 入院予定[詳細] → 入院指示ダイアログ
              const o = ADMISSION_ORDERS.find((x) => x.id === orderId);
              if (!o) return;
              // PATIENTS にあればそれを、無ければ order 情報から合成
              const found = PATIENTS.find((p) => p.id === o.patientId);
              const p: Patient = found ?? {
                id: o.patientId,
                name: o.patientName,
                age: 0,
                gender: 'M',
                wardId: o.wardId,
                roomNumber: o.roomNumber === '—' ? '' : o.roomNumber,
                bedLabel: o.bedLabel === '—' ? '' : o.bedLabel,
                status: 'stable',
                admitDate: o.scheduledDate,
                doctorName: o.doctorName,
                admissionState: 'outpatient',
              };
              setAdmissionOrderPatient(p);
            }}
            onOpenAbsent={() => navigate('/outing')}
          />
        </Box>
      </Box>

      {/* フッター: 患者操作メニュー（選択時のみ）— スクショ準拠の細長メニューバー */}
      {selectedBedPatient && (
        <Paper
          elevation={4}
          sx={{
            position: 'fixed',
            left: sidebarWidth,
            right: 0,
            bottom: 0,
            // MUI の drawer(1200) より下、appBar(1100) と同等。サイドバーは常に上に出る
            zIndex: (theme) => theme.zIndex.drawer - 1,
            borderTop: '1px solid',
            borderColor: 'divider',
            borderRadius: 0,
            bgcolor: 'background.paper',
            transition: 'left 0.2s ease',
          }}
        >
          <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1.5, overflowX: 'auto' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', whiteSpace: 'nowrap' }}>
              メニュー:
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
              {selectedBedPatient.patientNumber ?? selectedBedPatient.id} {selectedBedPatient.name} [{selectedBedPatient.roomNumber}号室]-[{selectedBedPatient.bedLabel}]
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ ml: 1, flex: 1, flexWrap: 'nowrap' }}>
              {([
                { label: '移動', onClick: () => handleMove(selectedBedPatient), icon: <MoveDownIcon sx={{ fontSize: 14 }} /> },
                { label: '隔離歴', onClick: () => setIsolationHistoryPatientId(selectedBedPatient.id), icon: <LockIcon sx={{ fontSize: 14 }} /> },
                { label: 'フローシート', onClick: () => navigate(`/karte/${selectedBedPatient.id}#flowsheet`) },
                { label: '患者情報', onClick: () => navigate(`/karte/${selectedBedPatient.id}#patient-info`) },
                { label: '食事', onClick: () => showSnackbar('食事画面は未実装(モック)', 'info') },
                { label: '外出外泊', onClick: () => navigate('/outing') },
                { label: '行動制限', onClick: () => navigate('/behavior') },
                { label: '予定表', onClick: () => navigate('/schedule'), disabled: true },
                { label: 'カルテ', onClick: () => navigateToKarte(selectedBedPatient.id) },
                { label: '部門記録簿', onClick: () => navigate('/nursing/records') },
                { label: '文書', onClick: () => navigate('/documents') },
                { label: '看護ケア', onClick: () => navigate('/nursing-care'), disabled: true },
                { label: '看護過程', onClick: () => navigate(`/care-plan/patients/${selectedBedPatient.id}`) },
              ] as const).map((btn) => (
                <Button
                  key={btn.label}
                  variant="text"
                  onClick={btn.onClick}
                  disabled={'disabled' in btn ? btn.disabled : false}
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    minWidth: 0,
                    px: 1,
                    py: 0.5,
                    color: 'text.primary',
                    whiteSpace: 'nowrap',
                    '&:hover': { bgcolor: '#f1f5f9' },
                    '&.Mui-disabled': { color: 'text.disabled' },
                  }}
                >
                  [{btn.label}]
                </Button>
              ))}
            </Stack>
            <IconButton size="small" onClick={() => setBedMenuPatientId(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
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

      {/* 転棟・転室ダイアログ */}
      <BedMoveDialog
        open={moveDialog.open}
        mode={moveDialog.mode}
        target={moveDialog.target}
        rooms={displayedRooms}
        moves={movesForDialog}
        cancelledMoveIds={cancelledMoveIds}
        onCancelMove={(id) => { cancelMove(id); showSnackbar('移動を取消しました（履歴に取消として残ります）', 'info'); }}
        onUpdateMove={(id, patch) => { updateMove(id, patch); showSnackbar('移動を更新しました', 'info'); }}
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

      {/* 右サイドバー 入院予定者[手続き] → 入院手続きダイアログ（病室確定済のみ） */}
      <AdmissionConfirmDialog
        open={!!admissionConfirmOrder}
        order={admissionConfirmOrder}
        onClose={() => setAdmissionConfirmOrder(null)}
        onConfirmed={() => setAdmissionConfirmOrder(null)}
        onOpenVacancy={() => setActiveFeature('vacancy')}
      />

      {/* 右サイドバー 入院予定者[詳細] → 入院指示ダイアログ */}
      <AdmissionOrderDialog
        open={!!admissionOrderPatient}
        patient={admissionOrderPatient}
        onClose={() => setAdmissionOrderPatient(null)}
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

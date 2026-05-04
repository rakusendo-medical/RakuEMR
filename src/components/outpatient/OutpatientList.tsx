import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, Tabs, Tab, Stack, Button, Divider, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  Radio,
} from '@mui/material';
import {
  Description as DescriptionIcon,
  Receipt as ReceiptIcon,
  FolderOpen as FolderOpenIcon,
  NotificationsOutlined as NotificationsIcon,
  EventOutlined as EventIcon,
  CloudUploadOutlined as CloudUploadIcon,
  PaymentsOutlined as PaymentsIcon,
  RemoveCircleOutline as RemoveCircleIcon,
  PendingOutlined as PendingIcon,
  AccessTimeOutlined as AccessTimeIcon,
  HourglassBottomOutlined as HourglassIcon,
  CheckCircleOutline as CheckCircleIcon,
} from '@mui/icons-material';
import type { OutpatientStatus, OutpatientVisit } from '../../types';
import { OUTPATIENT_VISITS } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';

type FilterStatus = OutpatientStatus | 'all';

/**
 * 外来一覧画面（v1.1 デザインルール準拠）
 *
 * ルール参照: docs/design-rules.md
 * - §1.3 セクション構造、§2.3 タブ、§3.2 ボタン配置（MUI 標準）
 * - §6 テーブル（ヘッダー固定・空状態・選択ハイライト）、§7.1 ステータス Chip
 * - §9.1.1 トースト右上、§10 破壊的操作（confirm dialog）、§12.5 色覚配慮（アイコン併用）
 *
 * 仕様参照: docs/gairai/features/patient.html § 外来一覧
 * - 患者選択時にアクションバーを活性化
 * - メイン / オーダー / 文書登録 / 通知 / 予約 / ORCA送信 のアクション
 * - 状態依存: 会計完了 / チェックイン取消
 */

/** ステータス Chip 設定（色 + アイコンで色覚配慮） */
const STATUS_CONFIG: Record<OutpatientStatus, {
  label: string;
  color: 'default' | 'info' | 'warning' | 'success' | 'secondary';
  icon: React.ReactElement;
}> = {
  '待機中':   { label: '待機中',   color: 'info',      icon: <AccessTimeIcon sx={{ fontSize: 16 }} /> },
  '診察中':   { label: '診察中',   color: 'warning',   icon: <PendingIcon sx={{ fontSize: 16 }} /> },
  '会計待ち': { label: '会計待ち', color: 'secondary', icon: <HourglassIcon sx={{ fontSize: 16 }} /> },
  '完了':     { label: '完了',     color: 'success',   icon: <CheckCircleIcon sx={{ fontSize: 16 }} /> },
};

const FILTER_TABS: { value: FilterStatus; label: string }[] = [
  { value: 'all',     label: 'すべて' },
  { value: '待機中',   label: '待機中' },
  { value: '診察中',   label: '診察中' },
  { value: '会計待ち', label: '会計待ち' },
  { value: '完了',     label: '完了' },
];

const OutpatientList: React.FC = () => {
  const navigate = useNavigate();
  const setSelectedPatient = useAppStore((s) => s.setSelectedPatient);
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  const [filter, setFilter] = useState<FilterStatus>('all');
  /** 選択中の受付 ID（行選択 = アクションバー活性化のトリガー） */
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  /** チェックイン取消の確認ダイアログ */
  const [cancelConfirm, setCancelConfirm] = useState<{ open: boolean; visit: OutpatientVisit | null }>({
    open: false,
    visit: null,
  });

  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });

  const filtered = useMemo(
    () => filter === 'all' ? OUTPATIENT_VISITS : OUTPATIENT_VISITS.filter((v) => v.status === filter),
    [filter],
  );

  const counts = useMemo(() => ({
    '待機中':   OUTPATIENT_VISITS.filter((v) => v.status === '待機中').length,
    '診察中':   OUTPATIENT_VISITS.filter((v) => v.status === '診察中').length,
    '会計待ち': OUTPATIENT_VISITS.filter((v) => v.status === '会計待ち').length,
    '完了':     OUTPATIENT_VISITS.filter((v) => v.status === '完了').length,
  }), []);

  const selectedVisit = useMemo(
    () => OUTPATIENT_VISITS.find((v) => v.id === selectedVisitId) ?? null,
    [selectedVisitId],
  );

  /** ナビゲート関数（カルテ／オーダー／文書） */
  const navigateTo = (path: string) => {
    if (!selectedVisit) return;
    setSelectedPatient({
      id: selectedVisit.patientId,
      name: selectedVisit.patientName,
      age: selectedVisit.age,
      gender: selectedVisit.gender,
      wardId: 'ward1' as any,
      roomNumber: '',
      bedLabel: '',
      status: 'stable' as any,
      admitDate: '',
      doctorName: selectedVisit.doctorName,
      diagnosis: '',
    } as any);
    navigate(path);
  };

  const handleOpenDashboard = () => navigateTo(`/karte-outpatient/${selectedVisit!.patientId}`);
  const handleOpenOrders = () => navigateTo(`/orders`); // 暫定: 既存オーダー管理へ
  const handleOpenDocuments = () => {
    showSnackbar(`文書登録画面は別エピックで実装予定（${selectedVisit!.patientName}）`, 'info');
  };
  const handleNotify = () => {
    showSnackbar(`通知ダイアログは別エピックで実装予定（${selectedVisit!.patientName}）`, 'info');
  };
  const handleAppointment = () => {
    showSnackbar(`予約登録ダイアログは別エピックで実装予定（${selectedVisit!.patientName}）`, 'info');
  };
  const handleOrcaSend = () => {
    showSnackbar(`ORCA へオーダーをエクスポートしました（モック・${selectedVisit!.patientName}）`, 'success');
  };
  const handleCheckoutComplete = () => {
    showSnackbar(`会計を完了しました（モック・${selectedVisit!.patientName}）`, 'success');
  };
  const handleCancelCheckin = () => {
    setCancelConfirm({ open: true, visit: selectedVisit });
  };
  const confirmCancelCheckin = () => {
    if (cancelConfirm.visit) {
      showSnackbar(`チェックインを取り消しました（モック・${cancelConfirm.visit.patientName}）`, 'warning');
      setSelectedVisitId(null);
    }
    setCancelConfirm({ open: false, visit: null });
  };

  return (
    <Container maxWidth="xl" disableGutters>
      {/* §1.3 セクション構造: ヘッダー（タイトル + 日付 + 件数サマリ） */}
      <Stack direction="row" alignItems="baseline" spacing={2} sx={{ mb: 1.5, flexWrap: 'wrap', rowGap: 0.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>外来一覧</Typography>
        <Typography variant="body2" color="text.secondary">{today}</Typography>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={0.75}>
          {(Object.entries(counts) as [OutpatientStatus, number][]).map(([status, count]) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <Chip
                key={status}
                size="small"
                color={cfg.color}
                variant="outlined"
                icon={cfg.icon}
                label={`${status} ${count}名`}
              />
            );
          })}
        </Stack>
      </Stack>

      {/* §2.3 フィルタタブ（borderBottom 付き） */}
      <Tabs
        value={filter}
        onChange={(_, v) => setFilter(v)}
        sx={{ mb: 1.5, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {FILTER_TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.value === 'all'
              ? `すべて (${OUTPATIENT_VISITS.length})`
              : `${tab.label} (${counts[tab.value as OutpatientStatus] ?? 0})`}
            sx={{ fontSize: '0.8125rem', minHeight: 40 }}
          />
        ))}
      </Tabs>

      {/* §3.2 アクションバー（患者選択時に活性化、MUI 標準: Cancel 左 → Primary 右） */}
      <Paper variant="outlined" sx={{ p: 1, mb: 1.5, bgcolor: selectedVisit ? '#f0f7ff' : undefined }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
          <Box sx={{ minWidth: 0, flex: '0 1 auto' }}>
            {selectedVisit ? (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                選択中: {selectedVisit.patientName}
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  {selectedVisit.id} ／ {selectedVisit.age}歳{selectedVisit.gender === 'M' ? '男' : '女'} ／ {selectedVisit.department}
                </Typography>
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                患者行を選択してアクションを実行できます
              </Typography>
            )}
          </Box>
          <Box sx={{ flex: 1 }} />
          {/* 補助アクション群（outlined） */}
          <Tooltip title="カルテ画面を開く">
            <span>
              <Button
                size="small" variant="outlined" startIcon={<DescriptionIcon />}
                disabled={!selectedVisit} onClick={handleOpenDashboard}
              >
                カルテ
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="オーダー管理画面を開く">
            <span>
              <Button
                size="small" variant="outlined" startIcon={<ReceiptIcon />}
                disabled={!selectedVisit} onClick={handleOpenOrders}
              >
                オーダー
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="診療文書を登録">
            <span>
              <Button
                size="small" variant="outlined" startIcon={<FolderOpenIcon />}
                disabled={!selectedVisit} onClick={handleOpenDocuments}
              >
                文書登録
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="通知を送信">
            <span>
              <Button
                size="small" variant="outlined" startIcon={<NotificationsIcon />}
                disabled={!selectedVisit} onClick={handleNotify}
              >
                通知
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="予約を登録">
            <span>
              <Button
                size="small" variant="outlined" startIcon={<EventIcon />}
                disabled={!selectedVisit} onClick={handleAppointment}
              >
                予約
              </Button>
            </span>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />
          {/* ORCA: 連携系 outlined info */}
          <Button
            size="small" variant="outlined" color="info" startIcon={<CloudUploadIcon />}
            disabled={!selectedVisit} onClick={handleOrcaSend}
          >
            ORCA送信
          </Button>
          {/* §3.2 Primary 位置: 状態依存ボタン群 */}
          {selectedVisit && (selectedVisit.status === '待機中' || selectedVisit.status === '診察中') && (
            <Button
              size="small" variant="contained" color="success" startIcon={<PaymentsIcon />}
              onClick={handleCheckoutComplete}
            >
              会計完了
            </Button>
          )}
          {selectedVisit && selectedVisit.status === '待機中' && (
            <Button
              size="small" variant="outlined" color="warning" startIcon={<RemoveCircleIcon />}
              onClick={handleCancelCheckin}
            >
              チェックイン取消
            </Button>
          )}
        </Stack>
      </Paper>

      {/* §6 テーブル（行選択ハイライト + ダブルクリックでカルテ遷移） */}
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 'calc(100vh - 320px)' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 40 }}></TableCell>
              <TableCell>受付#</TableCell>
              <TableCell>患者氏名</TableCell>
              <TableCell>年齢</TableCell>
              <TableCell>性別</TableCell>
              <TableCell>区分</TableCell>
              <TableCell>診療科</TableCell>
              <TableCell>担当医</TableCell>
              <TableCell>予約</TableCell>
              <TableCell>受付</TableCell>
              <TableCell>状態</TableCell>
              <TableCell>備考</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    該当する外来患者はいません
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((v) => {
                const isSelected = v.id === selectedVisitId;
                const cfg = STATUS_CONFIG[v.status];
                return (
                  <TableRow
                    key={v.id}
                    hover
                    selected={isSelected}
                    onClick={() => setSelectedVisitId(v.id)}
                    onDoubleClick={() => {
                      setSelectedVisitId(v.id);
                      // setSelectedPatient + navigate（既存挙動のショートカット）
                      setSelectedPatient({
                        id: v.patientId, name: v.patientName, age: v.age, gender: v.gender,
                        wardId: 'ward1' as any, roomNumber: '', bedLabel: '',
                        status: 'stable' as any, admitDate: '', doctorName: v.doctorName, diagnosis: '',
                      } as any);
                      navigate(`/karte-outpatient/${v.patientId}`);
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Radio checked={isSelected} size="small" />
                    </TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{v.id}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{v.patientName}</TableCell>
                    <TableCell>{v.age}歳</TableCell>
                    <TableCell>{v.gender === 'M' ? '男' : '女'}</TableCell>
                    <TableCell>
                      <Chip
                        label={v.visitType}
                        size="small"
                        variant="outlined"
                        color={v.visitType === '初診' ? 'warning' : 'default'}
                        sx={{ fontSize: '0.6875rem' }}
                      />
                    </TableCell>
                    <TableCell>{v.department}</TableCell>
                    <TableCell>{v.doctorName}</TableCell>
                    <TableCell>{v.appointmentTime}</TableCell>
                    <TableCell>{v.receptionTime ?? '—'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={cfg.label}
                        color={cfg.color}
                        icon={cfg.icon}
                        variant={v.status === '完了' ? 'outlined' : 'filled'}
                        sx={{ fontSize: '0.6875rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Typography variant="caption" color="text.secondary">
                        {v.notes ?? ''}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* フッター: 件数 + ヘルプテキスト */}
      <Stack direction="row" alignItems="center" sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {filtered.length}件表示
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">
          行ダブルクリックでカルテへ直接遷移
        </Typography>
      </Stack>

      {/* §10 破壊的操作: チェックイン取消の確認ダイアログ（MUI 標準: Primary 位置 + warning） */}
      <Dialog open={cancelConfirm.open} onClose={() => setCancelConfirm({ open: false, visit: null })} maxWidth="xs" fullWidth>
        <DialogTitle>チェックインを取り消しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {cancelConfirm.visit && (
              <>
                <strong>{cancelConfirm.visit.patientName}</strong>（{cancelConfirm.visit.id}）の
                チェックインを取り消します。<br />
                受付状態が解除され、再度チェックインが必要になります。
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelConfirm({ open: false, visit: null })}>キャンセル</Button>
          <Button onClick={confirmCancelCheckin} variant="contained" color="warning">
            取り消す
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default OutpatientList;

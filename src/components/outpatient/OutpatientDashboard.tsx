import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, Chip, Container, Divider, Grid, IconButton, Paper, Stack,
  Tooltip, Typography,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArticleOutlined as ArticleIcon,
  AssignmentOutlined as AssignmentIcon,
  CalendarMonthOutlined as CalendarIcon,
  FolderOpenOutlined as FolderOpenIcon,
  LocalHospitalOutlined as LocalHospitalIcon,
  MedicalServicesOutlined as MedicalServicesIcon,
  NoteAddOutlined as NoteAddIcon,
  NotificationsOutlined as NotificationsIcon,
  OpenInNewOutlined as OpenInNewIcon,
  PaymentsOutlined as PaymentsIcon,
  PersonOutlined as PersonIcon,
  PhoneOutlined as PhoneIcon,
  ReceiptLongOutlined as ReceiptLongIcon,
  StickyNote2Outlined as StickyNote2Icon,
  TimelineOutlined as TimelineIcon,
  VerifiedUserOutlined as VerifiedUserIcon,
  VisibilityOutlined as VisibilityIcon,
  WarningAmberOutlined as WarningIcon,
} from '@mui/icons-material';
import { OUTPATIENT_VISITS, diagnosisInfo, allergyInfo, adlInfo, medicalRecords } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';

/**
 * 外来カルテ画面（v1.1 デザインルール準拠）
 *
 * 用語: 本実装では参考システムの「メインダッシュボード」を「カルテ画面」、
 * 「カルテ記載」を「診療録」と呼ぶ（プロジェクト用語ポリシー）。
 *
 * ルール参照: docs/design-rules.md
 * - §1.1 maxWidth="xl"、§1.3 セクション構造、§2.1 戻るボタン
 * - §3.2 ボタン配置（MUI 標準）、§7.1 ステータス Chip + アイコン併用
 * - §9.1.1 トースト右上、§15 スケルトン優先、§17 日本語固定
 *
 * 仕様参照: docs/gairai/features/patient.html § メインダッシュボード
 * - 表示情報: 患者基本情報・病名情報一覧・診療録履歴・GAFスコア・開示情報・オーダー処理状況
 * - ナビゲーション: 患者基本情報/属性/保険/連絡先/エピソード/その他/メモ/診療録/各オーダー/病名/各種文書
 * - 一部画面（診療録・各オーダー）は新規ウィンドウで開く想定
 */

// ===== ナビゲーションタイル定義 =====
type NavTile = {
  key: string;
  label: string;
  icon: React.ReactElement;
  to: string;
  newWindow?: boolean;
  description?: string;
};

const PRIMARY_TILES: NavTile[] = [
  { key: 'karte',     label: '診療録',      icon: <ArticleIcon />,         to: '/karte-outpatient', newWindow: true,  description: '診療録の閲覧・記載' },
  { key: 'orders',    label: 'オーダー',    icon: <AssignmentIcon />,      to: '/orders',           newWindow: true,  description: '処方・注射・検査・処置' },
  { key: 'documents', label: '文書登録',    icon: <FolderOpenIcon />,      to: '/documents',                          description: '診療文書の登録・閲覧' },
  { key: 'diagnosis', label: '病名管理',    icon: <LocalHospitalIcon />,   to: '/karte-outpatient',                   description: '病名の追加・編集' },
];

const SECONDARY_TILES: NavTile[] = [
  { key: 'basic',     label: '患者基本情報',  icon: <PersonIcon />,          to: '/outpatient-basic' },
  { key: 'attrs',     label: '患者属性',      icon: <VerifiedUserIcon />,    to: '/karte-outpatient' },
  { key: 'insurance', label: '保険情報',      icon: <PaymentsIcon />,        to: '/karte-outpatient' },
  { key: 'contact',   label: '連絡先情報',    icon: <PhoneIcon />,           to: '/karte-outpatient' },
  { key: 'episode',   label: 'エピソード',    icon: <TimelineIcon />,        to: '/karte-outpatient' },
  { key: 'memo',      label: '患者メモ',      icon: <StickyNote2Icon />,     to: '/karte-outpatient' },
];

// ===== セクションヘッダ =====
const SectionHeader: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => (
  <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
    <Box sx={{ flex: 1 }} />
    {right}
  </Stack>
);

const OutpatientDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { patientId } = useParams<{ patientId: string }>();
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  // モック: 外来一覧の患者から選択（または最初の 1 件）
  const visit = OUTPATIENT_VISITS.find((v) => v.patientId === patientId) ?? OUTPATIENT_VISITS[0];

  if (!visit) {
    return (
      <Container maxWidth="xl" disableGutters sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">患者が見つかりません</Typography>
        <Button onClick={() => navigate('/outpatient')} sx={{ mt: 2 }}>外来一覧へ戻る</Button>
      </Container>
    );
  }

  const handleNavigate = (tile: NavTile) => {
    if (tile.key === 'basic') {
      navigate(`/outpatient/${visit.patientId}/basic`);
      return;
    }
    if (tile.key === 'karte') {
      navigate(`/karte-outpatient/${visit.patientId}`);
      return;
    }
    // 未実装の画面はトーストで予告
    showSnackbar(`${tile.label}画面は実装予定`, 'info');
  };

  // 最新 5 件
  const recentRecords = medicalRecords.slice(0, 5);

  return (
    <Container maxWidth="xl" disableGutters sx={{ py: 1 }}>
      {/* §2.1 戻るボタン: 左上 */}
      <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/outpatient')}
          sx={{ color: 'text.secondary' }}
        >
          外来一覧へ戻る
        </Button>
        <Box sx={{ flex: 1 }} />
        <Typography variant="caption" color="text.secondary">
          カルテ画面
        </Typography>
      </Stack>

      {/* 患者ヘッダー */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip
            label="外来"
            size="small"
            color="success"
            sx={{ fontWeight: 700 }}
          />
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap" useFlexGap>
              <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 700 }}>
                {visit.patientId}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {visit.patientName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {visit.gender === 'M' ? '男' : '女'}　{visit.age}歳
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                color={visit.visitType === '初診' ? 'warning' : 'default'}
                label={visit.visitType}
                sx={{ fontSize: '0.6875rem' }}
              />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
              <Typography variant="caption" color="text.secondary">
                {visit.department}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                主治医: {visit.doctorName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                受付: {visit.receptionTime ?? '—'}　予約: {visit.appointmentTime}
              </Typography>
            </Stack>
          </Box>
          {/* 状態 Chip */}
          <Chip
            size="small"
            label={visit.status}
            color={
              visit.status === '完了' ? 'success' :
              visit.status === '会計待ち' ? 'secondary' :
              visit.status === '診察中' ? 'warning' : 'info'
            }
            sx={{ fontWeight: 700 }}
          />
          {/* 通知・予約 アイコン */}
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="通知">
              <IconButton size="small" onClick={() => showSnackbar('通知ダイアログは実装予定', 'info')}>
                <NotificationsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="予約登録">
              <IconButton size="small" onClick={() => showSnackbar('予約登録ダイアログは実装予定', 'info')}>
                <CalendarIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Paper>

      {/* 主要アクション（診療録・オーダー・文書・病名）*/}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5 }}>
        <SectionHeader title="主要アクション" />
        <Grid container spacing={1.5}>
          {PRIMARY_TILES.map((tile) => (
            <Grid item xs={6} sm={3} key={tile.key}>
              <Paper
                variant="outlined"
                onClick={() => handleNavigate(tile)}
                sx={{
                  p: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
                  height: '100%',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ color: 'primary.main', display: 'flex' }}>{tile.icon}</Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, flex: 1 }}>
                    {tile.label}
                  </Typography>
                  {tile.newWindow && (
                    <Tooltip title="新規ウィンドウで開きます">
                      <OpenInNewIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    </Tooltip>
                  )}
                </Stack>
                {tile.description && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {tile.description}
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* サマリ Grid: 病名・基本情報・診療録履歴・GAF・オーダー状況 */}
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        {/* 病名情報 */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
            <SectionHeader
              title="病名情報"
              right={
                <Button size="small" onClick={() => showSnackbar('病名一覧は実装予定', 'info')}>
                  すべて見る
                </Button>
              }
            />
            <Stack spacing={0.75}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip label="主病名" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
                <Chip label={diagnosisInfo.mainDiagnosisCode} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                <Typography variant="body2">{diagnosisInfo.mainDiagnosis}</Typography>
                <Typography variant="caption" color="text.secondary">{diagnosisInfo.mainDiagnosisDate}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip label="副病名" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                <Chip label={diagnosisInfo.subDiagnosisCode} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                <Typography variant="body2">{diagnosisInfo.subDiagnosis}</Typography>
                <Typography variant="caption" color="text.secondary">{diagnosisInfo.subDiagnosisDate}</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* 基本情報サマリ（アレルギー・感染症等）*/}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
            <SectionHeader
              title="患者基本情報"
              right={
                <Button size="small" onClick={() => navigate(`/karte-outpatient/${visit.patientId}`)}>
                  詳細
                </Button>
              }
            />
            <Stack spacing={0.5}>
              <Stack direction="row" alignItems="flex-start" spacing={1}>
                <WarningIcon sx={{ fontSize: 16, color: 'error.main', mt: 0.25 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">薬剤アレルギー</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                    {allergyInfo.drug.join(' / ') || 'なし'}
                  </Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 0.5 }} />
              <Stack direction="row" alignItems="flex-start" spacing={1}>
                <WarningIcon sx={{ fontSize: 16, color: 'warning.main', mt: 0.25 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">食物アレルギー</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {allergyInfo.food.join(' / ') || 'なし'}
                  </Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 0.5 }} />
              <Stack direction="row" spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">感染症</Typography>
                  <Typography variant="body2">なし</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">主訴</Typography>
                  <Typography variant="body2">不眠・倦怠感</Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* 最新診療録 */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 1.5, height: '100%' }}>
            <SectionHeader
              title="最新診療録"
              right={
                <Button
                  size="small"
                  startIcon={<NoteAddIcon />}
                  variant="contained"
                  onClick={() => navigate(`/karte-outpatient/${visit.patientId}`)}
                >
                  診療録
                </Button>
              }
            />
            <Stack divider={<Divider flexItem />} spacing={0}>
              {recentRecords.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  診療録はありません
                </Typography>
              )}
              {recentRecords.map((r) => (
                <Stack key={r.id} direction="row" spacing={1.5} sx={{ py: 0.75 }} alignItems="flex-start">
                  <Box sx={{ width: 80, flexShrink: 0 }}>
                    <Typography variant="caption" color="text.secondary">
                      {r.date}({r.dayOfWeek})
                    </Typography>
                  </Box>
                  <Box sx={{ width: 90, flexShrink: 0 }}>
                    <Chip
                      label={r.category}
                      size="small"
                      variant="outlined"
                      color={r.category === '医師記録' ? 'primary' : r.category === '看護記録' ? 'warning' : 'default'}
                      sx={{ height: 20, fontSize: '0.65rem' }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {r.content || '(本文なし)'}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ width: 80, flexShrink: 0, textAlign: 'right' }}>
                    {r.author}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Grid>

        {/* GAF スコア + オーダー処理状況 + 開示情報 */}
        <Grid item xs={12} md={4}>
          <Stack spacing={1.5} sx={{ height: '100%' }}>
            {/* GAF */}
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <SectionHeader title="GAFスコア" />
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  63
                </Typography>
                <Typography variant="caption" color="text.secondary">点</Typography>
                <Box sx={{ flex: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  測定日: {adlInfo.gafDate}
                </Typography>
              </Stack>
            </Paper>

            {/* オーダー処理状況 */}
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <SectionHeader
                title="オーダー処理状況"
                right={
                  <Button size="small" onClick={() => showSnackbar('オーダー画面は実装予定', 'info')}>
                    詳細
                  </Button>
                }
              />
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip icon={<ReceiptLongIcon sx={{ fontSize: 14 }} />} label="待機 2 件" size="small" color="info" variant="outlined" />
                <Chip icon={<MedicalServicesIcon sx={{ fontSize: 14 }} />} label="実施中 1 件" size="small" color="warning" variant="outlined" />
                <Chip label="完了 3 件" size="small" color="success" variant="outlined" />
              </Stack>
            </Paper>

            {/* 開示情報 */}
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <SectionHeader title="開示情報" />
              <Stack direction="row" alignItems="center" spacing={1}>
                <VisibilityIcon sx={{ fontSize: 18, color: 'success.main' }} />
                <Typography variant="body2">通常開示</Typography>
                <Box sx={{ flex: 1 }} />
                <Chip label="制限なし" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      {/* セカンダリナビ（その他患者情報）*/}
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <SectionHeader title="その他の患者情報" />
        <Grid container spacing={1}>
          {SECONDARY_TILES.map((tile) => (
            <Grid item xs={6} sm={4} md={2} key={tile.key}>
              <Paper
                variant="outlined"
                onClick={() => handleNavigate(tile)}
                sx={{
                  p: 1,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <Box sx={{ color: 'text.secondary', display: 'flex' }}>
                    {React.cloneElement(tile.icon, { sx: { fontSize: 18 } })}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    {tile.label}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Container>
  );
};

export default OutpatientDashboard;

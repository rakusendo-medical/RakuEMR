import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Typography, Tabs, Tab, Stack, Avatar,
  Chip, Grid, Divider, Table, TableBody, TableRow, TableCell, Paper,
  IconButton, Tooltip,
} from '@mui/material';
import {
  ArrowBack, Send, Edit, NoteAdd, Receipt, MeetingRoom,
  CalendarMonth, Print, ThumbUpAltOutlined, ChatBubbleOutline,
  AttachFile, LocalPharmacy, FolderShared,
} from '@mui/icons-material';
import { PATIENTS, ORDERS, NURSING_RECORDS } from '../../data/mockData';
import StatusBadge from '../common/StatusBadge';
import { useAppStore } from '../../stores/useAppStore';

// ===== Mock data for the dense karte view =====

interface KarteInsurance {
  type: string;
  insurerNumber: string;
  recordNumber: string;
  copay: string;
  validPeriod: string;
}

interface KarteDiagnosis {
  main: string;
  mainCode: string;
  mainDate: string;
  sub: string;
  subCode: string;
  subDate: string;
}

interface KarteAllergy {
  drug: string[];
  food: string[];
}

interface KarteStaff {
  team: string;
  wardMgmt: string;
  independenceLevel: string;
}

interface KarteAdl {
  barthel: string;
  gaf: string;
  planDate: string;
}

interface KarteRecord {
  id: string;
  date: string;
  dayOfWeek: string;
  category: string;
  categoryColor: string;
  author: string;
  authorRole: string;
  content: string;
  tags: string[];
  orderNumber?: string;
  timestamp: string;
}

const MOCK_INSURANCE: KarteInsurance = {
  type: 'テスト保険',
  insurerNumber: '39999839',
  recordNumber: '01・23456789',
  copay: '3割',
  validPeriod: '39999999',
};

const MOCK_DIAGNOSIS: KarteDiagnosis = {
  main: '統合失調症',
  mainCode: 'F20.9',
  mainDate: '2026/01/10 ～',
  sub: '不眠症',
  subCode: 'G47.0',
  subDate: '2026/01/20 ～',
};

const MOCK_ALLERGY: KarteAllergy = {
  drug: ['アレルギー性鼻炎[アレルギー性鼻炎炎]', '喘息', 'ウイルス性肝炎X'],
  food: ['鶏卵アレルギー[鶏卵]'],
};

const MOCK_STAFF: KarteStaff = {
  team: '病棟内/スタッフ同伴',
  wardMgmt: '2/B(昼)1h/B(夜)',
  independenceLevel: 'B.',
};

const MOCK_ADL: KarteAdl = {
  barthel: 'バーサリ: 記録値 AB30',
  gaf: '63点 (確定日) 2026/01/10',
  planDate: '2026年3月 10日 (月)',
};

const MOCK_RECORDS: KarteRecord[] = [
  {
    id: 'kr1', date: '2026/03/10', dayOfWeek: '月', category: '医師記録', categoryColor: '#1e40af',
    author: '田村 医師', authorRole: '医師D', content: '定期回診。状態安定。処方継続。',
    tags: [], timestamp: '2026/03/10 10:30',
  },
  {
    id: 'kr2', date: '2026/03/10', dayOfWeek: '月', category: '看護記録', categoryColor: '#c2410c',
    author: '山本 看護師', authorRole: '', content: '朝の検温実施。体温36.5℃、血圧128/82。食欲あり、朝食全量摂取。表情穏やか。服薬確認済み。',
    tags: ['看護記録'], timestamp: '2026/03/10 09:00',
  },
  {
    id: 'kr3', date: '2026/03/09', dayOfWeek: '日', category: '看護記録', categoryColor: '#c2410c',
    author: '中田 看護師', authorRole: '', content: '午後の回診同行。主治医より薬剤変更の指示あり。患者に説明済み。理解良好。',
    tags: ['看護記録', 'クリニカルパス'], orderNumber: 'NO.827', timestamp: '2026/03/09 14:00',
  },
  {
    id: 'kr4', date: '2026/03/09', dayOfWeek: '日', category: '医師記録', categoryColor: '#1e40af',
    author: '田村 医師', authorRole: '医師D', content: 'リスパダール 2mg → 3mg に増量指示。経過観察継続。',
    tags: [], orderNumber: 'NO.827', timestamp: '2026/03/09 13:45',
  },
  {
    id: 'kr5', date: '2026/03/08', dayOfWeek: '土', category: '看護サマリ', categoryColor: '#7c3aed',
    author: '山本 看護師', authorRole: '', content: '面会あり（家族：妻）。面会後やや落ち着かない様子。見守り継続。30分後に落ち着きを取り戻す。',
    tags: ['退院支援', '看護師カンファ'], orderNumber: 'NO827', timestamp: '2026/03/08 10:30',
  },
  {
    id: 'kr6', date: '2026/03/07', dayOfWeek: '金', category: '看護記録', categoryColor: '#c2410c',
    author: '佐々木 看護師', authorRole: '', content: '夜間巡回。入眠確認。呼吸状態安定。体位変換不要。',
    tags: [], timestamp: '2026/03/07 21:00',
  },
  {
    id: 'kr7', date: '2026/03/06', dayOfWeek: '木', category: '入退院記録', categoryColor: '#b91c1c',
    author: '田村 医師', authorRole: '医師D',
    content: '【精神科】\n退院環境調整の指示\n [居場所]当院病棟\n [現在室]101\n [身長]167.8cm\n [体重]72.0kg',
    tags: [], orderNumber: 'NO.837', timestamp: '2026/03/06 17:23',
  },
];

const RECORD_FILTER_TABS = [
  '全体カンファレンス', 'NSTカンファレンス', '褥瘡カンファレンス',
  '臨床記録', '行動範囲', '外出/外泊', '日勤帯記録',
];

const SUB_TABS = ['診断名', '基本情報', 'GAF', '院外/状・診断書類', 'ファミリ', 'クリニカルパス', '指示/入室'];

const ACTION_BUTTONS = [
  { label: 'オーダ送信', icon: <Send />, color: 'primary' as const },
  { label: '事後入力', icon: <Edit />, color: 'primary' as const },
  { label: '看護ケア', icon: <NoteAdd />, color: 'secondary' as const },
  { label: 'オーダ入力', icon: <Receipt />, color: 'info' as const },
  { label: '患者予約', icon: <CalendarMonth />, color: 'warning' as const },
  { label: '記事作成', icon: <Edit />, color: 'primary' as const },
];

// ===== Components =====

const KarteAlphaPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { selectedPatient, setSelectedPatient } = useAppStore();
  const [subTab, setSubTab] = useState(0);

  const patient = selectedPatient || PATIENTS.find((p) => p.id === patientId);

  if (!patient) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">患者が見つかりません</Typography>
        <Button onClick={() => navigate('/patients')} sx={{ mt: 2 }}>一覧に戻る</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => { setSelectedPatient(null); navigate('/patients'); }}
        sx={{ mb: 1, alignSelf: 'flex-start' }}
      >
        一覧に戻る
      </Button>

      {/* Patient Header - Dense */}
      <PatientHeaderDense patient={patient} />

      {/* Quick Buttons Row */}
      <Stack direction="row" spacing={0.5} sx={{ my: 1, flexWrap: 'wrap' }} useFlexGap>
        <QuickActionBtn label="添付ファイル" icon={<AttachFile />} color="primary" />
        <QuickActionBtn label="処方" icon={<LocalPharmacy />} color="error" />
        <QuickActionBtn label="紹介" icon={<FolderShared />} color="warning" />
      </Stack>

      {/* Main content: scrollable */}
      <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* 生活歴 Timeline */}
        <LifeTimelineCompact />

        {/* 診療情報 */}
        <MedicalInfoDense patient={patient} />

        {/* Sub tabs row */}
        <Paper variant="outlined" sx={{ px: 1 }}>
          <Stack direction="row" spacing={0} sx={{ overflowX: 'auto' }}>
            {SUB_TABS.map((tab, i) => (
              <Chip
                key={tab}
                label={tab}
                variant={subTab === i ? 'filled' : 'outlined'}
                color={subTab === i ? 'primary' : 'default'}
                onClick={() => setSubTab(i)}
                sx={{ borderRadius: 1, mr: 0.5, my: 0.5 }}
              />
            ))}
          </Stack>
        </Paper>

        {/* 診療録 */}
        <MedicalRecordsDense />
      </Box>

      {/* Bottom Action Bar */}
      <Paper elevation={2} sx={{ mt: 1, p: 1, borderRadius: 2 }}>
        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }} useFlexGap>
          {ACTION_BUTTONS.map((btn) => (
            <Button key={btn.label} variant="outlined" color={btn.color} startIcon={btn.icon} size="small">
              {btn.label}
            </Button>
          ))}
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" startIcon={<Print />} size="small">印刷</Button>
          <Button variant="contained" color="error" size="small">終了</Button>
        </Stack>
      </Paper>
    </Box>
  );
};

// ----- Patient Header Dense -----
function PatientHeaderDense({ patient }: { patient: any }) {
  return (
    <Card>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip label="入院" size="small" color="error" sx={{ fontWeight: 700 }} />
          <Avatar sx={{
            width: 40, height: 40, borderRadius: 1.5,
            bgcolor: patient.gender === 'M' ? '#dbeafe' : '#fce7f3',
            color: patient.gender === 'M' ? 'primary.main' : '#be185d',
            fontSize: '1rem', fontWeight: 700,
          }}>
            {patient.name[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography variant="subtitle1" color="primary.main" sx={{ fontWeight: 700 }}>
                {patient.id}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {patient.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {patient.gender === 'M' ? '男' : '女'}　{patient.age}歳
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {patient.wardId === 'ward1' ? '第１病棟' : '第２病棟'}　{patient.roomNumber}号室-{patient.bedLabel}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 0.3 }}>
              <Typography variant="caption" color="primary.main">Dr {patient.doctorName}</Typography>
              <Typography variant="caption" color="text.secondary">入院日: {patient.admitDate}</Typography>
              {patient.diagnosis && (
                <Typography variant="caption" color="text.secondary">診断: {patient.diagnosis}</Typography>
              )}
            </Stack>
          </Box>
          <StatusBadge status={patient.status} />
        </Stack>
      </CardContent>
    </Card>
  );
}

// ----- Quick Action Button -----
function QuickActionBtn({ label, icon, color }: { label: string; icon: React.ReactElement; color: 'primary' | 'error' | 'warning' }) {
  return (
    <Button variant="contained" color={color} size="small" startIcon={icon}
      sx={{ fontSize: '0.7rem', px: 1.5, py: 0.3 }}>
      {label}
    </Button>
  );
}

// ----- Life Timeline Compact -----
function LifeTimelineCompact() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const activeDays = [1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26];

  return (
    <Card>
      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}>
          生活歴
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Stack direction="row" spacing={0} alignItems="center">
            <Typography variant="caption" sx={{ width: 60, flexShrink: 0, color: 'text.secondary' }}>
              治療区
            </Typography>
            {days.map((d) => (
              <Box key={d} sx={{
                width: 16, minWidth: 16, height: 14,
                bgcolor: activeDays.includes(d) ? 'secondary.light' : 'grey.100',
                border: '1px solid', borderColor: 'divider', borderRight: 'none',
                '&:last-child': { borderRight: '1px solid', borderRightColor: 'divider' },
              }} />
            ))}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

// ----- Medical Info Dense -----
function MedicalInfoDense({ patient }: { patient: any }) {
  return (
    <Card>
      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}>
          診療情報
        </Typography>
        <Table size="small" sx={{ '& td': { py: 0.3, px: 1, fontSize: '0.75rem', border: 'none' } }}>
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', width: 80 }}>保険情報</TableCell>
              <TableCell>{MOCK_INSURANCE.type}　有効期限: {MOCK_INSURANCE.validPeriod}　保険者番号: {MOCK_INSURANCE.insurerNumber}　{MOCK_INSURANCE.copay}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>主病名</TableCell>
              <TableCell>
                <Chip label={MOCK_DIAGNOSIS.mainCode} size="small" color="primary" variant="outlined" sx={{ mr: 0.5, height: 18, fontSize: '0.65rem' }} />
                {MOCK_DIAGNOSIS.main}　{MOCK_DIAGNOSIS.mainDate}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>合併症</TableCell>
              <TableCell>
                <Chip label={MOCK_DIAGNOSIS.subCode} size="small" variant="outlined" sx={{ mr: 0.5, height: 18, fontSize: '0.65rem' }} />
                {MOCK_DIAGNOSIS.sub}　{MOCK_DIAGNOSIS.subDate}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>アレルギー</TableCell>
              <TableCell>
                <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                  {MOCK_ALLERGY.drug.join(' / ')}
                </Typography>
                <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
                  食物: {MOCK_ALLERGY.food.join(' / ')}
                </Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>責任範囲</TableCell>
              <TableCell>{MOCK_STAFF.team}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>ADL/GAF</TableCell>
              <TableCell>
                {MOCK_ADL.barthel}　|　GAF {MOCK_ADL.gaf}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>自立度</TableCell>
              <TableCell>{MOCK_STAFF.independenceLevel}　病棟管理: {MOCK_STAFF.wardMgmt}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ----- Medical Records Dense -----
function MedicalRecordsDense() {
  const [filterActive, setFilterActive] = useState('all');

  // Group records by date
  const groupedRecords: Record<string, KarteRecord[]> = {};
  MOCK_RECORDS.forEach((r) => {
    if (!groupedRecords[r.date]) groupedRecords[r.date] = [];
    groupedRecords[r.date].push(r);
  });

  return (
    <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 300 }}>
      <CardContent sx={{ py: 1, flex: 1, display: 'flex', flexDirection: 'column', '&:last-child': { pb: 1 } }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
            診療録 ─ 最近の6日分
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant="text" sx={{ fontSize: '0.65rem' }}>最初へ ▲</Button>
          <Button size="small" variant="outlined" sx={{ fontSize: '0.65rem' }}>続き ▼</Button>
        </Stack>

        {/* Filter tabs */}
        <Stack direction="row" spacing={0.5} sx={{ mb: 1, overflowX: 'auto', pb: 0.5 }}>
          <Chip
            label="最近の6日分"
            size="small"
            color={filterActive === 'all' ? 'primary' : 'default'}
            variant={filterActive === 'all' ? 'filled' : 'outlined'}
            onClick={() => setFilterActive('all')}
            sx={{ fontSize: '0.65rem', height: 22 }}
          />
          <Divider orientation="vertical" flexItem />
          {RECORD_FILTER_TABS.map((tab) => (
            <Chip
              key={tab}
              label={tab}
              size="small"
              variant="outlined"
              onClick={() => setFilterActive(tab)}
              sx={{ fontSize: '0.65rem', height: 22 }}
            />
          ))}
        </Stack>

        {/* Records */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {Object.entries(groupedRecords).map(([date, records], gi) => (
            <Box key={date}>
              {/* Date separator */}
              <Box sx={{
                bgcolor: 'grey.50', borderBottom: 1, borderTop: gi > 0 ? 1 : 0,
                borderColor: 'divider', px: 1, py: 0.3, mt: gi > 0 ? 1 : 0,
              }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {date}({records[0].dayOfWeek})
                </Typography>
              </Box>

              {/* Record entries */}
              {records.map((record) => (
                <Box key={record.id} sx={{
                  display: 'flex', py: 0.8, px: 1,
                  borderBottom: '1px solid', borderColor: 'grey.100',
                  '&:hover': { bgcolor: 'action.hover' },
                }}>
                  {/* Left: time */}
                  <Box sx={{ width: 50, flexShrink: 0 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                      {record.timestamp.split(' ')[1]}
                    </Typography>
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.3 }}>
                      {record.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" sx={{
                          height: 18, fontSize: '0.6rem',
                          bgcolor: tag === '退院支援' ? 'error.light' : tag === '看護師カンファ' ? 'success.light' : 'info.light',
                          color: '#fff',
                        }} />
                      ))}
                      <Typography variant="caption" sx={{ fontWeight: 700, color: record.categoryColor }}>
                        {record.category}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {record.author}
                      </Typography>
                      {record.orderNumber && (
                        <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                          {record.orderNumber}
                        </Typography>
                      )}
                    </Stack>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-line' }}>
                      {record.content}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3 }}>
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                        {record.authorRole && `${record.authorRole}/`}{record.author}　{record.timestamp}
                      </Typography>
                      <Box sx={{ flex: 1 }} />
                      <Tooltip title="いいね">
                        <IconButton size="small" sx={{ p: 0.2 }}>
                          <ThumbUpAltOutlined sx={{ fontSize: 14, color: 'text.disabled' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="コメント">
                        <IconButton size="small" sx={{ p: 0.2 }}>
                          <ChatBubbleOutline sx={{ fontSize: 14, color: 'text.disabled' }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export default KarteAlphaPage;

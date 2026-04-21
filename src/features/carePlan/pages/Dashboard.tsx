import React, { useMemo } from 'react';
import {
  Box, Button, Card, CardActionArea, CardContent, Container, FormControl,
  InputLabel, MenuItem, Paper, Select, Stack, Typography,
} from '@mui/material';
import {
  ErrorOutline as ErrorIcon,
  ReportProblemOutlined as WarningIcon,
  InfoOutlined as InfoIcon,
  HourglassTopOutlined as HourglassIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCarePlanStore, daysUntil, formatJPDate, formatShortDate } from '../store';
import type { DashboardCategory, Patient } from '../types';
import { TODAY } from '../mockData';

interface CategorizedPatient {
  patient: Patient;
  lastEvaluatedAt?: string;
  nextEvaluationDueAt?: string;
  daysDiff: number | null;
  category: DashboardCategory | 'normal';
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const nurses = useCarePlanStore((s) => s.nurses);
  const currentNurseId = useCarePlanStore((s) => s.currentNurseId);
  const switchNurse = useCarePlanStore((s) => s.switchNurse);
  const patients = useCarePlanStore((s) => s.patients);
  const carePlans = useCarePlanStore((s) => s.carePlans);
  const problemItems = useCarePlanStore((s) => s.problemItems);

  const categorized = useMemo<CategorizedPatient[]>(() => {
    return patients
      .filter((p) => p.primaryNurseId === currentNurseId)
      .map((p) => {
        const plan = carePlans.find((cp) => cp.patientId === p.id && cp.status !== 'closed');
        if (!plan) {
          return { patient: p, daysDiff: null, category: 'notPlanned' as const };
        }
        const items = problemItems.filter((pi) => pi.carePlanId === plan.id);
        if (items.length === 0) {
          return { patient: p, daysDiff: null, category: 'notPlanned' as const };
        }
        // 最も期限の近い(最小の daysUntil)明細を代表として採用
        const withDue = items
          .map((it) => ({ it, d: daysUntil(it.nextEvaluationDueAt) }))
          .filter((x) => x.d !== null) as { it: typeof items[number]; d: number }[];
        const hasEvaluating = items.some((it) => it.status === 'evaluating');
        const earliest = withDue.sort((a, b) => a.d - b.d)[0];
        const daysDiff = earliest?.d ?? null;
        const lastEvaluatedAt = items
          .map((it) => it.lastEvaluatedAt)
          .filter(Boolean)
          .sort()
          .pop();
        const nextEvaluationDueAt = earliest?.it.nextEvaluationDueAt;

        let category: DashboardCategory | 'normal' = 'normal';
        if (daysDiff !== null && daysDiff < 0) category = 'overdue';
        else if (hasEvaluating) category = 'evaluating';
        else if (daysDiff !== null && daysDiff <= 10) category = 'dueThisMonth';

        return { patient: p, lastEvaluatedAt, nextEvaluationDueAt, daysDiff, category };
      });
  }, [patients, carePlans, problemItems, currentNurseId]);

  const byCategory = {
    overdue: categorized.filter((x) => x.category === 'overdue').sort((a, b) => (a.daysDiff ?? 0) - (b.daysDiff ?? 0)),
    dueThisMonth: categorized.filter((x) => x.category === 'dueThisMonth').sort((a, b) => (a.daysDiff ?? 0) - (b.daysDiff ?? 0)),
    notPlanned: categorized.filter((x) => x.category === 'notPlanned'),
    evaluating: categorized.filter((x) => x.category === 'evaluating'),
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const StatCard: React.FC<{
    id: DashboardCategory;
    label: string;
    count: number;
    color: string;
    icon: React.ReactNode;
  }> = ({ id, label, count, color, icon }) => (
    <Card variant="outlined" sx={{ flex: 1 }}>
      <CardActionArea onClick={() => scrollTo(`sec-${id}`)}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ color }}>{icon}</Box>
            <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ color, fontWeight: 700 }}>
              {count}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );

  const PatientRow: React.FC<{
    row: CategorizedPatient;
    action: { label: string; onClick: () => void };
    subText: string;
    color?: string;
  }> = ({ row, action, subText, color }) => (
    <Paper variant="outlined" sx={{ p: 1.25, mb: 0.75 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box sx={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/care-plan/patients/${row.patient.id}`)}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {row.patient.name}
            <span style={{ color: '#64748b', fontWeight: 400, marginLeft: 8 }}>
              ({row.patient.age}歳{row.patient.sex === 'M' ? '男性' : '女性'}) {row.patient.roomNo}号室
            </span>
          </Typography>
          <Typography variant="caption" sx={{ color: color ?? 'text.secondary' }}>
            {subText}
          </Typography>
        </Box>
        <Button size="small" variant="contained" onClick={action.onClick}>
          {action.label} →
        </Button>
      </Stack>
    </Paper>
  );

  return (
    <Container maxWidth="xl" disableGutters>
      <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="h6">看護計画ダッシュボード</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          基準日: {formatJPDate(TODAY)}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>担当看護師</InputLabel>
          <Select
            label="担当看護師"
            value={currentNurseId}
            onChange={(e) => switchNurse(e.target.value)}
          >
            {nurses.map((n) => (
              <MenuItem key={n.id} value={n.id}>{n.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <StatCard id="overdue" label="評価期限超過" count={byCategory.overdue.length} color="#dc2626" icon={<ErrorIcon />} />
        <StatCard id="dueThisMonth" label="今月評価必要" count={byCategory.dueThisMonth.length} color="#d97706" icon={<WarningIcon />} />
        <StatCard id="notPlanned" label="計画未立案" count={byCategory.notPlanned.length} color="#64748b" icon={<InfoIcon />} />
        <StatCard id="evaluating" label="評価中のまま" count={byCategory.evaluating.length} color="#ea580c" icon={<HourglassIcon />} />
      </Stack>

      {/* 評価期限超過 */}
      <Box id="sec-overdue" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1 }}>
          <ErrorIcon sx={{ color: '#dc2626', fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ color: '#dc2626' }}>評価期限超過</Typography>
          <Typography variant="caption" color="text.secondary">({byCategory.overdue.length}件)</Typography>
        </Stack>
        {byCategory.overdue.map((row) => (
          <PatientRow
            key={row.patient.id}
            row={row}
            color="#dc2626"
            subText={`前回評価 ${formatShortDate(row.lastEvaluatedAt)} / 期限 ${formatShortDate(row.nextEvaluationDueAt)} / ${-(row.daysDiff ?? 0)}日超過`}
            action={{ label: '評価する', onClick: () => navigate(`/care-plan/patients/${row.patient.id}/evaluate`) }}
          />
        ))}
        {byCategory.overdue.length === 0 && (
          <Typography variant="caption" color="text.secondary">該当なし</Typography>
        )}
      </Box>

      {/* 今月評価必要 */}
      <Box id="sec-dueThisMonth" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1 }}>
          <WarningIcon sx={{ color: '#d97706', fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ color: '#d97706' }}>今月評価が必要</Typography>
          <Typography variant="caption" color="text.secondary">({byCategory.dueThisMonth.length}件)</Typography>
        </Stack>
        {byCategory.dueThisMonth.map((row) => (
          <PatientRow
            key={row.patient.id}
            row={row}
            color="#d97706"
            subText={`評価期限 ${formatShortDate(row.nextEvaluationDueAt)} (残${row.daysDiff}日)`}
            action={{ label: '評価する', onClick: () => navigate(`/care-plan/patients/${row.patient.id}/evaluate`) }}
          />
        ))}
        {byCategory.dueThisMonth.length === 0 && (
          <Typography variant="caption" color="text.secondary">該当なし</Typography>
        )}
      </Box>

      {/* 計画未立案 */}
      <Box id="sec-notPlanned" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1 }}>
          <InfoIcon sx={{ color: '#64748b', fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ color: '#64748b' }}>計画未立案</Typography>
          <Typography variant="caption" color="text.secondary">({byCategory.notPlanned.length}件)</Typography>
        </Stack>
        {byCategory.notPlanned.map((row) => {
          const admissionDays = daysUntil(row.patient.admissionDate);
          return (
            <PatientRow
              key={row.patient.id}
              row={row}
              subText={`新入院 ${formatShortDate(row.patient.admissionDate)} (${admissionDays !== null ? -admissionDays : 0}日経過)`}
              action={{ label: '計画立案', onClick: () => navigate(`/care-plan/patients/${row.patient.id}/create`) }}
            />
          );
        })}
        {byCategory.notPlanned.length === 0 && (
          <Typography variant="caption" color="text.secondary">該当なし</Typography>
        )}
      </Box>

      {/* 評価中のまま */}
      <Box id="sec-evaluating" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1 }}>
          <HourglassIcon sx={{ color: '#ea580c', fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ color: '#ea580c' }}>評価中のまま</Typography>
          <Typography variant="caption" color="text.secondary">({byCategory.evaluating.length}件)</Typography>
        </Stack>
        {byCategory.evaluating.map((row) => (
          <PatientRow
            key={row.patient.id}
            row={row}
            color="#ea580c"
            subText={`前回評価 ${formatShortDate(row.lastEvaluatedAt)} / 要再確認`}
            action={{ label: '確認する', onClick: () => navigate(`/care-plan/patients/${row.patient.id}`) }}
          />
        ))}
        {byCategory.evaluating.length === 0 && (
          <Typography variant="caption" color="text.secondary">該当なし</Typography>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard;

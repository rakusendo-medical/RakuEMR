import React, { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Container, Divider, Paper, Stack, Typography,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Assessment as AssessmentIcon,
  Print as PrintIcon, History as HistoryIcon, SyncAlt as SyncAltIcon,
  FileCopy as FileCopyIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import PatientHeader from '../components/PatientHeader';
import ProblemItemCard from '../components/ProblemItemCard';
import ProblemItemEditDialog from '../components/ProblemItemEditDialog';
import CopyFromDialog from '../components/CopyFromDialog';
import { useCarePlanStore, formatJPDate } from '../store';

const PatientCarePlan: React.FC = () => {
  const { patientId = '' } = useParams();
  const navigate = useNavigate();
  const patient = useCarePlanStore((s) => s.patients.find((p) => p.id === patientId));
  const carePlan = useCarePlanStore((s) =>
    s.carePlans.find((p) => p.patientId === patientId && p.status !== 'closed')
  );
  const problemItems = useCarePlanStore((s) =>
    carePlan ? s.problemItems.filter((pi) => pi.carePlanId === carePlan.id) : []
  );
  const nurses = useCarePlanStore((s) => s.nurses);
  const addProblemItem = useCarePlanStore((s) => s.addProblemItem);
  const updateProblemItem = useCarePlanStore((s) => s.updateProblemItem);
  const closeProblemItem = useCarePlanStore((s) => s.closeProblemItem);

  const [editDialog, setEditDialog] = useState<
    { mode: 'create' } | { mode: 'edit'; itemId: string } | null
  >(null);
  const [copyOpen, setCopyOpen] = useState(false);

  const planAuthor = useMemo(
    () => nurses.find((n) => n.id === carePlan?.createdBy)?.name ?? '—',
    [nurses, carePlan]
  );

  if (!patient) {
    return <Typography>患者が見つかりません</Typography>;
  }

  if (!carePlan) {
    return (
      <Container maxWidth="xl" disableGutters>
        <PatientHeader patient={patient} />
        <Alert severity="info" action={
          <Button size="small" variant="contained" onClick={() => navigate(`/care-plan/patients/${patient.id}/create`)}>
            計画を立案する
          </Button>
        }>
          現行の看護計画はまだ立案されていません。
        </Alert>
      </Container>
    );
  }

  const editingItem = editDialog?.mode === 'edit'
    ? problemItems.find((pi) => pi.id === editDialog.itemId)
    : undefined;

  return (
    <Container maxWidth="xl" disableGutters>
      <PatientHeader patient={patient} />

      <Paper variant="outlined" sx={{ p: 1, mb: 1.5 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button startIcon={<EditIcon />} variant="outlined" onClick={() => alert('計画編集モード(モックアップ): 各問題点カードの編集から編集できます')}>
            計画編集
          </Button>
          <Button
            startIcon={<AssessmentIcon />}
            variant="contained"
            onClick={() => navigate(`/care-plan/patients/${patient.id}/evaluate`)}
          >
            評価する
          </Button>
          <Button startIcon={<PrintIcon />} onClick={() => alert('印刷プレビュー(未実装)')}>印刷</Button>
          <Button startIcon={<HistoryIcon />} onClick={() => alert('履歴ビュー(未実装)')}>履歴を見る</Button>
          <Button startIcon={<SyncAltIcon />} onClick={() => alert('新計画作成(長期目標見直し)(未実装)')}>新計画に切替</Button>
        </Stack>
      </Paper>

      {/* 長期目標 */}
      <Card variant="outlined" sx={{ mb: 1.5 }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Typography variant="caption" color="text.secondary">長期目標</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
            {carePlan.longTermGoal}
          </Typography>
          <Stack direction="row" spacing={2}>
            <Typography variant="caption" color="text.secondary">立案日: {formatJPDate(carePlan.createdAt)}</Typography>
            <Typography variant="caption" color="text.secondary">立案者: {planAuthor}</Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* 問題点 */}
      <Box sx={{ mb: 1 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1">問題点 ({problemItems.length}件)</Typography>
          <Box sx={{ flex: 1 }} />
          <Button size="small" startIcon={<FileCopyIcon />} onClick={() => setCopyOpen(true)}>
            引用コピー
          </Button>
          <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setEditDialog({ mode: 'create' })}>
            問題点追加
          </Button>
        </Stack>
        <Divider sx={{ mb: 1 }} />
        {problemItems.map((it, idx) => (
          <ProblemItemCard
            key={it.id}
            item={it}
            index={idx}
            onEdit={() => setEditDialog({ mode: 'edit', itemId: it.id })}
            onEvaluate={() => navigate(`/care-plan/patients/${patient.id}/evaluate`)}
            onDetail={() => setEditDialog({ mode: 'edit', itemId: it.id })}
          />
        ))}
        {problemItems.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            問題点はまだ登録されていません
          </Typography>
        )}
      </Box>

      <ProblemItemEditDialog
        open={editDialog !== null}
        mode={editDialog?.mode ?? 'create'}
        initial={editingItem}
        onClose={() => setEditDialog(null)}
        onSubmit={(draft, saveAs) => {
          if (editDialog?.mode === 'edit') {
            updateProblemItem(editDialog.itemId, {
              domain: draft.domain,
              priority: draft.priority,
              nandaCode: draft.nandaCode,
              shortTermGoal: draft.shortTermGoal,
              ote: draft.ote,
              status: saveAs === 'active' ? 'active' : 'draft',
            });
          } else {
            addProblemItem(carePlan.id, {
              domain: draft.domain,
              priority: draft.priority,
              nandaCode: draft.nandaCode,
              shortTermGoal: draft.shortTermGoal,
              ote: draft.ote,
              status: saveAs === 'active' ? 'active' : 'draft',
            });
          }
          setEditDialog(null);
        }}
        onClose_={editDialog?.mode === 'edit'
          ? (status, reason) => {
              closeProblemItem(editDialog.itemId, reason, status);
              setEditDialog(null);
            }
          : undefined
        }
      />

      <CopyFromDialog
        open={copyOpen}
        onClose={() => setCopyOpen(false)}
        targetCarePlanId={carePlan.id}
        allowLongTermGoalCopy={false}
      />
    </Container>
  );
};

export default PatientCarePlan;

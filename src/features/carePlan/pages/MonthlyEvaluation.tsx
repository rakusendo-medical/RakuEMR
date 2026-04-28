import React, { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Container, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, Paper, Stack, Typography,
} from '@mui/material';
import {
  Save as SaveIcon, CheckCircle as CheckCircleIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';
import { useNursingRecordStore } from '../../../stores/useNursingRecordStore';
import { useAppStore } from '../../../stores/useAppStore';
import { useNavigate, useParams } from 'react-router-dom';
import PatientHeader from '../components/PatientHeader';
import EvaluationForm, { type EvaluationDraft } from '../components/EvaluationForm';
import StatusChip from '../components/StatusChip';
import PriorityChip from '../components/PriorityChip';
import { useCarePlanStore, formatJPDate } from '../store';
import { TODAY } from '../mockData';

const MonthlyEvaluation: React.FC = () => {
  const { patientId = '' } = useParams();
  const navigate = useNavigate();

  const patient = useCarePlanStore((s) => s.patients.find((p) => p.id === patientId));
  const carePlan = useCarePlanStore((s) =>
    s.carePlans.find((p) => p.patientId === patientId && p.status !== 'closed')
  );
  const problemItems = useCarePlanStore((s) =>
    carePlan ? s.problemItems.filter((pi) => pi.carePlanId === carePlan.id && !pi.status.startsWith('closed')) : []
  );
  const evaluations = useCarePlanStore((s) => s.evaluations);
  const nanda = useCarePlanStore((s) => s.nandaMaster);
  const currentNurseId = useCarePlanStore((s) => s.currentNurseId);
  const currentNurseName = useCarePlanStore(
    (s) => s.nurses.find((n) => n.id === s.currentNurseId)?.name ?? ''
  );
  const createEvaluation = useCarePlanStore((s) => s.createEvaluation);

  const addNursingRecord = useNursingRecordStore((s) => s.addRecord);
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  const [drafts, setDrafts] = useState<Record<string, EvaluationDraft>>({});
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [savedDrafts, setSavedDrafts] = useState<Record<string, EvaluationDraft>>({});

  const latestEvals = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    problemItems.forEach((pi) => {
      const pastEvs = evaluations
        .filter((ev) => ev.problemItemId === pi.id)
        .sort((a, b) => a.evaluatedAt.localeCompare(b.evaluatedAt));
      const last = pastEvs[pastEvs.length - 1];
      if (last) {
        const achievement =
          last.achievement === 'achieved' ? '達成'
            : last.achievement === 'partial' ? '一部達成'
              : '未達';
        map[pi.id] = `(${formatJPDate(last.evaluatedAt)}) ${achievement} / ${last.findings}`;
      }
    });
    return map;
  }, [problemItems, evaluations]);

  if (!patient) {
    return <Typography>患者が見つかりません</Typography>;
  }
  if (!carePlan) {
    return (
      <Container maxWidth="xl" disableGutters>
        <PatientHeader patient={patient} />
        <Alert severity="info">評価対象となる看護計画がありません。</Alert>
      </Container>
    );
  }

  const getDraft = (id: string): EvaluationDraft =>
    drafts[id] ?? { achievement: 'partial', findings: '', nextStatus: 'active' };

  const setDraft = (id: string, next: EvaluationDraft) =>
    setDrafts((d) => ({ ...d, [id]: next }));

  const buildTransferText = (targetDrafts: Record<string, EvaluationDraft>): string => {
    const achievementLabel = (a: string) =>
      a === 'achieved' ? '達成' : a === 'partial' ? '一部達成' : '未達';
    const lines = [
      `【看護過程月次評価】`,
      `評価日: ${formatJPDate(TODAY)}　評価者: ${currentNurseName}`,
      `長期目標: ${carePlan?.longTermGoal ?? '—'}`,
      '',
    ];
    problemItems.forEach((pi, idx) => {
      const d = targetDrafts[pi.id];
      if (!d) return;
      const diagName = nanda.find((n) => n.code === pi.nandaCode)?.name ?? pi.nandaCode;
      lines.push(`■ 看護計画${idx + 1}: ${diagName}`);
      lines.push(`  目標: ${pi.shortTermGoal}`);
      lines.push(`  達成度: ${achievementLabel(d.achievement)}`);
      if (d.findings) lines.push(`  所見: ${d.findings}`);
      lines.push('');
    });
    return lines.join('\n');
  };

  const handleSubmit = () => {
    const savedSnapshot = { ...drafts };
    problemItems.forEach((pi) => {
      const d = drafts[pi.id];
      if (!d) return;
      createEvaluation(pi.id, {
        evaluatedAt: TODAY,
        achievement: d.achievement,
        findings: d.findings,
        nextStatus: d.nextStatus,
      });
    });
    setSavedDrafts(savedSnapshot);
    setTransferDialogOpen(true);
  };

  const handleTransfer = () => {
    const content = buildTransferText(savedDrafts);
    addNursingRecord({
      patientId: patient?.id ?? '',
      date: TODAY,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      author: currentNurseName,
      content,
    });
    setTransferDialogOpen(false);
    showSnackbar('評価結果を看護記録に転記しました', 'success');
    navigate(`/care-plan/patients/${patient?.id}`);
  };

  const filledCount = problemItems.filter((pi) => drafts[pi.id] !== undefined).length;

  return (
    <Container maxWidth="xl" disableGutters>
      <PatientHeader patient={patient} title="看護過程 月次評価" />

      <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, bgcolor: '#f8fafc' }}>
        <Stack direction="row" spacing={3}>
          <Box><Typography variant="caption" color="text.secondary">評価日</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatJPDate(TODAY)}</Typography>
          </Box>
          <Box><Typography variant="caption" color="text.secondary">評価者</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{currentNurseName}</Typography>
          </Box>
          <Box><Typography variant="caption" color="text.secondary">長期目標</Typography>
            <Typography variant="body2">{carePlan.longTermGoal}</Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Box><Typography variant="caption" color="text.secondary">入力状況</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {filledCount} / {problemItems.length} 件
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Stack spacing={1.5}>
        {problemItems.map((pi, idx) => {
          const diagName = nanda.find((n) => n.code === pi.nandaCode)?.name ?? pi.nandaCode;
          const draft = getDraft(pi.id);
          return (
            <Card key={pi.id} variant="outlined">
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <Typography variant="subtitle1">看護計画 {idx + 1} / {problemItems.length}</Typography>
                  <StatusChip status={pi.status} />
                  <PriorityChip priority={pi.priority} />
                </Stack>
                <Divider sx={{ mb: 1 }} />
                <Box sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">看護診断</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    #{idx + 1} {diagName} ({pi.nandaCode})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">短期目標</Typography>
                  <Typography variant="body2">{pi.shortTermGoal}</Typography>
                </Box>
                <EvaluationForm
                  value={draft}
                  onChange={(v) => setDraft(pi.id, v)}
                  previousSummary={latestEvals[pi.id]}
                />
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <Paper variant="outlined" sx={{ p: 1.5, mt: 2, position: 'sticky', bottom: 0, bgcolor: 'background.paper' }}>
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button startIcon={<SaveIcon />} onClick={() => alert('一時保存しました(モック)')}>
            一時保存
          </Button>
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon />}
            disabled={filledCount === 0}
            onClick={handleSubmit}
          >
            すべて保存して評価完了 ({filledCount}件)
          </Button>
        </Stack>
      </Paper>

      {/* 看護記録転記確認ダイアログ */}
      <Dialog open={transferDialogOpen} onClose={() => { setTransferDialogOpen(false); navigate(`/care-plan/patients/${patient?.id}`); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ArticleIcon color="primary" />
          評価が完了しました
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1 }}>
            評価結果を看護記録にも転記しますか？
          </Typography>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f8fafc', maxHeight: 280, overflow: 'auto' }}>
            <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {buildTransferText(savedDrafts)}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setTransferDialogOpen(false); navigate(`/care-plan/patients/${patient?.id}`); }}>
            転記しない
          </Button>
          <Button variant="contained" startIcon={<ArticleIcon />} onClick={handleTransfer}>
            看護記録に転記する
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default MonthlyEvaluation;

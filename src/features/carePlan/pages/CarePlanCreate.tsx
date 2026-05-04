import React, { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Card, CardContent, Chip, Collapse, Container, Paper,
  Stack, Step, StepLabel, Stepper, TextField, Typography,
} from '@mui/material';
import {
  Add as AddIcon, FileCopy as FileCopyIcon, Save as SaveIcon, PlayArrow as PlayArrowIcon,
  LightbulbOutlined as LightbulbIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import PatientHeader from '../components/PatientHeader';
import ProblemItemCard from '../components/ProblemItemCard';
import ProblemItemEditDialog from '../components/ProblemItemEditDialog';
import CopyFromDialog from '../components/CopyFromDialog';
import { useCarePlanStore } from '../store';

const STEPS = ['長期目標を入力', '看護計画を追加', '立案確定'];

interface Props {
  /** カルテ画面に埋め込む際は true。PatientHeader を出さず、立案確定後も画面遷移しない */
  embedded?: boolean;
  patientId?: string;
  /** embedded 時、立案確定後に親へ通知して PatientCarePlan ビューへ遷移させる */
  onActivated?: () => void;
}

const CarePlanCreate: React.FC<Props> = ({ embedded = false, patientId: patientIdProp, onActivated }) => {
  const params = useParams();
  const patientId = patientIdProp ?? params.patientId ?? '';
  const navigate = useNavigate();
  const patient = useCarePlanStore((s) => s.patients.find((p) => p.id === patientId));
  const existingPlan = useCarePlanStore((s) =>
    s.carePlans.find((p) => p.patientId === patientId && p.status !== 'closed')
  );
  const createCarePlan = useCarePlanStore((s) => s.createCarePlan);
  const updateLongTermGoal = useCarePlanStore((s) => s.updateLongTermGoal);
  const addProblemItem = useCarePlanStore((s) => s.addProblemItem);
  const updateProblemItem = useCarePlanStore((s) => s.updateProblemItem);
  const activateCarePlan = useCarePlanStore((s) => s.activateCarePlan);

  // 画面内で編集対象となる計画ID。未作成なら null。
  const [planId, setPlanId] = useState<string | null>(
    existingPlan?.status === 'draft' ? existingPlan.id : null
  );
  const [longTermGoal, setLongTermGoal] = useState<string>(
    existingPlan?.status === 'draft' ? existingPlan.longTermGoal : ''
  );
  const [editDialog, setEditDialog] = useState<
    { mode: 'create' } | { mode: 'edit'; itemId: string } | null
  >(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const templates = useCarePlanStore((s) => s.templates);

  const draftItems = useCarePlanStore((s) =>
    planId ? s.problemItems.filter((pi) => pi.carePlanId === planId) : []
  );

  const activeStep = useMemo(() => {
    if (!longTermGoal.trim() && draftItems.length === 0) return 0;
    if (draftItems.length === 0) return 1;
    return 2;
  }, [longTermGoal, draftItems]);

  if (!patient) {
    return <Typography>患者が見つかりません</Typography>;
  }

  // 期間モデルでは新規期間立案で前計画を自動クローズするため、active 計画存在を理由にブロックしない
  // （embedded mode = 計画なしでの立案 / standalone mode = 「+ 新規期間で計画立案」からの遷移）
  // 既存 draft plan がある場合は planId 初期値で resume される（上記 useState 参照）

  const ensurePlan = (): string => {
    if (planId) return planId;
    const plan = createCarePlan(patient.id, longTermGoal || '(未入力)');
    setPlanId(plan.id);
    return plan.id;
  };

  const handleSaveDraft = () => {
    const id = ensurePlan();
    updateLongTermGoal(id, longTermGoal);
    alert('下書き保存しました(モック)');
  };

  const handleConfirm = () => {
    if (!longTermGoal.trim()) {
      alert('長期目標を入力してください');
      return;
    }
    if (draftItems.length === 0) {
      alert('少なくとも1件の看護計画を追加してください');
      return;
    }
    const id = ensurePlan();
    updateLongTermGoal(id, longTermGoal);
    activateCarePlan(id);
    if (embedded) {
      onActivated?.();
    } else {
      navigate(`/care-plan/patients/${patient.id}`);
    }
  };

  const editingItem = editDialog?.mode === 'edit'
    ? draftItems.find((pi) => pi.id === editDialog.itemId)
    : undefined;

  return (
    <Container maxWidth="xl" disableGutters>
      {!embedded && <PatientHeader patient={patient} title="新規看護過程立案" />}
      <Stepper activeStep={activeStep} sx={{ mb: 2 }}>
        {STEPS.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {/* Step 1: 長期目標 */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>ステップ 1: 長期目標</Typography>
          <TextField
            fullWidth multiline minRows={2}
            placeholder="例: 服薬自己管理ができ、自宅退院を目指す"
            value={longTermGoal}
            onChange={(e) => setLongTermGoal(e.target.value)}
          />
          <Box sx={{ mt: 1 }}>
            <Button
              size="small"
              startIcon={<LightbulbIcon />}
              endIcon={templateOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setTemplateOpen((v) => !v)}
              sx={{ color: 'text.secondary' }}
            >
              テンプレートから選択
            </Button>
            <Collapse in={templateOpen}>
              <Box sx={{ mt: 1, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  選択するとテキストが挿入されます
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {templates.map((t) => (
                    <Chip
                      key={t.id}
                      label={t.name}
                      size="small"
                      variant="outlined"
                      clickable
                      onClick={() => { setLongTermGoal(t.longTermGoal); setTemplateOpen(false); }}
                      sx={{ mb: 0.5 }}
                    />
                  ))}
                </Stack>
                {templates.map((t) => (
                  <Typography key={t.id} variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    <strong>{t.name}:</strong> {t.longTermGoal}
                  </Typography>
                ))}
              </Box>
            </Collapse>
          </Box>
        </CardContent>
      </Card>

      {/* Step 2: 看護計画 */}
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle1">ステップ 2: 看護計画 ({draftItems.length}件)</Typography>
            <Box sx={{ flex: 1 }} />
            <Button size="small" startIcon={<FileCopyIcon />} onClick={() => { ensurePlan(); setCopyOpen(true); }}>
              引用コピー
            </Button>
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => { ensurePlan(); setEditDialog({ mode: 'create' }); }}>
              看護計画追加
            </Button>
          </Stack>
          {draftItems.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              「看護計画追加」または「引用コピー」から追加してください
            </Typography>
          )}
          {draftItems.map((it, idx) => (
            <ProblemItemCard
              key={it.id}
              item={it}
              displayNumber={idx + 1}
              compact
              onEdit={() => setEditDialog({ mode: 'edit', itemId: it.id })}
            />
          ))}
        </CardContent>
      </Card>

      {/* Step 3: 立案確定 */}
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>ステップ 3: 立案確定</Typography>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<SaveIcon />} onClick={handleSaveDraft}>下書き保存</Button>
          <Button
            startIcon={<PlayArrowIcon />}
            variant="contained"
            disabled={!longTermGoal.trim() || draftItems.length === 0}
            onClick={handleConfirm}
          >
            立案確定
          </Button>
        </Stack>
      </Paper>

      <ProblemItemEditDialog
        open={editDialog !== null}
        mode={editDialog?.mode ?? 'create'}
        initial={editingItem}
        onClose={() => setEditDialog(null)}
        onSubmit={(draft, saveAs) => {
          const id = ensurePlan();
          if (editDialog?.mode === 'edit') {
            updateProblemItem(editDialog.itemId, {
              domain: draft.domain,
              priority: draft.priority,
              nandaCode: draft.nandaCode,
              problemStatement: draft.problemStatement,
              shortTermGoal: draft.shortTermGoal,
              ote: draft.ote,
              diagnosedAt: draft.diagnosedAt || undefined,
              status: saveAs === 'active' ? 'active' : 'draft',
            });
          } else {
            addProblemItem(id, {
              domain: draft.domain,
              priority: draft.priority,
              nandaCode: draft.nandaCode,
              problemStatement: draft.problemStatement,
              shortTermGoal: draft.shortTermGoal,
              ote: draft.ote,
              diagnosedAt: draft.diagnosedAt || undefined,
              status: 'draft',
            });
          }
          setEditDialog(null);
        }}
      />

      {planId && (
        <CopyFromDialog
          open={copyOpen}
          onClose={() => setCopyOpen(false)}
          targetCarePlanId={planId}
          allowLongTermGoalCopy={true}
        />
      )}
    </Container>
  );
};

export default CarePlanCreate;

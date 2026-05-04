import React, { useMemo, useState } from 'react';
import {
  Box, Button, Card, CardContent, Container, FormControl, InputLabel, MenuItem,
  Paper, Select, Stack, Typography,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Assessment as AssessmentIcon,
  Print as PrintIcon, History as HistoryIcon,
  FileCopy as FileCopyIcon, UnfoldMore as UnfoldMoreIcon, UnfoldLess as UnfoldLessIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import PatientHeader from '../components/PatientHeader';
import ProblemItemCard from '../components/ProblemItemCard';
import ProblemItemEditDialog from '../components/ProblemItemEditDialog';
import CarePlanEditDialog from '../components/CarePlanEditDialog';
import CopyFromDialog from '../components/CopyFromDialog';
import PrintLayout from '../components/PrintLayout';
import DiagnosisHistoryDialog from '../components/DiagnosisHistoryDialog';
import CarePlanCreate from './CarePlanCreate';
import SectionHeader from '../../../components/common/SectionHeader';
import { useCarePlanStore, formatJPDate } from '../store';
import type { Priority, ProblemItem } from '../types';

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

interface Props {
  /** カルテ画面に埋め込む際は false にして PatientHeader を非表示にする */
  embedded?: boolean;
  /** :patientId をルートから取得しない場合に直接渡す */
  patientId?: string;
}

const PatientCarePlan: React.FC<Props> = ({ embedded = false, patientId: patientIdProp }) => {
  const params = useParams();
  const navigate = useNavigate();
  const patientId = patientIdProp ?? params.patientId ?? '';
  const patient = useCarePlanStore((s) => s.patients.find((p) => p.id === patientId));

  // 当該患者の全計画を「期間開始日」降順で取得（最新期間が先頭）
  const allCarePlans = useCarePlanStore((s) =>
    s.carePlans
      .filter((p) => p.patientId === patientId)
      .slice()
      .sort((a, b) => {
        const aStart = a.periodStart ?? a.createdAt;
        const bStart = b.periodStart ?? b.createdAt;
        return bStart.localeCompare(aStart);
      })
  );

  // 表示対象期間: 初期は最新（active 優先 → 先頭）。ユーザー切替で変更可
  const initialPlanId = allCarePlans.find((p) => p.status !== 'closed')?.id
    ?? allCarePlans[0]?.id;
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>(initialPlanId);

  // 患者切替時に選択をリセット
  React.useEffect(() => {
    setSelectedPlanId(initialPlanId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const carePlan = allCarePlans.find((p) => p.id === selectedPlanId);

  const allItems = useCarePlanStore((s) =>
    carePlan ? s.problemItems.filter((pi) => pi.carePlanId === carePlan.id) : []
  );
  const nurses = useCarePlanStore((s) => s.nurses);
  const addProblemItem = useCarePlanStore((s) => s.addProblemItem);
  const updateProblemItem = useCarePlanStore((s) => s.updateProblemItem);
  const closeProblemItem = useCarePlanStore((s) => s.closeProblemItem);
  const updateCarePlanMeta = useCarePlanStore((s) => s.updateCarePlanMeta);

  const [editDialog, setEditDialog] = useState<
    { mode: 'create' } | { mode: 'edit'; itemId: string } | null
  >(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [planEditOpen, setPlanEditOpen] = useState(false);
  // セクションごとの折りたたみ状態 (デフォルト全開)
  const [sectionOpen, setSectionOpen] = useState({
    longTermGoal: true,
    active: true,
    closed: true,
  });
  // 各看護計画カードの展開状態
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const planAuthor = useMemo(
    () => nurses.find((n) => n.id === carePlan?.createdBy)?.name ?? '—',
    [nurses, carePlan]
  );

  const numbered = useMemo(() => {
    return allItems
      .slice()
      .sort((a, b) => (a.createdAt + a.id).localeCompare(b.createdAt + b.id))
      .map((item, idx) => ({ item, no: idx + 1 }));
  }, [allItems]);

  const activeItems = useMemo(() => {
    return numbered
      .filter(({ item }) => !item.status.startsWith('closed'))
      .sort((a, b) => {
        const pr = PRIORITY_RANK[a.item.priority] - PRIORITY_RANK[b.item.priority];
        return pr !== 0 ? pr : a.no - b.no;
      });
  }, [numbered]);

  const closedItems = useMemo(() => {
    return numbered
      .filter(({ item }) => item.status.startsWith('closed'))
      .sort((a, b) => {
        const aClosed = a.item.closedAt ?? '';
        const bClosed = b.item.closedAt ?? '';
        return bClosed.localeCompare(aClosed);
      });
  }, [numbered]);

  const allCardsOpen = numbered.length > 0 && numbered.every(({ item }) => openMap[item.id]);
  const setAllCards = (open: boolean) => {
    const next: Record<string, boolean> = {};
    numbered.forEach(({ item }) => { next[item.id] = open; });
    setOpenMap(next);
  };
  const toggleOne = (id: string) => setOpenMap((m) => ({ ...m, [id]: !m[id] }));

  if (!patient) {
    return <Typography>患者が見つかりません</Typography>;
  }

  if (!carePlan) {
    return (
      <Container maxWidth="xl" disableGutters>
        {!embedded && <PatientHeader patient={patient} title="新規看護過程立案" />}
        <CarePlanCreate embedded patientId={patient.id} />
      </Container>
    );
  }

  const editingItem = editDialog?.mode === 'edit'
    ? allItems.find((pi) => pi.id === editDialog.itemId)
    : undefined;

  const renderCard = ({ item, no }: { item: ProblemItem; no: number }, opts?: { dimmed?: boolean }) => (
    <ProblemItemCard
      key={item.id}
      item={item}
      displayNumber={no}
      expanded={!!openMap[item.id]}
      onToggle={() => toggleOne(item.id)}
      dimmed={opts?.dimmed}
      onEdit={() => setEditDialog({ mode: 'edit', itemId: item.id })}
    />
  );

  return (
    <>
      <Container maxWidth="xl" disableGutters className="care-plan-screen">
        {!embedded && <PatientHeader patient={patient} />}

        {/* 操作バー */}
        <Paper
          variant="outlined"
          sx={{ p: 1, mb: 1.5, border: '1px solid #1e3a5f' }}
          className="no-print"
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            {/* 期間プルダウン: 当該患者の全期間を時系列降順で表示。「+ 新規期間で計画立案」で /create に遷移 */}
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel>期間</InputLabel>
              <Select
                label="期間"
                value={selectedPlanId ?? '__new__'}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '__new__') {
                    navigate(`/care-plan/patients/${patient.id}/create`);
                  } else {
                    setSelectedPlanId(v);
                  }
                }}
              >
                {allCarePlans.map((p) => {
                  const start = p.periodStart ?? p.createdAt;
                  const endLabel = p.periodEnd ? formatJPDate(p.periodEnd) : '継続中';
                  const statusLabel = p.status === 'closed' ? '（クローズ）'
                    : p.status === 'draft' ? '（下書き）'
                    : '';
                  return (
                    <MenuItem key={p.id} value={p.id}>
                      {formatJPDate(start)} - {endLabel} {statusLabel}
                    </MenuItem>
                  );
                })}
                <MenuItem value="__new__" sx={{ fontStyle: 'italic', color: 'primary.main' }}>
                  + 新規期間で計画立案
                </MenuItem>
              </Select>
            </FormControl>
            <Button startIcon={<EditIcon />} variant="outlined" onClick={() => setPlanEditOpen(true)}>
              看護過程を編集
            </Button>
            <Button startIcon={<PrintIcon />} onClick={() => window.print()}>印刷</Button>
            <Button startIcon={<HistoryIcon />} onClick={() => setHistoryOpen(true)}>過去診断を参照</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              startIcon={<AssessmentIcon />}
              variant="contained"
              onClick={() => navigate(`/care-plan/patients/${patient.id}/evaluate`)}
            >
              評価する
            </Button>
          </Stack>
        </Paper>

        {/* 長期目標 */}
        <Card sx={{ border: '1px solid #1e3a5f', boxShadow: 'none', mb: 1.5 }}>
          <SectionHeader
            title="長期目標"
            open={sectionOpen.longTermGoal}
            onToggle={() => setSectionOpen((s) => ({ ...s, longTermGoal: !s.longTermGoal }))}
          />
          {sectionOpen.longTermGoal && (
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {carePlan.longTermGoal}
              </Typography>
              <Stack direction="row" spacing={2} sx={{ color: 'text.secondary' }}>
                <Typography variant="body2">立案日: {formatJPDate(carePlan.createdAt)}</Typography>
                <Typography variant="body2">立案者: {planAuthor}</Typography>
              </Stack>
            </CardContent>
          )}
        </Card>

        {/* 看護計画 (有効) */}
        <Card sx={{ border: '1px solid #1e3a5f', boxShadow: 'none', mb: 1.5 }} className="no-print">
          <SectionHeader
            title={`看護計画 (${activeItems.length}件)`}
            open={sectionOpen.active}
            onToggle={() => setSectionOpen((s) => ({ ...s, active: !s.active }))}
          />
          {sectionOpen.active && (
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack direction="row" spacing={1} sx={{ mb: 1.25 }}>
                <Box sx={{ flex: 1 }} />
                <Button
                  size="small"
                  startIcon={allCardsOpen ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
                  onClick={() => setAllCards(!allCardsOpen)}
                  disabled={numbered.length === 0}
                >
                  {allCardsOpen ? 'すべて折りたたむ' : 'すべて展開'}
                </Button>
                <Button size="small" startIcon={<FileCopyIcon />} onClick={() => setCopyOpen(true)}>
                  引用コピー
                </Button>
                <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => setEditDialog({ mode: 'create' })}>
                  看護計画追加
                </Button>
              </Stack>
              {activeItems.map((row) => renderCard(row))}
              {activeItems.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  有効な看護計画はまだ登録されていません
                </Typography>
              )}
            </CardContent>
          )}
        </Card>

        {/* 解決済み */}
        {closedItems.length > 0 && (
          <Card sx={{ border: '1px solid #94a3b8', boxShadow: 'none', mb: 1.5 }} className="no-print">
            <SectionHeader
              title={`解決済み (${closedItems.length}件)`}
              color="#64748b"
              open={sectionOpen.closed}
              onToggle={() => setSectionOpen((s) => ({ ...s, closed: !s.closed }))}
            />
            {sectionOpen.closed && (
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                {closedItems.map((row) => renderCard(row, { dimmed: true }))}
              </CardContent>
            )}
          </Card>
        )}

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
                problemStatement: draft.problemStatement,
                shortTermGoal: draft.shortTermGoal,
                ote: draft.ote,
                diagnosedAt: draft.diagnosedAt || undefined,
                status: saveAs === 'active' ? 'active' : 'draft',
              });
            } else {
              addProblemItem(carePlan.id, {
                domain: draft.domain,
                priority: draft.priority,
                nandaCode: draft.nandaCode,
                problemStatement: draft.problemStatement,
                shortTermGoal: draft.shortTermGoal,
                ote: draft.ote,
                diagnosedAt: draft.diagnosedAt || undefined,
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

        <DiagnosisHistoryDialog
          open={historyOpen}
          patientId={patientId}
          onClose={() => setHistoryOpen(false)}
        />

        <CarePlanEditDialog
          open={planEditOpen}
          carePlan={carePlan}
          onClose={() => setPlanEditOpen(false)}
          onSubmit={(patch) => {
            updateCarePlanMeta(carePlan.id, patch);
            setPlanEditOpen(false);
          }}
        />
      </Container>

      <PrintLayout
        patient={patient}
        carePlan={carePlan}
        planAuthor={planAuthor}
        items={[...activeItems, ...closedItems]}
      />
    </>
  );
};

export default PatientCarePlan;

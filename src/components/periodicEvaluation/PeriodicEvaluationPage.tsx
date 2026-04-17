import React, { useState } from 'react';
import {
  Box, Paper, Typography, Chip, List, ListItemButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Select, MenuItem, FormControl, TextField, Checkbox,
  FormControlLabel, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Assessment, PersonOutline, CalendarToday,
  EditNote, AddCircleOutline,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { NURSING_PLANS, PERIODIC_EVALUATIONS } from '../../data/mockData';
import type { NursingPlan, PeriodicEvaluationRecord, EvaluationEntry } from '../../types';

// ───── 型 ─────

interface EvalDialogState {
  open: boolean;
  problemId: string;
  problemNo: number;
  problemName: string;
  stageIndex: number;
  stageDate: string;
  evaluationType: '評価' | 'A評価' | 'B評価';
  content: string;
  existingId: string | null;
}

// ───── ユーティリティ ─────

const getDueDateColor = (dueDate: string): 'error' | 'warning' | 'success' => {
  const diff = dayjs(dueDate).diff(dayjs(), 'day');
  if (diff < 0) return 'error';
  if (diff <= 5) return 'warning';
  return 'success';
};

const getDueDateLabel = (dueDate: string): string => {
  const diff = dayjs(dueDate).diff(dayjs(), 'day');
  if (diff < 0) return `${Math.abs(diff)}日超過`;
  if (diff === 0) return '本日';
  return `${diff}日後`;
};

// ───── 患者リストパネル ─────

const PatientListPanel: React.FC<{
  plans: NursingPlan[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}> = ({ plans, selectedId, onSelect }) => (
  <Paper
    variant="outlined"
    sx={{ width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
  >
    <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary">
        今月の評価対象（{plans.length}件）
      </Typography>
    </Box>
    <List sx={{ flex: 1, overflowY: 'auto', py: 0.5 }}>
      {plans.map((plan) => (
        <ListItemButton
          key={plan.patientId}
          selected={selectedId === plan.patientId}
          onClick={() => onSelect(plan.patientId)}
          sx={{ py: 1, px: 1.5, flexDirection: 'column', alignItems: 'flex-start' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%' }}>
            <PersonOutline sx={{ fontSize: 13, color: 'text.secondary' }} />
            <Typography variant="body2" fontWeight={600} noWrap>
              {plan.patientName}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25 }}>
            {plan.roomNumber}　{plan.doctorName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <CalendarToday sx={{ fontSize: 11, color: 'text.secondary' }} />
            <Chip
              label={getDueDateLabel(plan.nextEvaluationDue)}
              size="small"
              color={getDueDateColor(plan.nextEvaluationDue)}
              sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.75 } }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
              {dayjs(plan.nextEvaluationDue).format('M/D')}
            </Typography>
          </Box>
        </ListItemButton>
      ))}
    </List>
  </Paper>
);

// ───── 評価セル ─────

const EvalCell: React.FC<{
  entry: EvaluationEntry | undefined;
  applicable: boolean;
  onEdit: () => void;
}> = ({ entry, applicable, onEdit }) => {
  if (!applicable) {
    return (
      <TableCell
        align="center"
        sx={{ bgcolor: '#f8fafc', color: '#cbd5e1', fontSize: '0.75rem', py: 0.5 }}
      >
        —
      </TableCell>
    );
  }

  if (entry) {
    return (
      <TableCell sx={{ py: 0.5, verticalAlign: 'top' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              flex: 1,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {entry.content}
          </Typography>
          <IconButton size="small" onClick={onEdit} sx={{ p: 0.25, flexShrink: 0 }}>
            <EditNote sx={{ fontSize: 14, color: 'primary.main' }} />
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
          {entry.evaluator}　{entry.evaluatedAt}
        </Typography>
      </TableCell>
    );
  }

  return (
    <TableCell align="center" sx={{ py: 0.5 }}>
      <IconButton size="small" onClick={onEdit} sx={{ p: 0.25 }}>
        <AddCircleOutline sx={{ fontSize: 16, color: 'text.disabled' }} />
      </IconButton>
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontSize: '0.6rem' }}>
        未評価
      </Typography>
    </TableCell>
  );
};

// ───── メイン ─────

const PeriodicEvaluationPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showEvalItems, setShowEvalItems] = useState(true);

  // ローカルで評価データを管理（保存操作のシミュレーション）
  const [localEvals, setLocalEvals] = useState<Record<string, EvaluationEntry[]>>(
    Object.fromEntries(PERIODIC_EVALUATIONS.map((r) => [r.patientId, [...r.evaluations]]))
  );

  const [dialog, setDialog] = useState<EvalDialogState>({
    open: false,
    problemId: '',
    problemNo: 0,
    problemName: '',
    stageIndex: 0,
    stageDate: '',
    evaluationType: '評価',
    content: '',
    existingId: null,
  });

  const thisMonthPlans = NURSING_PLANS.filter((p) => {
    const due = dayjs(p.nextEvaluationDue);
    const now = dayjs();
    return due.year() === now.year() && due.month() === now.month();
  });

  const selectedPlan = NURSING_PLANS.find((p) => p.patientId === selectedId) ?? null;
  const selectedEvalRecord =
    PERIODIC_EVALUATIONS.find((r) => r.patientId === selectedId) ?? null;

  const currentEvals = selectedId ? (localEvals[selectedId] ?? []) : [];

  const getEntry = (problemId: string, stageIndex: number, evalType: '評価' | 'A評価' | 'B評価') =>
    currentEvals.find(
      (e) => e.problemId === problemId && e.stageIndex === stageIndex && e.evaluationType === evalType
    );

  const openDialog = (
    problemId: string,
    problemNo: number,
    problemName: string,
    stageIndex: number,
    stageDate: string,
    evalType: '評価' | 'A評価' | 'B評価'
  ) => {
    const existing = getEntry(problemId, stageIndex, evalType);
    setDialog({
      open: true,
      problemId,
      problemNo,
      problemName,
      stageIndex,
      stageDate,
      evaluationType: evalType,
      content: existing?.content ?? '',
      existingId: existing?.id ?? null,
    });
  };

  const handleSave = () => {
    if (!selectedId) return;
    const now = dayjs().format('YYYY/MM/DD');
    setLocalEvals((prev) => {
      const list = [...(prev[selectedId] ?? [])];
      if (dialog.existingId) {
        const idx = list.findIndex((e) => e.id === dialog.existingId);
        if (idx !== -1) list[idx] = { ...list[idx], content: dialog.content, evaluatedAt: now };
      } else {
        list.push({
          id: `E-${Date.now()}`,
          problemId: dialog.problemId,
          stageIndex: dialog.stageIndex,
          evaluationType: dialog.evaluationType,
          content: dialog.content,
          evaluator: '医師 太郎',
          evaluatedAt: now,
        });
      }
      return { ...prev, [selectedId]: list };
    });
    setDialog((d) => ({ ...d, open: false }));
  };

  const evalTypes: ('評価' | 'A評価' | 'B評価')[] = ['評価', 'A評価', 'B評価'];

  const STAGE_COL_WIDTH = 160;
  const LABEL_COL_WIDTH = 200;

  return (
    <Box sx={{ display: 'flex', gap: 1.5, height: '100%', minHeight: 0 }}>
      <PatientListPanel
        plans={thisMonthPlans}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {selectedPlan && selectedEvalRecord ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, overflow: 'hidden' }}>
          {/* コントロール行 */}
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" noWrap>期間</Typography>
                <FormControl size="small">
                  <Select value="current" sx={{ fontSize: '0.8125rem', minWidth: 180 }}>
                    <MenuItem value="current">{selectedEvalRecord.periodStart} 〜 現在</MenuItem>
                  </Select>
                </FormControl>
                <Button size="small" variant="outlined" sx={{ minWidth: 0 }}>表示</Button>
                <Button size="small" variant="outlined" sx={{ minWidth: 0 }}>印刷</Button>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography variant="caption" color="text.secondary" noWrap>長期目標</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedEvalRecord.longTermGoal}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" noWrap>表示ステージ数</Typography>
                <TextField
                  size="small"
                  type="number"
                  defaultValue={selectedEvalRecord.displayStageCount}
                  sx={{ width: 56 }}
                  inputProps={{ min: 1, max: 6, style: { fontSize: '0.8125rem', padding: '4px 8px' } }}
                />
                <Button size="small" variant="outlined" sx={{ minWidth: 0 }}>適用</Button>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={showEvalItems}
                    onChange={(e) => setShowEvalItems(e.target.checked)}
                    sx={{ p: 0.5 }}
                  />
                }
                label={
                  <Typography variant="caption">評価項目表示</Typography>
                }
                sx={{ m: 0 }}
              />
            </Box>
          </Paper>

          {/* 評価グリッド */}
          <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader sx={{ tableLayout: 'fixed', minWidth: LABEL_COL_WIDTH + STAGE_COL_WIDTH * selectedEvalRecord.displayStageCount }}>
              <TableHead>
                {/* ステージヘッダ */}
                <TableRow>
                  <TableCell
                    sx={{
                      width: LABEL_COL_WIDTH,
                      bgcolor: '#1e3a5f',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      borderRight: '1px solid #334155',
                    }}
                  >
                    問題・評価項目
                  </TableCell>
                  {selectedEvalRecord.stages.slice(0, selectedEvalRecord.displayStageCount).map((stage, i) => (
                    <TableCell
                      key={i}
                      align="center"
                      sx={{
                        width: STAGE_COL_WIDTH,
                        bgcolor: i === 0 ? '#1e40af' : '#334155',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        borderRight: '1px solid #475569',
                      }}
                    >
                      <Typography variant="caption" fontWeight={700} sx={{ color: '#fff', display: 'block' }}>
                        {i === 0 ? '当日（最新）' : `ステージ${i + 1}`}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#bfdbfe', fontSize: '0.6rem' }}>
                        {stage.date}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>

                {/* クリニカルパスステージ行 */}
                <TableRow>
                  <TableCell
                    sx={{
                      bgcolor: '#e8edf5',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRight: '1px solid #e2e8f0',
                      py: 0.75,
                    }}
                  >
                    クリニカルパスステージ
                  </TableCell>
                  {selectedEvalRecord.stages.slice(0, selectedEvalRecord.displayStageCount).map((stage, i) => (
                    <TableCell
                      key={i}
                      align="center"
                      sx={{ bgcolor: '#f0f4ff', fontSize: '0.75rem', borderRight: '1px solid #e2e8f0', py: 0.75 }}
                    >
                      {stage.clinicalPathStage}
                    </TableCell>
                  ))}
                </TableRow>

                {/* ステージ行 */}
                <TableRow>
                  <TableCell
                    sx={{
                      bgcolor: '#e8edf5',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      borderRight: '1px solid #e2e8f0',
                      py: 0.75,
                    }}
                  >
                    ステージ
                  </TableCell>
                  {selectedEvalRecord.stages.slice(0, selectedEvalRecord.displayStageCount).map((stage, i) => (
                    <TableCell
                      key={i}
                      align="center"
                      sx={{ bgcolor: '#f0f4ff', fontSize: '0.75rem', borderRight: '1px solid #e2e8f0', py: 0.75 }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {stage.stageLabel}
                        </Typography>
                        <Chip
                          label="[-]"
                          size="small"
                          variant="outlined"
                          sx={{ height: 16, fontSize: '0.6rem', '& .MuiChip-label': { px: 0.5 } }}
                        />
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {selectedPlan.problems.map((problem) => (
                  <React.Fragment key={problem.id}>
                    {/* 問題ヘッダ行 */}
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell
                        colSpan={selectedEvalRecord.displayStageCount + 1}
                        sx={{ py: 0.75, borderBottom: '1px solid #e2e8f0' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                          <Typography
                            variant="caption"
                            fontWeight={700}
                            sx={{ color: 'primary.main', fontSize: '0.8125rem' }}
                          >
                            #{problem.no}
                          </Typography>
                          <Typography variant="caption" fontWeight={600} sx={{ flex: 1, lineHeight: 1.5 }}>
                            {problem.problem.replace(/\n/g, '　')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', flexShrink: 0 }}>
                            立案日：{problem.planDate}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>

                    {/* 評価種別行 */}
                    {showEvalItems && evalTypes.map((evalType) => {
                      const typeColor: Record<string, string> = {
                        '評価': '#dbeafe',
                        'A評価': '#dcfce7',
                        'B評価': '#fef9c3',
                      };
                      return (
                        <TableRow key={evalType} hover>
                          <TableCell
                            sx={{
                              pl: 3,
                              py: 0.5,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              bgcolor: typeColor[evalType],
                              borderRight: '1px solid #e2e8f0',
                              width: LABEL_COL_WIDTH,
                            }}
                          >
                            {evalType}
                          </TableCell>
                          {selectedEvalRecord.stages
                            .slice(0, selectedEvalRecord.displayStageCount)
                            .map((stage, i) => {
                              const applicable = dayjs(problem.planDate.replace(/\//g, '-')).isBefore(
                                dayjs(stage.date.replace(/\//g, '-')).add(1, 'day')
                              );
                              const entry = getEntry(problem.id, i, evalType);
                              return (
                                <EvalCell
                                  key={i}
                                  entry={entry}
                                  applicable={applicable}
                                  onEdit={() =>
                                    openDialog(
                                      problem.id,
                                      problem.no,
                                      problem.problem,
                                      i,
                                      stage.date,
                                      evalType
                                    )
                                  }
                                />
                              );
                            })}
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        <Paper
          variant="outlined"
          sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
            <Assessment sx={{ fontSize: 48, mb: 1, opacity: 0.25 }} />
            <Typography variant="body2">患者を選択してください</Typography>
          </Box>
        </Paper>
      )}

      {/* 評価入力ダイアログ */}
      <Dialog open={dialog.open} onClose={() => setDialog((d) => ({ ...d, open: false }))} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1, fontSize: '0.9375rem' }}>
          評価を入力
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`#${dialog.problemNo}`}
                size="small"
                color="primary"
              />
              <Chip
                label={dialog.evaluationType}
                size="small"
                color={dialog.evaluationType === '評価' ? 'primary' : dialog.evaluationType === 'A評価' ? 'success' : 'warning'}
              />
              <Chip label={dialog.stageDate} size="small" variant="outlined" />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {dialog.problemName}
            </Typography>
            <TextField
              label="評価内容"
              multiline
              rows={5}
              fullWidth
              size="small"
              value={dialog.content}
              onChange={(e) => setDialog((d) => ({ ...d, content: e.target.value }))}
              placeholder="評価内容を入力してください"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog((d) => ({ ...d, open: false }))}>キャンセル</Button>
          <Button variant="contained" onClick={handleSave} disabled={!dialog.content.trim()}>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PeriodicEvaluationPage;

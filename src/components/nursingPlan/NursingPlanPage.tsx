import React, { useState } from 'react';
import {
  Box, Paper, Typography, Chip, List, ListItemButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Button, Select, MenuItem, FormControl, Divider,
} from '@mui/material';
import {
  Assignment, PersonOutline, CalendarToday, Add,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { NURSING_PLANS } from '../../data/mockData';
import type { NursingPlan } from '../../types';

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

const NursingPlanPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const thisMonthPlans = NURSING_PLANS.filter((p) => {
    const due = dayjs(p.nextEvaluationDue);
    const now = dayjs();
    return due.year() === now.year() && due.month() === now.month();
  });

  const selectedPlan = NURSING_PLANS.find((p) => p.patientId === selectedId) ?? null;

  return (
    <Box sx={{ display: 'flex', gap: 1.5, height: '100%', minHeight: 0 }}>
      <PatientListPanel
        plans={thisMonthPlans}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {selectedPlan ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0, overflow: 'hidden' }}>
          {/* 期間・目標コントロール */}
          <Paper variant="outlined" sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" noWrap>期間</Typography>
                <FormControl size="small">
                  <Select value="current" sx={{ fontSize: '0.8125rem', minWidth: 180 }}>
                    <MenuItem value="current">{selectedPlan.periodStart} 〜 現在</MenuItem>
                  </Select>
                </FormControl>
                <Button size="small" variant="outlined" sx={{ minWidth: 0 }}>表示</Button>
                <Button size="small" variant="outlined" sx={{ minWidth: 0 }}>保守</Button>
                <Button size="small" variant="outlined" sx={{ minWidth: 0 }}>印刷</Button>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Typography variant="caption" color="text.secondary" noWrap>長期目標</Typography>
                <Typography variant="body2" fontWeight={600}>{selectedPlan.longTermGoal}</Typography>
              </Box>
            </Box>
          </Paper>

          {/* 問題一覧テーブル */}
          <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, overflow: 'auto' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{ width: 44, fontWeight: 700, bgcolor: '#dbeafe', fontSize: '0.75rem' }}
                  >
                    No
                  </TableCell>
                  <TableCell sx={{ width: 210, fontWeight: 700, bgcolor: '#dbeafe', fontSize: '0.75rem' }}>
                    問題点
                  </TableCell>
                  <TableCell sx={{ width: 160, fontWeight: 700, bgcolor: '#dbeafe', fontSize: '0.75rem' }}>
                    目標
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ width: 70, fontWeight: 700, bgcolor: '#dbeafe', fontSize: '0.75rem' }}
                  >
                    立案日
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, bgcolor: '#dbeafe', fontSize: '0.75rem' }}>
                    具体策（O・T・E）
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedPlan.problems.map((problem) => (
                  <TableRow key={problem.id} hover>
                    <TableCell align="center" sx={{ verticalAlign: 'top', pt: 1 }}>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{ color: 'primary.main', fontSize: '0.8125rem' }}
                      >
                        #{problem.no}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', pt: 1 }}>
                      <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {problem.problem}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', pt: 1 }}>
                      <Typography variant="caption" sx={{ lineHeight: 1.6 }}>
                        {problem.goal}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ verticalAlign: 'top', pt: 1 }}>
                      <Typography variant="caption">{problem.planDate}</Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', pt: 1 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Chip
                            label="O"
                            size="small"
                            color="primary"
                            sx={{ height: 16, width: 20, fontSize: '0.6rem', flexShrink: 0, '& .MuiChip-label': { px: 0.5 } }}
                          />
                          <Typography variant="caption" sx={{ lineHeight: 1.6 }}>
                            {problem.observation}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Chip
                            label="T"
                            size="small"
                            color="secondary"
                            sx={{ height: 16, width: 20, fontSize: '0.6rem', flexShrink: 0, '& .MuiChip-label': { px: 0.5 } }}
                          />
                          <Typography variant="caption" sx={{ lineHeight: 1.6 }}>
                            {problem.treatment}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Chip
                            label="E"
                            size="small"
                            sx={{
                              height: 16, width: 20, fontSize: '0.6rem', flexShrink: 0,
                              bgcolor: '#f59e0b', color: '#fff',
                              '& .MuiChip-label': { px: 0.5 },
                            }}
                          />
                          <Typography variant="caption" sx={{ lineHeight: 1.6 }}>
                            {problem.education}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 下部アクションボタン */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" startIcon={<Add />}>
              新規追加
            </Button>
            <Button size="small" variant="outlined">テンプレートより追加</Button>
            <Button size="small" variant="outlined">看護診断より追加</Button>
            <Button size="small" variant="outlined">並び替え</Button>
          </Box>
        </Box>
      ) : (
        <Paper
          variant="outlined"
          sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
            <Assignment sx={{ fontSize: 48, mb: 1, opacity: 0.25 }} />
            <Typography variant="body2">患者を選択してください</Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default NursingPlanPage;

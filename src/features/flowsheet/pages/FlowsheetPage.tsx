import React from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Paper, Typography, Stack, Chip, Link, Alert } from '@mui/material';
import { PATIENTS } from '../../../data/mockData';
import { useFlowsheetStore, getActivePatternForDate } from '../store';
import { TODAY } from '../mockData';

const FlowsheetPage: React.FC = () => {
  const { patientId = '' } = useParams<{ patientId: string }>();
  const patient = PATIENTS.find((p) => p.id === patientId);
  const patternMaster = useFlowsheetStore((s) => s.patternMaster);
  const applications = useFlowsheetStore((s) => s.patternApplications);
  const active = getActivePatternForDate(applications, patientId, TODAY);
  const activePattern = active?.patternId
    ? patternMaster.find((p) => p.id === active.patternId)
    : null;

  if (!patient) {
    return (
      <Alert severity="error">
        患者が見つかりません: {patientId}{' '}
        <Link component={RouterLink} to="/patients">入院患者一覧へ</Link>
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6">{patient.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {patient.age}歳 / {patient.gender === 'M' ? '男' : '女'} / {patient.roomNumber}-{patient.bedLabel}
          </Typography>
          <Chip
            size="small"
            label={activePattern ? `パターン: ${activePattern.name}` : 'パターンなし'}
            color={activePattern ? 'primary' : 'default'}
            variant="outlined"
          />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          フローシート画面（個別） — フェーズ 2 以降で実装。
        </Typography>
        <Typography variant="caption" color="text.disabled">
          us-17 フローシート表示 / us-18 フローシート編集 / us-19 サイン記載 /
          us-20 個別バイタル入力 / us-21 フローシートパターン /
          us-22 看護記録表示 / us-23 個別看護記録 を統合する起点画面。
        </Typography>
      </Paper>
    </Box>
  );
};

export default FlowsheetPage;

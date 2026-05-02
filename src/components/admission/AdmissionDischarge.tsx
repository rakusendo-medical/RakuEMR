import React, { useState } from 'react';
import {
  Box, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, Typography, Button, Stack,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
  TRANSFER_HISTORY,
} from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';
import AdmissionScheduleCalendar from './AdmissionScheduleCalendar';
import AdmissionHistoryView from './AdmissionHistoryView';

const AdmissionDischarge: React.FC = () => {
  const [tab, setTab] = useState(0);
  const { currentUserRole, setUserRole, optionalFeatures, toggleOptionalFeature } = useAppStore();

  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 1, gap: 1, flexWrap: 'wrap' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', flex: 1 }}>
          <Tab label="入退院情報" />
          <Tab label="入院歴" />
          <Tab label="移動歴" />
          <Tab label="新規入退院指示" />
        </Tabs>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ pr: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
          <Typography variant="caption" color="text.secondary">操作者ロール</Typography>
          <ToggleButtonGroup
            size="small"
            value={currentUserRole}
            exclusive
            onChange={(_, v) => v && setUserRole(v)}
          >
            <ToggleButton value="doctor">医師</ToggleButton>
            <ToggleButton value="staff">事務</ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>オプション</Typography>
          <ToggleButtonGroup
            size="small"
            value={Object.entries(optionalFeatures).filter(([, v]) => v).map(([k]) => k)}
            onChange={(_, vals: string[]) => {
              const next = vals as Array<keyof typeof optionalFeatures>;
              (Object.keys(optionalFeatures) as Array<keyof typeof optionalFeatures>).forEach((k) => {
                if (next.includes(k) !== optionalFeatures[k]) toggleOptionalFeature(k);
              });
            }}
          >
            <ToggleButton value="medicalProtection">医療観察法</ToggleButton>
            <ToggleButton value="regionalCooperation">地域連携</ToggleButton>
            <ToggleButton value="psychiatricLink">精神科連携</ToggleButton>
            {/* ===== ep-05 隔離拘束指示 ===== */}
            <ToggleButton value="restraintChange">隔離拘束変更</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {tab === 0 && <AdmissionScheduleCalendar />}

      {tab === 1 && <AdmissionHistoryView onNavigateToTransferHistory={() => setTab(2)} />}

      {tab === 2 && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>日付</TableCell>
                <TableCell>患者氏名</TableCell>
                <TableCell>移動元</TableCell>
                <TableCell>移動先</TableCell>
                <TableCell>理由</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {TRANSFER_HISTORY.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>{t.date}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t.patientName}</TableCell>
                  <TableCell>{t.fromRoom}</TableCell>
                  <TableCell>{t.toRoom}</TableCell>
                  <TableCell>{t.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tab === 3 && (
        <Paper variant="outlined" sx={{ p: 3, maxWidth: 720 }}>
          <Typography variant="subtitle1" gutterBottom>入退院指示について</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            入退院指示（入院指示／退院指示）は<strong>カルテ画面のクイック操作</strong>から発行します。
            患者を選んでカルテ画面を開き、画面下部のアクションバーから「入院指示」または「退院指示（入院患者のみ）」をクリックしてください。
            指示登録後は <strong>「入退院情報」タブ</strong>のカレンダーに赤字（未確定）で反映されます。
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => setTab(0)}>入退院情報カレンダーへ</Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default AdmissionDischarge;

import React, { useState } from 'react';
import {
  Box, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Stack, Tooltip,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';
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
        </Tabs>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ pr: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
          <Tooltip
            title={
              <Box sx={{ fontSize: '0.7rem', lineHeight: 1.5 }}>
                モック動作確認用の切替バー。本番では参考システムのマスタ設定・ログイン中ユーザーのロールに相当する。<br />
                ・操作者ロール: 権限ガード UI（隔離拘束歴の削除権限・サイン既定者など）の出し分けを確認<br />
                ・オプション: ダイアログ表示項目・リンク数などマスタ依存 UI の出し分けを確認
              </Box>
            }
            arrow
            placement="bottom-end"
          >
            <Stack direction="row" spacing={0.3} alignItems="center" sx={{ color: 'text.disabled', cursor: 'help' }}>
              <InfoOutlinedIcon sx={{ fontSize: 14 }} />
              <Typography variant="caption" sx={{ fontStyle: 'italic' }}>モック切替</Typography>
            </Stack>
          </Tooltip>
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
            {/* ===== ep-07 観察記録 ===== */}
            <ToggleButton value="observationFutureBlock">観察未来日抑止</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {tab === 0 && <AdmissionScheduleCalendar />}

      {tab === 1 && <AdmissionHistoryView />}

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

    </Box>
  );
};

export default AdmissionDischarge;

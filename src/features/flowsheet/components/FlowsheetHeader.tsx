import React from 'react';
import {
  Box, Stack, Typography, Tabs, Tab, IconButton, TextField, Button, Chip,
  Tooltip,
} from '@mui/material';
import {
  Today as TodayIcon,
  ChevronLeft, ChevronRight,
  KeyboardDoubleArrowLeft, KeyboardDoubleArrowRight,
} from '@mui/icons-material';
import type { FlowsheetTab, ISODate } from '../types';

interface Props {
  /** 表示の最終日（7 日表示の右端） */
  endDate: ISODate;
  onChangeEndDate: (date: ISODate) => void;
  tab: FlowsheetTab;
  onChangeTab: (tab: FlowsheetTab) => void;
  /** 観察タブ表示条件（医療観察法対象患者のみ） */
  showObservationTab: boolean;
  /** 適用パターン名（null の場合は「パターンなし」） */
  patternName: string | null;
  /** 在院日数（外来は null） */
  daysOfStay: number | null;
  onClickPatternChange: () => void;
}

const shiftDate = (iso: ISODate, days: number): ISODate => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const today = (): ISODate => new Date().toISOString().slice(0, 10);

const FlowsheetHeader: React.FC<Props> = ({
  endDate, onChangeEndDate,
  tab, onChangeTab, showObservationTab,
  patternName, daysOfStay,
  onClickPatternChange,
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
    {/* 入力切替タブ */}
    <Tabs
      value={tab}
      onChange={(_, v: FlowsheetTab) => onChangeTab(v)}
      variant="standard"
      sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, fontSize: 13 } }}
    >
      <Tab label="フローシート" value="flowsheet" />
      <Tab label="隔離拘束" value="isolation" />
      <Tab label="睡眠・活動" value="sleep" />
      {showObservationTab && <Tab label="観察" value="observation" />}
    </Tabs>

    {/* 日付コントロール／パターンボックス／在院日数 */}
    <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
      <Tooltip title="当日"><span>
        <IconButton size="small" onClick={() => onChangeEndDate(today())}>
          <TodayIcon fontSize="small" />
        </IconButton>
      </span></Tooltip>
      <Tooltip title="7 日前"><span>
        <IconButton size="small" onClick={() => onChangeEndDate(shiftDate(endDate, -7))}>
          <KeyboardDoubleArrowLeft fontSize="small" />
        </IconButton>
      </span></Tooltip>
      <Tooltip title="1 日前"><span>
        <IconButton size="small" onClick={() => onChangeEndDate(shiftDate(endDate, -1))}>
          <ChevronLeft fontSize="small" />
        </IconButton>
      </span></Tooltip>
      <TextField
        type="date" size="small" value={endDate}
        onChange={(e) => onChangeEndDate(e.target.value)}
        sx={{ width: 160 }}
      />
      <Tooltip title="1 日後"><span>
        <IconButton size="small" onClick={() => onChangeEndDate(shiftDate(endDate, 1))}>
          <ChevronRight fontSize="small" />
        </IconButton>
      </span></Tooltip>
      <Tooltip title="7 日後"><span>
        <IconButton size="small" onClick={() => onChangeEndDate(shiftDate(endDate, 7))}>
          <KeyboardDoubleArrowRight fontSize="small" />
        </IconButton>
      </span></Tooltip>

      <Box sx={{ flex: 1 }} />

      {daysOfStay !== null && (
        <Typography variant="caption" color="text.secondary">
          在院日数: {daysOfStay} 日
        </Typography>
      )}
      <Chip
        size="small"
        label={patternName ? `パターン: ${patternName}` : 'パターンなし'}
        color={patternName ? 'primary' : 'default'}
        variant="outlined"
      />
      <Button size="small" variant="outlined" onClick={onClickPatternChange}>
        パターン変更
      </Button>
    </Stack>
  </Box>
);

export default FlowsheetHeader;

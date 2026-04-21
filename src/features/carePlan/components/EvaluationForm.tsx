import React from 'react';
import {
  Box, FormControl, FormControlLabel, Paper, Radio, RadioGroup, Stack, TextField, Typography,
} from '@mui/material';
import type { EvaluationAchievement, ProblemItemStatus } from '../types';

export interface EvaluationDraft {
  achievement: EvaluationAchievement;
  findings: string;
  nextStatus: ProblemItemStatus;
}

interface Props {
  value: EvaluationDraft;
  onChange: (next: EvaluationDraft) => void;
  previousSummary?: string;
}

const EvaluationForm: React.FC<Props> = ({ value, onChange, previousSummary }) => {
  return (
    <Stack spacing={1.5}>
      {previousSummary && (
        <Paper variant="outlined" sx={{ p: 1, bgcolor: '#f8fafc' }}>
          <Typography variant="caption" color="text.secondary">前回評価</Typography>
          <Typography variant="body2">{previousSummary}</Typography>
        </Paper>
      )}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>▼ 今回評価</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2">達成度</Typography>
          <RadioGroup
            row
            value={value.achievement}
            onChange={(e) =>
              onChange({ ...value, achievement: e.target.value as EvaluationAchievement })
            }
          >
            <FormControlLabel value="not_achieved" control={<Radio size="small" />} label="未達" />
            <FormControlLabel value="partial" control={<Radio size="small" />} label="一部達成" />
            <FormControlLabel value="achieved" control={<Radio size="small" />} label="達成" />
          </RadioGroup>
        </Stack>
        <TextField
          fullWidth multiline minRows={2} label="所見"
          value={value.findings} sx={{ mt: 1 }}
          onChange={(e) => onChange({ ...value, findings: e.target.value })}
        />
      </Box>
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>▼ 次のステータス</Typography>
        <FormControl>
          <RadioGroup
            value={value.nextStatus}
            onChange={(e) =>
              onChange({ ...value, nextStatus: e.target.value as ProblemItemStatus })
            }
          >
            <FormControlLabel value="active" control={<Radio size="small" />} label="継続" />
            <FormControlLabel value="evaluating" control={<Radio size="small" />} label="修正して継続(評価中)" />
            <FormControlLabel value="closed_resolved" control={<Radio size="small" />} label="解決でクローズ" />
            <FormControlLabel value="closed_cancelled" control={<Radio size="small" />} label="中止でクローズ" />
            <FormControlLabel value="closed_changed" control={<Radio size="small" />} label="変更でクローズ" />
          </RadioGroup>
        </FormControl>
      </Box>
    </Stack>
  );
};

export default EvaluationForm;

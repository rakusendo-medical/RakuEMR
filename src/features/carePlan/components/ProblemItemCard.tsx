import React from 'react';
import {
  Box, Button, Card, CardContent, Chip, Divider, Stack, Typography,
} from '@mui/material';
import type { ProblemItem } from '../types';
import { useCarePlanStore, formatJPDate, daysUntil } from '../store';
import StatusChip from './StatusChip';
import PriorityChip from './PriorityChip';

interface Props {
  item: ProblemItem;
  index?: number;
  onEdit?: () => void;
  onEvaluate?: () => void;
  onDetail?: () => void;
  onDelete?: () => void;
  compact?: boolean;
}

const ProblemItemCard: React.FC<Props> = ({
  item, index, onEdit, onEvaluate, onDetail, onDelete, compact,
}) => {
  const nanda = useCarePlanStore((s) => s.nandaMaster.find((n) => n.code === item.nandaCode));
  const days = daysUntil(item.nextEvaluationDueAt);
  const overdue = days !== null && days < 0;
  const nearDue = days !== null && days >= 0 && days <= 7;

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
          {typeof index === 'number' && (
            <Typography variant="subtitle2" sx={{ minWidth: 24 }}>
              #{index + 1}
            </Typography>
          )}
          <StatusChip status={item.status} />
          <PriorityChip priority={item.priority} />
          <Chip label={`領域: ${item.domain}`} size="small" variant="outlined" />
          <Box sx={{ flex: 1 }} />
          {!compact && (
            <Stack direction="row" spacing={0.5}>
              {onDetail && <Button size="small" onClick={onDetail}>詳細</Button>}
              {onEdit && <Button size="small" variant="outlined" onClick={onEdit}>編集</Button>}
              {onEvaluate && <Button size="small" variant="contained" onClick={onEvaluate}>評価</Button>}
              {onDelete && <Button size="small" color="error" onClick={onDelete}>削除</Button>}
            </Stack>
          )}
        </Stack>
        <Stack spacing={0.5}>
          <Box>
            <Typography variant="caption" color="text.secondary">看護診断</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {nanda ? `${nanda.name} (${nanda.code})` : item.nandaCode}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">目標(短期)</Typography>
            <Typography variant="body2">{item.shortTermGoal}</Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Stack direction="row" spacing={2} sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          <span>立案日 {formatJPDate(item.createdAt)}</span>
          <span>最終評価 {formatJPDate(item.lastEvaluatedAt)}</span>
          <span
            style={{
              color: overdue ? '#dc2626' : nearDue ? '#d97706' : undefined,
              fontWeight: overdue || nearDue ? 700 : undefined,
            }}
          >
            次回期限 {formatJPDate(item.nextEvaluationDueAt)}
            {overdue && ` (${-days}日超過)`}
            {nearDue && days !== null && ` (残${days}日)`}
          </span>
        </Stack>
        {compact && (onEdit || onDelete) && (
          <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
            {onEdit && <Button size="small" variant="outlined" onClick={onEdit}>編集</Button>}
            {onDelete && <Button size="small" color="error" onClick={onDelete}>削除</Button>}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default ProblemItemCard;

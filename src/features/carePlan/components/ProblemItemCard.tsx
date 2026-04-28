import React from 'react';
import {
  Box, Button, Card, CardContent, Chip, Collapse, Divider, IconButton, Stack, Typography,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import type { ProblemItem } from '../types';
import { useCarePlanStore, formatJPDate, daysUntil } from '../store';
import StatusChip from './StatusChip';
import PriorityChip from './PriorityChip';

interface Props {
  item: ProblemItem;
  /** 表示用の通し番号(1始まり)。立案順を保ちたい場合は安定したインデックスを渡す */
  displayNumber?: number;
  onEdit?: () => void;
  onEvaluate?: () => void;
  onDelete?: () => void;
  /** アコーディオン制御。指定時は外部状態に従う */
  expanded?: boolean;
  onToggle?: () => void;
  /** クローズ済みアイテム用にグレーアウト表示 */
  dimmed?: boolean;
  compact?: boolean;
}

const ProblemItemCard: React.FC<Props> = ({
  item, displayNumber, onEdit, onEvaluate, onDelete, expanded, onToggle, dimmed, compact,
}) => {
  const nanda = useCarePlanStore((s) => s.nandaMaster.find((n) => n.code === item.nandaCode));
  const days = daysUntil(item.nextEvaluationDueAt);
  const overdue = days !== null && days < 0;
  const nearDue = days !== null && days >= 0 && days <= 7;
  const isClosed = item.status.startsWith('closed');

  // 内部 state は expanded prop が未指定の場合のみ利用
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = expanded ?? internalOpen;
  const toggle = onToggle ?? (() => setInternalOpen((v) => !v));

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        opacity: dimmed ? 0.6 : 1,
        bgcolor: dimmed ? '#f1f5f9' : undefined,
        borderLeft: dimmed ? undefined : '3px solid #1e3a5f',
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mb: 0.75, cursor: compact ? 'default' : 'pointer' }}
          onClick={compact ? undefined : toggle}
        >
          {!compact && (
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); toggle(); }}
              sx={{
                transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s',
              }}
            >
              <ExpandMoreIcon fontSize="small" />
            </IconButton>
          )}
          {typeof displayNumber === 'number' && (
            <Typography variant="subtitle2" sx={{ minWidth: 28 }}>
              #{displayNumber}
            </Typography>
          )}
          <StatusChip status={item.status} />
          <PriorityChip priority={item.priority} />
          <Chip label={`領域: ${item.domain}`} size="small" variant="outlined" />
          <Box sx={{ flex: 1 }} />
          {!compact && (
            <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
              {onEdit && <Button size="small" variant="outlined" onClick={onEdit}>編集</Button>}
              {onEvaluate && !isClosed && <Button size="small" variant="contained" onClick={onEvaluate}>評価</Button>}
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
            <Typography variant="caption" color="text.secondary">短期目標</Typography>
            <Typography variant="body2">{item.shortTermGoal}</Typography>
          </Box>
        </Stack>

        {!compact && (
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 1.25 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.75 }}>具体策 (OTE)</Typography>
              <Stack spacing={0.75}>
                <OteSection
                  letter="O"
                  title="観察"
                  hint="症状・状態・行動の観察"
                  color="#1e40af"
                  bg="#eff6ff"
                  lines={item.ote.observation}
                />
                <OteSection
                  letter="T"
                  title="援助"
                  hint="看護師による直接援助・支援"
                  color="#047857"
                  bg="#ecfdf5"
                  lines={item.ote.therapy}
                />
                <OteSection
                  letter="E"
                  title="指導"
                  hint="患者・家族への指導"
                  color="#b45309"
                  bg="#fffbeb"
                  lines={item.ote.education}
                />
              </Stack>
              {isClosed && item.closeReason && (
                <Box sx={{ mt: 1, p: 1, bgcolor: '#f8fafc', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" color="text.secondary">クローズ理由</Typography>
                  <Typography variant="body2">
                    {item.closeReason}
                    {item.closedAt && ` (${formatJPDate(item.closedAt)})`}
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        )}

        <Divider sx={{ my: 1 }} />
        <Stack direction="row" spacing={2} sx={{ color: 'text.secondary' }}>
          <Typography variant="caption">立案日 {formatJPDate(item.createdAt)}</Typography>
          <Typography variant="caption">最終評価 {formatJPDate(item.lastEvaluatedAt)}</Typography>
          {!isClosed && (
            <Typography
              variant="caption"
              sx={{
                color: overdue ? '#dc2626' : nearDue ? '#d97706' : undefined,
                fontWeight: overdue || nearDue ? 700 : undefined,
              }}
            >
              次回期限 {formatJPDate(item.nextEvaluationDueAt)}
              {overdue && ` (${-days!}日超過)`}
              {nearDue && days !== null && ` (残${days}日)`}
            </Typography>
          )}
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

interface OteSectionProps {
  letter: 'O' | 'T' | 'E';
  title: string;
  hint: string;
  color: string;
  bg: string;
  lines: string[];
}

const OteSection: React.FC<OteSectionProps> = ({ letter, title, hint, color, bg, lines }) => {
  const filtered = lines.filter((l) => l.trim().length > 0);
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        borderRadius: 1,
        border: '1px solid #e2e8f0',
        borderLeft: `4px solid ${color}`,
        bgcolor: '#fff',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: 40,
          flexShrink: 0,
          bgcolor: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: '1.125rem', color, lineHeight: 1 }}>
          {letter}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, px: 1.25, py: 0.75 }}>
        <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 0.25 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        </Stack>
        {filtered.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            (未入力)
          </Typography>
        ) : (
          <Box component="ul" sx={{ m: 0, pl: 2.25 }}>
            {filtered.map((line, i) => (
              <li key={i}>
                <Typography variant="body2">{line}</Typography>
              </li>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ProblemItemCard;

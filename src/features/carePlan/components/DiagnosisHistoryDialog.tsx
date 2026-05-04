import React from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, IconButton, Stack, Typography,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import type { ProblemItem } from '../types';
import { useCarePlanStore, formatJPDate } from '../store';

interface Props {
  open: boolean;
  /** 履歴参照対象の患者 ID。当該患者の全 ProblemItem を時系列で表示する */
  patientId: string;
  onClose: () => void;
}

/**
 * 看護診断 履歴参照モード（ep-12 us-28 AC-9 / mock 改修フェーズ 1）
 *
 * 過去登録した看護診断（= ProblemItem）を時系列でページめくりして閲覧する。
 * 編集はできず、内容は読み取り専用で表示する。
 *
 * 用語: 「看護診断（NANDA）」 + 「問題点（テキスト）」 を 1 件ずつ表示。
 * 詳細は docs/specs/_terminology.md / docs/specs/ep-12-diagnosis/ を参照。
 */
const DiagnosisHistoryDialog: React.FC<Props> = ({ open, patientId, onClose }) => {
  const problemItems = useCarePlanStore((s) => s.problemItems);
  const carePlans = useCarePlanStore((s) => s.carePlans);
  const nandaMaster = useCarePlanStore((s) => s.nandaMaster);
  const nurses = useCarePlanStore((s) => s.nurses);

  // 当該患者の ProblemItem を立案日昇順（古い順）で並べる
  const items = React.useMemo<ProblemItem[]>(() => {
    const planIds = new Set(carePlans.filter((p) => p.patientId === patientId).map((p) => p.id));
    return problemItems
      .filter((pi) => planIds.has(pi.carePlanId))
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0));
  }, [problemItems, carePlans, patientId]);

  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (open) setIndex(items.length > 0 ? items.length - 1 : 0); // 開いた時は最新を表示
  }, [open, items.length]);

  if (!open) return null;
  if (items.length === 0) {
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>看護診断 履歴参照</DialogTitle>
        <Divider />
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            この患者の過去診断はまだありません。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>閉じる</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const item = items[index];
  const nanda = nandaMaster.find((n) => n.code === item.nandaCode);
  const author = nurses.find((n) => n.id === item.createdBy);
  const canPrev = index > 0;
  const canNext = index < items.length - 1;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        看護診断 履歴参照
        <Typography variant="caption" color="text.secondary" component="div">
          {index + 1} / {items.length} 件 — 古い順、最新を初期表示
        </Typography>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip label={`領域: ${item.domain}`} size="small" variant="outlined" />
            <Chip label={`優先度: ${item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}`} size="small" variant="outlined" />
            <Chip label={`ステータス: ${item.status}`} size="small" variant="outlined" />
          </Stack>

          <Box>
            <Typography variant="caption" color="text.secondary">問題点</Typography>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {item.problemStatement || nanda?.name || item.nandaCode}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">看護診断（NANDA）</Typography>
            <Typography variant="body2">
              {nanda ? `${nanda.name} (${nanda.code})` : item.nandaCode}
            </Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">短期目標</Typography>
            <Typography variant="body2">{item.shortTermGoal}</Typography>
          </Box>

          <Divider />
          <Stack direction="row" spacing={2} flexWrap="wrap" rowGap={0.5} sx={{ color: 'text.secondary' }}>
            <Typography variant="caption">立案日 {formatJPDate(item.createdAt)}</Typography>
            {item.diagnosedAt && item.diagnosedAt !== item.createdAt && (
              <Typography variant="caption">診断日 {formatJPDate(item.diagnosedAt)}</Typography>
            )}
            {author && <Typography variant="caption">立案者 {author.name}</Typography>}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 2 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <IconButton size="small" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={!canPrev}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="caption" color="text.secondary">
            {index + 1} / {items.length}
          </Typography>
          <IconButton size="small" onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))} disabled={!canNext}>
            <ChevronRightIcon />
          </IconButton>
        </Stack>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DiagnosisHistoryDialog;

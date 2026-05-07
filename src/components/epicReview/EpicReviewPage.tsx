import { useMemo } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Stack, Typography, Chip, Button, Divider,
  List, ListItem, ListItemIcon, ListItemText, Paper, Alert,
} from '@mui/material';
import {
  CheckCircle as DoneIcon,
  RadioButtonUnchecked as TodoIcon,
  HourglassBottom as ProgressIcon,
  OpenInNew as OpenIcon,
  ArrowBack as ArrowBackIcon,
  Description as SpecIcon,
} from '@mui/icons-material';
import { EPICS, type EpicMeta, type EpicStatus } from './epicData';

const STATUS_LABEL: Record<EpicStatus, string> = {
  completed: '完了',
  'in-progress': '進行中',
  planned: '未着手',
};

const STATUS_COLOR: Record<EpicStatus, 'success' | 'warning' | 'default'> = {
  completed: 'success',
  'in-progress': 'warning',
  planned: 'default',
};

const STATUS_ICON: Record<EpicStatus, React.ReactElement> = {
  completed: <DoneIcon fontSize="small" sx={{ color: '#16a34a' }} />,
  'in-progress': <ProgressIcon fontSize="small" sx={{ color: '#ca8a04' }} />,
  planned: <TodoIcon fontSize="small" sx={{ color: '#9ca3af' }} />,
};

export default function EpicReviewPage() {
  const { epicId } = useParams<{ epicId: string }>();
  const epic = useMemo<EpicMeta | undefined>(
    () => EPICS.find((e) => e.id === epicId),
    [epicId],
  );

  if (!epic) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          指定されたエピックが見つかりません: <code>{epicId}</code>
        </Alert>
        <Button component={RouterLink} to="/epic-review/ep-01" startIcon={<ArrowBackIcon />}>
          ep-01 に戻る
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, maxWidth: 1100, mx: 'auto' }}>
      {/* ===== ヘッダー ===== */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
          <Chip label={epic.id.toUpperCase()} sx={{ fontWeight: 700, fontFamily: 'monospace', bgcolor: '#1e3a5f', color: '#fff' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {epic.title}
          </Typography>
          <Chip
            label={STATUS_LABEL[epic.status]}
            color={STATUS_COLOR[epic.status]}
            size="small"
            icon={STATUS_ICON[epic.status]}
          />
          <Chip label={epic.area} size="small" variant="outlined" />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          {epic.description}
        </Typography>
        {epic.stageNote && (
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#1e40af', fontWeight: 600 }}>
            {epic.stageNote}
          </Typography>
        )}
      </Paper>

      {/* ===== 主要画面 ===== */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            主要画面
          </Typography>
          {epic.mainScreens.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              このエピックには対応する画面がありません（未着手 / 撤去予定 等）。
            </Typography>
          ) : (
            <Stack spacing={1}>
              {epic.mainScreens.map((s, i) => (
                <Stack key={i} direction="row" alignItems="center" spacing={1.5}>
                  <Button
                    component={RouterLink}
                    to={s.path}
                    variant="outlined"
                    size="small"
                    endIcon={<OpenIcon />}
                    sx={{ minWidth: 160, textAlign: 'left', justifyContent: 'space-between' }}
                  >
                    {s.label}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    {s.path}
                  </Typography>
                  {s.hint && (
                    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                      — {s.hint}
                    </Typography>
                  )}
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* ===== 子ストーリー ===== */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            子ストーリー（{epic.stories.length} 件）
          </Typography>
          <List dense disablePadding>
            {epic.stories.map((s) => (
              <ListItem key={s.id} sx={{ py: 0.25, borderBottom: '1px dashed', borderColor: 'grey.200' }}>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <SpecIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 56 }}>
                        {s.id}
                      </Box>
                      <Typography variant="body2">{s.label}</Typography>
                    </Stack>
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* ===== 関連ドキュメント（参考リンク） ===== */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            関連ドキュメント（参考）
          </Typography>
          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              <Box component="code" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 0.75, py: 0.25, borderRadius: 0.5 }}>
                docs/issues/epics/{epic.id}-*.md
              </Box>{' '}
              — エピック Issue ドラフト
            </Typography>
            {(epic.id === 'ep-15' || epic.id === 'ep-16' || epic.id === 'ep-17') && (
              <Typography variant="body2" color="text.secondary">
                <Box component="code" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 0.75, py: 0.25, borderRadius: 0.5 }}>
                  docs/specs/{epic.id}-*/_epic.md
                </Box>{' '}
                — Spec 一覧
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              <Box component="code" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 0.75, py: 0.25, borderRadius: 0.5 }}>
                docs/changes/{epic.id}-*.md
              </Box>{' '}
              — 改修一覧 / 完了メモ
            </Typography>
          </Stack>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.disabled">
            このページはエピック単位のレビュー用ダッシュボード（mock）。各画面のリンクから実際の動作を確認可能。
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

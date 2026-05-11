import { useMemo } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Stack, Typography, Chip, Button, Divider,
  Paper, Alert,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
  CheckCircle as DoneIcon,
  RadioButtonUnchecked as TodoIcon,
  HourglassBottom as ProgressIcon,
  OpenInNew as OpenIcon,
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { EPICS, type EpicMeta, type EpicStatus } from './epicData';
import { getStoryDoc, type StoryDoc } from './storyContent';

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
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            各行を展開すると spec / issue ドラフトの本文を表示します。
          </Typography>
          <Stack spacing={0.5}>
            {epic.stories.map((s) => {
              const doc = getStoryDoc(s.id);
              return (
                <StoryAccordion key={s.id} storyId={s.id} label={s.label} doc={doc} />
              );
            })}
          </Stack>
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

function StoryAccordion({
  storyId,
  label,
  doc,
}: {
  storyId: string;
  label: string;
  doc: StoryDoc | null;
}) {
  const sourceChip = doc ? (
    <Chip
      size="small"
      variant="outlined"
      label={doc.source === 'spec' ? 'spec' : 'issue'}
      color={doc.source === 'spec' ? 'primary' : 'default'}
      sx={{ fontFamily: 'monospace' }}
    />
  ) : (
    <Chip size="small" variant="outlined" label="未起票" color="warning" />
  );

  return (
    <Accordion disableGutters elevation={0} square sx={{ '&:before': { display: 'none' }, borderBottom: '1px dashed', borderColor: 'grey.200' }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          minHeight: 36,
          px: 1,
          '& .MuiAccordionSummary-content': { my: 0.5, alignItems: 'center' },
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
          <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 56, flexShrink: 0 }}>
            {storyId}
          </Box>
          <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {label}
          </Typography>
          {sourceChip}
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, pb: 1.5, px: 2, bgcolor: 'grey.50' }}>
        {doc ? (
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 1, fontFamily: 'monospace' }}
            >
              {doc.path}
            </Typography>
            <Box
              sx={{
                fontSize: '0.9rem',
                lineHeight: 1.6,
                '& h1': { fontSize: '1.35rem', mt: 2, mb: 1, fontWeight: 700 },
                '& h2': { fontSize: '1.15rem', mt: 2, mb: 1, fontWeight: 700 },
                '& h3': { fontSize: '1.02rem', mt: 1.5, mb: 0.5, fontWeight: 700 },
                '& h4': { fontSize: '0.96rem', mt: 1.25, mb: 0.5, fontWeight: 700 },
                '& p': { my: 0.75 },
                '& code': {
                  fontFamily: 'monospace',
                  bgcolor: 'grey.200',
                  px: 0.5,
                  py: 0.1,
                  borderRadius: 0.5,
                  fontSize: '0.85em',
                },
                '& pre': {
                  bgcolor: '#1e293b',
                  color: '#f1f5f9',
                  p: 1.5,
                  borderRadius: 1,
                  overflow: 'auto',
                  my: 1,
                },
                '& pre code': { bgcolor: 'transparent', color: 'inherit', p: 0, fontSize: '0.85em' },
                '& table': {
                  borderCollapse: 'collapse',
                  my: 1,
                  display: 'block',
                  overflowX: 'auto',
                  maxWidth: '100%',
                },
                '& th, & td': {
                  border: '1px solid',
                  borderColor: 'grey.300',
                  px: 1,
                  py: 0.5,
                  textAlign: 'left',
                  verticalAlign: 'top',
                },
                '& th': { bgcolor: 'grey.100', fontWeight: 700 },
                '& blockquote': {
                  borderLeft: '4px solid',
                  borderColor: 'grey.300',
                  pl: 1.5,
                  ml: 0,
                  color: 'text.secondary',
                  my: 1,
                },
                '& ul, & ol': { pl: 3, my: 0.5 },
                '& li': { my: 0.25 },
                '& hr': { my: 1.5, border: 0, borderTop: '1px solid', borderColor: 'grey.300' },
                '& a': { color: 'primary.main' },
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            spec / issue ドラフトが見つかりませんでした（未起票）。
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

import React, { useMemo, useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Paper, Typography, Stack, Select, MenuItem, FormControl, InputLabel,
  ToggleButton, ToggleButtonGroup, Chip, Card, CardContent, IconButton,
  TextField, Button, Tooltip, Link as MuiLink,
} from '@mui/material';
import {
  ChevronLeft, ChevronRight, FirstPage as FirstPageIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { PATIENTS } from '../../../data/mockData';
import { useFlowsheetStore } from '../store';
import type { NursingRecord, ShiftType } from '../types';
import NursingRecordDialog from '../components/NursingRecordDialog';

const SHIFT_LABEL: Record<ShiftType, string> = { night: '深夜', day: '日勤', evening: '準夜' };
const SHIFT_COLOR: Record<ShiftType, string> = { night: '#dc2626', day: '#1e40af', evening: '#16a34a' };

// 記録形式（種別）チップの配色。タグ（アウトライン）と見分けられるよう塗りチップにする。
const FORM_CHIP_STYLE: Record<string, { bg: string; color: string }> = {
  focus: { bg: '#dcfce7', color: '#166534' }, // 緑
  soap: { bg: '#dbeafe', color: '#1e40af' },  // 青
  free: { bg: '#ede9fe', color: '#6b21a8' },  // 紫
};

const NursingRecordsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPatient = searchParams.get('patientId') ?? PATIENTS[0]?.id ?? '';
  const [patientId, setPatientId] = useState<string>(initialPatient);
  const property = useFlowsheetStore((s) => s.property);
  const records = useFlowsheetStore((s) => s.nursingRecords);
  const staffs = useFlowsheetStore((s) => s.staffs);

  const [viewMode, setViewMode] = useState<'normal' | 'all'>('normal');
  const [keyword, setKeyword] = useState('');
  // タグ絞り込み（複数選択は AND＝すべて含む）
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  const [dialog, setDialog] = useState<{ open: boolean; recordId: string | null; mode: 'view' | 'new' | 'edit' }>(
    { open: false, recordId: null, mode: 'view' },
  );

  const onChangePatient = (id: string) => {
    setPatientId(id);
    setPage(0);
    setSelectedTags(new Set()); // 患者を変えたらタグ絞り込みはリセット
    setSearchParams({ patientId: id });
  };

  // 表示モード（通常/全て）切替: 候補タグが変わるため、タグ選択とページもリセットする。
  const onChangeViewMode = (v: 'normal' | 'all') => {
    setViewMode(v);
    setPage(0);
    setSelectedTags(new Set());
  };

  const toggleTag = (t: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
    setPage(0);
  };

  // 絞り込み用の候補タグ（選択中患者の記録から集約。viewMode を反映）。
  const availableTags = useMemo(() => {
    const nowIso = new Date().toISOString();
    const base = records.filter((r) =>
      r.patientId === patientId
      && (viewMode === 'all' || (!r.deletedAt && !r.updatedAt && r.recordedAt <= nowIso)));
    const set = new Set<string>();
    base.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [records, patientId, viewMode]);

  const filtered = useMemo(() => {
    let list = records.filter((r) => r.patientId === patientId);
    if (viewMode === 'normal') {
      list = list.filter((r) => !r.deletedAt && !r.updatedAt && r.recordedAt <= new Date().toISOString());
    }
    if (keyword.trim()) {
      const k = keyword.toLowerCase();
      list = list.filter((r) =>
        r.title.toLowerCase().includes(k) ||
        JSON.stringify(r.body.body).toLowerCase().includes(k) ||
        r.tags.some((t) => t.toLowerCase().includes(k)),
      );
    }
    // タグ絞り込み（AND＝選択したタグをすべて含む記事のみ）
    if (selectedTags.size > 0) {
      list = list.filter((r) => [...selectedTags].every((t) => r.tags.includes(t)));
    }
    return list.sort((a, b) => (a.recordedAt < b.recordedAt ? 1 : -1));
  }, [records, patientId, viewMode, keyword, selectedTags]);

  // 月毎にグルーピング
  const grouped = useMemo(() => {
    const map = new Map<string, NursingRecord[]>();
    filtered.forEach((r) => {
      const ym = r.recordedAt.slice(0, 7);
      if (!map.has(ym)) map.set(ym, []);
      map.get(ym)!.push(r);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [filtered]);

  // ページング: 1 ページあたり property.recordsPerPage 件、月のまとまりは保持しつつ records 単位でカウント
  const perPage = property.recordsPerPage;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const start = page * perPage;
  const visibleRecordIds = new Set(filtered.slice(start, start + perPage).map((r) => r.id));

  const staffNameOf = (id: string) => staffs.find((s) => s.id === id)?.name ?? id;

  const renderCard = (r: NursingRecord) => {
    const isDeleted = !!r.deletedAt;
    const isUpdated = !!r.updatedAt && !isDeleted;
    const time = r.recordedAt.slice(11, 16);
    const formStyle = FORM_CHIP_STYLE[r.formType] ?? { bg: '#e5e7eb', color: '#374151' };
    return (
      <Card
        key={r.id}
        variant="outlined"
        sx={{
          mb: 1,
          bgcolor: !r.isPublished ? '#fef2f2' : 'background.paper',
          opacity: isDeleted ? 0.55 : 1,
          cursor: 'pointer',
          '&:hover': { bgcolor: !r.isPublished ? '#fee2e2' : '#fafafa' },
        }}
        onClick={() => setDialog({ open: true, recordId: r.id, mode: 'view' })}
      >
        <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ color: SHIFT_COLOR[r.shift], fontWeight: 700 }}>
              {time}（{SHIFT_LABEL[r.shift]}）
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                color: isUpdated || isDeleted ? '#b91c1c' : 'text.primary',
                textDecoration: isDeleted ? 'line-through' : 'none',
              }}
            >
              {r.title}
            </Typography>
            {/* 記録形式（種別）＝塗りチップで配色（タグ＝アウトラインと区別） */}
            <Chip
              size="small"
              label={r.formType.toUpperCase()}
              sx={{ bgcolor: formStyle.bg, color: formStyle.color, fontWeight: 700 }}
            />
            {!r.isPublished && <Chip size="small" color="warning" label="非公開" />}
            {/* タグ＝アウトラインチップ */}
            {r.tags.map((t) => (
              <Chip key={t} size="small" variant="outlined" label={t} />
            ))}
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">
              {staffNameOf(r.recordedBy)} / {r.registeredAt.replace('T', ' ')}
            </Typography>
            {isUpdated && (
              <Typography variant="caption" sx={{ color: '#b91c1c' }}>
                修正: {staffNameOf(r.updatedBy ?? '')} / {r.updatedAt!.replace('T', ' ')}
              </Typography>
            )}
          </Stack>
          {r.connections.length > 0 && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
              連携: {r.connections.join('・')}
              {r.reportTargets.length > 0 && (
                <> / 報告先: {r.reportTargets.map((rt) => `${staffNameOf(rt.staffId)}[${rt.role}]`).join(', ')}</>
              )}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Typography variant="h6">部門記録簿</Typography>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>患者</InputLabel>
            <Select
              label="患者"
              value={patientId}
              onChange={(e) => onChangePatient(e.target.value)}
            >
              {PATIENTS.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.patientNumber ?? p.id} {p.name}（{p.roomNumber}-{p.bedLabel}）
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <ToggleButtonGroup
            value={viewMode}
            exclusive size="small"
            onChange={(_, v) => v && onChangeViewMode(v)}
          >
            <ToggleButton value="normal">通常</ToggleButton>
            <ToggleButton value="all">全て</ToggleButton>
          </ToggleButtonGroup>
          <TextField
            size="small" placeholder="検索（タイトル・本文・タグ）"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
          />
          <Button
            startIcon={<AddIcon />}
            size="small" variant="contained"
            onClick={() => setDialog({ open: true, recordId: null, mode: 'new' })}
          >
            新規作成
          </Button>
          <Box sx={{ flex: 1 }} />
          <MuiLink component={RouterLink} to={`/karte/${patientId}#flowsheet`}>
            フローシートへ
          </MuiLink>
        </Stack>
      </Paper>

      {/* タグ絞り込み: 既存記録から集約したタグをチップ選択（複数選択は AND）。 */}
      {availableTags.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1, mb: 1 }}>
          <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>タグで絞り込み:</Typography>
            {availableTags.map((t) => (
              <Chip
                key={t}
                size="small"
                label={t}
                color={selectedTags.has(t) ? 'primary' : 'default'}
                variant={selectedTags.has(t) ? 'filled' : 'outlined'}
                onClick={() => toggleTag(t)}
                aria-label={`タグ絞り込み ${t}`}
              />
            ))}
            {selectedTags.size > 0 && (
              <Button size="small" onClick={() => { setSelectedTags(new Set()); setPage(0); }}>
                クリア
              </Button>
            )}
          </Stack>
        </Paper>
      )}

      {grouped.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary">該当する記事がありません。</Typography>
        </Paper>
      ) : (
        <>
          {grouped.map(([ym, list]) => {
            const visible = list.filter((r) => visibleRecordIds.has(r.id));
            if (visible.length === 0) return null;
            return (
              <Paper key={ym} variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: '#1e3a5f' }}>
                  {ym.replace('-', '/')}（{visible.length} 件）
                </Typography>
                {visible.map(renderCard)}
              </Paper>
            );
          })}

          <Paper variant="outlined" sx={{ p: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
            <Tooltip title="先頭"><span>
              <IconButton size="small" disabled={page === 0} onClick={() => setPage(0)}>
                <FirstPageIcon fontSize="small" />
              </IconButton>
            </span></Tooltip>
            <Tooltip title="前へ"><span>
              <IconButton size="small" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                <ChevronLeft fontSize="small" />
              </IconButton>
            </span></Tooltip>
            <Typography variant="caption">{page + 1} / {totalPages}</Typography>
            <Tooltip title="次へ"><span>
              <IconButton size="small" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
                <ChevronRight fontSize="small" />
              </IconButton>
            </span></Tooltip>
          </Paper>
        </>
      )}

      <NursingRecordDialog
        open={dialog.open}
        patientId={patientId}
        recordId={dialog.recordId}
        initialMode={dialog.mode}
        onClose={() => setDialog((s) => ({ ...s, open: false }))}
      />
    </Box>
  );
};

export default NursingRecordsPage;

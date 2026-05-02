import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Stack, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, Alert, IconButton, Tooltip,
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import { Delete as DeleteIcon, History as HistoryIcon, Add as AddIcon } from '@mui/icons-material';
import { useFlowsheetStore } from '../store';
import { TODAY } from '../mockData';
import type { ISODate, FlowsheetPatternApplication } from '../types';
import PatternHistoryDialog from './PatternHistoryDialog';

interface Props {
  open: boolean;
  patientId: string;
  onClose: () => void;
}

interface NewRow {
  startDate: ISODate;
  patternId: string;
}

const PatternChangeDialog: React.FC<Props> = ({ open, patientId, onClose }) => {
  const patternMaster = useFlowsheetStore((s) => s.patternMaster);
  const applications = useFlowsheetStore((s) => s.patternApplications);
  const careRecords = useFlowsheetStore((s) => s.careRecords);
  const applyPattern = useFlowsheetStore((s) => s.applyPattern);
  const updatePatternApplication = useFlowsheetStore((s) => s.updatePatternApplication);
  const removePatternApplication = useFlowsheetStore((s) => s.removePatternApplication);

  const patientApps = useMemo(
    () => applications
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [applications, patientId],
  );

  const [newRows, setNewRows] = useState<NewRow[]>([]);
  const [pendingApply, setPendingApply] = useState<NewRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FlowsheetPatternApplication | null>(null);
  const [pendingChange, setPendingChange] = useState<{ id: string; nextPatternId: string | null; nextStartDate: ISODate } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setNewRows([{ startDate: TODAY, patternId: patternMaster[0]?.id ?? '' }]);
      setPendingApply(null);
      setPendingDelete(null);
      setPendingChange(null);
    }
  }, [open, patternMaster]);

  const hasDataAfter = (date: ISODate): boolean =>
    careRecords.some((c) => c.patientId === patientId && c.date >= date);

  const requestApply = (row: NewRow) => {
    if (!row.patternId || !row.startDate) return;
    if (hasDataAfter(row.startDate)) {
      setPendingApply(row);
    } else {
      applyPattern(patientId, row.startDate, row.patternId);
      setNewRows((rs) => rs.filter((r) => r !== row));
    }
  };

  const confirmApply = () => {
    if (!pendingApply) return;
    applyPattern(patientId, pendingApply.startDate, pendingApply.patternId);
    setNewRows((rs) => rs.filter((r) => r !== pendingApply));
    setPendingApply(null);
  };

  const requestChange = (app: FlowsheetPatternApplication, nextPatternId: string | null, nextStartDate: ISODate) => {
    if (hasDataAfter(nextStartDate)) {
      setPendingChange({ id: app.id, nextPatternId, nextStartDate });
    } else {
      updatePatternApplication(app.id, { patternId: nextPatternId, startDate: nextStartDate });
    }
  };

  const confirmChange = () => {
    if (!pendingChange) return;
    updatePatternApplication(pendingChange.id, {
      patternId: pendingChange.nextPatternId,
      startDate: pendingChange.nextStartDate,
    });
    setPendingChange(null);
  };

  const requestDelete = (app: FlowsheetPatternApplication) => {
    setPendingDelete(app);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    removePatternApplication(pendingDelete.id);
    setPendingDelete(null);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6">フローシートパターン変更</Typography>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small" variant="outlined" startIcon={<HistoryIcon />}
              onClick={() => setHistoryOpen(true)}
            >
              履歴
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>適用済みパターン</Typography>
          {patientApps.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>適用パターンはありません（パターンなし）。</Alert>
          ) : (
            <Table size="small" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 160 }}>開始日</TableCell>
                  <TableCell>パターン</TableCell>
                  <TableCell sx={{ width: 80 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {patientApps.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <TextField
                        size="small" type="date"
                        value={app.startDate}
                        onChange={(e) => requestChange(app, app.patternId, e.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <Select
                          value={app.patternId ?? ''}
                          onChange={(e) => requestChange(app, e.target.value || null, app.startDate)}
                          displayEmpty
                        >
                          <MenuItem value=""><em>パターンなし</em></MenuItem>
                          {patternMaster.map((p) => (
                            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="この適用を削除">
                        <IconButton size="small" color="error" onClick={() => requestDelete(app)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>新規適用</Typography>
          <Stack spacing={1}>
            {newRows.map((row, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small" type="date" label="開始日"
                  value={row.startDate}
                  onChange={(e) => setNewRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, startDate: e.target.value } : r)))}
                  InputLabelProps={{ shrink: true }}
                />
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>パターン</InputLabel>
                  <Select
                    label="パターン"
                    value={row.patternId}
                    onChange={(e) => setNewRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, patternId: e.target.value } : r)))}
                  >
                    {patternMaster.map((p) => (
                      <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button size="small" variant="contained" onClick={() => requestApply(row)}>登録</Button>
                <IconButton size="small" onClick={() => setNewRows((rs) => rs.filter((_, idx) => idx !== i))}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            <Box>
              <Button
                size="small" startIcon={<AddIcon />}
                onClick={() => setNewRows((rs) => [...rs, { startDate: TODAY, patternId: patternMaster[0]?.id ?? '' }])}
              >
                行を追加
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>閉じる</Button>
        </DialogActions>
      </Dialog>

      {/* 適用日以降のデータ削除確認 */}
      <Dialog open={pendingApply !== null} onClose={() => setPendingApply(null)}>
        <DialogTitle>パターン適用の確認</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            開始日 <b>{pendingApply?.startDate}</b> 以降のケアメニューデータが削除されます。続行しますか？
            <br />
            この操作は不可逆です。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingApply(null)}>キャンセル</Button>
          <Button color="warning" variant="contained" onClick={confirmApply}>適用する</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={pendingChange !== null} onClose={() => setPendingChange(null)}>
        <DialogTitle>パターン変更の確認</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            変更後の開始日 <b>{pendingChange?.nextStartDate}</b> 以降のケアメニューデータが削除されます。続行しますか？
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingChange(null)}>キャンセル</Button>
          <Button color="warning" variant="contained" onClick={confirmChange}>変更する</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={pendingDelete !== null} onClose={() => setPendingDelete(null)}>
        <DialogTitle>パターン削除の確認</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            開始日 <b>{pendingDelete?.startDate}</b> のパターン適用を削除します。よろしいですか？
            <br />
            この操作後、当該日以降は「パターンなし」状態として扱われます。
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>キャンセル</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>削除する</Button>
        </DialogActions>
      </Dialog>

      <PatternHistoryDialog
        open={historyOpen}
        patientId={patientId}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
};

export default PatternChangeDialog;

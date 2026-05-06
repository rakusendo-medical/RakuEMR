import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, TextField, InputAdornment, FormControl, InputLabel,
  MenuItem, Select, TableSortLabel, Stack, useMediaQuery, Button, Chip,
  FormControlLabel, Checkbox, IconButton, Tooltip,
} from '@mui/material';
import {
  Search, Male, Female, NotificationsActive, NotificationsNone,
  CheckCircle, RadioButtonUnchecked, People as PeopleIcon,
} from '@mui/icons-material';
import type { WardId } from '../../types';
import type { KartePageLocationState } from '../karte/KartePage';
import { WARD_LABELS } from '../../types';
import {
  PATIENTS, ADMISSION_HISTORY, MASTER_STAFF, MASTER_STAFF_BY_ID,
  PATIENT_PHASE2_EXTRAS,
} from '../../data/mockData';
import StatusBadge from '../common/StatusBadge';
import WardFilterTabs from '../common/WardFilterTabs';
import StaffSelectDialog, { type StaffSelectValue } from '../common/StaffSelectDialog';
import { useAppStore } from '../../stores/useAppStore';

type SortKey = 'wardRoom' | 'admitDate' | 'doctor' | null;
type SortDir = 'asc' | 'desc';

const todayISO = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const daysBetween = (admitISO: string, baseISO: string): number => {
  const a = new Date(admitISO);
  const b = new Date(baseISO);
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * 患者の最新入院形態を ADMISSION_HISTORY から導出する。
 * - status === '入院中' のレコード群から admitDate 最大のものを選び admitForm を返す
 * - 該当なしは undefined
 */
const latestAdmitForm = (patientId: string): string | undefined => {
  const records = ADMISSION_HISTORY
    .filter((h) => h.patientId === patientId && h.status === '入院中')
    .sort((a, b) => b.admitDate.localeCompare(a.admitDate));
  return records[0]?.admitForm;
};

/**
 * モック報告データ。Phase 2 では報告ストアが存在しないため、
 * 一部患者にダミーで「報告あり」フラグを立てる。Phase 3 で報告ストアと統合予定。
 */
const MOCK_PATIENTS_WITH_REPORTS = new Set(['P001', 'P003', 'P008', 'P011']);

const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const setSelectedPatient = useAppStore((s) => s.setSelectedPatient);
  const condition = useAppStore((s) => s.patientListSearchCondition);
  const setCondition = useAppStore((s) => s.setPatientListSearchCondition);
  const consultationFinishedMap = useAppStore((s) => s.consultationFinishedMap);
  const toggleConsultationFinished = useAppStore((s) => s.toggleConsultationFinished);
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  // baseDate の永続化値が空文字なら今日を使う
  const baseDate = condition.baseDate || todayISO();

  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);

  const isWide = useMediaQuery('(min-width:1100px)');

  // 主治医プルダウン候補
  const doctorOptions = useMemo(() => {
    const set = new Set<string>();
    PATIENTS.forEach((p) => p.doctorName && set.add(p.doctorName));
    return Array.from(set).sort();
  }, []);

  /** 担当職員フィルタの照合 */
  const matchesStaffFilter = (patientId: string): boolean => {
    if (condition.staffIds.length === 0) return true;
    const ids = PATIENT_PHASE2_EXTRAS[patientId]?.assignedStaffIds ?? [];
    if (condition.staffMatchMode === 'all') {
      return condition.staffIds.every((sid) => ids.includes(sid));
    }
    return condition.staffIds.some((sid) => ids.includes(sid));
  };

  /** 主治医 + 診察医（オプション）でのマッチ */
  const matchesDoctor = (patientId: string, patientDoctorName: string): boolean => {
    if (condition.doctorFilter === 'all') return true;
    if (patientDoctorName === condition.doctorFilter) return true;
    if (!condition.includeExaminer) return false;
    const examinerIds = PATIENT_PHASE2_EXTRAS[patientId]?.examinerIds ?? [];
    // 「診察医登録分も表示」ON: examinerIds の中に condition.doctorFilter と同じ氏名の職員が含まれるかを判定
    return examinerIds.some((sid) => MASTER_STAFF_BY_ID[sid]?.name === condition.doctorFilter);
  };

  const filtered = useMemo(() => {
    let list = PATIENTS.slice();
    list = list.filter((p) => {
      if (p.admissionState === 'discharged') return false;
      return p.admitDate <= baseDate;
    });
    if (condition.wardFilter !== 'all') list = list.filter((p) => p.wardId === condition.wardFilter);
    list = list.filter((p) => matchesDoctor(p.id, p.doctorName));
    list = list.filter((p) => matchesStaffFilter(p.id));
    const q = condition.query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.doctorName.includes(q) ||
        (p.diagnosis ?? '').includes(q)
      );
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    baseDate, condition.wardFilter, condition.doctorFilter, condition.includeExaminer,
    condition.staffIds, condition.staffMatchMode, condition.query,
  ]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const arr = filtered.slice();
    const sign = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'wardRoom': {
          const aw = a.wardId.localeCompare(b.wardId);
          if (aw !== 0) return aw * sign;
          return a.roomNumber.localeCompare(b.roomNumber, 'ja', { numeric: true }) * sign;
        }
        case 'admitDate':
          return a.admitDate.localeCompare(b.admitDate) * sign;
        case 'doctor':
          return a.doctorName.localeCompare(b.doctorName, 'ja') * sign;
        default:
          return 0;
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key: Exclude<SortKey, null>) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return; }
    if (sortDir === 'asc') { setSortDir('desc'); return; }
    setSortKey(null); setSortDir('asc');
  };

  const navigateToKarte = (patientId: string) => {
    const patient = PATIENTS.find((p) => p.id === patientId);
    if (patient) {
      setSelectedPatient(patient);
      navigate(`/karte/${patientId}`, {
        state: { from: 'patient-list' } satisfies KartePageLocationState,
      });
    }
  };

  const wardLabel = (wardId: WardId) => WARD_LABELS[wardId];

  const handleStaffConfirm = (val: StaffSelectValue) => {
    setCondition({ staffIds: val.staffIds, staffMatchMode: val.matchMode });
  };

  // 担当職員フィルタ表示テキスト
  const staffFilterLabel = useMemo(() => {
    if (condition.staffIds.length === 0) return '担当職員: 指定なし';
    const names = condition.staffIds
      .map((sid) => MASTER_STAFF_BY_ID[sid]?.name ?? sid);
    const head = names.slice(0, 2).join('、');
    const more = names.length > 2 ? ` 他${names.length - 2}名` : '';
    const mode = condition.staffMatchMode === 'all' ? '全' : '何れか';
    return `担当職員(${mode}): ${head}${more}`;
  }, [condition.staffIds, condition.staffMatchMode]);

  // 終了状態の操作者（モックではログオン者を固定）
  const operator = { staffId: 'STF001', staffName: '山田 看護師長' };

  // baseDate が空文字のままだと永続化値も空のため、初回マウント時に今日を保存
  useEffect(() => {
    if (!condition.baseDate) {
      setCondition({ baseDate: todayISO() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <WardFilterTabs
        value={condition.wardFilter}
        onChange={(v) => setCondition({ wardFilter: v })}
      />
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
        <TextField
          label="基準日"
          type="date"
          size="small"
          value={baseDate}
          onChange={(e) => setCondition({ baseDate: e.target.value || todayISO() })}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 160 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>主治医</InputLabel>
          <Select
            label="主治医"
            value={condition.doctorFilter}
            onChange={(e) => setCondition({ doctorFilter: e.target.value })}
          >
            <MenuItem value="all">全主治医</MenuItem>
            {doctorOptions.map((d) => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={condition.includeExaminer}
              onChange={(e) => setCondition({ includeExaminer: e.target.checked })}
              disabled={condition.doctorFilter === 'all'}
            />
          }
          label={<Typography variant="caption">診察医登録分も表示</Typography>}
        />
        <Button
          size="small"
          variant="outlined"
          startIcon={<PeopleIcon />}
          onClick={() => setStaffDialogOpen(true)}
        >
          担当職員
        </Button>
        {condition.staffIds.length > 0 && (
          <Tooltip title={condition.staffIds.map((sid) => MASTER_STAFF_BY_ID[sid]?.name ?? sid).join('、')}>
            <Chip
              size="small"
              label={staffFilterLabel}
              onDelete={() => setCondition({ staffIds: [] })}
            />
          </Tooltip>
        )}
        <Box sx={{ flex: 1 }} />
        <TextField
          placeholder="氏名・患者番号・担当医・診断名"
          value={condition.query}
          onChange={(e) => setCondition({ query: e.target.value })}
          size="small"
          sx={{ width: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Stack>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortKey === 'wardRoom'}
                  direction={sortKey === 'wardRoom' ? sortDir : 'asc'}
                  onClick={() => handleSort('wardRoom')}
                >
                  病棟・病室
                </TableSortLabel>
              </TableCell>
              <TableCell>患者番号</TableCell>
              <TableCell>氏名（年齢）</TableCell>
              <TableCell>状態</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortKey === 'admitDate'}
                  direction={sortKey === 'admitDate' ? sortDir : 'asc'}
                  onClick={() => handleSort('admitDate')}
                >
                  入院日（日数）
                </TableSortLabel>
              </TableCell>
              <TableCell>入院形態</TableCell>
              {isWide && <TableCell>ICD10・病名</TableCell>}
              {isWide && <TableCell>責任レベル</TableCell>}
              <TableCell align="center">報告</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortKey === 'doctor'}
                  direction={sortKey === 'doctor' ? sortDir : 'asc'}
                  onClick={() => handleSort('doctor')}
                >
                  主治医
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">終了</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((p) => {
              const extras = PATIENT_PHASE2_EXTRAS[p.id] ?? {};
              const admitForm = latestAdmitForm(p.id);
              const finished = consultationFinishedMap[p.id];
              const hasReport = MOCK_PATIENTS_WITH_REPORTS.has(p.id);
              return (
                <TableRow
                  key={p.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigateToKarte(p.id)}
                >
                  <TableCell>{wardLabel(p.wardId)} / {p.roomNumber}</TableCell>
                  <TableCell
                    onClick={(e) => { e.stopPropagation(); navigateToKarte(p.id); }}
                    sx={{
                      color: 'primary.main',
                      fontWeight: 600,
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {p.id}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {p.gender === 'M' ? (
                        <Male sx={{ fontSize: 16, color: '#3b82f6' }} />
                      ) : (
                        <Female sx={{ fontSize: 16, color: '#ec4899' }} />
                      )}
                      <Typography component="span" sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                        {p.name}
                      </Typography>
                      <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        （{p.age}歳）
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell><StatusBadge status={p.status} /></TableCell>
                  <TableCell>
                    {p.admitDate}
                    <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.75rem', ml: 0.5 }}>
                      ({daysBetween(p.admitDate, baseDate)}日目)
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: admitForm ? 'text.primary' : 'text.disabled' }}>
                    {admitForm ?? '—'}
                  </TableCell>
                  {isWide && (
                    <TableCell sx={{ color: 'text.secondary' }}>{p.diagnosis ?? '—'}</TableCell>
                  )}
                  {isWide && (
                    <TableCell sx={{ fontSize: '0.75rem' }}>{extras.responsibilityLevel ?? '—'}</TableCell>
                  )}
                  <TableCell align="center">
                    {hasReport ? (
                      <Tooltip title="報告一覧へ（未実装）">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            showSnackbar('報告一覧画面は未実装です', 'info');
                          }}
                        >
                          <NotificationsActive sx={{ fontSize: 18, color: '#d97706' }} />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <NotificationsNone sx={{ fontSize: 18, color: 'text.disabled' }} />
                    )}
                  </TableCell>
                  <TableCell>{p.doctorName}</TableCell>
                  <TableCell align="center">
                    <Tooltip
                      title={
                        finished
                          ? `診察終了 / ${finished.staffName} / ${new Date(finished.finishedAt).toLocaleString('ja-JP')}`
                          : '診察終了にする'
                      }
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleConsultationFinished(p.id, operator);
                        }}
                      >
                        {finished ? (
                          <CheckCircle sx={{ fontSize: 18, color: '#16a34a' }} />
                        ) : (
                          <RadioButtonUnchecked sx={{ fontSize: 18, color: 'text.disabled' }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={isWide ? 11 : 9}
                  sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}
                >
                  該当する患者が見つかりませんでした
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'block', fontWeight: 600 }}>
        {sorted.length}件表示
      </Typography>

      <StaffSelectDialog
        open={staffDialogOpen}
        staffOptions={MASTER_STAFF}
        initial={{ staffIds: condition.staffIds, matchMode: condition.staffMatchMode }}
        onClose={() => setStaffDialogOpen(false)}
        onConfirm={handleStaffConfirm}
        title="担当職員フィルタ"
      />
    </Box>
  );
};

export default PatientList;

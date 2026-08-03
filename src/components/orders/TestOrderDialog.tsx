import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box,
  TextField, Typography, Tabs, Tab, List, ListItemButton, ListItemText,
  Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Checkbox, Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { Order, OrderType, Patient } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { TEST_ITEMS, TEST_SETS, resolveTestSetItemCodes, type TestItem } from '../../data/testSetMaster';
import ConfirmDiscardDialog from './ConfirmDiscardDialog';
import { todayStr } from './orderDate';

interface Props {
  open: boolean;
  /** 起動元のボタンで確定するオーダ種別（検査＝「検査」／ECT＝「ECT」）。 */
  orderType: OrderType;
  patient: Patient;
  doctorName: string;
  onClose: () => void;
  onRegister: (order: Order) => void;
  /** 項目マスタ（既定＝検査項目）。ECT 等はここを差し替える。 */
  items?: TestItem[];
  /** セットマスタ（既定＝検査セット）。 */
  sets?: { code: number; name: string }[];
  /** セット解決関数（既定＝検査セット解決）。 */
  resolveSetItemCodes?: (code: number) => number[];
  /** セットタブ／過去タブ／内容見出しのラベル（既定＝検査向け）。 */
  setTabLabel?: string;
  pastTabLabel?: string;
  contentLabel?: string;
  /** 項目チェックボックスの aria-label 接頭辞（既定「検査」）。 */
  itemAriaPrefix?: string;
}

/**
 * ep-11 us-57/us-58: チェックボックス選択式のオーダ（検査＝「検査」／ECT）。
 * 左＝セット名一覧／過去オーダー（＋かな検索）、右＝実施予定日＋項目をカテゴリ別に折り畳み表示。
 * セット名／過去オーダーを選ぶと該当項目がチェックされる。マスタ・ラベルは props で差し替え可能（既定＝検査）。
 */
const TestOrderDialog: React.FC<Props> = ({
  open, orderType, patient, doctorName, onClose, onRegister,
  items = TEST_ITEMS,
  sets = TEST_SETS,
  resolveSetItemCodes = resolveTestSetItemCodes,
  setTabLabel = '検査セット',
  pastTabLabel = '過去の検査オーダー',
  contentLabel = '検査内容',
  itemAriaPrefix = '検査',
}) => {
  const [startDate, setStartDate] = React.useState(todayStr());
  const [checked, setChecked] = React.useState<number[]>([]);
  const [query, setQuery] = React.useState('');
  const [leftTab, setLeftTab] = React.useState(0);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  // カテゴリ折り畳みの手動開閉（未指定のカテゴリはチェック有無で自動開閉）。
  const [manualOpen, setManualOpen] = React.useState<Record<string, boolean>>({});

  const lastTest = useAppStore((s) => s.lastTestByType[orderType]);
  const setLastTest = useAppStore((s) => s.setLastTest);

  React.useEffect(() => {
    if (open) {
      setStartDate(todayStr());
      setQuery('');
      setLeftTab(0);
      setConfirmDiscard(false);
      setChecked([]); // 初期は未選択（左のセット／過去オーダーを選んでチェックする）
      setManualOpen({}); // 初期は全カテゴリ閉じる
    }
  }, [open]);

  const dirty = checked.length > 0 || query.trim() !== '';
  const requestClose = () => {
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  const toggle = (code: number) =>
    setChecked((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  /** セット／過去オーダーの選択で、チェックをそのコード群に置き換える（前の選択はクリア）。 */
  const applyCodes = (codes: number[]) => setChecked(Array.from(new Set(codes)));

  // かな検索で絞り込み、グループ（カテゴリ）別に並べる。
  const grouped = React.useMemo(() => {
    const q = query.trim();
    const filtered = q ? items.filter((t) => t.name.includes(q) || t.kana.includes(q)) : items;
    const map = new Map<string, TestItem[]>();
    for (const t of filtered) {
      const g = t.group || 'その他';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(t);
    }
    return Array.from(map, ([group, groupItems]) => ({ group, items: groupItems }));
  }, [query, items]);

  const canRegister = checked.length > 0 && startDate !== '';

  const handleRegister = () => {
    if (!canRegister) return;
    const names = items.filter((t) => checked.includes(t.code)).map((t) => t.name);
    setLastTest(orderType, [...checked]);
    onRegister({
      id: `ORD-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      type: orderType,
      content: names.join(' ／ '),
      schedule: '',
      status: '指示済',
      startDate,
      days: 0,
      doctorName,
    });
  };

  return (
    <Dialog open={open} onClose={requestClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: '85vh' } }}>
      <DialogTitle sx={{ py: 1 }}>
        {orderType}
        <Typography component="span" variant="body2" color="text.secondary">
          対象患者: {patient.patientNumber ?? patient.id}　{patient.name}
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, display: 'flex', minHeight: 0 }}>
        {/* 左: 検査セット／過去オーダー ＋ かな検索 */}
        <Box sx={{ width: 240, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Tabs value={leftTab} onChange={(_, v) => setLeftTab(v)} variant="fullWidth" sx={{ minHeight: 40 }}>
            <Tab label={setTabLabel} sx={{ minHeight: 40, py: 0, fontSize: '0.8rem' }} />
            <Tab label={pastTabLabel} sx={{ minHeight: 40, py: 0, fontSize: '0.75rem' }} />
          </Tabs>
          <Box sx={{ p: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="かな検索"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              inputProps={{ 'aria-label': 'かな検索' }}
            />
          </Box>
          <Divider />
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {leftTab === 0 ? (
              <List dense>
                {sets.map((s) => (
                  <ListItemButton key={s.code} onClick={() => applyCodes(resolveSetItemCodes(s.code))}>
                    <ListItemText primary={s.name} />
                  </ListItemButton>
                ))}
              </List>
            ) : lastTest && lastTest.length > 0 ? (
              <List dense>
                <ListItemButton onClick={() => applyCodes(lastTest)}>
                  <ListItemText primary={`前回のオーダー（${lastTest.length}項目）`} secondary="クリックで項目をチェック" />
                </ListItemButton>
              </List>
            ) : (
              <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block' }}>
                {pastTabLabel}はありません
              </Typography>
            )}
          </Box>
        </Box>

        {/* 右: 実施予定日 ＋ 検査項目（カテゴリ折り畳み） */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, minWidth: 0 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <TextField
              label="実施予定日"
              type="date"
              required
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 180 }}
            />
            <Typography variant="caption" color="text.secondary">担当医: {doctorName}</Typography>
            <Box sx={{ flex: 1 }} />
            <Typography variant="body2" color="primary">選択 {checked.length} 件</Typography>
          </Stack>

          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{contentLabel}</Typography>
          {checked.length === 0 && (
            <Typography variant="caption" color="error" sx={{ display: 'block', mb: 0.5 }}>
              {setTabLabel}もしくは{pastTabLabel}を選択、または項目をチェックしてください
            </Typography>
          )}
          {grouped.length === 0 ? (
            <Typography variant="caption" color="text.secondary">該当する項目がありません</Typography>
          ) : (
            grouped.map(({ group, items }) => {
              const checkedCount = items.filter((t) => checked.includes(t.code)).length;
              // 手動開閉が優先。未指定ならチェック済みがあるカテゴリだけ開く。
              const expanded = manualOpen[group] ?? checkedCount > 0;
              return (
              <Accordion
                key={group}
                disableGutters
                expanded={expanded}
                onChange={(_, isExpanded) => setManualOpen((prev) => ({ ...prev, [group]: isExpanded }))}
                sx={{ '&:before': { display: 'none' } }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#f1f5f9', minHeight: 36, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                  <Typography variant="body2" fontWeight={700}>
                    {group}
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      （{checkedCount}/{items.length}）
                    </Typography>
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0.5 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                    {items.map((t) => (
                      <FormControlLabel
                        key={t.code}
                        sx={{ width: 220, m: 0 }}
                        control={
                          <Checkbox
                            size="small"
                            checked={checked.includes(t.code)}
                            onChange={() => toggle(t.code)}
                            inputProps={{ 'aria-label': `${itemAriaPrefix} ${t.name}` }}
                          />
                        }
                        label={<Typography variant="body2">{t.name}</Typography>}
                      />
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
              );
            })
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={requestClose}>閉じる</Button>
        <Button variant="contained" onClick={handleRegister} disabled={!canRegister}>
          登録
        </Button>
      </DialogActions>

      <ConfirmDiscardDialog
        open={confirmDiscard}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); onClose(); }}
      />
    </Dialog>
  );
};

export default TestOrderDialog;

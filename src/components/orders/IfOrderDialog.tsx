import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box,
  TextField, Typography, IconButton, List, ListItem, ListItemButton, ListItemText, Chip,
  ToggleButton, ToggleButtonGroup, Tabs, Tab, FormControl, InputLabel, Select, MenuItem,
  Divider, Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { Order, OrderType, Patient } from '../../types';
import type { Medication } from '../../data/prescriptionMaster';
import { MEDICATIONS } from '../../data/prescriptionMaster';
import { PRESCRIPTION_SETS, resolveSetDrugs } from '../../data/prescriptionSetMaster';
import { INJECTION_MEDICATIONS, INJECTION_SETS, resolveInjectionSetDrugs } from '../../data/injectionSetMaster';
import { ORDERS } from '../../data/mockData';
import { IF_SETS, IF_SET_GROUPS, type IfSet } from '../../data/ifMaster';
import { useAppStore } from '../../stores/useAppStore';
import { todayStr } from './orderDate';
import PrescriptionDialog from './PrescriptionDialog';
import TestOrderDialog from './TestOrderDialog';
import EctOrderDialog from './EctOrderDialog';
import RehaOrderDialog from './RehaOrderDialog';
import TextOrderDialog from './TextOrderDialog';
import ConfirmDiscardDialog from './ConfirmDiscardDialog';
import IfSymptomPickerDialog from './IfSymptomPickerDialog';

/** IF 内で使えるサブオーダの設定（IF 自身は除外）。OrderSendScreen と同じ種別を流用。 */
interface ComposeConfig {
  kind: 'drug' | 'test' | 'ect' | 'reha' | 'freetext';
  orderType: OrderType;
  showPackaging?: boolean;
  addTitle?: string;
  setLabel?: string;
  medications?: Medication[];
  sets?: { code: number; name: string }[];
  resolveSet?: (code: number) => { name: string; dose: string; unit: string; usage: string }[];
  showEndDate?: boolean;
  daysLabel?: string;
  perRowDays?: boolean;
  hideDays?: boolean;
}
// IF は頓用（症状時）のため日数・回数は不要 → hideDays: true。
const rxConfig = (orderType: Extract<OrderType, '処方' | '入院定時'>): ComposeConfig => ({
  kind: 'drug', orderType, showPackaging: true, addTitle: '処方追加', setLabel: '処方セット',
  medications: MEDICATIONS, sets: PRESCRIPTION_SETS, resolveSet: resolveSetDrugs,
  showEndDate: false, perRowDays: true, hideDays: true,
});
const injectionConfig: ComposeConfig = {
  kind: 'drug', orderType: '注射', showPackaging: false, addTitle: '注射追加', setLabel: '注射セット',
  medications: INJECTION_MEDICATIONS, sets: INJECTION_SETS, resolveSet: resolveInjectionSetDrugs,
  perRowDays: true, hideDays: true,
};
// IF の種別ボタン（処方・注射・検査・ECT・リハビリ・テキスト。IF／入院定時は除外）。
const IF_TYPE_BUTTONS: { key: OrderType; label: string; config: ComposeConfig }[] = [
  { key: '処方', label: '処方', config: rxConfig('処方') },
  { key: '注射', label: '注射', config: injectionConfig },
  { key: '検査', label: '検査', config: { kind: 'test', orderType: '検査' } },
  { key: 'ECT', label: 'ECT', config: { kind: 'ect', orderType: 'ECT' } },
  { key: 'リハビリ', label: 'リハビリ', config: { kind: 'reha', orderType: 'リハビリ' } },
  { key: '文字', label: 'テキスト', config: { kind: 'freetext', orderType: '文字' } },
];

const orderTypeLabel = (t: OrderType): string => (t === '文字' ? 'テキスト' : t);

function orderToDrugs(o: Order): { name: string; dose: string; unit: string; usage: string }[] {
  return o.content
    .split(/\r?\n|\s*／\s*/)
    .map((seg) => seg.replace(/^Rp\d+[　\s]*/, '').replace(/^[　\s]+/, '').trim())
    .map((seg) => seg.replace(/\s*×\d+日分\s*$/, '').trim())
    .filter((seg) => seg !== '' && seg !== '継続' && !/^\d+日分$/.test(seg))
    .map((seg) => parseDrugSegment(seg, o.schedule));
}
/**
 * 1 薬品の表記（例「アキネトン錠1mg 1錠（不穏時）」）を名称・用量・単位・用法へ分解する。
 * 用法＝最初の丸カッコ、以降（包装等）は無視。用量・単位＝名称との間の半角スペース区切りの「{数値}{単位}」。
 */
function parseDrugSegment(seg: string, fallbackUsage: string): { name: string; dose: string; unit: string; usage: string } {
  let usage = fallbackUsage || '';
  let name = seg.trim();
  let dose = '';
  let unit = '';
  const pm = seg.match(/^([^（]+)（([^（）]+)）/);
  if (pm) {
    const head = pm[1].trim();
    usage = pm[2].trim();
    name = head;
    const dm = head.match(/^(.*\S)\s+(\d+(?:\.\d+)?)\s*(\D+?)\s*$/);
    if (dm) { name = dm[1].trim(); dose = dm[2]; unit = dm[3].trim(); }
  }
  return { name, dose, unit, usage };
}

interface Props {
  open: boolean;
  orderType: OrderType; // 'IF'
  patient: Patient;
  doctorName: string;
  onClose: () => void;
  /** IF を「作成中のオーダ」へ積む。ifOrder＝束ねた IF オーダ、detail＝実施用のサブオーダ内訳。 */
  onRegister: (ifOrder: Order, detail: { symptom: string; comment: string; orders: Order[] }) => void;
}

/**
 * ep-11 us-60: IF オーダ（症状に応じた指示）。参考システム実機に準拠。
 * 症状（自由入力＋テンプレート選択）・コメント（自由）＋種別ボタン（処方/注射/検査 等・IF除外）で
 * 各オーダをその場で組み、指示歴（過去のIFをDO）・セット表示（登録済みセット）から取り込める。
 * [指示] で「作成中のオーダ」へ 1 件の IF オーダとして積む。オーダ送信の [指示]（カルテ記事作成）で確定し、
 * IF は頓用のためカルテ「IFオーダ」タブに待機登録される（実施はそのタブから行う）。
 */
const IfOrderDialog: React.FC<Props> = ({ open, patient, doctorName, onClose, onRegister }) => {
  const dynamicOrders = useAppStore((s) => s.dynamicOrders);
  const ifCompositions = useAppStore((s) => s.ifCompositions[patient.id]);
  const addIfComposition = useAppStore((s) => s.addIfComposition);

  const [symptom, setSymptom] = React.useState('');
  const [comment, setComment] = React.useState('');
  const [composed, setComposed] = React.useState<Order[]>([]);
  const [leftMode, setLeftMode] = React.useState<'指示歴' | 'セット表示'>('指示歴');
  const [setScope, setSetScope] = React.useState<'共通' | '個人'>('共通');
  const [setGroup, setSetGroup] = React.useState(IF_SET_GROUPS[0] ?? '');
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [sub, setSub] = React.useState<{ open: boolean; config: ComposeConfig }>({ open: false, config: rxConfig('処方') });
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSymptom(''); setComment(''); setComposed([]); setLeftMode('指示歴');
      setSetScope('共通'); setSetGroup(IF_SET_GROUPS[0] ?? '');
      setPickerOpen(false); setSub({ open: false, config: rxConfig('処方') }); setConfirmDiscard(false);
    }
  }, [open]);

  const dirty = symptom !== '' || comment !== '' || composed.length > 0;
  const requestClose = () => { if (dirty) setConfirmDiscard(true); else onClose(); };

  // 処方追加の「過去のオーダー」用: この患者の同種別オーダ履歴。
  const pastGroupsFor = (t: OrderType) =>
    [...ORDERS, ...dynamicOrders]
      .filter((o) => o.patientId === patient.id && o.type === t)
      .map((o) => ({ key: o.id, label: `${o.startDate}　${o.content}`, drugs: orderToDrugs(o) }))
      .filter((g) => g.drugs.length > 0);

  const handleSubRegister = (order: Order) => {
    setComposed((prev) => [...prev, order]);
    setSub((s) => ({ ...s, open: false }));
  };
  const removeComposed = (id: string) => setComposed((prev) => prev.filter((o) => o.id !== id));

  // セット表示のセットを取り込む（登録済みサブオーダを composed に追加）。
  const applySet = (set: IfSet) => {
    const added: Order[] = set.orders.map((so, i) => ({
      id: `IFSET-${Date.now()}-${i}`,
      patientId: patient.id, patientName: patient.name,
      type: so.type, content: so.content, schedule: so.schedule,
      status: '指示済', startDate: todayStr(), days: so.days, doctorName,
    }));
    setComposed((prev) => [...prev, ...added]);
  };

  // 指示歴のDO: 過去のIFを症状・コメント・内容（医薬品含む）ごと復元。
  const doPast = (comp: { symptom: string; comment: string; orders: Order[] }) => {
    setSymptom(comp.symptom);
    setComment(comp.comment);
    setComposed(comp.orders.map((o, i) => ({ ...o, id: `IFDO-${Date.now()}-${i}`, startDate: todayStr() })));
  };

  const visibleSets = IF_SETS.filter((s) => s.scope === setScope && s.group === setGroup);

  const canRegister = composed.length > 0;
  const handleRegister = () => {
    if (!canRegister) return;
    // 各サブオーダに IF 症状を schedule として付す（未設定時）。
    const orders = composed.map((o) => ({ ...o, schedule: o.schedule || symptom }));
    // 指示歴（DO）用にはサブオーダ内訳を保存。医薬品ごと復元できるようにする。
    addIfComposition(patient.id, { symptom, comment, orders });
    // 「作成中のオーダ」へは 1 件の IF オーダとして積む（サブオーダ内容をまとめて表示）。
    const bodyLines: string[] = [];
    if (comment) bodyLines.push(`コメント: ${comment}`);
    orders.forEach((o) => {
      bodyLines.push(`［${orderTypeLabel(o.type)}］`);
      bodyLines.push(o.content);
    });
    const ifOrder: Order = {
      id: `IF-${Date.now()}`,
      patientId: patient.id, patientName: patient.name,
      type: 'IF', content: bodyLines.join('\n'),
      schedule: symptom || 'IF', status: '指示済', startDate: todayStr(), days: 0, doctorName,
    };
    onRegister(ifOrder, { symptom, comment, orders });
  };

  return (
    <Dialog open={open} onClose={requestClose} maxWidth="lg" fullWidth PaperProps={{ sx: { height: '88vh' } }}>
      <DialogTitle sx={{ py: 1, bgcolor: '#1e3a5f', color: '#fff' }}>
        <Typography variant="subtitle1">
          IFオーダ［精神科］　{patient.patientNumber ?? patient.id}：{patient.name}
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* 症状・コメント */}
        <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="body2" sx={{ width: 56 }}>症状</Typography>
            <TextField size="small" fullWidth value={symptom} onChange={(e) => setSymptom(e.target.value)}
              placeholder="自由入力、または右のボタンからテンプレート選択"
              inputProps={{ 'aria-label': '症状' }} />
            <Tooltip title="症状テンプレートから選択">
              <IconButton size="small" onClick={() => setPickerOpen(true)} aria-label="症状テンプレート選択">
                <SearchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Typography variant="body2" sx={{ width: 56, mt: 1 }}>コメント</Typography>
            <TextField size="small" fullWidth multiline minRows={1} value={comment}
              onChange={(e) => setComment(e.target.value)} inputProps={{ 'aria-label': 'コメント' }} />
          </Stack>
        </Box>

        <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* 左: 指示歴 / セット表示 */}
          <Box sx={{ width: 260, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ minHeight: 50, display: 'flex', alignItems: 'center', px: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              <ToggleButtonGroup size="small" exclusive fullWidth value={leftMode} onChange={(_, v) => v && setLeftMode(v)}>
                <ToggleButton value="指示歴" sx={{ py: 0.25 }}>指示歴</ToggleButton>
                <ToggleButton value="セット表示" sx={{ py: 0.25 }}>セット表示</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {leftMode === '指示歴' ? (
                (ifCompositions ?? []).length === 0 ? (
                  <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block' }}>
                    過去の IF オーダはありません
                  </Typography>
                ) : (
                  <List dense>
                    {(ifCompositions ?? []).map((c, i) => (
                      <ListItem key={i} divider sx={{ gap: 1, alignItems: 'flex-start' }}>
                        <ListItemText
                          primary={c.symptom || '（症状なし）'}
                          secondary={c.orders.map((o) => orderTypeLabel(o.type)).join('・')}
                          primaryTypographyProps={{ variant: 'body2' }}
                          sx={{ m: 0, minWidth: 0 }}
                        />
                        <Button size="small" variant="outlined" onClick={() => doPast(c)}
                          aria-label={`DO ${c.symptom}`} sx={{ flexShrink: 0, mt: 0.25 }}>DO</Button>
                      </ListItem>
                    ))}
                  </List>
                )
              ) : (
                <>
                  <Stack direction="row" spacing={0.5} sx={{ p: 1 }}>
                    <ToggleButtonGroup size="small" exclusive value={setScope} onChange={(_, v) => v && setSetScope(v)}>
                      <ToggleButton value="共通" sx={{ py: 0 }}>共通</ToggleButton>
                      <ToggleButton value="個人" sx={{ py: 0 }}>個人</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>
                  <FormControl size="small" fullWidth sx={{ px: 1, pb: 1 }}>
                    <Select value={setGroup} onChange={(e) => setSetGroup(e.target.value)}>
                      {IF_SET_GROUPS.map((g) => (<MenuItem key={g} value={g}>{g}</MenuItem>))}
                    </Select>
                  </FormControl>
                  <Divider />
                  {visibleSets.length === 0 ? (
                    <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block' }}>セットがありません</Typography>
                  ) : (
                    <List dense>
                      {visibleSets.map((s) => (
                        <ListItemButton key={s.name} divider onClick={() => applySet(s)}>
                          <ListItemText primary={s.name} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItemButton>
                      ))}
                    </List>
                  )}
                </>
              )}
            </Box>
          </Box>

          {/* 右: 種別ボタン（上部） + 内容（構成中のサブオーダ） */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            {/* 種別ボタン（IF／入院定時 除外） */}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minHeight: 50, px: 1, py: 0.5, flexWrap: 'wrap', rowGap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
              {IF_TYPE_BUTTONS.map((b) => (
                <Button key={b.key} size="small" variant="contained"
                  onClick={() => setSub({ open: true, config: b.config })}>
                  {b.label}
                </Button>
              ))}
            </Stack>
            <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, minHeight: 0 }}>
            <Typography variant="caption" color="text.secondary">内容（構成中のオーダ）</Typography>
            {composed.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                種別ボタンで各オーダを追加、またはセット表示／指示歴 DO で取り込んでください。
              </Typography>
            ) : (
              <List dense>
                {composed.map((o) => (
                  <ListItem key={o.id} divider alignItems="flex-start" secondaryAction={
                    <IconButton edge="end" size="small" aria-label={`削除 ${o.type}`} onClick={() => removeComposed(o.id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  }>
                    <Chip label={orderTypeLabel(o.type)} size="small" sx={{ mr: 1, mt: 0.5 }} />
                    <ListItemText primary={o.content} primaryTypographyProps={{ variant: 'body2', sx: { whiteSpace: 'pre-line' } }} />
                  </ListItem>
                ))}
              </List>
            )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={requestClose}>閉じる</Button>
        <Button variant="contained" onClick={handleRegister} disabled={!canRegister}>指示</Button>
      </DialogActions>

      {/* 症状テンプレート選択 */}
      <IfSymptomPickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)}
        onSelect={(s) => { setSymptom(s); setPickerOpen(false); }} />

      {/* サブオーダ入力ダイアログ（種別ボタンから起動） */}
      {sub.config.kind === 'test' ? (
        <TestOrderDialog open={sub.open} orderType={sub.config.orderType} patient={patient} doctorName={doctorName}
          onClose={() => setSub((s) => ({ ...s, open: false }))} onRegister={handleSubRegister} />
      ) : sub.config.kind === 'ect' ? (
        <EctOrderDialog open={sub.open} orderType={sub.config.orderType} patient={patient} doctorName={doctorName}
          onClose={() => setSub((s) => ({ ...s, open: false }))} onRegister={handleSubRegister} />
      ) : sub.config.kind === 'reha' ? (
        <RehaOrderDialog open={sub.open} orderType={sub.config.orderType} patient={patient} doctorName={doctorName}
          onClose={() => setSub((s) => ({ ...s, open: false }))} onRegister={handleSubRegister} />
      ) : sub.config.kind === 'freetext' ? (
        <TextOrderDialog open={sub.open} orderType={sub.config.orderType} patient={patient} doctorName={doctorName}
          onClose={() => setSub((s) => ({ ...s, open: false }))} onRegister={handleSubRegister} />
      ) : (
        <PrescriptionDialog open={sub.open} orderType={sub.config.orderType} patient={patient} doctorName={doctorName}
          onClose={() => setSub((s) => ({ ...s, open: false }))} onRegister={handleSubRegister}
          showPackaging={sub.config.showPackaging} addTitle={sub.config.addTitle} setLabel={sub.config.setLabel}
          medications={sub.config.medications} sets={sub.config.sets} resolveSet={sub.config.resolveSet}
          showEndDate={sub.config.showEndDate} daysLabel={sub.config.daysLabel} perRowDays={sub.config.perRowDays}
          hideDays={sub.config.hideDays} pastGroups={pastGroupsFor(sub.config.orderType)} />
      )}

      <ConfirmDiscardDialog open={confirmDiscard} onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); onClose(); }} />
    </Dialog>
  );
};

export default IfOrderDialog;

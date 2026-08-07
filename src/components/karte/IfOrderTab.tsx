import React from 'react';
import {
  Box, Typography, Button, Divider, List, ListItemButton, ListItemText,
  Checkbox, FormControlLabel, TextField, Stack,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import IconButton from '@mui/material/IconButton';
import type { Patient, OrderType, Order } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import type { KarteMode } from './KartePage';
import { todayStr, MOCK_TODAY } from '../orders/orderDate';

interface Props {
  patient: Patient;
  mode?: KarteMode;
  /** 指示簿から遷移してきたときに選択・表示する対象オーダ id。 */
  focusOrderId?: string | null;
  /** focusOrderId を再適用するためのシグナル（同じ id を再クリックしても反映されるよう increment）。 */
  focusSignal?: number;
}

// 実施者（ログイン看護師・モック固定）。フローシートのオーダ実施と同一。
const LOGIN_NURSE = '看護 花子';

// 実施日時（YYYY-MM-DD HH:mm）。
const nowStr = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

// 種別ごとのセクション見出しラベルと配色（参考システム実機準拠）。
const SECTION: Record<string, { label: string; bg: string; fg: string }> = {
  処方: { label: '処方', bg: '#e3f0fb', fg: '#1e5aa8' },
  入院定時: { label: '入院定時', bg: '#e3f0fb', fg: '#1e5aa8' },
  注射: { label: '注射', bg: '#e6f4ea', fg: '#1e7e34' },
  検査: { label: '検査', bg: '#fce8e8', fg: '#b3261e' },
  ECT: { label: 'ECT', bg: '#eef2f6', fg: '#475569' },
  リハビリ: { label: 'リハビリ', bg: '#eef2f6', fg: '#475569' },
  文字: { label: 'テキスト', bg: '#eef2f6', fg: '#475569' },
};
const sectionOf = (t: OrderType) => SECTION[t] ?? { label: t, bg: '#eef2f6', fg: '#475569' };

/**
 * ep-11 us-60: カルテ「IFオーダ」タブ（参考システム実機に準拠）。
 * 左＝症状（登録済み IF オーダ一覧）、右＝選択した IF オーダの内容（種別ごとに色分けセクション）。
 * IF は頓用（都度実施）のため、症状が出たら該当サブオーダにチェックして [実施] すると、
 * 実オーダを発行して即時実施済にし、各オーダのカルテ記事を作成する（フローシート予定オーダ・指示簿へ反映）。
 * IF オーダ自体（左の症状エントリ）は待機のまま残り、実施ボタンは何度でも押せる（実施済にはしない）。
 */
const IfOrderTab: React.FC<Props> = ({ patient, focusOrderId, focusSignal }) => {
  const entries = useAppStore((s) => s.ifOrders[patient.id]) ?? [];
  const addOrder = useAppStore((s) => s.addOrder);
  const executeOrder = useAppStore((s) => s.executeOrder);
  const appendMedicalRecord = useAppStore((s) => s.appendMedicalRecord);
  const nextKarteNo = useAppStore((s) => s.nextKarteNo);
  const assignKarteNos = useAppStore((s) => s.assignKarteNos);
  const showSnackbar = useAppStore((s) => s.showSnackbar);

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [checkedIds, setCheckedIds] = React.useState<Set<string>>(new Set());

  const selected = entries.find((e) => e.id === selectedId) ?? null;

  // 先頭のIFオーダを既定選択。選択が変わったら全サブオーダをチェック済みに初期化。
  React.useEffect(() => {
    if (selectedId === null && entries.length > 0) setSelectedId(entries[0].id);
  }, [entries, selectedId]);

  // 指示簿から遷移してきたとき、対象オーダ id が一覧にあれば選択・表示する。
  React.useEffect(() => {
    // focusSignal の変化（＝指示簿からの遷移。同じ id の再クリックでも increment される）で再適用する。
    if (focusOrderId && entries.some((e) => e.id === focusOrderId)) {
      setSelectedId(focusOrderId);
    }
  }, [focusSignal, focusOrderId, entries]);
  React.useEffect(() => {
    if (selected) setCheckedIds(new Set(selected.orders.map((o) => o.id)));
    else setCheckedIds(new Set());
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) =>
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  // IF は頓用（都度実施）のため、実施ボタンは何度でも押せる（実施済で無効化しない）。
  const canExecute = !!selected && selected.orders.some((o) => checkedIds.has(o.id));

  const handleExecute = () => {
    if (!selected) return;
    const at = nowStr();
    // 実施ごとに一意なキー（ダブルクリック等で同一ミリ秒に連続実施しても衝突しないようランダム要素を付与）。
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    // 実施ごとに、各オーダへカルテNoを連番発行する。
    let n = nextKarteNo;
    const nos: Record<string, string> = {};
    // カルテ記事の日付（モック当日）。
    const d = new Date(`${MOCK_TODAY}T00:00:00`);
    const dateStr = MOCK_TODAY.replace(/-/g, '/');
    const dow = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
    const typeLabel = (t: OrderType) => (t === '文字' ? 'テキスト' : t);

    const targets = selected.orders.filter((o) => checkedIds.has(o.id));
    // チェックされたサブオーダを実オーダとして発行し、即時実施済にする（実施ごとに一意 id）。
    targets.forEach((o, i) => {
      const id = `IFEXEC-${selected.id}-${stamp}-${i}`;
      addOrder({
        ...o, id, patientId: patient.id, patientName: patient.name,
        // 頓用の単発実施のため、実施日（本日）1 日のみ実施確認表に出す。
        status: '指示済', startDate: todayStr(), days: 1,
      });
      executeOrder(id, LOGIN_NURSE, at);
      nos[id] = `NO.${n}`; n += 1;
      // 各オーダのカルテ記事（看護記録）を作成し、実施した扱いにする。
      appendMedicalRecord(patient.id, {
        id: `MR-IF-${stamp}-${i}`,
        date: dateStr, dayOfWeek: dow,
        category: '看護記録', author: LOGIN_NURSE, authorRole: '看護師',
        content: [
          `【IFオーダ実施】${selected.symptom ? `（${selected.symptom}）` : ''}`,
          `［${typeLabel(o.type)}］`,
          o.content,
        ].join('\n'),
        tags: ['IF', '実施'],
        orderNumber: nos[id],
        timestamp: `${dateStr} ${at.slice(11)}`,
        likes: 0, comments: 0,
      });
    });
    assignKarteNos(nos, n);
    showSnackbar(`IFオーダ（${selected.symptom || '症状未設定'}）を実施しました（${targets.length}件・カルテ記載）`, 'success');
  };

  // 選択中IFオーダのサブオーダを種別ごとにグループ化（登録順を維持）。
  const groups: { type: OrderType; orders: Order[] }[] = React.useMemo(() => {
    if (!selected) return [];
    const out: { type: OrderType; orders: Order[] }[] = [];
    selected.orders.forEach((o) => {
      const g = out.find((x) => x.type === o.type);
      if (g) g.orders.push(o); else out.push({ type: o.type, orders: [o] });
    });
    return out;
  }, [selected]);

  return (
    <Box sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: 480, overflow: 'hidden' }}>
      {/* 左: 症状（登録済み IF オーダ一覧） */}
      <Box sx={{ width: 280, flexShrink: 0, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="subtitle2" sx={{ px: 1.5, py: 1, bgcolor: '#2f6ca6', color: '#fff' }}>症状</Typography>
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {entries.length === 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: 'block' }}>
              登録済みの IF オーダはありません。「オーダー入力」→「IF」から登録してください。
            </Typography>
          ) : (
            <List dense disablePadding>
              {entries.map((e) => (
                <ListItemButton key={e.id} divider selected={e.id === selectedId}
                  onClick={() => setSelectedId(e.id)}
                  sx={{ bgcolor: e.status === '実施済' ? '#f3f4f6' : '#fdf6d8', alignItems: 'flex-start' }}>
                  <ListItemText
                    primary={`［${e.symptom || '症状未設定'}］${e.status === '実施済' ? '（実施済）' : ''}`}
                    secondary={`${e.registeredAt}　${e.doctorName}`}
                    primaryTypographyProps={{ variant: 'body2', sx: { fontWeight: 600 } }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </Box>

      {/* 右: 内容（選択した IF オーダの構成サブオーダを種別ごとに表示） */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ px: 1.5, py: 1, bgcolor: '#2f6ca6', color: '#fff' }}>内容</Typography>
        <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
          {!selected ? (
            <Typography variant="body2" color="text.secondary">左の症状から IF オーダを選択してください。</Typography>
          ) : groups.length === 0 ? (
            <Typography variant="body2" color="text.secondary">オーダがありません。</Typography>
          ) : (
            groups.map((g, gi) => {
              const s = sectionOf(g.type);
              return (
                <Box key={gi} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1.5, overflow: 'hidden' }}>
                  <Stack direction="row" alignItems="center" sx={{ bgcolor: s.bg, px: 1, py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: s.fg, fontWeight: 700, flex: 1 }}>
                      ［{s.label}］
                    </Typography>
                    {/* 削除は本モックでは表示のみ（非活性）。 */}
                    <IconButton size="small" aria-label={`削除 ${s.label}`} disabled>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Box sx={{ p: 1 }}>
                    {g.orders.map((o) => (
                      <Stack key={o.id} direction="row" alignItems="flex-start" spacing={0.5} sx={{ mb: 0.25 }}>
                        <Checkbox
                          size="small"
                          sx={{ p: 0.25 }}
                          checked={checkedIds.has(o.id)}
                          onChange={() => toggle(o.id)}
                          inputProps={{ 'aria-label': `実施対象 ${o.content}` }}
                        />
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{o.content}</Typography>
                      </Stack>
                    ))}
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">備考</Typography>
                      <TextField
                        size="small"
                        variant="standard"
                        fullWidth
                        inputProps={{ 'aria-label': `備考 ${s.label}` }}
                      />
                    </Stack>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        {/* 下部: 実施バー（指示箋印刷・医事連携・看護記録の作成／実施日／処方チェック・実施） */}
        <Divider />
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1.5, py: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
          <FormControlLabel control={<Checkbox size="small" defaultChecked />}
            label={<Typography variant="caption">指示箋印刷</Typography>} />
          <FormControlLabel control={<Checkbox size="small" defaultChecked />}
            label={<Typography variant="caption">医事連携</Typography>} />
          <FormControlLabel control={<Checkbox size="small" />}
            label={<Typography variant="caption">看護記録の作成</Typography>} />
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary">実施日: {todayStr()}</Typography>
          <Button size="small" variant="outlined" onClick={() => showSnackbar('処方チェック: 問題ありません', 'success')}>処方チェック</Button>
          <Button size="small" variant="contained" disabled={!canExecute} onClick={handleExecute}>実施</Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default IfOrderTab;

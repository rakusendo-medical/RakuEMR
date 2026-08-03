import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Stack,
  Typography, TextField, Chip,
} from '@mui/material';
import type { Order, OrderType } from '../../types';

/** オーダ種別ごとのセクション帯の色（参考システムのカルテ記事作成に合わせた区分色）。 */
const SECTION_COLOR: Partial<Record<OrderType, string>> = {
  処方: '#ccfbf1', 注射: '#dcfce7', 検査: '#fee2e2',
  ECT: '#ede9fe', リハビリ: '#fef9c3', 入院定時: '#dbeafe', IF: '#f1f5f9', 文字: '#f1f5f9',
};
const orderTypeLabel = (t: OrderType): string => (t === '文字' ? 'テキスト' : t);

interface Props {
  open: boolean;
  /** 指示するオーダ（作成中のオーダ）。 */
  orders: Order[];
  onClose: () => void;
  /** [実行]で確定。種別ごとの所見を渡す。 */
  onExecute: (shokenByType: Record<string, string>) => void;
}

/**
 * ep-11: オーダ指示時の「カルテ記事作成（現在指示中）」ダイアログ。
 * 参考システムの実機（オーダ送信時のカルテ作成）に準拠。指示するオーダを種別ごとにまとめ、
 * 各種別に所見を付けて [実行] するとオーダ確定＋カルテ記事を作成する。
 */
const OrderKarteRecordDialog: React.FC<Props> = ({ open, orders, onClose, onExecute }) => {
  const [shoken, setShoken] = React.useState<Record<string, string>>({});

  React.useEffect(() => { if (open) setShoken({}); }, [open]);

  // 種別ごとにグループ化（出現順を維持）。
  const groups = React.useMemo(() => {
    const map = new Map<OrderType, Order[]>();
    orders.forEach((o) => {
      if (!map.has(o.type)) map.set(o.type, []);
      map.get(o.type)!.push(o);
    });
    return Array.from(map, ([type, list]) => ({ type, list }));
  }, [orders]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { height: '85vh' } }}>
      <DialogTitle sx={{ py: 1, bgcolor: '#1e3a5f', color: '#fff', display: 'flex', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ flex: 1 }}>カルテ記事作成</Typography>
        <Typography variant="subtitle2" sx={{ letterSpacing: 1 }}>&gt;&gt;&gt; 現在指示中 &lt;&lt;&lt;</Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, overflow: 'auto' }}>
        {groups.map(({ type, list }) => (
          <Box key={type} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
            {/* 種別セクションの帯 */}
            <Box sx={{ bgcolor: SECTION_COLOR[type] ?? '#f1f5f9', px: 1.5, py: 0.5 }}>
              <Typography variant="body2" fontWeight={700}>［{orderTypeLabel(type)}］</Typography>
            </Box>
            {list.map((o) => (
              <Box key={o.id} sx={{ px: 2, py: 0.75, borderTop: '1px solid', borderColor: '#f1f5f9' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontSize: '0.82rem' }}>{o.content}</Typography>
              </Box>
            ))}
            {/* 備考・所見 */}
            <Box sx={{ px: 2, py: 0.75, bgcolor: '#fafafa' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary" sx={{ width: 40 }}>所見</Typography>
                <TextField
                  size="small" fullWidth variant="standard" placeholder="所見を入力する"
                  value={shoken[type] ?? ''}
                  onChange={(e) => setShoken((prev) => ({ ...prev, [type]: e.target.value }))}
                  inputProps={{ 'aria-label': `所見 ${orderTypeLabel(type)}` }}
                />
              </Stack>
            </Box>
          </Box>
        ))}
        {groups.length === 0 && (
          <Box sx={{ p: 2 }}><Typography variant="body2" color="text.secondary">指示するオーダがありません。</Typography></Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2 }}>
        <Chip size="small" label={`基本記事：${orders.length}件のオーダ`} sx={{ mr: 'auto' }} />
        <Button onClick={onClose}>閉じる</Button>
        <Button variant="contained" onClick={() => onExecute(shoken)} disabled={orders.length === 0}>実行</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderKarteRecordDialog;

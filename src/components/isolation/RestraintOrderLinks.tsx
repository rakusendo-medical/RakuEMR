// ===== ep-05 隔離拘束指示 =====
// カルテ画面の診療録セクション右側に配置する隔離拘束指示リンク群。
// マスタ「隔離拘束変更=する」（optionalFeatures.restraintChange）有効時は 12 リンク、
// 無効時は基本 6 リンク（開始/解除）のみ表示する。
// 解除/継続/変更系リンクは現在 active な区分が無ければグレーアウトする。
import React from 'react';
import { Stack, Link, Tooltip } from '@mui/material';
import type { Patient, IsolationSubtype, IsolationOperation } from '../../types';
import { ISOLATION_ORDERS } from '../../data/mockData';
import { useAppStore } from '../../stores/useAppStore';

const SUBTYPES: IsolationSubtype[] = ['隔離', '拘束', '隔離拘束'];
const BASE_OPS: IsolationOperation[] = ['開始', '解除'];
const EXTRA_OPS: IsolationOperation[] = ['継続', '変更'];

interface Props {
  patient: Patient | null;
  /** リンククリックで起動するダイアログのコールバック */
  onRequestOrder: (title: string, editOrderId?: string) => void;
}

const RestraintOrderLinks: React.FC<Props> = ({ patient, onRequestOrder }) => {
  const restraintChangeEnabled = useAppStore((s) => s.optionalFeatures.restraintChange);
  const dynamicOrders = useAppStore((s) => s.dynamicIsolationOrders);

  // この患者の現在 active な指示を区分ごとに集約
  const activeBySubtype = React.useMemo(() => {
    if (!patient) return new Map<IsolationSubtype, string>();
    const merged = [...ISOLATION_ORDERS, ...dynamicOrders].filter((o) => o.patientId === patient.id);
    const result = new Map<IsolationSubtype, string>();
    for (const o of merged) {
      // 終了済（endDatetime あり）は除外。継続/変更は active 扱い。
      if (o.endDatetime) continue;
      const sub: IsolationSubtype = o.subtype ?? (o.type === '隔離' ? '隔離' : '拘束');
      result.set(sub, o.id);
    }
    return result;
  }, [patient, dynamicOrders]);

  const ops = restraintChangeEnabled ? [...BASE_OPS, ...EXTRA_OPS] : BASE_OPS;

  // リンク生成
  const items: Array<{ title: string; subtype: IsolationSubtype; operation: IsolationOperation; activeId?: string; disabled: boolean }> = [];
  for (const sub of SUBTYPES) {
    for (const op of ops) {
      const title = `${sub}${op}`;
      const activeId = activeBySubtype.get(sub);
      // 開始: 既に active がある場合はグレー（重複指示防止）
      // 解除/継続/変更: active がない場合はグレー
      const disabled = op === '開始' ? !!activeId : !activeId;
      items.push({ title, subtype: sub, operation: op, activeId, disabled });
    }
  }

  if (!patient) return null;

  return (
    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ alignItems: 'center' }}>
      {items.map((it) => {
        const link = (
          <Link
            key={it.title}
            component="button"
            type="button"
            underline="hover"
            disabled={it.disabled}
            onClick={() => onRequestOrder(it.title, it.operation === '開始' ? undefined : it.activeId)}
            sx={{
              fontSize: '0.7rem',
              color: it.disabled ? 'text.disabled' : 'primary.main',
              cursor: it.disabled ? 'not-allowed' : 'pointer',
              px: 0.5,
              border: 'none',
              background: 'none',
              fontWeight: 500,
              '&:hover': it.disabled ? {} : { textDecoration: 'underline' },
            }}
          >
            [{it.title}]
          </Link>
        );
        if (it.disabled) {
          const tip = it.operation === '開始'
            ? `${it.subtype} は既に active な指示があります`
            : `${it.subtype} の active な指示がありません`;
          return <Tooltip key={it.title} title={tip}><span>{link}</span></Tooltip>;
        }
        return link;
      })}
    </Stack>
  );
};

export default RestraintOrderLinks;

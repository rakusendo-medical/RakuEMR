import React from 'react';
import {
  Dialog, AppBar, Toolbar, Typography, IconButton, Box, Button, Stack, Divider,
  List, ListItem, ListItemButton, ListItemText, Chip, FormControlLabel, Checkbox, Tooltip, TextField,
  Popover, Select, MenuItem, InputLabel, FormControl,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { Order, OrderType, Patient, WardId, PrescriptionRpRow } from '../../types';
import { buildRxContent, rxOrderDays, isRxType, rxRenderConfig, rxMarks } from '../../data/prescriptionContent';
import type { Medication } from '../../data/prescriptionMaster';
import { MEDICATIONS } from '../../data/prescriptionMaster';
import { PRESCRIPTION_SETS, resolveSetDrugs } from '../../data/prescriptionSetMaster';
import { INJECTION_MEDICATIONS, INJECTION_SETS, resolveInjectionSetDrugs } from '../../data/injectionSetMaster';
import { ORDERS } from '../../data/mockData';
import { ORDER_SET_GROUPS, resolveOrderSet, type OrderSetDef } from '../../data/orderSetMaster';
import { useAppStore } from '../../stores/useAppStore';
import PrescriptionDialog from './PrescriptionDialog';
import TestOrderDialog from './TestOrderDialog';
import PsychTestOrderDialog from './PsychTestOrderDialog';
import ImagingOrderDialog from './ImagingOrderDialog';
import EctOrderDialog from './EctOrderDialog';
import IfOrderDialog from './IfOrderDialog';
import { NewRecordDialog, STATUS_COLORS, INTERVIEW_FORMS, type NewRecordData } from '../karte/MedicalRecordTab';
import ConfirmDiscardDialog from './ConfirmDiscardDialog';
import OrderDialogTitle from './OrderDialogTitle';
import OrderKarteRecordDialog from './OrderKarteRecordDialog';
import { todayStr, MOCK_TODAY } from './orderDate';

const WARD_LABEL: Record<WardId, string> = { ward1: '第１病棟', ward2: '第２病棟' };

// 作成中オーダの種別ごとの色分けセクション（参考システム実機準拠）。見出しラベル・背景・文字色。
const PENDING_SECTION: Partial<Record<OrderType, { label: string; bg: string; fg: string }>> = {
  入院定時: { label: '入院定時', bg: '#e3f0fb', fg: '#1e5aa8' },
  処方: { label: '処方', bg: '#e0f2f1', fg: '#00695c' },
  注射: { label: '注射', bg: '#e8f5e9', fg: '#2e7d32' },
  検査: { label: '検査', bg: '#fce4ec', fg: '#ad1457' },
  画像: { label: '画像', bg: '#e1f5fe', fg: '#0277bd' },
  心理検査: { label: '心理検査', bg: '#f3e5f5', fg: '#6a1b9a' },
  ECT: { label: 'ECT', bg: '#fff3e0', fg: '#e65100' },
  IF: { label: 'IF', bg: '#e8eaf6', fg: '#3949ab' },
  文字: { label: 'テキスト', bg: '#eceff1', fg: '#455a64' },
};
const pendingSectionOf = (t: OrderType) => PENDING_SECTION[t] ?? { label: t, bg: '#eceff1', fg: '#455a64' };

/** 種別ボタンから開く入力ダイアログの設定。kind で薬剤系（処方/注射）／検査／ECT を切り替える。 */
interface ComposeConfig {
  kind: 'drug' | 'test' | 'psych' | 'imaging' | 'ect' | 'if' | 'reha' | 'freetext';
  orderType: OrderType;
  // kind='drug' のみ使用
  showPackaging?: boolean;
  addTitle?: string;
  setLabel?: string;
  medications?: Medication[];
  sets?: { code: number; name: string }[];
  resolveSet?: (code: number) => { name: string; dose: string; unit: string; usage: string }[];
  /** ダイアログ上部の注記（入院定時の入院専用注意など）。 */
  note?: string;
  /** 終了日欄を表示するか（入院定時のみ。処方・注射は非表示）。 */
  showEndDate?: boolean;
  /** 日数欄のラベル（既定「日数」。注射は「日分」）。 */
  daysLabel?: string;
  /** 日数を医薬品（Rp 行）ごとに設定するか（処方・注射＝true）。 */
  perRowDays?: boolean;
}
const rxConfig = (orderType: Extract<OrderType, '処方' | '入院定時'>): ComposeConfig => ({
  kind: 'drug', orderType, showPackaging: true, addTitle: '処方追加', setLabel: '処方セット',
  medications: MEDICATIONS, sets: PRESCRIPTION_SETS, resolveSet: resolveSetDrugs,
  // 終了日は入院定時のみ。処方（臨時）は薬剤ごとの日数（Rp 表の日数列）。
  showEndDate: orderType !== '処方',
  perRowDays: orderType === '処方',
});
const injectionConfig: ComposeConfig = {
  kind: 'drug', orderType: '注射', showPackaging: false, addTitle: '注射追加', setLabel: '注射セット',
  medications: INJECTION_MEDICATIONS, sets: INJECTION_SETS, resolveSet: resolveInjectionSetDrugs,
  // 注射は薬剤ごとの「日分」（Rp 表の日分列）・終了日なし。
  daysLabel: '日分', perRowDays: true,
};

/**
 * 過去に作成したオーダ（履歴）の content を、処方追加ダイアログの薬剤行（名称・用量・単位・用法）へ復元する。
 * content は「名称 用量単位（用法）（包N・後発不可）」を ／ で連結した文字列。
 * 用法の（…）が取れればそれを用法に、無ければオーダの schedule を用法に充てる（用量・単位は編集で調整可）。
 */
function orderToDrugs(o: Order): { name: string; dose: string; unit: string; usage: string }[] {
  return o.content
    // 改行（1 薬品 1 行）または ／（旧形式・seed）で分割。
    .split(/\r?\n|\s*／\s*/)
    // 先頭の「Rp{番号}」またはインデントを除去。
    .map((seg) => seg.replace(/^Rp\d+[　\s]*/, '').replace(/^[　\s]+/, '').trim())
    // 末尾の Rp 日数「×N日分」を除去し、日数のみ行（N日分・継続）は薬剤ではないので除外。
    .map((seg) => seg.replace(/\s*×\d+日分\s*$/, '').trim())
    .filter((seg) => seg !== '' && seg !== '継続' && !/^\d+日分$/.test(seg))
    .map((seg) => parseDrugSegment(seg, o.schedule));
}
/**
 * 1 薬品の表記（例「アキネトン錠1mg 1錠（1日1回 朝食後）（包1）」）を
 * 名称・用量・単位・用法へ分解する。用法＝最初の丸カッコ、以降の丸カッコ（包装等）は無視。
 * 用量・単位＝名称との間の半角スペースで区切られた「{数値}{単位}」（無ければ空）。
 */
function parseDrugSegment(seg: string, fallbackUsage: string): { name: string; dose: string; unit: string; usage: string } {
  let usage = fallbackUsage || '';
  let name = seg.trim();
  let dose = '';
  let unit = '';
  const pm = seg.match(/^([^（]+)（([^（）]+)）/); // head（用法）…（新形式のみ用量・単位を分離）
  if (pm) {
    const head = pm[1].trim();
    usage = pm[2].trim();
    name = head;
    // 名称と用量の区切りは半角スペース。末尾の「 {数値}{単位}」のみ分離（名称中の "1mg" 等は分離しない）。
    const dm = head.match(/^(.*\S)\s+(\d+(?:\.\d+)?)\s*(\D+?)\s*$/);
    if (dm) { name = dm[1].trim(); dose = dm[2]; unit = dm[3].trim(); }
  }
  return { name, dose, unit, usage };
}
/**
 * DO（前回どおり）等で複製した処方系オーダの content を、作成中の構造化データ（Rp 行＋ダイアログ日数）へ復元する。
 * 上部ボタンから作成した時と同じ 2 行表示・インライン編集・クリック再編集を可能にするため、
 * 用法ごとに Rp を採番し、一包化=1・日数は既定（処方/注射=7・定時/入院定時はオーダ日数）で組み立てる。
 */
function orderToPendingRx(o: Order): { rows: PrescriptionRpRow[]; dialogDays: number } | null {
  if (!isRxType(o.type)) return null;
  const drugs = orderToDrugs(o);
  if (drugs.length === 0) return null;
  const { perRowDays } = rxRenderConfig(o.type);
  let maxRp = 0;
  const rpByUsage = new Map<string, number>();
  const stamp = Date.now();
  const rows: PrescriptionRpRow[] = drugs.map((d, i) => {
    let rpNo = rpByUsage.get(d.usage);
    if (rpNo === undefined) { maxRp += 1; rpNo = maxRp; rpByUsage.set(d.usage, rpNo); }
    return {
      id: `pr-${stamp}-${i}`,
      rpNo,
      name: d.name, dose: d.dose, unit: d.unit, usage: d.usage,
      ippouGroup: '1', noGeneric: false,
      days: perRowDays ? '7' : undefined,
    };
  });
  const dialogDays = perRowDays ? 0 : (o.days > 0 ? o.days : 0);
  return { rows, dialogDays };
}

// 検査は種別「検査」として登録（検査マスタを利用）。
const testConfig: ComposeConfig = { kind: 'test', orderType: '検査' };
// 心理検査は専用ダイアログ（心理－指示箋）。
const psychConfig: ComposeConfig = { kind: 'psych', orderType: '心理検査' };
// 画像は専用ダイアログ（画像オーダ画面。セット名グループ→セット名→部位/手技/薬剤/フィルム）。
const imagingConfig: ComposeConfig = { kind: 'imaging', orderType: '画像' };
// ECT は専用ダイアログ（参考システムマニュアル 第5章第8部準拠。手技/前処置/通電時間/後処置＋理由/所見/承諾）。
const ectConfig: ComposeConfig = { kind: 'ect', orderType: 'ECT' };
// 入院定時（旧「定時処方」を統合。参考システムマニュアル 第5章第2部＝入院専用の定時処方）。処方ダイアログを流用。
const teijiConfig: ComposeConfig = rxConfig('入院定時');
// IF は症状に応じた指示（参考システムマニュアル 第5章第9部）。専用ダイアログ。
const ifConfig: ComposeConfig = { kind: 'if', orderType: 'IF' };
// ※リハビリ（治療形態）はオーダではないため、オーダ送信画面ではなくカルテ下部「治療形態」ボタンから起動する。
// 文字（テキスト）は直接文章を入力するオーダ（参考システムマニュアル 第5章第10部）。専用ダイアログ。
const textConfig: ComposeConfig = { kind: 'freetext', orderType: '文字' };

/** オーダ種別ボタン。OrderType 全 9 種を並べる（表示は文字→テキスト）。処方系・注射・検査・画像等は実接続。 */
const TYPE_BUTTONS: { key: OrderType; label: string; compose?: ComposeConfig }[] = [
  { key: '入院定時', label: '入院定時', compose: teijiConfig },
  { key: '処方', label: '処方', compose: rxConfig('処方') },
  { key: '注射', label: '注射', compose: injectionConfig },
  { key: '検査', label: '検査', compose: testConfig },
  { key: '画像', label: '画像', compose: imagingConfig },
  { key: '心理検査', label: '心理検査', compose: psychConfig },
  { key: 'ECT', label: 'ECT', compose: ectConfig },
  { key: 'IF', label: 'IF', compose: ifConfig },
  { key: '文字', label: 'テキスト', compose: textConfig },
];

interface Props {
  open: boolean;
  patient: Patient;
  doctorName: string;
  onClose: () => void;
  /** [指示] で作成済みオーダ一覧を確定する。親が addOrder 等へ流す。 */
  onSubmit: (orders: Order[]) => void;
}

/**
 * ep-11 us-55: オーダ送信画面（モックの枠）。
 * カルテ アクションバー「オーダー入力」から起動。左＝診療録参照、右＝種別ボタン＋作成中オーダ一覧、下＝指示/閉じる。
 * 本ラウンドは「処方」「入院定時」ボタンのみ実接続（PrescriptionDialog）。他種別はモック未実装。
 */
const OrderSendScreen: React.FC<Props> = ({ open, patient, doctorName, onClose, onSubmit }) => {
  const showSnackbar = useAppStore((s) => s.showSnackbar);
  const dynamicOrders = useAppStore((s) => s.dynamicOrders);
  const appendMedicalRecord = useAppStore((s) => s.appendMedicalRecord);
  const nextKarteNo = useAppStore((s) => s.nextKarteNo);
  const assignKarteNos = useAppStore((s) => s.assignKarteNos);
  const setOrderShoken = useAppStore((s) => s.setOrderShoken);
  const addIfOrder = useAppStore((s) => s.addIfOrder);
  // 指示時のカルテ記事作成ダイアログ（現在指示中）の開閉。
  const [karteOpen, setKarteOpen] = React.useState(false);
  const [pending, setPending] = React.useState<Order[]>([]);
  // 処方系オーダの作成中の構造化データ（オーダ id → Rp 行＋ダイアログ日数）。2行表示・インライン編集に使う。
  const [pendingRx, setPendingRx] = React.useState<Record<string, { rows: PrescriptionRpRow[]; dialogDays: number }>>({});
  // IF オーダの実施用内訳（作成中の IF オーダ id → 症状/コメント/サブオーダ）。指示確定時に IFオーダ タブへ待機登録。
  const [ifDetails, setIfDetails] = React.useState<Record<string, { symptom: string; comment: string; orders: Order[] }>>({});
  // editId が入っていれば「作成中のオーダ」を再編集するモード（登録で同じ id を置き換える）。
  const [rxDialog, setRxDialog] = React.useState<{ open: boolean; config: ComposeConfig; editId?: string }>(
    { open: false, config: rxConfig('処方') },
  );
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);
  // セット一覧ポップオーバ（アンカー）＋選択中のセット名グループ。
  const [setListAnchor, setSetListAnchor] = React.useState<HTMLElement | null>(null);
  const [setGroupIdx, setSetGroupIdx] = React.useState(0);

  React.useEffect(() => {
    if (open) {
      setPending([]);
      setPendingRx({});
      setIfDetails({});
      setConfirmDiscard(false);
      setSetListAnchor(null);
      setSetGroupIdx(0);
    }
  }, [open]);

  // 作成中のオーダがあれば「初期状態から変化あり」とみなす。
  const dirty = pending.length > 0;
  /** ×／閉じるの入口。作成中があれば破棄確認を出す。 */
  const requestClose = () => {
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  // 左ペインの診療録参照: 対象患者の既存オーダ（seed＋登録分）を新しい順に。
  const recent = React.useMemo(
    () =>
      [...ORDERS, ...dynamicOrders]
        .filter((o) => o.patientId === patient.id)
        .slice()
        .sort((a, b) => (a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0)),
    [patient.id, dynamicOrders],
  );

  // 処方追加／注射追加ダイアログの「過去のオーダー」＝この患者が過去に作成した同種別オーダ（履歴）。
  //   選ぶと薬剤（名称・用法）を復元して選択欄へ積める。作成中のオーダを再作成する導線。
  const pastGroups = React.useMemo(
    () =>
      recent
        .filter((o) => o.type === rxDialog.config.orderType)
        .map((o) => ({ key: o.id, label: `${o.startDate}　${o.content}`, drugs: orderToDrugs(o) }))
        .filter((g) => g.drugs.length > 0),
    [recent, rxDialog.config.orderType],
  );

  /**
   * セット一覧のセット名クリック → セット内容（検査・画像・処方系）を解決し「作成中のオーダ」へ一括展開する。
   * 処方系は上部ボタンで作成した時と同じ 2 行表示・インライン編集ができるよう構造化データも積む。
   */
  const applySet = (def: OrderSetDef) => {
    const resolved = resolveOrderSet(def);
    if (resolved.length === 0) {
      showSnackbar(`セット「${def.name}」に展開できる内容がありません`, 'warning');
      setSetListAnchor(null);
      return;
    }
    const stamp = Date.now();
    const newOrders: Order[] = [];
    const newRx: Record<string, { rows: PrescriptionRpRow[]; dialogDays: number }> = {};
    resolved.forEach((r, i) => {
      const id = `ORD-${stamp}-${i}`;
      newOrders.push({
        id, patientId: patient.id, patientName: patient.name,
        type: r.type, content: r.content, schedule: r.schedule,
        status: '指示済', startDate: todayStr(), days: r.days, doctorName,
      });
      if (r.rx) {
        // 行 id はオーダ id 配下で一意にし直す（クリック再編集・React key 用）。
        newRx[id] = {
          rows: r.rx.rows.map((row, ri) => ({ ...row, id: `pr-${stamp}-${i}-${ri}` })),
          dialogDays: r.rx.dialogDays,
        };
      }
    });
    setPending((prev) => [...prev, ...newOrders]);
    setPendingRx((prev) => ({ ...prev, ...newRx }));
    showSnackbar(`セット「${def.name}」を展開しました（${newOrders.length}件）`, 'success');
    setSetListAnchor(null);
  };

  /**
   * テキストオーダ（診療録作成ダイアログ流用）の入力内容を「文字」オーダへ組み立て、作成中に追加する。
   * 内容は【タイトル】本文を基本に、面接フォーム・状態・タグを補足行として付す。
   */
  const registerTextOrder = (data: NewRecordData) => {
    const startDate = data.recordedAt ? data.recordedAt.slice(0, 10) : todayStr();
    const head = data.title.trim() ? `【${data.title.trim()}】` : '';
    const lines: string[] = [`${head}${data.body.trim()}`.trim()];
    if (data.interviewForm) {
      const f = INTERVIEW_FORMS.find((x) => x.id === data.interviewForm);
      if (f) lines.push(`面接フォーム: ${f.label}`);
    }
    if (data.status) {
      const s = STATUS_COLORS.find((x) => x.id === data.status);
      if (s) lines.push(`状態: ${s.label}`);
    }
    if (data.tags.length) lines.push(`タグ: ${data.tags.join('、')}`);
    const order: Order = {
      id: `ORD-${Date.now()}`,
      patientId: patient.id, patientName: patient.name,
      type: '文字', content: lines.join('\n'),
      schedule: '', status: '指示済', startDate, days: 1, doctorName,
    };
    setPending((prev) => [...prev, order]);
    setRxDialog((s) => ({ ...s, open: false }));
  };

  const handleTypeClick = (b: (typeof TYPE_BUTTONS)[number]) => {
    if (b.compose) {
      setRxDialog({ open: true, config: b.compose, editId: undefined });
    } else {
      showSnackbar(`「${b.label}」オーダは未実装（モック）`, 'info');
    }
  };

  /** 処方系オーダ種別 → 起動する処方ダイアログの設定。 */
  const composeForType = (t: OrderType): ComposeConfig | undefined => {
    if (t === '入院定時') return teijiConfig;
    if (t === '処方') return rxConfig('処方');
    if (t === '注射') return injectionConfig;
    return undefined;
  };
  /** 作成中の処方系オーダをクリック → 内容を復元した処方ダイアログを編集モードで開く。 */
  const openEditPending = (o: Order) => {
    if (!pendingRx[o.id]) return; // 構造化データがある処方系のみ編集可
    const cfg = composeForType(o.type);
    if (!cfg) return;
    setRxDialog({ open: true, config: cfg, editId: o.id });
  };

  const handleRxRegister = (order: Order, extra?: { rows: PrescriptionRpRow[]; dialogDays: number }) => {
    const editId = rxDialog.editId;
    if (editId) {
      // 編集モード: 同じ id を保持して作成中のオーダを置き換える（この画面で入力した備考は保持）。
      const prevRemark = pending.find((o) => o.id === editId)?.remark;
      const updated: Order = { ...order, id: editId, remark: prevRemark };
      setPending((prev) => prev.map((o) => (o.id === editId ? updated : o)));
      if (extra && isRxType(order.type)) setPendingRx((prev) => ({ ...prev, [editId]: extra }));
      setRxDialog((s) => ({ ...s, open: false, editId: undefined }));
      return;
    }
    setPending((prev) => [...prev, order]);
    if (extra && isRxType(order.type)) setPendingRx((prev) => ({ ...prev, [order.id]: extra }));
    setRxDialog((s) => ({ ...s, open: false }));
  };
  const removePending = (id: string) => {
    setPending((prev) => prev.filter((o) => o.id !== id));
    setPendingRx((prev) => { const next = { ...prev }; delete next[id]; return next; });
  };

  // 作成中オーダの予定日（開始日）を編集する（全種別）。
  const editStartDate = (id: string, val: string) =>
    setPending((prev) => prev.map((o) => (o.id === id ? { ...o, startDate: val } : o)));

  // 作成中オーダの備考を編集する（全種別・この画面で入力）。
  const editRemark = (id: string, val: string) =>
    setPending((prev) => prev.map((o) => (o.id === id ? { ...o, remark: val } : o)));

  // 処方系オーダの Rp 行を更新し、内容文字列・代表日数も再構築して同期する。
  const updateRxRows = (id: string, updater: (rows: PrescriptionRpRow[]) => PrescriptionRpRow[]) => {
    const entry = pendingRx[id];
    if (!entry) return;
    const rows = updater(entry.rows);
    setPendingRx((prev) => ({ ...prev, [id]: { ...entry, rows } }));
    setPending((prev) => prev.map((o) => (o.id === id
      ? { ...o, content: buildRxContent(rows, o.type, entry.dialogDays), days: rxOrderDays(rows, o.type, entry.dialogDays) }
      : o)));
  };
  // 入院定時: ダイアログ全体の日数を編集。
  const editRxDialogDays = (id: string, val: string) => {
    const entry = pendingRx[id];
    if (!entry) return;
    const dialogDays = Math.max(0, Math.floor(Number(val) || 0));
    setPendingRx((prev) => ({ ...prev, [id]: { ...entry, dialogDays } }));
    setPending((prev) => prev.map((o) => (o.id === id
      ? { ...o, content: buildRxContent(entry.rows, o.type, dialogDays), days: rxOrderDays(entry.rows, o.type, dialogDays) }
      : o)));
  };

  /**
   * 診療録（参照）のオーダを「前回どおり（DO）」で作成中に複製する。開始日は本日・担当医はログイン医師。
   * 処方系は構造化データ（Rp 行）を復元し、上部ボタンで作成した時と同じ 2 行表示・編集可能な状態にする。
   */
  const handleDo = (src: Order) => {
    const id = `ORD-${Date.now()}`;
    const base: Order = {
      ...src, id, status: '指示済', startDate: todayStr(), doctorName,
      confirmedBy: undefined, confirmedAt: undefined,
    };
    const rx = orderToPendingRx(src);
    if (rx) {
      const dup: Order = {
        ...base,
        content: buildRxContent(rx.rows, src.type, rx.dialogDays),
        days: rxOrderDays(rx.rows, src.type, rx.dialogDays),
        schedule: rx.rows[0]?.usage ?? src.schedule,
      };
      setPending((prev) => [...prev, dup]);
      setPendingRx((prev) => ({ ...prev, [id]: rx }));
    } else {
      setPending((prev) => [...prev, base]);
    }
    showSnackbar(`「${src.type}：${src.content}」を DO しました`, 'success');
  };

  // [指示] → まず「カルテ記事作成（現在指示中）」ダイアログを表示（参考システム準拠）。
  const handleShiji = () => {
    if (pending.length === 0) return;
    setKarteOpen(true);
  };

  // カルテ記事作成の [実行]: オーダ毎にカルテNoを発行し、指示内容をまとめたカルテ記事を作成する。
  const handleKarteExecute = (shokenByType: Record<string, string>) => {
    // オーダ毎にカルテNo（NO.xxx）を連番発行。
    let n = nextKarteNo;
    const nos: Record<string, string> = {};
    pending.forEach((o) => { nos[o.id] = `NO.${n}`; n += 1; });
    assignKarteNos(nos, n);

    // 所見（医師コメント）をオーダ id 毎に保存 → 実施ダイアログの「医師より」欄に表示する。
    const shokenMap: Record<string, string> = {};
    pending.forEach((o) => {
      const sk = shokenByType[o.type]?.trim();
      if (sk) shokenMap[o.id] = sk;
    });
    if (Object.keys(shokenMap).length > 0) setOrderShoken(shokenMap);

    // オーダ（カルテNo）毎に別々のカルテ記事を作成する。
    const typeLabel = (t: OrderType) => (t === '文字' ? 'テキスト' : t);
    const d = new Date(`${MOCK_TODAY}T00:00:00`);
    const dateStr = MOCK_TODAY.replace(/-/g, '/');
    const dow = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
    const pad = (n: number) => String(n).padStart(2, '0');
    pending.forEach((o, i) => {
      const sk = shokenByType[o.type]?.trim();
      const lines = [`【オーダ指示】`, `［${typeLabel(o.type)}］`, o.content];
      if (o.remark?.trim()) lines.push(`備考: ${o.remark.trim()}`);
      if (sk) lines.push(`所見: ${sk}`);
      appendMedicalRecord(patient.id, {
        id: `MR-${Date.now()}-${i}`,
        date: dateStr,
        dayOfWeek: dow,
        category: '医師記録',
        author: doctorName,
        authorRole: '医師',
        content: lines.join('\n'),
        tags: ['オーダー'],
        orderNumber: nos[o.id],
        // 発行順を保つため分単位でずらす（新しいものほど下＝古い時刻）。
        timestamp: `${dateStr} 09:${pad(i)}`,
        likes: 0,
        comments: 0,
      });
    });
    // IF オーダは頓用のため、確定時にカルテ「IFオーダ」タブへ「待機中」で登録する（実施はそのタブから）。
    pending.forEach((o) => {
      const det = ifDetails[o.id];
      if (det) {
        addIfOrder(patient.id, {
          id: o.id, symptom: det.symptom, comment: det.comment, orders: det.orders,
          registeredAt: o.startDate, doctorName, status: '待機',
        });
      }
    });
    setKarteOpen(false);
    onSubmit(pending); // オーダ確定＋画面クローズ（親が addOrder / スナックバー）
  };

  return (
    <Dialog open={open} onClose={requestClose} fullWidth maxWidth="lg" PaperProps={{ sx: { height: '90vh' } }}>
      <AppBar position="static" color="primary" sx={{ bgcolor: '#1e3a5f' }}>
        <Toolbar variant="dense">
          <Typography variant="subtitle1" sx={{ flex: 1 }}>
            オーダ送信［精神科］　{patient.patientNumber ?? patient.id}：{patient.name}
            （{WARD_LABEL[patient.wardId]}）
          </Typography>
          <IconButton edge="end" color="inherit" onClick={requestClose} aria-label="オーダ送信画面を閉じる">
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* 左: 診療録参照 */}
        <Box sx={{ width: 320, borderRight: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ px: 1.5, py: 1, bgcolor: '#f1f5f9' }}>
            <Typography variant="caption" fontWeight={700}>診療録（参照）</Typography>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <List dense>
              {recent.length === 0 ? (
                <ListItem><ListItemText secondary="オーダ履歴なし" /></ListItem>
              ) : (
                recent.map((o) => (
                  <ListItem
                    key={o.id}
                    divider
                    secondaryAction={
                      <Tooltip title="前回どおり（このオーダを作成中に複製）">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleDo(o)}
                          aria-label={`DO ${o.type}：${o.content}`}
                        >
                          DO
                        </Button>
                      </Tooltip>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box
                          component="span"
                          title={`${o.type}：${o.content}`}
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {`${o.type}：${o.content}`}
                        </Box>
                      }
                      secondary={`${o.startDate}　${o.status}`}
                      primaryTypographyProps={{ variant: 'body2', component: 'div' }}
                      sx={{ pr: 5 }}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Box>
        </Box>

        {/* 右: 種別ボタン＋作成中オーダ */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Stack direction="row" spacing={1} sx={{ p: 1, flexWrap: 'wrap', rowGap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Button
              size="small"
              variant="text"
              onClick={(e) => setSetListAnchor(e.currentTarget)}
              aria-haspopup="true"
              aria-expanded={Boolean(setListAnchor)}
            >
              セット一覧 ▼
            </Button>
            <Divider orientation="vertical" flexItem />
            {TYPE_BUTTONS.map((b) => (
              <Button
                key={b.key}
                size="small"
                variant={b.compose ? 'contained' : 'outlined'}
                color={b.compose ? 'primary' : 'inherit'}
                onClick={() => handleTypeClick(b)}
              >
                {b.label}
              </Button>
            ))}
          </Stack>

          {/* セット一覧ポップオーバ: セット名グループ（プルダウン）→ セット名リスト。共通/個人は本モックでは扱わない。 */}
          <Popover
            open={Boolean(setListAnchor)}
            anchorEl={setListAnchor}
            onClose={() => setSetListAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            PaperProps={{ sx: { width: 320 } }}
          >
            <Box sx={{ p: 1.5 }}>
              <FormControl size="small" fullWidth sx={{ mb: 1 }}>
                <InputLabel id="order-set-group-label">セット名グループ</InputLabel>
                <Select
                  labelId="order-set-group-label"
                  label="セット名グループ"
                  value={setGroupIdx}
                  onChange={(e) => setSetGroupIdx(Number(e.target.value))}
                >
                  {ORDER_SET_GROUPS.map((g, i) => (
                    <MenuItem key={g.name} value={i}>{g.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <List dense disablePadding sx={{ maxHeight: 320, overflow: 'auto' }}>
                {ORDER_SET_GROUPS[setGroupIdx].sets.map((s) => (
                  <ListItemButton
                    key={s.name}
                    divider
                    onClick={() => applySet(s)}
                    aria-label={`セット ${s.name} を展開`}
                  >
                    <ListItemText primary={s.name} />
                    <ChevronRightIcon fontSize="small" color="action" />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          </Popover>

          <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
            <Typography variant="caption" color="text.secondary">作成中のオーダ</Typography>
            {pending.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                種別ボタンからオーダを作成してください（全 10 種別が利用可）
              </Typography>
            ) : (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {pending.map((o) => {
                  const sec = pendingSectionOf(o.type);
                  return (
                    <Box key={o.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                      {/* 種別セクション見出し（色分け）＋予定日/削除の列見出し */}
                      <Stack direction="row" alignItems="center" sx={{ bgcolor: sec.bg, px: 1, py: 0.5 }}>
                        <Typography variant="body2" sx={{ color: sec.fg, fontWeight: 700, flex: 1 }}>
                          ［{sec.label}］
                        </Typography>
                        <Typography variant="caption" sx={{ color: sec.fg, width: 136, textAlign: 'center' }}>予定日</Typography>
                        <Typography variant="caption" sx={{ color: sec.fg, width: 40, textAlign: 'center' }}>削除</Typography>
                      </Stack>
                      {/* 本体: 処方系は薬剤ごとに2行表示（1行目=名称+用量+用量コメント／2行目=用法+日数+用法コメント） */}
                      <Stack direction="row" alignItems="flex-start" sx={{ px: 1, py: 0.75 }}>
                        <Box
                          sx={{
                            flex: 1, minWidth: 0, borderRadius: 1,
                            ...(pendingRx[o.id] && { cursor: 'pointer', '&:hover': { bgcolor: '#eef5fb' } }),
                          }}
                          onClick={pendingRx[o.id] ? () => openEditPending(o) : undefined}
                          title={pendingRx[o.id] ? 'クリックで内容を編集' : undefined}
                        >
                          {(() => {
                            const rx = pendingRx[o.id];
                            if (!rx) {
                              // 構造化データが無いオーダ（検査/ECT/IF/文字、DO 複製 等）は内容をそのまま表示。
                              return <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{o.content}</Typography>;
                            }
                            const cfg = rxRenderConfig(o.type);
                            return (
                              <Stack spacing={0.75}>
                                {rx.rows.map((r, i) => {
                                  const firstOfRp = i === 0 || rx.rows[i - 1].rpNo !== r.rpNo;
                                  const lastOfRp = i === rx.rows.length - 1 || rx.rows[i + 1].rpNo !== r.rpNo;
                                  const marks = rxMarks(r, cfg.showPackaging);
                                  return (
                                    // 薬剤ごとに 2 行×4 列グリッド。列＝[Rp番号][名称(包装)][用量][コメント]。
                                    // 用量・コメントを固定幅列に置いて名称長に依らず縦に揃える。
                                    <Box
                                      key={r.id}
                                      sx={{
                                        display: 'grid',
                                        gridTemplateColumns: '3.4em minmax(0, 1fr) 76px 200px',
                                        columnGap: 1,
                                        rowGap: 0.25,
                                        alignItems: 'baseline',
                                      }}
                                    >
                                      {/* 1行目: Rp番号 / 名称（包装） / 用量 / 用量コメント */}
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                        {firstOfRp ? `Rp${r.rpNo}` : ''}
                                      </Typography>
                                      <Typography variant="body2" sx={{ minWidth: 0, wordBreak: 'break-all' }}>
                                        {r.name}{marks.length ? `（${marks.join('・')}）` : ''}
                                      </Typography>
                                      <Typography variant="body2" sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                        {r.dose ? `${r.dose}${r.unit}` : ''}
                                      </Typography>
                                      <TextField
                                        size="small" variant="standard" value={r.doseComment ?? ''}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updateRxRows(o.id, (rows) => rows.map((x, xi) => (xi === i ? { ...x, doseComment: e.target.value } : x)))}
                                        placeholder="用量コメント"
                                        inputProps={{ 'aria-label': `用量コメント ${o.type} ${r.name}` }}
                                        sx={{ width: '100%' }}
                                      />
                                      {/* 2行目: 空 / 用法 / 日数・回数 / 用法コメント */}
                                      <span />
                                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 0 }}>
                                        {r.usage || '（用法未設定）'}
                                      </Typography>
                                      {cfg.perRowDays && lastOfRp ? (
                                        <TextField
                                          type="number" size="small" variant="standard"
                                          label={o.type === '注射' ? '回数' : '日数'}
                                          value={r.days ?? ''}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => updateRxRows(o.id, (rows) => rows.map((x) => (x.rpNo === r.rpNo ? { ...x, days: e.target.value } : x)))}
                                          inputProps={{ min: 0, step: 1, 'aria-label': `${o.type === '注射' ? '回数' : '日数'} ${o.type} Rp${r.rpNo}` }}
                                          sx={{ width: '100%' }}
                                        />
                                      ) : <span />}
                                      <TextField
                                        size="small" variant="standard" value={r.usageComment ?? ''}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updateRxRows(o.id, (rows) => rows.map((x, xi) => (xi === i ? { ...x, usageComment: e.target.value } : x)))}
                                        placeholder="用法コメント"
                                        inputProps={{ 'aria-label': `用法コメント ${o.type} ${r.name}` }}
                                        sx={{ width: '100%' }}
                                      />
                                    </Box>
                                  );
                                })}
                              </Stack>
                            );
                          })()}
                        </Box>
                        {/* 予定日（編集可・全種別）＋ 入院定時は日数を予定日の下に */}
                        <Box sx={{ width: 136, px: 0.5, flexShrink: 0 }}>
                          <TextField
                            type="date" size="small" variant="standard" value={o.startDate}
                            onChange={(e) => editStartDate(o.id, e.target.value)}
                            inputProps={{ 'aria-label': `予定日 ${o.type}` }} sx={{ width: '100%' }}
                          />
                          {pendingRx[o.id] && !rxRenderConfig(o.type).perRowDays && (
                            <TextField
                              type="number" size="small" variant="standard" label="日数"
                              value={pendingRx[o.id].dialogDays}
                              onChange={(e) => editRxDialogDays(o.id, e.target.value)}
                              inputProps={{ min: 0, step: 1, 'aria-label': `日数 ${o.type}` }}
                              sx={{ width: 84, mt: 0.5 }}
                            />
                          )}
                        </Box>
                        <Box sx={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
                          <IconButton size="small" aria-label={`削除 ${o.content}`} onClick={() => removePending(o.id)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Stack>
                      {/* オーダ単位の備考（この画面で入力）。 */}
                      <Stack direction="row" spacing={1} alignItems="baseline" sx={{ px: 1, pb: 0.75 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap', minWidth: '3.4em' }}>
                          備考
                        </Typography>
                        <TextField
                          size="small" variant="standard" fullWidth value={o.remark ?? ''}
                          onChange={(e) => editRemark(o.id, e.target.value)}
                          placeholder="備考（この画面で入力できます）"
                          inputProps={{ 'aria-label': `備考 ${o.type}` }}
                        />
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>

          <Box sx={{ p: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
            <Stack direction="row" spacing={1} sx={{ flex: 1, flexWrap: 'wrap' }}>
              {['指示箋印刷', 'オーダ確認', '処方チェック', '多剤チェック'].map((l) => (
                <FormControlLabel
                  key={l}
                  control={<Checkbox size="small" defaultChecked />}
                  label={<Typography variant="caption">{l}</Typography>}
                />
              ))}
            </Stack>
            <Button onClick={requestClose} sx={{ mr: 1 }}>閉じる</Button>
            <Button variant="contained" onClick={handleShiji} disabled={pending.length === 0}>
              指示
            </Button>
          </Box>
        </Box>
      </Box>

      {rxDialog.config.kind === 'test' ? (
        <TestOrderDialog
          open={rxDialog.open}
          orderType={rxDialog.config.orderType}
          patient={patient}
          doctorName={doctorName}
          onClose={() => setRxDialog((s) => ({ ...s, open: false }))}
          onRegister={handleRxRegister}
        />
      ) : rxDialog.config.kind === 'psych' ? (
        <PsychTestOrderDialog
          open={rxDialog.open}
          orderType={rxDialog.config.orderType}
          patient={patient}
          doctorName={doctorName}
          onClose={() => setRxDialog((s) => ({ ...s, open: false }))}
          onRegister={handleRxRegister}
        />
      ) : rxDialog.config.kind === 'imaging' ? (
        <ImagingOrderDialog
          open={rxDialog.open}
          orderType={rxDialog.config.orderType}
          patient={patient}
          doctorName={doctorName}
          onClose={() => setRxDialog((s) => ({ ...s, open: false }))}
          onRegister={handleRxRegister}
        />
      ) : rxDialog.config.kind === 'ect' ? (
        <EctOrderDialog
          open={rxDialog.open}
          orderType={rxDialog.config.orderType}
          patient={patient}
          doctorName={doctorName}
          onClose={() => setRxDialog((s) => ({ ...s, open: false }))}
          onRegister={handleRxRegister}
        />
      ) : rxDialog.config.kind === 'if' ? (
        <IfOrderDialog
          open={rxDialog.open}
          orderType={rxDialog.config.orderType}
          patient={patient}
          doctorName={doctorName}
          onClose={() => setRxDialog((s) => ({ ...s, open: false }))}
          onRegister={(ifOrder, detail) => {
            setPending((prev) => [...prev, ifOrder]);
            setIfDetails((prev) => ({ ...prev, [ifOrder.id]: detail }));
            setRxDialog((s) => ({ ...s, open: false }));
          }}
        />
      ) : rxDialog.config.kind === 'freetext' ? (
        // テキストオーダは診療録作成ダイアログを流用（左のDO引用・前回カルテ取り込みは非表示。登録で作成中へ）。
        <NewRecordDialog
          open={rxDialog.open}
          mode="inpatient"
          patientId={patient.id}
          titleNode={<OrderDialogTitle title="テキストオーダ作成" patient={patient} />}
          defaultRecordedAt={`${MOCK_TODAY}T09:00`}
          hideDoPanel
          hideImportPrevious
          hideTemplate
          hideInterviewForm
          registerLabel="登録"
          onRegister={registerTextOrder}
          onClose={() => setRxDialog((s) => ({ ...s, open: false }))}
        />
      ) : (
        <PrescriptionDialog
          open={rxDialog.open}
          orderType={rxDialog.config.orderType}
          patient={patient}
          doctorName={doctorName}
          onClose={() => setRxDialog((s) => ({ ...s, open: false, editId: undefined }))}
          onRegister={handleRxRegister}
          showPackaging={rxDialog.config.showPackaging}
          addTitle={rxDialog.config.addTitle}
          setLabel={rxDialog.config.setLabel}
          medications={rxDialog.config.medications}
          sets={rxDialog.config.sets}
          resolveSet={rxDialog.config.resolveSet}
          pastGroups={pastGroups}
          note={rxDialog.config.note}
          showEndDate={rxDialog.config.showEndDate}
          daysLabel={rxDialog.config.daysLabel}
          perRowDays={rxDialog.config.perRowDays}
          initial={
            rxDialog.editId && pendingRx[rxDialog.editId]
              ? {
                  rows: pendingRx[rxDialog.editId].rows,
                  dialogDays: pendingRx[rxDialog.editId].dialogDays,
                  startDate: pending.find((p) => p.id === rxDialog.editId)?.startDate ?? todayStr(),
                }
              : undefined
          }
        />
      )}
      <ConfirmDiscardDialog
        open={confirmDiscard}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); onClose(); }}
        message="作成中のオーダが破棄されます。閉じてもよろしいですか？"
      />

      {/* 指示時のカルテ記事作成（現在指示中）→ 実行でオーダ確定＋カルテ記事作成 */}
      <OrderKarteRecordDialog
        open={karteOpen}
        orders={pending}
        onClose={() => setKarteOpen(false)}
        onExecute={handleKarteExecute}
      />
    </Dialog>
  );
};

export default OrderSendScreen;

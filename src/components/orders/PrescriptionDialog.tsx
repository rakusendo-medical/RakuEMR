import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box,
  TextField, Typography, FormControlLabel, Checkbox, Select, MenuItem,
  Table, TableHead, TableBody, TableRow, TableCell, IconButton, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import type { Order, OrderType, Patient, PrescriptionRpRow } from '../../types';
import { buildRxContent, rxOrderDays } from '../../data/prescriptionContent';
import type { Medication } from '../../data/prescriptionMaster';
import DrugAddDialog, { type DrugSelection } from './DrugAddDialog';
import ConfirmDiscardDialog from './ConfirmDiscardDialog';
import { todayStr } from './orderDate';

/**
 * Rp テーブルの 1 行（共有型 PrescriptionRpRow）。
 *  - rpNo: Rp 番号（用法でグループ化）
 *  - ippouGroup: 一包化グループ番号（'-' はなし。数字は同番号どうしが同一包）
 *  - noGeneric: 後発不可（この薬剤を後発品変更不可にする）
 */
type RpRow = PrescriptionRpRow;

interface Props {
  open: boolean;
  /** 起動元のボタンで確定するオーダ種別（入院定時／処方／注射 等）。ダイアログ見出しにも使う。 */
  orderType: OrderType;
  patient: Patient;
  doctorName: string;
  onClose: () => void;
  /** 作成したオーダを親（オーダ送信画面）へ渡す。extra で Rp 行・ダイアログ日数も渡す（作成中の2行表示・編集用）。 */
  onRegister: (order: Order, extra?: { rows: PrescriptionRpRow[]; dialogDays: number }) => void;
  /** 編集モードの初期値（作成中のオーダをクリックして開いた場合）。未指定＝新規で空。 */
  initial?: { rows: PrescriptionRpRow[]; dialogDays: number; startDate: string };
  /** 一包化・後発不可の列／チェックを表示するか（処方=true、注射等=false）。既定 true。 */
  showPackaging?: boolean;
  /** 薬剤追加ダイアログの見出し（既定「処方追加」）。 */
  addTitle?: string;
  /** かな検索対象マスタ（既定＝処方の医薬品マスタ）。 */
  medications?: DrugMaster[];
  /** セット一覧（既定＝処方セット）。 */
  sets?: { code: number; name: string }[];
  /** セット解決関数（既定＝処方セット解決）。 */
  resolveSet?: (code: number) => { name: string; dose: string; unit: string; usage: string }[];
  /** セット選択欄ラベル（既定「処方セット」）。 */
  setLabel?: string;
  /** 処方追加ダイアログの「過去のオーダー」＝この患者が過去に作成した同種別オーダ（履歴から復元）。 */
  pastGroups?: { key: string; label: string; drugs: { name: string; dose: string; unit: string; usage: string }[] }[];
  /** ダイアログ上部に表示する注記（入院定時の入院専用注意など）。 */
  note?: string;
  /** 終了日欄を表示するか（入院定時のみ true。処方・注射は false）。既定 false。 */
  showEndDate?: boolean;
  /** 日数欄のラベル（既定「日数」。注射は「日分」）。 */
  daysLabel?: string;
  /** 日数を医薬品（Rp 行）ごとに設定するか（処方・注射＝true）。true のときダイアログ全体の日数欄は出さず Rp 表に日数列を追加。既定 false。 */
  perRowDays?: boolean;
  /** 日数・回数欄を一切表示しないか（IF の頓用サブオーダ＝true。日数を content にも付けない）。既定 false。 */
  hideDays?: boolean;
}

type DrugMaster = Medication;

/**
 * ep-11 us-54: 処方（入院定時／処方）ダイアログ。
 * オーダ送信画面の「入院定時」「処方」ボタンから起動。Rp テーブル＋処方追加ダイアログで薬剤を登録する。
 * 一包化はグループ番号（薬剤単位）、後発不可は薬剤単位のチェックで指定する（参考システム マニュアル第5章第2部）。
 */
const PrescriptionDialog: React.FC<Props> = ({
  open, orderType, patient, doctorName, onClose, onRegister,
  showPackaging = true, addTitle, medications, sets, resolveSet, setLabel, pastGroups = [], note,
  showEndDate = false, daysLabel = '日数', perRowDays = false, hideDays = false, initial,
}) => {
  const [startDate, setStartDate] = React.useState(todayStr());
  const [days, setDays] = React.useState('1');
  const [rpList, setRpList] = React.useState<RpRow[]>([]);
  const [ippoukaAll, setIppoukaAll] = React.useState(true);
  const [genericBlockedAll, setGenericBlockedAll] = React.useState(false);
  const [drugDialogOpen, setDrugDialogOpen] = React.useState(false);
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      if (initial) {
        // 編集モード: 作成中のオーダの内容を復元して開く。
        const rows = initial.rows.map((r) => ({ ...r })) as RpRow[];
        setStartDate(initial.startDate || todayStr());
        setRpList(rows);
        setIppoukaAll(rows.length > 0 ? rows.every((r) => r.ippouGroup && r.ippouGroup !== '-') : true);
        setGenericBlockedAll(rows.length > 0 && rows.every((r) => r.noGeneric));
        setDays(String(initial.dialogDays));
      } else {
        // 新規オーダは常に空で開く（未指示の下書きを自動で復元しない）。
        // 「前回どおり」は診療録の DO ボタン／処方追加の「過去のオーダー」で明示的に行う。
        setStartDate(todayStr());
        setRpList([]);
        setIppoukaAll(true);
        setGenericBlockedAll(false);
        setDays('1');
      }
      setDrugDialogOpen(false);
      setConfirmDiscard(false);
    }
    // 初期値は開いた瞬間に一度だけ反映する（initial の参照変化で再初期化しない＝編集中の内容を保持）。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 初期状態から変化しているか（未保存変更の有無）。
  const dirty = rpList.length > 0 || days !== '1' || genericBlockedAll || !ippoukaAll || startDate !== todayStr();
  /** 背景クリック／閉じる押下の入口。変更があれば破棄確認を出す。 */
  const requestClose = () => {
    if (dirty) setConfirmDiscard(true);
    else onClose();
  };

  const daysNum = Number(days);
  const daysInvalid = days.trim() === '' || Number.isNaN(daysNum) || daysNum < 0 || !Number.isInteger(daysNum);
  // perRowDays（処方・注射）はダイアログ全体の日数を使わないため、その妥当性は登録条件に含めない。
  const canRegister = rpList.length > 0 && startDate !== '' && (perRowDays || hideDays || !daysInvalid);

  // 終了日 = 開始日 ＋（日数 − 1）＝処方最終日。日数 0（継続）や不正時は空（日付なし）。（入院定時のみ表示）
  const fmtDate = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const endDateValue = React.useMemo(() => {
    if (startDate === '' || daysInvalid || daysNum <= 0) return '';
    const d = new Date(`${startDate}T00:00:00`);
    d.setDate(d.getDate() + daysNum - 1);
    return fmtDate(d);
  }, [startDate, daysNum, daysInvalid]);
  /** 終了日をカレンダーで変更 → 日数を逆算（終了日 − 開始日 ＋ 1）。空欄なら継続（日数0）。 */
  const handleEndChange = (v: string) => {
    if (v === '') { setDays('0'); return; }
    if (startDate === '') return;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${v}T00:00:00`);
    const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    setDays(String(diff));
  };

  // 既存の一包化グループ番号の最大値（'＊'＝最大＋1 の新規グループ算出用）。
  const maxGroup = rpList.reduce((m, r) => {
    const n = Number(r.ippouGroup);
    return Number.isInteger(n) && n > m ? n : m;
  }, 0);

  const setRow = (id: string, patch: Partial<RpRow>) =>
    setRpList((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  /** 日数は Rp 単位。同一 Rp の全薬剤に同じ日数を設定する。 */
  const setRpDays = (rpNo: number, days: string) =>
    setRpList((prev) => prev.map((r) => (r.rpNo === rpNo ? { ...r, days } : r)));

  // 現在存在する Rp 番号（昇順・重複なし）。Rp 変更セレクトの選択肢に使う。
  const rpNos = Array.from(new Set(rpList.map((r) => r.rpNo))).sort((a, b) => a - b);
  /** 行の Rp を変更する。既存番号を選べばその Rp にまとめ、'＊' なら新しい Rp（最大＋1）へ移す。変更後は Rp 番号順に整列。 */
  const changeRp = (id: string, raw: string) => {
    setRpList((prev) => {
      const maxNo = prev.reduce((m, r) => Math.max(m, r.rpNo), 0);
      const target = raw === '＊' ? maxNo + 1 : Number(raw);
      // 移動先 Rp に既存薬剤があれば日数はその Rp に合わせる（日数は Rp 単位）。
      const targetDays = prev.find((r) => r.id !== id && r.rpNo === target)?.days;
      return prev
        .map((r) => (r.id === id ? { ...r, rpNo: target, days: targetDays ?? r.days } : r))
        .sort((a, b) => a.rpNo - b.rpNo);
    });
  };

  const handleDrugRegister = (drugs: DrugSelection[]) => {
    setRpList((prev) => {
      // 用法ごとにまとめる。同じ用法は同一 Rp、用法が異なれば別 Rp として採番する。
      let maxRpNo = prev.reduce((m, r) => Math.max(m, r.rpNo), 0);
      const rpNoByUsage = new Map<string, number>();
      const added = drugs.map((d) => {
        let rpNo = rpNoByUsage.get(d.usage);
        if (rpNo === undefined) {
          maxRpNo += 1;
          rpNo = maxRpNo;
          rpNoByUsage.set(d.usage, rpNo);
        }
        // 追加時の既定: 一包化（全）ON なら一包化グループ 1。後発不可・公費認定外・別袋・処方日数は
        // 処方追加ダイアログで指定した値を採用（未指定なら 後発は（全）設定・日数は既定7）。
        return {
          ...d,
          rpNo,
          ippouGroup: ippoukaAll ? '1' : '-',
          noGeneric: d.noGeneric ?? genericBlockedAll,
          days: d.days && d.days !== '' ? d.days : '7',
        };
      });
      // 同じ Rp 番号の行が隣接するよう Rp 番号順に並べる（安定ソートで同一 Rp 内は追加順を維持）。
      return [...prev, ...added].sort((a, b) => a.rpNo - b.rpNo);
    });
    setDrugDialogOpen(false);
  };
  const removeRp = (id: string) => setRpList((prev) => prev.filter((r) => r.id !== id));

  /** 一包化（全）: ON で全薬剤をグループ1、OFF で全薬剤を一包化なし。 */
  const toggleIppoukaAll = (v: boolean) => {
    setIppoukaAll(v);
    setRpList((prev) => prev.map((r) => ({ ...r, ippouGroup: v ? '1' : '-' })));
  };
  /** 後発品変更不可（全）: 全薬剤の後発不可を一括 ON/OFF。 */
  const toggleGenericAll = (v: boolean) => {
    setGenericBlockedAll(v);
    setRpList((prev) => prev.map((r) => ({ ...r, noGeneric: v })));
  };

  const handleRegister = () => {
    if (!canRegister) return;
    const body = buildRxContent(rpList, orderType, daysNum, hideDays);
    const orderDays = rxOrderDays(rpList, orderType, daysNum, hideDays);
    onRegister(
      {
        id: `ORD-${Date.now()}`,
        patientId: patient.id,
        patientName: patient.name,
        type: orderType,
        content: body,
        schedule: rpList[0]?.usage ?? '',
        status: '指示済',
        startDate,
        days: orderDays,
        doctorName,
      },
      { rows: rpList, dialogDays: daysNum },
    );
  };

  return (
    <Dialog open={open} onClose={requestClose} maxWidth="md" fullWidth>
      <DialogTitle>{orderType}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            対象患者: {patient.patientNumber ?? patient.id}　{patient.name}
          </Typography>
          {note && <Alert severity="info" sx={{ py: 0 }}>{note}</Alert>}

          <Box>
            <Typography variant="caption" color="text.secondary">オーダ内容</Typography>
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mt: 0.5, overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 70 }}>Rp</TableCell>
                    <TableCell>名称（最大用量）</TableCell>
                    <TableCell sx={{ width: 64 }}>用量</TableCell>
                    <TableCell sx={{ width: 140 }}>用法</TableCell>
                    {showPackaging && <TableCell sx={{ width: 90 }}>一包化</TableCell>}
                    {showPackaging && <TableCell sx={{ width: 64 }}>後発不可</TableCell>}
                    {perRowDays && !hideDays && <TableCell sx={{ width: 72 }}>{daysLabel}</TableCell>}
                    <TableCell sx={{ width: 130 }}>用量ｺﾒﾝﾄ</TableCell>
                    <TableCell sx={{ width: 130 }}>用法ｺﾒﾝﾄ</TableCell>
                    <TableCell sx={{ width: 44 }}>削除</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rpList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={(showPackaging ? 9 : 7) + (perRowDays && !hideDays ? 1 : 0)}>
                        <Typography variant="caption" color="text.secondary">
                          「新しい Rp として薬剤を追加」から{showPackaging ? '薬剤' : '注射'}を登録してください
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rpList.map((r, idx) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <Select
                            size="small"
                            variant="standard"
                            value={String(r.rpNo)}
                            onChange={(e) => changeRp(r.id, e.target.value)}
                            inputProps={{ 'aria-label': `Rp ${r.name}` }}
                            sx={{ minWidth: 48 }}
                          >
                            {rpNos.map((n) => (
                              <MenuItem key={n} value={String(n)}>{n}</MenuItem>
                            ))}
                            <MenuItem value="＊">＊(新規)</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>{r.dose ? `${r.dose}${r.unit}` : '—'}</TableCell>
                        <TableCell>{r.usage}</TableCell>
                        {showPackaging && (
                          <TableCell>
                            <Select
                              size="small"
                              variant="standard"
                              value={r.ippouGroup}
                              onChange={(e) => {
                                const raw = e.target.value;
                                const resolved = raw === '＊' ? String(maxGroup + 1) : raw;
                                setRow(r.id, { ippouGroup: resolved });
                                // 一包化グループを指定したら「一包化」（全）チェックを自動で ON にする（マニュアル準拠）。
                                if (resolved !== '-') setIppoukaAll(true);
                              }}
                              inputProps={{ 'aria-label': `一包化 ${r.name}` }}
                              sx={{ minWidth: 56 }}
                            >
                              <MenuItem value="-">なし</MenuItem>
                              {Array.from({ length: maxGroup }, (_, i) => String(i + 1)).map((g) => (
                                <MenuItem key={g} value={g}>{g}</MenuItem>
                              ))}
                              <MenuItem value="＊">＊(新規)</MenuItem>
                            </Select>
                          </TableCell>
                        )}
                        {showPackaging && (
                          <TableCell align="center">
                            <Checkbox
                              size="small"
                              checked={r.noGeneric}
                              onChange={(_, v) => setRow(r.id, { noGeneric: v })}
                              inputProps={{ 'aria-label': `後発不可 ${r.name}` }}
                            />
                          </TableCell>
                        )}
                        {perRowDays && !hideDays && (
                          // 日数は Rp 単位。各 Rp の先頭行のみ入力欄を出し、同一 Rp 全薬剤に適用する。
                          <TableCell>
                            {(idx === 0 || rpList[idx - 1].rpNo !== r.rpNo) ? (
                              <TextField
                                type="number"
                                size="small"
                                variant="standard"
                                value={r.days ?? ''}
                                onChange={(e) => setRpDays(r.rpNo, e.target.value)}
                                inputProps={{ min: 0, step: 1, 'aria-label': `${daysLabel} Rp${r.rpNo}` }}
                                sx={{ width: 56 }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.disabled">〃</Typography>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <TextField
                            size="small" variant="standard" value={r.doseComment ?? ''}
                            onChange={(e) => setRow(r.id, { doseComment: e.target.value })}
                            placeholder="用量コメント"
                            inputProps={{ 'aria-label': `用量コメント ${r.name}` }}
                            sx={{ minWidth: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small" variant="standard" value={r.usageComment ?? ''}
                            onChange={(e) => setRow(r.id, { usageComment: e.target.value })}
                            placeholder="用法コメント"
                            inputProps={{ 'aria-label': `用法コメント ${r.name}` }}
                            sx={{ minWidth: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" aria-label={`削除 ${r.name}`} onClick={() => removeRp(r.id)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
            <Button size="small" startIcon={<AddIcon />} onClick={() => setDrugDialogOpen(true)} sx={{ mt: 0.5 }}>
              新しい Rp として薬剤を追加
            </Button>
            {showPackaging && (
              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={<Checkbox size="small" checked={ippoukaAll} onChange={(_, v) => toggleIppoukaAll(v)} />}
                  label="一包化"
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={genericBlockedAll} onChange={(_, v) => toggleGenericAll(v)} />}
                  label="後発品変更不可（全）"
                />
              </Stack>
            )}
          </Box>

          <Stack direction="row" spacing={1.5}>
            <TextField
              label="開始日"
              type="date"
              required
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 170 }}
            />
            {!perRowDays && !hideDays && (
              <TextField
                label={daysLabel}
                type="number"
                size="small"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                helperText="0 で継続"
                error={daysInvalid}
                inputProps={{ min: 0, step: 1 }}
                sx={{ width: 110 }}
              />
            )}
            {showEndDate && (
              <TextField
                label="終了日"
                type="date"
                size="small"
                value={endDateValue}
                onChange={(e) => handleEndChange(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="日数と連動（空欄で継続）"
                sx={{ minWidth: 190 }}
              />
            )}
          </Stack>

          <Typography variant="caption" color="text.secondary">
            担当医: {doctorName}（ログイン医師）
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={requestClose}>閉じる</Button>
        <Button variant="contained" onClick={handleRegister} disabled={!canRegister}>
          登録
        </Button>
      </DialogActions>

      <DrugAddDialog
        open={drugDialogOpen}
        onClose={() => setDrugDialogOpen(false)}
        onRegister={handleDrugRegister}
        title={addTitle}
        medications={medications}
        sets={sets}
        resolveSet={resolveSet}
        setLabel={setLabel}
        pastGroups={pastGroups}
        extended={showPackaging}
        showDays={showPackaging && perRowDays && !hideDays}
      />
      <ConfirmDiscardDialog
        open={confirmDiscard}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => { setConfirmDiscard(false); onClose(); }}
      />
    </Dialog>
  );
};

export default PrescriptionDialog;

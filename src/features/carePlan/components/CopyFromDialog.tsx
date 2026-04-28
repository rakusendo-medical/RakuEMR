import React, { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControlLabel, List, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useCarePlanStore } from '../store';

interface Props {
  open: boolean;
  onClose: () => void;
  /** コピー先の care plan ID */
  targetCarePlanId: string;
  /** 長期目標の引用を許可するか(既存計画では通常 false) */
  allowLongTermGoalCopy?: boolean;
}

type Tab = 'template' | 'other_patient' | 'past_plan';

const CopyFromDialog: React.FC<Props> = ({ open, onClose, targetCarePlanId, allowLongTermGoalCopy = true }) => {
  const templates = useCarePlanStore((s) => s.templates);
  const patients = useCarePlanStore((s) => s.patients);
  const problemItems = useCarePlanStore((s) => s.problemItems);
  const carePlans = useCarePlanStore((s) => s.carePlans);
  const nandaMaster = useCarePlanStore((s) => s.nandaMaster);
  const copyFromTemplate = useCarePlanStore((s) => s.copyFromTemplate);
  const copyProblemItemsFrom = useCarePlanStore((s) => s.copyProblemItemsFrom);

  const [tab, setTab] = useState<Tab>('template');
  const [query, setQuery] = useState('');
  const [selectedTpl, setSelectedTpl] = useState<{ tplId: string; indexes: number[]; includeLtg: boolean } | null>(null);
  const [selectedPiIds, setSelectedPiIds] = useState<string[]>([]);

  React.useEffect(() => {
    if (open) {
      setTab('template');
      setQuery('');
      setSelectedTpl(null);
      setSelectedPiIds([]);
    }
  }, [open]);

  const targetPlan = carePlans.find((p) => p.id === targetCarePlanId);
  const nandaName = (code: string) => nandaMaster.find((n) => n.code === code)?.name ?? code;

  const filteredTemplates = useMemo(() => {
    if (!query) return templates;
    const q = query.toLowerCase();
    return templates.filter((t) => t.name.toLowerCase().includes(q));
  }, [templates, query]);

  const otherPatientItems = useMemo(() => {
    return problemItems.filter((pi) => {
      const plan = carePlans.find((p) => p.id === pi.carePlanId);
      if (!plan || plan.patientId === targetPlan?.patientId) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      const patient = patients.find((pt) => pt.id === plan.patientId);
      return (
        nandaName(pi.nandaCode).toLowerCase().includes(q) ||
        patient?.name.toLowerCase().includes(q) ||
        patient?.primaryDiagnosis.toLowerCase().includes(q)
      );
    });
  }, [problemItems, carePlans, patients, query, targetPlan, nandaMaster]);

  const pastPlanItems = useMemo(() => {
    if (!targetPlan) return [];
    return problemItems.filter((pi) => {
      if (pi.carePlanId === targetCarePlanId) return false;
      const plan = carePlans.find((p) => p.id === pi.carePlanId);
      return plan?.patientId === targetPlan.patientId;
    });
  }, [problemItems, carePlans, targetPlan, targetCarePlanId]);

  const toggleTplItem = (tplId: string, idx: number) => {
    setSelectedTpl((prev) => {
      if (!prev || prev.tplId !== tplId) return { tplId, indexes: [idx], includeLtg: false };
      const exists = prev.indexes.includes(idx);
      return {
        ...prev,
        indexes: exists ? prev.indexes.filter((i) => i !== idx) : [...prev.indexes, idx],
      };
    });
  };

  const togglePi = (id: string) => {
    setSelectedPiIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectedCount =
    tab === 'template'
      ? (selectedTpl?.indexes.length ?? 0) + (selectedTpl?.includeLtg ? 1 : 0)
      : selectedPiIds.length;

  const handleCopy = () => {
    if (tab === 'template' && selectedTpl) {
      copyFromTemplate(selectedTpl.tplId, targetCarePlanId, selectedTpl.includeLtg, selectedTpl.indexes);
    } else if (tab === 'other_patient' && selectedPiIds.length > 0) {
      copyProblemItemsFrom(selectedPiIds, targetCarePlanId, 'other_patient');
    } else if (tab === 'past_plan' && selectedPiIds.length > 0) {
      copyProblemItemsFrom(selectedPiIds, targetCarePlanId, 'past_plan');
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { height: 720 } }}>
      <DialogTitle>引用コピー</DialogTitle>
      <Divider />
      <Box sx={{ px: 2, pt: 1 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            setSelectedTpl(null);
            setSelectedPiIds([]);
          }}
        >
          <Tab value="template" label="標準テンプレート" />
          <Tab value="other_patient" label="他患者" />
          <Tab value="past_plan" label="同一患者の過去計画" />
        </Tabs>
      </Box>
      <Box sx={{ px: 2, py: 1 }}>
        <TextField
          fullWidth
          placeholder="検索(疾患名・診断名など)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
        />
      </Box>
      <DialogContent dividers sx={{ pt: 1 }}>
        {tab === 'template' && (
          <Stack spacing={2}>
            {filteredTemplates.map((t) => {
              const isCurrent = selectedTpl?.tplId === t.id;
              return (
                <Box key={t.id}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{t.name}</Typography>
                  <List dense disablePadding sx={{ pl: 1 }}>
                    {allowLongTermGoalCopy && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            size="small"
                            checked={isCurrent && selectedTpl?.includeLtg === true}
                            onChange={(e) =>
                              setSelectedTpl((prev) => {
                                const indexes = isCurrent ? prev!.indexes : [];
                                return { tplId: t.id, indexes, includeLtg: e.target.checked };
                              })
                            }
                          />
                        }
                        label={<Typography variant="body2">長期目標: {t.longTermGoal}</Typography>}
                      />
                    )}
                    {t.problemItems.map((pi, idx) => (
                      <FormControlLabel
                        key={idx}
                        control={
                          <Checkbox
                            size="small"
                            checked={isCurrent && selectedTpl?.indexes.includes(idx) === true}
                            onChange={() => toggleTplItem(t.id, idx)}
                          />
                        }
                        label={
                          <Typography variant="body2">
                            看護計画: {nandaName(pi.nandaCode)} / 目標: {pi.shortTermGoal}
                          </Typography>
                        }
                      />
                    ))}
                  </List>
                </Box>
              );
            })}
          </Stack>
        )}
        {tab === 'other_patient' && (
          <List dense disablePadding>
            {otherPatientItems.map((pi) => {
              const plan = carePlans.find((p) => p.id === pi.carePlanId);
              const patient = patients.find((pt) => pt.id === plan?.patientId);
              return (
                <FormControlLabel
                  key={pi.id}
                  control={
                    <Checkbox
                      size="small"
                      checked={selectedPiIds.includes(pi.id)}
                      onChange={() => togglePi(pi.id)}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {patient?.name} ({patient?.primaryDiagnosis}) / {nandaName(pi.nandaCode)} / 目標: {pi.shortTermGoal}
                    </Typography>
                  }
                />
              );
            })}
            {otherPatientItems.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                該当する看護計画がありません
              </Typography>
            )}
          </List>
        )}
        {tab === 'past_plan' && (
          <List dense disablePadding>
            {pastPlanItems.map((pi) => (
              <FormControlLabel
                key={pi.id}
                control={
                  <Checkbox
                    size="small"
                    checked={selectedPiIds.includes(pi.id)}
                    onChange={() => togglePi(pi.id)}
                  />
                }
                label={
                  <Typography variant="body2">
                    {nandaName(pi.nandaCode)} / 目標: {pi.shortTermGoal}
                  </Typography>
                }
              />
            ))}
            {pastPlanItems.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                同一患者の過去計画は登録されていません
              </Typography>
            )}
          </List>
        )}
      </DialogContent>
      <Box sx={{ px: 2, py: 1.5, bgcolor: '#fef3c7', borderTop: '1px solid #fcd34d' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: '#92400e' }}>
          選択: {selectedCount}件
        </Typography>
        <Alert severity="warning" variant="outlined" sx={{ mt: 0.5, py: 0.5 }}>
          コピー後は必ず以下を編集してください: 目標の具体文言(患者固有表現) / OTE 本文(患者の状態に応じた調整)
        </Alert>
      </Box>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" disabled={selectedCount === 0} onClick={handleCopy}>
          コピー実行
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CopyFromDialog;

import React from 'react';
import { Box, Typography } from '@mui/material';
import type { CarePlan, Patient, ProblemItem } from '../types';
import { useCarePlanStore, formatJPDate } from '../store';

interface Props {
  patient: Patient;
  carePlan: CarePlan;
  planAuthor: string;
  items: { item: ProblemItem; no: number }[];
}

const STATUS_LABEL: Record<ProblemItem['status'], string> = {
  draft: '下書き',
  active: '有効',
  evaluating: '評価中',
  closed_resolved: '解決',
  closed_cancelled: '中止',
  closed_changed: '変更',
};

const PRIORITY_LABEL = { high: '高', medium: '中', low: '低' } as const;

const PrintLayout: React.FC<Props> = ({ patient, carePlan, planAuthor, items }) => {
  const nandaMaster = useCarePlanStore((s) => s.nandaMaster);
  const nandaName = (code: string) =>
    nandaMaster.find((n) => n.code === code)?.name ?? code;

  return (
    <Box className="print-only" sx={{ display: 'none' }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ borderBottom: '2px solid #000', pb: 1, mb: 2 }}>
          <Typography variant="h5" sx={{ mb: 0.5 }}>看護過程</Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Typography variant="body2">
              <strong>患者:</strong> {patient.name} ({patient.age}歳
              {patient.sex === 'M' ? '男性' : patient.sex === 'F' ? '女性' : 'その他'})
            </Typography>
            <Typography variant="body2"><strong>病室:</strong> {patient.roomNo}号室</Typography>
            <Typography variant="body2"><strong>主診断:</strong> {patient.primaryDiagnosis}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 0.5 }}>
            <Typography variant="body2"><strong>立案日:</strong> {formatJPDate(carePlan.createdAt)}</Typography>
            <Typography variant="body2"><strong>立案者:</strong> {planAuthor}</Typography>
            <Typography variant="body2"><strong>印刷日:</strong> {formatJPDate(new Date().toISOString())}</Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2, p: 1, border: '1px solid #000' }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>長期目標</Typography>
          <Typography variant="body2">{carePlan.longTermGoal}</Typography>
        </Box>

        {items.map(({ item, no }) => {
          const isClosed = item.status.startsWith('closed');
          return (
            <Box
              key={item.id}
              sx={{
                mb: 1.5,
                p: 1,
                border: '1px solid #000',
                pageBreakInside: 'avoid',
                opacity: isClosed ? 0.7 : 1,
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, mb: 0.5, alignItems: 'baseline' }}>
                <Typography variant="subtitle2">#{no}</Typography>
                <Typography variant="body2"><strong>領域:</strong> {item.domain}</Typography>
                <Typography variant="body2"><strong>優先度:</strong> {PRIORITY_LABEL[item.priority]}</Typography>
                <Typography variant="body2"><strong>状態:</strong> {STATUS_LABEL[item.status]}</Typography>
              </Box>
              <Box sx={{ mb: 0.5 }}>
                <Typography variant="body2"><strong>看護診断:</strong> {nandaName(item.nandaCode)} ({item.nandaCode})</Typography>
              </Box>
              <Box sx={{ mb: 0.5 }}>
                <Typography variant="body2"><strong>短期目標:</strong> {item.shortTermGoal}</Typography>
              </Box>
              <Box sx={{ mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>具体策 (OTE)</Typography>
                <PrintOte label="O: 観察" lines={item.ote.observation} />
                <PrintOte label="T: 援助" lines={item.ote.therapy} />
                <PrintOte label="E: 指導" lines={item.ote.education} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, fontSize: '0.75rem', color: '#444' }}>
                <Typography variant="caption">立案日 {formatJPDate(item.createdAt)}</Typography>
                <Typography variant="caption">最終評価 {formatJPDate(item.lastEvaluatedAt)}</Typography>
                {!isClosed && (
                  <Typography variant="caption">次回期限 {formatJPDate(item.nextEvaluationDueAt)}</Typography>
                )}
                {isClosed && item.closedAt && (
                  <Typography variant="caption">クローズ {formatJPDate(item.closedAt)} / {item.closeReason}</Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

const PrintOte: React.FC<{ label: string; lines: string[] }> = ({ label, lines }) => {
  const filtered = lines.filter((l) => l.trim().length > 0);
  return (
    <Box sx={{ ml: 1, mb: 0.25 }}>
      <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      {filtered.length === 0 ? (
        <Typography variant="body2" component="span" sx={{ ml: 1, color: '#666' }}>—</Typography>
      ) : (
        <Box component="ul" sx={{ m: 0, pl: 3 }}>
          {filtered.map((line, i) => (
            <li key={i}>
              <Typography variant="body2">{line}</Typography>
            </li>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default PrintLayout;

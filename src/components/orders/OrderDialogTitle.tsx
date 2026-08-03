import React from 'react';
import { DialogTitle, Typography } from '@mui/material';
import type { Patient } from '../../types';

/**
 * オーダ系ダイアログ共通の見出し（画像オーダに統一）。
 * 濃紺バー＋白文字＋「対象患者: {患者番号}　{氏名}」表記で全オーダダイアログの表示を揃える。
 */
const OrderDialogTitle: React.FC<{ title: string; patient: Patient }> = ({ title, patient }) => (
  <DialogTitle sx={{ py: 1, bgcolor: '#2f6ca6', color: '#fff', fontSize: '1rem' }}>
    {title}
    <Typography component="span" variant="body2" sx={{ ml: 1.5, color: 'rgba(255,255,255,0.85)' }}>
      対象患者: {patient.patientNumber ?? patient.id}　{patient.name}
    </Typography>
  </DialogTitle>
);

export default OrderDialogTitle;

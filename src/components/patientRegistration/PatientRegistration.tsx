import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Stack, Grid, Alert,
  Card, CardContent, Divider, CircularProgress,
} from '@mui/material';
import { Search, PersonAdd, Link as LinkIcon } from '@mui/icons-material';
import { useAppStore } from '../../stores/useAppStore';

const PatientRegistration: React.FC = () => {
  const { showSnackbar } = useAppStore();
  const [patientNumber, setPatientNumber] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSearched(true);
    }, 800);
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        外来の受付とは別に、患者番号を指定してORCAから患者情報を取得し、院内システムに取り込みます。
      </Alert>

      <Paper variant="outlined" sx={{ p: 3, maxWidth: 700 }}>
        <Typography variant="subtitle1" gutterBottom>
          <LinkIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: '1.1rem' }} />
          ORCA患者情報取得
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 3 }}>
          <TextField
            label="患者番号"
            value={patientNumber}
            onChange={(e) => { setPatientNumber(e.target.value); setSearched(false); }}
            placeholder="患者番号を入力してください"
            sx={{ width: 300 }}
          />
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Search />}
            onClick={handleSearch}
            disabled={!patientNumber || loading}
            sx={{ height: 40 }}
          >
            ORCA検索
          </Button>
        </Stack>

        {searched && (
          <Card sx={{ mb: 3, bgcolor: '#f8fafc' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>ORCA取得結果</Typography>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">患者番号</Typography>
                  <Typography variant="body2" fontWeight={600}>{patientNumber}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">患者氏名</Typography>
                  <Typography variant="body2" fontWeight={600}>新規 患者</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">フリガナ</Typography>
                  <Typography variant="body2">シンキ カンジャ</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">生年月日</Typography>
                  <Typography variant="body2">1980/05/15</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">年齢</Typography>
                  <Typography variant="body2">45歳</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">性別</Typography>
                  <Typography variant="body2">男性</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">保険種別</Typography>
                  <Typography variant="body2">社保本人</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">住所</Typography>
                  <Typography variant="body2">埼玉県深谷市○○町1-2-3</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">電話番号</Typography>
                  <Typography variant="body2">048-XXX-XXXX</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {searched && (
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button variant="outlined" onClick={() => { setSearched(false); setPatientNumber(''); }}>
              クリア
            </Button>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => showSnackbar('患者情報を取り込みました', 'success')}
            >
              院内システムに取り込む
            </Button>
          </Stack>
        )}
      </Paper>
    </Box>
  );
};

export default PatientRegistration;

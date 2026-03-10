import { Box, Typography, Grid } from '@mui/material';
import {
  insuranceInfo,
  diagnosisInfo,
  allergyInfo,
  staffInfo,
  adlInfo,
  subTabs,
} from '../../data/mockData';

export default function MedicalInfo() {
  return (
    <Box
      sx={{
        border: '1px solid #ccc',
        bgcolor: '#fff',
        mb: 0.5,
      }}
    >
      {/* Section Header */}
      <Box
        sx={{
          bgcolor: '#e8eef5',
          px: 1,
          py: 0.3,
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography sx={{ fontSize: '11px', fontWeight: 700 }}>
          診療情報
        </Typography>
      </Box>

      <Box sx={{ px: 1, py: 0.5, fontSize: '11px' }}>
        {/* Insurance row */}
        <InfoRow label="保険情報">
          <Typography sx={{ fontSize: '11px' }}>
            {insuranceInfo.type}　有効期限: {insuranceInfo.validPeriod}
            保険者番号: {insuranceInfo.insurerNumber}　記録番号:{' '}
            {insuranceInfo.recordNumber}　{insuranceInfo.copay}
          </Typography>
        </InfoRow>

        {/* Diagnosis row */}
        <InfoRow label="主病名">
          <Typography sx={{ fontSize: '11px' }}>
            <Box component="span" sx={{ color: '#1565c0' }}>
              {diagnosisInfo.mainDiagnosisCode}
            </Box>{' '}
            {diagnosisInfo.mainDiagnosis}　{diagnosisInfo.mainDiagnosisDate}
          </Typography>
        </InfoRow>

        <InfoRow label="合併症">
          <Typography sx={{ fontSize: '11px' }}>
            {diagnosisInfo.subDiagnosisCode}　{diagnosisInfo.subDiagnosis}
            {diagnosisInfo.subDiagnosisDate}
          </Typography>
        </InfoRow>

        {/* Allergy row */}
        <InfoRow label="アレルギー">
          <Typography sx={{ fontSize: '11px', color: '#d32f2f' }}>
            アレルギー性鼻炎[アレルギー性鼻炎炎] / 喘息 / ウイルス性肝炎X /{' '}
            <Box component="span" sx={{ color: '#e65100' }}>
              鶏卵アレルギー[鶏卵]
            </Box>
          </Typography>
        </InfoRow>

        <InfoRow label="食物アレルギー">
          <Typography sx={{ fontSize: '11px', color: '#e65100' }}>
            {allergyInfo.food.join(' / ')}
          </Typography>
        </InfoRow>

        <InfoRow label="責任範囲">
          <Typography sx={{ fontSize: '11px' }}>
            {staffInfo.responsibleTeam}
          </Typography>
        </InfoRow>

        {/* Staff management grid */}
        <Box sx={{ ml: 10, mt: 0.5, mb: 0.5 }}>
          <Grid container spacing={0.5} sx={{ fontSize: '10px' }}>
            <Grid item xs={3}>
              <SmallInfoBox label="副腎管理" value={staffInfo.wardManagement} />
            </Grid>
            <Grid item xs={3}>
              <SmallInfoBox
                label="スタッフ管理"
                value={staffInfo.staffManagement}
              />
            </Grid>
            <Grid item xs={3}>
              <SmallInfoBox label="自立度判定" value="B." />
            </Grid>
            <Grid item xs={3}>
              <SmallInfoBox label="2/B(昼)1h/B(夜)" value="" />
            </Grid>
          </Grid>
          <Typography
            sx={{ fontSize: '10px', color: '#888', mt: 0.3 }}
          >
            その他レベルの備考
          </Typography>
        </Box>

        {/* ADL info */}
        <InfoRow label="動作/指標">
          <Typography sx={{ fontSize: '11px' }}>
            {adlInfo.barthel}
          </Typography>
        </InfoRow>

        <InfoRow label="GAF">
          <Typography sx={{ fontSize: '11px' }}>
            {adlInfo.gaf}
          </Typography>
        </InfoRow>

        <InfoRow label="計画日">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: '11px' }}>
              {adlInfo.planDate}
            </Typography>
            <Typography
              sx={{ fontSize: '10px', color: '#1565c0', cursor: 'pointer' }}
            >
              プロビタン
            </Typography>
          </Box>
        </InfoRow>

        <InfoRow label="観察項目">
          <Typography sx={{ fontSize: '10px', color: '#666' }}>
            入院後の観察項目 / 日常動作評価 / デイケア対応記録 /
            看護/入院 日誌/入院1
          </Typography>
        </InfoRow>
      </Box>

      {/* Sub-tab bar */}
      <Box
        sx={{
          display: 'flex',
          gap: 0,
          borderTop: '1px solid #ddd',
          px: 0.5,
          py: 0.3,
          bgcolor: '#f5f5f5',
          flexWrap: 'wrap',
        }}
      >
        {subTabs.map((tab, i) => (
          <Box
            key={tab}
            sx={{
              px: 1,
              py: 0.2,
              fontSize: '10px',
              cursor: 'pointer',
              color: i === 0 ? '#1565c0' : '#333',
              fontWeight: i === 0 ? 600 : 400,
              borderRight: '1px solid #ddd',
              '&:hover': { bgcolor: '#e3f2fd' },
            }}
          >
            {tab}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        py: 0.2,
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Typography
        sx={{
          fontSize: '10px',
          color: '#666',
          width: 80,
          flexShrink: 0,
          fontWeight: 600,
          pt: 0.1,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1 }}>{children}</Box>
    </Box>
  );
}

function SmallInfoBox({ label, value }: { label: string; value: string }) {
  return (
    <Box
      sx={{
        border: '1px solid #e0e0e0',
        borderRadius: 0.5,
        px: 0.5,
        py: 0.2,
        bgcolor: '#fafafa',
      }}
    >
      <Typography sx={{ fontSize: '9px', color: '#888' }}>{label}</Typography>
      <Typography sx={{ fontSize: '10px' }}>{value}</Typography>
    </Box>
  );
}

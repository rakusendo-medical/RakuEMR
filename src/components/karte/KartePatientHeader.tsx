import { Box, Button, Chip, Stack, Tooltip, Typography } from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Vaccines as AllergyIcon,
  Coronavirus as InfectionIcon,
  PregnantWoman as PregnantIcon,
  PersonOff as FallRiskIcon,
  Lock as RestraintIcon,
  NoMeals as DysphagiaIcon,
  Psychology as DementiaIcon,
  Warning as WatchIcon,
} from '@mui/icons-material';
import type { BedFlag, Patient } from '../../types';
import { WARD_LABELS } from '../../types';
import { ROOMS } from '../../data/mockData';
import type { KarteMode } from './KartePage';

interface KartePatientHeaderProps {
  patient: Patient;
  mode: KarteMode;
  onBack: () => void;
}

// ===== mode 別カラー =====

interface ModeTheme {
  /** ヘッダー上端のアクセントボーダー */
  accent: string;
  /** mode バッジの色 */
  badgeBg: string;
  badgeColor: string;
  /** ラベル */
  badgeLabel: string;
}

function modeTheme(mode: KarteMode, admissionState: Patient['admissionState']): ModeTheme {
  if (admissionState === 'discharged') {
    return { accent: '#9ca3af', badgeBg: '#6b7280', badgeColor: '#fff', badgeLabel: '退院済' };
  }
  if (mode === 'outpatient') {
    return { accent: '#16a34a', badgeBg: '#16a34a', badgeColor: '#fff', badgeLabel: '外来' };
  }
  // inpatient
  return { accent: '#dc2626', badgeBg: '#dc2626', badgeColor: '#fff', badgeLabel: '入院' };
}

// ===== ベッドフラグ取得 =====

function getBedFlags(patient: Patient): BedFlag[] {
  const room = ROOMS.find(
    (r) => r.roomNumber === patient.roomNumber && r.wardId === patient.wardId,
  );
  const bed = room?.beds.find((b) => b.patientId === patient.id);
  return bed?.flags ?? [];
}

// ===== 8 ピクトグラム判定 =====

function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface PictogramDef {
  key: string;
  label: string;
  Icon: React.ElementType;
  /** 該当時のカラー */
  activeColor: string;
  /** Tooltip にする該当判定の説明（active 時） */
  activeDetail: string;
}

interface PictogramState extends PictogramDef {
  active: boolean;
}

function buildPictograms(patient: Patient): PictogramState[] {
  const flags = getBedFlags(patient);
  const isIsolated = flags.includes('isolation') || flags.includes('restraint');
  const reportRequired = flags.includes('reportRequired');
  const idHash = strHash(patient.id);

  // 段階 2 mock: 該当判定の一部は patient.id ハッシュで擬似的に振る
  // 本格判定（Patient 型への新規フィールド追加）は段階 3 / 別エピックで対応
  const hashFlag = (salt: string, threshold: number) =>
    strHash(patient.id + ':' + salt) % 100 < threshold;

  const allergyActive   = hashFlag('allergy',   30);                            // 30% 該当
  const infectionActive = hashFlag('infection', 18);                            // 18%
  const pregnantActive  = patient.gender === 'F' && patient.age < 45 && hashFlag('pregnant', 12);
  const fallActive      = hashFlag('fall', 35) || patient.age >= 70;            // 高齢は該当
  const dysphagiaActive = hashFlag('dysphagia', 20);
  const dementiaActive  = hashFlag('dementia', 25) || patient.age >= 75;

  // ハッシュ未使用警告抑止
  void idHash;

  return [
    { key: 'allergy',   label: 'アレルギー',         Icon: AllergyIcon,    activeColor: '#dc2626', activeDetail: '禁忌薬・食物アレルギー登録あり', active: allergyActive },
    { key: 'infection', label: '感染症',             Icon: InfectionIcon,  activeColor: '#ea580c', activeDetail: 'HBV / HCV / HIV / 結核 等の登録あり', active: infectionActive },
    { key: 'pregnant',  label: '妊娠',               Icon: PregnantIcon,   activeColor: '#db2777', activeDetail: '妊娠中', active: pregnantActive },
    { key: 'fall',      label: '転倒・転落リスク',   Icon: FallRiskIcon,   activeColor: '#ca8a04', activeDetail: '転倒・転落リスク登録あり', active: fallActive },
    { key: 'restraint', label: '隔離・拘束',         Icon: RestraintIcon,  activeColor: '#dc2626', activeDetail: '隔離 / 拘束指示中', active: isIsolated },
    { key: 'dysphagia', label: '嚥下障害 / 食事制限', Icon: DysphagiaIcon, activeColor: '#2563eb', activeDetail: '嚥下障害 / 食事制限あり', active: dysphagiaActive },
    { key: 'dementia',  label: '認知機能低下',       Icon: DementiaIcon,   activeColor: '#7c3aed', activeDetail: '認知症 / 認知機能低下あり', active: dementiaActive },
    { key: 'watch',     label: '要報告 / 観察事項',  Icon: WatchIcon,      activeColor: '#dc2626', activeDetail: '要報告フラグあり', active: reportRequired },
  ];
}

// ===== Component =====

export default function KartePatientHeader({ patient, mode, onBack }: KartePatientHeaderProps) {
  const theme = modeTheme(mode, patient.admissionState);
  const isInpatient = mode === 'inpatient' && patient.admissionState !== 'discharged';
  const flags = getBedFlags(patient);
  const isIsolated = flags.includes('isolation');
  const isRestrained = flags.includes('restraint');
  const pictograms = buildPictograms(patient);

  const wardLabel = patient.wardName ?? WARD_LABELS[patient.wardId] ?? '';
  const roomBed = isInpatient
    ? [wardLabel, patient.roomNumber && `${patient.roomNumber}号室`, patient.bedLabel && `-${patient.bedLabel}`]
        .filter(Boolean).join(' ').replace(' -', '-')
    : '';

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderTop: `3px solid ${theme.accent}`,
        borderBottom: 1,
        borderColor: 'divider',
        px: 2,
        py: 0.75,
      }}
    >
      {/* === Row 1: 戻る + mode バッジ + 患者氏名 + 病棟病室 + 右端: 隔離・拘束 === */}
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
        <Button
          size="small"
          variant="text"
          startIcon={<ArrowBackIcon fontSize="small" />}
          onClick={onBack}
          sx={{ textTransform: 'none', flexShrink: 0, color: theme.accent, fontWeight: 700 }}
        >
          一覧に戻る
        </Button>

        <Box
          sx={{
            bgcolor: theme.badgeBg, color: theme.badgeColor,
            fontWeight: 700, fontSize: '0.8rem',
            px: 1.25, py: 0.25, borderRadius: 0.5,
            flexShrink: 0,
          }}
        >
          {theme.badgeLabel}
        </Box>

        <Typography variant="body2" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
          {patient.id}
        </Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {patient.name}
        </Typography>
        {patient.nameKana && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {patient.nameKana}
          </Typography>
        )}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {patient.age}歳・{patient.gender === 'M' ? '男' : '女'}
        </Typography>

        {isInpatient && roomBed && (
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              ml: 0.5,
              px: 1,
              py: 0.25,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 0.5,
              bgcolor: 'grey.50',
            }}
          >
            {roomBed}
          </Typography>
        )}

        <Box sx={{ flex: 1 }} />

        {isIsolated && (
          <Chip label="隔離" size="small" sx={{ bgcolor: '#dc2626', color: '#fff', fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
        )}
        {isRestrained && (
          <Chip label="拘束" size="small" sx={{ bgcolor: '#b91c1c', color: '#fff', fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
        )}
      </Stack>

      {/* === Row 2: 主治医 / 入院日 / 診断 + 右端: 8 ピクトグラム === */}
      <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
        {patient.doctorName && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Dr {patient.doctorName}
            </Box>
          </Typography>
        )}
        {isInpatient && patient.admitDate && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            入院日:{' '}
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {patient.admitDate}
            </Box>
          </Typography>
        )}
        {patient.diagnosis && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            診断:{' '}
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {patient.diagnosis}
            </Box>
          </Typography>
        )}
        {patient.nurse && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            受け持ち:{' '}
            <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {patient.nurse}
            </Box>
          </Typography>
        )}

        <Box sx={{ flex: 1 }} />

        {/* 8 ピクトグラム */}
        <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0 }}>
          {pictograms.map((p) => {
            const IconComp = p.Icon;
            const tooltip = p.active ? `${p.label}: ${p.activeDetail}` : `${p.label}: 該当なし`;
            return (
              <Tooltip key={p.key} title={tooltip} placement="bottom">
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 0.5,
                    bgcolor: p.active ? `${p.activeColor}1a` : 'transparent', // 該当時は淡い背景
                    border: '1px solid',
                    borderColor: p.active ? p.activeColor : 'grey.300',
                  }}
                >
                  <IconComp sx={{ fontSize: 16, color: p.active ? p.activeColor : 'grey.400' }} />
                </Box>
              </Tooltip>
            );
          })}
        </Stack>
      </Stack>
    </Box>
  );
}

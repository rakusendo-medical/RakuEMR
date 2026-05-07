import { Card, CardContent, Typography } from '@mui/material';
import type { Patient } from '../../types';
import SectionHeader from '../common/SectionHeader';
import RestraintOrderLinks from '../isolation/RestraintOrderLinks';
import type { KarteMode } from './KartePage';

interface Props {
  patient: Patient;
  mode: KarteMode;
  /**
   * 隔離拘束指示リンクのクリックハンドラ。
   * mode='inpatient' のときのみ SectionHeader.rightSlot に RestraintOrderLinks を出すため、
   * outpatient モードではこのハンドラは呼ばれない。
   */
  onRequestRestraintOrder: (title: string, editOrderId?: string) => void;
}

/**
 * us-36 サブ B: 新カルテ画面の「診療録」タブのスタブ実装。
 *
 * 段階 2 ではタブ枠 + 隔離拘束指示リンク（mode='inpatient' のみ）を実装する。
 * 診療録ビュー本体（記事一覧・フィルタ・指示詳細）は段階 3（ep-17）で
 * KarteAlphaPage の MedicalRecordsDense を移植予定。
 */
export default function MedicalRecordTab({
  patient,
  mode,
  onRequestRestraintOrder,
}: Props) {
  return (
    <Card sx={{ overflow: 'visible' }}>
      <SectionHeader
        title="診療録"
        rightSlot={
          mode === 'inpatient' ? (
            <RestraintOrderLinks
              patient={patient}
              onRequestOrder={onRequestRestraintOrder}
            />
          ) : undefined
        }
      />
      <CardContent sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          段階 2 ではタブ枠 + 隔離拘束指示リンクのみ実装（mode='inpatient' のとき）。
          診療録ビュー本体（記事一覧・フィルタ・指示詳細）は段階 3（ep-17）で
          KarteAlphaPage の MedicalRecordsDense を移植予定。
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1 }}
        >
          現在 mode: <code>{mode}</code> / patientId: <code>{patient.id}</code>
        </Typography>
      </CardContent>
    </Card>
  );
}

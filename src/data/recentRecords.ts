// ===== 主要患者の直近 30 日分 記録データ =====
//
// 目的: 記録サマリー帯（最近 30 日）や診療録タブが「擬似データ」ではなく実データで
// 埋まるようにする。画面確認でよく使う主要患者（P001〜P003）を対象とし、
// 医師記録／看護記録／部門診療録を基準日（MOCK_TODAY）から遡る 30 日分で用意する。
//
// 方針:
//   - 乱数は使わず、日付と患者から決まる**決定的**な組み立てにする（リロードで変わらない）。
//   - 記録の粗密に意味を持たせる: 医師記録は定期回診（月・木）＋節目、看護記録はほぼ毎日、
//     部門診療録は週 2 回程度。「いつ・どの記録が・どの程度あるか」が帯で読み取れる。
//   - 対象外の患者は従来どおり帯側の擬似生成で埋める（RecordSummaryStrip 参照）。
//
// 日付を動かすときは MOCK_TODAY だけを変えれば全件が追従する（本ファイルに固定日付は持たない）。

import { MOCK_TODAY } from './mockToday';

export type RecentRecordCategory = '医師記録' | '看護記録' | '部門診療録';

export interface RecentRecord {
  id: string;
  patientId: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm */
  time: string;
  category: RecentRecordCategory;
  author: string;
  authorRole: string;
  content: string;
  tags: string[];
}

/** 実データを持つ患者。ここに無い患者は帯側で擬似生成される。 */
export const RECENT_RECORD_PATIENT_IDS = ['P001', 'P002', 'P003'] as const;

/** 直近何日分を用意するか（記録サマリー帯の既定表示日数に合わせる）。 */
export const RECENT_RECORD_DAYS = 30;

// ---- 患者ごとの文脈（診断・担当・記録の傾向） ----
interface PatientProfile {
  doctor: string;
  /** 医師記録の定期回診曜日（0=日）。節目日には臨時記録も入る */
  roundWeekdays: number[];
  /** 部門診療録の実施曜日 */
  deptWeekdays: number[];
  deptAuthor: string;
  deptRole: string;
  doctorNotes: string[];
  nurseNotes: string[];
  deptNotes: string[];
}

const PROFILES: Record<string, PatientProfile> = {
  // P001 山田 太郎（統合失調症・退院に向けた調整期）
  P001: {
    doctor: '田村 医師',
    roundWeekdays: [1, 4],
    deptWeekdays: [2, 5],
    deptAuthor: '大野 作業療法士',
    deptRole: 'OT',
    doctorNotes: [
      '定期回診。幻聴の訴えなく経過。処方継続。',
      '睡眠状況を確認。中途覚醒は減少傾向。眠剤は現行維持。',
      '血液検査結果確認。炎症所見なし。現行治療を継続。',
      '退院に向けた環境調整を家族と相談。訪問看護の導入を検討。',
      '服薬自己管理の段階を一段進める方針を看護と共有。',
      '外出訓練の結果を確認。特記事項なく経過良好。',
    ],
    nurseNotes: [
      '朝の検温実施。バイタル著変なし。朝食全量摂取。表情穏やか。',
      '服薬確認済み。自己管理の手順を一緒に確認した。',
      '日中レクリエーションに参加。他患との交流もみられる。',
      '夜間巡回。入眠確認。呼吸状態安定。',
      '面会あり（家族）。面会後も落ち着いて過ごされている。',
      '作業療法へ送り出し。意欲的な様子。',
      '入浴介助不要。皮膚状態に異常なし。',
    ],
    deptNotes: [
      '作業療法参加。革細工に取り組む。集中力は 40 分程度持続。',
      '作業療法参加。グループ活動で他患と協働できた。',
      '退院後の生活を想定した調理プログラムを実施。手順書を用いて自立。',
      '作業療法参加。疲労の訴えなく最後まで参加できた。',
    ],
  },
  // P002 佐藤 花子（うつ病・観察中）
  P002: {
    doctor: '岸本 医師',
    roundWeekdays: [2, 5],
    deptWeekdays: [3],
    deptAuthor: '西村 公認心理師',
    deptRole: '心理',
    doctorNotes: [
      '定期回診。抑うつ気分は残存するが希死念慮の訴えはなし。',
      '食欲低下が続くため栄養科へ相談を依頼。',
      '午前中の倦怠感について聴取。抗うつ薬の用量を微調整。',
      '睡眠導入剤の効果を確認。入眠までの時間が短縮している。',
      '気分の日内変動が縮小。作業への参加を段階的に促す方針。',
    ],
    nurseNotes: [
      '朝の検温実施。食事は半量摂取。臥床がちだが声かけに応じる。',
      '「少し楽になった」との発言あり。傾聴対応を継続。',
      '午前は臥床傾向。午後は談話室で過ごされる。',
      '夜間巡回。入眠まで時間を要したが朝まで良眠。',
      '内服確認。拒否なく服用できている。',
      '清拭介助実施。皮膚トラブルなし。',
    ],
    deptNotes: [
      '心理面接実施。気分の変動と対処法について整理した。',
      '心理検査のフィードバックを実施。本人の理解良好。',
      '心理面接実施。退院後の生活不安について傾聴した。',
    ],
  },
  // P003 鈴木 一郎（双極性障害・行動制限下で観察頻度が高い）
  P003: {
    doctor: '森田 医師',
    roundWeekdays: [1, 3, 5],
    deptWeekdays: [4],
    deptAuthor: '橋本 精神保健福祉士',
    deptRole: 'PSW',
    doctorNotes: [
      '定期診察。気分高揚は軽減。隔離の継続要否を評価。',
      '隔離解除の可否を検討。日中の言動は落ち着いている。',
      '気分安定薬の血中濃度を確認。用量は現行維持。',
      '易怒性の訴えについて聴取。頓用の使用状況を確認。',
      '行動制限最小化に向けて多職種で方針を確認した。',
    ],
    nurseNotes: [
      '隔離室巡回。落ち着いた様子。食事全量摂取。',
      '観察時、不穏なく経過。水分摂取を促した。',
      '大声あり。傾聴対応にて 30 分後に落ち着かれる。',
      '夜間巡回。入眠確認。呼吸状態安定。',
      '内服確認。拒否なく服用。',
      '日中は臥床と離床を繰り返す。声かけに応答良好。',
    ],
    deptNotes: [
      '面談実施。退院後の住居について情報提供を行った。',
      '面談実施。家族との調整状況を共有。',
      '面談実施。福祉サービスの利用申請について説明した。',
    ],
  },
};

const NURSES = ['山本 看護師', '中田 看護師', '佐々木 看護師'];

// ---- 日付ユーティリティ（ローカル日付で扱う。UTC 変換による日ずれを避ける） ----
function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function shiftIso(iso: string, days: number): string {
  const d = parseIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

/** 日付と患者から決まる安定インデックス（乱数を使わないための決定的な散らし） */
function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function buildRecentRecords(): RecentRecord[] {
  const out: RecentRecord[] = [];
  // 基準日から遡る RECENT_RECORD_DAYS 日（昇順）
  const days = Array.from({ length: RECENT_RECORD_DAYS }, (_, i) =>
    shiftIso(MOCK_TODAY, i - (RECENT_RECORD_DAYS - 1)));

  for (const patientId of RECENT_RECORD_PATIENT_IDS) {
    const p = PROFILES[patientId];
    days.forEach((iso, dayIndex) => {
      const weekday = parseIso(iso).getDay();
      const seed = dayIndex + patientId.charCodeAt(3);

      // --- 医師記録: 定期回診曜日 + 3 日ごとの節目（重複日は 1 件に集約される） ---
      if (p.roundWeekdays.includes(weekday)) {
        out.push({
          id: `rr-dr-${patientId}-${iso}`,
          patientId, date: iso, time: '10:30',
          category: '医師記録',
          author: p.doctor, authorRole: '医師D',
          content: pick(p.doctorNotes, seed),
          tags: [],
        });
      }

      // --- 看護記録: 日勤帯は毎日、夜勤帯は 2 日に 1 回 ---
      out.push({
        id: `rr-ns-${patientId}-${iso}-day`,
        patientId, date: iso, time: '09:00',
        category: '看護記録',
        author: pick(NURSES, seed), authorRole: '',
        content: pick(p.nurseNotes, seed),
        tags: ['看護記録'],
      });
      if (dayIndex % 2 === 0) {
        out.push({
          id: `rr-ns-${patientId}-${iso}-night`,
          patientId, date: iso, time: '21:30',
          category: '看護記録',
          author: pick(NURSES, seed + 1), authorRole: '',
          content: pick(p.nurseNotes, seed + 3),
          tags: ['看護記録'],
        });
      }

      // --- 部門診療録: 曜日固定（作業療法・心理・PSW） ---
      if (p.deptWeekdays.includes(weekday)) {
        out.push({
          id: `rr-dept-${patientId}-${iso}`,
          patientId, date: iso, time: '14:00',
          category: '部門診療録',
          author: p.deptAuthor, authorRole: p.deptRole,
          content: pick(p.deptNotes, seed),
          tags: ['部門診療録'],
        });
      }
    });
  }
  return out;
}

export const RECENT_RECORDS: RecentRecord[] = buildRecentRecords();

/** 指定患者が実データを持つか（持たない患者は帯側で擬似生成する） */
export function hasRecentRecords(patientId: string | undefined): boolean {
  return !!patientId && (RECENT_RECORD_PATIENT_IDS as readonly string[]).includes(patientId);
}

/** 指定患者の記録（新しい順） */
export function recentRecordsOf(patientId: string | undefined): RecentRecord[] {
  if (!patientId) return [];
  return RECENT_RECORDS
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

/** 指定患者の「カテゴリ → 記録がある日付集合」（記録サマリー帯のバッジ判定用） */
export function recentRecordDateSets(patientId: string | undefined): Record<RecentRecordCategory, Set<string>> {
  const sets: Record<RecentRecordCategory, Set<string>> = {
    '医師記録': new Set(),
    '看護記録': new Set(),
    '部門診療録': new Set(),
  };
  for (const r of RECENT_RECORDS) {
    if (r.patientId === patientId) sets[r.category].add(r.date);
  }
  return sets;
}

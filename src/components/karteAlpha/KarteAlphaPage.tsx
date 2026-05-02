import React, { useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Stack,
  Chip,
  Grid,
  Divider,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  ArrowBack,
  ArrowBackIosNew,
  ArrowForwardIos,
  Send,
  Edit,
  NoteAdd,
  Receipt,
  MeetingRoom,
  CalendarMonth,
  Print,
  ThumbUpAltOutlined,
  ChatBubbleOutline,
  ExpandMore,
  ExpandLess,
  Description,
  AssignmentTurnedIn,
  ListAlt,
  ShowChart,
  PersonOutline,
  EventNote,
  MedicalServices,
  LoginOutlined,
  LogoutOutlined,
} from "@mui/icons-material";
import AdmissionOrderDialog from "../admission/AdmissionOrderDialog";
import DischargeOrderDialog from "../admission/DischargeOrderDialog";
import { PATIENTS, ORDERS, NURSING_RECORDS } from "../../data/mockData";
import StatusBadge from "../common/StatusBadge";
import { useAppStore } from "../../stores/useAppStore";
import FlowsheetView from "../flowsheet/Flowsheet";
import PatientCarePlan from "../../features/carePlan/pages/PatientCarePlan";

// ===== Mock data for the dense karte view =====

interface KarteInsurance {
  type: string;
  insurerNumber: string;
  recordNumber: string;
  copay: string;
  validPeriod: string;
}

interface KarteDiagnosis {
  main: string;
  mainCode: string;
  mainDate: string;
  sub: string;
  subCode: string;
  subDate: string;
}

interface KarteAllergy {
  drug: string[];
  food: string[];
}

interface KarteStaff {
  team: string;
  wardMgmt: string;
  independenceLevel: string;
}

interface KarteAdl {
  barthel: string;
  gaf: string;
  planDate: string;
}

interface KarteRecord {
  id: string;
  date: string;
  dayOfWeek: string;
  category: string;
  categoryColor: string;
  author: string;
  authorRole: string;
  content: string;
  tags: string[];
  orderNumber?: string;
  timestamp: string;
}

const MOCK_INSURANCE: KarteInsurance = {
  type: "テスト保険",
  insurerNumber: "39999839",
  recordNumber: "01・23456789",
  copay: "3割",
  validPeriod: "39999999",
};

const MOCK_DIAGNOSIS: KarteDiagnosis = {
  main: "統合失調症",
  mainCode: "F20.9",
  mainDate: "2026/01/10 ～",
  sub: "不眠症",
  subCode: "G47.0",
  subDate: "2026/01/20 ～",
};

const MOCK_ALLERGY: KarteAllergy = {
  drug: ["アレルギー性鼻炎[アレルギー性鼻炎炎]", "喘息", "ウイルス性肝炎X"],
  food: ["鶏卵アレルギー[鶏卵]"],
};

const MOCK_STAFF: KarteStaff = {
  team: "病棟内/スタッフ同伴",
  wardMgmt: "2/B(昼)1h/B(夜)",
  independenceLevel: "B.",
};

const MOCK_ADL: KarteAdl = {
  barthel: "バーサリ: 記録値 AB30",
  gaf: "63点 (確定日) 2026/01/10",
  planDate: "2026年3月 10日 (月)",
};

const MOCK_RECORDS: KarteRecord[] = [
  // 3/10 (月)
  { id: "kr1", date: "2026/03/10", dayOfWeek: "月", category: "医師記録", categoryColor: "#1e40af", author: "田村 医師", authorRole: "医師D", content: "定期回診。状態安定。処方継続。", tags: [], timestamp: "2026/03/10 10:30" },
  { id: "kr2", date: "2026/03/10", dayOfWeek: "月", category: "看護記録", categoryColor: "#c2410c", author: "山本 看護師", authorRole: "", content: "朝の検温実施。体温36.5℃、血圧128/82。食欲あり、朝食全量摂取。表情穏やか。服薬確認済み。", tags: ["看護記録"], timestamp: "2026/03/10 09:00" },
  { id: "kr2b", date: "2026/03/10", dayOfWeek: "月", category: "看護記録", categoryColor: "#c2410c", author: "佐々木 看護師", authorRole: "", content: "日中レクリエーション参加。他患者と会話あり。笑顔も見られた。", tags: ["看護記録"], timestamp: "2026/03/10 14:30" },
  // 3/9 (日)
  { id: "kr3", date: "2026/03/09", dayOfWeek: "日", category: "看護記録", categoryColor: "#c2410c", author: "中田 看護師", authorRole: "", content: "午後の回診同行。主治医より薬剤変更の指示あり。患者に説明済み。理解良好。", tags: ["看護記録", "クリニカルパス"], orderNumber: "NO.827", timestamp: "2026/03/09 14:00" },
  { id: "kr4", date: "2026/03/09", dayOfWeek: "日", category: "医師記録", categoryColor: "#1e40af", author: "田村 医師", authorRole: "医師D", content: "リスパダール 2mg → 3mg に増量指示。経過観察継続。", tags: [], orderNumber: "NO.827", timestamp: "2026/03/09 13:45" },
  // 3/8 (土)
  { id: "kr5", date: "2026/03/08", dayOfWeek: "土", category: "看護サマリ", categoryColor: "#7c3aed", author: "山本 看護師", authorRole: "", content: "面会あり（家族：妻）。面会後やや落ち着かない様子。見守り継続。30分後に落ち着きを取り戻す。", tags: ["退院支援", "看護師カンファ"], orderNumber: "NO.827", timestamp: "2026/03/08 10:30" },
  { id: "kr5b", date: "2026/03/08", dayOfWeek: "土", category: "看護記録", categoryColor: "#c2410c", author: "中田 看護師", authorRole: "", content: "夕食後、自室にて読書。消灯前に服薬確認済み。入眠スムーズ。", tags: [], timestamp: "2026/03/08 20:00" },
  // 3/7 (金)
  { id: "kr6", date: "2026/03/07", dayOfWeek: "金", category: "看護記録", categoryColor: "#c2410c", author: "佐々木 看護師", authorRole: "", content: "夜間巡回。入眠確認。呼吸状態安定。体位変換不要。", tags: [], timestamp: "2026/03/07 21:00" },
  { id: "kr6b", date: "2026/03/07", dayOfWeek: "金", category: "医師記録", categoryColor: "#1e40af", author: "田村 医師", authorRole: "医師D", content: "血液検査結果確認。CRP 0.2、WBC 5800。炎症所見なし。現行治療継続。", tags: [], timestamp: "2026/03/07 15:00" },
  { id: "kr6c", date: "2026/03/07", dayOfWeek: "金", category: "看護記録", categoryColor: "#c2410c", author: "山本 看護師", authorRole: "", content: "午前中リハビリ参加。歩行訓練15分実施。疲労感の訴えなし。", tags: ["看護記録"], timestamp: "2026/03/07 11:00" },
  // 3/6 (木)
  { id: "kr7", date: "2026/03/06", dayOfWeek: "木", category: "入退院記録", categoryColor: "#b91c1c", author: "田村 医師", authorRole: "医師D", content: "【精神科】\n退院環境調整の指示\n [居場所]当院病棟\n [現在室]101\n [身長]167.8cm\n [体重]72.0kg", tags: [], orderNumber: "NO.837", timestamp: "2026/03/06 17:23" },
  { id: "kr7b", date: "2026/03/06", dayOfWeek: "木", category: "看護記録", categoryColor: "#c2410c", author: "佐々木 看護師", authorRole: "", content: "デイケア参加。集団プログラムにて積極的に発言。気分良好の様子。", tags: ["看護記録"], timestamp: "2026/03/06 14:00" },
  // 3/5 (水)
  { id: "kr8", date: "2026/03/05", dayOfWeek: "水", category: "医師記録", categoryColor: "#1e40af", author: "田村 医師", authorRole: "医師D", content: "カンファレンス実施。退院に向けた環境調整について多職種で検討。訪問看護導入を検討中。", tags: ["全体カンファレンス"], timestamp: "2026/03/05 16:00" },
  { id: "kr8b", date: "2026/03/05", dayOfWeek: "水", category: "看護記録", categoryColor: "#c2410c", author: "山本 看護師", authorRole: "", content: "体温36.3℃、血圧122/78。便通あり。食事全量摂取。水分摂取促す。", tags: ["看護記録"], timestamp: "2026/03/05 09:00" },
  { id: "kr8c", date: "2026/03/05", dayOfWeek: "水", category: "看護記録", categoryColor: "#c2410c", author: "中田 看護師", authorRole: "", content: "夜間不眠の訴えあり。頓服投与（レンドルミン0.25mg）。30分後入眠確認。", tags: [], timestamp: "2026/03/05 23:30" },
  // 3/4 (火)
  { id: "kr9", date: "2026/03/04", dayOfWeek: "火", category: "看護記録", categoryColor: "#c2410c", author: "佐々木 看護師", authorRole: "", content: "作業療法参加。革細工に取り組む。集中力30分程度持続。本人より「楽しい」との発言あり。", tags: ["看護記録"], timestamp: "2026/03/04 14:00" },
  { id: "kr9b", date: "2026/03/04", dayOfWeek: "火", category: "医師記録", categoryColor: "#1e40af", author: "田村 医師", authorRole: "医師D", content: "定期回診。睡眠状況改善傾向。日中活動量も増加。退院目標3月下旬を設定。", tags: [], timestamp: "2026/03/04 10:00" },
  // 3/3 (月)
  { id: "kr10", date: "2026/03/03", dayOfWeek: "月", category: "看護サマリ", categoryColor: "#7c3aed", author: "山本 看護師", authorRole: "", content: "週間看護サマリ。全体的に状態安定。ADL自立度向上傾向。退院支援計画に沿って進行中。家族との面会も良好。", tags: ["看護サマリ", "退院支援"], timestamp: "2026/03/03 16:00" },
  { id: "kr10b", date: "2026/03/03", dayOfWeek: "月", category: "看護記録", categoryColor: "#c2410c", author: "中田 看護師", authorRole: "", content: "午前中散歩（院内庭園）。15分程度歩行。息切れなし。気分転換になった様子。", tags: [], timestamp: "2026/03/03 10:30" },
  // 3/2 (日)
  { id: "kr11", date: "2026/03/02", dayOfWeek: "日", category: "看護記録", categoryColor: "#c2410c", author: "佐々木 看護師", authorRole: "", content: "終日穏やかに過ごす。読書・テレビ鑑賞。他患者との交流あり。食事全量摂取。", tags: [], timestamp: "2026/03/02 20:00" },
  // 3/1 (土)
  { id: "kr12", date: "2026/03/01", dayOfWeek: "土", category: "医師記録", categoryColor: "#1e40af", author: "田村 医師", authorRole: "医師D", content: "月初め評価。GAF 63→65に改善。社会復帰プログラムへの参加を開始予定。", tags: [], timestamp: "2026/03/01 11:00" },
  { id: "kr12b", date: "2026/03/01", dayOfWeek: "土", category: "看護記録", categoryColor: "#c2410c", author: "山本 看護師", authorRole: "", content: "体温36.4℃、血圧130/80。体重72.2kg（前月比-0.3kg）。栄養状態良好。", tags: ["看護記録"], timestamp: "2026/03/01 09:00" },
  { id: "kr12c", date: "2026/03/01", dayOfWeek: "土", category: "看護記録", categoryColor: "#c2410c", author: "中田 看護師", authorRole: "", content: "面会（家族：長男）。退院後の生活について相談。グループホーム見学の予定を確認。", tags: ["退院支援"], timestamp: "2026/03/01 14:00" },
  // 2/28 (金)
  { id: "kr13", date: "2026/02/28", dayOfWeek: "金", category: "看護記録", categoryColor: "#c2410c", author: "佐々木 看護師", authorRole: "", content: "夜間巡回。0時・3時に確認。入眠良好。中途覚醒なし。", tags: [], timestamp: "2026/02/28 03:00" },
  { id: "kr13b", date: "2026/02/28", dayOfWeek: "金", category: "医師記録", categoryColor: "#1e40af", author: "田村 医師", authorRole: "医師D", content: "PSW面談同席。障害年金の申請手続きについて説明。本人・家族ともに了承。", tags: [], orderNumber: "NO.840", timestamp: "2026/02/28 14:00" },
  // 2/27 (木)
  { id: "kr14", date: "2026/02/27", dayOfWeek: "木", category: "看護記録", categoryColor: "#c2410c", author: "山本 看護師", authorRole: "", content: "デイケアプログラム参加（料理教室）。味噌汁を作成。手順の理解良好。他メンバーと協力して調理。", tags: ["看護記録"], timestamp: "2026/02/27 13:00" },
  { id: "kr14b", date: "2026/02/27", dayOfWeek: "木", category: "看護記録", categoryColor: "#c2410c", author: "中田 看護師", authorRole: "", content: "午後、やや不穏の訴え。傾聴対応。20分程度で落ち着く。誘因は不明。", tags: [], timestamp: "2026/02/27 16:00" },
  // 2/26 (水)
  { id: "kr15", date: "2026/02/26", dayOfWeek: "水", category: "医師記録", categoryColor: "#1e40af", author: "田村 医師", authorRole: "医師D", content: "褥瘡カンファレンス。現在褥瘡なし。予防策継続。体位変換は自力で可能。", tags: ["褥瘡カンファレンス"], timestamp: "2026/02/26 15:00" },
  { id: "kr15b", date: "2026/02/26", dayOfWeek: "水", category: "看護記録", categoryColor: "#c2410c", author: "佐々木 看護師", authorRole: "", content: "入浴介助。皮膚状態確認。異常なし。清潔保持良好。爪切り実施。", tags: [], timestamp: "2026/02/26 10:00" },
];

const RECORD_FILTER_TABS = [
  "全体カンファレンス",
  "NSTカンファレンス",
  "褥瘡カンファレンス",
  "臨床記録",
  "行動範囲",
  "外出/外泊",
  "日勤帯記録",
];

const SUB_TABS = [
  "診断名",
  "基本情報",
  "GAF",
  "院外/状・診断書類",
  "ファミリ",
  "クリニカルパス",
  "指示/入室",
];

const ACTION_BUTTONS = [
  { label: "オーダ送信", icon: <Send />, color: "primary" as const },
  { label: "事後入力", icon: <Edit />, color: "primary" as const },
  { label: "看護ケア", icon: <NoteAdd />, color: "secondary" as const },
  { label: "オーダ入力", icon: <Receipt />, color: "info" as const },
  { label: "患者予約", icon: <CalendarMonth />, color: "warning" as const },
  { label: "記事作成", icon: <Edit />, color: "primary" as const },
];

// ===== Components =====

const KarteAlphaPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { selectedPatient, setSelectedPatient, wardMapPatientOrder, navigationSource } = useAppStore();
  const [subTab, setSubTab] = useState(0);
  const [mainTab, setMainTab] = useState(0);

  const patient = selectedPatient || PATIENTS.find((p) => p.id === patientId);

  // ep-03 入退院指示ダイアログ
  const [admissionOrderOpen, setAdmissionOrderOpen] = useState(false);
  const [dischargeOrderOpen, setDischargeOrderOpen] = useState(false);

  // 病棟マップ経由の隣接患者ナビゲーション
  const fromWardMap = navigationSource === 'ward-map' && !!patient && wardMapPatientOrder.includes(patient.id);
  const currentIndex = fromWardMap ? wardMapPatientOrder.indexOf(patient!.id) : -1;
  const prevId = fromWardMap && currentIndex > 0 ? wardMapPatientOrder[currentIndex - 1] : null;
  const nextId = fromWardMap && currentIndex >= 0 && currentIndex < wardMapPatientOrder.length - 1
    ? wardMapPatientOrder[currentIndex + 1]
    : null;
  const goToAdjacent = (targetId: string | null) => {
    if (!targetId) return;
    const target = PATIENTS.find((p) => p.id === targetId);
    if (!target) return;
    setSelectedPatient(target);
    if (target.primaryRecordType === 'nursing-record') {
      navigate('/nursing');
    } else {
      navigate(`/karte-alpha/${targetId}`);
    }
  };

  if (!patient) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography color="text.secondary">患者が見つかりません</Typography>
        <Button onClick={() => navigate("/patients")} sx={{ mt: 2 }}>
          一覧に戻る
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Patient Header - Dense */}
      <PatientHeaderDense patient={patient} />

      <Box sx={{ height: 6 }} />

      {/* Back link + Main Tab Bar */}
      <Box sx={{
        display: 'flex',
        alignItems: 'stretch',
        flexShrink: 0,
      }}>
        <Box
          onClick={() => { setSelectedPatient(null); navigate("/patients"); }}
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.5,
            px: 1.5, cursor: 'pointer',
            bgcolor: '#1e3a5f',
            borderRadius: '4px 0 0 0',
            borderRight: '2px solid rgba(255,255,255,0.4)',
            '&:hover': { bgcolor: '#142b47' },
          }}
        >
          <ArrowBack sx={{ fontSize: 18, color: '#fff' }} />
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
            一覧に戻る
          </Typography>
        </Box>
        {fromWardMap && (
          <Box sx={{
            display: 'flex', alignItems: 'center',
            bgcolor: '#1e3a5f',
            borderRight: '2px solid rgba(255,255,255,0.4)',
          }}>
            <Tooltip title={prevId ? `前の患者: ${PATIENTS.find((p) => p.id === prevId)?.name ?? ''}` : '先頭患者'}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => goToAdjacent(prevId)}
                  disabled={!prevId}
                  sx={{
                    color: '#fff', borderRadius: 0, px: 1,
                    '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' },
                    '&:hover': { bgcolor: '#142b47' },
                  }}
                  aria-label="前の患者"
                >
                  <ArrowBackIosNew sx={{ fontSize: 14 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.85)', px: 0.5 }}>
              {currentIndex + 1}/{wardMapPatientOrder.length}
            </Typography>
            <Tooltip title={nextId ? `次の患者: ${PATIENTS.find((p) => p.id === nextId)?.name ?? ''}` : '末尾患者'}>
              <span>
                <IconButton
                  size="small"
                  onClick={() => goToAdjacent(nextId)}
                  disabled={!nextId}
                  sx={{
                    color: '#fff', borderRadius: 0, px: 1,
                    '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' },
                    '&:hover': { bgcolor: '#142b47' },
                  }}
                  aria-label="次の患者"
                >
                  <ArrowForwardIos sx={{ fontSize: 14 }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
        {[
          { label: 'カルテ', icon: <Description sx={{ fontSize: 16 }} /> },
          { label: '指示状況', icon: <AssignmentTurnedIn sx={{ fontSize: 16 }} /> },
          { label: '指示簿', icon: <ListAlt sx={{ fontSize: 16 }} /> },
          { label: 'フローシート', icon: <ShowChart sx={{ fontSize: 16 }} /> },
          { label: '看護過程', icon: <MedicalServices sx={{ fontSize: 16 }} /> },
          { label: '患者情報', icon: <PersonOutline sx={{ fontSize: 16 }} /> },
          { label: 'スケジュール', icon: <EventNote sx={{ fontSize: 16 }} /> },
        ].map((tab, i) => (
          <Box
            key={tab.label}
            onClick={() => setMainTab(i)}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              py: 0.8,
              cursor: 'pointer',
              bgcolor: mainTab === i ? '#1e3a5f' : '#fff',
              border: '1px solid #1e3a5f',
              borderBottom: mainTab === i ? 'none' : '1px solid #1e3a5f',
              borderRight: 'none',
              '&:last-child': { borderRight: '1px solid #1e3a5f', borderRadius: '0 4px 0 0' },
              '&:hover': { bgcolor: mainTab === i ? '#1e3a5f' : '#e8eef5' },
              transition: 'all 0.15s',
              color: mainTab === i ? '#fff' : '#1e3a5f',
            }}
          >
            {tab.icon}
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'inherit' }}>
              {tab.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Tab content area - visually connected to active tab */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #1e3a5f',
        borderTop: 'none',
        borderRadius: '0 0 6px 6px',
        bgcolor: '#fff',
        minHeight: 0,
        overflow: 'hidden',
      }}>

        {/* Main content - scrollable */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
            minHeight: 0,
            p: 0.5,
          }}
        >
        {/* Tab content by mainTab */}
        {mainTab === 0 && (
          <>
            {/* 生活歴 Timeline */}
            <LifeTimelineCompact />

            {/* 診療情報 */}
            <MedicalInfoDense patient={patient} />

            {/* Sub tabs row */}
            <Paper variant="outlined" sx={{ px: 1 }}>
              <Stack direction="row" spacing={0} sx={{ overflowX: "auto" }}>
                {SUB_TABS.map((tab, i) => (
                  <Chip
                    key={tab}
                    label={tab}
                    variant={subTab === i ? "filled" : "outlined"}
                    color={subTab === i ? "primary" : "default"}
                    onClick={() => setSubTab(i)}
                    sx={{ borderRadius: 1, mr: 0.5, my: 0.5 }}
                  />
                ))}
              </Stack>
            </Paper>

            {/* 診療録 */}
            <MedicalRecordsDense patientId={patient.id} />
          </>
        )}

        {mainTab === 3 && (
          <FlowsheetView patientId={patient.id} />
        )}

        {mainTab === 4 && (
          <PatientCarePlan embedded patientId={patient.id} />
        )}

        {mainTab !== 0 && mainTab !== 3 && mainTab !== 4 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">
              {['カルテ', '指示状況', '指示簿', 'フローシート', '看護過程', '患者情報', 'スケジュール'][mainTab]} - 準備中
            </Typography>
          </Box>
        )}
      </Box>

      {/* Bottom Action Bar */}
      <Paper elevation={2} sx={{ mt: 1, p: 1, borderRadius: 2 }}>
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ flexWrap: "wrap" }}
          useFlexGap
        >
          {ACTION_BUTTONS.map((btn) => (
            <Button
              key={btn.label}
              variant="outlined"
              color={btn.color}
              startIcon={btn.icon}
              size="small"
            >
              {btn.label}
            </Button>
          ))}
          {/* ep-03: 主治医による入退院指示の入口 */}
          <Button
            variant="outlined"
            color="primary"
            startIcon={<LoginOutlined />}
            size="small"
            onClick={() => setAdmissionOrderOpen(true)}
          >
            入院指示
          </Button>
          {/* 退院指示は入院患者のみ表示。Patient.admissionState を参照（未指定は 'inpatient' 扱い） */}
          {(patient.admissionState ?? 'inpatient') === 'inpatient' && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<LogoutOutlined />}
              size="small"
              onClick={() => setDischargeOrderOpen(true)}
            >
              退院指示
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" startIcon={<Print />} size="small">
            印刷
          </Button>
          <Button variant="contained" color="error" size="small">
            終了
          </Button>
        </Stack>
      </Paper>
      </Box>

      <AdmissionOrderDialog
        open={admissionOrderOpen}
        patient={patient}
        onClose={() => setAdmissionOrderOpen(false)}
      />
      <DischargeOrderDialog
        open={dischargeOrderOpen}
        patient={patient}
        onClose={() => setDischargeOrderOpen(false)}
      />
    </Box>
  );
};

// ----- Patient Header Dense -----
function PatientHeaderDense({ patient }: { patient: any }) {
  return (
    <Card sx={{ border: '1px solid #1e3a5f', boxShadow: 'none' }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            label="入院"
            size="small"
            color="error"
            sx={{ fontWeight: 700 }}
          />
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography
                variant="subtitle1"
                color="primary.main"
                sx={{ fontWeight: 700 }}
              >
                {patient.id}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {patient.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {patient.gender === "M" ? "男" : "女"}　{patient.age}歳
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {patient.wardId === "ward1" ? "第１病棟" : "第２病棟"}　
                {patient.roomNumber}号室-{patient.bedLabel}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 0.3 }}>
              <Typography variant="caption" color="primary.main">
                Dr {patient.doctorName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                入院日: {patient.admitDate}
              </Typography>
              {patient.diagnosis && (
                <Typography variant="caption" color="text.secondary">
                  診断: {patient.diagnosis}
                </Typography>
              )}
            </Stack>
          </Box>
          <StatusBadge status={patient.status} />
        </Stack>
      </CardContent>
    </Card>
  );
}

// ----- Collapsible Section Header -----
function SectionHeader({ title, color, open, onToggle }: { title: string; color: string; open: boolean; onToggle: () => void }) {
  return (
    <Box
      onClick={onToggle}
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        bgcolor: color, px: 1.5, py: 0.5, cursor: 'pointer',
        borderRadius: open ? '8px 8px 0 0' : '8px',
        '&:hover': { opacity: 0.9 },
      }}
    >
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
        {title}
      </Typography>
      {open ? <ExpandLess sx={{ color: '#fff', fontSize: 18 }} /> : <ExpandMore sx={{ color: '#fff', fontSize: 18 }} />}
    </Box>
  );
}

// ----- Life Timeline Compact -----
function LifeTimelineCompact() {
  const [open, setOpen] = useState(true);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const rows = [
    {
      label: "治療歴",
      color: "#90caf9",
      activeDays: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
      ],
    },
    {
      label: "(デイケア)",
      color: "#a5d6a7",
      activeDays: [1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29, 31],
    },
    { label: "(訪問看護)", color: "#ce93d8", activeDays: [2, 9, 16, 23, 30] },
    { label: "(学歴・経歴)", color: "#ffcc80", activeDays: [] },
    { label: "(エピソード)", color: "#ef9a9a", activeDays: [5, 12, 19] },
    {
      label: "(生活歴・現病歴)",
      color: "#80cbc4",
      activeDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    },
  ];

  return (
    <Card sx={{ overflow: 'visible', flexShrink: 0 }}>
      <SectionHeader title="生活歴" color="#1e3a5f" open={open} onToggle={() => setOpen(!open)} />
      {open && (
        <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Box sx={{ overflowX: "auto" }}>
            {rows.map((row) => (
              <Stack
                key={row.label}
                direction="row"
                spacing={0}
                alignItems="center"
                sx={{ mb: 0.2 }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    width: 90,
                    flexShrink: 0,
                    color: "text.secondary",
                    fontSize: "0.65rem",
                  }}
                >
                  {row.label}
                </Typography>
                {days.map((d) => (
                  <Box
                    key={d}
                    sx={{
                      width: 16,
                      minWidth: 16,
                      height: 14,
                      bgcolor: row.activeDays.includes(d)
                        ? row.color
                        : "grey.100",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRight: "none",
                      "&:last-child": {
                        borderRight: "1px solid",
                        borderRightColor: "divider",
                      },
                    }}
                  />
                ))}
              </Stack>
            ))}
          </Box>
        </CardContent>
      )}
    </Card>
  );
}

// ----- Medical Info Dense -----
function MedicalInfoDense({ patient }: { patient: any }) {
  const [open, setOpen] = useState(true);
  return (
    <Card sx={{ overflow: 'visible', flexShrink: 0 }}>
      <SectionHeader title="診療情報" color="#1e3a5f" open={open} onToggle={() => setOpen(!open)} />
      {open && (
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Table
          size="small"
          sx={{
            "& td": { py: 0.3, px: 1, fontSize: "0.75rem", border: "none" },
          }}
        >
          <TableBody>
            <TableRow>
              <TableCell
                sx={{ fontWeight: 600, color: "text.secondary", width: 80 }}
              >
                保険情報
              </TableCell>
              <TableCell>
                {MOCK_INSURANCE.type}　有効期限: {MOCK_INSURANCE.validPeriod}
                　保険者番号: {MOCK_INSURANCE.insurerNumber}　
                {MOCK_INSURANCE.copay}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                主病名
              </TableCell>
              <TableCell>
                <Chip
                  label={MOCK_DIAGNOSIS.mainCode}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mr: 0.5, height: 18, fontSize: "0.65rem" }}
                />
                {MOCK_DIAGNOSIS.main}　{MOCK_DIAGNOSIS.mainDate}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                合併症
              </TableCell>
              <TableCell>
                <Chip
                  label={MOCK_DIAGNOSIS.subCode}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 0.5, height: 18, fontSize: "0.65rem" }}
                />
                {MOCK_DIAGNOSIS.sub}　{MOCK_DIAGNOSIS.subDate}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                アレルギー
              </TableCell>
              <TableCell>
                <Typography
                  variant="caption"
                  color="error.main"
                  sx={{ fontWeight: 600 }}
                >
                  {MOCK_ALLERGY.drug.join(" / ")}
                </Typography>
                <Typography
                  variant="caption"
                  color="warning.main"
                  sx={{ ml: 1 }}
                >
                  食物: {MOCK_ALLERGY.food.join(" / ")}
                </Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                責任範囲
              </TableCell>
              <TableCell>{MOCK_STAFF.team}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                ADL/GAF
              </TableCell>
              <TableCell>
                {MOCK_ADL.barthel}　|　GAF {MOCK_ADL.gaf}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                自立度
              </TableCell>
              <TableCell>
                {MOCK_STAFF.independenceLevel}　病棟管理: {MOCK_STAFF.wardMgmt}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      )}
    </Card>
  );
}

// 入退院確定など動的に追加されるカルテ記事のカテゴリ → 色マッピング
const CATEGORY_COLOR_MAP: Record<string, string> = {
  '医師記録':       '#1e40af',
  '看護記録':       '#c2410c',
  '看護サマリ':     '#7c3aed',
  'クリニカルパス': '#8b5cf6',
  '作業療法記録':   '#0891b2',
  '栄養指導記録':   '#16a34a',
  '入退院記録':     '#b91c1c',
};

// ----- Medical Records Dense -----
function MedicalRecordsDense({ patientId }: { patientId: string }) {
  const [filterActive, setFilterActive] = useState("all");
  const [open, setOpen] = useState(true);
  const dynamicRecords = useAppStore((s) => s.dynamicMedicalRecords[patientId] ?? []);

  // 静的 MOCK_RECORDS（KarteRecord 形式） + ストアの動的 MedicalRecord をマージ。
  // 動的レコードは store からは MedicalRecord 型で来るが、表示用 KarteRecord に変換する。
  const groupedRecords: Record<string, KarteRecord[]> = {};
  MOCK_RECORDS.forEach((r) => {
    if (!groupedRecords[r.date]) groupedRecords[r.date] = [];
    groupedRecords[r.date].push(r);
  });
  dynamicRecords.forEach((r) => {
    const dateKey = r.date.replace(/-/g, '/');
    const adapted: KarteRecord = {
      id: r.id,
      date: dateKey,
      dayOfWeek: r.dayOfWeek,
      category: r.category,
      categoryColor: CATEGORY_COLOR_MAP[r.category] ?? '#475569',
      author: r.author,
      authorRole: r.authorRole,
      content: r.content,
      tags: r.tags,
      orderNumber: r.orderNumber,
      timestamp: r.timestamp,
    };
    if (!groupedRecords[dateKey]) groupedRecords[dateKey] = [];
    groupedRecords[dateKey].unshift(adapted); // 新規記事は日内の先頭に
  });

  return (
    <Card
      sx={{ overflow: 'visible', flexShrink: 0, display: "flex", flexDirection: "column" }}
    >
      <SectionHeader title="診療録" color="#1e3a5f" open={open} onToggle={() => setOpen(!open)} />
      {open && (
      <CardContent
        sx={{
          py: 1.5,
          display: "flex",
          flexDirection: "column",
          "&:last-child": { pb: 1.5 },
        }}
      >
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 700, color: "text.secondary" }}
          >
            最近の6日分
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant="text" sx={{ fontSize: "0.65rem" }}>
            最初へ ▲
          </Button>
          <Button size="small" variant="outlined" sx={{ fontSize: "0.65rem" }}>
            続き ▼
          </Button>
        </Stack>

        {/* Filter tabs */}
        <Stack
          direction="row"
          spacing={0.5}
          sx={{ mb: 1, overflowX: "auto", pb: 0.5 }}
        >
          <Chip
            label="最近の6日分"
            size="small"
            color={filterActive === "all" ? "primary" : "default"}
            variant={filterActive === "all" ? "filled" : "outlined"}
            onClick={() => setFilterActive("all")}
            sx={{ fontSize: "0.65rem", height: 22 }}
          />
          <Divider orientation="vertical" flexItem />
          {RECORD_FILTER_TABS.map((tab) => (
            <Chip
              key={tab}
              label={tab}
              size="small"
              variant="outlined"
              onClick={() => setFilterActive(tab)}
              sx={{ fontSize: "0.65rem", height: 22 }}
            />
          ))}
        </Stack>

        {/* Records with date sidebar */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Date navigation sidebar */}
          <Box sx={{ width: 110, flexShrink: 0, overflowY: 'auto', borderRight: '1px solid', borderColor: 'divider', pr: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.6rem', display: 'block', mb: 0.5 }}>
              【最近の9日分を表示】
            </Typography>
            {Object.entries(groupedRecords).map(([date, records]) => {
              const d = date.split('/');
              const dayStr = `${d[2]}日(${records[0].dayOfWeek})`;
              const monthLabel = `${d[0]}年${d[1]}月`;
              const hasDoctor = records.some(r => r.category === '医師記録');
              const hasNursing = records.some(r => r.category === '看護記録' || r.category === '看護サマリ');
              const hasAdmission = records.some(r => r.category === '入退院記録');
              return (
                <Box
                  key={date}
                  onClick={() => {
                    const el = document.getElementById(`record-date-${date.replace(/\//g, '-')}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    py: 0.3, px: 0.5, cursor: 'pointer', borderRadius: 0.5,
                    '&:hover': { bgcolor: '#e3f2fd' },
                  }}
                >
                  <Typography sx={{ fontSize: '0.65rem', color: 'primary.main', fontWeight: 600 }}>※</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.primary', fontWeight: 500 }}>
                    {dayStr}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.2, ml: 'auto' }}>
                    {hasDoctor && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#1e40af' }} />}
                    {hasNursing && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#c2410c' }} />}
                    {hasAdmission && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#b91c1c' }} />}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Records content */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {Object.entries(groupedRecords).map(([date, records], gi) => (
            <Box key={date} id={`record-date-${date.replace(/\//g, '-')}`}>
              {/* Date separator */}
              <Box
                sx={{
                  bgcolor: "grey.50",
                  borderBottom: 1,
                  borderTop: gi > 0 ? 1 : 0,
                  borderColor: "divider",
                  px: 1,
                  py: 0.3,
                  mt: gi > 0 ? 1 : 0,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {date}({records[0].dayOfWeek})
                </Typography>
              </Box>

              {/* Record entries */}
              {records.map((record) => (
                <Box
                  key={record.id}
                  sx={{
                    display: "flex",
                    py: 0.8,
                    px: 1,
                    borderBottom: "1px solid",
                    borderColor: "grey.100",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  {/* Left: time */}
                  <Box sx={{ width: 50, flexShrink: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, fontSize: "0.7rem" }}
                    >
                      {record.timestamp.split(" ")[1]}
                    </Typography>
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1 }}>
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                      sx={{ mb: 0.3 }}
                    >
                      {record.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.6rem",
                            bgcolor:
                              tag === "退院支援"
                                ? "error.light"
                                : tag === "看護師カンファ"
                                  ? "success.light"
                                  : "info.light",
                            color: "#fff",
                          }}
                        />
                      ))}
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, color: record.categoryColor }}
                      >
                        {record.category}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {record.author}
                      </Typography>
                      {record.orderNumber && (
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ ml: "auto" }}
                        >
                          {record.orderNumber}
                        </Typography>
                      )}
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: "0.75rem", whiteSpace: "pre-line" }}
                    >
                      {record.content}
                    </Typography>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mt: 0.3 }}
                    >
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ fontSize: "0.65rem" }}
                      >
                        {record.authorRole && `${record.authorRole}/`}
                        {record.author}　{record.timestamp}
                      </Typography>
                      <Box sx={{ flex: 1 }} />
                      <Tooltip title="いいね">
                        <IconButton size="small" sx={{ p: 0.2 }}>
                          <ThumbUpAltOutlined
                            sx={{ fontSize: 14, color: "text.disabled" }}
                          />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="コメント">
                        <IconButton size="small" sx={{ p: 0.2 }}>
                          <ChatBubbleOutline
                            sx={{ fontSize: 14, color: "text.disabled" }}
                          />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Box>
              ))}
            </Box>
          ))}
          </Box>
        </Box>
      </CardContent>
      )}
    </Card>
  );
}

export default KarteAlphaPage;

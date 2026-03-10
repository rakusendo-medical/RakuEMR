import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
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
  Send,
  Edit,
  NoteAdd,
  Receipt,
  CalendarMonth,
  Print,
  ThumbUpAltOutlined,
  ChatBubbleOutline,
  ExpandMore,
  ExpandLess,
} from "@mui/icons-material";
import { PATIENTS } from "../../data/mockData";
import StatusBadge from "../common/StatusBadge";
import { useAppStore } from "../../stores/useAppStore";

// ===== Color theme for outpatient =====
const THEME = {
  primary: "#2e7d32",       // green main
  primaryDark: "#1b5e20",   // green dark (tab active, headers)
  primaryLight: "#e8f5e9",  // green light (hover)
  headerBg: "#2e7d32",
  border: "#2e7d32",
};

// ===== Mock data for outpatient karte =====

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
  type: "自費 本人",
  insurerNumber: "39999839",
  recordNumber: "00000000",
  copay: "3割",
  validPeriod: "39999999",
};

const MOCK_DIAGNOSIS: KarteDiagnosis = {
  main: "統合失調症",
  mainCode: "F20.9",
  mainDate: "2017/05/06 ～",
  sub: "気管支喘息",
  subCode: "J45.9",
  subDate: "2018/02/08 ～",
};

const MOCK_ALLERGY: KarteAllergy = {
  drug: ["アレルギー性鼻炎[アレルギー性鼻炎]", "喘息入院歴あり", "ウイルス性肝炎X日", "服用禁忌あり"],
  food: ["鶏卵アレルギー[鶏卵]"],
};

const MOCK_RECORDS: KarteRecord[] = [
  // 6/26 (月)
  { id: "or1", date: "2017/06/26", dayOfWeek: "月", category: "精神科D", categoryColor: "#1e40af", author: "田村 医師", authorRole: "医師D", content: "【精神科】□○\n（身長:170.0 cm 体重:65.0 kg）\n血圧値ペン/四肢/HDLコレステロール/TSH/T3(状) アラーゼ定量/DLPAN", tags: [], orderNumber: "NO.858", timestamp: "2017/06/26 17:33:26" },
  { id: "or1b", date: "2017/06/26", dayOfWeek: "月", category: "ディケア(指示)", categoryColor: "#2e7d32", author: "田村 医師", authorRole: "", content: "デイケアプログラム参加指示。週3回（月・水・金）。", tags: ["ディケア(指示)"], timestamp: "2017/06/26 10:00" },
  // 6/25 (日)
  { id: "or2", date: "2017/06/25", dayOfWeek: "日", category: "精神科D", categoryColor: "#1e40af", author: "田村 医師", authorRole: "医師D", content: "【精神科】※①\nデイケアプログラム\n生活リズムの維持・確定", tags: [], timestamp: "2017/06/25 14:00" },
  // 6/24 (土)
  { id: "or3", date: "2017/06/24", dayOfWeek: "土", category: "看護記録", categoryColor: "#c2410c", author: "山本 看護師", authorRole: "", content: "外来受診。表情穏やか。服薬状況確認。主訴なし。次回予約確認済み。", tags: ["看護記録"], timestamp: "2017/06/24 09:30" },
  // 6/21 (水)
  { id: "or4", date: "2017/06/21", dayOfWeek: "水", category: "頓用外来", categoryColor: "#7c3aed", author: "田村 医師", authorRole: "医師D", content: "頓用外来受診。不眠の訴えあり。レンドルミン0.25mg 5回分処方。", tags: ["頓用外来"], orderNumber: "NO.864", timestamp: "2017/06/21 11:00" },
  // 6/18 (日)
  { id: "or5", date: "2017/06/18", dayOfWeek: "日", category: "精神科D", categoryColor: "#1e40af", author: "田村 医師", authorRole: "医師D", content: "（身長:170.0cm\n 体重:65.0kg）\n定期検査結果確認。特に異常なし。現行処方継続。", tags: [], timestamp: "2017/06/18 15:00" },
  // 6/14 (水)
  { id: "or6", date: "2017/06/14", dayOfWeek: "水", category: "看護記録", categoryColor: "#c2410c", author: "佐々木 看護師", authorRole: "", content: "電話相談あり。家族より生活状況の報告。デイケアへの参加意欲あり。", tags: [], timestamp: "2017/06/14 14:30" },
  // 6/10 (土)
  { id: "or7", date: "2017/06/10", dayOfWeek: "土", category: "精神科D", categoryColor: "#1e40af", author: "田村 医師", authorRole: "医師D", content: "定期外来。状態安定。リスパダール2mg 継続。次回1ヶ月後。", tags: [], timestamp: "2017/06/10 10:00" },
  { id: "or7b", date: "2017/06/10", dayOfWeek: "土", category: "検査(指示)", categoryColor: "#0277bd", author: "田村 医師", authorRole: "", content: "血液検査オーダー。CBC、肝機能、腎機能、脂質。", tags: ["検査(指示)"], timestamp: "2017/06/10 10:30" },
  // 6/05 (月)
  { id: "or8", date: "2017/06/05", dayOfWeek: "月", category: "文字オーダ", categoryColor: "#6d4c41", author: "田村 医師", authorRole: "医師D", content: "処方箋送信。リスパダール2mg 1日1回 夕食後 30日分。", tags: [], orderNumber: "NO.870", timestamp: "2017/06/05 09:00" },
  // 6/01 (木)
  { id: "or9", date: "2017/06/01", dayOfWeek: "木", category: "看護記録", categoryColor: "#c2410c", author: "山本 看護師", authorRole: "", content: "デイケア初回参加。グループワークに参加。緊張あるも最後まで参加できた。", tags: ["看護記録"], timestamp: "2017/06/01 13:00" },
  { id: "or9b", date: "2017/06/01", dayOfWeek: "木", category: "精神科D", categoryColor: "#1e40af", author: "田村 医師", authorRole: "医師D", content: "デイケア開始指示。生活リズムの維持・確立を目標とする。", tags: [], timestamp: "2017/06/01 09:00" },
];

const RECORD_FILTER_TABS = [
  "精神病式[薬処]",
  "精神科(精神療法)",
  "脳器・器型型/精神分析療法",
  "精袋/変性蒼患(1)",
  "ファミリ",
  "電話連絡",
  "精本予約(1)",
  "検査",
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
  { label: "オーダ送信", icon: <Send />, color: "success" as const },
  { label: "事後入力", icon: <Edit />, color: "success" as const },
  { label: "Drオーダ", icon: <Receipt />, color: "success" as const },
  { label: "文字オーダ", icon: <NoteAdd />, color: "success" as const },
  { label: "6診療形態", icon: <Receipt />, color: "success" as const },
  { label: "患者予約", icon: <CalendarMonth />, color: "warning" as const },
  { label: "記事作成", icon: <Edit />, color: "success" as const },
];

// ===== Components =====

const OutpatientKartePage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { selectedPatient, setSelectedPatient } = useAppStore();
  const [subTab, setSubTab] = useState(0);
  const [mainTab, setMainTab] = useState(0);

  const patient = selectedPatient || PATIENTS.find((p) => p.id === patientId);

  if (!patient) {
    return (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography color="text.secondary">患者が見つかりません</Typography>
        <Button onClick={() => navigate("/outpatient")} sx={{ mt: 2 }}>
          一覧に戻る
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Patient Header */}
      <OutpatientHeaderDense patient={patient} />

      <Box sx={{ height: 6 }} />

      {/* Back link + Main Tab Bar */}
      <Box sx={{
        display: 'flex',
        alignItems: 'stretch',
        flexShrink: 0,
      }}>
        <Box
          onClick={() => { setSelectedPatient(null); navigate("/outpatient"); }}
          sx={{
            display: 'flex', alignItems: 'center', gap: 0.5,
            px: 1.5, cursor: 'pointer',
            bgcolor: THEME.primaryDark,
            borderRadius: '4px 0 0 0',
            borderRight: '2px solid rgba(255,255,255,0.4)',
            '&:hover': { bgcolor: '#0d3d10' },
          }}
        >
          <ArrowBack sx={{ fontSize: 18, color: '#fff' }} />
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
            一覧に戻る
          </Typography>
        </Box>
        {['カルテ', '指示状況', '指示簿', 'フローシート', '患者情報', 'スケジュール'].map((label, i) => (
          <Box
            key={label}
            onClick={() => setMainTab(i)}
            sx={{
              flex: 1,
              textAlign: 'center',
              py: 0.8,
              cursor: 'pointer',
              bgcolor: mainTab === i ? THEME.primary : '#fff',
              border: `1px solid ${THEME.border}`,
              borderBottom: mainTab === i ? 'none' : `1px solid ${THEME.border}`,
              borderRight: 'none',
              '&:last-child': { borderRight: `1px solid ${THEME.border}`, borderRadius: '0 4px 0 0' },
              '&:hover': { bgcolor: mainTab === i ? THEME.primary : THEME.primaryLight },
              transition: 'all 0.15s',
            }}
          >
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: mainTab === i ? '#fff' : THEME.primary }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Tab content area */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${THEME.border}`,
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
        {/* 生活歴 Timeline */}
        <OutpatientLifeTimeline />

        {/* 診療情報 */}
        <OutpatientMedicalInfo />

        {/* 指示簿 */}
        <OutpatientOrderBook />

        {/* Sub tabs row */}
        <Paper variant="outlined" sx={{ px: 1 }}>
          <Stack direction="row" spacing={0} sx={{ overflowX: "auto" }}>
            {SUB_TABS.map((tab, i) => (
              <Chip
                key={tab}
                label={tab}
                variant={subTab === i ? "filled" : "outlined"}
                color={subTab === i ? "success" : "default"}
                onClick={() => setSubTab(i)}
                sx={{ borderRadius: 1, mr: 0.5, my: 0.5 }}
              />
            ))}
          </Stack>
        </Paper>

        {/* 診療録 */}
        <OutpatientRecords />
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
          <Box sx={{ flex: 1 }} />
          <Button variant="outlined" startIcon={<Print />} size="small" color="success">
            印刷
          </Button>
          <Button variant="contained" color="error" size="small">
            終了
          </Button>
        </Stack>
      </Paper>
      </Box>
    </Box>
  );
};

// ----- Outpatient Header Dense -----
function OutpatientHeaderDense({ patient }: { patient: any }) {
  return (
    <Card sx={{ border: `1px solid ${THEME.border}`, boxShadow: 'none' }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            label="外来"
            size="small"
            sx={{ fontWeight: 700, bgcolor: THEME.primary, color: '#fff' }}
          />
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 700, color: THEME.primary }}
              >
                {patient.id}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {patient.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {patient.gender === "M" ? "男" : "女"}　{patient.age}歳
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 0.3 }}>
              <Typography variant="caption" sx={{ color: THEME.primary }}>
                Dr {patient.doctorName}
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
function OutpatientSectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <Box
      onClick={onToggle}
      sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        bgcolor: THEME.primary, px: 1.5, py: 0.5, cursor: 'pointer',
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

// ----- Life Timeline -----
function OutpatientLifeTimeline() {
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
      <OutpatientSectionHeader title="生活歴" open={open} onToggle={() => setOpen(!open)} />
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
                      bgcolor: row.activeDays.includes(d) ? row.color : "grey.100",
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

// ----- Medical Info -----
function OutpatientMedicalInfo() {
  const [open, setOpen] = useState(true);
  return (
    <Card sx={{ overflow: 'visible', flexShrink: 0 }}>
      <OutpatientSectionHeader title="診療情報" open={open} onToggle={() => setOpen(!open)} />
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
              <TableCell sx={{ fontWeight: 600, color: "text.secondary", width: 80 }}>
                保険情報
              </TableCell>
              <TableCell>
                {MOCK_INSURANCE.type}　有効期限: {MOCK_INSURANCE.validPeriod}
                　保険者番号: {MOCK_INSURANCE.insurerNumber}　記号番号: {MOCK_INSURANCE.recordNumber}
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
                  color="success"
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
                <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
                  {MOCK_ALLERGY.drug.join(" / ")}
                </Typography>
                <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>
                  食物: {MOCK_ALLERGY.food.join(" / ")}
                </Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                食物アレルギー
              </TableCell>
              <TableCell>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  セラチア, もち
                </Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: "text.secondary" }}>
                その他注記
              </TableCell>
              <TableCell>
                特記すべき主要事項
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      )}
    </Card>
  );
}

// ----- Order Book (指示簿) -----
interface OrderEntry {
  id: string;
  status: "待ち" | "継続" | "完了";
  statusColor: string;
  orderDate: string;
  orderType: string;
  content: string;
  department: string;
  doctor: string;
  orderSource: string;
  acceptDate: string;
  nextDate: string;
  cancelled: boolean;
}

const MOCK_ORDERS_OUTPATIENT: OrderEntry[] = [
  {
    id: "OO1", status: "待ち", statusColor: "#e53935", orderDate: "2014/08/21",
    orderType: "臨時", content: "アミノルバン 200mL　1瓶\n【向】10%フェノバール 1mL　1管\n点滴注射 1回",
    department: "内科", doctor: "医師 太郎", orderSource: "処置室注射", acceptDate: "", nextDate: "2014/08/21", cancelled: true,
  },
  {
    id: "OO2", status: "継続", statusColor: "#1e88e5", orderDate: "2014/08/19",
    orderType: "定期", content: "デイケア",
    department: "内科", doctor: "医師 太郎", orderSource: "デイケア", acceptDate: "", nextDate: "2014/08/21", cancelled: false,
  },
  {
    id: "OO3", status: "継続", statusColor: "#1e88e5", orderDate: "2014/08/21",
    orderType: "定期", content: "訪問看護",
    department: "", doctor: "医師 太郎", orderSource: "訪問看護", acceptDate: "", nextDate: "[未定]", cancelled: false,
  },
  {
    id: "OO4", status: "待ち", statusColor: "#e53935", orderDate: "2014/08/21",
    orderType: "臨時", content: "（身長：157.0 cm（体重：46.0 kg）\n2014/08/21(木)\n【食事糖負荷試験(血糖)】\n血糖 食前(糖負荷)/血糖 食後120分(糖負荷)/---\n【食事糖負荷試験(尿)】\n尿糖 食前(糖負荷)/---",
    department: "内科", doctor: "医師 太郎", orderSource: "院外尿検査", acceptDate: "", nextDate: "2014/08/21", cancelled: true,
  },
];

function OutpatientOrderBook() {
  const [open, setOpen] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);

  return (
    <Card sx={{ overflow: 'visible', flexShrink: 0 }}>
      <OutpatientSectionHeader title="指示簿" open={open} onToggle={() => setOpen(!open)} />
      {open && (
      <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="flex-end" sx={{ mb: 0.5 }}>
          <Chip
            label={showCompleted ? "実施済みオーダを非表示" : "実施済みオーダを表示"}
            size="small"
            variant="outlined"
            onClick={() => setShowCompleted(!showCompleted)}
            sx={{ fontSize: "0.65rem", height: 22 }}
          />
        </Stack>

        {/* Table Header */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '70px 50px 1fr 50px 100px 80px 90px 40px',
          bgcolor: '#e8f5e9',
          borderBottom: '2px solid #2e7d32',
          px: 0.5,
          py: 0.3,
          gap: 0.5,
        }}>
          {['', '指示日', 'オーダ', '内容', '科', '伝票(指示医)', '指示受け', '次回実施日', '中止'].map((h) => (
            <Typography key={h} sx={{ fontSize: '0.65rem', fontWeight: 700, color: 'text.secondary' }}>
              {h}
            </Typography>
          ))}
        </Box>

        {/* Order Rows */}
        {MOCK_ORDERS_OUTPATIENT.map((order) => (
          <Box
            key={order.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: '70px 50px 1fr 50px 100px 80px 90px 40px',
              borderBottom: '1px solid',
              borderColor: 'divider',
              px: 0.5,
              py: 0.5,
              gap: 0.5,
              '&:hover': { bgcolor: '#f1f8e9' },
            }}
          >
            {/* Status + Date */}
            <Box>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: order.statusColor }}>
                {order.status}
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                {order.orderDate}
              </Typography>
            </Box>

            {/* Order Type */}
            <Box>
              <Chip
                label={order.orderType}
                size="small"
                sx={{
                  height: 18, fontSize: '0.6rem', fontWeight: 700,
                  bgcolor: order.orderType === '定期' ? '#1e88e5' : '#ff9800',
                  color: '#fff',
                }}
              />
            </Box>

            {/* Content */}
            <Box>
              <Typography sx={{ fontSize: '0.7rem', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                {order.content}
              </Typography>
            </Box>

            {/* Department */}
            <Typography sx={{ fontSize: '0.7rem' }}>
              {order.department}
            </Typography>

            {/* Doctor + Source */}
            <Box>
              <Typography sx={{ fontSize: '0.7rem' }}>
                {order.orderSource}
              </Typography>
              <Typography sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                ({order.doctor})
              </Typography>
            </Box>

            {/* Accept Date */}
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
              {order.acceptDate || '—'}
            </Typography>

            {/* Next Date */}
            <Typography sx={{ fontSize: '0.7rem' }}>
              {order.nextDate}
            </Typography>

            {/* Cancel */}
            <Box sx={{ textAlign: 'center' }}>
              {order.cancelled && (
                <Typography sx={{ fontSize: '1rem', color: '#e53935' }}>⊘</Typography>
              )}
              {!order.cancelled && (
                <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>-</Typography>
              )}
            </Box>
          </Box>
        ))}
      </CardContent>
      )}
    </Card>
  );
}

// ----- Medical Records -----
function OutpatientRecords() {
  const [filterActive, setFilterActive] = useState("all");
  const [open, setOpen] = useState(true);

  const groupedRecords: Record<string, KarteRecord[]> = {};
  MOCK_RECORDS.forEach((r) => {
    if (!groupedRecords[r.date]) groupedRecords[r.date] = [];
    groupedRecords[r.date].push(r);
  });

  return (
    <Card sx={{ overflow: 'visible', flexShrink: 0, display: "flex", flexDirection: "column" }}>
      <OutpatientSectionHeader title="診療録" open={open} onToggle={() => setOpen(!open)} />
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
          <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
            最近の9日分を表示
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant="text" color="success" sx={{ fontSize: "0.65rem" }}>
            最初へ ▲
          </Button>
          <Button size="small" variant="outlined" color="success" sx={{ fontSize: "0.65rem" }}>
            続き ▼
          </Button>
        </Stack>

        {/* Filter tabs */}
        <Stack direction="row" spacing={0.5} sx={{ mb: 1, overflowX: "auto", pb: 0.5 }}>
          <Chip
            label="最近の9日分"
            size="small"
            color={filterActive === "all" ? "success" : "default"}
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
              const hasDoctor = records.some(r => r.category.includes('精神科') || r.category.includes('文字オーダ'));
              const hasNursing = records.some(r => r.category === '看護記録');
              const hasOrder = records.some(r => r.category.includes('指示') || r.category.includes('検査'));
              return (
                <Box
                  key={date}
                  onClick={() => {
                    const el = document.getElementById(`outpatient-record-${date.replace(/\//g, '-')}`);
                    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    py: 0.3, px: 0.5, cursor: 'pointer', borderRadius: 0.5,
                    '&:hover': { bgcolor: THEME.primaryLight },
                  }}
                >
                  <Typography sx={{ fontSize: '0.65rem', color: THEME.primary, fontWeight: 600 }}>※</Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'text.primary', fontWeight: 500 }}>
                    {dayStr}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.2, ml: 'auto' }}>
                    {hasDoctor && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#1e40af' }} />}
                    {hasNursing && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#c2410c' }} />}
                    {hasOrder && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: THEME.primary }} />}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Records content */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {Object.entries(groupedRecords).map(([date, records], gi) => (
            <Box key={date} id={`outpatient-record-${date.replace(/\//g, '-')}`}>
              {/* Date separator */}
              <Box
                sx={{
                  bgcolor: "#f1f8e9",
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
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.7rem" }}>
                      {record.timestamp.split(" ")[1]}
                    </Typography>
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.3 }}>
                      {record.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: "0.6rem",
                            bgcolor: tag.includes("ディケア") ? "success.light"
                              : tag.includes("検査") ? "info.light"
                              : tag.includes("頓用") ? "warning.light"
                              : "info.light",
                            color: "#fff",
                          }}
                        />
                      ))}
                      <Typography variant="caption" sx={{ fontWeight: 700, color: record.categoryColor }}>
                        {record.category}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {record.author}
                      </Typography>
                      {record.orderNumber && (
                        <Typography variant="caption" color="text.disabled" sx={{ ml: "auto" }}>
                          {record.orderNumber}
                        </Typography>
                      )}
                    </Stack>
                    <Typography variant="body2" sx={{ fontSize: "0.75rem", whiteSpace: "pre-line" }}>
                      {record.content}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.3 }}>
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: "0.65rem" }}>
                        {record.authorRole && `${record.authorRole}/`}
                        {record.author}　{record.timestamp}
                      </Typography>
                      <Box sx={{ flex: 1 }} />
                      <Tooltip title="いいね">
                        <IconButton size="small" sx={{ p: 0.2 }}>
                          <ThumbUpAltOutlined sx={{ fontSize: 14, color: "text.disabled" }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="コメント">
                        <IconButton size="small" sx={{ p: 0.2 }}>
                          <ChatBubbleOutline sx={{ fontSize: 14, color: "text.disabled" }} />
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

export default OutpatientKartePage;

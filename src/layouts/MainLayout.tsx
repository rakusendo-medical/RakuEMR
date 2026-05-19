import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Snackbar,
  Alert,
  Divider,
  Tooltip,
  Collapse,
  Stack,
} from "@mui/material";
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalHospital,
  People,
  MeetingRoom,
  Search,
  Groups,
  Assessment,
  Lock,
  Home,
  Receipt,
  FitnessCenter,
  FolderOpen,
  Business,
  PersonAdd,
  Palette,
  AssignmentTurnedIn,
  EventNote,
  VpnKey as VpnKeyIcon,
  Logout as LogoutIcon,
  ArticleOutlined,
  MonitorHeart,
  Bedtime,
  EditNote,
} from "@mui/icons-material";
import { Assignment } from "@mui/icons-material";
import { useAppStore } from "../stores/useAppStore";
import { EPICS } from "../components/epicReview/epicData";

const DRAWER_WIDTH = 220;
const DRAWER_COLLAPSED = 60;

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactElement;
  path: string;
}

interface NavSection {
  key: string;
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    key: "bed",
    label: "病床管理",
    items: [
      { key: "ward-map", label: "病棟マップ", icon: <LocalHospital />, path: "/" },
      { key: "patient-list", label: "入院患者一覧", icon: <People />, path: "/patients" },
      { key: "outpatient", label: "外来一覧", icon: <Groups />, path: "/outpatient" },
      { key: "patient-search", label: "患者検索", icon: <Search />, path: "/patient-search" },
      { key: "admission", label: "入退院管理", icon: <MeetingRoom />, path: "/admission" },
      { key: "ward-mgmt", label: "病棟管理", icon: <Business />, path: "/ward-management" },
      { key: "documents", label: "書類管理", icon: <FolderOpen />, path: "/documents" },
      { key: "orders", label: "オーダ管理", icon: <Receipt />, path: "/orders" },
    ],
  },
  {
    key: "nursing",
    label: "看護",
    items: [
      { key: "nursing-records", label: "部門記録簿", icon: <ArticleOutlined />, path: "/nursing/records" },
      { key: "bulk-vitals", label: "一括バイタル", icon: <MonitorHeart />, path: "/nursing/bulk-vitals" },
      { key: "sleep-table", label: "睡眠表", icon: <Bedtime />, path: "/nursing/sleep-table" },
      { key: "bulk-records", label: "一括看護経過記録", icon: <EditNote />, path: "/nursing/bulk-records" },
      { key: "care-plan", label: "看護過程", icon: <EventNote />, path: "/care-plan" },
    ],
  },
  {
    key: "common",
    label: "共通・運用",
    items: [
      { key: "isolation", label: "隔離拘束", icon: <Lock />, path: "/isolation" },
      { key: "behavior", label: "行動範囲", icon: <Lock />, path: "/behavior" },
      { key: "outing", label: "外出外泊", icon: <Home />, path: "/outing" },
    ],
  },
  {
    key: "dev",
    label: "開発",
    items: [
      { key: "design-guide", label: "デザインガイド", icon: <Palette />, path: "/design-guide" },
    ],
  },
  {
    key: "epic-review",
    label: "エピック評価",
    items: EPICS.map((e) => ({
      key: `epic-${e.id}`,
      label: `${e.id} ${e.title}`,
      icon: <Assignment />,
      path: `/epic-review/${e.id}`,
    })),
  },
];

const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen, toggleSidebar, snackbar, hideSnackbar } = useAppStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  // 折りたたみ可能なセクション(現在はエピック評価のみ)。初期値は閉じた状態。
  // ただし現在閲覧中のパスが該当セクションのアイテムなら自動で開く。
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    'epic-review': !location.pathname.startsWith('/epic-review'),
  });
  const isCollapsible = (key: string) => key === 'epic-review';
  const toggleSection = (key: string) =>
    setCollapsedSections((s) => ({ ...s, [key]: !s[key] }));

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentNav = NAV_ITEMS.find((item) => {
    if (item.path === "/") return location.pathname === "/";
    return location.pathname.startsWith(item.path);
  });

  const drawerWidth = sidebarOpen ? DRAWER_WIDTH : DRAWER_COLLAPSED;

  return (
    <Box sx={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#0f172a",
            color: "#e2e8f0",
            transition: "width 0.2s ease",
            overflowX: "hidden",
          },
        }}
      >
        {/* Logo */}
        {sidebarOpen ? (
          <Box sx={{ p: "12px 16px", borderBottom: "1px solid #1e293b" }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box
                component="img"
                src="https://rakusendo-hp.jp/shared/images/logo-s.png"
                alt="楽仙堂病院"
                sx={{ height: 32, width: "auto", borderRadius: "4px" }}
              />
              <IconButton
                onClick={toggleSidebar}
                size="small"
                sx={{ color: "#64748b", mt: -0.5, mr: -0.5 }}
              >
                <ChevronLeftIcon />
              </IconButton>
            </Box>
            <Typography
              variant="subtitle1"
              sx={{
                color: "#fff",
                fontWeight: 800,
                letterSpacing: "0.05em",
                fontSize: "0.875rem",
                lineHeight: 1.2,
                mt: 1,
              }}
            >
              RakuEMR
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#64748b", fontSize: "0.625rem" }}
            >
              🌿 先生がちょっと楽になる電子カルテ
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              py: 1.5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
              borderBottom: "1px solid #1e293b",
            }}
          >
            <Box
              component="img"
              src="https://rakusendo-hp.jp/favicon.gif"
              alt="楽仙堂病院"
              sx={{ height: 28, width: 28, borderRadius: "4px" }}
            />
            <IconButton
              onClick={toggleSidebar}
              size="small"
              sx={{ color: "#64748b" }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        {/* Logon Info */}
        {sidebarOpen ? (
          <Box sx={{ px: 1.5, py: 1, borderBottom: "1px solid #1e293b" }}>
            <Box
              sx={{
                border: "1px solid #334155",
                borderRadius: 1,
                px: 1.5,
                py: 1,
                bgcolor: "#1e293b",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.625rem",
                  color: "#64748b",
                  mb: 0.5,
                  fontWeight: 600,
                }}
              >
                【ログオン情報】
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  sx={{ fontSize: "0.8125rem", color: "#fff", fontWeight: 700 }}
                >
                  医師 太郎
                </Typography>
                <Box sx={{ display: "flex", gap: 0.25 }}>
                  <Tooltip title="パスワード変更">
                    <IconButton
                      size="small"
                      sx={{
                        color: "#94a3b8",
                        p: 0.25,
                        "&:hover": { color: "#fff" },
                      }}
                    >
                      <VpnKeyIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="ログアウト">
                    <IconButton
                      size="small"
                      sx={{
                        color: "#94a3b8",
                        p: 0.25,
                        "&:hover": { color: "#ef4444" },
                      }}
                    >
                      <LogoutIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Typography sx={{ fontSize: "0.6875rem", color: "#94a3b8" }}>
                精神科
              </Typography>
            </Box>
          </Box>
        ) : (
          <Tooltip title="医師 太郎 / 精神科" placement="right">
            <Box
              sx={{
                py: 1,
                display: "flex",
                justifyContent: "center",
                borderBottom: "1px solid #1e293b",
              }}
            >
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: "#1e3a5f",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                }}
              >
                医
              </Avatar>
            </Box>
          </Tooltip>
        )}

        {/* Nav Items */}
        <List sx={{ flex: 1, overflowY: "auto", py: 1 }} component="nav">
          {NAV_SECTIONS.map((section, sectionIndex) => {
            const collapsible = isCollapsible(section.key);
            const collapsed = collapsedSections[section.key] ?? false;
            const renderItem = (item: NavItem) => {
              const isActive = currentNav?.key === item.key;
              return (
                <Tooltip
                  key={item.key}
                  title={sidebarOpen ? "" : item.label}
                  placement="right"
                >
                  <ListItemButton
                    onClick={() => navigate(item.path)}
                    sx={{
                      minHeight: 38,
                      px: sidebarOpen ? 2 : 1.5,
                      justifyContent: sidebarOpen ? "flex-start" : "center",
                      bgcolor: isActive ? "#1e3a5f" : "transparent",
                      borderLeft: isActive
                        ? "3px solid #3b82f6"
                        : "3px solid transparent",
                      color: isActive ? "#fff" : "#94a3b8",
                      "&:hover": { bgcolor: "#1e293b" },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: "inherit",
                        minWidth: sidebarOpen ? 36 : "auto",
                        justifyContent: "center",
                      }}
                    >
                      {React.cloneElement(item.icon, { fontSize: "small" })}
                    </ListItemIcon>
                    {sidebarOpen && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontSize: "0.8125rem",
                          noWrap: true,
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              );
            };

            return (
              <React.Fragment key={section.key}>
                {sidebarOpen ? (
                  collapsible ? (
                    // 折りたたみ可能セクション: subheader をクリック可能なボタンに
                    <ListItemButton
                      onClick={() => toggleSection(section.key)}
                      sx={{
                        py: 0,
                        px: 2,
                        mt: sectionIndex === 0 ? 0 : 1.25,
                        bgcolor: "transparent",
                        "&:hover": { bgcolor: "#1e293b" },
                      }}
                    >
                      <ListItemText
                        primary={section.label}
                        primaryTypographyProps={{
                          color: "#64748b",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          lineHeight: 1.6,
                        }}
                      />
                      {collapsed
                        ? <ExpandMoreIcon sx={{ color: "#64748b", fontSize: 18 }} />
                        : <ExpandLessIcon sx={{ color: "#64748b", fontSize: 18 }} />}
                    </ListItemButton>
                  ) : (
                    <ListSubheader
                      component="div"
                      disableSticky
                      sx={{
                        bgcolor: "transparent",
                        color: "#64748b",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        lineHeight: 1.6,
                        px: 2,
                        mt: sectionIndex === 0 ? 0 : 1.25,
                      }}
                    >
                      {section.label}
                    </ListSubheader>
                  )
                ) : (
                  sectionIndex > 0 && (
                    <Divider
                      sx={{ borderColor: "#1e293b", my: 0.75, mx: 1 }}
                    />
                  )
                )}
                {collapsible && sidebarOpen ? (
                  <Collapse in={!collapsed} timeout="auto" unmountOnExit>
                    {section.items.map(renderItem)}
                  </Collapse>
                ) : (
                  // 折りたたみ時は子アイテムを表示しない(サイドバー閉じている時は常に表示)
                  (!collapsible || !sidebarOpen) && section.items.map(renderItem)
                )}
              </React.Fragment>
            );
          })}
        </List>
        {/* コピーライト */}
        <Box
          sx={{
            px: sidebarOpen ? 2 : 1,
            py: 1,
            borderTop: "1px solid #1e293b",
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              color: "#64748b",
              fontSize: sidebarOpen ? "0.625rem" : "0.55rem",
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {sidebarOpen ? "© 2026 AMTC, Inc." : "© AMTC"}
          </Typography>
        </Box>
      </Drawer>

      {/* Main Area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top Bar */}
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Toolbar
            variant="dense"
            sx={{ justifyContent: "space-between", minHeight: 48 }}
          >
            <Typography variant="h6" color="text.primary">
              {currentNav?.label || "電子カルテ"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {/* シリーズ製品ランチャー(Raku シリーズ共通ヘッダー) */}
              <Stack direction="row" spacing={0.75} alignItems="center">
                {[
                  {
                    key: "works",
                    short: "W",
                    label: "RakuWorks",
                    desc: "勤怠管理",
                    bg: "#1f2937",
                    bgHover: "#111827",
                  },
                  {
                    key: "yoyaku",
                    short: "Y",
                    label: "RakuYOYAKU",
                    desc: "外来予約",
                    bg: "#2563eb",
                    bgHover: "#1d4ed8",
                  },
                  {
                    key: "wallet",
                    short: "$",
                    label: "RakuWallet",
                    desc: "預り金管理",
                    bg: "#b45309",
                    bgHover: "#92400e",
                  },
                ].map((app) => (
                  <Tooltip
                    key={app.key}
                    title={
                      <Box sx={{ textAlign: "center" }}>
                        <Box sx={{ fontWeight: 700 }}>{app.label}</Box>
                        <Box sx={{ fontSize: "0.7rem", opacity: 0.85 }}>{app.desc}</Box>
                      </Box>
                    }
                    arrow
                  >
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        // モック: シリーズ製品起動 - 実運用では別アプリへ遷移
                        // eslint-disable-next-line no-alert
                        alert(`${app.label} を起動(モック)`);
                      }}
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: app.bg,
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        transition: "background-color 0.15s",
                        userSelect: "none",
                        "&:hover": { bgcolor: app.bgHover },
                      }}
                    >
                      {app.short}
                    </Box>
                  </Tooltip>
                ))}
              </Stack>
              <Divider orientation="vertical" flexItem />
              <Typography variant="caption" color="text.secondary">
                {currentTime.toLocaleDateString("ja-JP")}{" "}
                {currentTime.toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: 1.5,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={hideSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MainLayout;

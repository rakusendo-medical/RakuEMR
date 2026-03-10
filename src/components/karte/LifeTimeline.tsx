import { Box, Typography, Button } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";

const days = Array.from({ length: 31 }, (_, i) => i + 1);

export default function LifeTimeline() {
  return (
    <Box
      sx={{
        border: "1px solid #ccc",
        bgcolor: "#fff",
        mb: 0.5,
      }}
    >
      {/* Section Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          bgcolor: "#e8eef5",
          px: 1,
          py: 0.3,
          borderBottom: "1px solid #ddd",
        }}
      >
        <Typography sx={{ fontSize: "11px", fontWeight: 700 }}>
          生活歴
        </Typography>
        <SettingsIcon sx={{ fontSize: 14, ml: 0.5, color: "#999" }} />
      </Box>

      {/* Timeline grid */}
      <Box sx={{ overflowX: "auto", px: 1, py: 5 }}>
        {/* Day numbers row */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.3 }}>
          <Box sx={{ width: 70, flexShrink: 0 }} />
          {days.map((d) => (
            <Box
              key={d}
              sx={{
                width: 20,
                minWidth: 20,
                textAlign: "center",
                fontSize: "9px",
                color: "#666",
              }}
            >
              {d}
            </Box>
          ))}
        </Box>

        {/* 治療歴 row */}
        <TimelineRow
          label="治療歴"
          sublabel=""
          color="#90caf9"
          activeDays={[
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
            20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
          ]}
        />

        {/* デイケア row */}
        <TimelineRow
          label="(デイケア)"
          sublabel=""
          color="#a5d6a7"
          activeDays={[1, 3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29, 31]}
        />

        {/* 訪問看護 row */}
        <TimelineRow
          label="(訪問看護)"
          sublabel=""
          color="#ce93d8"
          activeDays={[2, 9, 16, 23, 30]}
        />

        {/* 学歴・経歴 row */}
        <TimelineRow
          label="(学歴・経歴)"
          sublabel=""
          color="#ffcc80"
          activeDays={[]}
        />

        {/* エピソード row */}
        <TimelineRow
          label="(エピソード)"
          sublabel=""
          color="#ef9a9a"
          activeDays={[5, 12, 19]}
        />

        {/* 生活歴・現病歴 row */}
        <TimelineRow
          label="(生活歴・現病歴)"
          sublabel=""
          color="#80cbc4"
          activeDays={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]}
        />
      </Box>

      {/* Bottom controls */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1,
          py: 0.3,
          borderTop: "1px solid #eee",
          gap: 1,
        }}
      >
        <Typography sx={{ fontSize: "10px", color: "#666" }}>
          生活歴・環境歴
        </Typography>
        <Button size="small" sx={{ fontSize: "10px", minHeight: 18 }}>
          【全体表示】
        </Button>
        <Typography sx={{ fontSize: "10px", color: "#999" }}>
          0 歳 ～ 44 歳
        </Typography>
        <Typography sx={{ fontSize: "10px", color: "#999", ml: "auto" }}>
          表示
        </Typography>
      </Box>
    </Box>
  );
}

function TimelineRow({
  label,
  sublabel,
  color,
  activeDays,
}: {
  label: string;
  sublabel: string;
  color: string;
  activeDays: number[];
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 0.2 }}>
      <Box sx={{ width: 70, flexShrink: 0 }}>
        <Typography sx={{ fontSize: "10px", lineHeight: 1.2 }}>
          {label}
        </Typography>
        {sublabel && (
          <Typography sx={{ fontSize: "9px", color: "#888", lineHeight: 1 }}>
            {sublabel}
          </Typography>
        )}
      </Box>
      {days.map((d) => (
        <Box
          key={d}
          sx={{
            width: 20,
            minWidth: 20,
            height: 14,
            bgcolor: activeDays.includes(d) ? color : "#f5f5f5",
            border: "1px solid #e0e0e0",
            borderRight: "none",
            "&:last-child": { borderRight: "1px solid #e0e0e0" },
          }}
        />
      ))}
    </Box>
  );
}

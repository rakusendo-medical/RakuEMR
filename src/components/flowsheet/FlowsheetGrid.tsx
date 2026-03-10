import { Box, Typography } from '@mui/material';
import {
  flowsheetDays,
  mealRecords,
  excretionRecords,
  bathRecords,
  nurseStaffRecords,
  observationRows,
} from '../../data/flowsheetMockData';

export default function FlowsheetGrid() {
  return (
    <Box sx={{ border: '1px solid #ccc', bgcolor: '#fff', overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '10px',
        }}
      >
        <tbody>
          {/* 予定オーダ row */}
          <GridSection label="予定オーダ" bgcolor="#e3f2fd">
            {flowsheetDays.map((day) => (
              <GridCell key={day.date}>
                <Typography sx={{ fontSize: '9px', color: '#1565c0' }}>
                  {day.hospitalDay > 516 ? '沐/浴' : ''}
                </Typography>
              </GridCell>
            ))}
          </GridSection>

          {/* 臨時処方 row */}
          <GridSection label="臨時処方" bgcolor="#fff3e0">
            {flowsheetDays.map((day) => (
              <GridCell key={day.date}>
                <Typography sx={{ fontSize: '9px', color: '#e65100' }}>
                  {day.dayOfWeek === '月' ? '生理' : day.dayOfWeek === '水' ? '検査' : ''}
                </Typography>
              </GridCell>
            ))}
          </GridSection>

          {/* 食事 section */}
          <GridSection label="食" bgcolor="#f3e5f5" rowSpan={3}>
            {mealRecords.map((m) => (
              <GridCell key={m.date}>
                <Typography sx={{ fontSize: '9px' }}>{m.breakfast}</Typography>
              </GridCell>
            ))}
          </GridSection>

          <tr>
            <td
              style={{
                padding: '2px 4px',
                borderBottom: '1px solid #eee',
                borderRight: '1px solid #ddd',
                backgroundColor: '#fafafa',
                fontSize: '9px',
                width: 70,
              }}
            >
              朝/昼/夕
            </td>
            {mealRecords.map((m) => (
              <td
                key={m.date}
                style={{
                  textAlign: 'center',
                  borderBottom: '1px solid #eee',
                  borderRight: '1px solid #eee',
                  padding: '1px',
                  fontSize: '9px',
                }}
              >
                {m.breakfast}/{m.lunch}/{m.dinner}
              </td>
            ))}
          </tr>

          {/* 行動BMI row */}
          <GridSection label="行動BMI" bgcolor="#e8f5e9">
            {flowsheetDays.map((day, i) => (
              <GridCell key={day.date}>
                <Typography sx={{ fontSize: '9px' }}>
                  {i === 0 ? '63.1(21.1)' : i === 1 ? '51.2(31.8)' : ''}
                </Typography>
              </GridCell>
            ))}
          </GridSection>

          {/* 排泄 section */}
          <GridSection label="排" bgcolor="#fff8e1">
            {excretionRecords.map((e) => (
              <GridCell key={e.date}>
                <Typography sx={{ fontSize: '9px' }}>
                  {e.urine}
                </Typography>
              </GridCell>
            ))}
          </GridSection>

          <tr>
            <td
              style={{
                padding: '2px 4px',
                borderBottom: '1px solid #eee',
                borderRight: '1px solid #ddd',
                backgroundColor: '#fafafa',
                fontSize: '9px',
                width: 70,
              }}
            >
              尿/便
            </td>
            {excretionRecords.map((e) => (
              <td
                key={e.date}
                style={{
                  textAlign: 'center',
                  borderBottom: '1px solid #eee',
                  borderRight: '1px solid #eee',
                  padding: '1px',
                  fontSize: '9px',
                }}
              >
                {e.urine}/{e.stool}
              </td>
            ))}
          </tr>

          {/* 便回数 row */}
          <GridSection label="便回数" bgcolor="#fafafa">
            {flowsheetDays.map((day) => (
              <GridCell key={day.date}>
                <Typography sx={{ fontSize: '9px' }}>
                  {['金', '日', '火'].includes(day.dayOfWeek) ? '3/1' : '3/3'}
                </Typography>
              </GridCell>
            ))}
          </GridSection>

          {/* 担当 section */}
          <GridSection label="担当" bgcolor="#e0f7fa">
            {nurseStaffRecords.map((n) => (
              <GridCell key={n.date}>
                <Box>
                  {n.dayShift.map((s, i) => (
                    <Typography key={i} sx={{ fontSize: '8px', color: '#00695c' }}>
                      {s}
                    </Typography>
                  ))}
                </Box>
              </GridCell>
            ))}
          </GridSection>

          <tr>
            <td
              style={{
                padding: '2px 4px',
                borderBottom: '1px solid #eee',
                borderRight: '1px solid #ddd',
                backgroundColor: '#fafafa',
                fontSize: '9px',
                width: 70,
              }}
            >
              夜勤
            </td>
            {nurseStaffRecords.map((n) => (
              <td
                key={n.date}
                style={{
                  textAlign: 'center',
                  borderBottom: '1px solid #eee',
                  borderRight: '1px solid #eee',
                  padding: '1px',
                  fontSize: '8px',
                  color: '#5d4037',
                }}
              >
                {n.nightShift.join(', ')}
              </td>
            ))}
          </tr>

          {/* Observation rows */}
          {observationRows.map((row) => (
            <GridSection key={row.label} label={row.label} bgcolor="#fafafa">
              {row.values.map((val, i) => (
                <GridCell key={i}>
                  <Typography sx={{ fontSize: '9px' }}>{val}</Typography>
                </GridCell>
              ))}
            </GridSection>
          ))}

          {/* 入浴 row */}
          <GridSection label="入浴" bgcolor="#e8eaf6">
            {bathRecords.map((b) => (
              <GridCell key={b.date}>
                <Typography sx={{ fontSize: '9px', color: '#283593' }}>
                  {b.type}
                </Typography>
              </GridCell>
            ))}
          </GridSection>
        </tbody>
      </table>
    </Box>
  );
}

function GridSection({
  label,
  bgcolor,
  children,
  rowSpan,
}: {
  label: string;
  bgcolor: string;
  children: React.ReactNode;
  rowSpan?: number;
}) {
  return (
    <tr>
      <td
        rowSpan={rowSpan}
        style={{
          padding: '2px 4px',
          borderBottom: '1px solid #ddd',
          borderRight: '1px solid #ddd',
          backgroundColor: bgcolor,
          fontWeight: 600,
          fontSize: '10px',
          width: 70,
          verticalAlign: 'top',
        }}
      >
        {label}
      </td>
      {children}
    </tr>
  );
}

function GridCell({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        textAlign: 'center',
        borderBottom: '1px solid #eee',
        borderRight: '1px solid #eee',
        padding: '2px 4px',
        verticalAlign: 'middle',
      }}
    >
      {children}
    </td>
  );
}

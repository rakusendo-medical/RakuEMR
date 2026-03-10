import { Box, Typography, Button, Chip } from '@mui/material';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { medicalRecords, recordFilterTabs } from '../../data/mockData';
import type { MedicalRecord, RecordCategory } from '../../types';

const categoryColor: Record<RecordCategory, string> = {
  医師記録: '#1565c0',
  看護記録: '#e65100',
  看護サマリ: '#6a1b9a',
  クリニカルパス: '#2e7d32',
  作業療法記録: '#00838f',
  栄養指導記録: '#f57f17',
  入退院記録: '#c62828',
};

export default function MedicalRecords() {
  return (
    <Box
      sx={{
        border: '1px solid #ccc',
        bgcolor: '#fff',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
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
          gap: 1,
        }}
      >
        <Typography sx={{ fontSize: '11px', fontWeight: 700 }}>
          診療録 ─ 最近の6日分
        </Typography>
        <Button size="small" sx={{ fontSize: '9px', minHeight: 18 }}>
          最初へ ▲
        </Button>
        <Typography sx={{ fontSize: '10px', color: '#999' }}>▼</Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
          <Button
            size="small"
            variant="outlined"
            sx={{ fontSize: '9px', minHeight: 18, px: 0.8 }}
          >
            続き
          </Button>
        </Box>
      </Box>

      {/* Filter tabs */}
      <Box
        sx={{
          display: 'flex',
          borderBottom: '1px solid #eee',
          px: 0.5,
          py: 0.2,
          gap: 0,
          bgcolor: '#fafafa',
          flexWrap: 'wrap',
        }}
      >
        <FilterChip label="最近の6日分を表示" active />
        <Box sx={{ borderRight: '1px solid #ddd', mx: 0.5 }} />
        {recordFilterTabs.map((tab) => (
          <FilterChip key={tab} label={tab} />
        ))}
      </Box>

      {/* Records list */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 0.5, py: 0.5 }}>
        {medicalRecords.map((record) => (
          <RecordEntry key={record.id} record={record} />
        ))}
      </Box>
    </Box>
  );
}

function FilterChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <Box
      sx={{
        px: 0.8,
        py: 0.2,
        fontSize: '9px',
        cursor: 'pointer',
        color: active ? '#1565c0' : '#666',
        fontWeight: active ? 600 : 400,
        borderRight: '1px solid #eee',
        '&:hover': { bgcolor: '#e3f2fd' },
      }}
    >
      {label}
    </Box>
  );
}

function RecordEntry({ record }: { record: MedicalRecord }) {
  const color = categoryColor[record.category] || '#333';

  return (
    <Box
      sx={{
        display: 'flex',
        borderBottom: '1px solid #f0f0f0',
        py: 0.5,
        '&:hover': { bgcolor: '#f8f9fa' },
      }}
    >
      {/* Date column */}
      <Box
        sx={{
          width: 70,
          flexShrink: 0,
          pr: 0.5,
          borderRight: '2px solid #e0e0e0',
        }}
      >
        <Typography sx={{ fontSize: '10px', fontWeight: 600 }}>
          {record.date.slice(8)}日({record.dayOfWeek})
        </Typography>
      </Box>

      {/* Content column */}
      <Box sx={{ flex: 1, pl: 1 }}>
        {/* Category + meta row */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
          {record.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                height: 16,
                fontSize: '9px',
                bgcolor:
                  tag === '退院支援'
                    ? '#ffcdd2'
                    : tag === '看護師カンファ'
                      ? '#c8e6c9'
                      : '#e3f2fd',
                color: '#333',
              }}
            />
          ))}
          <Typography
            sx={{
              fontSize: '10px',
              color,
              fontWeight: 600,
            }}
          >
            {record.category}
          </Typography>
          <Typography sx={{ fontSize: '10px', color: '#666' }}>
            {record.author}
          </Typography>
          {record.orderNumber && (
            <Typography
              sx={{ fontSize: '10px', color: '#999', ml: 'auto' }}
            >
              {record.orderNumber}
            </Typography>
          )}
        </Box>

        {/* Content */}
        {record.content && (
          <Typography
            sx={{
              fontSize: '11px',
              whiteSpace: 'pre-line',
              color: '#333',
              pl: 0.5,
            }}
          >
            {record.content}
          </Typography>
        )}

        {/* Footer: timestamp + actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 0.3,
          }}
        >
          {record.timestamp && (
            <Typography sx={{ fontSize: '9px', color: '#999' }}>
              {record.authorRole && `${record.authorRole}/`}
              {record.author}　{record.timestamp}
            </Typography>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, ml: 'auto' }}>
            <ThumbUpAltOutlinedIcon sx={{ fontSize: 12, color: '#bbb' }} />
            <Typography sx={{ fontSize: '9px', color: '#bbb' }}>
              いいね
            </Typography>
            <ChatBubbleOutlineIcon
              sx={{ fontSize: 12, color: '#bbb', ml: 0.5 }}
            />
            <Typography sx={{ fontSize: '9px', color: '#bbb' }}>
              コメントする
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

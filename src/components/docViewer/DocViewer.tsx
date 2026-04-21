import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Box, Paper, Tab, Tabs, Typography,
} from '@mui/material';
import { ArticleOutlined as ArticleIcon } from '@mui/icons-material';
import nursingCarePlanDoc from '../../../docs/nursing_care_plan_user_stories.md?raw';
import wireframeDoc from '../../../docs/claude_code_wireframe_prompt.md?raw';

const DOCS = [
  { label: '看護計画 ユーザーストーリー', content: nursingCarePlanDoc },
  { label: 'ワイヤーフレームプロンプト', content: wireframeDoc },
];

const DocViewer: React.FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <ArticleIcon color="primary" />
        <Typography variant="h6">ドキュメント</Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        {DOCS.map((d, i) => (
          <Tab key={i} label={d.label} />
        ))}
      </Tabs>

      <Paper variant="outlined" sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, mt: 1, pb: 1, borderBottom: '2px solid', borderColor: 'primary.main' }}>
                {children}
              </Typography>
            ),
            h2: ({ children }) => (
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, mt: 3, pb: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                {children}
              </Typography>
            ),
            h3: ({ children }) => (
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, mt: 2, color: 'primary.dark' }}>
                {children}
              </Typography>
            ),
            p: ({ children }) => (
              <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.8 }}>
                {children}
              </Typography>
            ),
            li: ({ children }) => (
              <Typography component="li" variant="body2" sx={{ mb: 0.5, lineHeight: 1.8 }}>
                {children}
              </Typography>
            ),
            ul: ({ children }) => (
              <Box component="ul" sx={{ pl: 3, mb: 1.5 }}>{children}</Box>
            ),
            ol: ({ children }) => (
              <Box component="ol" sx={{ pl: 3, mb: 1.5 }}>{children}</Box>
            ),
            code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
              inline ? (
                <Box component="code" sx={{ bgcolor: '#f1f5f9', px: 0.75, py: 0.25, borderRadius: 0.5, fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                  {children}
                </Box>
              ) : (
                <Box component="pre" sx={{ bgcolor: '#1e293b', color: '#e2e8f0', p: 2, borderRadius: 1, overflow: 'auto', mb: 1.5, fontSize: '0.8125rem', fontFamily: 'monospace', lineHeight: 1.6 }}>
                  <code>{children}</code>
                </Box>
              ),
            table: ({ children }) => (
              <Box sx={{ overflowX: 'auto', mb: 2 }}>
                <Box component="table" sx={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.8125rem' }}>
                  {children}
                </Box>
              </Box>
            ),
            thead: ({ children }) => (
              <Box component="thead" sx={{ bgcolor: '#f8fafc' }}>{children}</Box>
            ),
            th: ({ children }) => (
              <Box component="th" sx={{ border: '1px solid #e2e8f0', px: 1.5, py: 1, fontWeight: 700, textAlign: 'left' }}>
                {children}
              </Box>
            ),
            td: ({ children }) => (
              <Box component="td" sx={{ border: '1px solid #e2e8f0', px: 1.5, py: 0.75 }}>
                {children}
              </Box>
            ),
            hr: () => <Box component="hr" sx={{ border: 'none', borderTop: '1px solid', borderColor: 'divider', my: 2 }} />,
            strong: ({ children }) => (
              <Box component="strong" sx={{ fontWeight: 700 }}>{children}</Box>
            ),
            blockquote: ({ children }) => (
              <Box sx={{ borderLeft: '4px solid', borderColor: 'primary.light', pl: 2, py: 0.5, my: 1.5, color: 'text.secondary', bgcolor: '#f8fafc' }}>
                {children}
              </Box>
            ),
          }}
        >
          {DOCS[tab].content}
        </ReactMarkdown>
      </Paper>
    </Box>
  );
};

export default DocViewer;

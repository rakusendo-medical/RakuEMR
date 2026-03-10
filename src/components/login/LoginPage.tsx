import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, TextField, Button, Typography, Avatar, InputAdornment,
  IconButton, FormControlLabel, Checkbox, Divider, Select, MenuItem,
  FormControl, InputLabel,
} from '@mui/material';
import {
  Visibility, VisibilityOff, Person, Lock, LocalHospital,
} from '@mui/icons-material';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [ward, setWard] = useState('');
  const [remember, setRemember] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.08)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -150,
          left: -100,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.05)',
        }}
      />

      <Paper
        elevation={24}
        sx={{
          width: '100%',
          maxWidth: 420,
          mx: 2,
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: '#0f172a',
            py: 4,
            px: 3,
            textAlign: 'center',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box
              component="img"
              src="https://rakusendo-hp.jp/shared/images/logo-s.png"
              alt="楽仙堂病院"
              sx={{
                height: 56,
                width: 'auto',
                borderRadius: '8px',
              }}
            />
          </Box>
          <Typography
            variant="h6"
            sx={{
              color: '#fff',
              fontWeight: 800,
              letterSpacing: '0.1em',
              fontSize: '1.1rem',
            }}
          >
            楽仙堂病院
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: '#64748b',
              mt: 0.5,
              fontSize: '0.75rem',
              letterSpacing: '0.05em',
            }}
          >
            電子カルテシステム
          </Typography>
        </Box>

        {/* Form */}
        <Box
          component="form"
          onSubmit={handleLogin}
          sx={{ p: 4 }}
        >
          <TextField
            fullWidth
            label="ユーザーID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="例: nurse001"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: '#94a3b8', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2.5 }}
          />

          <TextField
            fullWidth
            label="パスワード"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock sx={{ color: '#94a3b8', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2.5 }}
          />

          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <InputLabel>所属病棟</InputLabel>
            <Select
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              label="所属病棟"
              startAdornment={
                <InputAdornment position="start">
                  <LocalHospital sx={{ color: '#94a3b8', fontSize: 20 }} />
                </InputAdornment>
              }
            >
              <MenuItem value="ward1">第1病棟</MenuItem>
              <MenuItem value="ward2">第2病棟</MenuItem>
              <MenuItem value="outpatient">外来</MenuItem>
              <MenuItem value="rehab">リハビリテーション科</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
              }
              label={<Typography variant="body2" sx={{ fontSize: '0.8rem' }}>ログイン状態を保持</Typography>}
            />
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.75rem',
                color: 'primary.main',
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              パスワードを忘れた場合
            </Typography>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{
              py: 1.5,
              fontSize: '0.9375rem',
              fontWeight: 700,
              borderRadius: 2,
              textTransform: 'none',
              bgcolor: '#1e40af',
              '&:hover': { bgcolor: '#1e3a8a' },
            }}
          >
            ログイン
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
              デモ用アカウント
            </Typography>
          </Divider>

          <Box sx={{ bgcolor: '#f8fafc', borderRadius: 2, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: '#3b82f6', fontSize: '0.7rem' }}>看</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>看護師</Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>nurse001 / demo1234</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: '#059669', fontSize: '0.7rem' }}>医</Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>医師</Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>doctor001 / demo1234</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ px: 4, pb: 3, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.65rem' }}>
            &copy; 2026 楽仙堂病院 電子カルテシステム v0.1.0
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;

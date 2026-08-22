import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { getErrorMessage } from '../../shared/api/http'
import { useAuth } from '../../shared/auth/useAuth'
import heroImg from '../../assets/hero.png'
import { LoginIcon } from '../../shared/ui/AppIcons'
import { SpotlightSurface } from '../../shared/ui/Motion'

export function LoginPage() {
  const { session, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/" replace />

  const signupMessage = (location.state as { message?: string } | null)?.message

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 450px' }, bgcolor: '#0b1220' }}>
      <Box
        className="auth-visual"
        sx={{
          minHeight: { xs: 280, md: '100vh' },
          display: 'flex',
          alignItems: 'flex-end',
          p: { xs: 3, md: 6 },
          color: 'white',
          position: 'relative',
          background: `url(${heroImg}) center/cover no-repeat`,
        }}
      >
        <Box className="auth-content" sx={{ maxWidth: 680 }}>
          <Typography variant="overline" sx={{ fontWeight: 900, color: 'rgba(255,255,255,0.72)' }}>
            RentSphere
          </Typography>
          <Typography variant="h4" sx={{ mt: 0.5 }}>
            Smart property and rental management, made clear.
          </Typography>
          <Typography sx={{ mt: 1, color: 'rgba(255,255,255,0.78)', maxWidth: 560 }}>
            Manage properties, units, tenants, invoices, complaints, approvals, and rental operations from one clean workspace.
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', p: { xs: 2.5, md: 4 }, bgcolor: 'background.default' }}>
        <SpotlightSurface className="auth-card">
        <Card sx={{ width: '100%', overflow: 'hidden', bgcolor: 'rgba(255,255,255,.86)' }}>
          <Box sx={{ height: 5, bgcolor: 'primary.main' }} />
          <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
            <Stack component="form" spacing={2.25} onSubmit={handleSubmit}>
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 900 }}>Sign in</Typography>
                <Typography variant="h4">Welcome back</Typography>
                <Typography color="text.secondary">Use your admin, owner, or tenant account to continue.</Typography>
              </Box>
              {signupMessage && <Alert severity="success">{signupMessage}</Alert>}
              {error && <Alert severity="error">{error}</Alert>}
              <TextField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <TextField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <Button type="submit" variant="contained" size="large" startIcon={<LoginIcon />} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
              <Button component={Link} to="/signup" variant="text">
                New here? Create an account
              </Button>
            </Stack>
          </CardContent>
        </Card>
        </SpotlightSurface>
      </Box>
    </Box>
  )
}

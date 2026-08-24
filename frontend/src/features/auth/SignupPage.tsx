import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { getErrorMessage, http } from '../../shared/api/http'
import { useAuth } from '../../shared/auth/useAuth'
import { AddIcon } from '../../shared/ui/AppIcons'
import heroImg from '../../assets/hero.png'
import type { UserRole } from '../../shared/auth/types'
import { SpotlightSurface } from '../../shared/ui/Motion'

type SignupForm = {
  name: string
  email: string
  password: string
  phone: string
  organizationId: string
  role: UserRole
}

const initialForm: SignupForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  organizationId: '',
  role: 'TENANT',
}

export function SignupPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<SignupForm>(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await http.post('/auth/register', {
        ...form,
        organizationId: form.organizationId || null,
      })
      navigate('/login', {
        replace: true,
        state: { message: 'Account created. Sign in with your new credentials.' },
      })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 460px' }, bgcolor: '#0f172a' }}>
      <Box
        className="auth-visual"
        sx={{
          minHeight: { xs: 240, md: '100vh' },
          display: 'flex',
          alignItems: 'flex-end',
          p: { xs: 3, md: 6 },
          color: 'white',
          position: 'relative',
          background: `url(${heroImg}) center/cover no-repeat`,
        }}
      >
        <Box className="auth-content" sx={{ maxWidth: 680 }}>
          <Typography variant="overline" sx={{ fontWeight: 900 }}>RentSphere</Typography>
          <Typography variant="h3" sx={{ mb: 1, fontWeight: 900, letterSpacing: 0 }}>
            Create your RentSphere account.
          </Typography>
          <Typography color="#cbd5e1">
            Create a tenant account to browse apartments, pay invoices and manage your requests. Owner accounts are provisioned by your administrator.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', p: 4, bgcolor: 'background.default' }}>
        <SpotlightSurface className="auth-card">
        <Card sx={{ width: '100%', bgcolor: 'rgba(255,255,255,.86)' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack component="form" spacing={2} onSubmit={handleSubmit}>
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 900 }}>Sign up</Typography>
                <Typography variant="h4">Create account</Typography>
              </Box>
              {error && <Alert severity="error">{error}</Alert>}
              <TextField label="Name" value={form.name} required onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <TextField label="Email" type="email" value={form.email} required onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <TextField label="Password" type="password" value={form.password} required onChange={(event) => setForm({ ...form, password: event.target.value })} />
              <TextField label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              <TextField select label="Role" value={form.role} required onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}>
                <MenuItem value="TENANT">TENANT</MenuItem>
              </TextField>
              <Button type="submit" variant="contained" size="large" startIcon={<AddIcon />} disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
              <Button component={Link} to="/login" variant="text">
                Already have an account? Sign in
              </Button>
            </Stack>
          </CardContent>
        </Card>
        </SpotlightSurface>
      </Box>
    </Box>
  )
}

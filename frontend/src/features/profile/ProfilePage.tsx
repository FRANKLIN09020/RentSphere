import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { getErrorMessage, http } from '../../shared/api/http'
import { formatRole, getEmailInitials, getRoleColor } from '../../shared/utils/format'
import { KeyIcon, ProfileIcon, SaveIcon } from '../../shared/ui/AppIcons'

type UserProfile = {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  organizationId?: string
  createdAt?: string
}

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [profileForm, setProfileForm] = useState({ name: '', phone: '' })
  const [profileMessage, setProfileMessage] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' })
  const [passwordMessage, setPasswordMessage] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await http.get<UserProfile>('/auth/me')
      setProfile(response.data)
      setProfileForm({ name: response.data.name ?? '', phone: response.data.phone ?? '' })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadProfile])

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault()
    setProfileMessage('')
    setSavingProfile(true)
    try {
      const response = await http.put<UserProfile>('/auth/me', profileForm)
      setProfile(response.data)
      setProfileForm({ name: response.data.name ?? '', phone: response.data.phone ?? '' })
      setProfileMessage('Profile updated successfully.')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault()
    setPasswordMessage('')
    setSavingPassword(true)
    try {
      await http.post('/auth/change-password', passwordForm)
      setPasswordForm({ currentPassword: '', newPassword: '' })
      setPasswordMessage('Password changed successfully.')
    } catch (err) {
      setPasswordMessage('')
      setError(getErrorMessage(err))
    } finally {
      setSavingPassword(false)
    }
  }

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : null

  return (
    <Box component="section" sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1080 }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 900 }}>Account</Typography>
          <Typography variant="h4">My profile</Typography>
          <Typography color="text.secondary">View your account details, edit your profile, and manage your password.</Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {loading && <LinearProgress />}

        {profile && (
          <Card sx={{ overflow: 'hidden' }}>
            <Box sx={{ height: 4, bgcolor: 'primary.main' }} />
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ alignItems: { sm: 'center' } }}>
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: 'primary.dark',
                    fontSize: 26,
                    fontWeight: 900,
                    borderRadius: 3,
                  }}
                >
                  {getEmailInitials(profile.email)}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant="h5" sx={{ fontWeight: 850 }}>{profile.name}</Typography>
                    <Chip size="small" color={getRoleColor(profile.role)} label={formatRole(profile.role)} />
                  </Stack>
                  <Typography color="text.secondary">{profile.email}</Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 0.75, flexWrap: 'wrap', color: 'text.secondary' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {profile.phone || 'No phone on file'}
                    </Typography>
                    {profile.organizationId && (
                      <Typography variant="body2" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 280 }}>
                        Org: {profile.organizationId}
                      </Typography>
                    )}
                    {memberSince && <Typography variant="body2" sx={{ fontWeight: 700 }}>Member since {memberSince}</Typography>}
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ overflow: 'hidden', height: '100%' }}>
              <Box sx={{ height: 4, bgcolor: 'primary.main' }} />
              <CardContent>
                <Stack component="form" spacing={2} onSubmit={handleProfileSubmit}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                    <ProfileIcon sx={{ color: 'primary.main' }} />
                    <Box>
                      <Typography variant="h6">Edit profile</Typography>
                      <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>Update your display name and phone number.</Typography>
                    </Box>
                  </Stack>
                  {profileMessage && <Alert severity="success">{profileMessage}</Alert>}
                  <TextField
                    label="Full name"
                    value={profileForm.name}
                    required
                    onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })}
                  />
                  <TextField
                    label="Phone"
                    value={profileForm.phone}
                    onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })}
                  />
                  <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={savingProfile}>
                    {savingProfile ? 'Saving...' : 'Save profile'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ overflow: 'hidden', height: '100%' }}>
              <Box sx={{ height: 4, bgcolor: 'warning.main' }} />
              <CardContent>
                <Stack component="form" spacing={2} onSubmit={handlePasswordSubmit}>
                  <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                    <KeyIcon sx={{ color: 'warning.main' }} />
                    <Box>
                      <Typography variant="h6">Change password</Typography>
                      <Typography color="text.secondary" sx={{ fontSize: '0.8rem' }}>Use at least 8 characters for the new password.</Typography>
                    </Box>
                  </Stack>
                  {passwordMessage && <Alert severity="success">{passwordMessage}</Alert>}
                  <TextField
                    type="password"
                    label="Current password"
                    value={passwordForm.currentPassword}
                    required
                    onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                  />
                  <TextField
                    type="password"
                    label="New password"
                    value={passwordForm.newPassword}
                    required
                    onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                  />
                  <Button type="submit" variant="contained" color="warning" startIcon={<KeyIcon />} disabled={savingPassword}>
                    {savingPassword ? 'Changing...' : 'Change password'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {profile && (
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 900 }}>Session</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Signed in as {profile.email} · {formatRole(profile.role)} · Account ID {profile.id}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" color="text.secondary">
                Tip: the AI assistant (bottom right) can answer questions about your account, leases, invoices, and policies.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  )
}
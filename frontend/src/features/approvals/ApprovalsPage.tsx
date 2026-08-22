import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { getErrorMessage, http } from '../../shared/api/http'
import { AddIcon, CancelIcon, CheckIcon, RefreshIcon } from '../../shared/ui/AppIcons'
import { useAuth } from '../../shared/auth/useAuth'

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

type ApprovalRequest = {
  id: string
  organizationId?: string
  type: string
  subject: string
  details?: string
  requesterEmail: string
  approverEmail: string
  status: ApprovalStatus
  decisionComment?: string
  decidedAt?: string
}

const APPROVAL_TYPES = ['APARTMENT_VISIT', 'RENTAL_AGREEMENT', 'MAINTENANCE_WORK', 'DEPOSIT_REFUND', 'RENT_INCREASE', 'OTHER']

type CreateForm = {
  type: string
  subject: string
  details: string
  requesterEmail: string
  approverEmail: string
}

const initialCreateForm: CreateForm = {
  type: 'RENTAL_AGREEMENT',
  subject: '',
  details: '',
  requesterEmail: '',
  approverEmail: '',
}

export function ApprovalsPage() {
  const { session } = useAuth()
  const isTenant = session?.role === 'TENANT'
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [createForm, setCreateForm] = useState<CreateForm>(initialCreateForm)
  const [createMessage, setCreateMessage] = useState('')
  const [creating, setCreating] = useState(false)

  const loadApprovals = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await http.get<ApprovalRequest[]>('/approvals', {
        params: status ? { status } : undefined,
      })
      setApprovals(response.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadApprovals()
    }, 0)
    const interval = window.setInterval(() => {
      void loadApprovals()
    }, 10000)
    return () => {
      window.clearTimeout(timer)
      window.clearInterval(interval)
    }
  }, [loadApprovals])

  async function decide(id: string, action: 'approve' | 'reject') {
    try {
      await http.post(`/approvals/${id}/${action}`, { comment })
      setComment('')
      await loadApprovals()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleCreateSubmit(event: FormEvent) {
    event.preventDefault()
    setCreateMessage('')
    setCreating(true)
    try {
      await http.post('/approvals', {
        type: createForm.type,
        subject: createForm.subject,
        details: createForm.details || null,
        requesterEmail: createForm.requesterEmail,
        approverEmail: createForm.approverEmail,
      })
      setCreateMessage('Approval request created and the approver has been notified.')
      setCreateForm(initialCreateForm)
      await loadApprovals()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <Box component="section" sx={{ p: { xs: 2.5, md: 3.5 }, maxWidth: 1440 }}>
      <Stack spacing={0.75} sx={{ mb: 2.5 }}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 900 }}>Approvals</Typography>
        <Typography variant="h4">{isTenant ? 'Approval status' : 'Approval workflow'}</Typography>
        <Typography color="text.secondary">
          {isTenant
            ? 'View the status of your approval requests. You can see whether each request has been approved or rejected.'
            : 'Create requests, notify approvers, and approve or reject with comments.'}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
      </Stack>

      <Grid container spacing={2}>
          {!isTenant && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Stack component="form" spacing={2} onSubmit={handleCreateSubmit}>
                  <Box>
                    <Typography variant="h6">Create approval request</Typography>
                    <Typography color="text.secondary">Send a new request to an approver. An email notification is sent when SMTP is enabled.</Typography>
                  </Box>
                  {createMessage && <Alert severity="success">{createMessage}</Alert>}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        select
                        label="Type"
                        value={createForm.type}
                        onChange={(event) => setCreateForm({ ...createForm, type: event.target.value })}
                      >
                        {APPROVAL_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>{type.replace(/_/g, ' ')}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        label="Requester email"
                        type="email"
                        value={createForm.requesterEmail}
                        required
                        onChange={(event) => setCreateForm({ ...createForm, requesterEmail: event.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        label="Approver email"
                        type="email"
                        value={createForm.approverEmail}
                        required
                        onChange={(event) => setCreateForm({ ...createForm, approverEmail: event.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <TextField
                        label="Subject"
                        value={createForm.subject}
                        required
                        onChange={(event) => setCreateForm({ ...createForm, subject: event.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Details"
                        value={createForm.details}
                        multiline
                        minRows={3}
                        onChange={(event) => setCreateForm({ ...createForm, details: event.target.value })}
                      />
                    </Grid>
                  </Grid>
                  <Stack direction="row" spacing={1}>
                    <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={creating}>
                      {creating ? 'Creating...' : 'Create request'}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      disabled={creating}
                      onClick={() => {
                        setCreateForm(initialCreateForm)
                        setCreateMessage('')
                      }}
                    >
                      Clear
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}
          <Grid size={{ xs: 12, lg: 12 }}>
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6">Requests</Typography>
                    <Typography color="text.secondary">{loading ? 'Loading...' : `${approvals.length} loaded`}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <TextField select label="Status" value={status} sx={{ minWidth: 150 }} onChange={(event) => setStatus(event.target.value)}>
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="PENDING">Pending</MenuItem>
                      <MenuItem value="APPROVED">Approved</MenuItem>
                      <MenuItem value="REJECTED">Rejected</MenuItem>
                    </TextField>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadApprovals}>Refresh</Button>
                  </Stack>
                </Stack>
                {!isTenant && <TextField label="Decision comment" value={comment} onChange={(event) => setComment(event.target.value)} />}
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Subject</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        {isTenant ? <TableCell>Decision</TableCell> : <TableCell>Requester</TableCell>}
                        {isTenant ? <TableCell>Decided at</TableCell> : <TableCell align="right">Actions</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {approvals.map((approval) => (
                        <TableRow key={approval.id} hover>
                          <TableCell>{approval.subject}</TableCell>
                          <TableCell>{approval.type}</TableCell>
                          <TableCell><StatusChip status={approval.status} /></TableCell>
                          {isTenant ? (
                            <TableCell>{approval.decisionComment ?? '-'}</TableCell>
                          ) : (
                            <TableCell>{approval.requesterEmail}</TableCell>
                          )}
                          {isTenant ? (
                            <TableCell>{approval.decidedAt ? new Date(approval.decidedAt).toLocaleString() : '-'}</TableCell>
                          ) : (
                            <TableCell align="right">
                              <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                                <Button
                                  size="small"
                                  color="success"
                                  startIcon={<CheckIcon />}
                                  disabled={approval.status !== 'PENDING'}
                                  onClick={() => decide(approval.id, 'approve')}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  startIcon={<CancelIcon />}
                                  disabled={approval.status !== 'PENDING'}
                                  onClick={() => decide(approval.id, 'reject')}
                                >
                                  Reject
                                </Button>
                              </Stack>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                      {!approvals.length && (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <Typography color="text.secondary">No approvals found</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

function StatusChip({ status }: { status: ApprovalStatus }) {
  const color = status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'error' : 'warning'
  return <Chip size="small" color={color} label={status} />
}

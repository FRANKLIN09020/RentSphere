import { useCallback, useEffect, useState } from 'react'
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
  TablePagination,
  TextField,
  Typography,
} from '@mui/material'
import { getErrorMessage, http } from '../../shared/api/http'
import { CancelIcon, CheckIcon, RefreshIcon } from '../../shared/ui/AppIcons'
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

export function ApprovalsPage() {
  const { session } = useAuth()
  const isTenant = session?.role === 'TENANT'
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([])
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const pagedApprovals = approvals.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

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

  return (
    <Box component="section" sx={{ p: { xs: 2.5, md: 3.5 }, maxWidth: 1440 }}>
      {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

      <Grid container spacing={2}>
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
                    <TextField select label="Status" value={status} sx={{ minWidth: 150 }} onChange={(event) => { setStatus(event.target.value); setPage(0) }}>
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
                      {pagedApprovals.map((approval) => (
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
                {approvals.length > 0 && <TablePagination component="div" count={approvals.length} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[5, 10, 20, 50]} onPageChange={(_, nextPage) => setPage(nextPage)} onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0) }} />}
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

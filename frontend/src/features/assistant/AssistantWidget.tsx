import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Fab,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useAuth } from '../../shared/auth/useAuth'
import { http } from '../../shared/api/http'
import { RiRobot3Fill } from 'react-icons/ri'
import { CloseIcon, DeleteIcon, HelpIcon, SendIcon, UploadIcon } from '../../shared/ui/AppIcons'

GlobalWorkerOptions.workerSrc = pdfWorkerUrl

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type KnowledgeEntry = {
  id: string
  title: string
  source: string
  text: string
  uploadedAt: string
}

const STORAGE_KEY = 'rental-assistant-knowledge'
const BUILTIN_DOCS = [
  { title: 'Lease basics', path: '/docs/lease-basics.pdf' },
  { title: 'Maintenance policy', path: '/docs/maintenance-guide.pdf' },
  { title: 'Rent & payment policy', path: '/docs/rental-policy.pdf' },
  { title: 'Security deposits guide', path: '/docs/security-deposits-guide.pdf' },
  { title: 'Complaints & disputes guide', path: '/docs/complaints-disputes-guide.pdf' },
  { title: 'Property visits guide', path: '/docs/property-visits-guide.pdf' },
  { title: 'Notice & vacating guide', path: '/docs/notice-vacating-guide.pdf' },
  { title: 'Pet policy', path: '/docs/pet-policy.pdf' },
  { title: 'Rent increase guide', path: '/docs/rent-increase-guide.pdf' },
  { title: 'Tenant responsibilities', path: '/docs/tenant-responsibilities.pdf' },
  { title: 'Emergency procedures', path: '/docs/emergency-procedures.pdf' },
  { title: 'Move-in & move-out guide', path: '/docs/move-in-move-out-guide.pdf' },
  { title: 'Invoices & payments guide', path: '/docs/invoices-payments-guide.pdf' },
]

const QUICK_ACTIONS = [
  'What is the notice period for vacating?',
  'How do I file a maintenance request?',
  'Explain my security deposit rights',
  'What documents do I need to book a property visit?',
  'Can I keep a pet in my unit?',
]

const PERSONAL_QUICK_ACTIONS: Record<string, string[]> = {
  TENANT: [
    'Which properties have I booked?',
    'Show my current rent and invoices',
  ],
  OWNER: [
    'List my properties and their units',
  ],
  ADMIN: [
    'Give me an organization overview',
  ],
}

type SuggestionGroup = { title: string; questions: string[] }

const SUGGESTION_GROUPS: Record<string, SuggestionGroup[]> = {
  TENANT: [
    {
      title: 'My account & bookings',
      questions: [
        'Which properties have I booked?',
        'Show my current rent and invoices',
        'What is the status of my complaints?',
        'Are there any rent increases for me?',
        'What is my deposit dispute status?',
      ],
    },
    {
      title: 'Leases & payments',
      questions: [
        'What is the notice period for vacating?',
        'When is my rent due?',
        'How do I pay my invoice?',
      ],
    },
    {
      title: 'Maintenance & complaints',
      questions: [
        'How do I file a maintenance request?',
        'What counts as an emergency maintenance issue?',
        'How do I track my complaint?',
      ],
    },
    {
      title: 'Deposits & policies',
      questions: [
        'Explain my security deposit rights',
        'How do I get my deposit back after move-out?',
        'What do I do if I disagree with a deposit deduction?',
        'Can I keep a pet in my unit?',
      ],
    },
  ],
  OWNER: [
    {
      title: 'My properties',
      questions: [
        'List my properties and their units',
        'How many units are occupied?',
        'Show me my pending approvals',
      ],
    },
    {
      title: 'Management',
      questions: [
        'How does rent increase work?',
        'How do I approve a booking request?',
        'How do I respond to a deposit dispute?',
      ],
    },
  ],
  ADMIN: [
    {
      title: 'Organization',
      questions: [
        'Give me an organization overview',
        'How many pending approvals are there?',
        'How many properties and units do we have?',
      ],
    },
    {
      title: 'Management',
      questions: [
        'How do I create a new user?',
        'How does rent increase work?',
      ],
    },
  ],
}

function getWelcomeMessage(role: string) {
  switch (role) {
    case 'OWNER':
      return 'Hello! I am your RentSphere assistant. Ask me about your properties, units, bookings, rent increases, or approvals. Tap the "?" icon to see example questions.'
    case 'ADMIN':
      return 'Hello! I am your RentSphere assistant. Ask me about your organization, properties, users, approvals, or how the platform works. Tap the "?" icon to see example questions.'
    default:
      return 'Hello! I am your RentSphere assistant. You can ask about your booked properties, rent and invoices, complaints, deposits, or lease policies. Tap the "?" icon to see example questions.'
  }
}

function BotAvatar() {
  return (
    <Avatar
      sx={{
        width: 30,
        height: 30,
        bgcolor: 'primary.main',
        color: '#fff',
        fontSize: 13,
        fontWeight: 900,
        borderRadius: '9px',
      }}
    >
      RS
    </Avatar>
  )
}

function UserAvatar({ email }: { email?: string }) {
  const initial = email?.charAt(0).toUpperCase() ?? 'U'
  return (
    <Avatar
      sx={{
        width: 30,
        height: 30,
        bgcolor: '#111827',
        color: '#fff',
        fontSize: 13,
        fontWeight: 700,
        borderRadius: '9px',
      }}
    >
      {initial}
    </Avatar>
  )
}

function TypingDots() {
  return (
    <Box sx={{ display: 'flex', gap: 0.5, px: 1, py: 1.25 }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: 'primary.light',
            animation: 'bounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
            '@keyframes bounce': {
              '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: 0.4 },
              '40%': { transform: 'scale(1)', opacity: 1 },
            },
          }}
        />
      ))}
    </Box>
  )
}

export function AssistantWidget() {
  const { session } = useAuth()
  const role = session?.role ?? ''
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: getWelcomeMessage(role),
    },
  ])
  const [input, setInput] = useState('')
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([])
  const [loadingDocuments, setLoadingDocuments] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [activeModel, setActiveModel] = useState('Groq gpt-oss-20b')
  const [knowledgeAnchor, setKnowledgeAnchor] = useState<HTMLElement | null>(null)
  const [helpAnchor, setHelpAnchor] = useState<HTMLElement | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const messageIdRef = useRef(0)

  const isManager = session?.role === 'ADMIN' || session?.role === 'OWNER'
  const chatEmpty = messages.length <= 1
  const suggestionGroups = SUGGESTION_GROUPS[role] ?? SUGGESTION_GROUPS.TENANT

  const knowledgeSummary = useMemo(() => {
    if (!knowledgeEntries.length) return 'No documents loaded'
    return `${knowledgeEntries.length} document${knowledgeEntries.length > 1 ? 's' : ''}`
  }, [knowledgeEntries])

  async function loadKnowledge() {
    setLoadingDocuments(true)
    setError('')
    try {
      const storedRaw = window.localStorage.getItem(STORAGE_KEY)
      const storedEntries = storedRaw ? JSON.parse(storedRaw) as KnowledgeEntry[] : []

      const builtInEntries = await Promise.all(
        BUILTIN_DOCS.map(async (document) => {
          const text = await extractTextFromPdf(document.path)
          return {
            id: `builtin-${document.path}`,
            title: document.title,
            source: document.path,
            text,
            uploadedAt: new Date().toISOString(),
          } satisfies KnowledgeEntry
        }),
      )

      const mergedEntries = [...builtInEntries, ...storedEntries]
      setKnowledgeEntries(mergedEntries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load knowledge documents.')
    } finally {
      setLoadingDocuments(false)
    }
  }

  function persistKnowledge(entries: KnowledgeEntry[]) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadKnowledge()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (open) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, busy, open])

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    setBusy(true)
    setError('')
    try {
      const uploadedEntries = await Promise.all(
        files.map(async (file) => {
          const text = await extractTextFromPdfFile(file)
          return {
            id: `${file.name}-${Date.now()}`,
            title: file.name.replace(/\.pdf$/i, ''),
            source: file.name,
            text,
            uploadedAt: new Date().toISOString(),
          } satisfies KnowledgeEntry
        }),
      )
      const nextEntries = [...knowledgeEntries, ...uploadedEntries]
      setKnowledgeEntries(nextEntries)
      persistKnowledge(nextEntries)
      setMessages((current) => [
        ...current,
        {
          id: `system-${Date.now()}`,
          role: 'assistant',
          content: `I added ${uploadedEntries.length} new document${uploadedEntries.length > 1 ? 's' : ''} to the knowledge base. I can answer questions using them now.`,
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the PDF files.')
    } finally {
      setBusy(false)
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  function handleResetKnowledge() {
    const builtInEntries = BUILTIN_DOCS.map((document) => ({
      id: `builtin-${document.path}`,
      title: document.title,
      source: document.path,
      text: '',
      uploadedAt: new Date().toISOString(),
    }))
    setKnowledgeEntries(builtInEntries)
    persistKnowledge([])
    setMessages((current) => [
      ...current,
      {
        id: `reset-${Date.now()}`,
        role: 'assistant',
        content: 'The knowledge base has been reset to the built-in documents.',
      },
    ])
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    await sendMessage(input)
  }

  async function sendMessage(raw: string) {
    const trimmed = raw.trim()
    if (!trimmed || busy) return

    messageIdRef.current += 1
    const userMessage: Message = { id: `${messageIdRef.current}-user`, role: 'user', content: trimmed }
    setMessages((current) => [...current, userMessage])
    setInput('')
    setBusy(true)
    setError('')

    try {
      const response = await http.post<{ reply: string; usedFallback: boolean; model: string }>('/assistant/chat', {
        message: trimmed,
        context: knowledgeEntries.map((entry) => `${entry.title}: ${entry.text}`).join('\n\n'),
      })
      const nextModel = response.data.usedFallback ? 'Built-in guidance' : response.data.model
      setActiveModel(nextModel)
      messageIdRef.current += 1
      setMessages((current) => [...current, { id: `${messageIdRef.current}-assistant`, role: 'assistant', content: response.data.reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The assistant hit an issue while answering.')
    } finally {
      setBusy(false)
    }
  }

  function handleQuickAction(action: string) {
    void sendMessage(action)
  }

  function handleSuggestion(question: string) {
    setHelpAnchor(null)
    void sendMessage(question)
  }

  const widgetHeight = { xs: '70vh', sm: 560 }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: { xs: 84, md: 28 },
          right: { xs: 16, md: 28 },
          zIndex: 1300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 1.5,
        }}
      >
        {open && (
          <Box
            sx={{
              width: { xs: 'calc(100vw - 32px)', sm: 400 },
              maxWidth: 400,
              height: widgetHeight,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
              border: '1px solid rgba(148,163,184,0.28)',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 30px 90px rgba(15,23,42,0.28)',
              animation: 'widgetIn 200ms cubic-bezier(.22,1,.36,1)',
              '@keyframes widgetIn': {
                '0%': { transform: 'translateY(14px) scale(.98)', opacity: 0 },
                '100%': { transform: 'translateY(0) scale(1)', opacity: 1 },
              },
            }}
          >
            {/* Header */}
            <Box
              sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: 'primary.main',
                color: '#fff',
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: '#d9fff8',
                  color: 'primary.main',
                  fontSize: 15,
                  fontWeight: 900,
                  borderRadius: '10px',
                }}
              >
                RS
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: '0.95rem' }}>
                  RentSphere assistant
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.92, fontSize: '0.72rem' }}>
                  Online · {knowledgeSummary}
                </Typography>
              </Box>
              {isManager && (
                <>
                  <IconButton
                    size="small"
                    sx={{ color: '#fff' }}
                    onClick={(event) => setKnowledgeAnchor(event.currentTarget)}
                    aria-label="Manage knowledge base"
                  >
                    <UploadIcon fontSize="small" />
                  </IconButton>
                  <Menu
                    anchorEl={knowledgeAnchor}
                    open={Boolean(knowledgeAnchor)}
                    onClose={() => setKnowledgeAnchor(null)}
                    slotProps={{
                      paper: {
                        sx: {
                          borderRadius: '12px',
                          boxShadow: '0 20px 60px rgba(15,23,42,0.2)',
                          width: 260,
                          maxHeight: 340,
                        },
                      },
                    }}
                  >
                    <MenuItem
                      component="label"
                      dense
                      sx={{ fontWeight: 700 }}
                      onClick={() => setKnowledgeAnchor(null)}
                    >
                      <UploadIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                      Upload PDF
                      <input ref={fileInputRef} type="file" accept="application/pdf" hidden multiple onChange={handleUpload} />
                    </MenuItem>
                    <MenuItem dense sx={{ fontWeight: 700 }} onClick={() => {
                      setKnowledgeAnchor(null)
                      handleResetKnowledge()
                    }}>
                      <DeleteIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
                      Reset to built-in docs
                    </MenuItem>
                    <Divider />
                    <Box sx={{ px: 2, py: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>
                        Available documents
                      </Typography>
                      <List dense disablePadding sx={{ mt: 0.5 }}>
                        {knowledgeEntries.map((entry) => (
                          <ListItem key={entry.id} sx={{ px: 0, py: 0.25 }}>
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.78rem' }}>
                                  {entry.title}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                                  {entry.source}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </Menu>
                </>
              )}
              <Tooltip title="What can I ask?">
                <IconButton size="small" sx={{ color: '#fff' }} onClick={(event) => setHelpAnchor(event.currentTarget)} aria-label="Example questions">
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Minimize">
                <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setOpen(false)} aria-label="Close assistant">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Menu
              anchorEl={helpAnchor}
              open={Boolean(helpAnchor)}
              onClose={() => setHelpAnchor(null)}
              slotProps={{
                paper: {
                  sx: {
                    borderRadius: '12px',
                    boxShadow: '0 20px 60px rgba(15,23,42,0.2)',
                    width: 320,
                    maxHeight: 420,
                  },
                },
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary' }}>
                  What can I ask?
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.25 }}>
                  Tap a question to ask it. You can also type your own.
                </Typography>
              </Box>
              <Divider />
              {suggestionGroups.map((group) => (
                <Box key={group.title} sx={{ px: 1, py: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', px: 1, py: 0.5, color: 'primary.main', textTransform: 'uppercase', fontSize: '0.68rem' }}>
                    {group.title}
                  </Typography>
                  {group.questions.map((question) => (
                    <MenuItem
                      key={question}
                      dense
                      sx={{ borderRadius: '8px', whiteSpace: 'normal', fontSize: '0.8rem', py: 0.75 }}
                      onClick={() => handleSuggestion(question)}
                    >
                      {question}
                    </MenuItem>
                  ))}
                </Box>
              ))}
            </Menu>

            <Divider />

            {/* Messages */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                px: 1.5,
                py: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
                bgcolor: 'background.default',
              }}
            >
              {chatEmpty && !busy && (
                <Box sx={{ textAlign: 'center', my: 3, opacity: 0.65 }}>
                  <Avatar
                    sx={{
                      width: 52,
                      height: 52,
                      bgcolor: 'color-mix(in srgb, var(--rs-primary) 8%, transparent)',
                      color: 'primary.main',
                      fontSize: 24,
                      fontWeight: 900,
                      borderRadius: '14px',
                      mx: 'auto',
                      mb: 1,
                    }}
                  >
                    RS
                  </Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    How can I help you?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ask a question or choose a quick action below.
                  </Typography>
                </Box>
              )}

              {messages.map((message) => (
                <Stack
                  key={message.id}
                  direction="row"
                  spacing={1}
                  sx={{
                    alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  {message.role === 'assistant' ? <BotAvatar /> : <UserAvatar email={session?.email} />}
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1,
                      borderRadius: message.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      bgcolor: message.role === 'user' ? 'primary.main' : 'grey.50',
                      color: message.role === 'user' ? '#fff' : 'text.primary',
                      boxShadow: message.role === 'user'
                        ? '0 4px 14px color-mix(in srgb, var(--rs-primary) 22%, transparent)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                      border: message.role === 'assistant' ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    {message.role === 'assistant' ? (
                      <AssistantMessage content={message.content} />
                    ) : (
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.65, fontSize: '0.85rem' }}>
                        {message.content}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              ))}

              {busy && (
                <Stack direction="row" spacing={1} sx={{ alignSelf: 'flex-start' }}>
                  <BotAvatar />
                  <Box
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: '14px 14px 14px 4px',
                      bgcolor: 'grey.50',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <TypingDots />
                  </Box>
                </Stack>
              )}

              <div ref={chatEndRef} />
            </Box>

            <Divider />

            {/* Quick actions */}
            {chatEmpty && !busy && (
              <Box sx={{ px: 1.5, pt: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Try asking
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  {(PERSONAL_QUICK_ACTIONS[session?.role ?? ''] ?? []).map((action) => (
                    <Chip
                      key={action}
                      label={action}
                      size="small"
                      onClick={() => handleQuickAction(action)}
                      sx={{
                        borderRadius: '8px',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        bgcolor: 'primary.main',
                        color: '#fff',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'primary.dark' },
                      }}
                    />
                  ))}
                  {QUICK_ACTIONS.map((action) => (
                    <Chip
                      key={action}
                      label={action}
                      size="small"
                      onClick={() => handleQuickAction(action)}
                      sx={{
                        borderRadius: '8px',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        bgcolor: 'color-mix(in srgb, var(--rs-primary) 6%, transparent)',
                        color: 'primary.main',
                        border: '1px solid color-mix(in srgb, var(--rs-primary) 14%, transparent)',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'color-mix(in srgb, var(--rs-primary) 12%, transparent)' },
                      }}
                    />
                  ))}
                </Stack>
              </Box>
            )}

            {/* Input */}
            <Box sx={{ p: 1.5 }}>
              <Stack component="form" direction="row" spacing={1} sx={{ alignItems: 'flex-end' }} onSubmit={handleSubmit}>
                <TextField
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  multiline
                  maxRows={4}
                  fullWidth
                  placeholder="Type your message..."
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'grey.50',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                    },
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={busy || !input.trim()}
                  aria-label="Send message"
                  sx={{
                    borderRadius: '12px',
                    minWidth: 44,
                    minHeight: 40,
                    px: 1.5,
                    '&:hover': { transform: 'translateY(-2px)' },
                  }}
                >
                  <SendIcon fontSize="small" />
                </Button>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 0.5, fontSize: '0.65rem' }}>
                {activeModel} · {loadingDocuments ? 'Loading knowledge...' : `${knowledgeEntries.length} knowledge doc${knowledgeEntries.length !== 1 ? 's' : ''}`}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Floating action button */}
        <Tooltip title={open ? 'Close AI assistant' : 'Ask the AI assistant'}>
          <Fab
            color="primary"
            aria-label="AI assistant"
            onClick={() => setOpen((current) => !current)}
            sx={{
              width: 58,
              height: 58,
              bgcolor: 'primary.main',
              color: '#fff',
              boxShadow: '0 14px 34px color-mix(in srgb, var(--rs-primary) 40%, transparent)',
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            {open ? <CloseIcon fontSize="large" /> : <RiRobot3Fill size={30} />}
          </Fab>
        </Tooltip>
      </Box>
      {error && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 96,
            right: 28,
            zIndex: 1301,
            maxWidth: 360,
            bgcolor: 'error.main',
            color: '#fff',
            borderRadius: '12px',
            px: 2,
            py: 1,
            boxShadow: '0 14px 34px rgba(185,28,28,0.35)',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{error}</Typography>
            <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setError('')} aria-label="Dismiss">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
      )}
    </>
  )
}

async function extractTextFromPdf(path: string) {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`Could not load ${path}`)
  const pdfData = await response.arrayBuffer()
  return extractTextFromPdfBuffer(pdfData)
}

async function extractTextFromPdfFile(file: File) {
  const pdfData = await file.arrayBuffer()
  return extractTextFromPdfBuffer(pdfData)
}

async function extractTextFromPdfBuffer(pdfData: ArrayBuffer) {
  const document = await getDocument({ data: pdfData }).promise
  const totalPages = document.numPages
  const parts: string[] = []

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (pageText) {
      parts.push(pageText)
    }
  }

  return parts.join('\n')
}

function renderInline(text: string, keyPrefix: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} style={{ fontWeight: 800 }}>
          {part.slice(2, -2)}
        </strong>
      )
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

function renderMarkdown(content: string): ReactNode[] {
  const lines = content.split('\n')
  const blocks: ReactNode[] = []
  let list: { items: ReactNode[]; ordered: boolean } | null = null

  const flushList = () => {
    if (list) {
      blocks.push(
        <Box key={`list-${blocks.length}`} component={list.ordered ? 'ol' : 'ul'} sx={{ m: 0, pl: 2, mt: 0.5 }}>
          {list.items.map((item, index) => (
            <Box
              key={`item-${index}`}
              component="li"
              sx={{ fontSize: 'inherit', lineHeight: 1.65, mb: 0.4, '::marker': { color: 'primary.main' } }}
            >
              {item}
            </Box>
          ))}
        </Box>,
      )
      list = null
    }
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      return
    }

    const heading = trimmed.match(/^#{1,3}\s+(.*)$/)
    if (heading) {
      flushList()
      blocks.push(
        <Typography
          key={`h-${index}`}
          sx={{ fontWeight: 800, fontSize: '0.95rem', mt: 1, mb: 0.25, color: 'text.primary' }}
        >
          {heading[1]}
        </Typography>,
      )
      return
    }

    const bullet = trimmed.match(/^[-*]\s+(.*)$/)
    if (bullet) {
      if (!list || list.ordered) {
        flushList()
        list = { items: [], ordered: false }
      }
      list.items.push(renderInline(bullet[1], `b-${index}`))
      return
    }

    const numbered = trimmed.match(/^\d+[.)]\s+(.*)$/)
    if (numbered) {
      if (!list || !list.ordered) {
        flushList()
        list = { items: [], ordered: true }
      }
      list.items.push(renderInline(numbered[1], `n-${index}`))
      return
    }

    flushList()
    blocks.push(
      <Box key={`p-${index}`} sx={{ fontSize: '0.85rem', lineHeight: 1.65, mb: 0.75 }}>
        {renderInline(trimmed, `p-${index}`)}
      </Box>,
    )
  })

  flushList()
  return blocks
}

function AssistantMessage({ content }: { content: string }) {
  return (
    <Box sx={{ fontSize: '0.85rem', lineHeight: 1.65, '& p': { my: 0 } }}>
      {renderMarkdown(content)}
    </Box>
  )
}

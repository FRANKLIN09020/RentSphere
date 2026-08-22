import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Box, Chip, Stack, Typography } from '@mui/material'

export type ChartDatum = {
  label: string
  value: number
  color: string
}

export function AnimatedNumber({
  value,
  format,
  duration = 1000,
}: {
  value: number
  format?: (value: number) => string
  duration?: number
}) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = from + (value - from) * eased
      setDisplay(current)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        fromRef.current = value
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <>{format ? format(display) : Math.round(display).toLocaleString('en-IN')}</>
}

export function DonutChart({
  data,
  size = 176,
  thickness = 22,
  centerTitle,
  centerSubtitle,
}: {
  data: ChartDatum[]
  size?: number
  thickness?: number
  centerTitle?: ReactNode
  centerSubtitle?: ReactNode
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let cursor = 0
  const stops = data.map((item) => {
    const start = total ? (cursor / total) * 100 : 0
    cursor += item.value
    const end = total ? (cursor / total) * 100 : 0
    return `${item.color} ${start}% ${end}%`
  })

  return (
    <Stack direction="row" spacing={3} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <Box
        sx={{
          position: 'relative',
          width: size,
          height: size,
          flexShrink: 0,
          animation: 'donutPop 0.7s cubic-bezier(.22,1,.36,1) both',
          '@keyframes donutPop': {
            from: { opacity: 0, transform: 'scale(0.7) rotate(-30deg)' },
            to: { opacity: 1, transform: 'scale(1) rotate(0deg)' },
          },
        }}
      >
        <Box
          sx={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: total
              ? `conic-gradient(${stops.join(', ')})`
              : 'rgba(148,163,184,0.18)',
            boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.04)',
            transition: 'transform 300ms ease',
            animation: 'donutSpin 16s linear infinite',
            '@keyframes donutSpin': {
              from: { transform: 'rotate(0deg)' },
              to: { transform: 'rotate(360deg)' },
            },
            '&:hover': { animationPlayState: 'paused', transform: 'scale(1.03)' },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: thickness,
            borderRadius: '50%',
            bgcolor: 'background.paper',
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            animation: 'donutCenterPulse 3s ease-in-out infinite',
            '@keyframes donutCenterPulse': {
              '0%, 100%': { boxShadow: '0 0 0 0 rgba(13,148,136,0) inset' },
              '50%': { boxShadow: '0 0 0 2px rgba(13,148,136,0.08) inset' },
            },
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ lineHeight: 1 }}>
              {centerTitle ?? <AnimatedNumber value={total} />}
            </Typography>
            {centerSubtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                {centerSubtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      <Stack spacing={1} sx={{ minWidth: 0 }}>
        {data.length ? (
          data.map((item, index) => (
            <Box
              key={item.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                animation: 'legendIn 0.4s ease both',
                animationDelay: `${0.25 + index * 0.08}s`,
                '@keyframes legendIn': { from: { opacity: 0, transform: 'translateX(-10px)' }, to: { opacity: 1, transform: 'none' } },
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'translateX(4px)' },
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '4px',
                  bgcolor: item.color,
                  flexShrink: 0,
                  boxShadow: `0 0 10px ${item.color}55`,
                }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {item.label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, ml: 'auto', minWidth: 28, textAlign: 'right' }}>
                <AnimatedNumber value={item.value} />
              </Typography>
            </Box>
          ))
        ) : (
          <Typography color="text.secondary">No data yet</Typography>
        )}
      </Stack>
    </Stack>
  )
}

export function BarChart({ data }: { data: ChartDatum[] }) {
  const max = Math.max(...data.map((item) => item.value), 1)
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.25, height: 220 }}>
      {data.map((item, index) => {
        const heightPct = Math.max((item.value / max) * 100, 3)
        return (
          <Box
            key={item.label}
            sx={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              minWidth: 0,
              animation: 'barColIn 0.5s ease both',
              animationDelay: `${index * 0.06}s`,
              '@keyframes barColIn': { from: { opacity: 0, transform: 'translateY(14px)' }, to: { opacity: 1, transform: 'none' } },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 800,
                textAlign: 'center',
                mb: 0.5,
                opacity: 0,
                transition: 'opacity 0.2s ease',
                color: item.color,
              }}
            >
              <AnimatedNumber value={item.value} duration={700} />
            </Typography>
            <Box
              sx={{
                position: 'relative',
                height: `${heightPct}%`,
                borderRadius: '8px 8px 4px 4px',
                background: `linear-gradient(180deg, ${item.color}, ${item.color}cc)`,
                boxShadow: `0 6px 16px ${item.color}33`,
                transition: 'transform 0.25s cubic-bezier(.22,1,.36,1), filter 0.25s ease',
                overflow: 'hidden',
                animation: `barGrow 700ms ${index * 70}ms cubic-bezier(.22,1,.36,1) both`,
                '@keyframes barGrow': {
                  from: { height: 0 },
                  to: { height: `${heightPct}%` },
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, transparent 30%, rgba(255,255,255,0.35), transparent 70%)',
                  transform: 'translateY(-100%)',
                  animation: 'barShine 3s ease-in-out infinite',
                  animationDelay: `${index * 0.2}s`,
                  '@keyframes barShine': {
                    '0%': { transform: 'translateY(-100%)' },
                    '45%, 100%': { transform: 'translateY(100%)' },
                  },
                },
                '&:hover': {
                  transform: 'scaleY(1.06)',
                  filter: 'brightness(1.08)',
                  '& + *': {},
                },
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textAlign: 'center', mt: 1, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {item.label}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

export function HorizontalBars({ data }: { data: ChartDatum[] }) {
  const max = Math.max(...data.map((item) => item.value), 1)
  return (
    <Stack spacing={1.5}>
      {data.length ? (
        data.map((item, index) => {
          const widthPct = (item.value / max) * 100
          return (
            <Box
              key={item.label}
              sx={{
                animation: 'hRowIn 0.5s ease both',
                animationDelay: `${index * 0.08}s`,
                '@keyframes hRowIn': { from: { opacity: 0, transform: 'translateX(-14px)' }, to: { opacity: 1, transform: 'none' } },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {item.label}
                </Typography>
                <Chip size="small" label={<AnimatedNumber value={item.value} duration={600} />} sx={{ height: 22, fontWeight: 800 }} />
              </Box>
              <Box sx={{ height: 10, borderRadius: 999, bgcolor: 'rgba(148,163,184,0.16)', overflow: 'hidden' }}>
                <Box
                  sx={{
                    position: 'relative',
                    height: '100%',
                    width: `${widthPct}%`,
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${item.color}, ${item.color}99)`,
                    transition: 'width 600ms cubic-bezier(.22,1,.36,1), filter 0.2s ease',
                    animation: `hBarGrow 750ms ${index * 80}ms cubic-bezier(.22,1,.36,1) both`,
                    '@keyframes hBarGrow': { from: { width: 0 }, to: { width: `${widthPct}%` } },
                    overflow: 'hidden',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                      transform: 'translateX(-100%)',
                      animation: 'hBarShine 2.8s ease-in-out infinite',
                      animationDelay: `${index * 0.25}s`,
                      '@keyframes hBarShine': {
                        '0%': { transform: 'translateX(-100%)' },
                        '45%, 100%': { transform: 'translateX(100%)' },
                      },
                    },
                    '&:hover': { filter: 'brightness(1.1)' },
                  }}
                />
              </Box>
            </Box>
          )
        })
      ) : (
        <Typography color="text.secondary">No data yet</Typography>
      )}
    </Stack>
  )
}

export type AreaPoint = { label: string; value: number }

export function AreaChart({
  data,
  color = '#0d9488',
  height = 220,
}: {
  data: AreaPoint[]
  color?: string
  height?: number
}) {
  const width = 620
  const padX = 8
  const padY = 16
  const max = Math.max(...data.map((point) => point.value), 1)
  const step = data.length > 1 ? (width - padX * 2) / (data.length - 1) : 0

  const points = data.map((point, index) => ({
    x: data.length > 1 ? padX + index * step : width / 2,
    y: padY + (1 - point.value / max) * (height - padY * 2),
  }))

  const linePath = smoothPath(points)
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`
      : ''

  const gradientId = `area-${color.replace('#', '')}`

  return (
    <Box>
      <Box data-app-scrollbars data-scroll-axis="x" sx={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          style={{ display: 'block', width: '100%', minWidth: 420, height: 'auto' }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.34" />
              <stop offset="100%" stopColor={color} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={padX}
              x2={width - padX}
              y1={padY + ratio * (height - padY * 2)}
              y2={padY + ratio * (height - padY * 2)}
              stroke="rgba(148,163,184,0.18)"
              strokeDasharray="4 6"
              style={{ animation: `gridFade 1s ease ${0.6 + ratio}s both` }}
            />
          ))}
          {points.length > 1 && (
            <path
              d={areaPath}
              fill={`url(#${gradientId})`}
              style={{ animation: 'areaFade 0.9s ease 0.5s both' }}
            />
          )}
          {points.length > 1 && (
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: 'lineDraw 1.2s cubic-bezier(.65,0,.35,1) 0.15s forwards',
              }}
            />
          )}
          {points.map((point, index) => (
            <g key={`${point.x}-${point.y}-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r={9}
                fill="none"
                style={{
                  opacity: 0,
                  animation: `dotHalo 2.2s ease-out ${1 + index * 0.12}s infinite`,
                }}
              >
                <animate attributeName="opacity" values="0.35;0" dur="2.2s" begin={`${1 + index * 0.12}s`} repeatCount="indefinite" />
              </circle>
              <circle
                cx={point.x}
                cy={point.y}
                r={4}
                fill="#ffffff"
                stroke={color}
                strokeWidth={2.5}
                style={{ opacity: 0, animation: `dotIn 0.4s ease ${0.5 + index * 0.1}s forwards` }}
              />
            </g>
          ))}
        </svg>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        {data.map((point, index) => (
          <Typography
            key={point.label}
            variant="caption"
            color="text.secondary"
            sx={{
              fontWeight: 600,
              animation: 'labelIn 0.4s ease both',
              animationDelay: `${0.7 + index * 0.08}s`,
              '@keyframes labelIn': { from: { opacity: 0 }, to: { opacity: 1 } },
            }}
          >
            {point.label}
          </Typography>
        ))}
      </Box>
      <style>{`
        @keyframes gridFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes areaFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lineDraw { to { stroke-dashoffset: 0 } }
        @keyframes dotIn { to { opacity: 1 } }
        @keyframes dotHalo { 0% { opacity: 0.4 } 100% { opacity: 0 } }
      `}</style>
    </Box>
  )
}

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

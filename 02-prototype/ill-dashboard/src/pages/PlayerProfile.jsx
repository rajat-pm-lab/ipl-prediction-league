import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart, Pie, Cell } from 'recharts'
import { api } from '../services/api'
import Avatar from '../components/Avatar'

const AVATAR_COLORS = [
  '#FFD700', '#2979FF', '#00C853', '#FF6D00', '#AA00FF',
  '#00BCD4', '#FF1744', '#76FF03', '#FF9100', '#448AFF',
  '#E040FB', '#FFAB40', '#69F0AE',
]

const IPL_TEAMS = [
  { abbr: 'CSK', color: '#FFD700' },
  { abbr: 'MI', color: '#004BA0' },
  { abbr: 'RCB', color: '#D4213D' },
  { abbr: 'KKR', color: '#3A225D' },
  { abbr: 'DC', color: '#004C93' },
  { abbr: 'SRH', color: '#FF822A' },
  { abbr: 'PBKS', color: '#ED1B24' },
  { abbr: 'RR', color: '#254AA5' },
  { abbr: 'GT', color: '#1C1C2B' },
  { abbr: 'LSG', color: '#A72056' },
]

export default function PlayerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const playerId = Number(id)

  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadPlayer()
  }, [playerId])

  async function loadPlayer() {
    setLoading(true)
    try {
      const data = await api.player.get(playerId)
      setPlayer(data)
    } catch (err) {
      console.error('Failed to load player:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
  }

  if (error || !player) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--red)' }}>
      {error || 'Player not found'}
    </div>
  }

  const colorIndex = (player.id - 1) % AVATAR_COLORS.length
  const playerColor = AVATAR_COLORS[colorIndex]

  const chartData = [{ week: 'Start', player: 0, avg: 0 }]
  const avgPoints = player.weeklyPoints.length > 0
    ? player.weeklyPoints.reduce((sum, w) => sum + w.points, 0) / player.weeklyPoints.length
    : 0
  
  for (const wp of player.weeklyPoints) {
    const prev = chartData[chartData.length - 1]
    chartData.push({
      week: `W${wp.week}`,
      player: prev.player + wp.points,
      avg: prev.avg + avgPoints,
    })
  }

  const donutData = [
    { name: 'Correct', value: player.overall.wins || 0, color: 'var(--green)' },
    { name: 'Incorrect', value: player.overall.losses || 0, color: 'var(--red)' },
    { name: 'No Result', value: player.overall.draws || 0, color: 'var(--grey)' },
  ]

  return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{
        display: 'flex', alignItems: 'center', padding: '14px 12px',
        position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.05)', gap: 12,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--surface)',
            border: '1px solid rgba(255,255,255,0.08)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: 'var(--text-secondary)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          Player Profile
        </span>
      </div>

      <div style={{
        margin: '0 12px', padding: '20px 16px 16px',
        background: 'linear-gradient(135deg, var(--surface), var(--surface-alt))',
        borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 160, height: 160,
          background: `radial-gradient(circle, ${playerColor}1F, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
          <div style={{ border: `3px solid ${playerColor}66`, borderRadius: '50%', boxShadow: `0 4px 20px ${playerColor}4D` }}>
            <Avatar player={player} size={72} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.3 }}>{player.name}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <span style={{
                fontSize: 11, fontWeight: 800, color: 'var(--gold)',
                background: 'rgba(255,215,0,0.15)', padding: '3px 10px', borderRadius: 6,
                border: '1px solid rgba(255,215,0,0.2)',
              }}>
                Rank #{player.overall.rank || '-'}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: 'var(--green)',
                background: 'rgba(0,200,83,0.12)', padding: '3px 10px', borderRadius: 6,
              }}>
                {player.overall.accuracy}% Acc
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 20, position: 'relative', zIndex: 1 }}>
          {[
            { value: player.overall.points || 0, label: 'Points', color: 'var(--gold)' },
            { value: player.overall.wins || 0, label: 'Wins', color: 'var(--green)' },
            { value: player.overall.losses || 0, label: 'Losses', color: 'var(--red)' },
            { value: player.overall.draws || 0, label: 'Draws', color: 'var(--blue)' },
          ].map((s) => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 8px',
              textAlign: 'center', border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Section title="Points Over Time" accentColor="var(--blue)">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={playerColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={playerColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="week" tick={{ fill: '#8899AA', fontSize: 10, fontWeight: 600 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickLine={false} />
            <YAxis tick={{ fill: '#8899AA', fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#1A2D47', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, color: '#fff' }} />
            <Area type="monotone" dataKey="avg" stroke="#8899AA" strokeWidth={1.5} strokeDasharray="6 4" strokeOpacity={0.5} fill="none" name="Group Avg" />
            <Area type="monotone" dataKey="player" stroke={playerColor} strokeWidth={2.5} fill="url(#grad)" name={player.name} dot={{ r: 4, fill: playerColor }} />
          </AreaChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center' }}>
          <Legend color={playerColor} label={player.name} />
          <Legend color="#8899AA" label="Group Avg" />
        </div>
      </Section>

      <Section title="Prediction Breakdown" accentColor="var(--green)">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 110, height: 110, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={30} outerRadius={48} dataKey="value" stroke="none">
                  {donutData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} opacity={0.8} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: 'relative', top: -68, textAlign: 'center', pointerEvents: 'none',
            }}>
              <div style={{ fontSize: 18, fontWeight: 900 }}>{player.overall.predicted || 0}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)' }}>MATCHES</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {donutData.map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, flex: 1 }}>{d.name}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: d.color, fontVariantNumeric: 'tabular-nums' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Team Loyalty Map" accentColor="var(--gold)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {IPL_TEAMS.map((team) => {
            const tp = player.teamPredictions?.find(t => t.team === team.abbr) || { count: 0 }
            const heat = tp.count >= 4 ? 'high' : tp.count >= 2 ? 'med' : tp.count > 0 ? 'low' : 'none'
            const heatStyles = {
              high: { background: 'rgba(0,200,83,0.2)', border: '1px solid rgba(0,200,83,0.15)', color: 'var(--green)' },
              med: { background: 'rgba(41,121,255,0.15)', border: '1px solid rgba(41,121,255,0.1)', color: 'var(--blue)' },
              low: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', color: 'var(--text-secondary)' },
              none: { background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.02)', color: 'rgba(255,255,255,0.2)' },
            }
            return (
              <div key={team.abbr} style={{ borderRadius: 8, padding: '10px 4px', textAlign: 'center', ...heatStyles[heat] }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>{team.abbr}</div>
                <div style={{ fontSize: 14, fontWeight: 900, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{tp.count}</div>
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Prize Earnings" accentColor="var(--gold)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <EarningCard label="Weekly Prizes" value={`₹${player.prizeEarnings?.weekly || 0}`} detail="Weekly winners" />
          <EarningCard label="Stage Prizes" value={`₹${player.prizeEarnings?.stage || 0}`} detail="Stage winners" />
          <div style={{
            gridColumn: '1 / -1', background: 'linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,215,0,0.02))',
            border: '1px solid rgba(255,215,0,0.15)', borderRadius: 12, padding: '14px 12px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Earnings</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>₹{player.prizeEarnings?.total || 0}</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Out of ₹45,500 pool</div>
          </div>
        </div>
      </Section>

      <Section title="Match History" accentColor="var(--red)">
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)', fontSize: 12 }}>
          View predictions in Picks tab
        </div>
      </Section>

      <Section title="Head to Head" accentColor="var(--blue)">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: 16, background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, cursor: 'pointer',
        }}>
          <span style={{ fontSize: 18 }}>⚔️</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Compare with another player</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, accentColor, children }) {
  return (
    <div style={{
      margin: '12px 12px 0', padding: 16, background: 'var(--surface)',
      borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{
        fontSize: 13, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase',
        marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{ width: 4, height: 14, borderRadius: 2, background: accentColor }} />
        {title}
      </div>
      {children}
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      {label}
    </div>
  )
}

function EarningCard({ label, value, detail }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 12, padding: '14px 12px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--gold)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{detail}</div>
    </div>
  )
}

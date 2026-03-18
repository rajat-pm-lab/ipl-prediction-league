import { PLAYERS, MATCH_SCHEDULE, ALL_PREDICTIONS, IPL_TEAMS } from '../data/sampleData'
import Avatar from './Avatar'

export default function PredictionsView({ selectedWeek }) {
  const matches = MATCH_SCHEDULE[selectedWeek] || []
  const weekPredictions = ALL_PREDICTIONS[selectedWeek] || {}

  if (matches.length === 0) {
    return (
      <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
        No match data yet for Week {selectedWeek}
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 12px 0' }}>
      {/* Note */}
      <div style={{
        fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600,
        padding: '6px 10px 12px', letterSpacing: 0.3,
      }}>
        Picks submitted via Google Form · Week {selectedWeek}
      </div>

      {/* Player header row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `80px repeat(${PLAYERS.length}, minmax(36px, 1fr))`,
        gap: 2, marginBottom: 4,
        overflowX: 'auto',
      }}>
        <div /> {/* empty corner */}
        {PLAYERS.map((p) => (
          <div key={p.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '0 2px' }}>
            <Avatar player={p} size={26} />
            <span style={{ fontSize: 7, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center' }}>
              {p.initials}
            </span>
          </div>
        ))}
      </div>

      {/* Match rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {matches.map((match) => (
          <MatchRow
            key={match.matchNum}
            match={match}
            players={PLAYERS}
            weekPredictions={weekPredictions}
          />
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 12, padding: '14px 4px 4px',
        fontSize: 9, fontWeight: 600, color: 'var(--text-secondary)',
      }}>
        <LegendDot color="var(--green)" label="Correct" />
        <LegendDot color="var(--red)" label="Incorrect" />
        <LegendDot color="var(--blue)" label="No Result" />
        <LegendDot color="rgba(255,255,255,0.15)" label="Pending" />
      </div>
    </div>
  )
}

function MatchRow({ match, players, weekPredictions }) {
  const isPending = match.winner === undefined
  const isNoResult = match.winner === null

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `80px repeat(${players.length}, minmax(36px, 1fr))`,
      gap: 2, alignItems: 'center',
      background: 'var(--surface)',
      borderRadius: 8, padding: '7px 6px',
      border: '1px solid rgba(255,255,255,0.04)',
    }}>
      {/* Match label */}
      <div style={{ paddingRight: 4 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: 0.3 }}>
          #{match.matchNum}
        </div>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, marginTop: 1 }}>
          <TeamChip abbr={match.home} /> vs <TeamChip abbr={match.away} />
        </div>
        {!isPending && (
          <div style={{ fontSize: 8, fontWeight: 700, marginTop: 2, color: isNoResult ? 'var(--blue)' : 'var(--green)' }}>
            {isNoResult ? 'No Result' : `✓ ${match.winner}`}
          </div>
        )}
      </div>

      {/* Each player's pick */}
      {players.map((p) => {
        const playerPicks = weekPredictions[p.id] || {}
        const pick = playerPicks[match.matchNum]

        let bg = 'rgba(255,255,255,0.04)'
        let textColor = 'var(--text-secondary)'

        if (pick && !isPending) {
          if (isNoResult) {
            bg = 'rgba(41,121,255,0.18)'
            textColor = 'var(--blue)'
          } else if (pick === match.winner) {
            bg = 'rgba(0,200,83,0.18)'
            textColor = 'var(--green)'
          } else {
            bg = 'rgba(255,23,68,0.15)'
            textColor = 'var(--red)'
          }
        }

        return (
          <div key={p.id} style={{
            background: bg, borderRadius: 5,
            padding: '4px 2px', textAlign: 'center',
            fontSize: 8, fontWeight: 800, color: textColor,
            letterSpacing: 0.2, minHeight: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {pick || <span style={{ opacity: 0.25 }}>—</span>}
          </div>
        )
      })}
    </div>
  )
}

function TeamChip({ abbr }) {
  const team = IPL_TEAMS.find((t) => t.abbr === abbr)
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 8, fontWeight: 800, color: team?.color || 'var(--text)',
    }}>
      {abbr}
    </span>
  )
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      <span>{label}</span>
    </div>
  )
}

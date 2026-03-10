import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import styles from './Dashboard.module.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const METRICS = [
  { key: 'recovery', label: 'Recovery', color: '#00c8ff', unit: '%' },
  { key: 'strain',   label: 'Strain',   color: '#ff6b35', unit: '' },
  { key: 'sleep',    label: 'Sleep Performance', color: '#a855f7', unit: '%' },
]

function StatCard({ label, value, unit, color }) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue} style={{ color }}>
        {value != null ? `${value}${unit}` : '—'}
      </span>
      <span className={styles.statSub}>7-day avg</span>
    </div>
  )
}

function buildChartData(data) {
  const len = Math.max(
    data.recovery?.length ?? 0,
    data.strain?.length ?? 0,
    data.sleep?.length ?? 0
  )
  return Array.from({ length: len }, (_, i) => ({
    day: `Day ${len - i}`,
    Recovery: data.recovery?.[i] ?? null,
    Strain: data.strain?.[i] ?? null,
    Sleep: data.sleep?.[i] ?? null,
  })).reverse()
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${BACKEND_URL}/whoop/summary`)
      .then(r => {
        if (!r.ok) throw new Error(`Backend error: ${r.status}`)
        return r.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className={styles.center}><div className={styles.spinner} /></div>

  if (error) return (
    <div className={styles.center}>
      <div className={styles.errorBox}>
        <p>Could not load data.</p>
        <p className={styles.errorDetail}>{error}</p>
        <a href="/" className={styles.backLink}>← Reconnect WHOOP</a>
      </div>
    </div>
  )

  const chartData = buildChartData(data)
  const { averages } = data

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>⚡ WHOOP Insights</h1>
        <a href={`${BACKEND_URL}/login`} className={styles.reconnect}>Reconnect</a>
      </header>

      <section className={styles.stats}>
        {METRICS.map(m => (
          <StatCard
            key={m.key}
            label={m.label}
            value={averages[m.key]}
            unit={m.unit}
            color={m.color}
          />
        ))}
      </section>

      <section className={styles.chartSection}>
        <h2 className={styles.chartTitle}>Last 7 Days</h2>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="day" stroke="#555" tick={{ fill: '#888', fontSize: 12 }} />
            <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8 }}
              labelStyle={{ color: '#aaa' }}
            />
            <Legend wrapperStyle={{ color: '#aaa', fontSize: 13 }} />
            <Line type="monotone" dataKey="Recovery" stroke="#00c8ff" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Strain"   stroke="#ff6b35" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="Sleep"    stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </section>

      <section className={styles.rawSection}>
        <h2 className={styles.chartTitle}>Raw Scores</h2>
        <div className={styles.tables}>
          {METRICS.map(m => (
            <div key={m.key} className={styles.tableCard}>
              <h3 style={{ color: m.color }}>{m.label}</h3>
              <table className={styles.table}>
                <tbody>
                  {(data[m.key] ?? []).map((v, i) => (
                    <tr key={i}>
                      <td className={styles.tdDay}>Day {(data[m.key].length) - i}</td>
                      <td className={styles.tdVal}>{v}{m.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

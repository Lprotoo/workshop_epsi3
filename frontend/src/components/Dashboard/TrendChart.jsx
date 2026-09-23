import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useLanguage } from '../../i18n/LanguageContext'
import { formatShortDate } from '../../utils/format'

const tooltipStyle = {
  background: '#101826',
  border: '1px solid #1c3a5a',
  borderRadius: 8,
  color: '#e8eef6',
}

export default function TrendChart({ data, title }) {
  const { t, localeTag } = useLanguage()
  const chartTitle = title || t('dashboard.trend')

  return (
    <section className="rounded-xl border border-hud-border bg-hud-panel p-5">
      <h2 className="font-mono text-[11px] tracking-[0.22em] text-hud-muted">{chartTitle}</h2>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1c3a5a" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => formatShortDate(value, localeTag)}
              stroke="#8aa0b8"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              allowDataOverflow
              stroke="#8aa0b8"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(value) => formatShortDate(value, localeTag)}
              formatter={(value, name) => [`${Math.round(value)}`, name]}
            />
            <Legend />
            <Line type="monotone" dataKey="sleep" name={t('history.sleep')} stroke="#3ba7ff" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="mood" name={t('history.mood')} stroke="#3dd68c" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="stress" name={t('history.stress')} stroke="#f0b429" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="fatigue" name={t('history.fatigue')} stroke="#f25c5c" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 font-mono text-[10px] tracking-[0.12em] text-hud-muted">{t('dashboard.trendCaption')}</p>
    </section>
  )
}

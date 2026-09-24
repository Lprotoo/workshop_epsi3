import { useEffect, useState } from 'react'
import { Brain, Moon, Smile, Zap } from 'lucide-react'
import MetricCard from '../components/Dashboard/MetricCard'
import RecommendationCard from '../components/Dashboard/RecommendationCard'
import StatusCard from '../components/Dashboard/StatusCard'
import TrendChart from '../components/Dashboard/TrendChart'
import { useLanguage } from '../i18n/LanguageContext'
import { getDashboardData } from '../services/api'
import { formatHours, formatDate, formatOutOfTen, sleepChartScore, toTen } from '../utils/format'
import { metricTone } from '../utils/status'

export default function Dashboard() {
  const { t, localeTag } = useLanguage()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getDashboardData()
      .then((result) => {
        if (active) setData(result)
      })
      .catch(() => {
        if (active) setError(t('dashboard.error'))
      })
    return () => {
      active = false
    }
  }, [t])

  if (error) {
    return <p className="text-status-alert">{error}</p>
  }

  if (!data) {
    return <p className="font-mono text-sm tracking-[0.16em] text-hud-muted">{t('dashboard.loading')}</p>
  }

  const metrics = [
    {
      key: 'sleep',
      label: t('metric.sleep'),
      value: formatHours(data.metrics.sleep_hours),
      percent: sleepChartScore(data.metrics.sleep_hours) * 10,
      icon: Moon,
      tone: metricTone('sleep', data.metrics.sleep_hours),
    },
    {
      key: 'mood',
      label: t('metric.mood'),
      value: formatOutOfTen(toTen(data.metrics.mood)),
      percent: toTen(data.metrics.mood) * 10,
      icon: Smile,
      tone: metricTone('mood', data.metrics.mood),
    },
    {
      key: 'stress',
      label: t('metric.stress'),
      value: formatOutOfTen(toTen(data.metrics.stress)),
      percent: toTen(data.metrics.stress) * 10,
      icon: Brain,
      tone: metricTone('stress', data.metrics.stress),
    },
    {
      key: 'fatigue',
      label: t('metric.fatigue'),
      value: formatOutOfTen(toTen(data.metrics.fatigue)),
      percent: toTen(data.metrics.fatigue) * 10,
      icon: Zap,
      tone: metricTone('fatigue', data.metrics.fatigue),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] tracking-[0.22em] text-hud-accent">{t('dashboard.kicker')}</p>
        <h1 className="mt-1 text-3xl font-semibold">{t('dashboard.title')}</h1>
      </div>

      <StatusCard
        status={data.status}
        dateLabel={data.latest?.date ? formatDate(data.latest.date, localeTag) : t('dashboard.noCheckIn')}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.key} {...metric} />
        ))}
      </div>

      <TrendChart data={data.trend} title={t('dashboard.trend')} />
      <RecommendationCard title={t('dashboard.recommendation')} body={data.recommendation} />
    </div>
  )
}

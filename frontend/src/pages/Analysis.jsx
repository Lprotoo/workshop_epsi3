import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AnalysisStatus from '../components/Analysis/AnalysisStatus'
import ObservationList from '../components/Analysis/ObservationList'
import SportActivitySection from '../components/Analysis/SportActivitySection'
import RecommendationCard from '../components/Dashboard/RecommendationCard'
import { useLanguage } from '../i18n/LanguageContext'
import { getAnalysis, getExercisePlan } from '../services/api'

export default function Analysis() {
  const { t } = useLanguage()
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [sportPlan, setSportPlan] = useState([])
  const [sportLoading, setSportLoading] = useState(true)
  const [sportError, setSportError] = useState('')

  useEffect(() => {
    let active = true
    getAnalysis()
      .then((result) => {
        if (active) setAnalysis(result)
      })
      .catch(() => {
        if (active) setError(t('analysis.error'))
      })
    getExercisePlan()
      .then((data) => {
        if (!active) return
        const items = Boolean(data.triggered) && Array.isArray(data.plan) ? data.plan : []
        setSportPlan(items)
      })
      .catch(() => {
        if (active) setSportError(t('exercise.error'))
      })
      .finally(() => {
        if (active) setSportLoading(false)
      })
    return () => {
      active = false
    }
  }, [t])

  if (error) return <p className="text-status-alert">{error}</p>
  if (!analysis) {
    return <p className="font-mono text-sm tracking-[0.16em] text-hud-muted">{t('analysis.loading')}</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] tracking-[0.22em] text-hud-accent">{t('analysis.kicker')}</p>
        <h1 className="mt-1 text-3xl font-semibold">{t('analysis.title')}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-hud-muted">{t('analysis.intro')}</p>
      </div>

      <AnalysisStatus status={analysis.status} priority={analysis.priority} />
      <ObservationList observations={analysis.observations} />
      <RecommendationCard title={t('analysis.recommendation')} body={analysis.recommendation} />
      <SportActivitySection items={sportPlan} loading={sportLoading} error={sportError} />

      <Link
        to="/history"
        className="inline-flex rounded-lg border border-hud-border px-4 py-2 text-sm text-hud-muted hover:text-white"
      >
        {t('analysis.viewHistory')}
      </Link>
    </div>
  )
}

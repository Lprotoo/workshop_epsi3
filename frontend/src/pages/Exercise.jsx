import { useEffect, useState } from 'react'
import { Dumbbell } from 'lucide-react'
import AnimatedCheckbox from '../components/ui/AnimatedCheckbox'
import { useLanguage } from '../i18n/LanguageContext'
import { getExercisePlan, updateExerciseStatus } from '../services/api'

export default function Exercise() {
  const { t } = useLanguage()
  const [plan, setPlan] = useState([])
  const [triggered, setTriggered] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pending, setPending] = useState('')

  useEffect(() => {
    let active = true
    getExercisePlan()
      .then((data) => {
        if (!active) return
        setTriggered(Boolean(data.triggered))
        setPlan(Array.isArray(data.plan) ? data.plan : [])
      })
      .catch(() => {
        if (active) setError(t('exercise.error'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [t])

  async function toggleItem(category, completed) {
    setPending(category)
    setError('')
    try {
      await updateExerciseStatus(category, completed)
      setPlan((current) =>
        current.map((item) =>
          item.category === category ? { ...item, completed } : item,
        ),
      )
    } catch {
      setError(t('exercise.error'))
    } finally {
      setPending('')
    }
  }

  if (loading) {
    return <p className="font-mono text-sm tracking-[0.16em] text-hud-muted">{t('exercise.loading')}</p>
  }

  const items = triggered ? plan : []

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] tracking-[0.22em] text-hud-accent">{t('exercise.kicker')}</p>
        <h1 className="mt-1 text-3xl font-semibold">{t('exercise.title')}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-hud-muted">{t('exercise.intro')}</p>
      </div>

      {error ? <p className="text-sm text-status-alert">{error}</p> : null}

      {!items.length ? (
        <section className="rounded-xl border border-hud-border bg-hud-panel p-6 text-sm text-hud-muted">
          {t('exercise.empty')}
        </section>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const exercise = item.exercise || {}
            const id = `exercise-${item.category}`
            return (
              <li key={item.category}>
                <AnimatedCheckbox
                  id={id}
                  checked={Boolean(item.completed)}
                  disabled={pending === item.category}
                  onChange={(event) => toggleItem(item.category, event.target.checked)}
                  className="rounded-xl border border-hud-border bg-hud-panel p-5 hover:border-hud-accent/40"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Dumbbell size={14} className="text-hud-accent" />
                      <p className="font-medium text-white">{exercise.name}</p>
                      <span className="font-mono text-[10px] tracking-[0.14em] text-hud-muted">
                        {t(`exercise.categories.${item.category}`)} · {t('exercise.duration', { min: exercise.duration_min })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-hud-muted">{exercise.description}</p>
                  </div>
                </AnimatedCheckbox>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

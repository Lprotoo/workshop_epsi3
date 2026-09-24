import { Link } from 'react-router-dom'
import { Dumbbell } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'

export default function SportActivitySection({ items, loading, error }) {
  const { t } = useLanguage()

  return (
    <section className="rounded-xl border border-hud-border bg-hud-panel p-5">
      <p className="font-mono text-[11px] tracking-[0.22em] text-hud-accent">
        {t('analysis.exercise')}
      </p>
      <p className="mt-2 text-sm leading-6 text-hud-muted">{t('analysis.sportIntro')}</p>

      {loading ? (
        <p className="mt-4 font-mono text-xs tracking-[0.16em] text-hud-muted">
          {t('exercise.loading')}
        </p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-status-alert">{error}</p> : null}

      {!loading && !error && !items.length ? (
        <p className="mt-4 text-sm text-hud-muted">{t('analysis.sportEmpty')}</p>
      ) : null}

      {!loading && items.length ? (
        <ul className="mt-4 space-y-3">
          {items.map((item) => {
            const exercise = item.exercise || {}
            return (
              <li
                key={item.category}
                className="rounded-lg border border-hud-border bg-hud-raised/40 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Dumbbell size={14} className="text-hud-accent" />
                  <p className="font-medium text-white">{exercise.name}</p>
                  <span className="font-mono text-[10px] tracking-[0.14em] text-hud-muted">
                    {t(`exercise.categories.${item.category}`)} ·{' '}
                    {t('exercise.duration', { min: exercise.duration_min })}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-hud-muted">{exercise.description}</p>
              </li>
            )
          })}
        </ul>
      ) : null}

      <Link
        to="/exercise"
        className="mt-5 inline-flex rounded-lg border border-hud-accent/40 bg-hud-accent/15 px-4 py-2 text-sm text-white hover:bg-hud-accent/25"
      >
        {t('analysis.sportOpen')}
      </Link>
    </section>
  )
}

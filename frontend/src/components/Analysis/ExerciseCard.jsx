import { useState } from 'react'
import { Play } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'

export default function ExerciseCard({ exercise }) {
  const { t } = useLanguage()
  const [started, setStarted] = useState(false)

  return (
    <section className="rounded-xl border border-hud-border bg-hud-panel p-5">
      <h2 className="font-mono text-[11px] tracking-[0.22em] text-hud-muted">{t('analysis.exercise')}</h2>
      <h3 className="mt-3 text-xl font-semibold">{t.maybe(exercise.title)}</h3>
      <p className="mt-2 text-sm leading-6 text-hud-muted">{t.maybe(exercise.description)}</p>
      <button
        type="button"
        onClick={() => setStarted(true)}
        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-hud-accent/40 bg-hud-accent/15 px-4 py-2 text-sm text-white hover:bg-hud-accent/25"
      >
        <Play size={14} />
        {started ? t('analysis.inProgress') : t('analysis.start')}
      </button>
      {started ? <p className="mt-3 text-sm text-status-stable">{t('analysis.breathing')}</p> : null}
    </section>
  )
}

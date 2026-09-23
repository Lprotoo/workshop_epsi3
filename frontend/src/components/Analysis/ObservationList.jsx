import { useLanguage } from '../../i18n/LanguageContext'

export default function ObservationList({ observations }) {
  const { t } = useLanguage()

  return (
    <section className="rounded-xl border border-hud-border bg-hud-panel p-5">
      <h2 className="font-mono text-[11px] tracking-[0.22em] text-hud-muted">{t('analysis.observations')}</h2>
      <ul className="mt-4 space-y-3">
            {observations.map((item) => (
          <li key={item} className="flex gap-3 text-sm text-hud-muted">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-hud-accent" />
            {t.maybe(item)}
          </li>
        ))}
      </ul>
    </section>
  )
}

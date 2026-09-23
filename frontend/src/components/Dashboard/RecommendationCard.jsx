import { useLanguage } from '../../i18n/LanguageContext'

export default function RecommendationCard({ title, body }) {
  const { t } = useLanguage()
  const heading = title || t('dashboard.recommendation')

  return (
    <section className="rounded-xl border border-hud-accent/30 bg-gradient-to-r from-hud-panel to-hud-raised p-5">
      <p className="font-mono text-[11px] tracking-[0.22em] text-hud-accent">{heading.toUpperCase()}</p>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-hud-muted">{t.maybe(body)}</p>
    </section>
  )
}

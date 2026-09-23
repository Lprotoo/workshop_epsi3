import { useLanguage } from '../../i18n/LanguageContext'
import { STATUS_CLASSES } from '../../utils/status'

export default function AnalysisStatus({ status, priority }) {
  const { t } = useLanguage()

  return (
    <section className="grid gap-4 md:grid-cols-2">
      <article className="rounded-xl border border-hud-border bg-hud-panel p-5">
        <p className="font-mono text-[11px] tracking-[0.22em] text-hud-muted">{t('analysis.status')}</p>
        <p className="mt-3 text-3xl font-semibold tracking-[0.1em]">
          {t(`status.${status || 'attention'}`).toUpperCase()}
        </p>
        <span className={`mt-4 inline-flex rounded-full border px-3 py-1 font-mono text-[11px] ${STATUS_CLASSES[status]}`}>
          {t('analysis.indicatorOnly')}
        </span>
      </article>
      <article className="rounded-xl border border-hud-border bg-hud-panel p-5">
        <p className="font-mono text-[11px] tracking-[0.22em] text-hud-muted">{t('analysis.priority')}</p>
        <p className="mt-3 text-3xl font-semibold tracking-[0.1em]">
          {t(`analysis.${priority || 'medium'}`).toUpperCase()}
        </p>
        <p className="mt-4 text-sm text-hud-muted">{t('analysis.priorityHint')}</p>
      </article>
    </section>
  )
}

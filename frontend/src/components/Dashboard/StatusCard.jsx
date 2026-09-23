import { useLanguage } from '../../i18n/LanguageContext'
import { STATUS_CLASSES } from '../../utils/status'

const STATUS_GLOW = {
  stable: 'bg-[radial-gradient(circle_at_right,rgba(61,214,140,0.14),transparent_55%)]',
  attention: 'bg-[radial-gradient(circle_at_right,rgba(240,180,41,0.14),transparent_55%)]',
  alert: 'bg-[radial-gradient(circle_at_right,rgba(242,92,92,0.14),transparent_55%)]',
}

export default function StatusCard({ status, dateLabel }) {
  const { t } = useLanguage()
  const tone = STATUS_CLASSES[status] ?? STATUS_CLASSES.stable

  return (
    <section className="relative overflow-hidden rounded-xl border border-hud-border bg-hud-panel p-6 shadow-[0_0_40px_rgba(59,167,255,0.06)]">
      <div className={`absolute inset-y-0 right-0 w-1/2 ${STATUS_GLOW[status] ?? STATUS_GLOW.stable}`} />
      <p className="font-mono text-[11px] tracking-[0.22em] text-hud-muted">{t('dashboard.statusTitle')}</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h2 className="text-4xl font-semibold tracking-[0.12em] sm:text-5xl">
          {t(`status.${status || 'stable'}`).toUpperCase()}
        </h2>
        <span className={`rounded-full border px-3 py-1 font-mono text-[11px] tracking-[0.16em] ${tone}`}>
          {dateLabel}
        </span>
      </div>
      <p className="relative mt-4 max-w-2xl text-sm text-hud-muted">{t('dashboard.statusBody')}</p>
    </section>
  )
}

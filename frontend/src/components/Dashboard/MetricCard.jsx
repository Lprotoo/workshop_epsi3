import { useLanguage } from '../../i18n/LanguageContext'
import { STATUS_CLASSES } from '../../utils/status'

export default function MetricCard({ icon: Icon, label, value, percent, tone }) {
  const { t } = useLanguage()
  const width = Math.max(4, Math.min(100, percent))

  return (
    <article className="rounded-xl border border-hud-border bg-hud-panel p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-[0.16em] text-hud-muted">{label}</span>
        <Icon size={16} className="text-hud-accent" />
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-hud-raised">
        <div
          className={`h-full rounded-full ${
            tone === 'alert'
              ? 'bg-status-alert'
              : tone === 'attention'
                ? 'bg-status-attention'
                : 'bg-status-stable'
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
      <span className={`mt-3 inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] ${STATUS_CLASSES[tone]}`}>
        {t(`metric.${tone}`)}
      </span>
    </article>
  )
}

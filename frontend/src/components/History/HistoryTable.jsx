import { useLanguage } from '../../i18n/LanguageContext'
import { formatDate, formatHours, formatOutOfTen } from '../../utils/format'
import { STATUS_CLASSES } from '../../utils/status'

export default function HistoryTable({ entries }) {
  const { t, localeTag } = useLanguage()

  return (
    <section className="overflow-hidden rounded-xl border border-hud-border bg-hud-panel">
      <div className="border-b border-hud-border px-5 py-4">
        <h2 className="font-mono text-[11px] tracking-[0.22em] text-hud-muted">{t('history.table')}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-hud-raised font-mono text-[11px] tracking-[0.14em] text-hud-muted">
            <tr>
              <th className="px-4 py-3">{t('history.date')}</th>
              <th className="px-4 py-3">{t('history.sleep')}</th>
              <th className="px-4 py-3">{t('history.quality')}</th>
              <th className="px-4 py-3">{t('history.mood')}</th>
              <th className="px-4 py-3">{t('history.stress')}</th>
              <th className="px-4 py-3">{t('history.fatigue')}</th>
              <th className="px-4 py-3">{t('history.flags')}</th>
              <th className="px-4 py-3">{t('history.status')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-hud-border/70">
                <td className="px-4 py-3">{formatDate(entry.date, localeTag)}</td>
                <td className="px-4 py-3">{formatHours(entry.sleep_hours)}</td>
                <td className="px-4 py-3">{t(`quality.${entry.sleep_quality}`)}</td>
                <td className="px-4 py-3">{formatOutOfTen(entry.mood)}</td>
                <td className="px-4 py-3">{formatOutOfTen(entry.stress)}</td>
                <td className="px-4 py-3">{formatOutOfTen(entry.fatigue)}</td>
                <td className="px-4 py-3">
                  {entry.flags?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {entry.flags.slice(0, 3).map((flag) => (
                        <span
                          key={flag}
                          className="rounded-full border border-status-attention/30 bg-status-attention/10 px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] text-status-attention"
                        >
                          {t.maybe(flag)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-hud-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] ${STATUS_CLASSES[entry.status]}`}>
                    {t(`status.${entry.status}`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

import { useLanguage } from '../../i18n/LanguageContext'
import { formatDate, formatTime } from '../../utils/format'

export default function HistoryClaims({ claims }) {
  const { t, localeTag } = useLanguage()

  return (
    <section className="overflow-hidden rounded-xl border border-hud-border bg-hud-panel">
      <div className="border-b border-hud-border px-5 py-4">
        <h2 className="font-mono text-[11px] tracking-[0.22em] text-hud-muted">{t('history.claimsTable')}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-hud-raised font-mono text-[11px] tracking-[0.14em] text-hud-muted">
            <tr>
              <th className="px-4 py-3">{t('history.date')}</th>
              <th className="px-4 py-3">{t('history.time')}</th>
              <th className="px-4 py-3">{t('history.medCode')}</th>
              <th className="px-4 py-3">{t('history.medName')}</th>
            </tr>
          </thead>
          <tbody>
            {claims.length ? (
              claims.map((claim) => {
                const stamp = claim.claim_timestamp || claim.timestamp
                return (
                  <tr key={`${claim.code}-${stamp}`} className="border-t border-hud-border/70">
                    <td className="px-4 py-3">{formatDate(stamp, localeTag)}</td>
                    <td className="px-4 py-3 font-mono">{formatTime(stamp, localeTag)}</td>
                    <td className="px-4 py-3 font-mono tracking-[0.12em] text-hud-accent">{claim.code}</td>
                    <td className="px-4 py-3">{claim.medication_name}</td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-hud-muted" colSpan={4}>
                  {t('history.noClaims')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

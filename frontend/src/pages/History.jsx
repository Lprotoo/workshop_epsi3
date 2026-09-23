import { useEffect, useState } from 'react'
import HistoryChart from '../components/History/HistoryChart'
import HistoryClaims from '../components/History/HistoryClaims'
import HistoryTable from '../components/History/HistoryTable'
import { useLanguage } from '../i18n/LanguageContext'
import { getHistory } from '../services/api'

export default function History() {
  const { t } = useLanguage()
  const [range, setRange] = useState(7)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setData(null)
    getHistory(range)
      .then((result) => {
        if (active) setData(result)
      })
      .catch(() => {
        if (active) setError(t('history.error'))
      })
    return () => {
      active = false
    }
  }, [range, t])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-hud-accent">{t('history.kicker')}</p>
          <h1 className="mt-1 text-3xl font-semibold">{t('history.title')}</h1>
        </div>
        <div className="flex rounded-lg border border-hud-border bg-hud-panel p-1">
          {[7, 30].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRange(days)}
              className={`rounded-md px-3 py-1.5 font-mono text-xs tracking-[0.12em] ${
                range === days ? 'bg-hud-accent/20 text-white' : 'text-hud-muted'
              }`}
            >
              {t('history.days', { days })}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-status-alert">{error}</p> : null}
      {!data && !error ? (
        <p className="font-mono text-sm tracking-[0.16em] text-hud-muted">{t('history.loading')}</p>
      ) : null}
      {data ? (
        <>
          <HistoryChart data={data.chart} range={range} />
          <HistoryTable entries={data.entries} />
          <HistoryClaims claims={data.claims || []} />
        </>
      ) : null}
    </div>
  )
}

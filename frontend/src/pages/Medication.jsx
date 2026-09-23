import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pill } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { claimMedication, getAllMedications, getMedicationInfo } from '../services/api'

const EXAMPLE_CODES = {
  1: '100000',
  2: '212345',
  3: '367890',
  4: '454321',
  5: '598765',
  6: '611223',
  7: '777888',
  8: '845678',
  9: '999000',
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 6)
}

export default function Medication() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const [code, setCode] = useState(() => digitsOnly(searchParams.get('code')))
  const [medications, setMedications] = useState([])
  const [info, setInfo] = useState(null)
  const [checking, setChecking] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')
  const [listError, setListError] = useState('')

  const canClaim = code.length === 6 && Boolean(info) && !claiming

  useEffect(() => {
    let active = true
    getAllMedications()
      .then((list) => {
        if (active) setMedications(list)
      })
      .catch(() => {
        if (active) setListError(t('medication.listError'))
      })
    return () => {
      active = false
    }
  }, [t])

  useEffect(() => {
    const preset = digitsOnly(searchParams.get('code'))
    if (preset) setCode(preset)
  }, [searchParams])

  useEffect(() => {
    if (code.length !== 6) {
      setInfo(null)
      return undefined
    }

    let active = true
    setChecking(true)
    getMedicationInfo(code)
      .then((medication) => {
        if (active) setInfo(medication)
      })
      .catch(() => {
        if (active) setInfo(null)
      })
      .finally(() => {
        if (active) setChecking(false)
      })

    return () => {
      active = false
    }
  }, [code])

  async function handleClaim(event) {
    event.preventDefault()
    if (!canClaim) return

    setClaiming(true)
    setError('')
    setSuccess(null)
    try {
      const result = await claimMedication(code)
      if (result.success) {
        setSuccess(result)
        setCode('')
        setInfo(null)
      } else {
        setError(result.message || t('medication.claimFailed'))
      }
    } catch (err) {
      setError(err.message || t('medication.claimFailed'))
    } finally {
      setClaiming(false)
    }
  }

  function selectMedication(id) {
    const next = EXAMPLE_CODES[id]
    if (next) {
      setSuccess(null)
      setError('')
      setCode(next)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="font-mono text-[11px] tracking-[0.22em] text-hud-accent">{t('medication.kicker')}</p>
        <h1 className="mt-1 text-3xl font-semibold">{t('medication.title')}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-hud-muted">{t('medication.intro')}</p>
      </div>

      <section className="rounded-xl border border-hud-border bg-hud-panel p-5">
        <p className="text-sm text-hud-muted">{t('medication.howto')}</p>
        <p className="mt-2 font-mono text-xs text-hud-accent">{t('medication.examples')}</p>
      </section>

      <form className="space-y-4 rounded-xl border border-hud-border bg-hud-panel p-5" onSubmit={handleClaim}>
        <h2 className="font-mono text-[11px] tracking-[0.22em] text-hud-muted">{t('medication.codeTitle')}</h2>
        <div className="flex flex-wrap gap-3">
          <input
            id="medication-code"
            value={code}
            onChange={(event) => {
              setSuccess(null)
              setError('')
              setCode(digitsOnly(event.target.value))
            }}
            inputMode="numeric"
            maxLength={6}
            placeholder={t('medication.placeholder')}
            className="min-w-[200px] flex-1 rounded-lg border border-hud-border bg-hud-bg px-4 py-3 font-mono text-lg tracking-[0.2em] text-hud-accent outline-none focus:border-hud-accent"
          />
          <button
            type="submit"
            disabled={!canClaim}
            className="rounded-lg border border-hud-accent/50 bg-hud-accent/20 px-6 py-3 text-sm font-medium hover:bg-hud-accent/30 disabled:cursor-not-allowed disabled:border-hud-border disabled:bg-hud-raised disabled:text-hud-muted"
          >
            {claiming ? t('medication.processing') : checking ? t('medication.checking') : t('medication.claim')}
          </button>
        </div>

        {info ? (
          <div className="rounded-lg border border-status-stable/40 bg-status-stable/10 px-4 py-3">
            <p className="font-mono text-[11px] tracking-[0.16em] text-status-stable">{t('medication.valid')}</p>
            <p className="mt-1 text-sm">
              {info.name} (ID: {info.id})
            </p>
          </div>
        ) : null}
      </form>

      {success ? (
        <section className="rounded-xl border border-status-stable/40 bg-status-stable/10 p-6 text-center">
          <Pill className="mx-auto text-status-stable" size={32} />
          <h2 className="mt-3 text-2xl font-semibold">{t('medication.delivered')}</h2>
          <p className="mt-2 text-sm text-hud-muted">{success.message}</p>
          {success.medication_info ? (
            <dl className="mx-auto mt-5 max-w-md space-y-2 text-left text-sm">
              <div className="flex justify-between border-b border-hud-border/70 py-2">
                <dt className="text-hud-muted">{t('medication.type')}</dt>
                <dd>{success.medication_info.name}</dd>
              </div>
              <div className="flex justify-between border-b border-hud-border/70 py-2">
                <dt className="text-hud-muted">{t('medication.id')}</dt>
                <dd>{success.medication_info.id}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-hud-muted">{t('medication.description')}</dt>
                <dd className="max-w-[60%] text-right">{success.medication_info.description}</dd>
              </div>
            </dl>
          ) : null}
        </section>
      ) : null}

      {error ? (
        <section className="rounded-xl border border-status-alert/40 bg-status-alert/10 p-5">
          <h2 className="font-semibold text-status-alert">{t('medication.errorTitle')}</h2>
          <p className="mt-2 text-sm text-hud-muted">{error}</p>
        </section>
      ) : null}

      <section>
        <h2 className="font-mono text-[11px] tracking-[0.22em] text-hud-muted">{t('medication.listTitle')}</h2>
        <p className="mt-2 text-sm text-hud-muted">{t('medication.listHint')}</p>
        {listError ? <p className="mt-3 text-sm text-status-alert">{listError}</p> : null}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {medications.map((med) => (
            <article key={med.id} className="rounded-xl border border-hud-border bg-hud-panel p-4">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-hud-accent/40 bg-hud-accent/15 font-mono text-sm text-hud-accent">
                {med.id}
              </span>
              <h3 className="mt-3 text-base font-semibold">{med.name}</h3>
              <p className="mt-2 text-sm text-hud-muted">{med.description}</p>
              <button
                type="button"
                onClick={() => selectMedication(med.id)}
                className="mt-4 w-full rounded-lg border border-hud-accent/40 bg-hud-accent/15 px-3 py-2 text-sm hover:bg-hud-accent/25"
              >
                {t('medication.select')}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

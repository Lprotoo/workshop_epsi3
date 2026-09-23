import { useState } from 'react'
import { Link } from 'react-router-dom'
import AnalysisStatus from '../components/Analysis/AnalysisStatus'
import ObservationList from '../components/Analysis/ObservationList'
import ChoiceField from '../components/Questionnaire/ChoiceField'
import SliderField from '../components/Questionnaire/SliderField'
import { useLanguage } from '../i18n/LanguageContext'
import { submitCheckIn } from '../services/api'
import { formatHours } from '../utils/format'

const initialForm = {
  sleep_hours: 7,
  sleep_quality: 3,
  mood: 5,
  stress: 5,
  fatigue: 5,
  energy_level: 5,
  head_symptoms: 'aucun',
  microgravity_symptoms: 'aucun',
  exercise_discomfort: 'aucun',
  mild_symptoms: 'aucun',
  sleep_difficulties: 'aucun',
  vigilance_level: 'normal',
  hydration_goal: 'oui',
  caloric_intake: 'oui',
  digestive_issues: 'aucun',
  crew_mood: 'bonne',
  social_needs: 'equilibre',
  environment_anomalies: 'aucun',
  incident_report: '',
}

export default function Questionnaire() {
  const { t } = useLanguage()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [result, setResult] = useState(null)

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validate(current) {
    const next = {}
    if (current.sleep_hours < 0 || current.sleep_hours > 12) next.sleep_hours = t('questionnaire.errSleep')
    if (![1, 2, 3, 4].includes(current.sleep_quality)) next.sleep_quality = t('questionnaire.errQuality')
    ;['mood', 'stress', 'fatigue'].forEach((key) => {
      if (current[key] < 0 || current[key] > 100) next[key] = t('questionnaire.errPercent')
    })
    if (current.energy_level < 1 || current.energy_level > 10) next.energy_level = t('questionnaire.errEnergy')
    if (current.incident_report.length > 600) next.incident_report = t('questionnaire.errIncident')
    return next
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    setResult(null)
    setSubmitError('')
    try {
      const response = await submitCheckIn({
        ...form,
        stress_level: Math.max(1, Math.min(10, Math.round(form.stress / 10) || 1)),
        incident_report: form.incident_report.trim() || null,
      })
      setResult(response)
    } catch (error) {
      setSubmitError(error.message || t('questionnaire.submitError'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="mx-auto max-w-xl rounded-xl border border-hud-accent/40 bg-hud-panel p-8 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-hud-border border-t-hud-accent" />
        <p className="mt-5 font-mono text-sm tracking-[0.2em] text-hud-accent">{t('questionnaire.analyzing')}</p>
        <p className="mt-2 text-sm text-hud-muted">{t('questionnaire.analyzingHint')}</p>
      </section>
    )
  }

  if (result) {
    return (
      <div className="space-y-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-status-stable">{t('questionnaire.recorded')}</p>
          <h1 className="mt-1 text-3xl font-semibold">{t('questionnaire.complete')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-hud-muted">{t('questionnaire.stored')}</p>
        </div>
        <AnalysisStatus status={result.analysis.status} priority={result.analysis.priority} />
        <ObservationList observations={result.analysis.observations} />
        <section className="rounded-xl border border-hud-accent/30 bg-hud-panel p-5">
          <p className="font-mono text-[11px] tracking-[0.22em] text-hud-accent">{t('analysis.recommendation').toUpperCase()}</p>
          <p className="mt-3 text-sm leading-6 text-hud-muted">
            {t.maybe(result.analysis.recommendation)}
          </p>
        </section>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/analysis"
            className="rounded-lg border border-hud-accent/40 bg-hud-accent/15 px-4 py-2 text-sm"
          >
            {t('questionnaire.openAnalysis')}
          </Link>
          <Link
            to="/chat"
            className="rounded-lg border border-hud-border px-4 py-2 text-sm text-hud-muted hover:text-white"
          >
            {t('questionnaire.askAssistant')}
          </Link>
          <button
            type="button"
            onClick={() => setResult(null)}
            className="rounded-lg border border-hud-border px-4 py-2 text-sm text-hud-muted"
          >
            {t('questionnaire.another')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <form className="mx-auto max-w-3xl space-y-5" onSubmit={handleSubmit}>
      <div>
        <h1 className="text-3xl font-semibold tracking-wide">{t('questionnaire.title')}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-hud-muted">{t('questionnaire.intro')}</p>
      </div>

      {submitError ? <p className="text-sm text-status-alert">{submitError}</p> : null}

      <Section className="questionnaire-section" title={t('questionnaire.indicators')}>
        <SliderField
          id="sleep_hours"
          label={t('questionnaire.sleepHours')}
          value={form.sleep_hours}
          min={0}
          max={12}
          step={5 / 60}
          display={formatHours(form.sleep_hours)}
          hint={t('questionnaire.sleepHint')}
          onChange={(value) => updateField('sleep_hours', Math.round(value * 12) / 12)}
          error={errors.sleep_hours}
        />
        <ChoiceField
          label={t('questionnaire.sleepQuality')}
          value={form.sleep_quality}
          options={[
            { value: 1, label: t('quality.1') },
            { value: 2, label: t('quality.2') },
            { value: 3, label: t('quality.3') },
            { value: 4, label: t('quality.4') },
          ]}
          onChange={(value) => updateField('sleep_quality', value)}
          error={errors.sleep_quality}
        />
        <SliderField
          id="mood"
          label={t('questionnaire.mood')}
          value={form.mood}
          hint={t('questionnaire.moodHint')}
          onChange={(value) => updateField('mood', value)}
          error={errors.mood}
        />
        <SliderField
          id="stress"
          label={t('questionnaire.stress')}
          value={form.stress}
          hint={t('questionnaire.stressHint')}
          onChange={(value) => updateField('stress', value)}
          error={errors.stress}
        />
        <SliderField
          id="fatigue"
          label={t('questionnaire.fatigue')}
          value={form.fatigue}
          hint={t('questionnaire.fatigueHint')}
          onChange={(value) => updateField('fatigue', value)}
          error={errors.fatigue}
        />
      </Section>

      <Section className="questionnaire-section" title={t('questionnaire.physical')}>
        <SliderField
          id="energy_level"
          label={t('questionnaire.energy')}
          value={form.energy_level}
          min={1}
          max={10}
          hint={t('questionnaire.energyHint')}
          onChange={(value) => updateField('energy_level', value)}
          error={errors.energy_level}
        />
        <ChoiceField
          label={t('questionnaire.head')}
          value={form.head_symptoms}
          options={[
            { value: 'aucun', label: t('opt.none') },
            { value: 'cephalees', label: t('opt.headache') },
            { value: 'troubles_vision', label: t('opt.vision') },
            { value: 'pression', label: t('opt.pressure') },
            { value: 'plusieurs', label: t('opt.several') },
          ]}
          onChange={(value) => updateField('head_symptoms', value)}
        />
        <ChoiceField
          label={t('questionnaire.microgravity')}
          value={form.microgravity_symptoms}
          options={[
            { value: 'aucun', label: t('opt.none') },
            { value: 'nausees', label: t('opt.nausea') },
            { value: 'desorientation', label: t('opt.disorientation') },
            { value: 'vertiges', label: t('opt.vertigo') },
            { value: 'plusieurs', label: t('opt.several') },
          ]}
          onChange={(value) => updateField('microgravity_symptoms', value)}
        />
        <ChoiceField
          label={t('questionnaire.exercise')}
          value={form.exercise_discomfort}
          options={[
            { value: 'aucun', label: t('opt.none') },
            { value: 'douleurs_articulaires', label: t('opt.joint') },
            { value: 'essoufflement', label: t('opt.breathless') },
            { value: 'fatigue_extreme', label: t('opt.extremeFatigue') },
            { value: 'autre', label: t('opt.other') },
          ]}
          onChange={(value) => updateField('exercise_discomfort', value)}
        />
        <ChoiceField
          label={t('questionnaire.mild')}
          value={form.mild_symptoms}
          options={[
            { value: 'aucun', label: t('opt.none') },
            { value: 'eruptions', label: t('opt.rash') },
            { value: 'irritations_oculaires', label: t('opt.eye') },
            { value: 'secheresse', label: t('opt.dryness') },
            { value: 'saignements', label: t('opt.nosebleed') },
            { value: 'plusieurs', label: t('opt.several') },
          ]}
          onChange={(value) => updateField('mild_symptoms', value)}
        />
      </Section>

      <Section className="questionnaire-section" title={t('questionnaire.sleep')}>
        <ChoiceField
          label={t('questionnaire.sleepDiff')}
          value={form.sleep_difficulties}
          options={[
            { value: 'aucun', label: t('opt.sleptWell') },
            { value: 'difficulte_endormissement', label: t('opt.hardSleep') },
            { value: 'reveils_frequents', label: t('opt.wakeups') },
            { value: 'les_deux', label: t('opt.both') },
          ]}
          onChange={(value) => updateField('sleep_difficulties', value)}
        />
        <ChoiceField
          label={t('questionnaire.vigilance')}
          value={form.vigilance_level}
          options={[
            { value: 'vigilant', label: t('opt.sharp') },
            { value: 'normal', label: t('opt.normal') },
            { value: 'somnolent', label: t('opt.drowsy') },
            { value: 'baisse_concentration', label: t('opt.lowFocus') },
            { value: 'fatigue_mentale', label: t('opt.mentalFatigue') },
          ]}
          onChange={(value) => updateField('vigilance_level', value)}
        />
      </Section>

      <Section className="questionnaire-section" title={t('questionnaire.nutrition')}>
        <ChoiceField
          label={t('questionnaire.hydration')}
          value={form.hydration_goal}
          options={[
            { value: 'oui', label: t('opt.met') },
            { value: 'presque', label: t('opt.almost') },
            { value: 'partiellement', label: t('opt.partial') },
            { value: 'non', label: t('opt.under') },
          ]}
          onChange={(value) => updateField('hydration_goal', value)}
        />
        <ChoiceField
          label={t('questionnaire.calories')}
          value={form.caloric_intake}
          options={[
            { value: 'oui', label: t('opt.complete') },
            { value: 'presque', label: t('opt.almost') },
            { value: 'partiellement', label: t('opt.partial') },
            { value: 'non', label: t('opt.under') },
          ]}
          onChange={(value) => updateField('caloric_intake', value)}
        />
        <ChoiceField
          label={t('questionnaire.digestive')}
          value={form.digestive_issues}
          options={[
            { value: 'aucun', label: t('opt.none') },
            { value: 'nausees', label: t('opt.nausea') },
            { value: 'perte_appetit', label: t('opt.lowAppetite') },
            { value: 'ballonnements', label: t('opt.bloating') },
            { value: 'autre', label: t('opt.other') },
          ]}
          onChange={(value) => updateField('digestive_issues', value)}
        />
      </Section>

      <Section className="questionnaire-section" title={t('questionnaire.crew')}>
        <ChoiceField
          label={t('questionnaire.crewMood')}
          value={form.crew_mood}
          options={[
            { value: 'excellente', label: t('opt.excellent') },
            { value: 'bonne', label: t('opt.good') },
            { value: 'neutre', label: t('opt.neutral') },
            { value: 'tendue', label: t('opt.tense') },
            { value: 'conflits', label: t('opt.conflict') },
          ]}
          onChange={(value) => updateField('crew_mood', value)}
        />
        <ChoiceField
          label={t('questionnaire.social')}
          value={form.social_needs}
          options={[
            { value: 'equilibre', label: t('opt.balanced') },
            { value: 'besoin_isolement', label: t('opt.isolation') },
            { value: 'manque_soutien', label: t('opt.support') },
            { value: 'les_deux', label: t('opt.both') },
          ]}
          onChange={(value) => updateField('social_needs', value)}
        />
      </Section>

      <Section className="questionnaire-section" title={t('questionnaire.cabin')}>
        <ChoiceField
          label={t('questionnaire.anomalies')}
          value={form.environment_anomalies}
          options={[
            { value: 'aucun', label: t('opt.none') },
            { value: 'bruit', label: t('opt.noise') },
            { value: 'temperature', label: t('opt.temperature') },
            { value: 'odeurs', label: t('opt.odour') },
            { value: 'plusieurs', label: t('opt.several') },
          ]}
          onChange={(value) => updateField('environment_anomalies', value)}
        />
        <label className="block rounded-xl border border-hud-border bg-hud-panel p-4" htmlFor="incident_report">
          <span className="text-sm font-medium">{t('questionnaire.incident')}</span>
          <textarea
            id="incident_report"
            rows={4}
            value={form.incident_report}
            onChange={(event) => updateField('incident_report', event.target.value)}
            placeholder={t('questionnaire.incidentPlaceholder')}
            className="mt-3 w-full resize-y rounded-lg border border-hud-border bg-hud-bg px-3 py-2 text-sm text-white outline-none focus:border-hud-accent"
          />
          {errors.incident_report ? (
            <p className="mt-2 text-xs text-status-alert">{errors.incident_report}</p>
          ) : null}
        </label>
      </Section>

      <button
        type="submit"
        className="w-full rounded-lg border border-hud-accent/50 bg-hud-accent/20 py-3 text-sm font-medium hover:bg-hud-accent/30"
      >
        {t('questionnaire.submit')}
      </button>
    </form>
  )
}

function Section({ title, children, className }) {
  return (
    <section className={className}>
      <h2 className="mb-4 font-mono text-[11px] tracking-[0.22em] text-hud-accent">{title.toUpperCase()}</h2>
      {children}
    </section>
  )
}

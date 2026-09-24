import { deriveStatus } from '../utils/status'
import { toTen } from '../utils/format'

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function asNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const CREW_MOOD = {
  excellente: 92,
  bonne: 78,
  neutre: 62,
  tendue: 38,
  conflits: 18,
}

const VIGILANCE_FATIGUE = {
  vigilant: 18,
  normal: 32,
  somnolent: 58,
  baisse_concentration: 72,
  fatigue_mentale: 88,
}

const SLEEP_QUALITY = {
  aucun: 4,
  difficulte_endormissement: 2,
  reveils_frequents: 2,
  les_deux: 1,
}

const HYDRATION = {
  oui: 0,
  presque: 4,
  partiellement: 8,
  non: 14,
}

function isPresent(value) {
  return Boolean(value) && value !== 'aucun'
}

const HEAD_FLAGS = {
  cephalees: 'opt.headache',
  troubles_vision: 'opt.vision',
  pression: 'opt.pressure',
  plusieurs: 'opt.several',
}
const MICRO_FLAGS = {
  nausees: 'opt.nausea',
  desorientation: 'opt.disorientation',
  vertiges: 'opt.vertigo',
  plusieurs: 'opt.several',
}
const EXERCISE_FLAGS = {
  douleurs_articulaires: 'opt.joint',
  essoufflement: 'opt.breathless',
  fatigue_extreme: 'opt.extremeFatigue',
  autre: 'opt.other',
}
const MILD_FLAGS = {
  eruptions: 'opt.rash',
  irritations_oculaires: 'opt.eye',
  secheresse: 'opt.dryness',
  saignements: 'opt.nosebleed',
  plusieurs: 'opt.several',
}
const SLEEP_FLAGS = {
  difficulte_endormissement: 'opt.hardSleep',
  reveils_frequents: 'opt.wakeups',
  les_deux: 'opt.both',
}
const VIGILANCE_FLAGS = {
  somnolent: 'opt.drowsy',
  baisse_concentration: 'opt.lowFocus',
  fatigue_mentale: 'opt.mentalFatigue',
}
const DIGESTIVE_FLAGS = {
  nausees: 'opt.nausea',
  perte_appetit: 'opt.lowAppetite',
  ballonnements: 'opt.bloating',
  autre: 'opt.other',
}
const CREW_FLAGS = {
  tendue: 'opt.tense',
  conflits: 'opt.conflict',
}
const SOCIAL_FLAGS = {
  besoin_isolement: 'opt.isolation',
  manque_soutien: 'opt.support',
  les_deux: 'opt.both',
}
const ENV_FLAGS = {
  bruit: 'opt.noise',
  temperature: 'opt.temperature',
  odeurs: 'opt.odour',
  plusieurs: 'opt.several',
}

export function collectFlags(response = {}) {
  const flags = []
  if (HEAD_FLAGS[response.head_symptoms]) flags.push(HEAD_FLAGS[response.head_symptoms])
  if (MICRO_FLAGS[response.microgravity_symptoms]) flags.push(MICRO_FLAGS[response.microgravity_symptoms])
  if (EXERCISE_FLAGS[response.exercise_discomfort]) flags.push(EXERCISE_FLAGS[response.exercise_discomfort])
  if (MILD_FLAGS[response.mild_symptoms]) flags.push(MILD_FLAGS[response.mild_symptoms])
  if (SLEEP_FLAGS[response.sleep_difficulties]) flags.push(SLEEP_FLAGS[response.sleep_difficulties])
  if (VIGILANCE_FLAGS[response.vigilance_level]) flags.push(VIGILANCE_FLAGS[response.vigilance_level])
  if (['partiellement', 'non'].includes(response.hydration_goal)) flags.push('flag.lowHydration')
  if (['partiellement', 'non'].includes(response.caloric_intake)) flags.push('flag.lowCalories')
  if (DIGESTIVE_FLAGS[response.digestive_issues]) flags.push(DIGESTIVE_FLAGS[response.digestive_issues])
  if (CREW_FLAGS[response.crew_mood]) flags.push(CREW_FLAGS[response.crew_mood])
  if (SOCIAL_FLAGS[response.social_needs]) flags.push(SOCIAL_FLAGS[response.social_needs])
  if (ENV_FLAGS[response.environment_anomalies]) flags.push(ENV_FLAGS[response.environment_anomalies])
  if (String(response.incident_report || '').trim()) flags.push('flag.incident')
  return [...new Set(flags)]
}

export function scoreFromAnswers(response = {}) {
  let mood =
    response.mood != null ? asNumber(response.mood, 70) : (CREW_MOOD[response.crew_mood] ?? 70)
  let stress =
    response.stress != null
      ? asNumber(response.stress, 32)
      : Math.round(asNumber(response.stress_level, 4) * 10)
  let fatigue =
    response.fatigue != null
      ? asNumber(response.fatigue, 32)
      : (VIGILANCE_FATIGUE[response.vigilance_level] ?? 32)
  let sleep_quality =
    response.sleep_quality != null
      ? asNumber(response.sleep_quality, 3)
      : (SLEEP_QUALITY[response.sleep_difficulties] ?? 3)

  const energy = asNumber(response.energy_level, 6)
  fatigue += (6 - energy) * 4
  mood += (energy - 6) * 2

  if (isPresent(response.head_symptoms)) {
    const bump = response.head_symptoms === 'plusieurs' ? 14 : 8
    stress += bump
    mood -= 6
  }
  if (isPresent(response.microgravity_symptoms)) {
    fatigue += response.microgravity_symptoms === 'plusieurs' ? 12 : 8
    mood -= 4
  }
  if (response.exercise_discomfort === 'fatigue_extreme') {
    fatigue += 14
  } else if (isPresent(response.exercise_discomfort)) {
    fatigue += 7
  }
  if (isPresent(response.mild_symptoms)) {
    mood -= response.mild_symptoms === 'plusieurs' ? 8 : 4
  }

  if (response.sleep_difficulties === 'les_deux') {
    sleep_quality = Math.min(sleep_quality, 1)
    fatigue += 10
    mood -= 6
  } else if (isPresent(response.sleep_difficulties)) {
    sleep_quality = Math.min(sleep_quality, 2)
    fatigue += 6
  }

  if (response.vigilance_level === 'fatigue_mentale' || response.vigilance_level === 'baisse_concentration') {
    fatigue += 8
    mood -= 5
  } else if (response.vigilance_level === 'somnolent') {
    fatigue += 6
  }

  stress += HYDRATION[response.hydration_goal] ?? 0
  fatigue += HYDRATION[response.caloric_intake] ?? 0
  if (['partiellement', 'non'].includes(response.caloric_intake)) mood -= 5
  if (isPresent(response.digestive_issues)) {
    mood -= 5
    stress += 5
  }

  if (response.crew_mood === 'tendue') {
    mood -= 8
    stress += 10
  } else if (response.crew_mood === 'conflits') {
    mood -= 14
    stress += 16
  } else if (response.crew_mood === 'neutre') {
    mood -= 4
  }

  if (response.social_needs === 'les_deux') {
    mood -= 10
    stress += 8
  } else if (response.social_needs && response.social_needs !== 'equilibre') {
    mood -= 6
    stress += 5
  }

  if (isPresent(response.environment_anomalies)) {
    stress += response.environment_anomalies === 'plusieurs' ? 10 : 6
    sleep_quality = Math.min(sleep_quality, 2)
  }

  if (String(response.incident_report || '').trim()) {
    stress += 10
    mood -= 6
  }

  const sleep_hours = asNumber(response.sleep_hours)

  return {
    sleep_hours,
    sleep_quality: clamp(Math.round(sleep_quality), 1, 4),
    mood: clamp(Math.round(mood), 0, 100),
    stress: clamp(Math.round(stress), 0, 100),
    fatigue: clamp(Math.round(fatigue), 0, 100),
    energy_level: clamp(energy, 1, 10),
    flags: collectFlags(response),
  }
}

export function observationKeys(response = {}, scores) {
  const keys = []
  if (scores.sleep_hours < 6.5) keys.push('obs.lowSleep')
  if (isPresent(response.sleep_difficulties)) keys.push('obs.sleepDifficulty')
  if (scores.energy_level <= 4) keys.push('obs.lowEnergy')
  if (isPresent(response.head_symptoms)) keys.push('obs.headSymptoms')
  if (isPresent(response.microgravity_symptoms)) keys.push('obs.microgravity')
  if (isPresent(response.exercise_discomfort)) keys.push('obs.exercise')
  if (toTen(scores.mood) < 6) keys.push('obs.lowMood')
  if (toTen(scores.stress) > 5) keys.push('obs.highStress')
  if (toTen(scores.fatigue) > 5) keys.push('obs.highFatigue')
  if (['somnolent', 'baisse_concentration', 'fatigue_mentale'].includes(response.vigilance_level)) {
    keys.push('obs.lowVigilance')
  }
  if (['partiellement', 'non'].includes(response.hydration_goal)) keys.push('obs.hydration')
  if (['partiellement', 'non'].includes(response.caloric_intake)) keys.push('obs.calories')
  if (isPresent(response.digestive_issues)) keys.push('obs.digestive')
  if (['tendue', 'conflits'].includes(response.crew_mood)) keys.push('obs.crewTension')
  if (response.social_needs && response.social_needs !== 'equilibre') keys.push('obs.social')
  if (isPresent(response.environment_anomalies)) keys.push('obs.environment')
  if (String(response.incident_report || '').trim()) keys.push('obs.incident')

  return keys.length ? keys.slice(0, 6) : ['obs.nominal']
}

export function recommendationKey(status) {
  if (status === 'alert') return 'obs.recAlert'
  if (status === 'attention') return 'obs.recAttention'
  return 'obs.recStable'
}

export function exerciseFor(status, scores) {
  if (status === 'alert' || toTen(scores.stress) > 7) {
    return { titleKey: 'obs.exGroundingTitle', bodyKey: 'obs.exGroundingBody' }
  }
  if (scores.sleep_hours < 6.5 || toTen(scores.fatigue) > 5.5) {
    return { titleKey: 'obs.exRestTitle', bodyKey: 'obs.exRestBody' }
  }
  return { titleKey: 'obs.exBreathTitle', bodyKey: 'obs.exBreathBody' }
}

export function buildScoredCheckIn(response = {}, analysis = {}) {
  const scores = scoreFromAnswers(response)
  const checkIn = {
    ...scores,
    observations: observationKeys(response, scores),
    raw: response,
  }
  checkIn.status = deriveStatus({
    ...checkIn,
    attentionFlags: checkIn.flags.length,
    alertFlags:
      Number(isPresent(response.head_symptoms) && response.head_symptoms === 'plusieurs') +
      Number(response.exercise_discomfort === 'fatigue_extreme') +
      Number(response.crew_mood === 'conflits') +
      Number(Boolean(String(response.incident_report || '').trim())) +
      Number(asNumber(response.energy_level, 6) <= 3),
  })

  if (analysis?.risk_level) {
    const mapped = { élevé: 'alert', eleve: 'alert', moyen: 'attention', faible: 'stable' }
    const apiStatus = mapped[analysis.risk_level]
    if (apiStatus === 'alert' || (apiStatus === 'attention' && checkIn.status === 'stable')) {
      checkIn.status = apiStatus
    }
  }

  return checkIn
}

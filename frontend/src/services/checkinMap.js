import { sleepChartScore } from '../utils/format'
import {
  buildScoredCheckIn,
  exerciseFor,
  recommendationKey,
} from './scoring'

const LOCAL_KEY = 'psychospace_scored_checkins'

function readLocalCheckIns() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveScoredCheckIn(checkIn) {
  const slim = {
    date: checkIn.date,
    timestamp: checkIn.timestamp,
    sleep_hours: checkIn.sleep_hours,
    sleep_quality: checkIn.sleep_quality,
    mood: checkIn.mood,
    stress: checkIn.stress,
    fatigue: checkIn.fatigue,
    energy_level: checkIn.energy_level,
    flags: checkIn.flags,
    observations: checkIn.observations,
    status: checkIn.status,
    raw: checkIn.raw,
  }
  const next = [slim, ...readLocalCheckIns().filter((item) => item.date !== slim.date)].slice(0, 60)
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
}

function mergeLocal(checkIn) {
  const local = readLocalCheckIns().find(
    (item) => item.date === checkIn.date || (item.timestamp && item.timestamp === checkIn.timestamp),
  )
  if (!local) return checkIn
  return {
    ...checkIn,
    sleep_hours: local.sleep_hours ?? checkIn.sleep_hours,
    sleep_quality: local.sleep_quality ?? checkIn.sleep_quality,
    mood: local.mood ?? checkIn.mood,
    stress: local.stress ?? checkIn.stress,
    fatigue: local.fatigue ?? checkIn.fatigue,
    energy_level: local.energy_level ?? checkIn.energy_level,
    flags: local.flags?.length ? local.flags : checkIn.flags,
    observations: local.observations?.length ? local.observations : checkIn.observations,
    status: local.status || checkIn.status,
    raw: { ...checkIn.raw, ...local.raw },
  }
}

export function pickAnalysis(item = {}) {
  if (item.analysis && Object.keys(item.analysis).length) return item.analysis
  if (item.risk_level || item.psychological_state || item.detected_issues) {
    return {
      risk_level: item.risk_level,
      psychological_state: item.psychological_state,
      detected_issues: item.detected_issues,
      recommendations: item.recommendations,
      exercise_suggestions: item.exercise_suggestions,
    }
  }
  return item
}

export function toCheckIn(response = {}, analysis = {}) {
  const stamp = response.timestamp || response.date || ''
  const date = String(stamp).slice(0, 10)
  const scored = buildScoredCheckIn(response, analysis)

  return mergeLocal({
    id: stamp || `checkin-${date}`,
    date,
    timestamp: stamp,
    ...scored,
  })
}

export function toAnalysis(stored = {}, checkIn) {
  const status = checkIn?.status || 'stable'
  const localObservations = checkIn?.observations?.length
    ? checkIn.observations
    : ['obs.nominal']
  const apiIssues = Array.isArray(stored.detected_issues)
    ? stored.detected_issues.filter((item) => typeof item === 'string' && item.trim())
    : []
  const observations = [...localObservations, ...apiIssues].slice(0, 6)

  const apiRecommendation = Array.isArray(stored.recommendations)
    ? stored.recommendations[0]
    : stored.psychological_state
  const exercise = exerciseFor(status, checkIn || {})

  return {
    status,
    priority: status === 'alert' ? 'high' : status === 'attention' ? 'medium' : 'low',
    observations,
    recommendation: apiRecommendation || recommendationKey(status),
    recommendationKey: recommendationKey(status),
    exercise: {
      title: stored.exercise_suggestions?.[0] || exercise.titleKey,
      description: stored.exercise_suggestions?.slice(1).join('. ') || exercise.bodyKey,
      titleKey: exercise.titleKey,
      bodyKey: exercise.bodyKey,
    },
  }
}

export function toChartPoint(entry) {
  return {
    date: entry.date,
    sleep: sleepChartScore(entry.sleep_hours),
    sleepHours: entry.sleep_hours,
    mood: entry.mood,
    stress: entry.stress,
    fatigue: entry.fatigue,
  }
}

export function sortByDateDesc(entries) {
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : -1))
}

export const STATUS_LABELS = {
  stable: 'Stable',
  attention: 'Attention',
  alert: 'Alert',
}

export const STATUS_CLASSES = {
  stable: 'text-status-stable border-status-stable/30 bg-status-stable/10',
  attention: 'text-status-attention border-status-attention/30 bg-status-attention/10',
  alert: 'text-status-alert border-status-alert/30 bg-status-alert/10',
}

export const STATUS_DOT = {
  stable: 'bg-status-stable',
  attention: 'bg-status-attention',
  alert: 'bg-status-alert',
}

function asPercentLike(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return n <= 10 ? n * 10 : n
}

export function deriveStatus({
  mood,
  stress,
  fatigue,
  sleep_hours,
  alertFlags = 0,
  attentionFlags = 0,
}) {
  const moodScore = asPercentLike(mood)
  const stressScore = asPercentLike(stress)
  const fatigueScore = asPercentLike(fatigue)

  const alerts =
    Number(sleep_hours < 5) +
    Number(moodScore < 40) +
    Number(stressScore > 70) +
    Number(fatigueScore > 70) +
    Number(alertFlags)

  const attention =
    Number(sleep_hours < 6.5) +
    Number(moodScore < 60) +
    Number(stressScore > 50) +
    Number(fatigueScore > 50) +
    Number(attentionFlags >= 2)

  if (alerts >= 2 || sleep_hours < 4 || moodScore < 30 || alertFlags >= 2) return 'alert'
  if (attention >= 2 || alerts >= 1 || attentionFlags >= 3) return 'attention'
  return 'stable'
}

export function metricTone(key, value) {
  if (key === 'sleep') {
    if (value >= 7) return 'stable'
    if (value >= 6) return 'attention'
    return 'alert'
  }
  const score = asPercentLike(value)
  if (key === 'mood') {
    if (score >= 65) return 'stable'
    if (score >= 45) return 'attention'
    return 'alert'
  }
  if (score <= 40) return 'stable'
  if (score <= 60) return 'attention'
  return 'alert'
}

export function metricLabel(tone) {
  if (tone === 'stable') return 'Nominal'
  if (tone === 'attention') return 'Watch'
  return 'Elevated'
}

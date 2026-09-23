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

export function deriveStatus({
  mood,
  stress,
  fatigue,
  sleep_hours,
  alertFlags = 0,
  attentionFlags = 0,
}) {
  const alerts =
    Number(sleep_hours < 5) +
    Number(mood < 40) +
    Number(stress > 70) +
    Number(fatigue > 70) +
    Number(alertFlags)

  const attention =
    Number(sleep_hours < 6.5) +
    Number(mood < 60) +
    Number(stress > 50) +
    Number(fatigue > 50) +
    Number(attentionFlags >= 2)

  if (alerts >= 2 || sleep_hours < 4 || mood < 30 || alertFlags >= 2) return 'alert'
  if (attention >= 2 || alerts >= 1 || attentionFlags >= 3) return 'attention'
  return 'stable'
}

export function metricTone(key, value) {
  if (key === 'sleep') {
    if (value >= 7) return 'stable'
    if (value >= 6) return 'attention'
    return 'alert'
  }
  if (key === 'mood') {
    if (value >= 65) return 'stable'
    if (value >= 45) return 'attention'
    return 'alert'
  }
  if (value <= 40) return 'stable'
  if (value <= 60) return 'attention'
  return 'alert'
}

export function metricLabel(tone) {
  if (tone === 'stable') return 'Nominal'
  if (tone === 'attention') return 'Watch'
  return 'Elevated'
}

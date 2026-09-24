export function sleepChartScore(hours) {
  const n = Number(hours)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(10, (n / 7) * 10)
}

export function toTen(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return n <= 10 ? n : n / 10
}

export function formatOutOfTen(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—/10'
  const score = n <= 10 ? n : n / 10
  const rounded = Math.round(score * 10) / 10
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}/10`
}

export function formatHours(hours) {
  const totalMinutes = Math.round(Number(hours) * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}h ${String(m).padStart(2, '0')}m`
}

function parseDate(isoDate) {
  if (!isoDate) return new Date(NaN)
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return new Date(`${isoDate}T12:00:00`)
  }
  return new Date(isoDate)
}

export function formatTime(isoDate, localeTag = 'fr-FR') {
  const date = parseDate(isoDate)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString(localeTag, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(isoDate, localeTag = 'fr-FR') {
  return parseDate(isoDate).toLocaleDateString(localeTag, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatShortDate(isoDate, localeTag = 'fr-FR') {
  return parseDate(isoDate).toLocaleDateString(localeTag, {
    day: '2-digit',
    month: 'short',
  })
}

export function todayIso() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export function sleepQualityLabel(value, t) {
  if (t) return t(`quality.${value}`) === `quality.${value}` ? t('quality.unknown') : t(`quality.${value}`)
  const labels = {
    1: 'Mauvaise',
    2: 'Moyenne',
    3: 'Bonne',
    4: 'Excellente',
  }
  return labels[value] ?? 'Inconnue'
}

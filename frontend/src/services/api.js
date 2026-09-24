import {
  pickAnalysis,
  saveScoredCheckIn,
  sortByDateDesc,
  toAnalysis,
  toChartPoint,
  toCheckIn,
} from './checkinMap'

const API_BASE = '/api'
const DEFAULT_TIMEOUT_MS = 12000
const CHAT_TIMEOUT_MS = 90000

async function request(path, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  let response
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }
    // Ajouter le token si l'utilisateur est connecté
    const token = localStorage.getItem('token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    response = await fetch(`${API_BASE}${path}`, {
      headers,
      signal: controller.signal,
      ...options,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(
        timeoutMs === CHAT_TIMEOUT_MS
          ? "L'assistant met trop de temps à répondre. Réessaie dans un instant."
          : 'Onboard API timed out. Start FastAPI on port 8000.',
      )
    }
    throw new Error('Onboard API is unreachable. Start FastAPI on port 8000.')
  } finally {
    clearTimeout(timeout)
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const detail = payload?.detail
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((item) => item.msg || item).join(', ')
          : `Request failed (${response.status})`
    throw new Error(message)
  }

  return payload
}

function mapHistory(rawHistory = []) {
  return sortByDateDesc(
    rawHistory.map((item) => toCheckIn(item, pickAnalysis(item))),
  )
}

export async function getApiStatus() {
  try {
    await request('/')
    return true
  } catch {
    return false
  }
}

export async function getDashboardData() {
  const [historyPayload, recommendation] = await Promise.all([
    request('/get-history'),
    request('/get-recommendation'),
  ])
  const raw = historyPayload.history || []
  const history = mapHistory(raw)
  const latest = history[0]
  const matching = raw.find((item) => (item.timestamp || item.date) === latest?.timestamp)
  const analysis = toAnalysis(pickAnalysis(matching || recommendation), latest)

  return {
    latest,
    status: latest?.status ?? analysis.status ?? 'stable',
    metrics: {
      sleep_hours: latest?.sleep_hours ?? 0,
      mood: latest?.mood ?? 0,
      stress: latest?.stress ?? 0,
      fatigue: latest?.fatigue ?? 0,
    },
    trend: [...history].slice(0, 7).reverse().map(toChartPoint),
    recommendation: analysis.recommendation,
    apiOnline: true,
  }
}

export async function getHistory(days = 7) {
  const payload = await request('/get-history')
  const history = mapHistory(payload.history || []).slice(0, days)
  const cutoff = new Date()
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - (days - 1))

  const claims = [...(payload.claims || [])]
    .filter((claim) => {
      const stamp = claim.claim_timestamp || claim.timestamp
      const date = new Date(stamp)
      return !Number.isNaN(date.getTime()) && date >= cutoff
    })
    .sort((a, b) => {
      const left = a.claim_timestamp || a.timestamp || ''
      const right = b.claim_timestamp || b.timestamp || ''
      return left < right ? 1 : -1
    })

  return {
    entries: history,
    chart: [...history].reverse().map(toChartPoint),
    claims,
  }
}

export async function submitCheckIn(payload) {
  const result = await request('/submit-questionnaire', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  const stored =
    result.response ||
    (await request('/get-latest-questionnaire'))
  const analysisPayload =
    result.analysis ||
    pickAnalysis(await request('/get-recommendation'))
  const checkIn = toCheckIn({ ...stored, ...payload }, analysisPayload)
  saveScoredCheckIn(checkIn)
  const analysis = toAnalysis(analysisPayload, checkIn)
  return { checkIn, analysis }
}

export async function getAnalysis() {
  const [latest, recommendation, historyPayload] = await Promise.all([
    request('/get-latest-questionnaire'),
    request('/get-recommendation'),
    request('/get-history'),
  ])
  if (!latest || !Object.keys(latest).length) {
    throw new Error('No questionnaire submitted yet.')
  }
  const history = mapHistory(historyPayload.history || [])
  const fromLatest = toCheckIn(latest, pickAnalysis(recommendation))
  const checkIn =
    history[0]?.observations?.length && history[0].date === fromLatest.date
      ? history[0]
      : fromLatest
  return toAnalysis(pickAnalysis(recommendation), checkIn)
}

export async function sendChat(messages, language = 'fr') {
  const payload = await request(
    '/chat',
    {
      method: 'POST',
      body: JSON.stringify({ messages, language }),
    },
    CHAT_TIMEOUT_MS,
  )
  return payload.response
}

export async function getAllMedications() {
  const payload = await request('/get-all-medications')
  return payload.medications || []
}

export async function getMedicationInfo(code) {
  const payload = await request(`/get-medication-info/${code}`)
  return payload.valid ? payload.medication : null
}

export async function claimMedication(code) {
  return request('/claim-medication', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

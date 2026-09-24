import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Activity, ClipboardList, Dumbbell, LayoutDashboard, LineChart, MessageSquare, Pill } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { getApiStatus } from '../../services/api'

const linkDefs = [
  { to: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/questionnaire', key: 'nav.questionnaire', icon: ClipboardList },
  { to: '/history', key: 'nav.history', icon: LineChart },
  { to: '/analysis', key: 'nav.analysis', icon: Activity },
  { to: '/medication', key: 'nav.medication', icon: Pill },
  { to: '/exercise', key: 'nav.exercise', icon: Dumbbell },
  { to: '/chat', key: 'nav.assistant', icon: MessageSquare },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const { t } = useLanguage()
  const [apiOnline, setApiOnline] = useState(false)

  useEffect(() => {
    let active = true
    const ping = () => {
      getApiStatus().then((online) => {
        if (active) setApiOnline(online)
      })
    }
    ping()
    const timer = setInterval(ping, 15000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [])

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label={t('sidebar.closeNav')}
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-72 shrink-0 flex-col overflow-hidden border-r border-hud-border/80 bg-hud-panel/95 backdrop-blur-md transition-transform duration-200 md:static md:h-full md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-hud-border/80 px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-hud-accent/40 bg-hud-accent/10 shadow-[0_0_18px_rgba(59,167,255,0.18)]">
              <span className="h-2.5 w-2.5 rounded-full bg-status-stable" />
            </div>
            <div>
              <p className="font-mono text-sm tracking-[0.22em] text-white">spAIce</p>
              <p className="mt-1 text-[10px] tracking-[0.18em] text-hud-muted">{t('sidebar.mission')}</p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {linkDefs.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                  isActive
                    ? 'border-hud-accent/40 bg-hud-accent/10 text-white'
                    : 'border-transparent text-hud-muted hover:border-hud-border hover:bg-hud-raised hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {t(key)}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-hud-border/80 px-5 py-5 text-[11px] tracking-[0.12em] text-hud-muted">
          <div className="flex items-center justify-between">
            <span>{t('sidebar.api')}</span>
            <span className={apiOnline ? 'text-status-stable' : 'text-status-alert'}>
              {apiOnline ? t('sidebar.online') : t('sidebar.offline')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{t('sidebar.system')}</span>
            <span className="text-status-stable">{t('sidebar.autonomous')}</span>
          </div>
          <p className="pt-2 font-mono text-[10px] text-hud-muted/80">{t('sidebar.support')}</p>
        </div>
      </aside>
    </>
  )
}

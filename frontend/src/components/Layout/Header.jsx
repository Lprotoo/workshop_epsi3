import { Menu, SatelliteDish } from 'lucide-react'
// import { UserRound } from 'lucide-react'
// import { crew } from '../../data/mockData'
import { useLanguage } from '../../i18n/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'

export default function Header({ onMenuClick }) {
  const { locale, setLocale, t } = useLanguage()
  const { user, logout } = useAuth()

  return (
    <header className="z-20 flex shrink-0 items-center justify-between border-b border-hud-border/80 bg-hud-panel/90 px-4 py-3 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-md border border-hud-border p-2 text-hud-muted md:hidden"
          aria-label={t('header.openNav')}
        >
          <Menu size={18} />
        </button>
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] text-hud-muted">{t('header.console')}</p>
          <p className="text-sm text-white">{t('header.subtitle')}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="flex rounded-lg border border-hud-border bg-hud-raised p-0.5"
          role="group"
          aria-label={t('header.language')}
        >
          <button
            type="button"
            onClick={() => setLocale('fr')}
            className={`rounded-md px-2.5 py-1 font-mono text-[11px] tracking-[0.14em] ${
              locale === 'fr' ? 'bg-hud-accent/25 text-white' : 'text-hud-muted hover:text-white'
            }`}
          >
            FR
          </button>
          <button
            type="button"
            onClick={() => setLocale('en')}
            className={`rounded-md px-2.5 py-1 font-mono text-[11px] tracking-[0.14em] ${
              locale === 'en' ? 'bg-hud-accent/25 text-white' : 'text-hud-muted hover:text-white'
            }`}
          >
            EN
          </button>
        </div>
        {/* <div className="hidden text-right sm:block">
          <p className="font-mono text-[11px] tracking-[0.16em] text-hud-muted">
            {t('header.crew')}: <span className="text-white">{crew.id}</span>
          </p>
          <p className="font-mono text-[11px] tracking-[0.16em] text-hud-muted">
            {t('header.spacecraft')}: <span className="text-white">{crew.spacecraft}</span>
          </p>
        </div> */}
        <div className="flex items-center gap-2 rounded-lg border border-hud-border bg-hud-raised px-3 py-2">
          <SatelliteDish size={14} className="text-status-stable" />
          <span className="hidden font-mono text-[10px] tracking-[0.16em] text-status-stable sm:inline">
            {t('header.nominal')}
          </span>
        </div>
        {user ? (
          <button
            type="button"
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="rounded-lg border border-hud-border px-3 py-1.5 text-sm text-hud-muted hover:border-hud-accent/50 hover:text-white"
          >
            {t('header.logout')}
          </button>
        ) : null}
        {/* <div className="flex h-9 w-9 items-center justify-center rounded-full border border-hud-accent/40 bg-hud-accent/10">
          <UserRound size={16} className="text-hud-accent" />
        </div> */}
      </div>
    </header>
  )
}

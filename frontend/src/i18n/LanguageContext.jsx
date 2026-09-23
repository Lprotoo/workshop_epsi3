import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { dictionaries, localeTags } from './translations'

const STORAGE_KEY = 'psychospace_lang'
const LanguageContext = createContext(null)

function lookup(dict, key) {
  return key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict)
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'en' || stored === 'fr' ? stored : 'fr'
  })

  function setLocale(next) {
    const value = next === 'en' ? 'en' : 'fr'
    setLocaleState(value)
    localStorage.setItem(STORAGE_KEY, value)
  }

  const t = useMemo(() => {
    const dict = dictionaries[locale] || dictionaries.fr
    const translate = (key, vars) => {
      let value = lookup(dict, key)
      if (typeof value !== 'string') value = lookup(dictionaries.fr, key)
      if (typeof value !== 'string') return key
      if (vars) {
        Object.entries(vars).forEach(([name, replacement]) => {
          value = value.replaceAll(`{${name}}`, String(replacement))
        })
      }
      return value
    }
    translate.maybe = (value) => {
      if (typeof value !== 'string' || !value) return ''
      if (value.startsWith('obs.') || value.startsWith('flag.') || value.startsWith('opt.') || value.startsWith('quality.')) {
        return translate(value)
      }
      return value
    }
    return translate
  }, [locale])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo(
    () => ({
      locale,
      localeTag: localeTags[locale] || 'fr-FR',
      setLocale,
      t,
    }),
    [locale, t],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}

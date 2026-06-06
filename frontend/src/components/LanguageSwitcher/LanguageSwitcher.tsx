import { useTranslation } from 'react-i18next'

import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../i18n'

const FLAGS: Record<SupportedLanguage, { flag: string; label: string }> = {
  'pt-BR': { flag: '🇧🇷', label: 'PT' },
  en: { flag: '🇬🇧', label: 'EN' },
}

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  // Normalize e.g. "en-US" -> "en"; default to pt-BR otherwise.
  const current: SupportedLanguage = i18n.language.startsWith('pt')
    ? 'pt-BR'
    : 'en'

  return (
    <div className="flex overflow-hidden rounded-md border border-neutral-700">
      {SUPPORTED_LANGUAGES.map((lng) => {
        const active = lng === current
        return (
          <button
            key={lng}
            type="button"
            onClick={() => i18n.changeLanguage(lng)}
            className={`flex items-center gap-1 px-2.5 py-1 text-sm ${
              active
                ? 'bg-emerald-600 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
            aria-pressed={active}
          >
            <span aria-hidden>{FLAGS[lng].flag}</span>
            <span className="text-xs font-medium">{FLAGS[lng].label}</span>
          </button>
        )
      })}
    </div>
  )
}

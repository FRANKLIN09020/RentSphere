import { createContext, useContext } from 'react'

export type AppLanguage = 'en' | 'ta' | 'hi' | 'kn'
export type LanguageContextValue = { language: AppLanguage; setLanguage: (language: AppLanguage) => void; t: (text: string) => string }
export const LanguageContext = createContext<LanguageContextValue | null>(null)
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within <LanguageProvider>')
  return context
}

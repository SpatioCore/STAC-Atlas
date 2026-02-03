import en from './en'
import de from './de'

export type Locale = 'en' | 'de'

export const messages = {
  en,
  de
}

export type Messages = typeof en

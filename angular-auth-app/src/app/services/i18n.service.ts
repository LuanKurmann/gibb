import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type SupportedLanguage = 'en' | 'de';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLanguage = new BehaviorSubject<SupportedLanguage>('en');
  private translations: { [key: string]: any } = {};

  currentLanguage$ = this.currentLanguage.asObservable();

  constructor() {
    this.loadTranslations();
    const savedLang = localStorage.getItem('language') as SupportedLanguage;
    if (savedLang && ['en', 'de'].includes(savedLang)) {
      this.setLanguage(savedLang);
    }
  }

  private async loadTranslations() {
    try {
      const [enTranslations, deTranslations] = await Promise.all([
        import('../../locale/messages.en.json'),
        import('../../locale/messages.de.json')
      ]);
      
      this.translations['en'] = enTranslations.default;
      this.translations['de'] = deTranslations.default;
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  setLanguage(lang: SupportedLanguage) {
    this.currentLanguage.next(lang);
    localStorage.setItem('language', lang);
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage.value;
  }

  translate(key: string): string {
    const lang = this.getCurrentLanguage();
    const keys = key.split('.');
    let value = this.translations[lang];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  }

  t(key: string): string {
    return this.translate(key);
  }
}

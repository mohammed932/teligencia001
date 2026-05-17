/*
 * Root application providers (Customer Portal).
 */

import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { NZ_ICONS } from 'ng-zorro-antd/icon';

import { routes } from './app.routes';
import { TELIGENCIA_ICONS } from './core/icons';

registerLocaleData(en);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })
    ),
    provideHttpClient(),
    provideAnimations(),
    provideNzI18n(en_US),
    { provide: LOCALE_ID, useValue: 'en' },
    { provide: NZ_ICONS, useValue: TELIGENCIA_ICONS }
  ]
};

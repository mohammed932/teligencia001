/*
 * Root application providers.
 * - Router with bound input params
 * - HttpClient with auth-token interceptor (Feature 001)
 * - Animations
 * - NG-Zorro icon registry (curated subset)
 * - en_US locale for ng-zorro
 * - APP_INITIALIZER bootstraps Clerk before the first route resolves
 */

import {
  APP_INITIALIZER,
  ApplicationConfig,
  LOCALE_ID,
  inject,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { NZ_ICONS } from 'ng-zorro-antd/icon';

import { routes } from './app.routes';
import { TELIGENCIA_ICONS } from './core/icons';
import { authTokenInterceptor } from './core/auth/auth-token.interceptor';
import { AuthService } from './core/auth/auth.service';

registerLocaleData(en);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled',
      }),
    ),
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    provideAnimations(),
    provideNzI18n(en_US),
    { provide: LOCALE_ID, useValue: 'en' },
    { provide: NZ_ICONS, useValue: TELIGENCIA_ICONS },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const auth = inject(AuthService);
        return () => auth.load();
      },
    },
  ],
};

/*
 * Attach the Clerk session token to every request that targets the
 * Teligencia API. Skip other origins (third-party assets, Clerk Frontend API,
 * etc.) — only the API trusts our session token (FR-011).
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiBaseUrl)) return next(req);

  const auth = inject(AuthService);
  return from(auth.token()).pipe(
    switchMap((token) => {
      const cloned = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;
      return next(cloned);
    }),
  );
};

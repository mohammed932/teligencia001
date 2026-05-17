/*
 * AppComponent — Customer Portal root. Injects ThemeService at bootstrap.
 */

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<router-outlet></router-outlet>`,
  styles: [':host { display: block; min-height: 100vh; }']
})
export class AppComponent {
  constructor() { inject(ThemeService); }
}

import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { I18nService } from './services/i18n.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  template: `<router-outlet></router-outlet>`,
  styles: [`:host { display: block; }`]
})
export class AppComponent {
  authService = inject(AuthService);
  i18n = inject(I18nService);
  router = inject(Router);

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {});
  }
}

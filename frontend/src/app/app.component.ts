import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './services/auth.service';
import { I18nService } from './services/i18n.service';
import { filter } from 'rxjs/operators';

const API = 'https://raes-backend.vercel.app/api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  template: `<router-outlet></router-outlet>`,
  styles: [`:host { display: block; }`]
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);
  i18n = inject(I18nService);
  router = inject(Router);
  http = inject(HttpClient);

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {});
  }

  ngOnInit() {
    // Warm up backend + Neon DB on app start so first data call doesn't cold-start
    this.http.get(`${API}/ping`).subscribe({ error: () => {} });
  }
}

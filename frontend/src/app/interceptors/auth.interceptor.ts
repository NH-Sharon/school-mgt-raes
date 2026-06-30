import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const isPublicAuth = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register');
  if (token && req.url.includes('/api/') && !isPublicAuth) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};

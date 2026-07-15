import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, timer, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

export const retryInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  return next(req).pipe(
    catchError(err => retryOnFailure(req, next, err, 0))
  );
};

function retryOnFailure(req: HttpRequest<unknown>, next: HttpHandlerFn, err: any, attempt: number): Observable<HttpEvent<unknown>> {
  const shouldRetry = (err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504) && attempt < MAX_RETRIES;
  if (shouldRetry) {
    return timer(RETRY_DELAY_MS).pipe(
      switchMap(() => next(req).pipe(
        catchError((e: any) => retryOnFailure(req, next, e, attempt + 1))
      ))
    );
  }
  return throwError(() => err);
}

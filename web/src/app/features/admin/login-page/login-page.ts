// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: login-page.ts
// /admin/login: email + password form. On success → back to the page I
// wanted (returnUrl) or /admin/posts. The API sets the cookies itself;
// this page only shows the result.
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/auth/auth.service';
import { apiErrorMessage } from '../api-error';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.maxLength(200)]],
  });

  protected readonly sending = signal(false);
  /** The message from the API (or for "can't reach the server"), shown above the button. */
  protected readonly errorMessage = signal('');

  /** Message under a field, once it was touched. */
  protected errorFor(field: 'email' | 'password'): string {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';
    if (control.errors['required']) return field === 'email' ? 'Please enter your email.' : 'Please enter your password.';
    if (control.errors['email']) return 'Please enter a valid email.';
    return 'Too long.';
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.sending.set(true);
    this.errorMessage.set('');
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl()),
      error: (error: unknown) => {
        this.sending.set(false);
        this.errorMessage.set(apiErrorMessage(error));
      },
    });
  }

  /** Where to go after login. Only admin addresses are allowed (never another website). */
  private returnUrl(): string {
    const wanted = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';
    return wanted.startsWith('/admin/') && !wanted.startsWith('/admin/login') ? wanted : '/admin/posts';
  }
}

// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: contact.ts
// Contact section (05): logic for the contact form.
// Checks the form in the browser, sends it to the API, and tracks the state
// (idle → sending → sent / error / limited). The API checks everything again on its side.
// ──────────────────────────────────────────────────────────────────────

import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactErrorResponse } from '../../contact';
import { ContactService } from '../../core/contact.service';

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'limited';
type FieldName = 'name' | 'email' | 'message';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  private readonly contactService = inject(ContactService);

  /** Same limits as the API and the database columns. */
  protected readonly max = { name: 100, email: 254, message: 2000 };

  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(this.max.name)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(this.max.email)]],
    message: ['', [Validators.required, Validators.maxLength(this.max.message)]],
    website: [''], // hidden spam trap
  });

  /**
   * WhatsApp number in international format: country code + number,
   * no "+", spaces or dashes (e.g. 91 for India). Shown inside the link, so it is public.
   */
  private readonly whatsappNumber = '916283411585';

  /**
   * Link that opens a WhatsApp chat with me. If the visitor already typed a name or
   * message in the form, it's pre-filled into the chat so they don't type it twice.
   */
  protected whatsappLink(): string {
    const { name, message } = this.form.getRawValue();
    const intro = name.trim() ? `Hi Devaangini, I'm ${name.trim()}.` : 'Hi Devaangini,';
    const body = message.trim() || 'I found your portfolio and would like to connect.';
    return `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(`${intro} ${body}`)}`;
  }

  protected readonly status = signal<Status>('idle');
  /** Field errors sent back by the API (400), shown under each input. */
  protected readonly serverErrors = signal<Partial<Record<FieldName, string>>>({});

  /** The message to show under a field, or '' if it's fine. */
  protected errorFor(field: FieldName): string {
    const control = this.form.controls[field];
    if (control.touched && control.errors) {
      if (control.errors['required']) return `Please enter your ${field}.`;
      if (control.errors['email']) return 'Please enter a valid email.';
      if (control.errors['maxlength']) return `Must be ${this.max[field]} characters or fewer.`;
    }
    return this.serverErrors()[field] ?? '';
  }

  protected submit(): void {
    // 1. Check in the browser first: show all errors, send nothing.
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // 2. Send. The button is disabled while status is 'sending'.
    this.status.set('sending');
    this.serverErrors.set({});

    this.contactService.send(this.form.getRawValue()).subscribe({
      next: () => {
        this.status.set('sent');
        this.form.reset();
      },
      error: (err: HttpErrorResponse) => {
        // 400 = the API found problems: show them under the fields.
        const body = err.error as ContactErrorResponse | null;
        if (err.status === 400 && body?.fields) {
          this.serverErrors.set(body.fields);
          this.status.set('idle');
        } else {
          // 429 = too many messages in a short time (rate limit); anything else =
          // network down, server error, etc.
          this.status.set(err.status === 429 ? 'limited' : 'error');
        }
      },
    });
  }

  /** "Send another message" after a successful send. */
  protected startOver(): void {
    this.status.set('idle');
  }
}

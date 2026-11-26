// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: comment-form.spec.ts
// Tests the comment form against a FAKE backend: HttpTestingController
// catches the request, so the test can check exactly what was sent and
// then answer it (202 or 400) by hand. No real API needed.
// Run: `npm test` in web/.
// ──────────────────────────────────────────────────────────────────────

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommentForm } from './comment-form';

describe('CommentForm', () => {
  let fixture: ComponentFixture<CommentForm>;
  let http: HttpTestingController;
  let el: HTMLElement;

  /** Types into a field the way a person would (sets the value + fires "input"). */
  function type(selector: string, value: string): void {
    const field = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    field.value = value;
    field.dispatchEvent(new Event('input'));
  }

  function send(): void {
    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    try {
      localStorage.removeItem('blog.commentName');
    } catch {
      /* ignore */
    }
    await TestBed.configureTestingModule({
      imports: [CommentForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CommentForm);
    fixture.componentRef.setInput('slug', 'my-post');
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify()); // no unexpected requests were sent

  it('sends name + text (+ the empty trap) and then shows the thank-you message', () => {
    type('input[formControlName="authorName"]', 'Asha');
    type('textarea[formControlName="body"]', 'Great post!');
    send();

    const request = http.expectOne('/api/posts/my-post/comments');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ authorName: 'Asha', body: 'Great post!', website: '' });

    request.flush({ status: 'PENDING', message: 'ok' }, { status: 202, statusText: 'Accepted' });
    fixture.detectChanges();
    expect(el.textContent).toContain('will appear after review');
  });

  it("shows the API's 400 message under the right field", () => {
    type('input[formControlName="authorName"]', 'Asha');
    type('textarea[formControlName="body"]', 'Hi');
    send();

    http
      .expectOne('/api/posts/my-post/comments')
      .flush(
        { error: 'Please check your comment.', fields: { body: 'Comment must be 2–2000 characters.' } },
        { status: 400, statusText: 'Bad Request' },
      );
    fixture.detectChanges();
    expect(el.querySelector('[id$="-body-error"]')?.textContent).toContain('2–2000');
  });

  it('an empty form is not sent at all', () => {
    send();
    http.expectNone('/api/posts/my-post/comments');
    expect(el.textContent).toContain('Please enter your name.');
  });
});

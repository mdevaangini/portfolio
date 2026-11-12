// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: markdown.pipe.ts
// Turns Markdown text into HTML with the `marked` library:
//   "## Hi\n\n**bold**"  →  "<h2>Hi</h2><p><strong>bold</strong></p>"
// Use it ONLY with [innerHTML]:   <div class="prose" [innerHTML]="text | markdown"></div>
// SAFETY: [innerHTML] runs Angular's built-in SANITIZER on the result, which
// strips anything dangerous (<script>, onerror=…, javascript: links), so
// pasted HTML can't run code (XSS). Never wrap this in bypassSecurityTrust….
// Shared: used by the admin editor preview now, the public blog later.
// ──────────────────────────────────────────────────────────────────────

import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  /** A "pure" pipe: it only runs again when the text changes. */
  transform(markdown: string | null | undefined): string {
    if (!markdown) return '';
    // gfm = GitHub-flavoured Markdown (tables, ``` code blocks, auto links).
    // async: false → the result is a plain string, not a Promise.
    return marked.parse(markdown, { gfm: true, async: false });
  }
}

// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: markdown.pipe.spec.ts
// Unit tests for MarkdownPipe: Markdown in, HTML out. Run: `npm test`.
// (Removing dangerous HTML is done later by Angular's [innerHTML] sanitizer,
// not by the pipe.)
// ──────────────────────────────────────────────────────────────────────

import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  const pipe = new MarkdownPipe();

  it('turns Markdown into HTML', () => {
    const html = pipe.transform('## The short answer\n\nSignals for **state**.');
    expect(html).toContain('<h2>The short answer</h2>');
    expect(html).toContain('<strong>state</strong>');
  });

  it('returns an empty string for empty input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null)).toBe('');
  });
});

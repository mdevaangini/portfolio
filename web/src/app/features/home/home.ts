// ──────────────────────────────────────────────────────────────────────
// ABOUT THIS FILE: features/home/home.ts
// The HOME page ("/"): all the portfolio sections, in order. This used to
// live in app.html; it moved here when the app got routes (Blog milestone 1),
// so app.html only keeps what every page shares (header, footer).
// ──────────────────────────────────────────────────────────────────────

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Contact } from './sections/contact/contact';
import { Experience } from './sections/experience/experience';
import { Expertise } from './sections/expertise/expertise';
import { Hero } from './sections/hero/hero';
import { ImpactStrip } from './sections/impact-strip/impact-strip';
import { Projects } from './sections/projects/projects';
import { Skills } from './sections/skills/skills';
import { LatestPosts } from '@features/blog/latest-posts/latest-posts';

@Component({
  selector: 'app-home',
  imports: [Hero, ImpactStrip, Expertise, Projects, Experience, Skills, LatestPosts, Contact],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {}

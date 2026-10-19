import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Header } from './layout/header/header';
import { Expertise } from './sections/expertise/expertise';
import { Hero } from './sections/hero/hero';
import { ImpactStrip } from './sections/impact-strip/impact-strip';
import { Projects } from './sections/projects/projects';

@Component({
  selector: 'app-root',
  imports: [Header, Hero, ImpactStrip, Expertise, Projects],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}

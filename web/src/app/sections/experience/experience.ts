import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ExperienceService } from '../../core/experience.service';
import { SectionHeading } from '../../shared/section-heading/section-heading';

interface Highlight {
  label: string;
  title: string;
  text: string;
}

@Component({
  selector: 'app-experience',
  imports: [SectionHeading, DatePipe],
  templateUrl: './experience.html',
  styleUrl: './experience.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Experience {
  /** Jobs come from the API (GET /api/experience), newest first. */
  protected readonly roles = inject(ExperienceService).loadExperiences();

  /** Recognition and education stay here for now: two small, fixed cards. */
  protected readonly highlights: Highlight[] = [
    {
      label: 'Recognition',
      title: 'Employee of the Month, 4 times',
      text: 'For performance, attention to detail and delivery excellence at PureSoftware / Happiest Minds.',
    },
    {
      label: 'Education',
      title: 'B.Tech, Electronics & Communication Engineering',
      text: 'Thapar University, Patiala · 2018 – 2022',
    },
  ];
}

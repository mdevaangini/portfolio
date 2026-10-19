import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { ProjectsService } from '../../core/projects.service';
import { Project } from '../../project';
import { SectionHeading } from '../../shared/section-heading/section-heading';

@Component({
  selector: 'app-projects',
  imports: [SectionHeading, NgTemplateOutlet],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Projects {
  private readonly projectsService = inject(ProjectsService);

  /** The chip the visitor picked. null = "All" */
  protected readonly selectedCategory = signal<string | null>(null);

  /** The chip labels, from the API */
  protected readonly categories = this.projectsService.loadCategories();

  /** The projects. Re-fetched automatically whenever selectedCategory changes */
  protected readonly resource = this.projectsService.loadProjects(this.selectedCategory);

  /**
   * The projects currently on screen. While a new filter is loading, keep showing
   * the previous ones (dimmed) instead of flashing an empty grid.
   */
  private readonly list = linkedSignal<Project[] | undefined, Project[]>({
    source: () => this.resource.value()?.data,
    computation: (data, previous) => data ?? previous?.value ?? [],
  });

  /** The first project gets the large, featured layout */
  protected readonly featured = computed(() => this.list()[0]);

  /** The rest go in the two-column grid below it */
  protected readonly others = computed(() => this.list().slice(1));

  /** True only on the very first load, when there is nothing to show yet */
  protected readonly firstLoad = computed(() => this.resource.isLoading() && this.list().length === 0);

  protected selectCategory(category: string | null): void {
    this.selectedCategory.set(category);
  }
}

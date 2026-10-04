// ABOUTME: Pure filtering of projects by free-text query and selected tags.
// ABOUTME: Returns the visible project ids and the tags still present among them.

export interface FilterableProject {
  id: string;
  title: string;
  summary: string;
  tags: string[];
}

export interface ProjectFilterState {
  selectedTags: string[];
  query: string;
}

export interface ProjectFilterResult {
  visibleIds: Set<string>;
  availableTags: string[];
}

function matchesQuery(project: FilterableProject, query: string): boolean {
  if (query === '') return true;
  return (
    project.title.toLowerCase().includes(query) ||
    project.summary.toLowerCase().includes(query) ||
    project.tags.some((tag) => tag.toLowerCase().includes(query))
  );
}

function matchesTags(project: FilterableProject, selectedTags: string[]): boolean {
  return selectedTags.length === 0 || selectedTags.some((tag) => project.tags.includes(tag));
}

/**
 * `tagOrder` fixes the order of `availableTags`; it defaults to first appearance in `projects`.
 */
export function filterProjects(
  projects: FilterableProject[],
  { selectedTags, query }: ProjectFilterState,
  tagOrder: string[] = [...new Set(projects.flatMap((project) => project.tags))],
): ProjectFilterResult {
  const normalizedQuery = query.toLowerCase().trim();
  const visible = projects.filter(
    (project) => matchesQuery(project, normalizedQuery) && matchesTags(project, selectedTags),
  );
  const tagsInVisible = new Set(visible.flatMap((project) => project.tags));

  return {
    visibleIds: new Set(visible.map((project) => project.id)),
    availableTags: tagOrder.filter((tag) => tagsInVisible.has(tag)),
  };
}

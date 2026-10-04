// ABOUTME: Unit tests for the pure project filtering used by the ProjectFilter island.
// ABOUTME: Covers text search, tag selection, their combination, and available-tag narrowing.
import { describe, it, expect } from 'vitest';
import { filterProjects, type FilterableProject } from './project-filter';

const PROJECTS: FilterableProject[] = [
  { id: 'es/cookobot', title: 'Cookobot', summary: 'Asistente de cocina', tags: ['AI', 'Web'] },
  { id: 'es/glio-ia', title: 'Glio IA', summary: 'Segmentación médica', tags: ['AI', 'Data'] },
  { id: 'es/crop', title: 'Crop Monitoring', summary: 'Sensores IoT', tags: ['IoT'] },
];

describe('filterProjects', () => {
  it('shows every project and every tag when no filter is active', () => {
    const result = filterProjects(PROJECTS, { selectedTags: [], query: '' });

    expect([...result.visibleIds]).toEqual(['es/cookobot', 'es/glio-ia', 'es/crop']);
    expect(result.availableTags).toEqual(['AI', 'Web', 'Data', 'IoT']);
  });

  it('matches the query against title, summary and tags, case-insensitively', () => {
    expect([...filterProjects(PROJECTS, { selectedTags: [], query: 'COOKO' }).visibleIds]).toEqual([
      'es/cookobot',
    ]);
    expect([...filterProjects(PROJECTS, { selectedTags: [], query: 'médica' }).visibleIds]).toEqual(
      ['es/glio-ia'],
    );
    expect([...filterProjects(PROJECTS, { selectedTags: [], query: 'iot' }).visibleIds]).toEqual([
      'es/crop',
    ]);
  });

  it('ignores surrounding whitespace in the query', () => {
    expect([
      ...filterProjects(PROJECTS, { selectedTags: [], query: '  glio  ' }).visibleIds,
    ]).toEqual(['es/glio-ia']);
  });

  it('keeps projects that have any of the selected tags', () => {
    const result = filterProjects(PROJECTS, { selectedTags: ['Web', 'IoT'], query: '' });

    expect([...result.visibleIds]).toEqual(['es/cookobot', 'es/crop']);
  });

  it('requires both the query and the tag selection to match', () => {
    const result = filterProjects(PROJECTS, { selectedTags: ['AI'], query: 'glio' });

    expect([...result.visibleIds]).toEqual(['es/glio-ia']);
  });

  it('narrows available tags to those on visible projects, in the given tag order', () => {
    const result = filterProjects(PROJECTS, { selectedTags: ['AI'], query: '' }, [
      'IoT',
      'Data',
      'Web',
      'AI',
    ]);

    expect(result.availableTags).toEqual(['Data', 'Web', 'AI']);
  });

  it('returns nothing visible and no tags when nothing matches', () => {
    const result = filterProjects(PROJECTS, { selectedTags: [], query: 'zzz' });

    expect(result.visibleIds.size).toBe(0);
    expect(result.availableTags).toEqual([]);
  });
});

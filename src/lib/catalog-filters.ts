// ABOUTME: Defines the shareable query and type parameters used by the project catalogue.
// ABOUTME: Carries the same filters to case studies, return links, and language alternatives.
export const CATALOG_FILTERS_CHANGE = 'portfolio:catalog-filters-change';

export interface CatalogFilters {
  query: string;
  type: string;
}

export function readCatalogFilters(search: string): CatalogFilters {
  const params = new URLSearchParams(search);
  return { query: params.get('q')?.trim() ?? '', type: params.get('type') ?? '' };
}

export function setCatalogFilters(params: URLSearchParams, filters: CatalogFilters) {
  params.delete('q');
  params.delete('type');
  if (filters.query.trim()) params.set('q', filters.query.trim());
  if (filters.type) params.set('type', filters.type);
}

export function catalogSearch(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  setCatalogFilters(params, filters);
  const search = params.toString();
  return search ? `?${search}` : '';
}

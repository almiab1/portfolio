// ABOUTME: Captures delegated interactions with portfolio controls and links.
// ABOUTME: Allows only the event names and fields used by the public portfolio.

const PROJECT_TYPES = new Set(['web', 'mobile', 'iot', 'ai', 'data', 'api', 'desktop', 'other']);
const LINK_TYPES = new Set(['demo', 'repository', 'external']);
const CONTACT_METHODS = new Set(['email', 'linkedin', 'github', 'x']);
const LOCALES = new Set(['es', 'en']);
const PROJECT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type EventProperties = Record<string, string | boolean>;
type Capture = (event: string, properties: EventProperties) => void;

function includes(values: Set<string>, value: unknown): value is string {
  return typeof value === 'string' && values.has(value);
}

export function sanitizePortfolioEvent(
  event: string,
  properties: Record<string, unknown>,
): EventProperties | undefined {
  const { project_slug, project_type, is_featured, link_type, method, locale, cv_locale, action } =
    properties;
  const hasProjectSlug =
    typeof project_slug === 'string' &&
    project_slug.length <= 80 &&
    PROJECT_SLUG.test(project_slug);
  switch (event) {
    case 'project_detail_opened':
      if (
        hasProjectSlug &&
        includes(PROJECT_TYPES, project_type) &&
        typeof is_featured === 'boolean'
      ) {
        return { project_slug, project_type, is_featured };
      }
      break;
    case 'project_link_opened':
      if (hasProjectSlug && includes(LINK_TYPES, link_type)) return { project_slug, link_type };
      break;
    case 'project_filter_changed':
      if (action === 'cleared') return { action };
      if (includes(PROJECT_TYPES, project_type)) return { project_type };
      break;
    case 'contact_method_opened':
      if (includes(CONTACT_METHODS, method)) return { method };
      break;
    case 'cv_downloaded':
      if (includes(LOCALES, locale) && includes(LOCALES, cv_locale)) return { locale, cv_locale };
      break;
  }
}

function publicTarget(event: Event): Element | undefined {
  const { target } = event;
  if (target instanceof Element && !target.closest('[data-analytics-private]')) {
    return target;
  }
}

export function listenForPortfolioEvents(capture: Capture): () => void {
  const emit = (event: string, properties: Record<string, unknown>) => {
    const sanitized = sanitizePortfolioEvent(event, properties);
    if (sanitized) capture(event, sanitized);
  };

  const onClick = (event: MouseEvent) => {
    const target = publicTarget(event);
    if (!target) return;

    const link = target.closest<HTMLAnchorElement>('a');
    if (link) {
      const { contactMethod, cvEdition, linkType, projectFeatured, projectSlug, projectType } =
        link.dataset;
      if (link.hasAttribute('data-contact-method')) {
        emit('contact_method_opened', { method: contactMethod });
      }
      if (link.matches('[download][data-cv-edition]')) {
        emit('cv_downloaded', { locale: document.documentElement.lang, cv_locale: cvEdition });
      }
      if (
        link.hasAttribute('data-project-card') &&
        (projectFeatured === 'true' || projectFeatured === 'false')
      ) {
        emit('project_detail_opened', {
          project_slug: projectSlug,
          project_type: projectType,
          is_featured: projectFeatured === 'true',
        });
      }
      if (link.hasAttribute('data-project-link')) {
        emit('project_link_opened', { project_slug: projectSlug, link_type: linkType });
      }
    }

    const control = target.closest<HTMLElement>(
      '[data-clear-project-type], a[data-project-type-shortcut]',
    );
    const select = control
      ?.closest('project-catalog')
      ?.querySelector<HTMLSelectElement>('select[data-project-type-filter]');
    if (!control || !select || select.disabled) return;

    const nextType = control.dataset.projectTypeShortcut;
    if (nextType && nextType !== select.value) {
      emit('project_filter_changed', { project_type: nextType });
    } else if (control.hasAttribute('data-clear-project-type') && PROJECT_TYPES.has(select.value)) {
      emit('project_filter_changed', { action: 'cleared' });
    }
  };

  const onChange = (event: Event) => {
    const target = publicTarget(event);
    if (
      !(target instanceof HTMLSelectElement) ||
      target.disabled ||
      !target.matches('project-catalog select[data-project-type-filter]')
    ) {
      return;
    }
    emit(
      'project_filter_changed',
      target.value ? { project_type: target.value } : { action: 'cleared' },
    );
  };

  // Read the selected type before the clear button resets the catalogue controls.
  document.addEventListener('click', onClick, true);
  document.addEventListener('change', onChange);
  return () => {
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('change', onChange);
  };
}

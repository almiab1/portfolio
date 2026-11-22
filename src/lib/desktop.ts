// ABOUTME: Tracks open portfolio apps across Astro navigations.
// ABOUTME: Keeps project filters attached to the open catalogue tab.
import { navigate } from 'astro:transitions/client';
import { ASSISTANT_DISABLED, watchAssistantFlag } from '@/lib/assistant-flag';
import {
  CATALOG_FILTERS_CHANGE,
  readCatalogFilters,
  setCatalogFilters,
} from '@/lib/catalog-filters';

interface WindowTab {
  path: string;
  href: string;
  label: string;
}

const MOBILE_QUERY = '(max-width: 49rem)';
let desktopMinimized = false;
let mobileOpen = false;

const tabsByLocale = new Map<string, Map<string, WindowTab>>();
const pathKey = (path: string) => path.replace(/\/$/, '') || '/';

class PortfolioDesktop extends HTMLElement {
  private listeners?: AbortController;

  connectedCallback() {
    this.listeners?.abort();
    this.listeners = new AbortController();
    const options = { signal: this.listeners.signal };
    const list = this.querySelector<HTMLElement>('[data-desktop-tabs]')!;
    const closeTemplate = this.querySelector<HTMLTemplateElement>('[data-tab-close-label]')!;
    const profile = this.querySelector<HTMLAnchorElement>('[data-desktop-brand]')!;
    const dock = [...this.querySelectorAll<HTMLAnchorElement>('[data-desktop-launch]')];
    const workLauncher = dock.find((link) => link.dataset.app === 'work')!;
    const workPath = workLauncher.dataset.desktopLaunch!;
    const toggle = this.querySelector<HTMLButtonElement>('[data-assistant-toggle]')!;
    const assistant = this.querySelector<HTMLElement>('[data-assistant-island]')!;
    const checkAssistantFlag = this.hasAttribute('data-assistant-flag');
    let assistantEnabled = !checkAssistantFlag;
    const mobile = matchMedia(MOBILE_QUERY);
    const more = this.querySelector<HTMLDetailsElement>('[data-desktop-more]')!;
    const moreSummary = more.querySelector('summary')!;
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (event.target instanceof Node && !more.contains(event.target)) more.open = false;
      },
      options,
    );
    more.addEventListener(
      'keydown',
      (event) => {
        if (event.key !== 'Escape' || !more.open) return;
        more.open = false;
        moreSummary.focus();
      },
      options,
    );
    const updateAssistant = () => {
      const open = assistantEnabled && (mobile.matches ? mobileOpen : !desktopMinimized);
      const state = open ? 'open' : 'minimized';
      this.dataset.assistant = assistantEnabled ? state : 'disabled';
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener(
      'click',
      () => {
        if (!assistantEnabled) return;
        more.open = false;
        if (mobile.matches) mobileOpen = !mobileOpen;
        else desktopMinimized = !desktopMinimized;
        updateAssistant();
        if (this.dataset.assistant === 'open') {
          this.querySelector<HTMLButtonElement>('[data-assistant-minimize]')?.focus();
        }
      },
      options,
    );
    const locale = this.dataset.locale!;
    const home = pathKey(profile.pathname);
    const current = this.dataset.path!;
    const workspace = tabsByLocale.get(locale) ?? new Map<string, WindowTab>();
    tabsByLocale.set(locale, workspace);

    if (workspace.size === 0) {
      workspace.set(home, { path: home, href: profile.pathname, label: profile.dataset.tabLabel! });
    }

    this.addEventListener(
      'click',
      (event) => {
        if (!(event.target instanceof Element)) return;
        const action = event.target.closest<HTMLAnchorElement>('[data-assistant-destination]');
        const catalogue = workspace.get(workPath);
        if (action && catalogue) {
          const target = new URL(action.href);
          if (
            target.origin === location.origin &&
            (pathKey(target.pathname) === workPath || target.pathname.startsWith(workPath + '/'))
          ) {
            const source = new URL(catalogue.href, location.origin);
            setCatalogFilters(target.searchParams, readCatalogFilters(source.search));
            action.href = target.href;
          }
        }
        if (event.target.closest('[data-desktop-launch]')) more.open = false;
        if (!assistantEnabled) return;
        if (event.target.closest('[data-assistant-minimize]')) {
          if (mobile.matches) mobileOpen = false;
          else desktopMinimized = true;
          updateAssistant();
          toggle.focus();
        } else if (
          mobile.matches &&
          mobileOpen &&
          event.target.closest(
            '[data-desktop-launch], [data-assistant-destination], [data-desktop-brand]',
          )
        ) {
          mobileOpen = false;
          updateAssistant();
        }
      },
      options,
    );
    mobile.addEventListener('change', updateAssistant, options);
    updateAssistant();
    if (checkAssistantFlag) {
      toggle.hidden = true;
      assistant.hidden = true;
      assistant.setAttribute('inert', '');
      watchAssistantFlag(
        (enabled) => {
          const focusedAssistant =
            assistant.contains(document.activeElement) || document.activeElement === toggle;
          assistantEnabled = enabled;
          toggle.hidden = !enabled;
          assistant.hidden = !enabled;
          assistant.toggleAttribute('inert', !enabled);
          if (!enabled) {
            mobileOpen = false;
            assistant
              .querySelector('.desktop-assistant')
              ?.dispatchEvent(new Event(ASSISTANT_DISABLED));
          }
          updateAssistant();
          if (!enabled && focusedAssistant) profile.focus();
        },
        () => this.dataset.assistant === 'open',
        options.signal,
      );
    }

    const sync = () => {
      if (pathKey(location.pathname) !== current) return;
      const tab = {
        path: current,
        href: location.pathname + location.search,
        label: this.dataset.app!,
      };
      workspace.set(current, tab);
      list.replaceChildren(
        ...[...workspace.values()].map(({ path, href, label }) => {
          const link = document.createElement('a');
          link.href = href;
          const caption = document.createElement('span');
          caption.textContent = label;
          const launcher = path.startsWith(workPath + '/')
            ? workLauncher
            : dock.find((item) => item.dataset.desktopLaunch === path);
          const icon = launcher?.querySelector('svg');
          if (icon) link.append(icon.cloneNode(true));
          link.append(caption);
          link.title = label;
          if (path === current) link.setAttribute('aria-current', 'page');
          const item = document.createElement('span');
          item.className = 'desktop-tab';
          item.append(link);
          if (path !== home || workspace.size > 1) {
            const close = closeTemplate.content
              .querySelector('button')!
              .cloneNode(true) as HTMLButtonElement;
            close.dataset.closePath = path;
            close.title = closeTemplate.dataset.tabCloseLabel!.replace('{tab}', () => label);
            close.setAttribute('aria-label', close.title);
            item.append(close);
          }
          return item;
        }),
      );
      const selected = list.querySelector('[aria-current]')?.parentElement;
      if (selected) {
        const tabBox = selected.getBoundingClientRect();
        const listBox = list.getBoundingClientRect();
        list.scrollLeft +=
          Math.max(0, tabBox.right - listBox.right) + Math.min(0, tabBox.left - listBox.left);
      }
      for (const link of dock) {
        const path = link.dataset.desktopLaunch!;
        link.href = workspace.get(path)?.href ?? path;
      }
    };

    let closingCurrent = false;
    list.addEventListener(
      'click',
      async (event) => {
        const close =
          event.target instanceof Element
            ? event.target.closest<HTMLButtonElement>('button[data-close-path]')
            : null;
        if (!close || closingCurrent) return;
        const path = close.dataset.closePath!;
        if (path !== current) {
          workspace.delete(path);
          sync();
          list.querySelector<HTMLAnchorElement>('[aria-current]')?.focus();
          return;
        }
        const currentTab = workspace.get(current)!;
        workspace.delete(current);
        const parent = current.startsWith(workPath + '/') ? workspace.get(workPath) : undefined;
        const fallback = parent?.href ?? [...workspace.values()].at(-1)?.href ?? profile.pathname;
        closingCurrent = true;
        try {
          await navigate(fallback, { history: 'replace' });
        } finally {
          closingCurrent = false;
          if (this.isConnected) {
            workspace.set(current, currentTab);
            sync();
          } else {
            document
              .querySelector<HTMLAnchorElement>('[data-desktop-tabs] [aria-current]')
              ?.focus();
          }
        }
      },
      options,
    );

    document.addEventListener('astro:after-swap', sync, options);
    document.addEventListener(CATALOG_FILTERS_CHANGE, sync, options);
    sync();
  }

  disconnectedCallback() {
    this.listeners?.abort();
  }
}

customElements.define('portfolio-desktop', PortfolioDesktop);

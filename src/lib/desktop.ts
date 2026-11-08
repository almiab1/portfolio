// ABOUTME: Tracks open portfolio apps across Astro navigations.
// ABOUTME: Keeps project filters attached to the open catalogue tab.
import { navigate } from 'astro:transitions/client';
import { CATALOG_FILTERS_CHANGE } from '@/lib/catalog-filters';

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
    const close = this.querySelector<HTMLButtonElement>('[data-desktop-close]')!;
    const profile = this.querySelector<HTMLAnchorElement>('[data-desktop-brand]')!;
    const dock = [...this.querySelectorAll<HTMLAnchorElement>('[data-desktop-launch]')];
    const toggle = this.querySelector<HTMLButtonElement>('[data-assistant-toggle]')!;
    const mobile = matchMedia(MOBILE_QUERY);
    const updateAssistant = () => {
      const open = mobile.matches ? mobileOpen : !desktopMinimized;
      this.dataset.assistant = open ? 'open' : 'minimized';
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener(
      'click',
      () => {
        if (mobile.matches) mobileOpen = !mobileOpen;
        else desktopMinimized = !desktopMinimized;
        updateAssistant();
        if (this.dataset.assistant === 'open') {
          this.querySelector<HTMLButtonElement>('[data-assistant-minimize]')?.focus();
        }
      },
      options,
    );
    this.addEventListener(
      'click',
      (event) => {
        if (!(event.target instanceof Element)) return;
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

    const locale = this.dataset.locale!;
    const home = pathKey(profile.pathname);
    const current = this.dataset.path!;
    const workspace = tabsByLocale.get(locale) ?? new Map<string, WindowTab>();
    tabsByLocale.set(locale, workspace);

    if (!workspace.has(home)) {
      workspace.set(home, { path: home, href: profile.pathname, label: profile.dataset.tabLabel! });
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
          link.textContent = label;
          if (path === current) link.setAttribute('aria-current', 'page');
          return link;
        }),
      );
      const selected = list.querySelector('[aria-current]');
      if (selected) {
        const tabBox = selected.getBoundingClientRect();
        const listBox = list.getBoundingClientRect();
        list.scrollLeft +=
          Math.max(0, tabBox.right - listBox.right) + Math.min(0, tabBox.left - listBox.left);
      }
      close.hidden = current === home;
      for (const link of dock) {
        const tab = workspace.get(link.dataset.desktopLaunch!);
        if (tab) link.href = tab.href;
      }
    };

    close.addEventListener(
      'click',
      async () => {
        const currentTab = workspace.get(current);
        workspace.delete(current);
        const work = dock.find((link) => link.dataset.app === 'work');
        const parent =
          work && current.startsWith(work.dataset.desktopLaunch + '/')
            ? workspace.get(work.dataset.desktopLaunch!)
            : undefined;
        const fallback = parent ?? [...workspace.values()].at(-1);
        if (!fallback) return;
        close.disabled = true;
        try {
          await navigate(fallback.href, { history: 'replace' });
          if (this.isConnected && currentTab) {
            workspace.set(current, currentTab);
            sync();
          } else {
            document
              .querySelector<HTMLAnchorElement>('[data-desktop-tabs] [aria-current]')
              ?.focus();
          }
        } finally {
          close.disabled = false;
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

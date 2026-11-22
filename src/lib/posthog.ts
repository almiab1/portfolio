// ABOUTME: Sends explicit portfolio analytics through the bundled PostHog client.
// ABOUTME: Restricts event and log payloads to public portfolio metadata.

import posthog from 'posthog-js/no-external';
import { listenForPortfolioEvents, sanitizePortfolioEvent } from './portfolio-events';

const LOG_MESSAGES = new Map([
  ['contact_method_opened', 'portfolio contact method opened'],
  ['project_detail_opened', 'portfolio project detail opened'],
  ['cv_downloaded', 'portfolio CV downloaded'],
]);

const FETCH_OPTIONS = {
  cache: 'no-store',
  referrerPolicy: 'no-referrer',
  credentials: 'omit',
} satisfies RequestInit;

let started = false;

function getCanonicalPage() {
  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) return;

  const { origin, pathname } = new URL(canonical.href);
  return { $current_url: origin + pathname, $pathname: pathname };
}

function getInteractionProperties(event: string, properties: Record<string, unknown>) {
  const locale = document.documentElement.lang;
  if (locale !== 'es' && locale !== 'en') return;

  const safeProperties = sanitizePortfolioEvent(event, { ...properties, locale });
  if (safeProperties) return { ...safeProperties, locale };
}

export function startPostHog(
  token: string | undefined,
  host: string | undefined,
  environment: string,
) {
  const projectToken = token?.trim();
  const apiHost = host?.trim();
  if (started || !projectToken || !apiHost || !window.fetch) return;
  started = true;

  posthog.init(projectToken, {
    api_host: apiHost,
    persistence: 'memory',
    person_profiles: 'never',
    debug: false,
    advanced_disable_flags: true,
    advanced_disable_toolbar_metrics: true,
    disable_external_dependency_loading: true,
    disable_session_recording: true,
    session_recording: { blockClass: 'ph-no-record' },
    disable_surveys: true,
    disable_product_tours: true,
    disable_conversations: true,
    disable_web_experiments: true,
    autocapture: false,
    rageclick: false,
    capture_dead_clicks: false,
    enable_heatmaps: false,
    capture_exceptions: false,
    capture_performance: false,
    capture_pageview: false,
    capture_pageleave: false,
    save_referrer: false,
    save_campaign_params: false,
    disable_capture_url_hashes: true,
    api_transport: 'fetch',
    disable_beacon: true,
    fetch_options: FETCH_OPTIONS,
    request_batching: false,
    disable_compression: true,
    before_send: ({ event, properties, uuid, timestamp }) => {
      const safeProperties =
        event === '$pageview' ? getCanonicalPage() : getInteractionProperties(event, properties);
      if (!safeProperties) return null;

      return {
        event,
        uuid,
        timestamp,
        properties: {
          token: projectToken,
          distinct_id: posthog.get_distinct_id(),
          $process_person_profile: false,
          ...safeProperties,
        },
      };
    },
    logs: {
      serviceName: 'portfolio-web',
      environment,
      captureConsoleLogs: false,
      beforeSend: ({ body, attributes }) => {
        const message = LOG_MESSAGES.get(body);
        const safeAttributes = message && getInteractionProperties(body, attributes ?? {});
        if (!message || !safeAttributes) return null;

        return {
          body: message,
          level: 'info',
          // The SDK adds the live URL to OTLP attributes after this hook. A null override
          // replaces that value and the encoder drops the attribute.
          attributes: { ...safeAttributes, 'url.full': null },
        };
      },
    },
  });

  let lastPage: string | undefined;
  const capturePage = () => {
    const page = getCanonicalPage();
    if (!page || page.$current_url === lastPage) return;

    lastPage = page.$current_url;
    posthog.capture('$pageview', page);
  };

  document.addEventListener('astro:page-load', capturePage);
  capturePage();
  listenForPortfolioEvents((event, properties) => {
    posthog.capture(event, properties);
    if (LOG_MESSAGES.has(event)) posthog.logger.info(event, properties);
  });
}

// ABOUTME: Validates decoded PostHog event and OTLP requests before forwarding.
// ABOUTME: Returns synthetic correlation fields and public controls for the verification report.
import { gunzipSync } from 'node:zlib';

const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const VERSION = /^\d+\.\d+\.\d+(?:[-.][A-Za-z0-9.-]+)?$/;
const TOKEN = /^phc_[A-Za-z0-9_-]{8,}$/;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const CV_LOG = 'portfolio CV downloaded';
const CANONICAL = 'https://alejandromira.com';

export class VerificationError extends Error {}

export function requireCheck(check, message) {
  if (!check) throw new VerificationError(message);
}

function requireAllowedKeys(value, allowed) {
  requireCheck(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).every((key) => allowed.includes(key)),
    'Unexpected analytics fields',
  );
}

function items(value) {
  requireCheck(Array.isArray(value) && value.length > 0, 'Empty or unknown analytics envelope');
  return value;
}

function text(buffer, headers, compression) {
  const encoding = headers['content-encoding'];
  const gzip = buffer[0] === 0x1f && buffer[1] === 0x8b;
  requireCheck(!encoding || (encoding === 'gzip' && gzip), 'Unsupported analytics encoding');
  if (gzip) return gunzipSync(buffer, { maxOutputLength: 128_000 }).toString();
  const raw = buffer.toString();
  if ((headers['content-type'] ?? '').startsWith('application/x-www-form-urlencoded')) {
    const form = new URLSearchParams(raw);
    const values = form.getAll('data');
    requireCheck(
      form.size === 1 && values.length === 1 && /^[a-zA-Z0-9+/]+={0,2}$/.test(values[0]),
      'Unsupported analytics form encoding',
    );
    return Buffer.from(values[0], 'base64').toString();
  }
  requireCheck(
    !compression && (headers['content-type'] ?? '').startsWith('application/json'),
    'Unsupported analytics body format',
  );
  return raw;
}

function inspectEvents(payload, locale) {
  requireAllowedKeys(payload, ['api_key', 'batch', 'sent_at']);
  requireCheck(
    TOKEN.test(payload.api_key) && TIMESTAMP.test(payload.sent_at),
    'Invalid event batch metadata',
  );
  const prefix = locale === 'en' ? '/en' : '';
  return items(payload.batch).map((entry) => {
    requireAllowedKeys(entry, ['event', 'uuid', 'timestamp', 'properties']);
    const { event, uuid, timestamp, properties } = entry;
    const common = ['token', 'distinct_id', '$process_person_profile'];
    const pageview = event === '$pageview';
    requireCheck(pageview || event === 'cv_downloaded', 'Unexpected analytics event');
    requireAllowedKeys(properties, [
      ...common,
      ...(pageview ? ['$current_url', '$pathname'] : ['locale', 'cv_locale']),
    ]);
    const distinctId = properties.distinct_id;
    requireCheck(
      UUID.test(uuid) &&
        TIMESTAMP.test(timestamp) &&
        UUID.test(distinctId) &&
        properties.token === payload.api_key &&
        properties.$process_person_profile === false,
      'Invalid event identifiers',
    );
    if (pageview) {
      const rawPath = properties.$pathname;
      const path = typeof rawPath === 'string' && rawPath.endsWith('/') ? rawPath : rawPath + '/';
      requireCheck(
        [prefix + '/', prefix + '/cv/'].includes(path) &&
          properties.$current_url === CANONICAL + rawPath,
        'Unexpected canonical pageview',
      );
      return { name: event, path, distinctId };
    }
    requireCheck(
      properties.locale === locale && properties.cv_locale === locale,
      'Unexpected CV event properties',
    );
    return { name: event, locale, cvLocale: locale, distinctId };
  });
}

function attributes(list, schema) {
  const values = new Map();
  for (const entry of items(list)) {
    requireAllowedKeys(entry, ['key', 'value']);
    requireAllowedKeys(entry.value, ['stringValue']);
    const value = entry.value.stringValue;
    requireCheck(
      Object.hasOwn(schema, entry.key) &&
        !values.has(entry.key) &&
        typeof value === 'string' &&
        schema[entry.key].test(value),
      'Unexpected analytics attribute',
    );
    values.set(entry.key, value);
  }
  return values;
}

function inspectLogs(payload, locale) {
  requireAllowedKeys(payload, ['resourceLogs']);
  return items(payload.resourceLogs).flatMap((resourceLog) => {
    requireAllowedKeys(resourceLog, ['resource', 'scopeLogs']);
    requireAllowedKeys(resourceLog.resource, ['attributes']);
    const resource = attributes(resourceLog.resource.attributes, {
      'service.name': /^portfolio-web$/,
      'os.name': /^(Linux|macOS|Windows)$/,
      'os.version': /^\d{1,4}(?:\.\d{1,4}){0,3}$/,
      'deployment.environment': /^(production|preview)$/,
      'telemetry.sdk.name': /^(posthog-js|web)$/,
      'telemetry.sdk.version': VERSION,
    });
    requireCheck(resource.has('service.name'), 'Missing portfolio log service');
    return items(resourceLog.scopeLogs).flatMap((scopeLog) => {
      requireAllowedKeys(scopeLog, ['scope', 'logRecords']);
      requireAllowedKeys(scopeLog.scope, ['name', 'version']);
      requireCheck(
        /^(web|posthog-js)$/.test(scopeLog.scope.name) && VERSION.test(scopeLog.scope.version),
        'Unexpected log instrumentation scope',
      );
      return items(scopeLog.logRecords).map((record) => {
        requireAllowedKeys(record, [
          'timeUnixNano',
          'observedTimeUnixNano',
          'severityNumber',
          'severityText',
          'body',
          'attributes',
        ]);
        requireAllowedKeys(record.body, ['stringValue']);
        requireCheck(
          typeof record.timeUnixNano === 'string' &&
            /^\d{19}$/.test(record.timeUnixNano) &&
            typeof record.observedTimeUnixNano === 'string' &&
            /^\d{19}$/.test(record.observedTimeUnixNano) &&
            record.severityNumber === 9 &&
            record.severityText === 'INFO' &&
            record.body.stringValue === CV_LOG,
          'Unexpected analytics log',
        );
        const values = attributes(record.attributes, {
          posthogDistinctId: UUID,
          sessionId: UUID,
          'window.id': UUID,
          sessionStartTimestamp: /^\d{13}$/,
          lastActivityTimestamp: /^\d{13}$/,
          locale: /^(es|en)$/,
          cv_locale: /^(es|en)$/,
        });
        requireCheck(
          values.get('locale') === locale &&
            values.get('cv_locale') === locale &&
            values.has('posthogDistinctId'),
          'Missing CV log correlation',
        );
        return {
          name: CV_LOG,
          locale,
          cvLocale: locale,
          distinctId: values.get('posthogDistinctId'),
        };
      });
    });
  });
}

const HEADERS = {
  accept: /^\*\/\*$/,
  'accept-encoding': /^(?:gzip|deflate|br|zstd|, )+$/,
  'accept-language': /^(?:en-US|en|es-ES|es|[,;q=.0-9])+$/,
  'cache-control': /^(no-cache|no-store|max-age=0)$/,
  pragma: /^no-cache$/,
  'content-length': /^\d{1,6}$/,
  'content-type': /^(application\/(json|x-www-form-urlencoded)|text\/plain)(;\s*charset=UTF-8)?$/i,
  'content-encoding': /^gzip$/,
  origin: null,
  'user-agent': null,
  'sec-fetch-dest': /^empty$/,
  'sec-fetch-mode': /^cors$/,
  'sec-fetch-site': /^(cross-site|same-site|same-origin)$/,
  'sec-ch-ua': /^[\w ();".,=/:-]+$/,
  'sec-ch-ua-mobile': /^\?0$/,
  'sec-ch-ua-platform': /^"(Linux|Windows|macOS)"$/,
  priority: /^u=[0-7](, i)?$/,
};

function normalize(value) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

export function inspectAnalytics(
  { url, method, headers, body },
  { locale, previewOrigin, userAgent, markers },
) {
  const logs = url.pathname === '/i/v1/logs';
  requireCheck(
    (logs || url.pathname === '/e/') &&
      method === 'POST' &&
      !url.hash &&
      body?.length > 0 &&
      body.length <= 128_000,
    'Unexpected analytics request',
  );
  const version = url.searchParams.get('ver');
  for (const [name, value] of url.searchParams) {
    requireCheck(
      url.searchParams.getAll(name).length === 1 &&
        ((name === 'token' && logs && TOKEN.test(value)) ||
          (name === 'compression' && ['base64', 'gzip-js'].includes(value)) ||
          (name === 'ver' && VERSION.test(version)) ||
          (name === 'ip' && /^[01]$/.test(value)) ||
          (name === '_' && /^\d{13}$/.test(value))),
      'Unexpected analytics query parameter',
    );
  }
  requireCheck(!logs || TOKEN.test(url.searchParams.get('token')), 'Missing logs project token');
  const allowed = { ...HEADERS, origin: previewOrigin, 'user-agent': userAgent };
  for (const [name, value] of Object.entries(headers)) {
    requireCheck(
      Object.hasOwn(allowed, name) &&
        (allowed[name] instanceof RegExp ? allowed[name].test(value) : allowed[name] === value),
      'Unexpected analytics request header',
    );
  }
  const decoded = text(body, headers, url.searchParams.get('compression'));
  const packet = normalize(decodeURIComponent(url.href) + JSON.stringify(headers) + decoded);
  requireCheck(
    markers.every((marker) => !packet.includes(normalize(marker))),
    'Private canary detected in analytics request',
  );
  const payload = JSON.parse(decoded);
  return logs ? inspectLogs(payload, locale) : inspectEvents(payload, locale);
}

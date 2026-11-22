// ABOUTME: Connects one isolated Playwright context to the local Portfolio assistant.
// ABOUTME: Preserves the deployed HTML except for the serialized assistant preview flag.
import { request as httpRequest } from 'node:http';

const STREAM_HEADER = 'x-vercel-ai-ui-message-stream';
const ROOT_LOCALES = new Map([['/', 'es'], ['/en/', 'en']]);
const ISLAND_TAG = /<!--[^]*?-->|<(script|style|textarea|title|template)\b[^>]*>[^]*?<\/\1\s*>|<astro-island\s+(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;
const ATTRIBUTE = /([^\s=]+)="([^"]*)"/g;

function patchAssistant(html, lang) {
  let matches = 0;
  const patched = html.replace(ISLAND_TAG, (tag) => {
    if (!tag.startsWith('<astro-island ')) return tag;
    const attributes = new Map(Array.from(tag.matchAll(ATTRIBUTE), ([, name, value]) => [name, value]));
    if (!/^\/_astro\/PortfolioAssistant\.[\w-]+\.js$/.test(attributes.get('component-url') ?? '') ||
        attributes.get('component-export') !== 'default' ||
        attributes.get('client') !== 'load') {
      return tag;
    }

    const props = attributes.get('props');
    const prefix = `{&quot;lang&quot;:[0,&quot;${lang}&quot;],&quot;preview&quot;:[0,`;
    if (!props?.startsWith(prefix + 'false]')) return tag;

    matches++;
    return tag.replace(` props="${props}"`, ` props="${prefix}true${props.slice(prefix.length + 5)}"`);
  });

  return matches === 1 ? patched : html;
}

function forwardChat(port, headers, body) {
  return new Promise((resolve, reject) => {
    const upstream = httpRequest({
      hostname: '127.0.0.1',
      port,
      path: '/api/chat',
      method: 'POST',
      agent: false,
      headers,
      signal: AbortSignal.timeout(60_000),
    }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('error', reject);
      response.on('end', () => {
        resolve({
          status: response.statusCode,
          contentType: response.headers['content-type'],
          streamProtocol: response.headers[STREAM_HEADER],
          body: Buffer.concat(chunks),
        });
      });
    });

    upstream.on('error', reject);
    upstream.end(body);
  });
}

export async function installPreviewBridge(context, { previewOrigin, port, onReply }) {
  const preview = new URL(previewOrigin);
  if (preview.protocol !== 'https:' || preview.origin !== previewOrigin) {
    throw new TypeError('previewOrigin must be a canonical HTTPS origin');
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new TypeError('port must be a valid loopback TCP port');
  }
  if (typeof onReply !== 'function') {
    throw new TypeError('onReply must inspect each upstream chat response');
  }

  const matches = (url) =>
    url.origin === previewOrigin &&
    (url.pathname === '/api/chat' ||
      (url.href === previewOrigin + url.pathname && ROOT_LOCALES.has(url.pathname)));

  let chatForwarded = false;
  const handle = async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;

    if (pathname === '/api/chat') {
      if (chatForwarded || request.url() !== previewOrigin + '/api/chat' ||
          request.method() !== 'POST' || request.redirectedFrom()) {
        return route.abort();
      }

      chatForwarded = true;
      const headers = { origin: previewOrigin };
      const contentType = await request.headerValue('content-type');
      if (contentType !== null) headers['content-type'] = contentType;
      const reply = await forwardChat(port, headers, request.postDataBuffer());
      await onReply({ ...reply, body: Buffer.from(reply.body) });

      const responseHeaders = {};
      if (reply.contentType !== undefined) responseHeaders['content-type'] = reply.contentType;
      if (reply.streamProtocol !== undefined) responseHeaders[STREAM_HEADER] = reply.streamProtocol;
      return route.fulfill({ status: reply.status, headers: responseHeaders, body: reply.body });
    }

    const lang = ROOT_LOCALES.get(pathname);
    if (!lang || request.method() !== 'GET' || request.resourceType() !== 'document' ||
        request.redirectedFrom() || request.frame().parentFrame()) {
      return route.fallback();
    }

    const response = await route.fetch({ maxRedirects: 0, maxRetries: 0 });
    const headers = await response.headers();
    if (response.status() !== 200 || !/^text\/html(?:;|$)/i.test(headers['content-type'] ?? '')) {
      return route.fulfill({ response });
    }

    const original = await response.text();
    const patched = patchAssistant(original, lang);
    if (patched === original) return route.fulfill({ response });

    // Playwright exposes decoded HTML. Recompute the length and drop stale encoding and validators.
    for (const name of ['content-length', 'content-encoding', 'etag', 'content-md5', 'digest', 'content-digest']) {
      delete headers[name];
    }
    return route.fulfill({ status: response.status(), headers, body: patched });
  };

  const safelyHandle = async (route) => {
    try {
      await handle(route);
    } catch {
      // A failed inspection or transport must not release a reply to the page.
      await route.abort().catch(() => {});
    }
  };

  await context.route(matches, safelyHandle);
  return () => context.unroute(matches, safelyHandle);
}

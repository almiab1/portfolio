// ABOUTME: Exercises the deployed portfolio UI with a local assistant and real preview analytics.
// ABOUTME: Writes private synthetic correlation evidence without dumping network traffic or credentials.
import { randomUUID } from 'node:crypto';
import { open } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { chromium, devices, expect } from '@playwright/test';
import { installPreviewBridge } from './bridge.mjs';
import { inspectAnalytics, requireCheck, VerificationError } from './payloads.mjs';

const TIMEOUT = 20_000;
const CHAT_TIMEOUT = 65_000;
const FLUSH_TIMEOUT = 20_000;
const DESKTOP = { ...devices['Desktop Chrome'], serviceWorkers: 'block' };
const UTC = () => new Date().toISOString();
const CV_LOG = 'portfolio CV downloaded';

function privateFile(mode) {
  return (mode & 0o777) === 0o600;
}

function httpsOrigin(input) {
  const url = new URL(input);
  requireCheck(
    url.protocol === 'https:' && [url.origin, url.origin + '/'].includes(input),
    'Use a clean HTTPS origin',
  );
  return url.origin;
}

async function configFromEnv() {
  const { PREVIEW_ORIGIN, POSTHOG_ORIGIN, LOCAL_CHAT_PORT, REPORT_FILE, PREVIEW_ACCESS_FILE } =
    process.env;
  const previewOrigin = httpsOrigin(PREVIEW_ORIGIN);
  const posthogOrigin = httpsOrigin(POSTHOG_ORIGIN);
  requireCheck(
    previewOrigin !== posthogOrigin && previewOrigin.endsWith('.vercel.app'),
    'Use distinct preview deployment and collector origins',
  );
  const port = Number(LOCAL_CHAT_PORT ?? '18762');
  requireCheck(
    Number.isInteger(port) && port > 0 && port <= 65535 && REPORT_FILE,
    'Set a valid local chat port and report path',
  );
  let shareUrl;
  if (PREVIEW_ACCESS_FILE) {
    const file = await open(PREVIEW_ACCESS_FILE, 'r');
    try {
      const stat = await file.stat();
      requireCheck(
        stat.isFile() && privateFile(stat.mode) && stat.size < 16_384,
        'Preview access file must be a small, private regular file',
      );
      shareUrl = new URL((await file.readFile('utf8')).trim());
      requireCheck(
        shareUrl.origin === previewOrigin &&
          !shareUrl.username &&
          !shareUrl.password &&
          !shareUrl.hash,
        'Preview access must match the exact deployment',
      );
    } finally {
      await file.close();
    }
  }
  return { previewOrigin, posthogOrigin, port, reportFile: REPORT_FILE, shareUrl };
}

async function bootstrapAccess(context, previewOrigin, shareUrl) {
  if (!shareUrl) return;
  let next = shareUrl;
  for (let hop = 0; hop < 4; hop++) {
    requireCheck(
      next.origin === previewOrigin && !next.username && !next.password,
      'Preview access redirected outside the deployment',
    );
    const response = await context.request.get(next.href, { maxRedirects: 0, timeout: TIMEOUT });
    try {
      if (response.ok()) return;
      const location = response.headers().location;
      requireCheck(
        response.status() >= 300 && response.status() < 400 && location,
        'Preview access bootstrap failed',
      );
      next = new URL(location, next);
    } finally {
      await response.dispose();
    }
  }
  throw new Error('Preview access did not settle');
}

function words(text) {
  return (
    text
      .normalize('NFKC')
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

function replyText({ status, contentType, streamProtocol, body }) {
  requireCheck(
    status === 200 &&
      /^text\/event-stream(?:;|$)/i.test(contentType ?? '') &&
      streamProtocol === 'v1',
    'Local chat did not return a successful UI message stream',
  );
  const records = body
    .toString()
    .trim()
    .split(/\r?\n\r?\n/);
  requireCheck(records.pop() === 'data: [DONE]', 'Unterminated assistant stream');
  const events = records.map((record) => {
    requireCheck(record.startsWith('data: '), 'Unexpected assistant stream frame');
    return JSON.parse(record.slice(6));
  });
  requireCheck(
    events[0]?.type === 'start' &&
      events.at(-1)?.type === 'finish' &&
      events.at(-1)?.finishReason === 'stop' &&
      events.every(({ type }) =>
        ['start', 'text-start', 'text-delta', 'text-end', 'data-destination', 'finish'].includes(
          type,
        ),
      ),
    'Assistant stream did not complete normally',
  );
  const reply = events
    .filter(({ type }) => type === 'text-delta')
    .map(({ delta }) => {
      requireCheck(typeof delta === 'string', 'Invalid assistant text frame');
      return delta;
    })
    .join('');
  requireCheck(
    /\bglio[\s-]?ia\b/i.test(reply) && /\bsimdat\b/i.test(reply),
    'Assistant reply omitted a requested project',
  );
  return reply;
}

function replyFragments(reply) {
  const visibleMarkdown = reply
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<?https?:\/\/[^\s<>"')]+>?/gi, '')
    .replace(/^[ \t]*\d+[.)][ \t]+/gm, '')
    .replace(/<[^>]+>/g, '');
  const tokens = Array.from(visibleMarkdown.matchAll(/[\p{L}\p{N}]+/gu));
  requireCheck(tokens.length >= 12, 'Assistant reply had too little grounded text');
  const width = 6;
  return [0, Math.floor((tokens.length - width) / 2), tokens.length - width].map((start) => {
    const last = tokens[start + width - 1];
    return visibleMarkdown.slice(tokens[start].index, last.index + last[0].length);
  });
}

function makeInputs(locale) {
  const id = randomUUID().replaceAll('-', '');
  const marker = 'verification-' + id;
  const question =
    locale === 'es'
      ? `Compara GLIO-IA con SIMDAT. Referencia de prueba ${marker}.`
      : `Compare GLIO-IA and SIMDAT. Test reference ${marker}.`;
  return { question, marker, query: 'query-' + id, fragment: 'fragment-' + id };
}

function installAnalyticsGate(context, config, session, markers) {
  const { previewOrigin, posthogOrigin } = config;
  const pending = new Map();
  const seen = new Set();
  context.on('response', (response) => {
    const entry = pending.get(response.request());
    if (!entry) return;
    entry.status = response.status();
    entry.at = UTC();
    session.responses.push(entry);
    if (entry.status < 200 || entry.status >= 300) {
      session.analyticsFailure ??= 'Collector returned an unsuccessful status';
    }
  });
  context.on('requestfinished', (request) => {
    const entry = pending.get(request);
    if (!entry) return;
    pending.delete(request);
    entry.completed = true;
  });
  context.on('requestfailed', (request) => {
    if (!pending.has(request)) return;
    pending.delete(request);
    session.analyticsFailure ??= 'Browser could not complete the collector request';
  });

  return context.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== posthogOrigin) {
      if (
        url.origin === previewOrigin &&
        url.pathname !== '/api/chat' &&
        ['GET', 'HEAD'].includes(request.method()) &&
        !request.redirectedFrom()
      ) {
        return route.continue();
      }
      if (url.origin === previewOrigin && url.pathname === '/api/chat') {
        session.analyticsFailure ??= 'Unbridged assistant request blocked';
      }
      return route.abort();
    }
    try {
      requireCheck(
        !session.analyticsFailure && !request.redirectedFrom(),
        'Unsafe analytics redirect',
      );
      const controls = inspectAnalytics(
        {
          url,
          method: request.method(),
          headers: await request.allHeaders(),
          body: request.postDataBuffer(),
        },
        { locale: session.locale, previewOrigin, userAgent: DESKTOP.userAgent, markers },
      );
      const distinctId = session.distinctId ?? controls[0].distinctId;
      requireCheck(
        controls.every((control) => control.distinctId === distinctId),
        'Analytics identifier changed within one session',
      );
      session.distinctId = distinctId;
      for (const control of controls) {
        const key = control.path ?? control.name;
        requireCheck(!seen.has(key), 'Duplicate analytics request blocked');
        seen.add(key);
      }
      pending.set(request, { path: url.pathname, controls, completed: false });
      return await route.continue();
    } catch (error) {
      session.analyticsFailure ??=
        error instanceof VerificationError
          ? error.message
          : 'Analytics privacy or transport check failed';
      pending.delete(request);
      return route.abort();
    }
  });
}

async function waitForControls(session, targets) {
  await expect
    .poll(
      () => {
        const accepted = session.responses
          .filter(({ completed, status }) => completed && status >= 200 && status < 300)
          .flatMap(({ controls }) => controls);
        const complete = targets.every((target) =>
          accepted.some(({ name, path }) => target === (path ?? name)),
        );
        return session.analyticsFailure ? 'blocked' : complete ? 'accepted' : 'pending';
      },
      { timeout: FLUSH_TIMEOUT },
    )
    .toBe('accepted');
}

async function verifySession(browser, config, session) {
  const { locale, inputs } = session;
  const { previewOrigin, port, shareUrl } = config;
  const prefix = locale === 'en' ? '/en' : '';
  const context = await browser.newContext({
    ...DESKTOP,
    locale: locale === 'en' ? 'en-US' : 'es-ES',
  });
  context.setDefaultTimeout(TIMEOUT);
  try {
    await bootstrapAccess(context, previewOrigin, shareUrl);
    const accessValues = shareUrl
      ? [...shareUrl.searchParams.values()].filter((value) => value.length >= 8)
      : [];
    const markers = [
      inputs.question,
      inputs.marker,
      inputs.query,
      inputs.fragment,
      ...accessValues,
    ];
    await context.addInitScript(
      ({ previewOrigin, home, query, fragment }) => {
        Object.defineProperties(navigator, {
          webdriver: { value: false },
          userAgentData: { value: undefined },
        });
        if (
          location.origin === previewOrigin &&
          location.pathname === home &&
          window === window.top
        ) {
          history.replaceState(history.state, '', '?verification=' + query + '#' + fragment);
        }
      },
      { previewOrigin, home: prefix + '/', query: inputs.query, fragment: inputs.fragment },
    );
    await installAnalyticsGate(context, config, session, markers);
    await installPreviewBridge(context, {
      previewOrigin,
      port,
      onReply(reply) {
        session.chatStatus = reply.status;
        session.chatRespondedAt = UTC();
        try {
          const answer = replyText(reply);
          session.replyFragments = replyFragments(answer);
          session.normalizedReplyFragments = session.replyFragments.map((fragment) =>
            words(fragment).join(' '),
          );
          markers.push(answer, ...session.replyFragments, ...session.normalizedReplyFragments);
        } catch {
          session.chatFailure = 'Local assistant stream failed validation';
          throw new Error(session.chatFailure);
        }
      },
    });

    const page = await context.newPage();
    session.phase = 'preview-home';
    const response = await page.goto(previewOrigin + prefix + '/', {
      waitUntil: 'domcontentloaded',
      timeout: TIMEOUT,
    });
    requireCheck(
      response?.status() === 200 && new URL(page.url()).origin === previewOrigin,
      'Preview home failed to load',
    );
    const assistant = page.getByRole('complementary', {
      name: locale === 'en' ? 'Assistant' : 'Asistente',
    });
    const question = assistant.locator('#assistant-question');
    await expect(question).toBeVisible({ timeout: TIMEOUT });
    session.phase = 'initial-pageview';
    await waitForControls(session, [prefix + '/']);

    session.phase = 'assistant-turn';
    await question.fill(inputs.question);
    session.chatSubmittedAt = UTC();
    await question.press('Enter');
    const chat = assistant.getByRole('log');
    await expect(chat.getByText(inputs.question, { exact: true })).toBeVisible({
      timeout: TIMEOUT,
    });
    const answer = chat.locator('.assistant-reply').last();
    await expect
      .poll(
        async () => {
          if (session.chatFailure) return 'failed';
          if (!session.normalizedReplyFragments || !(await answer.isVisible())) return 'pending';
          const rendered = words(await answer.innerText()).join(' ');
          return session.normalizedReplyFragments.every((part) => rendered.includes(part))
            ? 'rendered'
            : 'pending';
        },
        { timeout: CHAT_TIMEOUT },
      )
      .toBe('rendered');
    session.replyVisible = true;

    session.phase = 'cv-download';
    await page.locator('.desktop-dock').getByRole('link', { name: 'CV', exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname.replace(/\/$/, '') === prefix + '/cv', {
      timeout: TIMEOUT,
    });
    const download = page.waitForEvent('download', { timeout: TIMEOUT });
    download.catch(() => {});
    await page.locator(`main a[download][data-cv-edition="${locale}"]`).click();
    requireCheck(/\.pdf$/i.test((await download).suggestedFilename()), 'Expected a CV PDF download');
    session.cvDownloadVerified = true;

    session.phase = 'analytics-flush';
    await waitForControls(session, [prefix + '/', prefix + '/cv/', 'cv_downloaded', CV_LOG]);
  } finally {
    await context.close();
  }
  requireCheck(!session.analyticsFailure && !session.chatFailure, 'Verification gate failed');
  session.verified = true;
  session.phase = 'complete';
}

export async function runVerification(config, browser) {
  const { reportFile, previewOrigin, posthogOrigin } = config;
  const file = await open(reportFile, 'wx', 0o600);
  const report = {
    startedAt: UTC(),
    previewOrigin,
    posthogOrigin,
    scope: 'browser',
    status: 'partial',
    sessions: [],
  };
  try {
    for (const locale of ['es', 'en']) {
      const session = {
        locale,
        startedAt: UTC(),
        inputs: makeInputs(locale),
        responses: [],
        verified: false,
      };
      report.sessions.push(session);
      try {
        await verifySession(browser, config, session);
      } catch (error) {
        session.failure =
          session.chatFailure ??
          session.analyticsFailure ??
          (error instanceof VerificationError
            ? error.message
            : 'Verification stopped during ' + (session.phase ?? 'preview access'));
        break;
      } finally {
        session.finishedAt = UTC();
      }
    }
    if (
      report.sessions.length === 2 &&
      report.sessions.every(({ verified }) => verified) &&
      report.sessions[0].distinctId !== report.sessions[1].distinctId
    ) {
      report.status = 'passed';
    }
  } finally {
    report.finishedAt = UTC();
    try {
      await file.writeFile(JSON.stringify(report, null, 2) + '\n');
    } finally {
      await file.close();
    }
  }
  return report;
}

async function main() {
  let browser;
  try {
    const config = await configFromEnv();
    browser = await chromium.launch({ timeout: TIMEOUT });
    const report = await runVerification(config, browser);
    if (report.status !== 'passed') {
      console.error('Verification incomplete. Inspect the private report before any later run.');
      process.exitCode = 1;
    } else {
      console.log('Browser checks passed. Verify NVIDIA backend logs and stored PostHog data using the skill.');
    }
  } catch {
    console.error(
      'Verification could not start or save its report. Check private inputs and local prerequisites.',
    );
    process.exitCode = 1;
  } finally {
    await browser?.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();

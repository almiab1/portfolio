// ABOUTME: Determines which builds can offer a remote portfolio assistant.
// ABOUTME: Supplies the one origin allowed to start Turnstile for each hosted build.
interface AssistantBuild {
  previewOptIn: boolean;
  publicOptIn: boolean;
  vercel: boolean;
  environment?: string;
  deployment?: string;
  siteKey?: string;
}

const PUBLIC_ORIGIN = 'https://www.alejandromira.com';

export function getAssistantAvailability(build: AssistantBuild) {
  const hosted = build.vercel || build.environment !== undefined;
  const local = build.previewOptIn && !hosted;
  const siteKey = build.siteKey?.trim();
  let origin: string | undefined;
  if (build.environment === 'production' && build.publicOptIn) {
    origin = PUBLIC_ORIGIN;
  } else if (build.environment === 'preview' && build.previewOptIn && build.deployment) {
    origin = `https://${build.deployment.toLowerCase()}`;
  }
  return { local, challenge: origin && siteKey ? { origin, siteKey } : undefined };
}

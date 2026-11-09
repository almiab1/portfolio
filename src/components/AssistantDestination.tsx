// ABOUTME: Renders assistant destinations as cards from a typed json-render catalog.
// ABOUTME: Resolves links and labels from portfolio data after validating the streamed ID.
import { defineCatalog, type Spec } from '@json-render/core';
import { defineRegistry, JSONUIProvider, Renderer } from '@json-render/react';
import { schema } from '@json-render/react/schema';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileText,
  FlaskConical,
  FolderKanban,
  Layers,
  Mail,
  UserRound,
} from 'lucide-react';
import { z } from 'zod';
import { DESTINATIONS, type Destination } from '@/lib/assistant-transport';
import { t, type Language } from '@/i18n/translations';

interface Props {
  destination: unknown;
  lang: Language;
}

const DESTINATION_ICONS = {
  glio: FlaskConical,
  work: FolderKanban,
  experience: BriefcaseBusiness,
  skills: Layers,
  contact: Mail,
  cv: FileText,
  profile: UserRound,
} as const;

const DESTINATION_ID = z.custom<Destination>(
  (value) => typeof value === 'string' && Object.hasOwn(DESTINATIONS, value),
);

const CATALOG = defineCatalog(schema, {
  components: {
    DestinationCard: {
      props: z.object({ id: DESTINATION_ID, lang: z.enum(['es', 'en']) }),
      description: 'A link to a published project or a portfolio app.',
    },
  },
  actions: {},
});

const { registry } = defineRegistry(CATALOG, {
  components: {
    DestinationCard: ({ props: { id, lang } }) => {
      const destination = DESTINATIONS[id];
      const Icon = DESTINATION_ICONS[id];
      const translate = t(lang);
      const label = translate(destination.label);

      return (
        <a
          className="assistant-destination"
          href={lang === 'en' ? '/en' + destination.path : destination.path}
          aria-label={label}
          data-assistant-destination
        >
          <span className="assistant-destination-icon">
            <Icon size={18} aria-hidden="true" />
          </span>
          <span className="assistant-destination-copy">
            {id === 'glio' && <strong>{translate('profile.heroGlio')}</strong>}
            <span>{label}</span>
          </span>
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      );
    },
  },
});

export default function AssistantDestination({ destination, lang }: Props) {
  const id = DESTINATION_ID.safeParse(destination);
  if (!id.success) return null;

  const spec: Spec = {
    root: 'destination',
    elements: {
      destination: {
        type: 'DestinationCard',
        props: { id: id.data, lang },
        children: [],
      },
    },
  };

  return (
    <JSONUIProvider registry={registry}>
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>
  );
}

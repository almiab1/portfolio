export const ldPerson = () => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Alejandro Mira',
  url: 'https://alejandromira.com',
  jobTitle: 'AI/GenAI Engineer',
});
export const ldWebsite = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Alejandro Mira',
  url: 'https://alejandromira.com',
});
export const ldCreativeWork = (p: { title: string; date?: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: p.title,
  datePublished: p.date,
});
export const ldSoftwareProject = (p: {
  title: string;
  description: string;
  date: string;
  url: string;
  repo?: string;
  technologies?: string[];
  keywords?: string[];
  image?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': p.repo ? 'SoftwareSourceCode' : 'CreativeWork',
  name: p.title,
  description: p.description,
  datePublished: p.date,
  url: p.url,
  ...(p.repo && { codeRepository: p.repo }),
  ...(p.technologies && { programmingLanguage: p.technologies }),
  ...(p.keywords && { keywords: p.keywords }),
  ...(p.image && { image: p.image }),
  author: {
    '@type': 'Person',
    name: 'Alejandro Mira',
    url: 'https://alejandromira.com',
  },
});
export const ldBlogPosting = (p: { title: string; date: string; description?: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: p.title,
  datePublished: p.date,
  description: p.description,
});
export const ldEvent = (p: { name: string; startDate: string; location?: string }) => ({
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: p.name,
  startDate: p.startDate,
  location: p.location,
});

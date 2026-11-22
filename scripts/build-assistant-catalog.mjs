// ABOUTME: Extracts a bilingual evidence catalog from public portfolio content.
// ABOUTME: Keeps the runtime artifact independent of Astro and the original source files.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { argv } from 'node:process';
import { pathToFileURL, URL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const REPO_ROOT = new URL('../', import.meta.url);
const PUBLIC_EMAIL = 'miraabad.alejandro@gmail.com';
const EMAIL = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi;
const PRIVATE_KEY = /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g;
const TOKEN = /\b(?:nvapi-|sk-(?:proj-)?|gh[pousr]_|github_pat_|xox[baprs]-|AKIA)[A-Za-z0-9_-]{12,}/gi;
const CREDENTIAL = /\b(?:[A-Za-z][\w-]*[_-])?(?:api[_ -]?key|access[_ -]?token|password|secret|contraseña)\s*[:=]\s*['"]?[A-Za-z0-9_./+-]{8,}['"]?/gi;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const languages = ['es', 'en'];
const locales = {
  es: {
    overview: 'Resumen', duration: 'Duración', role: 'Rol', stack: 'Tecnologías', date: 'Fecha',
    profile: 'Perfil', experience: 'Trayectoria', skills: 'Habilidades', education: 'Formación',
  },
  en: {
    overview: 'Overview', duration: 'Duration', role: 'Role', stack: 'Technologies', date: 'Date',
    profile: 'Profile', experience: 'Experience', skills: 'Skills', education: 'Education',
  },
};
const headingIds = {
  'The Challenge': 'challenge', 'El Desafío': 'challenge',
  'My Role': 'contribution', 'Mi Rol': 'contribution',
  'Technical Approach': 'approach', 'Enfoque Técnico': 'approach',
  'Technical Challenges': 'technical-challenges', 'Desafíos Técnicos': 'technical-challenges',
  'Challenges Solved': 'technical-challenges', 'Desafíos Resueltos': 'technical-challenges',
  'Results': 'outcome', 'Resultados': 'outcome', 'Outcome': 'outcome', 'Resultado': 'outcome',
  'Funding': 'funding', 'Financiación': 'funding',
  'Differentiation': 'differentiation', 'Diferenciación': 'differentiation',
  'Collaboration': 'collaboration', 'Colaboración': 'collaboration',
  'Multi-platform Architecture': 'architecture', 'Arquitectura Multiplataforma': 'architecture',
  'Development Methodology': 'methodology', 'Metodología de Desarrollo': 'methodology',
  'Key Technical Decisions': 'decisions', 'Decisiones Técnicas Clave': 'decisions',
  'Developed Tools': 'tools', 'Herramientas Desarrolladas': 'tools',
  'Pedagogical Approach': 'pedagogy', 'Enfoque Pedagógico': 'pedagogy',
};

function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/<!--[\s\S]*?(?:-->|$)|\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(PRIVATE_KEY, '[redacted]')
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1')
    .replace(/https?:\/\/[^\s<>)]+/gi, '')
    .replace(CREDENTIAL, '[redacted]')
    .replace(TOKEN, '[redacted]')
    .replace(EMAIL, (address) => address.toLowerCase() === PUBLIC_EMAIL ? address : '[redacted]')
    .trim();
}

function cleanEvidence(value) {
  if (typeof value === 'string') return cleanText(value);
  if (Array.isArray(value)) return value.map(cleanEvidence);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cleanEvidence(item)]));
  }
  return value;
}

function isPublic(data) {
  return data.draft !== true && data.private !== true && data.published !== false &&
    data.public !== false && !['draft', 'private', 'unpublished'].includes(data.status) &&
    (data.visibility === undefined || data.visibility === 'public');
}

function sectionId(title) {
  return Object.hasOwn(headingIds, title) ? headingIds[title] : `section-${title
    .normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

function publicList(values) {
  if (!Array.isArray(values)) return [];
  return values.filter((value) => typeof value === 'string' && cleanText(value) === value);
}

export async function buildCatalog(sourceRoot = REPO_ROOT) {
  const read = (path) => readFile(new URL(path, sourceRoot), 'utf8');
  const readJson = async (path) => JSON.parse(await read(path));
  const [profile, jobs, replies] = await Promise.all([
    readJson('src/i18n/profile-content.json'),
    readJson('src/data/portfolio-jobs.json'),
    readJson('src/i18n/assistant-replies.json'),
  ]);

  const catalog = {};
  for (const lang of languages) {
    const prefix = lang === 'en' ? '/en' : '';
    const labels = locales[lang];
    const ui = profile[lang];
    const entries = {};
    const projects = await readdir(new URL(`src/content/projects/${lang}/`, sourceRoot), { withFileTypes: true });
    const files = projects.filter((item) => item.isFile() && item.name.endsWith('.mdx'));
    for (const file of files.map((item) => item.name).sort()) {
      const slug = file.slice(0, -4);
      const document = await read(`src/content/projects/${lang}/${file}`);
      const match = document.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
      if (!match) throw new Error(`Missing frontmatter in ${lang}/${file}`);
      const data = parseYaml(match[1]);
      if (!data || data.lang !== lang || !isPublic(data)) continue;
      const key = data.translationKey;
      if (!SLUG.test(slug) || typeof key !== 'string' || !SLUG.test(key) || typeof data.title !== 'string') {
        throw new Error(`Missing or invalid project identity in ${lang}/${file}`);
      }
      if (cleanText(slug) !== slug || cleanText(key) !== key) continue;
      if (Object.hasOwn(entries, key)) throw new Error(`Duplicate translation key in ${lang}/${file}`);
      const sections = {};
      const addSection = (id, title, text) => {
        if (typeof text === 'string' && text.trim()) sections[id] = { title, text };
      };
      const [intro, ...headings] = cleanText(match[2]).split(/^### (.+)$/m);
      const introduction = intro.replace(/^## .+$/m, '').trim();
      addSection('overview', labels.overview, [data.summary, introduction].filter(Boolean).join('\n\n'));
      addSection('duration', labels.duration, data.duration);
      addSection('role', labels.role, data.role);
      addSection('stack', labels.stack, publicList(data.tech).join(', '));
      addSection('date', labels.date, data.date);
      for (let index = 0; index < headings.length; index += 2) {
        const title = headings[index];
        const id = sectionId(title);
        if (sections[id]) continue;
        addSection(id, title, headings[index + 1]);
      }
      entries[key] = {
        title: data.title,
        url: `${prefix}/work/${slug}`,
        kind: 'project',
        tags: publicList(data.tags),
        sections,
      };
    }
    entries.profile = {
      title: labels.profile, url: prefix || '/', kind: 'page',
      sections: { overview: { title: labels.overview, text: ui['desktop.profileBio'] } },
    };
    entries.experience = {
      title: labels.experience, url: `${prefix}/experience`, kind: 'page',
      sections: Object.fromEntries(jobs.map(({ key, company, period }) => [key, {
        title: company,
        text: `${period ?? ui['profile.currentPeriod']} · ${ui[`profile.job.${key}.role`]}\n${ui[`profile.job.${key}.summary`]}`,
      }])),
    };
    entries.skills = {
      title: labels.skills, url: `${prefix}/skills`, kind: 'page',
      sections: {
        ...Object.fromEntries(['agents', 'ml', 'software'].map((key) => [key, {
          title: ui[`profile.skill.${key}.title`], text: ui[`profile.skill.${key}.tools`],
        }])),
        education: {
          title: labels.education,
          text: [ui['profile.degree.master'], ui['profile.degree.bachelor']].join('\n'),
        },
      },
    };
    entries.cv = {
      title: ui['desktop.cvTitle'], url: `${prefix}/cv`, kind: 'page',
      sections: { overview: { title: labels.overview, text: ui['desktop.cvIntro'] } },
    };
    entries['health-dashboard'] = {
      title: 'HealthDashboard', url: `${prefix}/work#personal-projects-title`, kind: 'project',
      tags: [], sections: { overview: { title: labels.overview, text: ui['profile.healthSummary'] } },
    };
    catalog[lang] = {
      entries,
      presets: Object.fromEntries(['Cv', 'Career', 'Glio'].map((key) => [
        key.toLowerCase(), { question: ui[`desktop.ask${key}`], reply: replies[lang][`desktop.reply${key}`] },
      ])),
      contact: replies[lang]['desktop.replyContact'],
      cv: replies[lang]['desktop.replyCv'],
      fallback: replies[lang]['desktop.replyFallback'],
    };
  }
  const projectKeys = (lang) => Object.keys(catalog[lang].entries)
    .filter((key) => catalog[lang].entries[key].kind === 'project');
  if (projectKeys('es').sort().join() !== projectKeys('en').sort().join()) {
    throw new Error('Project evidence needs matching Spanish and English translation keys');
  }
  return cleanEvidence(catalog);
}

if (argv[1] && pathToFileURL(resolve(argv[1])).href === import.meta.url) {
  const target = new URL('server/assistant_catalog.json', REPO_ROOT);
  const output = JSON.stringify(await buildCatalog(), null, 2) + '\n';
  if (argv.includes('--check')) {
    if (await readFile(target, 'utf8') !== output) {
      throw new Error('Assistant catalog is stale. Run pnpm run assistant:catalog.');
    }
  } else {
    await writeFile(target, output);
  }
}

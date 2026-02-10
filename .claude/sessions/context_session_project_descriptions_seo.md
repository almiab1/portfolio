# Session: Project Descriptions Quality & SEO Improvement

## Goal

Review and improve the quality of all 11 project descriptions to make them more informative, SEO-friendly, and easy to read.

## Scope

- 11 projects x 2 languages (ES + EN) = 22 MDX files
- Frontmatter SEO fields (summary, seo.title, seo.description, cover.alt)
- MDX body content structure and quality
- JSON-LD structured data enhancement

---

## Current State Analysis

### Projects Inventory

| #   | Project              | Context  | Type    | Duration | Priority | Featured | Content Depth |
| --- | -------------------- | -------- | ------- | -------- | -------- | -------- | ------------- |
| 1   | GLIO-IA              | research | ai      | 24mo     | 8        | yes      | HIGH          |
| 2   | Cookobot             | academic | ai      | 5mo      | 7        | no       | MEDIUM        |
| 3   | SIMDAT 4.0           | company  | iot     | 18mo     | 5        | no       | HIGH          |
| 4   | woTICS               | company  | ai      | 18mo     | 5        | no       | HIGH          |
| 5   | AIPASSPORTGUARDNET   | company  | web     | 11mo     | 5        | no       | HIGH          |
| 6   | DLT4AITOYS           | company  | web     | 10mo     | 5        | no       | MEDIUM        |
| 7   | Neuroevolutionary AI | research | ai      | 6mo      | 10       | yes      | LOW           |
| 8   | Crop Monitoring      | academic | iot     | 6mo      | 7        | yes      | HIGH          |
| 9   | AR/VR Experience     | academic | desktop | 3mo      | 6        | no       | LOW           |
| 10  | Smart Scale          | academic | iot     | 4mo      | 6        | no       | LOW           |
| 11  | Lost Scout           | academic | desktop | 4mo      | 5        | no       | LOW           |

### Issues Identified

#### Content Quality Issues

1. **Inconsistent depth** - Featured projects (Neuroevo, priority=10) have less content than non-featured ones
2. **Generic summaries** - Many `summary` fields are too technical, don't convey value/impact
3. **Missing problem-solution framing** - Projects jump straight to tech without explaining the WHY
4. **No quantifiable results** - Very few mention measurable outcomes
5. **Vague role descriptions** - "Desarrollador" tells nothing specific
6. **Inconsistent H-level** - neuroevolutionary-ai uses `#` (H1) while others use `##` (H2)
7. **Emoji usage inconsistent** - Some sections have emojis, some don't
8. **No consistent template** - Each project follows different structure

#### SEO-Specific Issues

1. **SEO titles too short** - Most under 40 chars (ideal: 50-60 chars)
2. **SEO descriptions too brief** - Most under 100 chars (ideal: 150-160 chars)
3. **JSON-LD `ldCreativeWork` is minimal** - Only passes title + date, missing description, author, keywords, tech
4. **Cover alt texts are generic** - "GLIO-IA Plataforma" instead of descriptive text
5. **Summaries not keyword-optimized** - Don't include relevant search terms
6. **Missing meta keywords** in tags for some projects

#### Structural Issues

1. No standardized MDX template across projects
2. Missing sections in thin projects: Problem, Solution, Key Results
3. Body doesn't leverage MDX capabilities (no callouts, highlights)

---

## Subagent Research Summary

### SEO Research Findings

**Optimal Lengths:**
| Element | Optimal Length | Notes |
|---------|--------------|-------|
| Meta Title | 50-60 chars | 51-55 is the sweet spot; primary keywords first |
| Meta Description | 150-160 chars | 120+ for mobile compatibility |
| Alt Text | 8-12 words | Max 125 chars; describe image content |
| H1 per page | 1 only | Primary keyword included |

**JSON-LD Best Practices:**

- Use `SoftwareSourceCode` for projects with repos, `SoftwareApplication` for deployed apps
- Each project page should have its own JSON-LD schema
- Key fields: `name`, `description`, `author`, `programmingLanguage`, `keywords`, `datePublished`, `codeRepository`, `url`, `image`
- Link back to `Person` schema via `author` field

**Heading Structure:**

- One H1 per page (project title)
- H2 for main sections: Overview, Challenge, Approach, Results
- H3 for subsections within H2s
- Never skip levels (H1 -> H3)

**Emojis in SEO:**

- No direct ranking impact, but can look unprofessional in technical portfolios
- Avoid in H1/H2 headings and meta titles
- Research recommends removing from serious technical content

**Internal Linking:**

- Hub-and-spoke: Work page links to all projects, projects link back
- Cross-link related projects to each other
- Use descriptive anchor text

### Content Writing Findings

**Standard Template Structure (Problem -> Solution -> Results):**

1. High-Level Summary (1-2 sentences, ~50 words)
2. The Challenge / Problem Statement (2-3 sentences)
3. My Role & Contributions (2-3 bullet points with action verbs)
4. Technical Approach / Solution (3-5 bullets or short paragraphs)
5. Key Technical Decisions (2-3 choices with rationale)
6. Results & Impact (quantitative if possible, qualitative otherwise)
7. Technologies (clearly listed)

**Content Depth by Project Type:**

- Flagship/Featured: 500-800 words (case study format)
- Standard Professional: 300-500 words
- Academic: 200-300 words

**Results Without Hard Metrics (use these patterns):**

- Comparative: "Reduced X from minutes to seconds"
- Capability: "Enabled [new capability] that wasn't previously possible"
- Technical achievement: "Successfully integrated 5 disparate systems"
- Learning outcome: "Validated hypothesis through rigorous testing"

**Role Description Formula:**
`[Role] + [Action Verbs] + [What You Built] + [Technologies] + [Impact]`

**Strong Action Verbs:** Architected, Engineered, Built, Designed, Implemented, Optimized, Researched, Validated, Led, Collaborated

**Bilingual Best Practices:**

- Keep technical terms in English across both languages
- Different keywords for each language audience
- ES keywords: "desarrollador IA", "sistemas IoT", "plataforma blockchain"
- EN keywords: "AI engineer", "IoT developer", "blockchain platform"

---

## Implementation Plan

### Phase 1: Standard MDX Content Template

Define a consistent template for ALL project MDX files:

**Required sections (all projects):**

```
## [Descriptive Title] (H2 - opening section)
[1-2 sentence hook: what was built and why it matters]

### The Challenge
[2-3 sentences: problem being solved, who's affected]

### My Role
[Action-verb bullets: what specifically I did]
- Designed and implemented...
- Led the development of...
- Researched and validated...

### Technical Approach
[How the solution works, key architecture decisions]

### Results
[Measurable outcomes, capabilities unlocked, validation]
```

**Optional sections (for detailed projects):**

```
### Key Features
### Tech Stack Details
### Technical Challenges
### Funding / Collaboration
```

**Heading Rules:**

- ALL projects start body content with `##` (H2), never `#` (H1)
- NO emojis anywhere (headings, list items, content) — remove all existing emojis

**Content Depth Targets:**
| Project Type | Target Words | Required Sections |
|-------------|-------------|-------------------|
| Featured (priority >= 8) | 400-600 words | All required + optional |
| Standard (priority 5-7) | 250-400 words | All required + 1-2 optional |
| Minor (priority < 5) | 200-300 words | Required only |

### Phase 2: Frontmatter SEO Optimization

For each of the 22 MDX files, rewrite:

**`summary`** (shown on cards + meta description fallback):

- 120-160 characters
- Action-oriented: "Built a..." / "Developed a..." / "Designed a..."
- Include 1-2 keywords naturally
- Convey value/impact, not just technology

**`seo.title`** (50-60 characters):

- Format: `[Project Name] - [Value Proposition] | Alejandro Mira`
- Include primary keyword

**`seo.description`** (150-160 characters):

- More detailed than summary
- Include secondary keywords
- Mention technologies + impact

**`cover.alt`** (8-12 words):

- Describe image content, not project name
- Format: "[Description of what the image shows]"

**`role`** field:

- Change from generic "Desarrollador" to specific roles
- EN: "Lead ML Engineer", "Full Stack IoT Developer", "Backend Developer & Blockchain Integrator"
- ES: "Ingeniero ML Principal", "Desarrollador Full Stack IoT", etc.

### Phase 3: MDX Body Content Rewrite

Apply the standard template to all 22 files:

**Priority order (work on these first):**

1. **neuroevolutionary-ai** (featured, priority=10, currently LOW depth) - CRITICAL
2. **glio-ia** (featured, priority=8, already HIGH but needs template alignment)
3. **crop-monitoring** (featured, priority=7, already HIGH but needs template)
4. **cookobot** (priority=7, MEDIUM depth)
5. **multimedia-arvr** (priority=6, LOW depth)
6. **smart-scale** (priority=6, LOW depth)
7. **simdat-4-0** (priority=5, already good)
8. **wotics** (priority=5, already good)
9. **aipassportguardnet** (priority=5, already good)
10. **dlt4aitoys** (priority=5, MEDIUM depth)
11. **lost-scout** (priority=5, LOW depth)

**For each project, changes include:**

- Apply standard template sections
- Add problem-solution framing
- Use strong action verbs in role description
- Add results/impact section with quantifiable outcomes where possible
- Fix heading hierarchy (all start with H2)
- Remove ALL emojis from content
- Ensure ES and EN versions have identical structure

### Phase 4: JSON-LD Schema Enhancement

**4a. Create new `ldSoftwareProject` function in `src/lib/schema.ts`:**

```typescript
export const ldSoftwareProject = (p: {
  title: string;
  description: string;
  date: string;
  url: string;
  repo?: string;
  technologies: string[];
  keywords: string[];
  image?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': p.repo ? 'SoftwareSourceCode' : 'CreativeWork',
  name: p.title,
  description: p.description,
  datePublished: p.date,
  url: p.url,
  ...(p.repo && { codeRepository: p.repo }),
  programmingLanguage: p.technologies,
  keywords: p.keywords,
  ...(p.image && { image: p.image }),
  author: {
    '@type': 'Person',
    name: 'Alejandro Mira',
    url: 'https://alejandromira.com',
  },
});
```

**4b. Update project detail pages** (`[slug].astro`) to use the new schema:

- Pass `description`, `technologies`, `keywords`, `repo`, `image` to the schema
- Replace `ldCreativeWork` with `ldSoftwareProject`

### Phase 5: Build Validation & Testing

1. `pnpm run build` - Ensure all 22 MDX files build correctly
2. `pnpm run lint` - No linting errors
3. `pnpm run format` - Consistent formatting
4. Manual review of JSON-LD output using Google Rich Results Test
5. Verify hreflang consistency between ES/EN versions

---

## Files to Modify

### MDX Content (22 files):

- `src/content/projects/es/*.mdx` (11 files)
- `src/content/projects/en/*.mdx` (11 files)

### Schema:

- `src/lib/schema.ts` (add `ldSoftwareProject`)

### Pages:

- `src/pages/work/[slug].astro` (update JSON-LD usage)
- `src/pages/en/work/[slug].astro` (update JSON-LD usage)

### Total: 26 files

---

## Decisions (from Alex)

1. **Emojis**: Remove ALL emojis from all project descriptions (headings + list items)
2. **Results for minor projects**: Skip detailed results sections for low-priority projects. Only add results for featured/high-priority ones. Minor projects get a brief "Outcome" line.
3. **Neuroevolutionary AI**: Expand content using existing information only — make it more compelling, don't add fabricated facts
4. **DLT4AITOYS vs AIPASSPORTGUARDNET**: Differentiate clearly — emphasize what makes each unique (DLT4AITOYS = AI services + DLT innovation for smart toys; AIPASSPORTGUARDNET = blockchain verification + regulatory compliance for toy safety)

## Differentiation Strategy: DLT4AITOYS vs AIPASSPORTGUARDNET

- **DLT4AITOYS** (2022): Focus on AI services integration (image recognition, chatbots, sentiment analysis, voice) + DLT innovation (simplified blockchain access, self-sovereign identity). Framing: "AI + Blockchain convergence for smart toy lifecycle"
- **AIPASSPORTGUARDNET** (2024): Focus on regulatory compliance, product safety verification, multi-stakeholder access (manufacturers, government, consumers). Framing: "Blockchain-verified product safety and regulatory compliance"

---

## Status: IMPLEMENTATION COMPLETE

### Completed Work

**Phase 1-3: MDX Content Rewrite (22 files)**
All 11 projects (ES + EN) have been rewritten with:
- Improved `summary`, `seo.title`, `seo.description`, `cover.alt`
- Standardized template: H2 opening → Challenge → My Role → Technical Approach → Outcome
- All emojis removed
- Heading hierarchy fixed (H2, never H1)
- Specific roles instead of generic "Desarrollador"
- DLT4AITOYS vs AIPASSPORTGUARDNET clearly differentiated with cross-reference sections
- neuroevolutionary-ai expanded from LOW to full depth

**Phase 4: JSON-LD Schema Enhancement**
- Added `ldSoftwareProject` function to `src/lib/schema.ts`
- Updated both `[slug].astro` pages (ES + EN) to pass richer data: description, technologies, keywords, repo, image
- Uses `SoftwareSourceCode` type when repo exists, `CreativeWork` otherwise

**Phase 5: Build Validation**
- `pnpm run build`: PASS (26 pages built)
- `pnpm run lint`: Pre-existing errors only (no new errors)
- `pnpm run format`: Formatted all modified files (pre-existing Astro parse errors only)

### Files Modified (26 total)
- `src/content/projects/es/*.mdx` (11 files)
- `src/content/projects/en/*.mdx` (11 files)
- `src/lib/schema.ts` (added `ldSoftwareProject`)
- `src/pages/work/[slug].astro` (updated JSON-LD)
- `src/pages/en/work/[slug].astro` (updated JSON-LD)
- `package.json` / `pnpm-lock.yaml` (added `@vercel/analytics` — was missing dependency)

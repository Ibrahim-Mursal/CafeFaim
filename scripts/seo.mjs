/*
 * Builds the <head> metadata, the JSON-LD, robots.txt and sitemap.xml.
 *
 * Generated from src/data rather than written by hand, so the structured data
 * cannot drift away from the menu the site actually shows — a mismatch there is
 * worse than no structured data at all, because search engines treat it as
 * unreliable and may ignore the markup entirely.
 *
 * Nothing here is invented. Facts that are not in the repo (telephone number,
 * geo coordinates) are omitted rather than guessed: wrong coordinates would put
 * the café at the wrong point on a map, which is far more damaging than a
 * missing field.
 */
import { lunchCard, drinksCard } from '../src/data/menu.js';
import { galleryPhotos } from '../src/data/gallery.js';
import { INSTAGRAM, MAPS, WHATSAPP, openingHours } from '../src/data/site.js';

const DEFAULT_SITE_URL = 'https://ibrahim-mursal.github.io/CafeFaim/';

const NAME = 'Café Faim';
const TAGLINE = 'Café · Lunch · Patisserie in Waalwijk';
const DESCRIPTION =
  'Café Faim in Waalwijk — coffee, matcha, lunch en patisserie. Elke dag vers gemaakt, ' +
  '100% halal. Ook taarten op maat voor bruiloft, babyshower en verjaardag.';

const ADDRESS = {
  '@type': 'PostalAddress',
  streetAddress: 'Stationsstraat 107',
  postalCode: '5141 GD',
  addressLocality: 'Waalwijk',
  addressRegion: 'Noord-Brabant',
  addressCountry: 'NL',
};

const DAY = {
  Maandag: 'Monday', Dinsdag: 'Tuesday', Woensdag: 'Wednesday', Donderdag: 'Thursday',
  Vrijdag: 'Friday', Zaterdag: 'Saturday', Zondag: 'Sunday',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (base, path) => new URL(String(path).replace(/^\//, ''), base).href;
const nl = (v) => (v && typeof v === 'object' ? v.nl : v) ?? undefined;
const priceOf = (p) => {
  const n = Number(String(p ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n.toFixed(2) : null;
};

/* Opening hours as schema.org expects them, derived from the same table the
   Bezoek section renders. */
function openingHoursSpec() {
  return openingHours
    .filter((row) => !row.closed)
    .map((row) => {
      const [opens, closes] = String(nl(row.hours)).split('–').map((s) => s.trim());
      return {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${DAY[nl(row.day)]}`,
        opens,
        closes,
      };
    });
}

/* The whole card as schema.org Menu. This is what lets a search engine answer
   "does this place do halal lunch / matcha / pancakes" from the markup. */
function menuSections() {
  const sectionOf = (section) => {
    if (section.kind === 'till') return null;

    if (section.kind === 'feature') {
      return {
        '@type': 'MenuSection',
        name: nl(section.heading),
        hasMenuSection: (section.groups ?? []).map(sectionOf).filter(Boolean),
      };
    }

    const entries = section.kind === 'boxList'
      ? (section.list ?? []).map((entry) => ({ '@type': 'MenuItem', name: nl(entry) }))
      : (section.items ?? []).map((item) => {
          const price = priceOf(item.price);
          return {
            '@type': 'MenuItem',
            name: nl(item.name),
            ...(nl(item.desc) ? { description: nl(item.desc) } : {}),
            ...(price ? { offers: { '@type': 'Offer', price, priceCurrency: 'EUR' } } : {}),
          };
        });

    if (!entries.length) return null;
    return { '@type': 'MenuSection', name: nl(section.heading), hasMenuItem: entries };
  };

  return [lunchCard, drinksCard].flatMap((card) =>
    card.columns.flat().map(sectionOf).filter(Boolean)
  );
}

/* €, €€ or €€€ from the actual prices rather than a guess. */
function priceRange() {
  const prices = [lunchCard, drinksCard]
    .flatMap((c) => c.columns.flat())
    .flatMap((s) => s.items ?? [])
    .map((i) => Number(priceOf(i.price)))
    .filter(Boolean);
  if (!prices.length) return undefined;
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  return avg < 10 ? '€' : avg < 25 ? '€€' : '€€€';
}

export function buildJsonLd(siteUrl) {
  const business = {
    '@type': 'CafeOrCoffeeShop',
    '@id': `${siteUrl}#business`,
    name: NAME,
    alternateName: 'Faim café',
    description: DESCRIPTION,
    slogan: 'We cake you happy!',
    url: siteUrl,
    image: galleryPhotos.slice(0, 4).map((p) => abs(siteUrl, p.src)),
    logo: abs(siteUrl, 'assets/logo.jpg'),
    address: ADDRESS,
    servesCuisine: ['Café', 'Lunch', 'Patisserie', 'Halal'],
    currenciesAccepted: 'EUR',
    areaServed: { '@type': 'City', name: 'Waalwijk' },
    openingHoursSpecification: openingHoursSpec(),
    sameAs: [INSTAGRAM, WHATSAPP],
    hasMap: MAPS,
    priceRange: priceRange(),
    hasMenu: {
      '@type': 'Menu',
      '@id': `${siteUrl}#menu`,
      name: 'Menukaart',
      inLanguage: 'nl-NL',
      hasMenuSection: menuSections(),
    },
  };

  const website = {
    '@type': 'WebSite',
    '@id': `${siteUrl}#website`,
    url: siteUrl,
    name: `${NAME} — ${TAGLINE}`,
    inLanguage: ['nl-NL', 'en'],
    publisher: { '@id': `${siteUrl}#business` },
  };

  return { '@context': 'https://schema.org', '@graph': [business, website] };
}

export function buildHeadTags(siteUrl) {
  const ogImage = abs(siteUrl, galleryPhotos[0].src);

  const tags = [
    `<title>${esc(`${NAME} — ${TAGLINE}`)}</title>`,
    `<meta name="description" content="${esc(DESCRIPTION)}">`,
    `<link rel="canonical" href="${esc(siteUrl)}">`,

    // Explicit rather than relying on defaults, and asks for large image and
    // full-length snippets, which is what a listing with a photo needs.
    `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`,

    `<meta property="og:site_name" content="${esc(NAME)}">`,
    `<meta property="og:title" content="${esc(`${NAME} — ${TAGLINE}`)}">`,
    `<meta property="og:description" content="${esc(DESCRIPTION)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:url" content="${esc(siteUrl)}">`,
    `<meta property="og:image" content="${esc(ogImage)}">`,
    `<meta property="og:image:alt" content="${esc(galleryPhotos[0].alt)}">`,
    `<meta property="og:locale" content="nl_NL">`,
    `<meta property="og:locale:alternate" content="en_US">`,

    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(`${NAME} — ${TAGLINE}`)}">`,
    `<meta name="twitter:description" content="${esc(DESCRIPTION)}">`,
    `<meta name="twitter:image" content="${esc(ogImage)}">`,

    `<meta name="geo.placename" content="Waalwijk">`,
    `<meta name="geo.region" content="NL-NB">`,

    `<script type="application/ld+json">${JSON.stringify(buildJsonLd(siteUrl))}</script>`,
  ];

  return tags.map((t) => `  ${t}`).join('\n');
}

export function buildRobots(siteUrl) {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    '# The dashboard is behind a login; keeping it out of the index also keeps',
    '# it out of search results that would advertise where it lives.',
    'Disallow: /fata',
    'Disallow: /fata.html',
    '',
    `Sitemap: ${abs(siteUrl, 'sitemap.xml')}`,
    '',
  ].join('\n');
}

export function buildSitemap(siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${siteUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
${galleryPhotos
  .map((p) => `    <image:image><image:loc>${abs(siteUrl, p.src)}</image:loc><image:caption>${esc(p.alt)}</image:caption></image:image>`)
  .join('\n')}
  </url>
</urlset>
`;
}

export const siteUrlFrom = (env) => {
  const raw = env?.VITE_SITE_URL || DEFAULT_SITE_URL;
  return raw.endsWith('/') ? raw : `${raw}/`;
};

#!/usr/bin/env node
/* =========================================================
   Café Faim — content build
   Regenerates the CMS-editable regions of index.html (marked by
   <!-- cms:NAME --> ... <!-- /cms:NAME --> comments) from the JSON
   files in content/. Everything outside those markers (nav, footer,
   concept text, page shell) is untouched hand-authored HTML.
   Run: node build.js
   ========================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, 'content', p), 'utf8'));

const menu = readJSON('menu.json');
const hours = readJSON('hours.json');
const hero = readJSON('hero.json');
const gallery = readJSON('gallery.json');
const cakes = readJSON('cakes.json');

/* ---------- helpers ---------- */

// nl/en pair -> data-nl/data-en attrs, omitted when there's no distinct
// translation (en === '') so untranslated brand names render exactly like
// the hand-authored markup did: plain text, untouched by the language toggle.
function bi(pair) {
  if (!pair || !pair.en) return '';
  return ` data-nl="${esc(pair.nl)}" data-en="${esc(pair.en)}"`;
}
// Escapes &, <, >, " — safe (and required) both inside quoted attribute
// values and inside visible text nodes, so every render path below can
// route through this without needing to reason about which context it's
// in. Content comes from a CMS form, not a code editor, so a menu item
// name containing "&" or "<" must not be able to break the markup.
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
// Visible-text (not attribute) rendering of an nl/en pair or plain string —
// always escaped, since this lands directly in the HTML body.
function nl(pair) {
  return esc(typeof pair === 'string' ? pair : pair.nl);
}

const DAY_LABELS = {
  monday:    { nl: 'Maandag',   en: 'Monday',    shortNl: 'Ma', shortEn: 'Mon' },
  tuesday:   { nl: 'Dinsdag',   en: 'Tuesday',   shortNl: 'Di', shortEn: 'Tue' },
  wednesday: { nl: 'Woensdag',  en: 'Wednesday', shortNl: 'Wo', shortEn: 'Wed' },
  thursday:  { nl: 'Donderdag', en: 'Thursday',  shortNl: 'Do', shortEn: 'Thu' },
  friday:    { nl: 'Vrijdag',   en: 'Friday',    shortNl: 'Vr', shortEn: 'Fri' },
  saturday:  { nl: 'Zaterdag',  en: 'Saturday',  shortNl: 'Za', shortEn: 'Sat' },
  sunday:    { nl: 'Zondag',    en: 'Sunday',    shortNl: 'Zo', shortEn: 'Sun' }
};

// Collapse consecutive days sharing the same {closed, open, close} into
// ranges, so the footer summary and the JSON-LD schema can't drift from
// the per-day table — all three are derived from hours.json here.
function groupDays(days) {
  const groups = [];
  for (const d of days) {
    const sig = d.closed ? 'closed' : `${d.open}-${d.close}`;
    const last = groups[groups.length - 1];
    if (last && last.sig === sig) last.days.push(d.day);
    else groups.push({ sig, days: [d.day], closed: d.closed, open: d.open, close: d.close });
  }
  return groups;
}

/* ---------- HOURS: full table ---------- */
function renderHoursTable() {
  return hours.days.map((d) => {
    const label = DAY_LABELS[d.day];
    const cell = d.closed
      ? `<td class="closed" data-nl="Gesloten" data-en="Closed">Gesloten</td>`
      : `<td>${esc(d.open)} – ${esc(d.close)}</td>`;
    return `          <tr><th data-nl="${label.nl}" data-en="${label.en}">${label.nl}</th>${cell}</tr>`;
  }).join('\n');
}

/* ---------- HOURS: footer summary ---------- */
function renderHoursFooter() {
  const groups = groupDays(hours.days);
  return groups.map((g) => {
    const first = DAY_LABELS[g.days[0]];
    const last = DAY_LABELS[g.days[g.days.length - 1]];
    const single = g.days.length === 1;
    const labelNl = single ? first.nl : `${first.shortNl} – ${last.shortNl}`;
    const labelEn = single ? first.en : `${first.shortEn} – ${last.shortEn}`;
    const em = g.closed
      ? `<em data-nl="Gesloten" data-en="Closed">Gesloten</em>`
      : `<em>${esc(g.open)}–${esc(g.close)}</em>`;
    return `        <li><span data-nl="${labelNl}" data-en="${labelEn}">${labelNl}</span>${em}</li>`;
  }).join('\n');
}

/* ---------- HOURS: JSON-LD openingHoursSpecification ---------- */
function buildOpeningHoursSpecification() {
  return groupDays(hours.days)
    .filter((g) => !g.closed)
    .map((g) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: g.days.map((d) => DAY_LABELS[d].en),
      opens: g.open,
      closes: g.close
    }));
}

/* ---------- HERO ---------- */
function renderHero() {
  const words = hero.type_words
    .map((w) => `        <span data-nl="${esc(w.nl)}" data-en="${esc(w.en)}">${esc(w.nl)}</span>`)
    .join('\n');
  const srNl = hero.type_words.map((w) => w.nl.toLowerCase()).join(', ') + ',';
  const srEn = hero.type_words.map((w) => w.en.toLowerCase()).join(', ') + ',';
  const srNlCap = srNl.charAt(0).toUpperCase() + srNl.slice(1);
  const srEnCap = srEn.charAt(0).toUpperCase() + srEn.slice(1);

  return `    <p class="eyebrow" data-nl="${esc(hero.eyebrow.nl)}" data-en="${esc(hero.eyebrow.en)}">${esc(hero.eyebrow.nl)}</p>

    <h1 class="hero__title">
      <span class="hero__type t-green" aria-hidden="true"><span class="hero__type-text"></span><span class="hero__type-cursor"></span></span>
      <span class="hero__type-words" hidden>
${words}
      </span>
      <span class="sr-only" data-nl="${esc(srNlCap)}" data-en="${esc(srEnCap)}">${esc(srNlCap)}</span><br>
      <span class="t-pink">${esc(hero.headline)}</span>
    </h1>

    <p class="hero__sub"
       data-nl="${esc(hero.sub.nl)}"
       data-en="${esc(hero.sub.en)}">
      ${esc(hero.sub.nl)}
    </p>

    <div class="hero__cta">
      <a class="btn btn--pink" href="#menu" data-nl="${esc(hero.cta_menu.nl)}" data-en="${esc(hero.cta_menu.en)}">${esc(hero.cta_menu.nl)}</a>
      <a class="btn btn--ghost" href="https://wa.me/message/TPX75PMNP3RSJ1" target="_blank" rel="noopener noreferrer"
         data-nl="${esc(hero.cta_custom.nl)}" data-en="${esc(hero.cta_custom.en)}">${esc(hero.cta_custom.nl)}</a>
    </div>`;
}

/* ---------- MENU ---------- */
function renderMenuItem(item) {
  const priceInner = (item.from ? `<em class="mfrom" data-nl="Vanaf" data-en="From">Vanaf</em>&nbsp;` : '') + `&euro;${item.price}`;
  // The CMS may write desc as {nl:'',en:''} instead of omitting the key
  // when a field is left blank, so check for actual content, not presence.
  const desc = (item.desc && item.desc.nl)
    ? `\n                  <p class="md" data-nl="${esc(item.desc.nl)}" data-en="${esc(item.desc.en)}">${esc(item.desc.nl)}</p>`
    : '';
  return `              <li><p class="mrow"><span class="mn"${bi(item.name)}>${nl(item.name)}</span><span class="mp">${priceInner}</span></p>${desc}</li>`;
}

function renderGroup(block) {
  const cls = 'mlist' + (block.tight ? ' mlist--tight' : '');
  const items = block.items.map(renderMenuItem).join('\n');
  return `          <section class="mgrp">
            <h4 class="mgrp__h"${bi(block.heading)}>${nl(block.heading)}</h4>
            <ul class="${cls}">
${items}
            </ul>
          </section>`;
}

function renderNamesBox(block) {
  const items = block.items
    .map((i) => `              <li${bi(i)}>${nl(i)}</li>`)
    .join('\n');
  return `          <section class="mbox">
            <h4 class="mgrp__h"${bi(block.heading)}>${nl(block.heading)}</h4>
            <p class="mbox__lead" data-nl="${esc(block.lead.nl)}" data-en="${esc(block.lead.en)}">${esc(block.lead.nl)}</p>
            <ul class="mbox__list">
${items}
            </ul>
            <p class="mbox__note" data-nl="${esc(block.note.nl)}" data-en="${esc(block.note.en)}">${esc(block.note.nl)}</p>
          </section>`;
}

function renderPricedBox(block) {
  const cls = 'mlist' + (block.tight ? ' mlist--tight' : '');
  const items = block.items.map(renderMenuItem).join('\n');
  return `          <section class="mbox">
            <h4 class="mgrp__h"${bi(block.heading)}>${nl(block.heading)}</h4>
            <ul class="${cls}">
${items}
            </ul>
          </section>`;
}

function renderFeature(block) {
  const groups = block.groups.map((g) => {
    const subCls = g.sub ? ' mgrp__h--sub' : '';
    const items = g.items.map(renderMenuItem).join('\n');
    return `            <section class="mgrp">
              <h4 class="mgrp__h${subCls}"${bi(g.heading)}>${nl(g.heading)}</h4>
              <ul class="mlist">
${items}
              </ul>
            </section>`;
  }).join('\n\n');
  return `          <div class="mfeature">
            <span class="mfeature__badge" data-nl="${esc(block.badge.nl)}" data-en="${esc(block.badge.en)}">${esc(block.badge.nl)}</span>

${groups}
          </div>`;
}

function renderBlock(block) {
  switch (block.type) {
    case 'group': return renderGroup(block);
    case 'names-box': return renderNamesBox(block);
    case 'priced-box': return renderPricedBox(block);
    case 'feature': return renderFeature(block);
    default: throw new Error('Unknown menu block type: ' + block.type);
  }
}

function renderMenu() {
  const lunchCol1 = menu.lunch.column1.map(renderBlock).join('\n\n');
  const lunchCol2 = menu.lunch.column2.map(renderBlock).join('\n\n');
  const till = `\n\n          <p class="mtill" data-nl="${esc(menu.lunch.till.nl)}" data-en="${esc(menu.lunch.till.en)}">${esc(menu.lunch.till.nl)}</p>`;

  const dCol1 = menu.dranken.column1.map(renderBlock).join('\n\n');
  const dCol2 = menu.dranken.column2.map(renderBlock).join('\n\n');

  return `    <article class="mcard">
      <h3 class="mcard__t"${bi(menu.lunch.title)}>${nl(menu.lunch.title)}</h3>
      <div class="mcard__cols">
        <div class="mcol">
${lunchCol1}
        </div>
        <div class="mcol">
${lunchCol2}${till}
        </div>
      </div>
    </article>

    <article class="mcard">
      <h3 class="mcard__t"${bi(menu.dranken.title)}>${nl(menu.dranken.title)}</h3>
      <div class="mcard__cols">
        <div class="mcol">
${dCol1}
        </div>
        <div class="mcol">
${dCol2}
        </div>
      </div>
    </article>

    <p class="menu__foot"
       data-nl="${esc(menu.footnote.nl)}"
       data-en="${esc(menu.footnote.en)}">
      ${esc(menu.footnote.nl)}
    </p>`;
}

/* ---------- CAKES (taarten cards) ---------- */
function renderCakes() {
  return cakes.items.map((c) => `      <figure class="cake">
        <img src="${c.image}" alt="${esc(c.alt)}" loading="lazy" width="${c.width}" height="${c.height}">
        <figcaption>
          <h3${bi(c.title)}>${nl(c.title)}</h3>
          <p${bi(c.desc)}>${nl(c.desc)}</p>
        </figcaption>
      </figure>`).join('\n\n');
}

/* ---------- GALLERY (in beeld tiles) ---------- */
function renderGallery() {
  return gallery.items.map((g) => `      <figure class="gal__i">
        <img src="${g.image}" alt="${esc(g.alt)}" loading="lazy" width="${g.width}" height="${g.height}">
        <figcaption${bi(g.caption)}>${nl(g.caption)}</figcaption>
      </figure>`).join('\n\n');
}

/* ---------- splice a <!-- cms:NAME --> ... <!-- /cms:NAME --> region ---------- */
function spliceRegion(html, name, content) {
  const re = new RegExp(`(<!--\\s*cms:${name}\\s*-->)[\\s\\S]*?(<!--\\s*/cms:${name}\\s*-->)`);
  if (!re.test(html)) throw new Error(`Marker "cms:${name}" not found in index.html`);
  return html.replace(re, `$1\n${content}\n$2`);
}

/* ---------- assemble ---------- */
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

html = spliceRegion(html, 'hero', renderHero());
html = spliceRegion(html, 'menu', renderMenu());
html = spliceRegion(html, 'cakes', renderCakes());
html = spliceRegion(html, 'gallery', renderGallery());
html = spliceRegion(html, 'hours-table', renderHoursTable());
html = spliceRegion(html, 'hours-footer', renderHoursFooter());

// JSON-LD: rebuild the whole script body from the existing skeleton so
// openingHoursSpecification always matches content/hours.json exactly.
const ldMatch = html.match(/(<script type="application\/ld\+json">\n)([\s\S]*?)(\n<\/script>)/);
if (!ldMatch) throw new Error('JSON-LD <script> block not found in index.html');
const ld = JSON.parse(ldMatch[2]);
ld.openingHoursSpecification = buildOpeningHoursSpecification();
const ldBody = JSON.stringify(ld, null, 2);
html = html.replace(/<script type="application\/ld\+json">\n[\s\S]*?\n<\/script>/, `<script type="application/ld+json">\n${ldBody}\n</script>`);

// CSP allow-lists the two inline <script> blocks by exact sha256 hash.
// Recompute both from the final HTML so a content edit (which reflows the
// JSON-LD body) can never leave a stale hash that gets the page blocked.
function scriptHashes(finalHtml) {
  // Strip HTML comments first — otherwise a comment that happens to mention
  // the literal text "<script>" (like the one right above the CSP meta tag)
  // gets matched as a fake opening tag and throws every hash off silently.
  const withoutComments = finalHtml.replace(/<!--[\s\S]*?-->/g, '');
  const re = /<script(?:\s+type="([^"]*)")?>([\s\S]*?)<\/script>/g;
  const hashes = [];
  let m;
  while ((m = re.exec(withoutComments))) {
    const content = m[2];
    if (!content.trim()) continue; // external <script src=...> — not inline, not CSP-hashed
    const hash = crypto.createHash('sha256').update(content, 'utf8').digest('base64');
    hashes.push(`'sha256-${hash}'`);
  }
  return hashes;
}
const hashes = scriptHashes(html);
html = html.replace(
  /(script-src 'self' )'sha256-[^']*' 'sha256-[^']*'/,
  `$1${hashes.join(' ')}`
);

fs.writeFileSync(path.join(ROOT, 'index.html'), html, 'utf8');
console.log('Built index.html from content/*.json');

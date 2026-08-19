/*
 * Checks the two conversions the content system depends on, without needing a
 * database:
 *
 *   1. Database rows -> the shapes the public components render.
 *   2. Database rows -> the editor's tree -> database rows again.
 *
 * The second is the one that matters most: saving the menu rewrites every row,
 * so a mistake in that round trip would quietly mangle the whole card. Run with
 * `npm run verify`.
 */
import assert from 'node:assert/strict';

import { lunchCard, drinksCard } from '../src/data/menu.js';
import { cakeCategories, galleryPhotos } from '../src/data/gallery.js';
import { conceptBlock, conceptPills } from '../src/data/concept.js';
import { mapCakes, mapConcept, mapGallery, mapMenu, mapSettings } from '../src/content/mapping.js';
import { buildMenuTree, flattenMenuTree } from '../src/admin/menuShape.js';
import { countRemovals, describeChanges } from '../src/admin/changes.js';

let checks = 0;
const check = (name, fn) => {
  fn();
  checks += 1;
  console.log(`  ok  ${name}`);
};

// A bundled value is either { nl, en } or a bare string meaning "same in both".
// Both become { nl, en } once they have been through the database.
const norm = (v) =>
  v === undefined || v === null
    ? { nl: null, en: null }
    : typeof v === 'object'
      ? { nl: v.nl ?? null, en: v.en || null }
      : { nl: v, en: null };

let seq = 0;
const uid = () => `00000000-0000-4000-8000-${String((seq += 1)).padStart(12, '0')}`;

// ---- build database rows from the bundled content (mirrors seed.sql) ------
const cardRows = [];
const sectionRows = [];
const itemRows = [];

function addSection(section, { cardId, parentId, columnIndex, position }) {
  const id = uid();
  const p = (key) => {
    const { nl, en } = norm(section[key]);
    return { [`${key}_nl`]: nl, [`${key}_en`]: en };
  };

  sectionRows.push({
    id,
    card_id: cardId,
    parent_id: parentId,
    column_index: columnIndex,
    position,
    kind: section.kind ?? 'group',
    sub: !!section.sub,
    ...p('heading'), ...p('lead'), ...p('note'), ...p('badge'), ...p('text'),
  });

  if (section.kind === 'feature') {
    (section.groups ?? []).forEach((g, i) =>
      addSection({ ...g, kind: 'group' }, { cardId: null, parentId: id, columnIndex: 0, position: i })
    );
  } else if (section.kind === 'boxList') {
    (section.list ?? []).forEach((entry, i) => {
      const n = norm(entry);
      itemRows.push({
        id: uid(), section_id: id, position: i,
        name_nl: n.nl, name_en: n.en,
        price: null, desc_nl: null, desc_en: null, from_nl: null, from_en: null,
      });
    });
  } else {
    (section.items ?? []).forEach((item, i) => {
      const n = norm(item.name), d = norm(item.desc), f = norm(item.from);
      itemRows.push({
        id: uid(), section_id: id, position: i,
        name_nl: n.nl, name_en: n.en,
        price: item.price ?? null,
        desc_nl: d.nl, desc_en: d.en,
        from_nl: f.nl, from_en: f.en,
      });
    });
  }
}

[lunchCard, drinksCard].forEach((card, cardIndex) => {
  const cardId = uid();
  const title = norm(card.title);
  cardRows.push({ id: cardId, position: cardIndex, title_nl: title.nl, title_en: title.en });
  card.columns.forEach((column, columnIndex) =>
    column.forEach((section, position) =>
      addSection(section, { cardId, parentId: null, columnIndex, position })
    )
  );
});

console.log('\ncontent mapping (database rows -> site)');

check('menu keeps every card, section and item', () => {
  const mapped = mapMenu(cardRows, sectionRows, itemRows);
  assert.equal(mapped.length, 2);

  const countItems = (sections) =>
    sections.reduce(
      (n, s) =>
        n +
        (s.items?.length ?? 0) +
        (s.list?.length ?? 0) +
        countItems(s.groups ?? []),
      0
    );
  const total = mapped.reduce((n, c) => n + countItems(c.columns.flat()), 0);
  assert.equal(total, itemRows.length, 'every menu_items row must surface exactly once');
});

check('menu preserves text, prices and structure', () => {
  const mapped = mapMenu(cardRows, sectionRows, itemRows);
  const lunch = mapped[0];
  assert.deepEqual(lunch.title, norm(lunchCard.title));

  const sandwiches = lunch.columns[0][0];
  assert.deepEqual(sandwiches.heading, norm(lunchCard.columns[0][0].heading));
  assert.equal(sandwiches.items.length, 5);
  assert.deepEqual(sandwiches.items[0].name, norm('Carpaccio'));
  assert.equal(sandwiches.items[0].price, '€11.95');

  // The matcha panel must keep its badge and both nested groups.
  const feature = mapped[1].columns[1].find((s) => s.kind === 'feature');
  assert.ok(feature, 'feature panel survives');
  assert.deepEqual(feature.badge, norm({ nl: 'Huisfavoriet', en: 'House favourite' }));
  assert.equal(feature.groups.length, 2);
  assert.equal(feature.groups[1].items.length, 3);
  assert.equal(feature.groups[1].sub, true);

  // "Vanaf €7.00" — the qualifier in front of a price.
  assert.deepEqual(feature.groups[0].items[0].from, norm({ nl: 'Vanaf', en: 'From' }));

  // The unpriced Gebak names come back as a plain list.
  const gebak = lunch.columns[1].find((s) => s.kind === 'boxList');
  assert.equal(gebak.list.length, 10);
  assert.deepEqual(gebak.list[0], norm({ nl: 'Koekjes', en: 'Cookies' }));
  assert.deepEqual(gebak.note, norm(lunchCard.columns[1][1].note));

  // The footnote section carries text, not items.
  const till = lunch.columns[1].find((s) => s.kind === 'till');
  assert.deepEqual(till.text, norm({ nl: 'Lunch tot 15:00', en: 'Lunch till 15:00' }));
});

check('bare strings stay untranslated rather than becoming empty English', () => {
  const mapped = mapMenu(cardRows, sectionRows, itemRows);
  const hot = mapped[1].columns[0][0];
  const espresso = hot.items.find((i) => i.name.nl === 'Espresso');
  assert.equal(espresso.name.en, null, 'no English variant is stored');
});

check('cakes and gallery map in order', () => {
  const cakeRows = cakeCategories.map((c, i) => {
    const t = norm(c.title), b = norm(c.blurb);
    return {
      id: uid(), position: cakeCategories.length - i, image_path: c.src, alt: c.alt,
      title_nl: t.nl, title_en: t.en, blurb_nl: b.nl, blurb_en: b.en,
    };
  });
  const mapped = mapCakes(cakeRows);
  assert.equal(mapped.length, 4);
  // position, not array order, decides — the rows above are deliberately reversed.
  assert.equal(mapped[0].title.nl, cakeCategories[3].title.nl);

  const photoRows = galleryPhotos.map((p, i) => {
    const c = norm(p.caption);
    return { id: uid(), position: i, image_path: p.src, alt: p.alt, caption_nl: c.nl, caption_en: c.en };
  });
  const photos = mapGallery(photoRows);
  assert.equal(photos.length, 8);
  assert.equal(photos[0].src, galleryPhotos[0].src);
  assert.deepEqual(photos[5].caption, norm(galleryPhotos[5].caption));
});

check('concept maps its block and pills', () => {
  const row = {
    kicker_nl: 'Het concept', kicker_en: 'The concept',
    heading_nl: conceptBlock.heading.nl, heading_en: conceptBlock.heading.en,
    body1_nl: conceptBlock.body1.nl, body1_en: conceptBlock.body1.en,
    body2_nl: conceptBlock.body2.nl, body2_en: conceptBlock.body2.en,
  };
  const pillRows = conceptPills.map((p, i) => {
    const s = norm(p.strong), l = norm(p.label);
    return { id: uid(), position: i, strong_nl: s.nl, strong_en: s.en, label_nl: l.nl, label_en: l.en };
  });
  const mapped = mapConcept(row, pillRows);
  assert.deepEqual(mapped.conceptBlock.heading, norm(conceptBlock.heading));
  assert.equal(mapped.conceptPills.length, 4);
  assert.equal(mapped.conceptPills[0].strong.nl, '100%');
});

console.log('\nmenu editor round trip (rows -> editor tree -> rows)');

check('saving an untouched menu writes back identical rows', () => {
  const tree = buildMenuTree(cardRows, sectionRows, itemRows);
  const back = flattenMenuTree(tree);

  const key = (r) => r.id;
  const sortById = (rows) => [...rows].sort((a, b) => key(a).localeCompare(key(b)));

  assert.deepEqual(sortById(back.cardRows), sortById(cardRows));
  assert.deepEqual(sortById(back.sectionRows), sortById(sectionRows));
  assert.deepEqual(sortById(back.itemRows), sortById(itemRows));
});

check('reordering renumbers positions and loses nothing', () => {
  const tree = buildMenuTree(cardRows, sectionRows, itemRows);
  const column = tree.cards[0].columns[0];
  [column[0], column[1]] = [column[1], column[0]];

  const back = flattenMenuTree(tree);
  assert.equal(back.sectionRows.length, sectionRows.length);
  assert.equal(back.itemRows.length, itemRows.length);

  const moved = back.sectionRows.filter((r) => r.card_id === tree.cards[0].id && r.column_index === 0);
  const positions = moved.map((r) => r.position).sort((a, b) => a - b);
  assert.deepEqual(positions, [0, 1], 'positions are renumbered from array order');
  assert.equal(
    back.sectionRows.find((r) => r.id === column[0].id).position,
    0,
    'the section moved to the top is written as position 0'
  );
});

check('deleting a section is detectable and takes its items with it', () => {
  const tree = buildMenuTree(cardRows, sectionRows, itemRows);
  const victim = tree.cards[0].columns[0][0];
  const victimItems = victim.items.length;
  assert.ok(victimItems > 0);

  tree.cards[0].columns[0] = tree.cards[0].columns[0].slice(1);
  const back = flattenMenuTree(tree);

  const keptSections = new Set(back.sectionRows.map((r) => r.id));
  assert.ok(!keptSections.has(victim.id), 'removed section is absent from the write');
  assert.equal(back.itemRows.length, itemRows.length - victimItems, 'its items go too');

  // What the save actually deletes, computed the same way MenuEditor does.
  const removed = sectionRows.map((r) => r.id).filter((id) => !keptSections.has(id));
  assert.deepEqual(removed, [victim.id]);
});

check('nested feature groups keep their parent and stay separable', () => {
  const tree = buildMenuTree(cardRows, sectionRows, itemRows);
  const back = flattenMenuTree(tree);

  const feature = back.sectionRows.find((r) => r.kind === 'feature');
  const children = back.sectionRows.filter((r) => r.parent_id === feature.id);
  assert.equal(children.length, 2);
  // Children carry no card_id, so the two-pass write (parents, then children)
  // in MenuEditor.save covers every row exactly once.
  assert.ok(children.every((c) => c.card_id === null));
  assert.equal(
    back.sectionRows.filter((r) => !r.parent_id).length + children.length,
    back.sectionRows.length
  );
});

check('moving a section between columns rewrites only its column', () => {
  const tree = buildMenuTree(cardRows, sectionRows, itemRows);
  const card = tree.cards[0];
  const moving = card.columns[0][0];
  card.columns[0] = card.columns[0].slice(1);
  card.columns[1] = [...card.columns[1], moving];

  const back = flattenMenuTree(tree);
  const row = back.sectionRows.find((r) => r.id === moving.id);
  assert.equal(row.column_index, 1);
  assert.equal(back.sectionRows.length, sectionRows.length, 'nothing is dropped');
});

console.log('\nchange descriptions (shown before saving)');

const baseTree = () => buildMenuTree(cardRows, sectionRows, itemRows);

check('an unchanged editor reports nothing', () => {
  assert.deepEqual(describeChanges(baseTree(), baseTree()), []);
});

check('a price edit names the item, the card and both values', () => {
  const before = baseTree();
  const after = baseTree();
  after.cards[0].columns[0][0].items[0].price = '\u20ac12.95';

  const lines = describeChanges(before, after);
  assert.equal(lines.length, 1, 'one edit produces exactly one line');
  assert.match(lines[0], /Carpaccio/);
  assert.match(lines[0], /Prijs/);
  assert.match(lines[0], /11\.95/);
  assert.match(lines[0], /12\.95/);
  assert.match(lines[0], /Lunch/, 'the breadcrumb locates it on the card');
});

check('a deletion is flagged and counted as irreversible', () => {
  const before = baseTree();
  const after = baseTree();
  const victim = after.cards[0].columns[0][0];
  after.cards[0].columns[0] = after.cards[0].columns[0].slice(1);

  const lines = describeChanges(before, after);
  const gone = lines.filter((l) => l.includes('VERWIJDERD'));
  assert.equal(gone.length, 1);
  assert.ok(gone[0].includes(victim.heading.nl));
  assert.equal(countRemovals(lines), 1, 'the dialog can warn about it');
});

check('reordering is one line, not one per row', () => {
  const before = baseTree();
  const after = baseTree();
  const items = after.cards[1].columns[0][0].items;
  [items[0], items[1]] = [items[1], items[0]];

  const lines = describeChanges(before, after);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /volgorde aangepast/);
});

check('a Dutch and an English edit are reported separately', () => {
  const before = baseTree();
  const after = baseTree();
  after.cards[0].columns[0][0].items[1].name = { nl: 'Caprese Deluxe', en: 'Caprese Deluxe' };

  const lines = describeChanges(before, after);
  assert.equal(lines.length, 2);
  assert.equal(lines.filter((l) => l.includes('(Engels)')).length, 1);
});

check('added rows are announced by name', () => {
  const before = baseTree();
  const after = baseTree();
  after.cards[0].columns[0][0].items.push({
    id: 'new-1', name: { nl: 'Tosti', en: '' }, price: '\u20ac5.00',
    desc: { nl: '', en: '' }, from: { nl: '', en: '' },
  });

  const lines = describeChanges(before, after);
  assert.equal(lines.length, 1);
  assert.match(lines[0], /toegevoegd: Tosti/);
  assert.equal(countRemovals(lines), 0);
});

check('photo swaps and captions read plainly', () => {
  const before = { photos: [{ id: 'p1', src: 'a.jpg', alt: 'oud', caption: { nl: 'Bruiloft', en: '' } }] };
  const after  = { photos: [{ id: 'p1', src: 'b.jpg', alt: 'nieuw', caption: { nl: 'Bruiloftstaart', en: '' } }] };

  const lines = describeChanges(before, after);
  assert.ok(lines.some((l) => l.includes('foto vervangen')));
  assert.ok(lines.some((l) => l.includes('Bijschrift')));
  assert.ok(lines.every((l) => l.startsWith('Bruiloft \u2014')), 'each line names the photo');
});

check('emptying a list is described, not crashed on', () => {
  // Regression: [].every(fn) is vacuously true, so an emptied list was mistaken
  // for the menu's two-column shape and a record was walked as an array. That
  // threw during render, which unmounted the dashboard — the blank page after
  // deleting the last row of anything.
  const emptied = [
    [{ pills: [{ id: 'a', strong: { nl: '100%', en: '' }, label: { nl: 'Halal', en: '' } }] }, { pills: [] }],
    [{ photos: [{ id: 'p', src: 'a.jpg', alt: '', caption: { nl: 'X', en: '' } }] }, { photos: [] }],
  ];
  for (const [before, after] of emptied) {
    const lines = describeChanges(before, after);
    assert.equal(countRemovals(lines), 1, 'the removal is reported');
  }
});

check('emptying a menu section keeps the card and column names', () => {
  const before = baseTree();
  const after = baseTree();
  const section = after.cards[0].columns[0][0];
  const removed = section.items.length;
  section.items = [];

  const lines = describeChanges(before, after);
  assert.equal(countRemovals(lines), removed);
  assert.ok(lines[0].includes('Linkerkolom'), 'names the column');
  assert.ok(!lines[0].includes('columns'), 'without leaking the raw field name');
});

check('a field that changes shape does not throw', () => {
  // Defensive: nothing should produce this, but a crash here blanks the page.
  assert.doesNotThrow(() => describeChanges({ photos: [] }, { photos: {} }));
  assert.doesNotThrow(() => describeChanges({ photos: {} }, { photos: [] }));
  assert.doesNotThrow(() => describeChanges({ a: null }, { a: [] }));
});

check('deleting every card empties the menu without throwing', () => {
  const before = baseTree();
  const lines = describeChanges(before, { cards: [] });
  assert.equal(countRemovals(lines), before.cards.length);
});

check('hero video falls back to the bundled file', () => {
  assert.equal(mapSettings(undefined).heroVideo, null, 'no row -> no override');
  assert.equal(mapSettings({}).heroVideo, null, 'empty row -> no override');
  assert.equal(mapSettings({ hero_video_path: '' }).heroVideo, null, 'cleared -> no override');
  assert.equal(
    mapSettings({ hero_video_path: 'https://x.supabase.co/storage/v1/object/public/media/video/a.mp4' }).heroVideo,
    'https://x.supabase.co/storage/v1/object/public/media/video/a.mp4'
  );
});

check('swapping or clearing the hero video is described in plain words', () => {
  const set = describeChanges({ heroVideo: '' }, { heroVideo: 'https://x/v.mp4' });
  assert.equal(set.length, 1);
  assert.match(set[0], /eigen video ingesteld/);

  const cleared = describeChanges({ heroVideo: 'https://x/v.mp4' }, { heroVideo: '' });
  assert.equal(cleared.length, 1);
  assert.match(cleared[0], /standaardvideo/);

  assert.deepEqual(describeChanges({ heroVideo: '' }, { heroVideo: '' }), []);
});

console.log(`\n${checks} checks passed\n`);

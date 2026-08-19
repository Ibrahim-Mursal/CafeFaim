import { newId } from './ids.js';

/*
 * Pure conversions between the menu as database rows and the menu as the
 * nested tree the editor works with.
 *
 * Kept free of React and of the Supabase client on purpose: saving the menu
 * rewrites every row, so a mistake here corrupts the whole card at once. Being
 * plain functions means the round trip can be tested directly —
 * `npm run verify` does exactly that.
 */

const pair = (row, key) => ({ nl: row?.[`${key}_nl`] ?? '', en: row?.[`${key}_en`] ?? '' });
const blank = (v) => v || null;
const empty = () => ({ nl: '', en: '' });

export const newItem = () => ({ id: newId(), name: empty(), price: '', desc: empty(), from: empty() });

export const newSection = (kind) => ({
  id: newId(),
  kind,
  sub: false,
  heading: empty(),
  lead: empty(),
  note: empty(),
  badge: empty(),
  text: empty(),
  items: [],
  groups: [],
});

const byPosition = (a, b) => (a.position ?? 0) - (b.position ?? 0);

function buildSection(row, sectionsByParent, itemsBySection) {
  return {
    id: row.id,
    kind: row.kind,
    sub: row.sub ?? false,
    heading: pair(row, 'heading'),
    lead: pair(row, 'lead'),
    note: pair(row, 'note'),
    badge: pair(row, 'badge'),
    text: pair(row, 'text'),
    items: [...(itemsBySection.get(row.id) ?? [])].sort(byPosition).map((i) => ({
      id: i.id,
      name: pair(i, 'name'),
      price: i.price ?? '',
      desc: pair(i, 'desc'),
      from: pair(i, 'from'),
    })),
    groups: [...(sectionsByParent.get(row.id) ?? [])]
      .sort(byPosition)
      .map((child) => buildSection(child, sectionsByParent, itemsBySection)),
  };
}

export function buildMenuTree(cards, sections, items) {
  const itemsBySection = new Map();
  for (const item of items) {
    if (!itemsBySection.has(item.section_id)) itemsBySection.set(item.section_id, []);
    itemsBySection.get(item.section_id).push(item);
  }

  const sectionsByParent = new Map();
  for (const section of sections) {
    if (!section.parent_id) continue;
    if (!sectionsByParent.has(section.parent_id)) sectionsByParent.set(section.parent_id, []);
    sectionsByParent.get(section.parent_id).push(section);
  }

  return {
    cards: [...cards].sort(byPosition).map((card) => ({
      id: card.id,
      title: pair(card, 'title'),
      columns: [0, 1].map((index) =>
        sections
          .filter((s) => s.card_id === card.id && !s.parent_id && (s.column_index ?? 0) === index)
          .sort(byPosition)
          .map((s) => buildSection(s, sectionsByParent, itemsBySection))
      ),
    })),
  };
}

export function flattenMenuTree(data) {
  const cardRows = [];
  const sectionRows = [];
  const itemRows = [];

  const walk = (section, { cardId, parentId, columnIndex, position }) => {
    sectionRows.push({
      id: section.id,
      card_id: cardId,
      parent_id: parentId,
      column_index: columnIndex,
      position,
      kind: section.kind,
      sub: !!section.sub,
      heading_nl: blank(section.heading.nl), heading_en: blank(section.heading.en),
      lead_nl: blank(section.lead.nl),       lead_en: blank(section.lead.en),
      note_nl: blank(section.note.nl),       note_en: blank(section.note.en),
      badge_nl: blank(section.badge.nl),     badge_en: blank(section.badge.en),
      text_nl: blank(section.text.nl),       text_en: blank(section.text.en),
    });

    section.items.forEach((item, index) => {
      itemRows.push({
        id: item.id,
        section_id: section.id,
        position: index,
        name_nl: blank(item.name.nl), name_en: blank(item.name.en),
        price: blank(item.price),
        desc_nl: blank(item.desc.nl), desc_en: blank(item.desc.en),
        from_nl: blank(item.from.nl), from_en: blank(item.from.en),
      });
    });

    section.groups.forEach((group, index) =>
      walk(group, { cardId: null, parentId: section.id, columnIndex: 0, position: index })
    );
  };

  data.cards.forEach((card, cardIndex) => {
    cardRows.push({
      id: card.id,
      position: cardIndex,
      title_nl: blank(card.title.nl),
      title_en: blank(card.title.en),
    });
    card.columns.forEach((column, columnIndex) => {
      column.forEach((section, position) =>
        walk(section, { cardId: card.id, parentId: null, columnIndex, position })
      );
    });
  });

  return { cardRows, sectionRows, itemRows };
}

/*
 * Turns database rows into the exact shapes the site components already
 * consume, so the public components never learn where their content came from
 * and the bundled files in src/data stay a valid fallback.
 */

// _nl / _en columns become the { nl, en } pair t() understands. An empty _en
// is left as null on purpose: t() falls back to nl, which is how "same in both
// languages" is expressed throughout src/data.
export const pair = (nl, en) => ({ nl: nl ?? null, en: en || null });

// image_path holds either a path bundled with the site ('assets/gallery/x.jpg')
// or a full URL returned by Supabase Storage after an upload.
export const imageSrc = (path) => path || '';

const byPosition = (a, b) => (a.position ?? 0) - (b.position ?? 0);

export function mapConcept(row, pillRows) {
  return {
    conceptBlock: {
      kicker: pair(row?.kicker_nl, row?.kicker_en),
      heading: pair(row?.heading_nl, row?.heading_en),
      body1: pair(row?.body1_nl, row?.body1_en),
      body2: pair(row?.body2_nl, row?.body2_en),
    },
    conceptPills: [...(pillRows ?? [])].sort(byPosition).map((p) => ({
      id: p.id,
      strong: pair(p.strong_nl, p.strong_en),
      label: pair(p.label_nl, p.label_en),
    })),
  };
}

export function mapCakes(rows) {
  return [...(rows ?? [])].sort(byPosition).map((c) => ({
    id: c.id,
    src: imageSrc(c.image_path),
    alt: c.alt ?? '',
    title: pair(c.title_nl, c.title_en),
    blurb: pair(c.blurb_nl, c.blurb_en),
  }));
}

export function mapGallery(rows) {
  return [...(rows ?? [])].sort(byPosition).map((p) => ({
    id: p.id,
    src: imageSrc(p.image_path),
    alt: p.alt ?? '',
    caption: pair(p.caption_nl, p.caption_en),
  }));
}

function mapItem(row) {
  const item = {
    id: row.id,
    name: pair(row.name_nl, row.name_en),
    price: row.price ?? undefined,
  };
  if (row.desc_nl || row.desc_en) item.desc = pair(row.desc_nl, row.desc_en);
  if (row.from_nl || row.from_en) item.from = pair(row.from_nl, row.from_en);
  return item;
}

function mapSection(row, itemsBySection, childrenByParent) {
  const items = (itemsBySection.get(row.id) ?? []).sort(byPosition);

  const base = {
    id: row.id,
    kind: row.kind,
    sub: row.sub || undefined,
    heading: pair(row.heading_nl, row.heading_en),
  };

  switch (row.kind) {
    case 'till':
      return { ...base, text: pair(row.text_nl, row.text_en) };

    case 'boxList':
      return {
        ...base,
        lead: pair(row.lead_nl, row.lead_en),
        note: pair(row.note_nl, row.note_en),
        // Unpriced names are stored as ordinary items so one editor screen
        // covers every list on the menu.
        list: items.map((i) => pair(i.name_nl, i.name_en)),
        listIds: items.map((i) => i.id),
      };

    case 'feature':
      return {
        ...base,
        badge: pair(row.badge_nl, row.badge_en),
        groups: (childrenByParent.get(row.id) ?? [])
          .sort(byPosition)
          .map((child) => mapSection(child, itemsBySection, childrenByParent)),
      };

    default:
      return { ...base, items: items.map(mapItem) };
  }
}

export function mapMenu(cardRows, sectionRows, itemRows) {
  const itemsBySection = new Map();
  for (const item of itemRows ?? []) {
    if (!itemsBySection.has(item.section_id)) itemsBySection.set(item.section_id, []);
    itemsBySection.get(item.section_id).push(item);
  }

  const childrenByParent = new Map();
  for (const section of sectionRows ?? []) {
    if (!section.parent_id) continue;
    if (!childrenByParent.has(section.parent_id)) childrenByParent.set(section.parent_id, []);
    childrenByParent.get(section.parent_id).push(section);
  }

  return [...(cardRows ?? [])].sort(byPosition).map((card) => {
    const own = (sectionRows ?? []).filter((s) => s.card_id === card.id && !s.parent_id);

    // The layout is two columns; a section carries the index of the one it
    // belongs to. Building both columns unconditionally keeps the grid stable
    // even if one of them is emptied in the dashboard.
    const columns = [0, 1].map((index) =>
      own
        .filter((s) => (s.column_index ?? 0) === index)
        .sort(byPosition)
        .map((s) => mapSection(s, itemsBySection, childrenByParent))
    );

    return { id: card.id, title: pair(card.title_nl, card.title_en), columns };
  });
}

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isConfigured } from '../lib/supabaseConfig.js';
import { selectAll } from '../lib/restRead.js';
import { mapCakes, mapConcept, mapGallery, mapMenu } from './mapping.js';
import { conceptBlock, conceptPills } from '../data/concept.js';
import { cakeCategories, galleryPhotos } from '../data/gallery.js';
import { menuCards } from '../data/menu.js';

/*
 * Content comes from Supabase, with the files in src/data as a fallback.
 *
 * The fallback is rendered immediately, on the first paint, and swapped for the
 * live rows once they arrive. That is deliberate: a café menu must not depend
 * on a network round trip to be visible, and the alternative — a spinner where
 * the menu should be — is worse for both visitors and search engines. Whatever
 * was bundled at deploy time is a sane last-known-good version, so if Supabase
 * is slow, misconfigured, or down, the site simply shows that instead of
 * breaking.
 *
 * The visible cost is that an edit made in the dashboard appears a moment after
 * the page paints, rather than in it.
 */

const FALLBACK = {
  conceptBlock,
  conceptPills,
  cakes: cakeCategories,
  gallery: galleryPhotos,
  menuCards,
};

const ContentContext = createContext({ ...FALLBACK, status: 'fallback', error: null });

async function fetchContent(signal) {
  const [concept, pills, cakes, gallery, cards, sections, items] = await Promise.all(
    [
      'concept',
      'concept_pills',
      'cakes',
      'gallery_photos',
      'menu_cards',
      'menu_sections',
      'menu_items',
    ].map((table) => selectAll(table, signal))
  );

  const mappedConcept = concept[0]
    ? mapConcept(concept[0], pills)
    : { conceptBlock: FALLBACK.conceptBlock, conceptPills: FALLBACK.conceptPills };

  const menu = mapMenu(cards, sections, items);
  const mappedCakes = mapCakes(cakes);
  const mappedGallery = mapGallery(gallery);

  return {
    conceptBlock: mappedConcept.conceptBlock,
    // An empty table means "not seeded yet", not "the owner deleted everything
    // on purpose" — keeping the bundled copy avoids a blank section.
    conceptPills: mappedConcept.conceptPills.length ? mappedConcept.conceptPills : FALLBACK.conceptPills,
    cakes: mappedCakes.length ? mappedCakes : FALLBACK.cakes,
    gallery: mappedGallery.length ? mappedGallery : FALLBACK.gallery,
    menuCards: menu.length ? menu : FALLBACK.menuCards,
  };
}

export function ContentProvider({ children }) {
  const [state, setState] = useState({ ...FALLBACK, status: isConfigured ? 'loading' : 'fallback', error: null });

  useEffect(() => {
    if (!isConfigured) return;
    const controller = new AbortController();

    fetchContent(controller.signal)
      .then((content) => setState({ ...content, status: 'live', error: null }))
      .catch((error) => {
        if (error.name === 'AbortError') return;
        console.warn('[Café Faim] Falling back to bundled content:', error.message);
        setState({ ...FALLBACK, status: 'fallback', error });
      });

    return () => controller.abort();
  }, []);

  const value = useMemo(() => state, [state]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export const useContent = () => useContext(ContentContext);

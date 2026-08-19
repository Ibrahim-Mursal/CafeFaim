import { supabase } from '../../lib/supabase.js';
import { loadTable, newId, pairOf, saveCollection } from '../db.js';
import { moveItem } from '../useEditor.js';
import { Bilingual, Loading, OrderTools } from '../ui.jsx';

const pair = (row, key) => ({ nl: row?.[`${key}_nl`] ?? '', en: row?.[`${key}_en`] ?? '' });

async function load() {
  const [conceptRows, pills] = await Promise.all([loadTable('concept', 'id'), loadTable('concept_pills')]);
  const row = conceptRows[0] ?? {};

  return {
    block: {
      kicker: pair(row, 'kicker'),
      heading: pair(row, 'heading'),
      body1: pair(row, 'body1'),
      body2: pair(row, 'body2'),
    },
    pills: pills.map((p) => ({
      id: p.id,
      strong: pair(p, 'strong'),
      label: pair(p, 'label'),
    })),
  };
}

async function save(data, original) {
  const { block } = data;
  // id is pinned to 1 by the table's check constraint, so this upsert both
  // creates the row the first time and updates it every time after.
  const { error } = await supabase.from('concept').upsert({
    id: 1,
    kicker_nl: block.kicker.nl || null,
    kicker_en: block.kicker.en || null,
    heading_nl: block.heading.nl || null,
    heading_en: block.heading.en || null,
    body1_nl: block.body1.nl || null,
    body1_en: block.body1.en || null,
    body2_nl: block.body2.nl || null,
    body2_en: block.body2.en || null,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Concept opslaan: ${error.message}`);

  await saveCollection({
    table: 'concept_pills',
    rows: data.pills,
    loadedIds: original.pills.map((p) => p.id),
    toDb: (p) => ({
      strong_nl: pairOf(p.strong.nl, p.strong.en).nl,
      strong_en: pairOf(p.strong.nl, p.strong.en).en,
      label_nl: pairOf(p.label.nl, p.label.en).nl,
      label_en: pairOf(p.label.nl, p.label.en).en,
    }),
  });
}

// Stable identities so Admin can hand these to useEditor without re-loading.
export const conceptIO = { load, save };

export function ConceptEditor({ editor }) {
  const { data, update, status } = editor;

  if (status === 'loading') return <Loading />;
  if (status === 'failed') return <p className="ad-alert ad-alert--error">{editor.error}</p>;

  const setBlock = (key, value) => update((d) => ({ ...d, block: { ...d.block, [key]: value } }));
  const setPill = (index, key, value) =>
    update((d) => ({
      ...d,
      pills: d.pills.map((p, i) => (i === index ? { ...p, [key]: value } : p)),
    }));

  return (
    <>
      <section className="ad-panel">
        <div className="ad-panel__head">
          <h2>Concepttekst</h2>
        </div>
        <p className="ad-hint">
          Het blok “Het concept” op de homepagina, tussen de video en de menukaart.
        </p>

        <Bilingual
          label="Kopje erboven"
          value={data.block.kicker}
          onChange={(v) => setBlock('kicker', v)}
          placeholder="Het concept"
        />
        <Bilingual
          label="Titel"
          value={data.block.heading}
          onChange={(v) => setBlock('heading', v)}
        />
        <Bilingual
          label="Eerste alinea"
          value={data.block.body1}
          onChange={(v) => setBlock('body1', v)}
          textarea
        />
        <Bilingual
          label="Tweede alinea"
          value={data.block.body2}
          onChange={(v) => setBlock('body2', v)}
          textarea
        />
      </section>

      <section className="ad-panel">
        <div className="ad-panel__head">
          <h2>Blokjes ernaast</h2>
        </div>
        <p className="ad-hint">
          De vier kaartjes naast de tekst — een dikgedrukt woord met een korte regel eronder.
        </p>

        {data.pills.map((pill, index) => (
          <div className="ad-row" key={pill.id}>
            <div>
              <Bilingual
                label="Dikgedrukt"
                value={pill.strong}
                onChange={(v) => setPill(index, 'strong', v)}
              />
              <Bilingual
                label="Regel eronder"
                value={pill.label}
                onChange={(v) => setPill(index, 'label', v)}
              />
            </div>
            <OrderTools
              index={index}
              total={data.pills.length}
              label="Blokje"
              onMove={(from, to) => update((d) => ({ ...d, pills: moveItem(d.pills, from, to) }))}
              onRemove={(i) => update((d) => ({ ...d, pills: d.pills.filter((_, x) => x !== i) }))}
            />
          </div>
        ))}

        <button
          type="button"
          className="ad-btn ad-btn--ghost ad-btn--sm"
          style={{ marginTop: 14 }}
          onClick={() =>
            update((d) => ({
              ...d,
              pills: [...d.pills, { id: newId(), strong: { nl: '', en: '' }, label: { nl: '', en: '' } }],
            }))
          }
        >
          + Blokje toevoegen
        </button>
      </section>
    </>
  );
}

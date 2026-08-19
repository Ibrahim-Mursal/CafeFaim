import { supabase } from '../../lib/supabase.js';
import { loadTable } from '../db.js';
import { buildMenuTree, flattenMenuTree, newItem, newSection } from '../menuShape.js';
import { moveItem } from '../useEditor.js';
import { Bilingual, Loading, OrderTools, TextField } from '../ui.jsx';

/*
 * The menu is the one genuinely nested piece of content: card → column →
 * section → item, plus the matcha panel which holds sections of its own.
 *
 * The editor keeps that whole tree in state and writes it back in one save.
 * Positions are never edited by hand — they are taken from array order at save
 * time, so "move up" is the only thing anyone has to think about.
 */

const KINDS = [
  { value: 'group', label: 'Lijst met prijzen' },
  { value: 'box', label: 'Lijst met prijzen, in kader' },
  { value: 'boxList', label: 'Kader met namen (zonder prijs)' },
  { value: 'feature', label: 'Uitgelicht blok' },
  { value: 'till', label: 'Voetnoot' },
];
const kindLabel = (kind) => KINDS.find((k) => k.value === kind)?.label ?? kind;

// ---------------------------------------------------------------- load ----
async function load() {
  const [cards, sections, items] = await Promise.all([
    loadTable('menu_cards'),
    loadTable('menu_sections'),
    loadTable('menu_items'),
  ]);
  return buildMenuTree(cards, sections, items);
}

// ---------------------------------------------------------------- save ----
async function save(data, original) {
  const next = flattenMenuTree(data);
  const prev = flattenMenuTree(original);

  const removed = (before, after) => {
    const keep = new Set(after.map((r) => r.id));
    return before.map((r) => r.id).filter((id) => !keep.has(id));
  };

  const del = async (table, ids) => {
    if (!ids.length) return;
    const { error } = await supabase.from(table).delete().in('id', ids);
    if (error) throw new Error(`${table} verwijderen: ${error.message}`);
  };
  const put = async (table, rows) => {
    if (!rows.length) return;
    const { error } = await supabase.from(table).upsert(rows);
    if (error) throw new Error(`${table} opslaan: ${error.message}`);
  };

  // Children before parents when deleting, parents before children when
  // writing — anything else trips a foreign key mid-save.
  await del('menu_items', removed(prev.itemRows, next.itemRows));
  await del('menu_sections', removed(prev.sectionRows, next.sectionRows));
  await del('menu_cards', removed(prev.cardRows, next.cardRows));

  await put('menu_cards', next.cardRows);
  // menu_sections references itself, so the panels have to exist before the
  // groups nested inside them.
  await put('menu_sections', next.sectionRows.filter((r) => !r.parent_id));
  await put('menu_sections', next.sectionRows.filter((r) => r.parent_id));
  await put('menu_items', next.itemRows);
}

// ---------------------------------------------------------------- view ----
function ItemRows({ items, onChange, showPrice = true, showDesc = true }) {
  const set = (index, patch) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <>
      {items.map((item, index) => (
        <div className="ad-row" key={item.id}>
          <div>
            <Bilingual
              label="Naam"
              value={item.name}
              onChange={(name) => set(index, { name })}
            />
            {showPrice && (
              <TextField
                label="Prijs"
                className="ad-input ad-price"
                value={item.price}
                placeholder="€0.00"
                onChange={(price) => set(index, { price })}
              />
            )}
            {showDesc && (
              <Bilingual
                label="Omschrijving (optioneel)"
                value={item.desc}
                onChange={(desc) => set(index, { desc })}
                textarea
              />
            )}
          </div>
          <OrderTools
            index={index}
            total={items.length}
            label="Item"
            onMove={(from, to) => onChange(moveItem(items, from, to))}
            onRemove={(i) => onChange(items.filter((_, x) => x !== i))}
          />
        </div>
      ))}

      <button
        type="button"
        className="ad-btn ad-btn--ghost ad-btn--sm"
        style={{ marginTop: 10 }}
        onClick={() => onChange([...items, newItem()])}
      >
        + Item toevoegen
      </button>
    </>
  );
}

function SectionCard({ section, onChange, tools, nested = false }) {
  const set = (patch) => onChange({ ...section, ...patch });

  return (
    <div className="ad-sub">
      <div className="ad-sub__head">
        <span className="ad-sub__title">
          {section.heading.nl || 'Naamloos onderdeel'}
        </span>
        <span style={{ fontSize: '.78rem', color: '#8A8578' }}>{kindLabel(section.kind)}</span>
        <span className="ad-sub__spacer" />
        {tools}
      </div>

      {section.kind !== 'till' && (
        <Bilingual label="Kopje" value={section.heading} onChange={(heading) => set({ heading })} />
      )}

      {section.kind === 'till' && (
        <Bilingual label="Tekst" value={section.text} onChange={(text) => set({ text })} />
      )}

      {section.kind === 'feature' && (
        <>
          <Bilingual label="Labeltje" value={section.badge} onChange={(badge) => set({ badge })} />
          {section.groups.map((group, gi) => (
            <SectionCard
              key={group.id}
              section={group}
              nested
              onChange={(next) =>
                set({ groups: section.groups.map((g, i) => (i === gi ? next : g)) })
              }
              tools={
                <OrderTools
                  index={gi}
                  total={section.groups.length}
                  label="Groep"
                  onMove={(from, to) => set({ groups: moveItem(section.groups, from, to) })}
                  onRemove={(i) => set({ groups: section.groups.filter((_, x) => x !== i) })}
                />
              }
            />
          ))}
          <button
            type="button"
            className="ad-btn ad-btn--ghost ad-btn--sm"
            onClick={() => set({ groups: [...section.groups, newSection('group')] })}
          >
            + Groep toevoegen
          </button>
        </>
      )}

      {section.kind === 'boxList' && (
        <>
          <Bilingual label="Introregel" value={section.lead} onChange={(lead) => set({ lead })} />
          <ItemRows
            items={section.items}
            showPrice={false}
            showDesc={false}
            onChange={(items) => set({ items })}
          />
          <div style={{ marginTop: 14 }}>
            <Bilingual label="Voetnoot" value={section.note} onChange={(note) => set({ note })} />
          </div>
        </>
      )}

      {(section.kind === 'group' || section.kind === 'box') && (
        <ItemRows items={section.items} onChange={(items) => set({ items })} />
      )}

      {nested && (
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: '.86rem' }}>
          <input
            type="checkbox"
            checked={!!section.sub}
            onChange={(e) => set({ sub: e.target.checked })}
          />
          Kleiner kopje
        </label>
      )}
    </div>
  );
}

function ColumnPanel({ card, columnIndex, onChange }) {
  const column = card.columns[columnIndex];

  const setColumn = (next) =>
    onChange({
      ...card,
      columns: card.columns.map((c, i) => (i === columnIndex ? next : c)),
    });

  // Moving a section across columns is a real need (the menu is laid out in
  // two), and it is far less fiddly than dragging between two lists.
  const moveAcross = (index) => {
    const section = column[index];
    const other = columnIndex === 0 ? 1 : 0;
    onChange({
      ...card,
      columns: card.columns.map((c, i) => {
        if (i === columnIndex) return c.filter((_, x) => x !== index);
        if (i === other) return [...c, section];
        return c;
      }),
    });
  };

  return (
    <div className="ad-panel">
      <div className="ad-panel__head">
        <h3>{columnIndex === 0 ? 'Linkerkolom' : 'Rechterkolom'}</h3>
      </div>

      {column.length === 0 && <p className="ad-hint">Deze kolom is leeg.</p>}

      {column.map((section, index) => (
        <SectionCard
          key={section.id}
          section={section}
          onChange={(next) => setColumn(column.map((s, i) => (i === index ? next : s)))}
          tools={
            <>
              <button
                type="button"
                className="ad-icon"
                title={columnIndex === 0 ? 'Naar rechterkolom' : 'Naar linkerkolom'}
                aria-label={columnIndex === 0 ? 'Naar rechterkolom' : 'Naar linkerkolom'}
                onClick={() => moveAcross(index)}
              >
                {columnIndex === 0 ? '→' : '←'}
              </button>
              <OrderTools
                index={index}
                total={column.length}
                label="Onderdeel"
                onMove={(from, to) => setColumn(moveItem(column, from, to))}
                onRemove={(i) => setColumn(column.filter((_, x) => x !== i))}
              />
            </>
          }
        />
      ))}

      <AddSection onAdd={(kind) => setColumn([...column, newSection(kind)])} />
    </div>
  );
}

function AddSection({ onAdd }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
      <select
        className="ad-select"
        style={{ maxWidth: 260 }}
        defaultValue=""
        onChange={(e) => {
          if (!e.target.value) return;
          onAdd(e.target.value);
          e.target.value = '';
        }}
      >
        <option value="" disabled>
          + Onderdeel toevoegen…
        </option>
        {KINDS.map((k) => (
          <option key={k.value} value={k.value}>
            {k.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// Stable identities so Admin can hand these to useEditor without re-loading.
export const menuIO = { load, save };

export function MenuEditor({ editor }) {
  const { data, update, status } = editor;

  if (status === 'loading') return <Loading />;
  if (status === 'failed') return <p className="ad-alert ad-alert--error">{editor.error}</p>;

  const setCard = (index, next) =>
    update((d) => ({ ...d, cards: d.cards.map((c, i) => (i === index ? next : c)) }));

  return (
    <>
      <p className="ad-hint" style={{ marginBottom: 18 }}>
        De menukaart staat in twee kolommen naast elkaar op de site. Elk onderdeel hoort bij één
        kolom; met de pijl → of ← verplaats je het naar de andere.
      </p>

      {data.cards.map((card, cardIndex) => (
        <section key={card.id} style={{ marginBottom: 34 }}>
          <div className="ad-panel">
            <div className="ad-panel__head">
              <h2>{card.title.nl || 'Naamloze kaart'}</h2>
            </div>
            <Bilingual
              label="Titel van deze kaart"
              value={card.title}
              onChange={(title) => setCard(cardIndex, { ...card, title })}
            />
          </div>

          {[0, 1].map((columnIndex) => (
            <ColumnPanel
              key={columnIndex}
              card={card}
              columnIndex={columnIndex}
              onChange={(next) => setCard(cardIndex, next)}
            />
          ))}
        </section>
      ))}
    </>
  );
}

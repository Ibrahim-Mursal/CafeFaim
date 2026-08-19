import { loadTable, newId, saveCollection } from '../db.js';
import { moveItem } from '../useEditor.js';
import { Bilingual, ImageField, Loading, OrderTools } from '../ui.jsx';

/*
 * The custom-cakes cards and the gallery strip are the same editor: an ordered
 * list of photos, each with a caption. Only the extra blurb field and the
 * wording differ, so they are one component configured twice rather than two
 * near-identical files that would drift apart.
 *
 * Loading and saving are built by a factory at module scope, so the resulting
 * functions have a stable identity and can be handed to useEditor in Admin —
 * which is where all four editors' state lives, so that switching tabs does not
 * throw unsaved work away.
 */

const pair = (row, key) => ({ nl: row?.[`${key}_nl`] ?? '', en: row?.[`${key}_en`] ?? '' });
const empty = () => ({ nl: '', en: '' });

export function makePhotoIO({ table, captionColumn, withBlurb = false }) {
  return {
    async load() {
      const rows = await loadTable(table);
      return {
        photos: rows.map((row) => ({
          id: row.id,
          src: row.image_path ?? '',
          alt: row.alt ?? '',
          caption: pair(row, captionColumn),
          ...(withBlurb ? { blurb: pair(row, 'blurb') } : {}),
        })),
      };
    },

    async save(data, original) {
      await saveCollection({
        table,
        rows: data.photos,
        loadedIds: original.photos.map((p) => p.id),
        toDb: (p) => ({
          image_path: p.src || null,
          alt: p.alt || null,
          [`${captionColumn}_nl`]: p.caption.nl || null,
          [`${captionColumn}_en`]: p.caption.en || null,
          ...(withBlurb ? { blurb_nl: p.blurb?.nl || null, blurb_en: p.blurb?.en || null } : {}),
        }),
      });
    },
  };
}

export const cakesIO = makePhotoIO({ table: 'cakes', captionColumn: 'title', withBlurb: true });
export const galleryIO = makePhotoIO({ table: 'gallery_photos', captionColumn: 'caption' });

function PhotoList({ editor, title, hint, captionLabel, itemNoun, withBlurb }) {
  const { data, update, status, error } = editor;

  if (status === 'loading') return <Loading />;
  if (status === 'failed') return <p className="ad-alert ad-alert--error">{error}</p>;

  const setPhoto = (index, patch) =>
    update((d) => ({
      ...d,
      photos: d.photos.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));

  return (
    <section className="ad-panel">
      <div className="ad-panel__head">
        <h2>{title}</h2>
      </div>
      <p className="ad-hint">{hint}</p>

      {data.photos.length === 0 && (
        <p className="ad-alert ad-alert--info">
          Nog geen {itemNoun.toLowerCase()}en. Voeg er hieronder één toe.
        </p>
      )}

      {data.photos.map((photo, index) => (
        <div className="ad-sub" key={photo.id}>
          <div className="ad-sub__head">
            <span className="ad-sub__title">
              {index + 1}. {photo.caption.nl || `Nieuwe ${itemNoun.toLowerCase()}`}
            </span>
            <span className="ad-sub__spacer" />
            <OrderTools
              index={index}
              total={data.photos.length}
              label={itemNoun}
              onMove={(from, to) => update((d) => ({ ...d, photos: moveItem(d.photos, from, to) }))}
              onRemove={(i) => update((d) => ({ ...d, photos: d.photos.filter((_, x) => x !== i) }))}
            />
          </div>

          <ImageField
            value={photo.src}
            alt={photo.alt}
            onChange={(src) => setPhoto(index, { src })}
            onAltChange={(alt) => setPhoto(index, { alt })}
          />

          <div style={{ marginTop: 14 }}>
            <Bilingual
              label={captionLabel}
              value={photo.caption}
              onChange={(caption) => setPhoto(index, { caption })}
            />
            {withBlurb && (
              <Bilingual
                label="Regel eronder"
                value={photo.blurb ?? empty()}
                onChange={(blurb) => setPhoto(index, { blurb })}
              />
            )}
          </div>
        </div>
      ))}

      <button
        type="button"
        className="ad-btn ad-btn--ghost ad-btn--sm"
        onClick={() =>
          update((d) => ({
            ...d,
            photos: [
              ...d.photos,
              {
                id: newId(),
                src: '',
                alt: '',
                caption: empty(),
                ...(withBlurb ? { blurb: empty() } : {}),
              },
            ],
          }))
        }
      >
        + {itemNoun} toevoegen
      </button>
    </section>
  );
}

export function CakesEditor({ editor }) {
  return (
    <PhotoList
      editor={editor}
      withBlurb
      title="Taarten op maat"
      hint="De kaarten in de roze sectie “Taarten op maat”. Elke kaart heeft een foto, een titel en één regel eronder."
      captionLabel="Titel"
      itemNoun="Taartsoort"
    />
  );
}

export function GalleryEditor({ editor }) {
  return (
    <PhotoList
      editor={editor}
      title="Galerij (In beeld)"
      hint="De foto's in de bewegende strook onderaan de pagina. De volgorde hieronder is de volgorde waarin ze voorbijkomen."
      captionLabel="Bijschrift"
      itemNoun="Foto"
    />
  );
}

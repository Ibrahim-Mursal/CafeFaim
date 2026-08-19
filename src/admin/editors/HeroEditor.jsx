import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabase.js';
import { uploadVideo } from '../db.js';
import { Loading } from '../ui.jsx';
import { DEFAULT_HERO_VIDEO } from '../../data/site.js';

/*
 * The background video at the top of the homepage.
 *
 * An empty hero_video_path means "use the file that ships with the site". That
 * is stored as null rather than as the bundled path, so the default can be
 * changed in a future deploy without every existing install being pinned to the
 * old filename — and so "Terug naar de standaardvideo" is a real reset rather
 * than another hardcoded string in the database.
 */
export const heroIO = {
  async load() {
    const { data, error } = await supabase
      .from('site_settings')
      .select('hero_video_path')
      .eq('id', 1)
      .maybeSingle();
    if (error) throw new Error(`Startvideo: ${error.message}`);
    return { heroVideo: data?.hero_video_path ?? '' };
  },

  async save(data) {
    const { error } = await supabase.from('site_settings').upsert({
      id: 1,
      hero_video_path: data.heroVideo || null,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(`Startvideo opslaan: ${error.message}`);
  },
};

export function HeroEditor({ editor }) {
  const { data, update, status, error } = editor;
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const input = useRef(null);

  if (status === 'loading') return <Loading />;
  if (status === 'failed') return <p className="ad-alert ad-alert--error">{error}</p>;

  const current = data.heroVideo || DEFAULT_HERO_VIDEO;
  const isCustom = Boolean(data.heroVideo);

  async function pick(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy(true);
    setUploadError(null);
    try {
      update({ heroVideo: await uploadVideo(file) });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ad-panel">
      <div className="ad-panel__head">
        <h2>Startvideo</h2>
      </div>
      <p className="ad-hint">
        De video die op de achtergrond speelt bovenaan de homepagina. Hij speelt automatisch,
        zonder geluid, en herhaalt zich.
      </p>

      <video
        key={current}
        className="ad-video"
        src={current}
        muted
        loop
        autoPlay
        playsInline
        controls
      />

      <p className="ad-hint" style={{ marginTop: 10 }}>
        {isCustom ? 'Eigen video (geüpload).' : 'Standaardvideo die met de site is meegeleverd.'}
      </p>

      <input
        ref={input}
        type="file"
        accept="video/mp4,video/webm"
        hidden
        onChange={pick}
      />

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
        <button
          type="button"
          className="ad-btn ad-btn--ghost ad-btn--sm"
          onClick={() => input.current?.click()}
          disabled={busy}
        >
          {busy ? 'Uploaden…' : 'Andere video kiezen'}
        </button>

        {isCustom && (
          <button
            type="button"
            className="ad-btn ad-btn--danger ad-btn--sm"
            onClick={() => update({ heroVideo: '' })}
            disabled={busy}
          >
            Terug naar de standaardvideo
          </button>
        )}
      </div>

      {uploadError && (
        <div className="ad-alert ad-alert--error" style={{ marginTop: 14 }}>
          {uploadError}
        </div>
      )}

      {/* Stated before the upload, not after it fails: the size of this one
          file is paid by every visitor on every page load. */}
      <div className="ad-alert ad-alert--info" style={{ marginTop: 16 }}>
        <strong>Houd de video klein.</strong> Elke bezoeker downloadt hem, ook op mobiel
        internet. Maximaal 8 MB, MP4 of WebM. Een paar seconden beeld dat rustig herhaalt werkt
        het beste — geluid heeft geen zin, want de video speelt altijd zonder.
      </div>
    </section>
  );
}

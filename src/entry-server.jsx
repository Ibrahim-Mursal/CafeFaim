import { renderToString } from 'react-dom/server';
import { LangProvider } from './lang.jsx';
import { ContentProvider } from './content/ContentContext.jsx';
import App from './App.jsx';

/*
 * Renders the page to HTML at build time.
 *
 * Without this the file a crawler downloads is an empty <div id="root">, and
 * every word of the menu depends on that crawler choosing to execute
 * JavaScript. Google usually will; plenty of others — Bing, link previews,
 * smaller engines — often will not.
 *
 * No data fetching happens here: effects do not run during renderToString, so
 * this renders the bundled fallback content from src/data. That is the right
 * choice anyway, since the HTML is generated once at build time and Supabase
 * content would be stale the moment the owner edited anything.
 */
export function render() {
  return renderToString(
    <LangProvider>
      <ContentProvider>
        <App />
      </ContentProvider>
    </LangProvider>
  );
}

import { Component } from 'react';

/*
 * Catches a render crash and shows it, instead of letting React unmount the
 * whole dashboard and leave a white screen.
 *
 * A blank page is the worst possible failure here: the owner cannot tell it
 * apart from a slow load, has no idea their unsaved edits are gone, and has
 * nothing to report back. Anything that says "this broke, here is what broke"
 * is better, even when the underlying bug is unknown.
 *
 * Nothing is auto-saved on the way down. Recovering half-broken state risks
 * writing something wrong to a live menu, so the honest move is to say the
 * changes were lost rather than silently persist them.
 */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Kept in the console so a report can include the stack.
    console.error('[beheer] render error:', error, info?.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="ad-panel" role="alert">
        <h2 style={{ color: 'var(--danger)', marginBottom: 8 }}>Er ging iets mis</h2>
        <p className="ad-hint">
          Dit onderdeel kon niet worden getoond. Wijzigingen die nog niet waren opgeslagen zijn
          helaas verloren — opgeslagen inhoud op de site is niet geraakt.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <button
            type="button"
            className="ad-btn ad-btn--primary"
            onClick={() => this.setState({ error: null })}
          >
            Opnieuw proberen
          </button>
          <button
            type="button"
            className="ad-btn ad-btn--ghost"
            onClick={() => window.location.reload()}
          >
            Pagina verversen
          </button>
        </div>

        <details>
          <summary style={{ cursor: 'pointer', fontSize: '.85rem', color: '#6B6B63' }}>
            Technische details
          </summary>
          <pre className="ad-code" style={{ marginTop: 8 }}>
            {error?.message ?? String(error)}
          </pre>
        </details>
      </div>
    );
  }
}

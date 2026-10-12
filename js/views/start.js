// js/views/start.js
// Start-Reiter (noch einfach): zeigt bootstrap-Daten, mit Zwischenspeicher.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache } from '../cache.js';
import { getName } from '../store.js';

function zeitText(iso) {
  return new Date(iso).toLocaleString('de-DE');
}

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);

  const status = el('p', { class: 'leise', text: 'Lade Daten …' });
  const info = el('div', { class: 'karte' });
  container.append(el('div', { class: 'seite' },
    el('h1', { text: 'Hallo ' + (getName() || '') }),
    el('p', { class: 'leise', text: s.name }),
    info,
    status
  ));

  function zeigen(daten, meta) {
    leeren(info);
    const personen = daten && daten.personen ? daten.personen.length : 0;
    info.append(el('p', { text: 'Personen in der Liste: ' + personen }));
    status.className = 'leise';
    status.textContent = meta.aktuell
      ? 'Aktuell. Stand: ' + zeitText(meta.stand)
      : 'Zwischengespeichert von ' + zeitText(meta.stand) + '. Aktualisiere …';
  }

  async function laden(zuerstCache) {
    try {
      const ok = await ladeMitCache(
        s.gruppe_id + ':bootstrap',
        function () { return api('bootstrap', {}, s.token); },
        zeigen,
        zuerstCache
      );
      if (!ok) {
        status.className = 'fehler';
        status.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
      }
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      status.className = 'fehler';
      status.textContent = 'Fehler: ' + e.message;
    }
  }

  ctx.setzeRefresh(function () { return laden(false); });
  await laden(true);
}

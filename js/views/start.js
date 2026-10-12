// js/views/start.js
// Platzhalter für den Start-Reiter. Testet den Aufruf "bootstrap".

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { clearSession } from '../store.js';

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);

  const status = el('p', { class: 'leise', text: 'Lade Daten …' });
  const abmelden = el('button', {
    class: 'knopf',
    type: 'button',
    text: 'Abmelden',
    onclick: function () {
      clearSession();
      location.hash = '#/';
      ctx.neuLaden();
    }
  });

  container.append(el('div', { class: 'mitte' },
    el('h1', { text: s.name }),
    el('p', { text: 'Du bist angemeldet.' }),
    status,
    abmelden
  ));

  try {
    const daten = await api('bootstrap', {}, s.token);
    const tabs = daten && typeof daten === 'object' ? Object.keys(daten).join(', ') : '';
    status.textContent = 'Verbindung ok. Erhalten: ' + (tabs || '(leer)');
  } catch (e) {
    status.textContent = 'Fehler: ' + e.message;
    status.className = 'fehler';
    if (e.code === 'auth') {
      clearSession();
      ctx.neuLaden();
    }
  }
}

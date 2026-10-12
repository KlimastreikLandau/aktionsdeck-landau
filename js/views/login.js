// js/views/login.js
// PIN eingeben. Das Skript prüft den PIN und gibt ein Token zurück.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { setSession } from '../store.js';

export function render(container, ctx) {
  const g = ctx.gruppe;
  leeren(container);

  const fehler = el('p', { class: 'fehler', role: 'alert' });
  const pin = el('input', {
    class: 'feld',
    type: 'password',
    autocomplete: 'current-password',
    placeholder: 'PIN',
    'aria-label': 'PIN'
  });
  const knopf = el('button', { class: 'knopf', type: 'submit', text: 'Anmelden' });

  const formular = el('form', { class: 'login-form' }, pin, fehler, knopf);
  formular.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    fehler.textContent = '';
    if (!pin.value.trim()) {
      fehler.textContent = 'Bitte den PIN eingeben.';
      return;
    }
    knopf.disabled = true;
    knopf.textContent = 'Prüfe …';
    try {
      const daten = await api('login', { gruppe_id: g.gruppe_id, pin: pin.value });
      if (!daten || !daten.token) throw new Error('Keine Anmeldung erhalten.');
      setSession({
        token: daten.token,
        gruppe_id: g.gruppe_id,
        kurzname: g.kurzname,
        name: g.name,
        farbe: g.farbe || ''
      });
      ctx.neuLaden();
    } catch (e) {
      fehler.textContent = e.message;
      knopf.disabled = false;
      knopf.textContent = 'Anmelden';
    }
  });

  const zurueck = el('a', { href: '#/', text: '← Andere Gruppe' });
  container.append(el('div', { class: 'mitte' },
    el('h1', { text: g.name }),
    el('p', { class: 'leise', text: 'Gib den PIN deiner Gruppe ein.' }),
    formular,
    el('p', null, zurueck)
  ));
  pin.focus();
}

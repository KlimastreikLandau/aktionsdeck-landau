// js/views/hilfe.js
// Reiter Hilfe (Hilfe und Skillshare). Nur mit PIN erreichbar. Inhalte kommen später.

import { el, leeren } from '../ui/dom.js';

export function render(container, ctx) {
  leeren(container);
  container.append(el('div', { class: 'seite' },
    el('h1', { text: 'Hilfe' }),
    el('p', { class: 'leise', text: 'Hier kommen später Hilfe und Skillshare.' })
  ));
}

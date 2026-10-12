// js/views/platzhalter.js
// Wird für Reiter gezeigt, die noch keine eigene Datei haben.

import { el, leeren } from '../ui/dom.js';

export function render(container, ctx) {
  leeren(container);
  container.append(el('div', { class: 'seite' },
    el('h1', { text: ctx.tabLabel || 'Reiter' }),
    el('p', { class: 'leise', text: 'Dieser Reiter ist noch in Arbeit.' })
  ));
}

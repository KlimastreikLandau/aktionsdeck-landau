// js/views/info.js
// Impressum, Datenschutz, Hilfe. Ohne Login erreichbar. Texte kommen in Schritt 6.1.

import { el, leeren } from '../ui/dom.js';

export function render(container, ctx) {
  leeren(container);
  const box = el('div', { class: 'seite' }, el('h1', { text: 'Info' }));

  ['Impressum', 'Datenschutz', 'Hilfe'].forEach(function (titel) {
    box.append(el('section', { class: 'karte' },
      el('h2', { text: titel }),
      el('p', { class: 'leise', text: 'Dieser Text kommt in Schritt 6.1.' })
    ));
  });

  box.append(el('p', { class: 'leise', text: 'AktionsDeck Landau · Version ' + ctx.version }));
  if (!ctx.session) {
    box.append(el('p', null, el('a', { href: '#/', text: '← Zur Gruppenwahl' })));
  }
  container.append(box);
}

// js/views/start.js
// Start-Reiter: Dashboard-Platzhalter. Lädt keine Daten. Die Kacheln kommen mit den Etappen 3 bis 5.

import { el, leeren } from '../ui/dom.js';
import { gruppenLogo } from '../ui/logo.js';
import { getName } from '../store.js';

const KACHELN = [
  { titel: 'Material', hinweis: 'Bestand und Ausleihe' },
  { titel: 'ToDos', hinweis: 'Kommt mit Etappe 3' },
  { titel: 'Projekte', hinweis: 'Kommt mit Etappe 4' },
  { titel: 'Posts', hinweis: 'Kommt mit Etappe 5' },
  { titel: 'Kalender', hinweis: 'Kommt mit Etappe 5' }
];

export function render(container, ctx) {
  const s = ctx.session;
  leeren(container);

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'dash-kopf' },
      gruppenLogo(s.kurzname, 'dash-logo'),
      el('h1', { text: 'Hallo ' + (getName() || '') })
    ),
    el('div', { class: 'dash-raster' },
      ...KACHELN.map(function (k) {
        return el('section', { class: 'karte dash-kachel' },
          el('h2', { text: k.titel }),
          el('p', { class: 'leise', text: k.hinweis })
        );
      })
    )
  ));
}

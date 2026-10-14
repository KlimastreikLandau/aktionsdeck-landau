// js/views/info.js
// Impressum, Info, Datenschutz: drei Seiten, ohne Login erreichbar. Texte kommen in Schritt 6.1.

import { el, leeren } from '../ui/dom.js';
import { balken } from '../ui/kopf.js';
import { OEFFENTLICH } from '../ui/nav.js';
import { getSession } from '../store.js';

export function render(container, ctx) {
  leeren(container);
  const aktiv = OEFFENTLICH.find(function (o) { return o.id === ctx.seite; }) ||
    OEFFENTLICH.find(function (o) { return o.id === 'info'; });

  const menue = el('nav', { class: 'start-knoepfe', 'aria-label': 'Rechtliches und Info' },
    ...OEFFENTLICH.map(function (o) {
      const a = el('a', {
        class: 'knopf' + (o.id === aktiv.id ? '' : ' knopf-hell'),
        href: '#/info/' + o.id,
        text: o.label
      });
      if (o.id === aktiv.id) a.setAttribute('aria-current', 'page');
      return a;
    })
  );

  const s = getSession();
  const zurueck = s
    ? el('a', { href: '#/g/' + encodeURIComponent(s.kurzname) + '/start', text: '← Zurück zur App' })
    : el('a', { href: '#/', text: '← Zur Gruppenwahl' });

  container.append(
    balken(),
    el('div', { class: 'start-seite' },
      menue,
      el('section', { class: 'karte info-karte' },
        el('h1', { text: aktiv.label }),
        el('p', { class: 'leise', text: 'Dieser Text kommt in Schritt 6.1.' }),
        aktiv.id === 'info'
          ? el('p', { class: 'leise', text: 'AktionsDeck Landau · Version ' + ctx.version })
          : null
      ),
      el('p', null, zurueck)
    )
  );
}

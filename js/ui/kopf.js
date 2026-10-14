// js/ui/kopf.js
// Dunkelgrauer Balken oben mit Logo und Titel. Ein Klick führt zur Gruppenwahl.

import { el } from './dom.js';

export function balken() {
  return el('header', { class: 'app-balken' },
    el('a', {
      class: 'app-balken-innen',
      href: '#/',
      'aria-label': 'AktionsDeck Landau, zur Gruppenwahl'
    },
      el('span', { class: 'balken-logo' },
        el('img', { src: 'icons/logo.svg', alt: '' })
      ),
      el('span', { class: 'balken-titel', text: 'AktionsDeck Landau' })
    )
  );
}

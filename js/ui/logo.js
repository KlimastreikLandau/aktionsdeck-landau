// js/ui/logo.js
// Gruppenlogo: icons/gruppen/<kurzname>.svg, sonst .png, sonst das AktionsDeck-Logo.

import { el } from './dom.js';

export function gruppenLogo(kurzname, klasse) {
  const k = encodeURIComponent(String(kurzname || ''));
  const quellen = [
    'icons/gruppen/' + k + '.svg',
    'icons/gruppen/' + k + '.png',
    'icons/logo.svg'
  ];
  let i = 0;
  const img = el('img', {
    class: klasse || 'gruppen-logo',
    alt: '',
    'aria-hidden': 'true'
  });
  img.addEventListener('error', function () {
    i += 1;
    if (i < quellen.length) img.src = quellen[i];
  });
  img.src = quellen[0];
  return img;
}

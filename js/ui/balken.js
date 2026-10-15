// js/ui/balken.js
// Fortschrittsbalken mit Text darunter. prozent: 0 bis 100.

import { el } from './dom.js';

export function fortschrittsBalken(prozent, text) {
  const p = Math.max(0, Math.min(100, Number(prozent) || 0));
  const fuell = el('div', { class: 'fortschritt-fuell' });
  fuell.style.width = p + '%';
  const spur = el('div', {
    class: 'fortschritt-spur',
    role: 'progressbar',
    'aria-label': 'Fortschritt',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-valuenow': String(p)
  }, fuell);
  return el('div', { class: 'fortschritt' },
    spur,
    el('span', { class: 'leise fortschritt-text', text: text || '' })
  );
}

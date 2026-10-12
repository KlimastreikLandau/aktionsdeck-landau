// js/ui/toast.js
// Kleine Meldung unten im Bild.

import { el } from './dom.js';

export function toast(text) {
  const t = el('div', { class: 'toast', role: 'status', text: text });
  document.body.append(t);
  setTimeout(function () { t.remove(); }, 3500);
}

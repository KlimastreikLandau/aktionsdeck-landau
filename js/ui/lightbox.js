// js/ui/lightbox.js
// Zeigt ein Bild groß in der Bildschirmmitte. Schließen: Klick, Esc oder ✕-Knopf.

import { el } from './dom.js';

export function zeigeBild(quelle, beschreibung) {
  const vorher = document.activeElement;
  const img = el('img', {
    class: 'lightbox-bild',
    src: quelle,
    alt: beschreibung || '',
    referrerpolicy: 'no-referrer'
  });
  const zu = el('button', {
    class: 'lightbox-zu', type: 'button', 'aria-label': 'Foto schließen', text: '✕'
  });
  const hintergrund = el('div', {
    class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': beschreibung || 'Foto'
  }, img, zu);

  function taste(ev) { if (ev.key === 'Escape') schliessen(); }
  function schliessen() {
    document.removeEventListener('keydown', taste);
    hintergrund.remove();
    if (vorher && vorher.focus) vorher.focus();
  }

  img.addEventListener('error', function () {
    img.replaceWith(el('p', { class: 'lightbox-fehler', text: 'Das Foto konnte nicht geladen werden.' }));
  });
  hintergrund.addEventListener('click', schliessen);
  document.addEventListener('keydown', taste);
  document.body.append(hintergrund);
  zu.focus();
}

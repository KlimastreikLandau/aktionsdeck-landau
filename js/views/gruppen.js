// js/views/gruppen.js
// Startseite: Gruppe wählen (ohne Login).

import { el, leeren } from '../ui/dom.js';

function infoLink() {
  return el('p', null, el('a', { href: '#/info', text: 'Info (Impressum, Datenschutz, Hilfe)' }));
}

export async function render(container, ctx) {
  leeren(container);
  const box = el('div', { class: 'mitte' },
    el('h1', { text: 'AktionsDeck Landau' }),
    el('p', { class: 'leise', text: 'Wähle deine Gruppe.' })
  );
  container.append(box);

  const gruppen = await ctx.ladeGruppen();
  if (!gruppen) {
    box.append(el('p', { class: 'fehler', text: 'Die Gruppen konnten nicht geladen werden.' }));
    box.append(el('button', { class: 'knopf', text: 'Nochmal versuchen', onclick: ctx.neuLaden }));
    box.append(infoLink());
    return;
  }

  gruppen.forEach(function (g) {
    const karte = el('a', {
      class: 'karte gruppe-karte',
      href: '#/g/' + encodeURIComponent(g.kurzname) + '/start'
    }, el('strong', { text: g.name }));
    if (g.farbe) karte.style.borderLeftColor = g.farbe;
    box.append(karte);
  });
  box.append(infoLink());
}

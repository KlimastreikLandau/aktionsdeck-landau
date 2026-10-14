// js/views/gruppen.js
// Startseite: Gruppe wählen (ohne Login). Zeigt zuerst die gemerkte Liste, dann die frische.

import { el, leeren } from '../ui/dom.js';
import { gruppenLogo } from '../ui/logo.js';

function infoLink() {
  return el('p', { class: 'start-info' },
    el('a', { href: '#/info', text: 'Info (Impressum, Datenschutz, Hilfe)' })
  );
}

function farbeOk(f) {
  return /^#[0-9a-fA-F]{6}$/.test(String(f || '').trim());
}

function kachel(g) {
  const strich = el('div', { class: 'kachel-strich', 'aria-hidden': 'true' });
  if (farbeOk(g.farbe)) strich.style.background = String(g.farbe).trim();
  return el('a', {
    class: 'gruppen-kachel',
    href: '#/g/' + encodeURIComponent(g.kurzname) + '/start'
  },
    gruppenLogo(g.kurzname, 'gruppen-logo'),
    el('span', { class: 'kachel-name', text: g.name }),
    strich
  );
}

export async function render(container, ctx) {
  leeren(container);
  const raster = el('div', { class: 'gruppen-raster' });
  const meldung = el('div');

  container.append(el('div', { class: 'start-seite' },
    el('div', { class: 'start-kopf' },
      el('img', { class: 'start-logo', src: 'icons/logo.svg', alt: '' }),
      el('div', null,
        el('h1', { text: 'AktionsDeck Landau' }),
        el('p', { class: 'leise', text: 'Wähle deine Gruppe.' })
      )
    ),
    raster,
    meldung,
    infoLink()
  ));

  function zeige(liste) {
    leeren(raster);
    liste.forEach(function (g) { raster.append(kachel(g)); });
  }

  const sofort = ctx.gruppenSofort();
  const hatSofort = !!(sofort && sofort.length);
  if (hatSofort) {
    zeige(sofort);
  } else {
    for (let i = 0; i < 3; i++) {
      raster.append(el('div', { class: 'platzhalter-kachel', 'aria-hidden': 'true' }));
    }
  }

  const frisch = await ctx.ladeGruppen();
  if (!container.contains(raster)) return; // Seite wurde inzwischen gewechselt

  if (frisch) {
    leeren(meldung);
    zeige(frisch);
    return;
  }
  if (hatSofort) {
    meldung.append(el('p', {
      class: 'leise',
      text: 'Keine Verbindung. Du siehst die zuletzt gespeicherten Gruppen.'
    }));
    return;
  }
  leeren(raster);
  meldung.append(
    el('p', { class: 'fehler', text: 'Die Gruppen konnten nicht geladen werden.' }),
    el('button', { class: 'knopf', type: 'button', text: 'Nochmal versuchen', onclick: ctx.neuLaden })
  );
}

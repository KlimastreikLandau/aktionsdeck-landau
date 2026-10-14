// js/views/gruppen.js
// Startseite: Gruppe wählen (ohne Login). Zeigt zuerst die gemerkte Liste, dann die frische.

import { el, leeren } from '../ui/dom.js';
import { gruppenLogo } from '../ui/logo.js';
import { balken } from '../ui/kopf.js';
import { OEFFENTLICH } from '../ui/nav.js';

function farbeOk(f) {
  return /^#[0-9a-fA-F]{6}$/.test(String(f || '').trim());
}

// Der Strich in Gruppenfarbe ist die untere Kante der Kachel.
function kachel(g) {
  const a = el('a', {
    class: 'gruppen-kachel',
    href: '#/g/' + encodeURIComponent(g.kurzname) + '/start'
  },
    gruppenLogo(g.kurzname, 'gruppen-logo'),
    el('span', { class: 'kachel-name', text: g.name })
  );
  if (farbeOk(g.farbe)) a.style.borderBottomColor = String(g.farbe).trim();
  return a;
}

function infoKnoepfe() {
  return el('nav', { class: 'start-knoepfe', 'aria-label': 'Rechtliches und Info' },
    ...OEFFENTLICH.map(function (o) {
      return el('a', { class: 'knopf knopf-hell', href: '#/info/' + o.id, text: o.label });
    })
  );
}

export async function render(container, ctx) {
  leeren(container);
  const raster = el('div', { class: 'gruppen-raster' });
  const meldung = el('div');

  container.append(
    balken(),
    el('div', { class: 'start-seite' }, raster, meldung, infoKnoepfe())
  );

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

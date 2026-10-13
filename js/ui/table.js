// js/ui/table.js
// Zeigt eine Liste: Tabelle am PC, Karten am Handy (CSS schaltet um).
// spalten: [{ name, label, wert?: function(zeile), zahl?: true }]
// karte:   function(zeile) -> { titel, zeilen: [text, ...] }
// onKlick: function(zeile) oder null

import { el, leeren } from './dom.js';

function klickbar(e, zeile, onKlick) {
  if (!onKlick) return;
  e.classList.add('klickbar');
  e.tabIndex = 0;
  e.addEventListener('click', function () { onKlick(zeile); });
  e.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') onKlick(zeile);
  });
}

export function zeigeListe(container, zeilen, spalten, karte, onKlick, leerText) {
  leeren(container);
  if (!zeilen.length) {
    container.append(el('p', { class: 'leise', text: leerText || 'Nichts gefunden.' }));
    return;
  }

  const kopf = el('tr', null, ...spalten.map(function (sp) {
    return el('th', { scope: 'col', class: sp.zahl ? 'zahl' : '', text: sp.label });
  }));
  const rumpf = el('tbody');
  const karten = el('div', { class: 'karten-liste' });

  zeilen.forEach(function (z) {
    const tr = el('tr', null, ...spalten.map(function (sp) {
      const w = sp.wert ? sp.wert(z) : z[sp.name];
      return el('td', {
        class: sp.zahl ? 'zahl' : '',
        text: w === null || w === undefined ? '' : String(w)
      });
    }));
    klickbar(tr, z, onKlick);
    rumpf.append(tr);

    const k = karte(z);
    const kk = el('div', { class: 'karte listenkarte' },
      el('strong', { text: k.titel }),
      ...k.zeilen.filter(Boolean).map(function (t) {
        return el('p', { class: 'leise', text: t });
      })
    );
    klickbar(kk, z, onKlick);
    karten.append(kk);
  });

  container.append(
    el('div', { class: 'tabelle-wrap' },
      el('table', { class: 'tabelle' }, el('thead', null, kopf), rumpf)),
    karten
  );
}

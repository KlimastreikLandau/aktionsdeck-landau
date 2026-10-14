// js/ui/table.js
// Zeigt eine Liste: Tabelle am PC, Karten am Handy (CSS schaltet um).
// spalten: [{ name, label, wert?: function(zeile), zahl?: true }]
// karte:   function(zeile) -> { titel, zeilen: [text, ...] }
// onKlick: function(zeile) oder null
// auswahl (optional): { gewaehlt(z), erlaubt(z), umschalten(z, wert) } -> Checkboxen, Klick wählt aus

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

// Tabelle und Karten haben je eine Checkbox: beide gleich halten
function abgleichen(container, id, wert) {
  container.querySelectorAll('input.auswahl-box').forEach(function (c) {
    if (c.getAttribute('data-id') === String(id)) c.checked = wert;
  });
}

function checkbox(z, auswahl, container) {
  const cb = el('input', {
    type: 'checkbox',
    class: 'auswahl-box',
    'data-id': String(z.id),
    'aria-label': String(z.name) + ' auswählen'
  });
  cb.checked = auswahl.gewaehlt(z);
  cb.disabled = !auswahl.erlaubt(z);
  cb.addEventListener('click', function (ev) { ev.stopPropagation(); });
  cb.addEventListener('change', function () {
    auswahl.umschalten(z, cb.checked);
    abgleichen(container, z.id, cb.checked);
  });
  return cb;
}

export function zeigeListe(container, zeilen, spalten, karte, onKlick, leerText, auswahl) {
  leeren(container);
  if (!zeilen.length) {
    container.append(el('p', { class: 'leise', text: leerText || 'Nichts gefunden.' }));
    return;
  }

  let klick = onKlick;
  if (auswahl) {
    klick = function (z) {
      if (!auswahl.erlaubt(z)) return;
      const neu = !auswahl.gewaehlt(z);
      auswahl.umschalten(z, neu);
      abgleichen(container, z.id, neu);
    };
  }

  const kopfZellen = spalten.map(function (sp) {
    return el('th', { scope: 'col', class: sp.zahl ? 'zahl' : '', text: sp.label });
  });
  if (auswahl) {
    kopfZellen.unshift(el('th', { scope: 'col', class: 'auswahl-spalte' },
      el('span', { class: 'nur-leser', text: 'Auswahl' })));
  }
  const kopf = el('tr', null, ...kopfZellen);
  const rumpf = el('tbody');
  const karten = el('div', { class: 'karten-liste' });

  zeilen.forEach(function (z) {
    const zellen = spalten.map(function (sp) {
      const w = sp.wert ? sp.wert(z) : z[sp.name];
      return el('td', {
        class: sp.zahl ? 'zahl' : '',
        text: w === null || w === undefined ? '' : String(w)
      });
    });
    if (auswahl) {
      zellen.unshift(el('td', { class: 'auswahl-spalte' }, checkbox(z, auswahl, container)));
    }
    const tr = el('tr', { class: auswahl && !auswahl.erlaubt(z) ? 'gesperrt' : '' }, ...zellen);
    klickbar(tr, z, klick);
    rumpf.append(tr);

    const k = karte(z);
    const text = el('div', { class: 'karten-text' },
      el('strong', { text: k.titel }),
      ...k.zeilen.filter(Boolean).map(function (t) {
        return el('p', { class: 'leise', text: t });
      })
    );
    let kk;
    if (auswahl) {
      kk = el('div', {
        class: 'karte listenkarte mit-box' + (auswahl.erlaubt(z) ? '' : ' gesperrt')
      }, checkbox(z, auswahl, container), text);
    } else {
      kk = el('div', { class: 'karte listenkarte' }, text);
    }
    klickbar(kk, z, klick);
    karten.append(kk);
  });

  container.append(
    el('div', { class: 'tabelle-wrap' },
      el('table', { class: 'tabelle' }, el('thead', null, kopf), rumpf)),
    karten
  );
}

// js/ui/table.js
// Zeigt eine Liste: Tabelle am PC, Karten am Handy (CSS schaltet um).
// spalten: [{ name, label, wert?: function(zeile), zahl?: true }]
// karte:   function(zeile) -> { titel, zeilen: [text, ...] }
// onKlick: function(zeile) oder null
// auswahl (optional): { gewaehlt(z), erlaubt(z), umschalten(z, wert) } -> Checkboxen, Klick wählt aus
// extra (optional):
//   klasse(z)  -> Text mit CSS-Klassen für Zeile und Karte (z. B. "erledigt")
//   haken      -> { gesetzt(z), umschalten(z, wert), label?(z) }: Kästchen, das sofort etwas auslöst.
//                 Ein Klick auf das Kästchen öffnet NICHT das Detail.

import { el, leeren } from './dom.js';

function klickbar(e, zeile, onKlick) {
  if (!onKlick) return;
  e.classList.add('klickbar');
  e.tabIndex = 0;
  e.addEventListener('click', function () { onKlick(zeile); });
  e.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && ev.target === e) onKlick(zeile);
  });
}

// Tabelle und Karten haben je eine Checkbox: beide gleich halten
function abgleichen(container, id, wert) {
  container.querySelectorAll('input.auswahl-box').forEach(function (c) {
    if (c.getAttribute('data-id') === String(id)) c.checked = wert;
  });
}

function abgleichenHaken(container, id, wert) {
  container.querySelectorAll('input.haken-box').forEach(function (c) {
    if (c.getAttribute('data-haken') === String(id)) c.checked = wert;
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

function hakenBox(z, haken, container) {
  const cb = el('input', {
    type: 'checkbox',
    class: 'auswahl-box haken-box',
    'data-haken': String(z.id),
    'aria-label': haken.label ? haken.label(z) : 'Erledigt'
  });
  cb.checked = !!haken.gesetzt(z);
  cb.addEventListener('click', function (ev) { ev.stopPropagation(); });
  cb.addEventListener('change', function () {
    abgleichenHaken(container, z.id, cb.checked);
    haken.umschalten(z, cb.checked);
  });
  return cb;
}

export function zeigeListe(container, zeilen, spalten, karte, onKlick, leerText, auswahl, extra) {
  const ex = extra || {};
  const haken = auswahl ? null : (ex.haken || null);
  const klasseVon = ex.klasse || function () { return ''; };

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
  if (auswahl || haken) {
    kopfZellen.unshift(el('th', { scope: 'col', class: 'auswahl-spalte' },
      el('span', { class: 'nur-leser', text: haken ? 'Erledigt' : 'Auswahl' })));
  }
  const kopf = el('tr', null, ...kopfZellen);
  const rumpf = el('tbody');
  const karten = el('div', { class: 'karten-liste' });

  zeilen.forEach(function (z) {
    const zusatzKlasse = String(klasseVon(z) || '').trim();

    const zellen = spalten.map(function (sp) {
      const w = sp.wert ? sp.wert(z) : z[sp.name];
      return el('td', {
        class: sp.zahl ? 'zahl' : '',
        text: w === null || w === undefined ? '' : String(w)
      });
    });
    if (auswahl) {
      zellen.unshift(el('td', { class: 'auswahl-spalte' }, checkbox(z, auswahl, container)));
    } else if (haken) {
      zellen.unshift(el('td', { class: 'auswahl-spalte' }, hakenBox(z, haken, container)));
    }
    const trKlasse = [auswahl && !auswahl.erlaubt(z) ? 'gesperrt' : '', zusatzKlasse]
      .filter(Boolean).join(' ');
    const tr = el('tr', { class: trKlasse }, ...zellen);
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
        class: ['karte listenkarte mit-box', auswahl.erlaubt(z) ? '' : 'gesperrt', zusatzKlasse]
          .filter(Boolean).join(' ')
      }, checkbox(z, auswahl, container), text);
    } else if (haken) {
      kk = el('div', {
        class: ['karte listenkarte mit-box', zusatzKlasse].filter(Boolean).join(' ')
      }, hakenBox(z, haken, container), text);
    } else {
      kk = el('div', {
        class: ['karte listenkarte', zusatzKlasse].filter(Boolean).join(' ')
      }, text);
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

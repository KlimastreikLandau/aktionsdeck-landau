// js/ui/table.js
// Zeigt eine Liste: Tabelle am PC, Karten am Handy (CSS schaltet um).
// spalten: [{ name, label, wert?: function(zeile), zahl?: true }]
// karte:   function(zeile) -> { titel, zeilen: [text, ...] }
// onKlick: function(zeile) oder null
// auswahl (optional): { gewaehlt(z), erlaubt(z), umschalten(z, wert) } -> Checkboxen, Klick wählt aus
// haken (optional):   { gewaehlt(z), umschalten(z, wert) } -> Kästchen "erledigt", Klick auf die Zeile öffnet weiter das Detail

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

function titelVon(z) {
  return String(z.name || z.text || '').slice(0, 60);
}

function checkbox(z, boxen, container, suffix) {
  const cb = el('input', {
    type: 'checkbox',
    class: 'auswahl-box',
    'data-id': String(z.id),
    'aria-label': titelVon(z) + suffix
  });
  cb.checked = boxen.gewaehlt(z);
  cb.disabled = boxen.erlaubt ? !boxen.erlaubt(z) : false;
  cb.addEventListener('click', function (ev) { ev.stopPropagation(); });
  cb.addEventListener('keydown', function (ev) { ev.stopPropagation(); });
  cb.addEventListener('change', function () {
    boxen.umschalten(z, cb.checked);
    abgleichen(container, z.id, cb.checked);
  });
  return cb;
}

export function zeigeListe(container, zeilen, spalten, karte, onKlick, leerText, auswahl, haken) {
  leeren(container);
  if (!zeilen.length) {
    container.append(el('p', { class: 'leise', text: leerText || 'Nichts gefunden.' }));
    return;
  }

  const boxen = auswahl || haken || null;
  const suffix = auswahl ? ' auswählen' : ' erledigt';

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
  if (boxen) {
    kopfZellen.unshift(el('th', { scope: 'col', class: 'auswahl-spalte' },
      el('span', { class: 'nur-leser', text: auswahl ? 'Auswahl' : 'Erledigt' })));
  }
  const kopf = el('tr', null, ...kopfZellen);
  const rumpf = el('tbody');
  const karten = el('div', { class: 'karten-liste' });

  zeilen.forEach(function (z) {
    const gesperrt = !!(auswahl && !auswahl.erlaubt(z));
    const zellen = spalten.map(function (sp) {
      const w = sp.wert ? sp.wert(z) : z[sp.name];
      return el('td', {
        class: sp.zahl ? 'zahl' : '',
        text: w === null || w === undefined ? '' : String(w)
      });
    });
    if (boxen) {
      zellen.unshift(el('td', { class: 'auswahl-spalte' }, checkbox(z, boxen, container, suffix)));
    }
    const tr = el('tr', { class: gesperrt ? 'gesperrt' : '' }, ...zellen);
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
    if (boxen) {
      kk = el('div', {
        class: 'karte listenkarte mit-box' + (gesperrt ? ' gesperrt' : '')
      }, checkbox(z, boxen, container, suffix), text);
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

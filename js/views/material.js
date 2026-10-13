// js/views/material.js
// Reiter Material: Liste mit Suche, Kategorie-Filter und Verfügbar-Spalte.
// Verfügbar = anzahl - Summe mitgenommen + Summe zurueck.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache } from '../cache.js';
import { zeigeListe } from '../ui/table.js';
import { istFalsch } from '../schema.js';

function zahl(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function runden(n) {
  return Math.round(n * 100) / 100;
}

// Pro Material: Summe zurueck minus Summe mitgenommen
function bewegung(ausleihen) {
  const m = {};
  ausleihen.forEach(function (a) {
    const id = String(a.material_id);
    if (a.art === 'mitgenommen') m[id] = (m[id] || 0) - zahl(a.anzahl);
    else if (a.art === 'zurueck') m[id] = (m[id] || 0) + zahl(a.anzahl);
  });
  return m;
}

function zeitText(iso) {
  return new Date(iso).toLocaleString('de-DE');
}

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);

  let daten = { material: [], ausleihe: [] };
  const status = el('p', { class: 'leise', text: 'Lade Daten …' });
  const suche = el('input', {
    class: 'feld', type: 'search', placeholder: 'Suchen …', 'aria-label': 'Suchen'
  });
  const kat = el('select', { class: 'feld', 'aria-label': 'Kategorie' });
  const box = el('div');

  container.append(el('div', { class: 'seite' },
    el('h1', { text: 'Material' }),
    el('div', { class: 'filterzeile' }, suche, kat),
    status,
    box
  ));

  function kategorienAufbauen() {
    const gewaehlt = kat.value;
    const liste = [];
    daten.material.forEach(function (m) {
      const k = String(m.kategorie || '').trim();
      if (k && liste.indexOf(k) < 0) liste.push(k);
    });
    liste.sort(function (a, b) { return a.localeCompare(b, 'de'); });
    leeren(kat);
    kat.append(el('option', { value: '', text: 'Alle Kategorien' }));
    liste.forEach(function (k) { kat.append(el('option', { value: k, text: k })); });
    kat.value = liste.indexOf(gewaehlt) >= 0 ? gewaehlt : '';
  }

  function zeichne() {
    const bew = bewegung(daten.ausleihe);
    const q = suche.value.trim().toLowerCase();
    const k = kat.value;

    const zeilen = daten.material.filter(function (m) {
      if (istFalsch(m.aktiv)) return false;
      if (k && String(m.kategorie || '').trim() !== k) return false;
      if (!q) return true;
      return [m.name, m.kategorie, m.unterkategorie, m.ort, m.notiz]
        .join(' ').toLowerCase().indexOf(q) >= 0;
    }).map(function (m) {
      const v = m.anzahl === '' || m.anzahl === undefined
        ? ''
        : runden(zahl(m.anzahl) + (bew[String(m.id)] || 0));
      return Object.assign({}, m, { _verfuegbar: v });
    });

    zeilen.sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name), 'de');
    });

    zeigeListe(box, zeilen,
      [
        { name: 'name', label: 'Name' },
        { name: 'kategorie', label: 'Kategorie' },
        { name: 'ort', label: 'Ort' },
        { name: 'anzahl', label: 'Anzahl', zahl: true },
        { name: '_verfuegbar', label: 'Verfügbar', zahl: true }
      ],
      function (z) {
        const einheit = z.einheit ? ' ' + z.einheit : '';
        return {
          titel: String(z.name),
          zeilen: [
            [z.kategorie, z.ort].filter(Boolean).join(' · '),
            z._verfuegbar === ''
              ? ''
              : 'Verfügbar: ' + z._verfuegbar + ' von ' + z.anzahl + einheit
          ]
        };
      },
      null,
      daten.material.length ? 'Nichts gefunden.' : 'Noch kein Material eingetragen.'
    );
  }

  function zeigen(neu, meta) {
    daten = neu;
    kategorienAufbauen();
    zeichne();
    status.className = 'leise';
    status.textContent = meta.aktuell
      ? daten.material.length + ' Einträge · Stand ' + zeitText(meta.stand)
      : 'Zwischengespeichert von ' + zeitText(meta.stand) + '. Aktualisiere …';
  }

  async function laden(zuerstCache) {
    try {
      const ok = await ladeMitCache(
        s.gruppe_id + ':material',
        async function () {
          const r = await Promise.all([
            api('list', { tabelle: 'Material' }, s.token),
            api('list', { tabelle: 'Ausleihe' }, s.token)
          ]);
          return { material: r[0].zeilen, ausleihe: r[1].zeilen };
        },
        zeigen,
        zuerstCache
      );
      if (!ok) {
        status.className = 'fehler';
        status.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
      }
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      status.className = 'fehler';
      status.textContent = 'Fehler: ' + e.message;
    }
  }

  suche.addEventListener('input', zeichne);
  kat.addEventListener('change', zeichne);
  ctx.setzeRefresh(function () { return laden(false); });
  await laden(true);
}

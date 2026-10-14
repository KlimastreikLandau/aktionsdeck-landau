// js/views/material-buchen.js
// Fenster zum Ausbuchen und Zurückbuchen: Person und Datum einmal, je Material eine Zeile.
// Schickt alles mit einer Anfrage an die Skript-Aktion "buchen".

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';

function heute() {
  const d = new Date();
  const zz = function (n) { return (n < 10 ? '0' : '') + n; };
  return d.getFullYear() + '-' + zz(d.getMonth() + 1) + '-' + zz(d.getDate());
}

// Leer = 0. Keine Zahl = NaN.
function zuZahl(t) {
  const s = String(t).trim().replace(',', '.');
  if (s === '') return 0;
  const n = Number(s);
  return isNaN(n) ? NaN : n;
}

function infoText(z, aus) {
  const e = z.einheit ? ' ' + z.einheit : '';
  if (aus) {
    if (z._verbrauch) return 'Vorrat: ' + (z._verfuegbar === '' ? 'nicht eingetragen' : z._verfuegbar + e);
    return z._verfuegbar === ''
      ? 'Keine Anzahl eingetragen'
      : 'Verfügbar: ' + z._verfuegbar + ' von ' + z.anzahl + e;
  }
  if (z._verbrauch) return 'Vorrat jetzt: ' + (z._verfuegbar === '' ? '–' : z._verfuegbar + e);
  return 'Draußen: ' + z._draussen + e;
}

// opt: { ctx, token, art ('mitgenommen'|'zurueck'), items (aus mitVerfuegbar),
//        personen, neuLaden() -> Promise, frisch() -> aktuelle Liste aus mitVerfuegbar, onFertig() }
export function zeigeBuchenDialog(opt) {
  const aus = opt.art === 'mitgenommen';
  const fehler = el('p', { class: 'fehler', role: 'alert' });

  const person = el('input', {
    class: 'feld', type: 'text', maxlength: '60', list: 'buch-personen',
    'aria-label': 'Person', placeholder: 'Name'
  });
  person.value = getName();
  const personenListe = el('datalist', { id: 'buch-personen' });
  (opt.personen || []).forEach(function (p) { personenListe.append(el('option', { value: p })); });
  const datum = el('input', { class: 'feld', type: 'date', 'aria-label': 'Datum' });
  datum.value = heute();
  const notiz = el('input', {
    class: 'feld', type: 'text', maxlength: '200', 'aria-label': 'Notiz', placeholder: 'Notiz (freiwillig)'
  });

  const reihen = opt.items.map(function (z) {
    const feld = el('input', {
      class: 'feld mengen-feld', type: 'text', inputmode: 'decimal',
      'aria-label': (aus ? 'Anzahl ' : 'Anzahl zurück ') + String(z.name)
    });
    feld.value = aus ? '1' : (z._verbrauch ? '' : String(z._draussen));

    let defekt = null;
    if (!aus && !z._verbrauch) {
      defekt = el('input', {
        class: 'feld mengen-feld', type: 'text', inputmode: 'decimal',
        'aria-label': 'davon defekt ' + String(z.name), placeholder: '0'
      });
    }
    const felder = el('div', { class: 'buch-felder' },
      el('label', { class: 'buch-feld' },
        el('span', { class: 'leise', text: aus ? 'Anzahl' : (z._verbrauch ? 'Rest zurück' : 'Zurück') }),
        feld
      )
    );
    if (defekt) {
      felder.append(el('label', { class: 'buch-feld' },
        el('span', { class: 'leise', text: 'davon defekt' }), defekt));
    }
    const info = el('span', { class: 'leise', text: infoText(z, aus) });
    const zeile = el('div', { class: 'buch-zeile' },
      el('div', { class: 'buch-text' }, el('strong', { text: String(z.name) }), info),
      felder
    );
    return { z: z, feld: feld, defekt: defekt, info: info, zeile: zeile };
  });

  // Holt die aktuellen Mengen und ändert Anzeige und Prüfung. Eingaben bleiben stehen.
  function aktualisieren() {
    if (!opt.frisch) return;
    const neu = opt.frisch();
    reihen.forEach(function (r) {
      const n = neu.find(function (x) { return String(x.id) === String(r.z.id); });
      if (!n) return;
      r.z = n;
      r.info.textContent = infoText(n, aus);
    });
  }

  const ok = el('button', { class: 'knopf', type: 'submit', text: 'OK' });
  const abbrechen = el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Abbrechen' });

  const form = el('form', { class: 'formular', novalidate: '' },
    el('label', { class: 'formfeld' }, el('span', { class: 'formlabel', text: 'Person *' }), person, personenListe),
    el('div', { class: 'buch-kopf' },
      el('label', { class: 'formfeld' }, el('span', { class: 'formlabel', text: 'Datum' }), datum),
      el('label', { class: 'formfeld' }, el('span', { class: 'formlabel', text: 'Notiz' }), notiz)
    ),
    el('div', { class: 'buch-liste' }, ...reihen.map(function (r) { return r.zeile; })),
    fehler,
    el('div', { class: 'form-knoepfe' }, ok, abbrechen)
  );

  const titel = aus ? 'Ausbuchen' : 'Zurückbuchen';
  const hintergrund = el('div', { class: 'modal' },
    el('div', { class: 'modal-box modal-gross', role: 'dialog', 'aria-modal': 'true', 'aria-label': titel },
      el('h2', { text: titel }),
      !aus
        ? el('p', {
          class: 'leise',
          text: 'Verbrauchsmaterial: trage ein, was übrig ist. Leere Felder werden nicht gebucht. ' +
            'Neu gedruckt? Dann im Material über „Bearbeiten“ die Anzahl erhöhen.'
        })
        : null,
      form
    )
  );

  function zu() { hintergrund.remove(); }
  abbrechen.addEventListener('click', zu);
  hintergrund.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') zu(); });

  function meldung(text, feld) {
    fehler.textContent = text;
    if (feld) feld.focus();
  }

  form.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    fehler.textContent = '';
    const name = person.value.trim();
    if (!name) { meldung('Bitte eine Person angeben.', person); return; }

    const positionen = [];
    for (let i = 0; i < reihen.length; i++) {
      const r = reihen[i];
      const z = r.z;
      const n = zuZahl(r.feld.value);
      const d = r.defekt ? zuZahl(r.defekt.value) : 0;
      const nm = '„' + String(z.name) + '“';
      if (isNaN(n) || n < 0) { meldung(nm + ': Die Anzahl muss eine Zahl sein.', r.feld); return; }
      if (isNaN(d) || d < 0) { meldung(nm + ': „davon defekt“ muss eine Zahl sein.', r.defekt); return; }
      if (n === 0) {
        if (d > 0) { meldung(nm + ': „davon defekt“ ist größer als die Anzahl.', r.defekt); return; }
        continue;
      }
      if (aus && z._verfuegbar !== '' && n > z._verfuegbar) {
        meldung('Von ' + nm + ' sind nur ' + z._verfuegbar + ' verfügbar.', r.feld);
        return;
      }
      if (!aus && !z._verbrauch && n > z._draussen) {
        meldung('Von ' + nm + ' sind nur ' + z._draussen + ' ausgeliehen.', r.feld);
        return;
      }
      if (d > n) { meldung(nm + ': „davon defekt“ ist größer als die Anzahl.', r.defekt); return; }
      positionen.push({ material_id: z.id, anzahl: n, defekt: d > 0 ? d : '' });
    }
    if (!positionen.length) {
      meldung('Bitte bei mindestens einem Material eine Anzahl eintragen.', reihen[0].feld);
      return;
    }

    ok.disabled = true;
    ok.textContent = 'Buche …';
    try {
      await api('buchen', {
        art: opt.art,
        person: name,
        datum: datum.value,
        notiz: notiz.value.trim(),
        positionen: positionen
      }, opt.token);
    } catch (e) {
      if (opt.ctx.behandleFehler(e)) { zu(); return; }
      let text = e.message;
      if (e.code === 'zuwenig') {
        try { await opt.neuLaden(); } catch (x) { /* ignorieren */ }
        aktualisieren();
        text += ' Vielleicht hat jemand gerade gebucht. Die Mengen im Fenster sind jetzt aktuell.';
      }
      fehler.textContent = text;
      ok.disabled = false;
      ok.textContent = 'OK';
      return;
    }
    zu();
    const k = positionen.length;
    const was = k === 1 ? '1 Material' : k + ' Materialien';
    toast(was + (aus ? ' ausgebucht.' : ' zurückgebucht.'));
    await opt.onFertig();
  });

  document.body.append(hintergrund);
  (person.value ? reihen[0].feld : person).focus();
}

// js/views/material-ausleihe.js
// Formular zum Mitnehmen und Zurückgeben. Hängt eine Zeile an den Tab Ausleihe an.

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';
import { zahl, runden } from './material-rechnen.js';

const FELDER = [
  { name: 'anzahl', label: 'Anzahl', typ: 'zahl', pflicht: true },
  { name: 'person', label: 'Person', typ: 'text', pflicht: true },
  { name: 'datum', label: 'Datum', typ: 'datum' },
  { name: 'notiz', label: 'Notiz', typ: 'langtext' }
];

function heute() {
  const d = new Date();
  const zweistellig = function (n) { return (n < 10 ? '0' : '') + n; };
  return d.getFullYear() + '-' + zweistellig(d.getMonth() + 1) + '-' + zweistellig(d.getDate());
}

// Namen aus früheren Buchungen (für die Vorschläge), plus dein eigener Name
export function personenAus(ausleihen) {
  const liste = [];
  const merke = function (p) {
    const t = String(p || '').trim();
    if (t && liste.indexOf(t) < 0) liste.push(t);
  };
  merke(getName());
  ausleihen.forEach(function (a) { merke(a.person); });
  liste.sort(function (a, b) { return a.localeCompare(b, 'de'); });
  return liste;
}

// opt: { ctx, token, m, art ('mitgenommen'|'zurueck'), verfuegbar, personen, onFertig(), onAbbrechen() }
export function baueAusleiheForm(opt) {
  const m = opt.m;
  const art = opt.art;
  const verf = opt.verfuegbar;
  const hatAnzahl = verf !== '' && verf !== undefined;
  const einheit = m.einheit ? ' ' + m.einheit : '';

  async function speichern(d) {
    const n = Number(String(d.anzahl).replace(',', '.'));
    if (!(n > 0)) throw new Error('Die Anzahl muss größer als 0 sein.');
    if (hatAnzahl) {
      if (art === 'mitgenommen' && n > verf) {
        throw new Error('Es sind nur ' + verf + einheit + ' verfügbar.');
      }
      const draussen = runden(zahl(m.anzahl) - verf);
      if (art === 'zurueck' && n > draussen) {
        throw new Error('Es sind nur ' + draussen + einheit + ' ausgeliehen.');
      }
    }
    try {
      await api('create', {
        tabelle: 'Ausleihe',
        daten: {
          material_id: m.id,
          art: art,
          anzahl: n,
          person: d.person,
          datum: d.datum,
          notiz: d.notiz
        }
      }, opt.token);
    } catch (e) {
      if (opt.ctx.behandleFehler(e)) return;
      throw e;
    }
    toast(art === 'mitgenommen' ? 'Mitnahme gespeichert.' : 'Rückgabe gespeichert.');
    await opt.onFertig();
  }

  const form = baueFormular(FELDER, { person: getName(), datum: heute() }, {
    speichernText: art === 'mitgenommen' ? 'Mitnehmen' : 'Zurückgeben',
    vorschlaege: { person: opt.personen || [] },
    onSpeichern: speichern,
    onAbbrechen: opt.onAbbrechen
  });

  const hinweis = hatAnzahl
    ? 'Verfügbar: ' + verf + ' von ' + m.anzahl + einheit
    : 'Für dieses Material ist keine Anzahl eingetragen.';
  return el('div', null, el('p', { class: 'leise', text: hinweis }), form);
}

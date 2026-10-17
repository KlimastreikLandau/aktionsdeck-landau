// js/views/start-brett.js
// Schwarzes Brett auf dem Start: Mitteilungen der Gruppe (z. B. Plenumszeit).
// Wichtige lassen sich oben anheften. Tab Mitteilungen: titel, text, angeheftet.
// opt: { ctx, token, mitteilungen, neuLaden() -> Promise }

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { SCHEMA, istWahr } from '../schema.js';
import { datumText } from './todos-rechnen.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function neuesteZuerst(a, b) {
  return String(b.erstellt_am || '').localeCompare(String(a.erstellt_am || ''));
}

async function anheften(m, wert, opt) {
  try {
    await api('update', { tabelle: 'Mitteilungen', id: m.id, daten: { angeheftet: wert } }, opt.token);
    toast(wert ? 'Oben angeheftet.' : 'Nicht mehr angeheftet.');
    await opt.neuLaden();
  } catch (e) {
    if (opt.ctx.behandleFehler(e)) return;
    toast(e.message);
  }
}

// ---- Anlegen, Ändern, Löschen (m = null heißt neu) ----

function formZeigen(m, opt) {
  let fenster = null;
  const form = baueFormular(SCHEMA.Mitteilungen.felder, m || { angeheftet: true }, {
    speichernText: m ? 'Speichern' : 'Veröffentlichen',
    onSpeichern: function (d) { return speichern(m, d, fenster, opt); },
    onAbbrechen: function () { fenster.schliessen(); }
  });
  const inhalt = el('div', null, form);
  if (m) {
    inhalt.append(el('div', { class: 'fenster-loeschen' },
      el('button', {
        class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen',
        onclick: function () { loeschen(m, fenster, opt); }
      })
    ));
  }
  fenster = zeigeFenster(m ? 'Mitteilung bearbeiten' : 'Neue Mitteilung', inhalt);
}

async function speichern(m, d, fenster, opt) {
  try {
    if (!m) {
      await api('create', { tabelle: 'Mitteilungen', daten: d }, opt.token);
      toast('Mitteilung veröffentlicht.');
    } else {
      const r = await api('update', {
        tabelle: 'Mitteilungen', id: m.id, daten: d, bekannt: m.geaendert_am
      }, opt.token);
      toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
    }
    fenster.schliessen();
    await opt.neuLaden();
  } catch (e) {
    if (opt.ctx.behandleFehler(e)) return;
    if (e.code === 'konflikt' || e.code === 'nicht_gefunden') {
      opt.neuLaden();
      throw new Error('Jemand anderes hat diese Mitteilung gerade geändert oder gelöscht. ' +
        'Klicke auf „Abbrechen“ und öffne sie noch einmal.');
    }
    throw e;
  }
}

async function loeschen(m, fenster, opt) {
  if (!window.confirm('Diese Mitteilung wirklich löschen?\n\n„' + txt(m.titel) + '“')) return;
  try {
    await api('delete', { tabelle: 'Mitteilungen', id: m.id, bekannt: m.geaendert_am }, opt.token);
    fenster.schliessen();
    toast('Gelöscht.');
    await opt.neuLaden();
  } catch (e) {
    if (opt.ctx.behandleFehler(e)) return;
    if (e.code === 'konflikt') {
      toast('Jemand anderes hat dies gerade geändert. Bitte neu öffnen.');
      opt.neuLaden();
    } else {
      toast(e.message);
    }
  }
}

// ---- Zeichnen ----

function mitteilung(m, opt) {
  const fest = istWahr(m.angeheftet);
  const wer = [txt(m.erstellt_von), m.erstellt_am ? datumText(m.erstellt_am) : '']
    .filter(Boolean).join(' · ');
  return el('div', { class: 'mitteilung' + (fest ? ' angeheftet' : '') },
    el('div', { class: 'mitteilung-kopf' },
      el('div', { class: 'umfrage-titel' },
        el('strong', { text: (fest ? '📌 ' : '') + txt(m.titel) }),
        el('span', { class: 'leise', text: wer })
      ),
      el('div', { class: 'hut-knoepfe' },
        el('button', {
          class: 'knopf knopf-hell knopf-klein', type: 'button',
          text: fest ? 'Lösen' : 'Anheften',
          onclick: function () { anheften(m, !fest, opt); }
        }),
        el('button', {
          class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Bearbeiten',
          onclick: function () { formZeigen(m, opt); }
        })
      )
    ),
    txt(m.text) ? el('p', { class: 'notiz', text: txt(m.text) }) : null
  );
}

export function zeichneBrett(box, opt) {
  leeren(box);
  const fest = opt.mitteilungen.filter(function (m) { return istWahr(m.angeheftet); }).sort(neuesteZuerst);
  const normal = opt.mitteilungen.filter(function (m) { return !istWahr(m.angeheftet); }).sort(neuesteZuerst);

  box.hidden = !fest.length && !normal.length;
  if (box.hidden) return;

  const karte = el('section', { class: 'karte dash-kachel' },
    el('div', { class: 'dash-kachel-titel' },
      el('h2', { text: 'Schwarzes Brett' })
    )
  );
  fest.forEach(function (m) { karte.append(mitteilung(m, opt)); });

  // Nicht angeheftete stehen nur im zugeklappten Aufklapper
  const rest = normal;
  if (rest.length) {
    const d = el('details', { class: 'projekt-teil' });
    d.append(
      el('summary', null,
        el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
        el('strong', { text: 'Nicht angeheftet' }),
        el('span', { class: 'leise', text: String(rest.length) })
      ),
      el('div', { class: 'projekt-teil-body' },
        ...rest.map(function (m) { return mitteilung(m, opt); })
      )
    );
    karte.append(d);
  }
  box.append(karte);
}

// Für den Knopf oben auf dem Start
export function neueMitteilung(opt) {
  formZeigen(null, opt);
}

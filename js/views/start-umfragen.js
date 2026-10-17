// js/views/start-umfragen.js
// Umfragen ganz oben auf dem Start: Frage, Antworten, Ablaufdatum, Ergebnis.
// Jede Person (nach Anzeigename) hat eine Stimme und kann sie ändern, solange die Umfrage läuft.
// Tabs: Umfragen (frage, optionen, ablauf_am, mehrfach), Umfrage_Antworten (umfrage_id, person, auswahl).
// opt: { ctx, token, umfragen, antworten, neuLaden() -> Promise }

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { fortschrittsBalken } from '../ui/balken.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';
import { SCHEMA, istWahr } from '../schema.js';
import { normDatum, datumText, heuteIso } from './todos-rechnen.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function optionenVon(u) {
  return txt(u.optionen === undefined ? '' : u.optionen === null ? '' : String(u.optionen))
    .split('\n')
    .map(function (t) { return t.trim(); })
    .filter(Boolean);
}

// Am Tag des Ablaufdatums kann man noch abstimmen
function beendet(u) {
  const d = normDatum(u.ablauf_am);
  return !!d && d < heuteIso();
}

// "0,2" -> [0, 2]
function auswahlVon(a) {
  return String(a.auswahl === undefined || a.auswahl === null ? '' : a.auswahl)
    .split(',')
    .map(function (t) { return t.trim(); })
    .filter(function (t) { return t !== ''; })
    .map(Number)
    .filter(function (n) { return !isNaN(n); });
}

// Laufende: bald ablaufende zuerst, ohne Datum zuletzt
function nachAblauf(a, b) {
  const da = normDatum(a.ablauf_am);
  const db = normDatum(b.ablauf_am);
  if (da !== db) {
    if (!da) return 1;
    if (!db) return -1;
    return da < db ? -1 : 1;
  }
  return String(b.erstellt_am || '').localeCompare(String(a.erstellt_am || ''));
}

function meineStimme(u, antworten) {
  const n = txt(getName()).toLowerCase();
  if (!n) return null;
  return antworten.find(function (a) {
    return String(a.umfrage_id) === String(u.id) && txt(a.person).toLowerCase() === n;
  }) || null;
}

function umfrageBlock(u, opt) {
  const optionen = optionenVon(u);
  const aus = beendet(u);
  const mehrfach = istWahr(u.mehrfach);
  const alle = opt.antworten.filter(function (a) { return String(a.umfrage_id) === String(u.id); });
  const zaehler = optionen.map(function () { return 0; });
  alle.forEach(function (a) {
    auswahlVon(a).forEach(function (i) {
      if (i >= 0 && i < zaehler.length) zaehler[i] += 1;
    });
  });
  const personen = alle.length;
  const mein = meineStimme(u, opt.antworten);
  const meine = mein ? auswahlVon(mein) : [];
  const eingaben = [];
  const fehler = el('p', { class: 'fehler', role: 'alert' });
  const abstimmen = el('button', {
    class: 'knopf', type: 'button', text: mein ? 'Stimme ändern' : 'Abstimmen'
  });

  const reihen = optionen.map(function (text, i) {
    const p = personen ? Math.round(zaehler[i] * 100 / personen) : 0;
    const balken = fortschrittsBalken(
      p, zaehler[i] + (zaehler[i] === 1 ? ' Stimme' : ' Stimmen') + ' · ' + p + ' %'
    );
    let zeile;
    if (aus) {
      zeile = el('div', { class: 'umfrage-option-zeile' },
        el('span', { text: (meine.indexOf(i) >= 0 ? '✔ ' : '') + text }));
    } else {
      const inp = el('input', {
        type: mehrfach ? 'checkbox' : 'radio',
        name: 'umfrage-' + u.id,
        class: 'auswahl-box',
        'aria-label': text
      });
      inp.checked = meine.indexOf(i) >= 0;
      eingaben.push({ i: i, inp: inp });
      zeile = el('label', { class: 'umfrage-option-zeile' }, inp, el('span', { text: text }));
    }
    return el('div', { class: 'umfrage-option' }, zeile, balken);
  });

  abstimmen.addEventListener('click', async function () {
    fehler.textContent = '';
    const gewaehlt = eingaben.filter(function (e) { return e.inp.checked; })
      .map(function (e) { return e.i; });
    if (!gewaehlt.length) {
      fehler.textContent = 'Bitte eine Antwort auswählen.';
      return;
    }
    abstimmen.disabled = true;
    const wert = gewaehlt.join(',');
    try {
      if (mein) {
        await api('update', {
          tabelle: 'Umfrage_Antworten', id: mein.id, daten: { auswahl: wert }
        }, opt.token);
      } else {
        await api('create', {
          tabelle: 'Umfrage_Antworten',
          daten: { umfrage_id: String(u.id), person: getName() || 'unbekannt', auswahl: wert }
        }, opt.token);
      }
      toast('Deine Stimme ist gespeichert.');
      await opt.neuLaden();
    } catch (e) {
      if (opt.ctx.behandleFehler(e)) return;
      fehler.textContent = e.message;
    }
    abstimmen.disabled = false;
  });

  const meta = [
    mehrfach ? 'Mehrere Antworten möglich' : 'Eine Antwort',
    u.ablauf_am ? (aus ? 'Beendet am ' : 'Läuft bis ') + datumText(u.ablauf_am) : 'Ohne Ablaufdatum',
    personen + (personen === 1 ? ' Person' : ' Personen') + ' abgestimmt'
  ].join(' · ');

  return el('div', { class: 'umfrage' },
    el('div', { class: 'umfrage-kopf' },
      el('div', { class: 'umfrage-titel' },
        el('strong', { text: txt(u.frage) }),
        el('span', { class: 'leise', text: meta })
      ),
      el('button', {
        class: 'knopf knopf-hell knopf-klein', type: 'button', text: 'Bearbeiten',
        onclick: function () { formZeigen(u, opt); }
      })
    ),
    ...reihen,
    aus ? null : el('div', { class: 'form-knoepfe' }, abstimmen),
    fehler
  );
}

// ---- Anlegen, Ändern, Löschen (u = null heißt neu) ----

function formZeigen(u, opt) {
  let fenster = null;
  const hatStimmen = !!u && opt.antworten.some(function (a) {
    return String(a.umfrage_id) === String(u.id);
  });
  // Schon abgestimmt: die Antworten bleiben fest (sonst stimmen die Nummern nicht mehr)
  const felder = SCHEMA.Umfragen.felder.filter(function (f) {
    return !(hatStimmen && f.name === 'optionen');
  });
  const form = baueFormular(felder, u || { mehrfach: false }, {
    speichernText: u ? 'Speichern' : 'Anlegen',
    onSpeichern: function (d) { return speichern(u, d, fenster, opt); },
    onAbbrechen: function () { fenster.schliessen(); }
  });
  const inhalt = el('div', null, form);
  if (hatStimmen) {
    inhalt.prepend(el('p', {
      class: 'leise',
      text: 'Es wurde schon abgestimmt. Die Antworten lassen sich nicht mehr ändern.'
    }));
  }
  if (u) {
    inhalt.append(el('div', { class: 'fenster-loeschen' },
      el('button', {
        class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen',
        onclick: function () { loeschen(u, fenster, opt); }
      })
    ));
  }
  fenster = zeigeFenster(u ? 'Umfrage bearbeiten' : 'Neue Umfrage', inhalt);
}

async function speichern(u, d, fenster, opt) {
  if (d.optionen !== undefined) {
    const n = String(d.optionen).split('\n')
      .map(function (t) { return t.trim(); }).filter(Boolean).length;
    if (n < 2) throw new Error('Bitte mindestens zwei Antworten eintragen (eine pro Zeile).');
    if (n > 10) throw new Error('Bitte höchstens 10 Antworten eintragen.');
  }
  try {
    if (!u) {
      await api('create', { tabelle: 'Umfragen', daten: d }, opt.token);
      toast('Umfrage angelegt.');
    } else {
      const r = await api('update', {
        tabelle: 'Umfragen', id: u.id, daten: d, bekannt: u.geaendert_am
      }, opt.token);
      toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
    }
    fenster.schliessen();
    await opt.neuLaden();
  } catch (e) {
    if (opt.ctx.behandleFehler(e)) return;
    if (e.code === 'konflikt' || e.code === 'nicht_gefunden') {
      opt.neuLaden();
      throw new Error('Diese Umfrage wurde gerade geändert oder gelöscht. ' +
        'Klicke auf „Abbrechen“ und öffne sie noch einmal.');
    }
    throw e;
  }
}

async function loeschen(u, fenster, opt) {
  if (!window.confirm('Diese Umfrage wirklich löschen?\n\n„' + txt(u.frage) + '“')) return;
  try {
    await api('delete', { tabelle: 'Umfragen', id: u.id, bekannt: u.geaendert_am }, opt.token);
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

export function zeichneUmfragen(box, opt) {
  leeren(box);
  const laufend = opt.umfragen.filter(function (u) { return !beendet(u); }).sort(nachAblauf);
  const fertig = opt.umfragen.filter(beendet).sort(nachAblauf).reverse().slice(0, 10);

  const karte = el('section', { class: 'karte dash-kachel' },
    el('div', { class: 'dash-kachel-titel' },
      el('h2', { text: 'Umfragen' }),
      el('button', {
        class: 'knopf knopf-hell', type: 'button', text: '+ Neue Umfrage',
        onclick: function () { formZeigen(null, opt); }
      })
    )
  );
  if (!laufend.length) karte.append(el('p', { class: 'leise', text: 'Keine Umfrage offen.' }));
  laufend.forEach(function (u) { karte.append(umfrageBlock(u, opt)); });

  if (fertig.length) {
    const d = el('details', { class: 'projekt-teil' });
    d.append(
      el('summary', null,
        el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
        el('strong', { text: 'Beendete Umfragen' }),
        el('span', { class: 'leise', text: String(fertig.length) })
      ),
      el('div', { class: 'projekt-teil-body' },
        ...fertig.map(function (u) { return umfrageBlock(u, opt); })
      )
    );
    karte.append(d);
  }
  box.append(karte);
}

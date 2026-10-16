// js/views/projekt-todos.js
// Teil "ToDos" eines Projekts: Zählzeile, Meilensteine mit Balken, ToDos darunter, Anlegen/Ändern/Löschen.
// Zeigt ALLE ToDos des Projekts (kein 14-Tage-Archiv). Erledigte sind grau und durchgestrichen.
// "+ Meilenstein" bietet zuerst Vorlagen an (js/vorlagen.js). Die ToDos der Vorlage können abgewählt werden.
// Wird von projekte.js benutzt. Der Teil klappt auf und zu (Zustand liegt in projekte.js).
//
// opt: { ctx, token, projekt, holeDaten() -> { todos, meilensteine }, arbeitet (Objekt),
//        offen (Teil aufgeklappt?), beiToggle(offen), neuZeichnen(), neuLaden() -> Promise, merken() }

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { fortschrittsBalken } from '../ui/balken.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';
import { SCHEMA, istWahr } from '../schema.js';
import { VORLAGEN, faelligAus } from '../vorlagen.js';
import { abhakWerte, abhakenSpeichern } from './todos-abhaken.js';
import {
  kurz, faelligStatus, faelligText, prioText, sortieren, zahlenText, datumText
} from './todos-rechnen.js';
import {
  fortschritt, meilensteinStand, sortiereMeilensteine, meilensteinFaellig
} from './projekt-rechnen.js';

export function baueTodoTeil(opt) {
  const ctx = opt.ctx;
  const token = opt.token;
  const pid = String(opt.projekt.id);

  function daten() { return opt.holeDaten(); }

  const alle = daten().todos.filter(function (t) {
    return String(t.projekt_id || '').trim() === pid;
  });
  const ms = sortiereMeilensteine(daten().meilensteine.filter(function (m) {
    return String(m.projekt_id || '').trim() === pid;
  }));
  const f = fortschritt(pid, daten().todos);

  // ---- Hilfen ----

  function personen() {
    const liste = [];
    const merke = function (n) {
      const k = String(n || '').trim();
      if (k && liste.indexOf(k) < 0) liste.push(k);
    };
    merke(getName());
    alle.forEach(function (t) { merke(t.verantwortlich); });
    ms.forEach(function (m) { merke(m.verantwortlich); });
    liste.sort(function (a, b) { return a.localeCompare(b, 'de'); });
    return liste;
  }

  // Macht aus einem Server-Fehler den Text fürs Formular
  function fehlerFuer(e) {
    if (e.code === 'konflikt') {
      opt.neuLaden();
      return new Error('Jemand anderes hat diesen Eintrag gerade geändert. ' +
        'Klicke auf „Abbrechen“ und öffne ihn noch einmal.');
    }
    if (e.code === 'nicht_gefunden') {
      opt.neuLaden();
      return new Error('Diesen Eintrag gibt es nicht mehr. Klicke auf „Abbrechen“.');
    }
    return e;
  }

  function fensterMitLoeschen(titel, form, loeschen) {
    const inhalt = el('div', null, form);
    if (loeschen) {
      inhalt.append(el('div', { class: 'fenster-loeschen' },
        el('button', { class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen', onclick: loeschen })
      ));
    }
    return zeigeFenster(titel, inhalt);
  }

  // ---- ToDo abhaken (ohne Konfliktprüfung) ----

  async function abhaken(t, wert) {
    const id = String(t.id);
    if (opt.arbeitet[id]) return;
    opt.arbeitet[id] = true;

    const alt = { erledigt: t.erledigt, erledigt_am: t.erledigt_am, erledigt_von: t.erledigt_von };
    const neu = abhakWerte(wert);
    Object.assign(t, neu);
    opt.neuZeichnen();

    let nachladen = false;
    try {
      const eintrag = await abhakenSpeichern(token, t.id, neu);
      const liste = daten().todos;
      const i = liste.findIndex(function (x) { return String(x.id) === id; });
      if (i >= 0 && eintrag) liste[i] = eintrag;
      opt.merken();
    } catch (e) {
      Object.assign(t, alt);
      if (!ctx.behandleFehler(e)) {
        if (e.code === 'nicht_gefunden') {
          toast('Dieses ToDo gibt es nicht mehr.');
          nachladen = true;
        } else {
          toast(e.message);
        }
      }
    }
    delete opt.arbeitet[id];
    opt.neuZeichnen();
    if (nachladen) opt.neuLaden();
  }

  // ---- Meilenstein abhaken (nur wenn er keine ToDos hat) ----

  async function meilensteinAbhaken(m, wert) {
    const id = 'm' + String(m.id);
    if (opt.arbeitet[id]) return;
    opt.arbeitet[id] = true;

    const alt = m.erledigt;
    m.erledigt = wert;
    opt.neuZeichnen();

    let nachladen = false;
    try {
      const r = await api('update', {
        tabelle: 'Meilensteine', id: m.id, daten: { erledigt: wert }
      }, token);
      const liste = daten().meilensteine;
      const i = liste.findIndex(function (x) { return String(x.id) === String(m.id); });
      if (i >= 0 && r && r.eintrag) liste[i] = r.eintrag;
      opt.merken();
    } catch (e) {
      m.erledigt = alt;
      if (!ctx.behandleFehler(e)) {
        if (e.code === 'nicht_gefunden') {
          toast('Diesen Meilenstein gibt es nicht mehr.');
          nachladen = true;
        } else {
          toast(e.message);
        }
      }
    }
    delete opt.arbeitet[id];
    opt.neuZeichnen();
    if (nachladen) opt.neuLaden();
  }

  // ---- ToDo: Formular (t = null heißt neu, mid = vorgewählter Meilenstein) ----

  function todoFormZeigen(t, mid) {
    let fenster = null;
    const felder = SCHEMA.ToDos.felder.slice();
    if (ms.length) {
      // Nach "Weitere Informationen" einfügen
      felder.splice(2, 0, {
        name: 'meilenstein_id',
        label: 'Meilenstein',
        typ: 'auswahl',
        optionen: ms.map(function (m) { return { wert: String(m.id), label: String(m.titel) }; })
      });
    }
    const form = baueFormular(felder, t || { prioritaet: 'normal', meilenstein_id: mid || '' }, {
      speichernText: t ? 'Speichern' : 'Anlegen',
      vorschlaege: { verantwortlich: personen() },
      onSpeichern: function (d) { return todoSpeichern(t, d, fenster); },
      onAbbrechen: function () { fenster.schliessen(); }
    });
    fenster = fensterMitLoeschen(
      t ? 'ToDo bearbeiten' : 'Neues ToDo',
      form,
      t ? function () { todoLoeschen(t, fenster); } : null
    );
  }

  async function todoSpeichern(t, d, fenster) {
    d.projekt_id = pid;
    try {
      if (!t) {
        await api('create', { tabelle: 'ToDos', daten: d }, token);
        fenster.schliessen();
        toast('ToDo angelegt.');
      } else {
        const r = await api('update', {
          tabelle: 'ToDos', id: t.id, daten: d, bekannt: t.geaendert_am
        }, token);
        fenster.schliessen();
        toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      }
      opt.beiToggle(true);
      await opt.neuLaden();
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      throw fehlerFuer(e);
    }
  }

  async function todoLoeschen(t, fenster) {
    const frage = 'Dieses ToDo wirklich löschen?\n\n„' + kurz(t.text, 80) + '“';
    if (!window.confirm(frage)) return;
    try {
      await api('delete', { tabelle: 'ToDos', id: t.id, bekannt: t.geaendert_am }, token);
      fenster.schliessen();
      toast('Gelöscht.');
      await opt.neuLaden();
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        toast('Jemand anderes hat dies gerade geändert. Bitte neu öffnen.');
        opt.neuLaden();
      } else {
        toast(e.message);
      }
    }
  }

  // ---- Meilenstein: Vorlagenwahl (erster Schritt bei "+ Meilenstein") ----

  function vorlagenWahlZeigen() {
    let fenster = null;
    const knoepfe = el('div', { class: 'mehr-knoepfe' },
      el('button', {
        class: 'knopf', type: 'button', text: 'Ohne Vorlage',
        onclick: function () { fenster.schliessen(); meilensteinFormZeigen(null, null); }
      })
    );
    VORLAGEN.forEach(function (v) {
      knoepfe.append(el('button', {
        class: 'knopf knopf-hell', type: 'button',
        text: v.name + ' (' + v.schritte.length + ' ToDos)',
        onclick: function () { fenster.schliessen(); meilensteinFormZeigen(null, v); }
      }));
    });
    knoepfe.append(el('button', {
      class: 'knopf knopf-hell', type: 'button', text: 'Abbrechen',
      onclick: function () { fenster.schliessen(); }
    }));
    fenster = zeigeFenster('Neuer Meilenstein', el('div', null,
      el('p', {
        class: 'leise',
        text: 'Wähle eine Vorlage oder starte leer. Die ToDos der Vorlage kannst du im nächsten Schritt abwählen.'
      }),
      knoepfe
    ));
  }

  // Häkchenliste mit den ToDos der Vorlage. Fristen werden aus dem Datum des Meilensteins gerechnet.
  function vorlagenAuswahl(vorlage, datumFeld) {
    const zeilen = vorlage.schritte.map(function (sch) {
      const cb = el('input', { type: 'checkbox', class: 'auswahl-box', 'aria-label': sch.text });
      cb.checked = true;
      const frist = el('span', { class: 'leise' });
      const zeile = el('label', { class: 'vorlage-zeile' },
        cb,
        el('span', { class: 'vorlage-text' }, el('strong', { text: sch.text }), frist)
      );
      return { sch: sch, cb: cb, frist: frist, zeile: zeile };
    });

    function fristen() {
      const d = datumFeld ? datumFeld.value : '';
      zeilen.forEach(function (z) {
        const fa = faelligAus(d, z.sch.tage_vorher);
        z.frist.textContent = fa ? 'Fällig ' + datumText(fa) : 'Ohne Fälligkeit (trage oben ein Datum ein)';
      });
    }
    if (datumFeld) {
      datumFeld.addEventListener('input', fristen);
      datumFeld.addEventListener('change', fristen);
    }
    fristen();

    const knoten = el('div', { class: 'vorlage-liste' },
      el('p', {
        class: 'leise',
        text: 'ToDos aus der Vorlage „' + vorlage.name + '“. Haken weg = dieses ToDo wird nicht angelegt. ' +
          'Die Fälligkeit wird vom Datum des Meilensteins zurückgerechnet.'
      }),
      ...zeilen.map(function (z) { return z.zeile; })
    );

    return {
      knoten: knoten,
      gewaehlt: function () {
        return zeilen.filter(function (z) { return z.cb.checked; })
          .map(function (z) { return z.sch; });
      }
    };
  }

  // ---- Meilenstein: Formular (m = null heißt neu, vorlage = gewählte Vorlage oder null) ----

  function meilensteinFormZeigen(m, vorlage) {
    let fenster = null;
    let auswahl = null;
    const start = m || (vorlage ? { titel: vorlage.name } : {});
    const form = baueFormular(SCHEMA.Meilensteine.felder, start, {
      speichernText: m ? 'Speichern' : (vorlage ? 'Anlegen mit ToDos' : 'Anlegen'),
      vorschlaege: { verantwortlich: personen() },
      onSpeichern: function (d) { return meilensteinSpeichern(m, d, fenster, auswahl); },
      onAbbrechen: function () { fenster.schliessen(); }
    });
    if (!m && vorlage) {
      auswahl = vorlagenAuswahl(vorlage, form.querySelector('input[name="datum"]'));
      form.insertBefore(auswahl.knoten, form.querySelector('p.fehler'));
    }
    fenster = fensterMitLoeschen(
      m ? 'Meilenstein bearbeiten' : (vorlage ? 'Neuer Meilenstein: ' + vorlage.name : 'Neuer Meilenstein'),
      form,
      m ? function () { meilensteinLoeschen(m, fenster); } : null
    );
  }

  async function meilensteinSpeichern(m, d, fenster, auswahl) {
    d.projekt_id = pid;
    try {
      if (!m) {
        const o = await api('create', { tabelle: 'Meilensteine', daten: d }, token);
        const schritte = auswahl ? auswahl.gewaehlt() : [];
        if (schritte.length) {
          const liste = schritte.map(function (sch) {
            return {
              projekt_id: pid,
              meilenstein_id: String(o.id),
              text: sch.text,
              details: sch.details || '',
              faellig_am: faelligAus(d.datum, sch.tage_vorher),
              prioritaet: 'normal'
            };
          });
          try {
            await api('batchCreate', { tabelle: 'ToDos', liste: liste }, token);
          } catch (e2) {
            // Der Meilenstein steht schon. Nicht noch einmal anlegen lassen.
            fenster.schliessen();
            opt.beiToggle(true);
            if (ctx.behandleFehler(e2)) return;
            toast('Meilenstein angelegt, aber die ToDos nicht: ' + e2.message);
            await opt.neuLaden();
            return;
          }
        }
        fenster.schliessen();
        toast(schritte.length
          ? 'Meilenstein mit ' + schritte.length + ' ToDos angelegt.'
          : 'Meilenstein angelegt.');
      } else {
        const r = await api('update', {
          tabelle: 'Meilensteine', id: m.id, daten: d, bekannt: m.geaendert_am
        }, token);
        fenster.schliessen();
        toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      }
      opt.beiToggle(true);
      await opt.neuLaden();
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      throw fehlerFuer(e);
    }
  }

  async function meilensteinLoeschen(m, fenster) {
    const n = alle.filter(function (t) {
      return String(t.meilenstein_id || '').trim() === String(m.id);
    }).length;
    const frage = 'Meilenstein „' + String(m.titel) + '“ wirklich löschen?\n\n' +
      (n
        ? n + ' ToDos bleiben erhalten und stehen danach unter „Ohne Meilenstein“.'
        : 'Es gehören keine ToDos dazu.');
    if (!window.confirm(frage)) return;
    try {
      await api('delete', { tabelle: 'Meilensteine', id: m.id, bekannt: m.geaendert_am }, token);
      fenster.schliessen();
      toast('Meilenstein gelöscht.');
      await opt.neuLaden();
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        toast('Jemand anderes hat dies gerade geändert. Bitte neu öffnen.');
        opt.neuLaden();
      } else {
        toast(e.message);
      }
    }
  }

  // ---- Zeichnen ----

  function todoZeile(t) {
    const fertig = istWahr(t.erledigt);
    const klassen = ['dash-todo', 'pt-todo'];
    if (fertig) klassen.push('erledigt');
    const st = faelligStatus(t);
    if (st) klassen.push(st);
    const info = [
      t.verantwortlich,
      t.faellig_am ? 'Fällig ' + faelligText(t) : '',
      prioText(t.prioritaet)
    ].filter(Boolean).join(' · ');

    const cb = el('input', {
      type: 'checkbox',
      class: 'auswahl-box',
      'aria-label': kurz(t.text, 60) + ' erledigt'
    });
    cb.checked = fertig;
    cb.addEventListener('change', function () { abhaken(t, cb.checked); });

    const knopf = el('button', {
      class: klassen.join(' '), type: 'button',
      onclick: function () { todoFormZeigen(t, ''); }
    },
      el('strong', { text: kurz(t.text, 90) }),
      info ? el('span', { class: 'leise', text: info }) : null,
      t.details ? el('span', { class: 'leise', text: kurz(t.details, 100) }) : null
    );
    return el('li', { class: 'dash-zeile' + (fertig ? ' erledigt' : '') }, cb, knopf);
  }

  function todoListe(liste) {
    return el('ul', { class: 'dash-todo-liste' }, ...sortieren(liste).map(todoZeile));
  }

  function meilensteinBlock(m) {
    const mt = alle.filter(function (t) {
      return String(t.meilenstein_id || '').trim() === String(m.id);
    });
    const st = meilensteinStand(m, alle);
    const fk = st.erreicht ? '' : meilensteinFaellig(m);
    const info = [
      m.datum ? 'Bis ' + datumText(m.datum) +
        (fk === 'ueberfaellig' ? ' (überfällig)' : fk === 'heute' ? ' (heute)' : '') : '',
      m.verantwortlich,
      st.erreicht ? 'Erreicht' : ''
    ].filter(Boolean).join(' · ');

    const kopf = el('div', { class: 'meilenstein-kopf' });
    if (!st.gesamt) {
      const cb = el('input', {
        type: 'checkbox', class: 'auswahl-box',
        'aria-label': String(m.titel) + ' erreicht'
      });
      cb.checked = istWahr(m.erledigt);
      cb.addEventListener('change', function () { meilensteinAbhaken(m, cb.checked); });
      kopf.append(cb);
    }
    kopf.append(
      el('div', { class: 'meilenstein-titel' },
        el('strong', { text: '🏁 ' + String(m.titel) }),
        info ? el('span', { class: 'leise', text: info }) : null
      ),
      el('div', { class: 'kopf-knoepfe' },
        el('button', {
          class: 'knopf knopf-hell', type: 'button', text: '+ ToDo',
          onclick: function () { todoFormZeigen(null, String(m.id)); }
        }),
        el('button', {
          class: 'knopf knopf-hell', type: 'button', text: 'Bearbeiten',
          onclick: function () { meilensteinFormZeigen(m, null); }
        })
      )
    );

    const sektion = el('section', {
      class: 'meilenstein' + (st.erreicht ? ' erreicht' : '') + (fk ? ' ' + fk : '')
    }, kopf);
    if (st.gesamt) {
      sektion.append(
        fortschrittsBalken(st.prozent, st.erledigt + ' von ' + st.gesamt + ' erledigt'),
        todoListe(mt)
      );
    } else {
      sektion.append(el('p', { class: 'leise', text: 'Noch keine ToDos in diesem Meilenstein.' }));
    }
    return sektion;
  }

  // ToDos ohne Meilenstein (auch solche, deren Meilenstein es nicht mehr gibt)
  const meilensteinIds = {};
  ms.forEach(function (m) { meilensteinIds[String(m.id)] = true; });
  const ohne = alle.filter(function (t) {
    return !meilensteinIds[String(t.meilenstein_id || '').trim()];
  });

  const body = el('div', { class: 'projekt-teil-body' },
    el('div', { class: 'teil-aktionen' },
      el('button', {
        class: 'knopf', type: 'button', text: '+ ToDo',
        onclick: function () { todoFormZeigen(null, ''); }
      }),
      el('button', {
        class: 'knopf knopf-hell', type: 'button', text: '+ Meilenstein',
        onclick: function () { vorlagenWahlZeigen(); }
      })
    )
  );

  if (alle.length) body.append(el('p', { class: 'dash-zahlen', text: zahlenText(alle, getName()) }));
  if (!alle.length && !ms.length) {
    body.append(el('p', { class: 'leise', text: 'Noch keine ToDos in diesem Projekt.' }));
  }
  ms.forEach(function (m) { body.append(meilensteinBlock(m)); });
  if (ohne.length) {
    if (ms.length) body.append(el('h3', { class: 'teil-titel-klein', text: 'Ohne Meilenstein' }));
    body.append(todoListe(ohne));
  }

  const teil = el('details', { class: 'projekt-teil' });
  if (opt.offen) teil.open = true;
  teil.addEventListener('toggle', function () { opt.beiToggle(teil.open); });
  teil.append(
    el('summary', null,
      el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
      el('strong', { text: 'ToDos' }),
      el('span', {
        class: 'leise',
        text: f.gesamt ? f.erledigt + ' von ' + f.gesamt + ' erledigt' : 'noch keine ToDos'
      })
    ),
    body
  );
  return teil;
}

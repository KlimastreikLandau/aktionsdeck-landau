// js/views/projekte.js
// Reiter Projekte: oben die Übersicht (mit Fortschrittsbalken), darunter ein aufklappbarer Block je Projekt.
// Laufende Projekte (Aktiv) stehen oben, Projekte in Planung getrennt darunter.
// Anlegen, Bearbeiten und Löschen laufen in kleinen Fenstern. Löschen nimmt alles Zugehörige mit.
// Im Block: Teil "Team und Hüte" (projekt-team.js) und Teil "ToDos" mit Meilensteinen (projekt-todos.js).
// Weitere Teile folgen in 4.4 bis 4.6.
// Die Auswahl (aufgeklappte Projekte und Teile) bleibt beim Reiterwechsel erhalten.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache, cacheSet } from '../cache.js';
import { zeigeFenster } from '../ui/fenster.js';
import { fortschrittsBalken } from '../ui/balken.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { SCHEMA } from '../schema.js';
import { zeitText } from './material-rechnen.js';
import { datumText } from './todos-rechnen.js';
import {
  statusText, istAbgeschlossen, fortschritt, fortschrittText, sortiereProjekte, terminText
} from './projekt-rechnen.js';
import { baueTodoTeil } from './projekt-todos.js';

// Bleibt beim Reiterwechsel erhalten. Neue Anmeldung (anderes Token) = leer.
// offen: aufgeklappte Projekte. teile: aufgeklappte Teile ("<id>:todos", "<id>:team").
let merk = { token: '', offen: {}, teile: {} };

// Was beim Löschen eines Projekts mitgelöscht wird (Tab, Anzeigename)
const TEILE = [
  ['ToDos', 'ToDos'],
  ['Meilensteine', 'Meilensteine'],
  ['Projekt_Team', 'Teammitglieder'],
  ['Projekt_Material', 'Material-Positionen'],
  ['Finanzen', 'Finanz-Posten'],
  ['Protokolle', 'Protokolle'],
  ['Kommentare', 'Kommentare'],
  ['Posts', 'Posts']
];

function paare(liste) {
  const dl = el('dl', { class: 'detail-liste' });
  liste.forEach(function (p) {
    if (p[1] === '' || p[1] === undefined || p[1] === null) return;
    dl.append(el('dt', { text: p[0] }), el('dd', { text: String(p[1]) }));
  });
  return dl;
}

function euro(v) {
  if (v === '' || v === undefined || v === null) return '';
  const n = Number(v);
  if (isNaN(n)) return String(v);
  return n.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €';
}

// Planung = Vorbereitung (auch wenn der Status leer ist)
function istPlanung(p) {
  return (String(p.status || '').trim() || 'planung') === 'planung';
}

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);

  if (merk.token !== s.token) merk = { token: s.token, offen: {}, teile: {} };
  const offen = merk.offen;

  let daten = { projekte: [], todos: [], meilensteine: [], team: [] };
  let archivModus = false;
  let sprungId = ctx.unter || '';   // von der Start-Kachel: dieses Projekt aufklappen
  let letzteJson = '';
  let meta = null;
  let offline = false;
  const bloecke = {};               // id -> Element, zum Hinspringen
  const arbeitet = {};              // laufende Häkchen (dann keine Aktualisierung)

  const status = el('p', { class: 'leise', text: 'Lade Daten …' });
  const suche = el('input', {
    class: 'feld suche-feld', type: 'search', placeholder: 'Suchen …', 'aria-label': 'Suchen'
  });
  const wahl = el('select', { class: 'feld', 'aria-label': 'Projekt anzeigen' });
  const uebersicht = el('section', { class: 'karte projekt-uebersicht' });
  const box = el('div');

  const archivKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Archiv',
    onclick: function () { archivModus = !archivModus; zeichne(); }
  });
  const neuKnopf = el('button', {
    class: 'knopf', type: 'button', text: '+ Neu',
    onclick: function () { formZeigen(null); }
  });

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'kopfzeile' },
      el('h1', { text: 'Projekte' }),
      el('div', { class: 'kopf-knoepfe' }, archivKnopf, neuKnopf)
    ),
    uebersicht,
    el('div', { class: 'filterzeile filter-projekte' }, suche, wahl),
    status,
    box
  ));

  // ---- Hilfen ----

  function imModus() {
    return sortiereProjekte(
      daten.projekte.filter(function (p) { return istAbgeschlossen(p) === archivModus; }),
      archivModus
    );
  }

  // Aktiv oben, Planung darunter (im Archiv eine Gruppe ohne Titel)
  function gruppenVon(liste) {
    if (archivModus) return liste.length ? [{ titel: '', liste: liste }] : [];
    return [
      { titel: 'Aktiv', liste: liste.filter(function (p) { return !istPlanung(p); }) },
      { titel: 'In Planung', liste: liste.filter(istPlanung) }
    ].filter(function (g) { return g.liste.length; });
  }

  function wahlAufbauen(liste) {
    const alt = wahl.value;
    leeren(wahl);
    wahl.append(el('option', {
      value: '',
      text: archivModus ? 'Alle abgeschlossenen Projekte' : 'Alle Projekte'
    }));
    liste.forEach(function (p) {
      wahl.append(el('option', { value: String(p.id), text: String(p.titel) }));
    });
    wahl.value = liste.some(function (p) { return String(p.id) === alt; }) ? alt : '';
  }

  function statusZeigen() {
    if (!meta) return;
    if (offline) {
      status.className = 'fehler';
      status.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
      return;
    }
    const archiv = daten.projekte.filter(istAbgeschlossen).length;
    const laufend = daten.projekte.length - archiv;
    const zahlen = laufend + (laufend === 1 ? ' laufendes Projekt' : ' laufende Projekte') +
      ' · ' + archiv + ' im Archiv';
    status.className = 'leise';
    status.textContent = meta.aktuell
      ? zahlen + ' · Stand ' + zeitText(meta.stand)
      : 'Zwischengespeichert von ' + zeitText(meta.stand) + '. Aktualisiere …';
  }

  // Nach lokalen Änderungen (Häkchen): Zwischenspeicher auffrischen
  function merken() {
    const stand = new Date().toISOString();
    cacheSet(s.gruppe_id + ':projekte', { daten: daten, stand: stand });
    cacheSet(s.gruppe_id + ':todos', { daten: { todos: daten.todos }, stand: stand });
  }

  // Aus der Übersicht zum Projekt springen und es aufklappen
  function springe(id) {
    const k = String(id);
    const p = daten.projekte.find(function (x) { return String(x.id) === k; });
    if (!p) return;
    archivModus = istAbgeschlossen(p);
    if (wahl.value && wahl.value !== k) wahl.value = '';
    suche.value = '';
    offen[k] = true;
    zeichne();
    const e = bloecke[k];
    if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---- Zeichnen ----

  function uebersichtZeile(p) {
    const f = fortschritt(p.id, daten.todos);
    return el('button', {
      class: 'uebersicht-zeile', type: 'button',
      onclick: function () { springe(p.id); }
    },
      el('span', { class: 'uebersicht-kopf' },
        el('strong', { text: String(p.titel) }),
        el('span', { class: 'leise', text: terminText(p) })
      ),
      fortschrittsBalken(f.prozent, fortschrittText(f))
    );
  }

  function uebersichtZeichnen(liste) {
    leeren(uebersicht);
    uebersicht.append(el('h2', { text: archivModus ? 'Archiv' : 'Laufende Projekte' }));
    if (!liste.length) {
      let t = 'Noch kein Projekt angelegt. Mit „+ Neu“ geht es los.';
      if (daten.projekte.length) t = archivModus ? 'Das Archiv ist leer.' : 'Keine laufenden Projekte.';
      uebersicht.append(el('p', { class: 'leise', text: t }));
      return;
    }
    gruppenVon(liste).forEach(function (g) {
      if (g.titel) {
        uebersicht.append(el('h3', {
          class: 'projekt-gruppe-titel',
          text: g.titel + ' (' + g.liste.length + ')'
        }));
      }
      g.liste.forEach(function (p) { uebersicht.append(uebersichtZeile(p)); });
    });
  }

  function block(p) {
    const id = String(p.id);
    const f = fortschritt(p.id, daten.todos);
    const st = String(p.status || '').trim() || 'planung';

    const d = el('details', { class: 'karte projekt-block' });
    if (offen[id]) d.open = true;
    d.addEventListener('toggle', function () {
      if (d.open) offen[id] = true;
      else delete offen[id];
    });

    const teilKey = id + ':todos';
    const todoTeil = baueTodoTeil({
      ctx: ctx,
      token: s.token,
      projekt: p,
      holeDaten: function () { return daten; },
      arbeitet: arbeitet,
      offen: !!merk.teile[teilKey],
      beiToggle: function (o) {
        if (o) merk.teile[teilKey] = true;
        else delete merk.teile[teilKey];
      },
      neuZeichnen: zeichne,
      neuLaden: function () { return laden(false); },
       merken: merken
    });

    const termine = terminText(p);
    d.append(
      el('summary', null,
        el('span', { class: 'projekt-titel-zeile' },
          el('span', { class: 'projekt-pfeil', 'aria-hidden': 'true', text: '▸' }),
          el('span', { class: 'projekt-titel', text: String(p.titel) }),
          el('span', { class: 'status-marke status-' + st, text: statusText(p.status) })
        ),
        termine ? el('span', { class: 'leise', text: termine }) : null,
        fortschrittsBalken(f.prozent, fortschrittText(f))
      ),
      el('div', { class: 'projekt-body' },
        el('div', { class: 'detail-knoepfe' },
          el('button', {
            class: 'knopf knopf-hell', type: 'button', text: 'Bearbeiten',
            onclick: function () { formZeigen(p); }
          }),
          el('button', {
            class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen',
            onclick: function () { loeschen(p); }
          })
        ),
        p.beschreibung ? el('p', { class: 'notiz', text: String(p.beschreibung) }) : null,
        paare([
          ['Status', statusText(p.status)],
          ['Ort', p.ort],
          ['Start', datumText(p.start_datum)],
          ['Aktionsdatum', datumText(p.aktionsdatum)],
          ['Deadline', datumText(p.deadline)],
          ['Geplantes Budget', euro(p.budget_geplant)]
        ]),
        todoTeil,
        el('p', {
          class: 'leise',
          text: 'Material, Finanzen und Protokoll kommen in den nächsten Schritten hier dazu.'
        })
      )
    );
    bloecke[id] = d;
    return d;
  }

  function zeichne() {
    const liste = imModus();
    wahlAufbauen(liste);
    const q = suche.value.trim().toLowerCase();
    const nurId = wahl.value;
    const angezeigt = liste.filter(function (p) {
      if (nurId && String(p.id) !== nurId) return false;
      if (!q) return true;
      return [p.titel, p.ort, p.beschreibung].join(' ').toLowerCase().indexOf(q) >= 0;
    });

    const abgeschlossen = daten.projekte.filter(istAbgeschlossen).length;
    archivKnopf.textContent = archivModus
      ? '← Zurück zu den Projekten'
      : 'Archiv' + (abgeschlossen ? ' (' + abgeschlossen + ')' : '');

    uebersichtZeichnen(liste);

    leeren(box);
    Object.keys(bloecke).forEach(function (k) { delete bloecke[k]; });
    if (liste.length && !angezeigt.length) {
      box.append(el('p', { class: 'leise', text: 'Nichts gefunden.' }));
    }
    gruppenVon(angezeigt).forEach(function (g) {
      const wrap = el('div', {
        class: 'projekt-gruppe' + (g.titel === 'In Planung' ? ' projekt-gruppe-planung' : '')
      });
      if (g.titel) wrap.append(el('h2', { class: 'projekt-gruppe-titel', text: g.titel }));
      g.liste.forEach(function (p) { wrap.append(block(p)); });
      box.append(wrap);
    });
    statusZeigen();
  }

  // ---- Anlegen und Ändern ----

  function formZeigen(p) {
    const neuAnlegen = !p;
    let fenster = null;
    const form = baueFormular(SCHEMA.Projekte.felder, p || { status: 'planung' }, {
      speichernText: neuAnlegen ? 'Anlegen' : 'Speichern',
      onSpeichern: function (d) { return speichern(p, d, fenster); },
      onAbbrechen: function () { fenster.schliessen(); }
    });
    fenster = zeigeFenster(
      neuAnlegen ? 'Neues Projekt' : 'Projekt bearbeiten: ' + String(p.titel),
      form
    );
  }

  async function speichern(p, d, fenster) {
    if (!d.status) d.status = 'planung';
    try {
      if (!p) {
        const o = await api('create', { tabelle: 'Projekte', daten: d }, s.token);
        fenster.schliessen();
        toast('Projekt angelegt.');
        offen[o.id] = true;
        await laden(false);
        springe(o.id);
        return;
      }
      const r = await api('update', {
        tabelle: 'Projekte', id: p.id, daten: d, bekannt: p.geaendert_am
      }, s.token);
      fenster.schliessen();
      toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      offen[p.id] = true;
      if (r.eintrag) archivModus = istAbgeschlossen(r.eintrag);
      await laden(false);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        laden(false);
        throw new Error('Jemand anderes hat dieses Projekt gerade geändert. ' +
          'Klicke auf „Abbrechen“ und öffne es noch einmal.');
      }
      if (e.code === 'nicht_gefunden') {
        laden(false);
        throw new Error('Dieses Projekt gibt es nicht mehr. Klicke auf „Abbrechen“.');
      }
      throw e;
    }
  }

  // ---- Löschen (mit allem Zugehörigen) ----

  async function loeschen(p) {
    let r;
    try {
      r = await api('listMehrere', {
        tabellen: TEILE.map(function (t) { return t[0]; })
      }, s.token);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      toast(e.message);
      return;
    }

    const zeilen = [];
    TEILE.forEach(function (t) {
      const liste = (r && r.tabellen && r.tabellen[t[0]]) || [];
      const n = liste.filter(function (z) {
        return String(z.projekt_id || '').trim() === String(p.id);
      }).length;
      if (n) zeilen.push('• ' + n + ' ' + t[1]);
    });

    const frage = 'Projekt „' + String(p.titel) + '“ wirklich löschen?\n\n' +
      (zeilen.length
        ? 'Dabei werden auch gelöscht:\n' + zeilen.join('\n')
        : 'Es gehört noch nichts dazu.') +
      '\n\nDie Ausleihe-Historie bleibt erhalten. Rückgängig geht nur im Sheet.';
    if (!window.confirm(frage)) return;

    try {
      await api('projektLoeschen', { id: p.id, bekannt: p.geaendert_am }, s.token);
      delete offen[String(p.id)];
      toast('Projekt gelöscht.');
      await laden(false);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'draussen') {
        window.alert(e.message);
      } else if (e.code === 'konflikt') {
        toast('Jemand anderes hat dies gerade geändert. Bitte neu öffnen.');
        laden(false);
      } else if (e.code === 'nicht_gefunden') {
        toast('Dieses Projekt gibt es nicht mehr.');
        laden(false);
      } else {
        toast(e.message);
      }
    }
  }

  // ---- Laden ----

  function zeigen(neu, m) {
    offline = false;
    meta = m;
    // Ältere Zwischenspeicher kennen Meilensteine und Team noch nicht
    if (!neu.projekte) neu.projekte = [];
    if (!neu.todos) neu.todos = [];
    if (!neu.meilensteine) neu.meilensteine = [];
    if (!neu.team) neu.team = [];
    const json = JSON.stringify(neu);
    const gleich = json === letzteJson;
    daten = neu;
    letzteJson = json;

    let ziel = null;
    if (sprungId) {
      ziel = daten.projekte.find(function (x) { return String(x.id) === String(sprungId); }) || null;
      if (ziel) {
        archivModus = istAbgeschlossen(ziel);
        offen[String(ziel.id)] = true;
      }
    }

    // Unveränderte Daten: nur die Statuszeile auffrischen (kein Springen der Seite)
    if (gleich && !ziel) statusZeigen();
    else zeichne();

    if (ziel) {
      const e = bloecke[String(ziel.id)];
      if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' });
      sprungId = '';
    } else if (sprungId && m.aktuell) {
      sprungId = '';
    }
  }

  async function laden(zuerstCache) {
    try {
      const ok = await ladeMitCache(
        s.gruppe_id + ':projekte',
        async function () {
          const r = await api('listMehrere', {
            tabellen: ['Projekte', 'ToDos', 'Meilensteine', 'Projekt_Team']
          }, s.token);
          const t = (r && r.tabellen) || {};
          return {
            projekte: t.Projekte || [],
            todos: t.ToDos || [],
            meilensteine: t.Meilensteine || [],
            team: t.Projekt_Team || []
          };
        },
        zeigen,
        zuerstCache
      );
      if (!ok) {
        offline = true;
        statusZeigen();
      }
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      status.className = 'fehler';
      status.textContent = 'Fehler: ' + e.message;
    }
  }

  suche.addEventListener('input', zeichne);
  wahl.addEventListener('change', function () {
    if (wahl.value) offen[wahl.value] = true;
    zeichne();
  });
  // Während ein Häkchen noch gespeichert wird, wird nicht aktualisiert
  ctx.setzeRefresh(function () {
    if (Object.keys(arbeitet).length) return Promise.resolve();
    return laden(false);
  });
  await laden(true);
}

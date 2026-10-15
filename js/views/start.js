// js/views/start.js
// Start-Reiter: Dashboard. Kachel Projekte zeigt die laufenden Projekte mit Fortschrittsbalken (Klick = ins Projekt)
// und je Projekt einen Schalter "ToDos (n offen)" mit den offenen ToDos zum Abhaken.
// Kachel ToDos zeigt die offenen, allgemeinen ToDos (ohne Projekt und Post).
// Erledigte (nur die der letzten 2 Wochen) per Schalter oben rechts. ToDos haben ein Kästchen zum Abhaken.
// Die anderen Kacheln sind noch Platzhalter (Posts/Kalender Etappe 5).

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache, cacheSet } from '../cache.js';
import { gruppenLogo } from '../ui/logo.js';
import { fortschrittsBalken } from '../ui/balken.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';
import { istWahr } from '../schema.js';
import { zeitText } from './material-rechnen.js';
import { abhakWerte, abhakenSpeichern } from './todos-abhaken.js';
import {
  kurz, faelligStatus, faelligText, prioText, sortieren, sortiereErledigte,
  istAllgemein, istArchiv, zahlenText
} from './todos-rechnen.js';
import {
  istAbgeschlossen, fortschritt, fortschrittText, sortiereProjekte, terminText
} from './projekt-rechnen.js';

const MAX_OFFEN = 10;
const MAX_ERLEDIGT = 10;
const MAX_PROJEKTE = 6;

// Welche Projekte in der Kachel aufgeklappt sind (bleibt beim Reiterwechsel erhalten)
const projektOffen = {};

const KACHELN = [
  { titel: 'Projekte', projekte: true },
  { titel: 'ToDos', todos: true },
  { titel: 'Material', hinweis: 'Bestand und Ausleihe' },
  { titel: 'Posts', hinweis: 'Kommt mit Etappe 5' },
  { titel: 'Kalender', hinweis: 'Kommt mit Etappe 5' }
];

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);

  const basis = '#/g/' + encodeURIComponent(s.kurzname) + '/';
  const todosLink = basis + 'todos';
  const projekteLink = basis + 'projekte';
  const cacheKey = s.gruppe_id + ':todos';
  let letzte = null;        // { daten, meta } der ToDos
  let projektDaten = null;  // { projekte }
  let projektFehler = '';
  let offline = false;
  const arbeitet = {};

  const zahlen = el('p', { class: 'dash-zahlen', text: 'Lade ToDos …' });
  const erledigteCb = el('input', { type: 'checkbox' });
  const filter = el('label', { class: 'formfeld-bool' },
    erledigteCb, el('span', { text: 'Erledigte anzeigen' }));
  const liste = el('ul', { class: 'dash-todo-liste' });
  const fuss = el('p', { class: 'leise' });

  const todoKachel = el('section', { class: 'karte dash-kachel dash-todos' },
    el('div', { class: 'dash-kachel-kopf' },
      el('div', { class: 'dash-kachel-titel' },
        el('h2', { text: 'ToDos' }),
        el('a', { class: 'knopf knopf-hell', href: todosLink, text: 'Alle ToDos →' })
      ),
      filter
    ),
    zahlen,
    liste,
    fuss
  );

  const projektListe = el('div', { class: 'dash-projekt-liste' },
    el('p', { class: 'leise', text: 'Lade Projekte …' }));
  const projektKachel = el('section', { class: 'karte dash-kachel dash-projekte' },
    el('div', { class: 'dash-kachel-titel' },
      el('h2', { text: 'Projekte' }),
      el('a', { class: 'knopf knopf-hell', href: projekteLink, text: 'Alle Projekte →' })
    ),
    projektListe
  );

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'dash-kopf' },
      gruppenLogo(s.kurzname, 'dash-logo'),
      el('h1', { text: 'Hallo ' + (getName() || '') })
    ),
    el('div', { class: 'dash-raster' },
      ...KACHELN.map(function (k) {
        if (k.projekte) return projektKachel;
        if (k.todos) return todoKachel;
        return el('section', { class: 'karte dash-kachel' },
          el('h2', { text: k.titel }),
          el('p', { class: 'leise', text: k.hinweis })
        );
      })
    )
  ));

  // ---- Projekte ----

  function zeichneProjekte() {
    leeren(projektListe);
    if (projektFehler && !projektDaten) {
      projektListe.append(el('p', {
        class: 'fehler', text: 'Projekte konnten nicht geladen werden: ' + projektFehler
      }));
      return;
    }
    if (!projektDaten) {
      projektListe.append(el('p', { class: 'leise', text: 'Lade Projekte …' }));
      return;
    }
    const laufend = sortiereProjekte(
      projektDaten.projekte.filter(function (p) { return !istAbgeschlossen(p); }),
      false
    );
    if (!laufend.length) {
      projektListe.append(el('p', { class: 'leise', text: 'Noch kein laufendes Projekt.' }));
      return;
    }
    const gezeigt = laufend.slice(0, MAX_PROJEKTE);
    const todos = letzte ? letzte.daten.todos : [];

    if (letzte) {
      const alleAuf = gezeigt.every(function (p) { return projektOffen[String(p.id)]; });
      projektListe.append(el('div', { class: 'dash-projekt-knopf' },
        el('button', {
          class: 'knopf knopf-hell', type: 'button',
          text: alleAuf ? 'Alle zuklappen' : 'Alle aufklappen',
          onclick: function () {
            gezeigt.forEach(function (p) { projektOffen[String(p.id)] = !alleAuf; });
            zeichneProjekte();
          }
        })
      ));
    }

    gezeigt.forEach(function (p) {
      const id = String(p.id);
      const href = projekteLink + '/' + encodeURIComponent(p.id);
      const f = fortschritt(p.id, todos);
      const termine = terminText(p);
      const blockEl = el('div', { class: 'dash-projekt-block' },
        el('a', { class: 'dash-projekt', href: href },
          el('strong', { text: String(p.titel) }),
          termine ? el('span', { class: 'leise', text: termine }) : null,
          fortschrittsBalken(letzte ? f.prozent : 0, letzte ? fortschrittText(f) : 'Lade ToDos …')
        )
      );

      if (letzte) {
        const offene = sortieren(todos.filter(function (t) {
          return String(t.projekt_id || '').trim() === id && !istWahr(t.erledigt);
        }));
        const d = el('details', { class: 'dash-projekt-todos' });
        if (projektOffen[id]) d.open = true;
        d.addEventListener('toggle', function () {
          if (d.open) projektOffen[id] = true;
          else delete projektOffen[id];
        });
        d.append(el('summary', { text: 'ToDos (' + offene.length + ' offen)' }));
        const ul = el('ul', { class: 'dash-todo-liste' });
        offene.forEach(function (t) { ul.append(zeile(t, href)); });
        if (!offene.length) {
          ul.append(el('li', { class: 'leise', text: 'Keine offenen ToDos.' }));
        }
        d.append(ul);
        blockEl.append(d);
      }
      projektListe.append(blockEl);
    });

    if (laufend.length > MAX_PROJEKTE) {
      projektListe.append(el('p', {
        class: 'leise', text: '… und ' + (laufend.length - MAX_PROJEKTE) + ' weitere'
      }));
    }
  }

  async function ladeProjekte(zuerstCache) {
    try {
      await ladeMitCache(
        s.gruppe_id + ':projekteliste',
        async function () {
          const r = await api('list', { tabelle: 'Projekte' }, s.token);
          return { projekte: r.zeilen };
        },
        function (daten) {
          projektDaten = daten;
          projektFehler = '';
          zeichneProjekte();
        },
        zuerstCache
      );
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      projektFehler = e.message;
      zeichneProjekte();
    }
  }

  // ---- Abhaken (ohne Konfliktprüfung) ----

  async function abhaken(t, wert) {
    const id = String(t.id);
    if (arbeitet[id]) return;
    arbeitet[id] = true;

    const alt = { erledigt: t.erledigt, erledigt_am: t.erledigt_am, erledigt_von: t.erledigt_von };
    const neu = abhakWerte(wert);
    Object.assign(t, neu);
    zeichne();

    let neuLaden = false;
    try {
      const eintrag = await abhakenSpeichern(s.token, t.id, neu);
      const i = letzte.daten.todos.findIndex(function (x) { return String(x.id) === id; });
      if (i >= 0 && eintrag) letzte.daten.todos[i] = eintrag;
      cacheSet(cacheKey, { daten: letzte.daten, stand: new Date().toISOString() });
      toast(wert ? 'Erledigt.' : 'Wieder geöffnet.');
    } catch (e) {
      Object.assign(t, alt);
      if (!ctx.behandleFehler(e)) {
        toast(e.code === 'nicht_gefunden' ? 'Dieses ToDo gibt es nicht mehr.' : e.message);
        if (e.code === 'nicht_gefunden') neuLaden = true;
      }
    }
    delete arbeitet[id];
    zeichne();
    if (neuLaden) laden(false);
  }

  // href: wohin ein Klick auf den Text führt (Standard: Reiter ToDos)
  function zeile(t, href) {
    const fertig = istWahr(t.erledigt);
    const klassen = ['dash-todo'];
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

    return el('li', { class: 'dash-zeile' + (fertig ? ' erledigt' : '') },
      cb,
      el('a', { class: klassen.join(' '), href: href || todosLink },
        el('strong', { text: kurz(t.text, 90) }),
        info ? el('span', { class: 'leise', text: info }) : null
      )
    );
  }

  function zeichne() {
    leeren(liste);
    zeichneProjekte();
    if (!letzte) return;
    const alle = letzte.daten.todos.filter(istAllgemein);
    const offen = sortieren(alle.filter(function (t) { return !istWahr(t.erledigt); }));
    // Erledigte: nur die der letzten 2 Wochen (ältere stehen im Archiv im Reiter ToDos)
    const fertig = sortiereErledigte(alle.filter(function (t) {
      return istWahr(t.erledigt) && !istArchiv(t);
    }));

    zahlen.className = 'dash-zahlen';
    zahlen.textContent = zahlenText(alle, getName());

    offen.slice(0, MAX_OFFEN).forEach(function (t) { liste.append(zeile(t)); });
    if (offen.length > MAX_OFFEN) {
      liste.append(el('li', { class: 'leise', text: '… und ' + (offen.length - MAX_OFFEN) + ' weitere offene' }));
    }
    if (!offen.length) {
      liste.append(el('li', {
        class: 'leise',
        text: alle.length ? 'Keine offenen ToDos.' : 'Noch keine allgemeinen ToDos eingetragen.'
      }));
    }

    if (erledigteCb.checked) {
      fertig.slice(0, MAX_ERLEDIGT).forEach(function (t) { liste.append(zeile(t)); });
      if (fertig.length > MAX_ERLEDIGT) {
        liste.append(el('li', { class: 'leise', text: '… und ' + (fertig.length - MAX_ERLEDIGT) + ' weitere erledigte' }));
      }
    }

    if (offline) {
      fuss.className = 'fehler';
      fuss.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
    } else {
      fuss.className = 'leise';
      fuss.textContent = letzte.meta.aktuell
        ? 'Stand ' + zeitText(letzte.meta.stand)
        : 'Zwischengespeichert von ' + zeitText(letzte.meta.stand) + '. Aktualisiere …';
    }
  }

  function zeigen(daten, meta) {
    letzte = { daten: daten, meta: meta };
    offline = false;
    zeichne();
  }

  async function laden(zuerstCache) {
    try {
      const ok = await ladeMitCache(
        cacheKey,
        async function () {
          const r = await api('list', { tabelle: 'ToDos' }, s.token);
          return { todos: r.zeilen };
        },
        zeigen,
        zuerstCache
      );
      if (!ok) {
        offline = true;
        zeichne();
      }
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      zahlen.className = 'fehler';
      zahlen.textContent = 'ToDos konnten nicht geladen werden: ' + e.message;
    }
  }

  erledigteCb.addEventListener('change', zeichne);
  // Während ein Häkchen noch gespeichert wird, wird nicht aktualisiert
  ctx.setzeRefresh(function () {
    if (Object.keys(arbeitet).length) return Promise.resolve();
    return Promise.all([laden(false), ladeProjekte(false)]);
  });
  await Promise.all([laden(true), ladeProjekte(true)]);
}

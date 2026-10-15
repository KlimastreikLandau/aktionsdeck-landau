// js/views/start.js
// Start-Reiter: Dashboard. Kachel ToDos zeigt die offenen, allgemeinen ToDos (ohne Projekt und Post).
// Erledigte per Schalter oben rechts. ToDos haben ein Kästchen zum Abhaken.
// Die anderen Kacheln sind noch Platzhalter (Projekte Etappe 4, Posts/Kalender Etappe 5).

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache, cacheSet } from '../cache.js';
import { gruppenLogo } from '../ui/logo.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';
import { istWahr } from '../schema.js';
import { zeitText } from './material-rechnen.js';
import { abhakWerte, abhakenSpeichern } from './todos-abhaken.js';
import {
  kurz, faelligStatus, faelligText, prioText, sortieren, sortiereErledigte,
  istAllgemein, zahlenText
} from './todos-rechnen.js';

const MAX_OFFEN = 10;
const MAX_ERLEDIGT = 10;

const KACHELN = [
  { titel: 'Projekte', hinweis: 'Kommt mit Etappe 4' },
  { titel: 'ToDos', todos: true },
  { titel: 'Material', hinweis: 'Bestand und Ausleihe' },
  { titel: 'Posts', hinweis: 'Kommt mit Etappe 5' },
  { titel: 'Kalender', hinweis: 'Kommt mit Etappe 5' }
];

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);

  const todosLink = '#/g/' + encodeURIComponent(s.kurzname) + '/todos';
  const cacheKey = s.gruppe_id + ':todos';
  let letzte = null; // { daten, meta }
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
        el('a', { href: todosLink, text: 'Alle ToDos →' })
      ),
      filter
    ),
    zahlen,
    liste,
    fuss,
    el('p', {
      class: 'leise',
      text: 'Hier stehen die allgemeinen ToDos. ToDos aus Projekten stehen im jeweiligen Projekt.'
    })
  );

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'dash-kopf' },
      gruppenLogo(s.kurzname, 'dash-logo'),
      el('h1', { text: 'Hallo ' + (getName() || '') })
    ),
    el('div', { class: 'dash-raster' },
      ...KACHELN.map(function (k) {
        if (k.todos) return todoKachel;
        return el('section', { class: 'karte dash-kachel' },
          el('h2', { text: k.titel }),
          el('p', { class: 'leise', text: k.hinweis })
        );
      })
    )
  ));

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

  function zeile(t) {
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
      el('a', { class: klassen.join(' '), href: todosLink },
        el('strong', { text: kurz(t.text, 90) }),
        info ? el('span', { class: 'leise', text: info }) : null
      )
    );
  }

  function zeichne() {
    leeren(liste);
    if (!letzte) return;
    const alle = letzte.daten.todos.filter(istAllgemein);
    const offen = sortieren(alle.filter(function (t) { return !istWahr(t.erledigt); }));
    const fertig = sortiereErledigte(alle.filter(function (t) { return istWahr(t.erledigt); }));

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
    return laden(false);
  });
  await laden(true);
}

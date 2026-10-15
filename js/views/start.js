// js/views/start.js
// Start-Reiter: Dashboard. Kachel ToDos zeigt die offenen ToDos (Erledigte per Schalter).
// Die anderen Kacheln sind noch Platzhalter (Projekte Etappe 4, Posts/Kalender Etappe 5).

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache } from '../cache.js';
import { gruppenLogo } from '../ui/logo.js';
import { getName } from '../store.js';
import { istWahr } from '../schema.js';
import { zeitText } from './material-rechnen.js';
import {
  kurz, faelligStatus, faelligText, prioText, sortieren, istMeins
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
  let letzte = null; // { daten, meta }
  let offline = false;

  const zahlen = el('p', { class: 'dash-zahlen', text: 'Lade ToDos …' });
  const erledigteCb = el('input', { type: 'checkbox' });
  const filter = el('label', { class: 'formfeld-bool' },
    erledigteCb, el('span', { text: 'Erledigte anzeigen' }));
  const liste = el('ul', { class: 'dash-todo-liste' });
  const fuss = el('p', { class: 'leise' });
  const alleLink = el('a', { href: todosLink, text: 'Alle ToDos ansehen →' });

  const todoKachel = el('section', { class: 'karte dash-kachel dash-todos' },
    el('h2', { text: 'ToDos' }),
    zahlen,
    filter,
    liste,
    el('p', null, alleLink),
    fuss
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

  function zeile(t) {
    const klassen = ['dash-todo'];
    if (istWahr(t.erledigt)) klassen.push('erledigt');
    const st = faelligStatus(t);
    if (st) klassen.push(st);
    const info = [
      t.verantwortlich,
      t.faellig_am ? 'Fällig ' + faelligText(t) : '',
      prioText(t.prioritaet)
    ].filter(Boolean).join(' · ');
    return el('li', null,
      el('a', { class: klassen.join(' '), href: todosLink },
        el('strong', { text: kurz(t.text, 90) }),
        info ? el('span', { class: 'leise', text: info }) : null
      )
    );
  }

  function zeichne() {
    leeren(liste);
    if (!letzte) return;
    const alle = letzte.daten.todos;
    const offen = sortieren(alle.filter(function (t) { return !istWahr(t.erledigt); }));
    const fertig = alle.filter(function (t) { return istWahr(t.erledigt); })
      .sort(function (a, b) {
        return String(b.erledigt_am || '').localeCompare(String(a.erledigt_am || ''));
      });

    const ueber = offen.filter(function (t) { return faelligStatus(t) === 'ueberfaellig'; }).length;
    const heute = offen.filter(function (t) { return faelligStatus(t) === 'heute'; }).length;
    const meine = offen.filter(function (t) { return istMeins(t, getName()); }).length;
    zahlen.textContent = offen.length + ' offen · ' + ueber + ' überfällig · ' +
      heute + ' heute fällig · ' + meine + ' für dich';

    offen.slice(0, MAX_OFFEN).forEach(function (t) { liste.append(zeile(t)); });
    if (offen.length > MAX_OFFEN) {
      liste.append(el('li', { class: 'leise', text: '… und ' + (offen.length - MAX_OFFEN) + ' weitere offene' }));
    }
    if (!offen.length) {
      liste.append(el('li', {
        class: 'leise',
        text: alle.length ? 'Keine offenen ToDos.' : 'Noch keine ToDos eingetragen.'
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
        s.gruppe_id + ':todos',
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
  ctx.setzeRefresh(function () { return laden(false); });
  await laden(true);
}

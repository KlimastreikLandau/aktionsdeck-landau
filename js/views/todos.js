// js/views/todos.js
// Reiter ToDos: oben die offenen ToDos, darunter eine eigene Tabelle "Erledigt" (letzte 2 Wochen).
// Der Knopf "Archiv" zeigt die ToDos, die vor mehr als 2 Wochen erledigt wurden.
// Abhaken wird ohne Konfliktprüfung gespeichert. Bearbeiten im Formular prüft auf Konflikte.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache, cacheSet } from '../cache.js';
import { zeigeListe } from '../ui/table.js';
import { zeigeDetail, schliesseDetail } from '../ui/detail.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';
import { SCHEMA, istWahr } from '../schema.js';
import { zeitText } from './material-rechnen.js';
import { abhakWerte, abhakenSpeichern } from './todos-abhaken.js';
import {
  datumText, prioText, kurz, faelligStatus, faelligText, sortieren, treffer,
  zahlenText, istArchiv, sortiereErledigte
} from './todos-rechnen.js';

const SPALTEN = [
  { name: 'text', label: 'Titel', wert: function (z) { return kurz(z.text, 90); } },
  { name: 'verantwortlich', label: 'Verantwortlich' },
  { name: 'faellig_am', label: 'Fällig', wert: function (z) { return faelligText(z); } },
  { name: 'prioritaet', label: 'Priorität', wert: function (z) { return prioText(z.prioritaet); } },
  { name: '_status', label: 'Status', wert: function (z) { return istWahr(z.erledigt) ? 'Erledigt' : 'Offen'; } }
];

function karteVon(z) {
  const fertig = istWahr(z.erledigt);
  return {
    titel: kurz(z.text, 120),
    zeilen: [
      [z.verantwortlich,
        z.faellig_am ? 'Fällig ' + faelligText(z) : '',
        prioText(z.prioritaet)].filter(Boolean).join(' · '),
      fertig ? 'Erledigt' + (z.erledigt_von ? ' von ' + z.erledigt_von : '') : ''
    ]
  };
}

function paare(liste) {
  const dl = el('dl', { class: 'detail-liste' });
  liste.forEach(function (p) {
    if (p[1] === '' || p[1] === undefined || p[1] === null) return;
    dl.append(el('dt', { text: p[0] }), el('dd', { text: String(p[1]) }));
  });
  return dl;
}

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);

  let daten = { todos: [] };
  let offenId = null;
  let formOffen = false;
  let formTodo = null;      // das ToDo, wie es beim Öffnen des Formulars war (null = neu)
  let formHinweis = false;  // Warnung wegen fremder Änderung schon gezeigt?
  let archivModus = false;
  let meta = null;
  let offline = false;
  let zaehlText = '';
  const arbeitet = {};

  const zahlen = el('p', { class: 'dash-zahlen' });
  const status = el('p', { class: 'leise', text: 'Lade Daten …' });
  const suche = el('input', {
    class: 'feld suche-feld', type: 'search', placeholder: 'Suchen …', 'aria-label': 'Suchen'
  });
  const wer = el('select', { class: 'feld', 'aria-label': 'Verantwortlich' });
  const faellig = el('select', { class: 'feld', 'aria-label': 'Fälligkeit' },
    el('option', { value: '', text: 'Alle Termine' }),
    el('option', { value: 'ueberfaellig', text: 'Überfällig' }),
    el('option', { value: 'heute', text: 'Heute fällig' }),
    el('option', { value: 'woche', text: 'Diese Woche' }),
    el('option', { value: 'ohne', text: 'Ohne Datum' })
  );
  const prio = el('select', { class: 'feld', 'aria-label': 'Priorität' },
    el('option', { value: '', text: 'Alle Prioritäten' }),
    el('option', { value: 'hoch', text: 'Hoch' }),
    el('option', { value: 'normal', text: 'Normal' }),
    el('option', { value: 'niedrig', text: 'Niedrig' })
  );
  const meine = el('input', { type: 'checkbox' });
  const meineFeld = el('label', { class: 'formfeld-bool' }, meine, el('span', { text: 'Nur meine' }));

  const boxOffen = el('div');
  const kopfErledigt = el('h2', { class: 'liste-titel' });
  const boxErledigt = el('div', { class: 'liste-erledigt' });

  const neuKnopf = el('button', {
    class: 'knopf', type: 'button', text: '+ Neu',
    onclick: function () { offenId = null; formZeigen(null); }
  });
  const archivKnopf = el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Archiv',
    onclick: function () { archivModus = !archivModus; zeichne(); }
  });

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'kopfzeile' },
      el('h1', { text: 'ToDos' }),
      el('div', { class: 'kopf-knoepfe' }, archivKnopf, neuKnopf)
    ),
    zahlen,
    el('div', { class: 'filterzeile filter-todos' }, suche, wer, faellig, prio, meineFeld),
    status,
    boxOffen,
    kopfErledigt,
    boxErledigt
  ));

  // ---- Hilfen ----

  function formEnde() {
    formOffen = false;
    formTodo = null;
    formHinweis = false;
  }

  function werteVonVerantwortlich() {
    const liste = [];
    daten.todos.forEach(function (t) {
      const k = String(t.verantwortlich || '').trim();
      if (k && liste.indexOf(k) < 0) liste.push(k);
    });
    liste.sort(function (a, b) { return a.localeCompare(b, 'de'); });
    return liste;
  }

  function verantwortlicheVorschlaege() {
    const liste = werteVonVerantwortlich();
    const n = getName();
    if (n && liste.indexOf(n) < 0) liste.push(n);
    liste.sort(function (a, b) { return a.localeCompare(b, 'de'); });
    return liste;
  }

  function werAufbauen() {
    const alt = wer.value;
    const liste = werteVonVerantwortlich();
    leeren(wer);
    wer.append(
      el('option', { value: '', text: 'Alle Verantwortlichen' }),
      el('option', { value: '__leer', text: 'Ohne Verantwortliche' })
    );
    liste.forEach(function (k) { wer.append(el('option', { value: k, text: k })); });
    wer.value = (alt === '__leer' || liste.indexOf(alt) >= 0) ? alt : '';
  }

  function statusZeigen() {
    if (!meta) return;
    if (offline) {
      status.className = 'fehler';
      status.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
      return;
    }
    status.className = 'leise';
    status.textContent = meta.aktuell
      ? zaehlText + ' · Stand ' + zeitText(meta.stand)
      : 'Zwischengespeichert von ' + zeitText(meta.stand) + '. Aktualisiere …';
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
    if (offenId && !formOffen) detailZeigen(offenId, false);

    let laden_noetig = false;
    try {
      const eintrag = await abhakenSpeichern(s.token, t.id, neu);
      const i = daten.todos.findIndex(function (x) { return String(x.id) === id; });
      if (i >= 0 && eintrag) daten.todos[i] = eintrag;
      // Mein eigenes Abhaken soll das offene Formular desselben ToDos nicht zum Konflikt machen
      if (formTodo && String(formTodo.id) === id && !formHinweis && eintrag) {
        formTodo.geaendert_am = eintrag.geaendert_am;
      }
      cacheSet(s.gruppe_id + ':todos', { daten: daten, stand: new Date().toISOString() });
    } catch (e) {
      Object.assign(t, alt);
      if (!ctx.behandleFehler(e)) {
        if (e.code === 'nicht_gefunden') {
          toast('Dieses ToDo gibt es nicht mehr.');
          laden_noetig = true;
        } else {
          toast(e.message);
        }
      }
    }
    delete arbeitet[id];
    zeichne();
    if (offenId && !formOffen) detailZeigen(offenId, false);
    if (laden_noetig) laden(false);
  }

  // ---- Detail ----

  function detailZeigen(id, neu) {
    const t = daten.todos.find(function (x) { return String(x.id) === String(id); });
    if (!t) {
      if (offenId) toast('Dieses ToDo gibt es nicht mehr.');
      offenId = null;
      schliesseDetail(ctx.detail);
      return;
    }
    const fertig = istWahr(t.erledigt);
    const klasse = 'notiz' + (fertig ? ' erledigt' : '');
    const inhalt = el('div', null,
      el('div', { class: 'detail-knoepfe' },
        el('button', {
          class: 'knopf', type: 'button',
          text: fertig ? 'Wieder öffnen' : 'Als erledigt markieren',
          onclick: function () { abhaken(t, !fertig); }
        })
      ),
      el('div', { class: 'detail-knoepfe' },
        el('button', {
          class: 'knopf knopf-hell', type: 'button', text: 'Bearbeiten',
          onclick: function () { formZeigen(t); }
        }),
        el('button', {
          class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen',
          onclick: function () { loeschen(t); }
        })
      ),
      el('p', { class: klasse, text: String(t.text) }),
      t.details ? el('h3', { text: 'Weitere Informationen' }) : null,
      t.details ? el('p', { class: klasse, text: String(t.details) }) : null,
      paare([
        ['Status', fertig ? 'Erledigt' : 'Offen'],
        ['Verantwortlich', t.verantwortlich],
        ['Fällig am', faelligText(t)],
        ['Priorität', prioText(t.prioritaet)],
        ['Erledigt von', fertig ? t.erledigt_von : ''],
        ['Erledigt am', fertig ? datumText(t.erledigt_am) : ''],
        ['Angelegt von', t.erstellt_von],
        ['Angelegt am', t.erstellt_am ? zeitText(t.erstellt_am) : ''],
        ['Zuletzt geändert', t.geaendert_von && t.geaendert_am
          ? t.geaendert_von + ', ' + zeitText(t.geaendert_am) : '']
      ])
    );
    zeigeDetail(ctx.detail, kurz(t.text, 60), inhalt, function () { offenId = null; }, neu);
  }

  // ---- Formular: t = null heißt neu anlegen ----

  function formZeigen(t) {
    formOffen = true;
    formTodo = t ? Object.assign({}, t) : null;
    formHinweis = false;
    const neuAnlegen = !t;
    const form = baueFormular(SCHEMA.ToDos.felder, t || { prioritaet: 'normal' }, {
      speichernText: neuAnlegen ? 'Anlegen' : 'Speichern',
      vorschlaege: { verantwortlich: verantwortlicheVorschlaege() },
      onSpeichern: function (d) { return speichern(formTodo, d); },
      onAbbrechen: function () { formSchliessen(t); }
    });
    zeigeDetail(
      ctx.detail,
      neuAnlegen ? 'Neues ToDo' : 'ToDo bearbeiten',
      form,
      function () { formEnde(); offenId = null; },
      true
    );
  }

  function formSchliessen(t) {
    formEnde();
    if (t) {
      offenId = t.id;
      detailZeigen(t.id, true);
    } else {
      offenId = null;
      schliesseDetail(ctx.detail);
    }
  }

  async function speichern(t, d) {
    try {
      if (!t) {
        const o = await api('create', { tabelle: 'ToDos', daten: d }, s.token);
        formEnde();
        offenId = o.id;
        toast('ToDo angelegt.');
        await laden(false);
        detailZeigen(o.id, true);
        return;
      }
      const r = await api('update', {
        tabelle: 'ToDos', id: t.id, daten: d, bekannt: t.geaendert_am
      }, s.token);
      formEnde();
      offenId = t.id;
      toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      await laden(false);
      detailZeigen(t.id, true);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        laden(false);
        throw new Error('Jemand anderes hat dieses ToDo gerade geändert. ' +
          'Klicke auf „Abbrechen“ und öffne es noch einmal.');
      }
      if (e.code === 'nicht_gefunden') {
        laden(false);
        throw new Error('Dieses ToDo gibt es nicht mehr. Klicke auf „Abbrechen“.');
      }
      throw e;
    }
  }

  async function loeschen(t) {
    const frage = 'Dieses ToDo wirklich löschen?\n\n„' + kurz(t.text, 80) + '“';
    if (!window.confirm(frage)) return;
    try {
      await api('delete', { tabelle: 'ToDos', id: t.id, bekannt: t.geaendert_am }, s.token);
      offenId = null;
      schliesseDetail(ctx.detail);
      toast('Gelöscht.');
      await laden(false);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        toast('Jemand anderes hat dies gerade geändert. Bitte neu öffnen.');
        laden(false);
      } else {
        toast(e.message);
      }
    }
  }

  // ---- Liste ----

  // Erledigte: grau und durchgestrichen. Überfällig: rot. Heute: orange.
  function markieren(container, zeilen) {
    const reihen = container.querySelectorAll('tbody tr');
    const karten = container.querySelectorAll('.karten-liste .karte');
    zeilen.forEach(function (z, i) {
      const klassen = [];
      if (istWahr(z.erledigt)) klassen.push('erledigt');
      const st = faelligStatus(z);
      if (st) klassen.push(st);
      klassen.forEach(function (k) {
        if (reihen[i]) reihen[i].classList.add(k);
        if (karten[i]) karten[i].classList.add(k);
      });
    });
  }

  const haken = {
    gewaehlt: function (z) { return istWahr(z.erledigt); },
    umschalten: function (z, wert) { abhaken(z, wert); }
  };

  function liste(box, zeilen, leerText) {
    zeigeListe(box, zeilen, SPALTEN, karteVon,
      function (z) {
        formEnde();
        offenId = z.id;
        detailZeigen(z.id, true);
      },
      leerText, null, haken
    );
    markieren(box, zeilen);
  }

  function zeichne() {
    const f = {
      q: suche.value.trim().toLowerCase(),
      wer: wer.value,
      faellig: faellig.value,
      prio: prio.value,
      meine: meine.checked,
      name: getName()
    };
    const passend = daten.todos.filter(function (t) { return treffer(t, f); });
    const offen = sortieren(passend.filter(function (t) { return !istWahr(t.erledigt); }));
    const erledigt = sortiereErledigte(passend.filter(function (t) { return istWahr(t.erledigt); }));
    const neuere = erledigt.filter(function (t) { return !istArchiv(t); });
    const aeltere = erledigt.filter(istArchiv);

    zahlen.textContent = daten.todos.length ? zahlenText(daten.todos, getName()) : '';

    const archivAnzahl = daten.todos.filter(istArchiv).length;
    archivKnopf.textContent = archivModus
      ? '← Zurück zu den ToDos'
      : 'Archiv' + (archivAnzahl ? ' (' + archivAnzahl + ')' : '');

    if (archivModus) {
      boxOffen.hidden = true;
      kopfErledigt.hidden = false;
      boxErledigt.hidden = false;
      kopfErledigt.textContent = 'Archiv: vor mehr als 2 Wochen erledigt (' + aeltere.length + ')';
      liste(boxErledigt, aeltere, archivAnzahl
        ? 'Nichts gefunden.'
        : 'Das Archiv ist leer. Erledigte ToDos landen hier nach 2 Wochen.');
      zaehlText = aeltere.length + ' im Archiv';
    } else {
      boxOffen.hidden = false;
      liste(boxOffen, offen, daten.todos.length
        ? 'Keine offenen ToDos gefunden.'
        : 'Noch keine ToDos eingetragen.');
      kopfErledigt.hidden = !neuere.length;
      boxErledigt.hidden = !neuere.length;
      kopfErledigt.textContent = 'Erledigt, letzte 2 Wochen (' + neuere.length + ')';
      liste(boxErledigt, neuere, '');
      zaehlText = offen.length + ' offen · ' + neuere.length + ' erledigt';
    }
    statusZeigen();
  }

  // Bei offenem Formular: Hat jemand anderes dieses ToDo geändert oder gelöscht? Einmal warnen.
  function formPruefen() {
    if (!formOffen || !formTodo || formHinweis) return;
    const aktuell = daten.todos.find(function (x) { return String(x.id) === String(formTodo.id); });
    if (!aktuell) {
      formHinweis = true;
      toast('Dieses ToDo wurde inzwischen gelöscht. Bitte „Abbrechen“ wählen.');
    } else if (String(aktuell.geaendert_am) !== String(formTodo.geaendert_am)) {
      formHinweis = true;
      toast('Jemand anderes hat dieses ToDo geändert. Bitte „Abbrechen“ wählen und neu öffnen.');
    }
  }

  function zeigen(neu, m) {
    daten = neu;
    meta = m;
    offline = false;
    werAufbauen();
    zeichne();
    // Ein offenes Formular wird bei der Aktualisierung nie überschrieben.
    if (offenId && !formOffen) detailZeigen(offenId, false);
    formPruefen();
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
        statusZeigen();
      }
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      status.className = 'fehler';
      status.textContent = 'Fehler: ' + e.message;
    }
  }

  suche.addEventListener('input', zeichne);
  wer.addEventListener('change', zeichne);
  faellig.addEventListener('change', zeichne);
  prio.addEventListener('change', zeichne);
  meine.addEventListener('change', zeichne);
  // Während ein Häkchen noch gespeichert wird, wird nicht aktualisiert
  ctx.setzeRefresh(function () {
    if (Object.keys(arbeitet).length) return Promise.resolve();
    return laden(false);
  });
  await laden(true);
}

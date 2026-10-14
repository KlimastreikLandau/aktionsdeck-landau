// js/views/todos.js
// Reiter ToDos: Liste mit Suche, Details, Anlegen, Ändern, Löschen.
// Alle ToDos bleiben sichtbar. Erledigte stehen unten, grau und durchgestrichen.
// Abhaken kommt in Schritt 3.2.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache } from '../cache.js';
import { zeigeListe } from '../ui/table.js';
import { zeigeDetail, schliesseDetail } from '../ui/detail.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';
import { SCHEMA, istWahr } from '../schema.js';
import { zeitText } from './material-rechnen.js';

const PRIO_TEXT = { hoch: 'Hoch', normal: 'Normal', niedrig: 'Niedrig' };

function datumText(s) {
  const t = String(s || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t.split('-').reverse().join('.') : String(s || '');
}

function prioText(p) {
  return PRIO_TEXT[String(p || '').trim()] || '';
}

function kurz(text, max) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

// Offene zuerst, dann nach Fälligkeit (ohne Datum zuletzt), dann nach Erstelldatum
function sortieren(liste) {
  return liste.slice().sort(function (a, b) {
    const ea = istWahr(a.erledigt);
    const eb = istWahr(b.erledigt);
    if (ea !== eb) return ea ? 1 : -1;
    const fa = String(a.faellig_am || '').slice(0, 10);
    const fb = String(b.faellig_am || '').slice(0, 10);
    if (fa !== fb) {
      if (!fa) return 1;
      if (!fb) return -1;
      return fa < fb ? -1 : 1;
    }
    return String(a.erstellt_am || '').localeCompare(String(b.erstellt_am || ''));
  });
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

  const status = el('p', { class: 'leise', text: 'Lade Daten …' });
  const suche = el('input', {
    class: 'feld', type: 'search', placeholder: 'Suchen …', 'aria-label': 'Suchen'
  });
  const box = el('div');
  const neuKnopf = el('button', {
    class: 'knopf', type: 'button', text: '+ Neu',
    onclick: function () { offenId = null; formZeigen(null); }
  });

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'kopfzeile' }, el('h1', { text: 'ToDos' }), neuKnopf),
    el('div', { class: 'filterzeile' }, suche),
    status,
    box
  ));

  // ---- Hilfen ----

  function verantwortlicheVorschlaege() {
    const liste = [];
    const merke = function (p) {
      const t = String(p || '').trim();
      if (t && liste.indexOf(t) < 0) liste.push(t);
    };
    merke(getName());
    daten.todos.forEach(function (t) { merke(t.verantwortlich); });
    liste.sort(function (a, b) { return a.localeCompare(b, 'de'); });
    return liste;
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
    const inhalt = el('div', null,
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
      el('p', { class: 'notiz' + (fertig ? ' erledigt' : ''), text: String(t.text) }),
      paare([
        ['Status', fertig ? 'Erledigt' : 'Offen'],
        ['Verantwortlich', t.verantwortlich],
        ['Fällig am', datumText(t.faellig_am)],
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
    const neuAnlegen = !t;
    const form = baueFormular(SCHEMA.ToDos.felder, t || { prioritaet: 'normal' }, {
      speichernText: neuAnlegen ? 'Anlegen' : 'Speichern',
      vorschlaege: { verantwortlich: verantwortlicheVorschlaege() },
      onSpeichern: function (d) { return speichern(t, d); },
      onAbbrechen: function () { formSchliessen(t); }
    });
    zeigeDetail(
      ctx.detail,
      neuAnlegen ? 'Neues ToDo' : 'ToDo bearbeiten',
      form,
      function () { formOffen = false; offenId = null; },
      true
    );
  }

  function formSchliessen(t) {
    formOffen = false;
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
        formOffen = false;
        offenId = o.id;
        toast('ToDo angelegt.');
        await laden(false);
        detailZeigen(o.id, true);
        return;
      }
      const r = await api('update', {
        tabelle: 'ToDos', id: t.id, daten: d, bekannt: t.geaendert_am
      }, s.token);
      formOffen = false;
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

  // Erledigte Zeilen und Karten bekommen die Klasse "erledigt" (grau, durchgestrichen)
  function erledigteMarkieren(zeilen) {
    const reihen = box.querySelectorAll('tbody tr');
    const karten = box.querySelectorAll('.karten-liste .karte');
    zeilen.forEach(function (z, i) {
      if (!istWahr(z.erledigt)) return;
      if (reihen[i]) reihen[i].classList.add('erledigt');
      if (karten[i]) karten[i].classList.add('erledigt');
    });
  }

  function zeichne() {
    const q = suche.value.trim().toLowerCase();
    const zeilen = sortieren(daten.todos.filter(function (t) {
      if (!q) return true;
      return [t.text, t.verantwortlich, prioText(t.prioritaet), datumText(t.faellig_am)]
        .join(' ').toLowerCase().indexOf(q) >= 0;
    }));

    const leerText = daten.todos.length ? 'Nichts gefunden.' : 'Noch keine ToDos eingetragen.';

    zeigeListe(box, zeilen,
      [
        { name: 'text', label: 'ToDo', wert: function (z) { return kurz(z.text, 90); } },
        { name: 'verantwortlich', label: 'Verantwortlich' },
        { name: 'faellig_am', label: 'Fällig', wert: function (z) { return datumText(z.faellig_am); } },
        { name: 'prioritaet', label: 'Priorität', wert: function (z) { return prioText(z.prioritaet); } },
        { name: '_status', label: 'Status', wert: function (z) { return istWahr(z.erledigt) ? 'Erledigt' : 'Offen'; } }
      ],
      function (z) {
        const fertig = istWahr(z.erledigt);
        return {
          titel: kurz(z.text, 120),
          zeilen: [
            [z.verantwortlich,
              z.faellig_am ? 'Fällig ' + datumText(z.faellig_am) : '',
              prioText(z.prioritaet)].filter(Boolean).join(' · '),
            fertig ? 'Erledigt' + (z.erledigt_von ? ' von ' + z.erledigt_von : '') : ''
          ]
        };
      },
      function (z) {
        formOffen = false;
        offenId = z.id;
        detailZeigen(z.id, true);
      },
      leerText
    );
    erledigteMarkieren(zeilen);
  }

  function zeigen(neu, meta) {
    daten = neu;
    zeichne();
    // Ein offenes Formular wird bei der Aktualisierung nicht überschrieben.
    if (offenId && !formOffen) detailZeigen(offenId, false);
    status.className = 'leise';
    status.textContent = meta.aktuell
      ? daten.todos.length + ' Einträge · Stand ' + zeitText(meta.stand)
      : 'Zwischengespeichert von ' + zeitText(meta.stand) + '. Aktualisiere …';
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
        status.className = 'fehler';
        status.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
      }
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      status.className = 'fehler';
      status.textContent = 'Fehler: ' + e.message;
    }
  }

  suche.addEventListener('input', zeichne);
  ctx.setzeRefresh(function () { return laden(false); });
  await laden(true);
}

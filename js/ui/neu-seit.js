// js/ui/neu-seit.js
// "Was ist neu?": holt, was andere seit dem letzten Besuch geändert haben, und zeigt es im Fenster.
// Der Zeitpunkt des letzten Besuchs liegt im Gerät (store.js), pro Gruppe.

import { el } from './dom.js';
import { api } from '../api.js';
import { zeigeFenster } from './fenster.js';
import { getName, getLetzterBesuch, setLetzterBesuch } from '../store.js';
import { istWahr } from '../schema.js';
import { kurz } from '../views/todos-rechnen.js';

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function zeitKurz(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

// Gibt { items, stand } zurück. stand = Serverzeit, wird beim Schließen als "gelesen bis" gespeichert.
export async function holeNeu(token, gruppeId, kurzname) {
  const alt = getLetzterBesuch(gruppeId);
  const seit = alt || new Date().toISOString();
  const r = await api('listMehrere', {
    tabellen: ['ToDos', 'Mitteilungen', 'Umfragen', 'Kommentare', 'Projekte'],
    seit: seit
  }, token);
  const stand = (r && r.serverzeit) || new Date().toISOString();

  // Erster Besuch auf diesem Gerät: nur den Zeitpunkt merken
  if (!alt) {
    setLetzterBesuch(gruppeId, stand);
    return { items: [], stand: stand };
  }

  const t = (r && r.tabellen) || {};
  const ich = txt(getName()).toLowerCase();
  const basis = '#/g/' + encodeURIComponent(kurzname) + '/';
  const items = [];

  function sammeln(liste, art, fn) {
    (liste || []).forEach(function (z) {
      if (istWahr(z.geloescht)) return;
      const neu = String(z.erstellt_am || '') >= seit;
      const wer = txt(neu ? z.erstellt_von : z.geaendert_von);
      if (ich && wer.toLowerCase() === ich) return;
      const info = fn(z, neu);
      if (!info) return;
      items.push({
        art: art,
        was: info.was,
        titel: info.titel,
        link: info.link,
        wer: wer,
        zeit: neu ? z.erstellt_am : z.geaendert_am
      });
    });
  }

  sammeln(t.ToDos, 'ToDo', function (z, neu) {
    const pid = txt(z.projekt_id);
    return {
      was: neu ? 'neu' : (istWahr(z.erledigt) ? 'erledigt' : 'geändert'),
      titel: kurz(z.text, 80),
      link: pid ? basis + 'projekte/' + encodeURIComponent(pid) : basis + 'todos'
    };
  });
  sammeln(t.Mitteilungen, 'Mitteilung', function (z, neu) {
    return { was: neu ? 'neu' : 'geändert', titel: kurz(z.titel, 80), link: basis + 'start' };
  });
  sammeln(t.Umfragen, 'Umfrage', function (z, neu) {
    return {
      was: neu ? 'neu' : (istWahr(z.beendet) ? 'beendet' : 'geändert'),
      titel: kurz(z.frage, 80),
      link: basis + 'start'
    };
  });
  sammeln(t.Kommentare, 'Kommentar', function (z, neu) {
    if (!neu) return null;
    return {
      was: 'neu',
      titel: kurz(z.text, 80),
      link: txt(z.bezug_art) === 'todo' ? basis + 'todos' : basis + 'start'
    };
  });
  sammeln(t.Projekte, 'Projekt', function (z, neu) {
    return {
      was: neu ? 'neu' : 'geändert',
      titel: kurz(z.titel, 80),
      link: basis + 'projekte/' + encodeURIComponent(z.id)
    };
  });

  items.sort(function (a, b) { return String(b.zeit).localeCompare(String(a.zeit)); });
  return { items: items.slice(0, 100), stand: stand };
}

// beiZu wird beim Schließen aufgerufen (dann gilt alles als gelesen)
export function zeigeNeu(items, beiZu) {
  let fenster = null;
  const inhalt = el('div');

  if (!items.length) {
    inhalt.append(el('p', {
      class: 'leise',
      text: 'Seit deinem letzten Besuch ist von anderen nichts Neues dazugekommen.'
    }));
  } else {
    inhalt.append(el('p', {
      class: 'leise',
      text: 'Das haben andere seit deinem letzten Besuch gemacht. Eigene Änderungen stehen hier nicht.'
    }));
    const ul = el('ul', { class: 'dash-todo-liste' });
    items.forEach(function (it) {
      const info = [it.art, it.was, it.wer ? 'von ' + it.wer : '', zeitKurz(it.zeit)]
        .filter(Boolean).join(' · ');
      ul.append(el('li', { class: 'dash-zeile' },
        el('a', {
          class: 'dash-todo', href: it.link,
          onclick: function () { if (fenster) fenster.schliessen(); }
        },
          el('strong', { text: it.titel }),
          el('span', { class: 'leise', text: info })
        )
      ));
    });
    inhalt.append(ul);
  }

  inhalt.append(el('div', { class: 'fenster-loeschen' },
    el('button', {
      class: 'knopf', type: 'button', text: 'Schließen (alles gelesen)',
      onclick: function () { fenster.schliessen(); }
    })
  ));
  fenster = zeigeFenster('Was ist neu?', inhalt, beiZu, { aussenKlick: true });
}

// js/ui/nav.js
// Reiter-Liste, Seitenleiste (PC), untere Leiste (Handy), Platz für Details rechts.

import { el } from './dom.js';
import { features } from '../config.js';
import { getName } from '../store.js';

export const TABS = [
  { id: 'start', label: 'Start', icon: '🏠' },
  { id: 'material', label: 'Material', icon: '📦' },
  { id: 'todos', label: 'ToDos', icon: '✅' },
  { id: 'projekte', label: 'Projekte', icon: '📁' },
  { id: 'posts', label: 'Posts', icon: '📣' },
  { id: 'kalender', label: 'Kalender', icon: '📅' },
  { id: 'hilfe', label: 'Hilfe', icon: '❓' }
];

// Öffentliche Seiten (ohne Login): Reihenfolge wie auf der Startseite
export const OEFFENTLICH = [
  { id: 'impressum', label: 'Impressum' },
  { id: 'info', label: 'Info' },
  { id: 'datenschutz', label: 'Datenschutz' }
];

const MEHR = { id: 'mehr', label: 'Mehr', icon: '⋯' };
const UNTEN = ['start', 'material', 'todos', 'projekte'];

export function sichtbareTabs() {
  return TABS.filter(function (t) { return features[t.id] !== false; });
}

export function tabLabel(id) {
  if (id === 'mehr') return 'Mehr';
  const t = TABS.find(function (x) { return x.id === id; });
  return t ? t.label : id;
}

// Kleine Links zu den öffentlichen Seiten
export function oeffentlicheLinks() {
  return el('div', { class: 'oeff-links' },
    ...OEFFENTLICH.map(function (o) {
      return el('a', { href: '#/info/' + o.id, text: o.label });
    })
  );
}

function eintrag(klasse, basis, t, aktiv) {
  const a = el('a', {
    class: klasse + (t.id === aktiv ? ' aktiv' : ''),
    href: basis + t.id
  },
    el('span', { class: 'nav-icon', text: t.icon, 'aria-hidden': 'true' }),
    el('span', { text: t.label })
  );
  if (t.id === aktiv) a.setAttribute('aria-current', 'page');
  return a;
}

// Baut das Gerüst. Gibt { inhalt, detail } zurück.
export function baueGeruest(container, ctx) {
  const basis = '#/g/' + encodeURIComponent(ctx.session.kurzname) + '/';
  const aktiv = ctx.tab;
  const tabs = sichtbareTabs();

  const seitenleiste = el('nav', { class: 'seitenleiste', 'aria-label': 'Hauptmenü' },
    el('div', { class: 'seiten-kopf', text: ctx.session.name }),
    ...tabs.map(function (t) { return eintrag('nav-link', basis, t, aktiv); }),
    el('div', { class: 'seiten-fuss' },
      el('span', { class: 'leise', text: 'Angemeldet als ' + (getName() || 'unbekannt') }),
      el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Name ändern', onclick: ctx.nameAendern }),
      el('button', { class: 'knopf knopf-hell', type: 'button', text: 'Abmelden', onclick: ctx.abmelden }),
      oeffentlicheLinks()
    )
  );

  const mehrAktiv = UNTEN.indexOf(aktiv) < 0 ? 'mehr' : '';
  const untenleiste = el('nav', { class: 'untenleiste', 'aria-label': 'Hauptmenü' },
    ...tabs.filter(function (t) { return UNTEN.indexOf(t.id) >= 0; })
      .map(function (t) { return eintrag('nav-unten', basis, t, aktiv); }),
    eintrag('nav-unten', basis, MEHR, mehrAktiv)
  );

  const inhalt = el('main', { class: 'inhalt', id: 'inhalt' });
  const detail = el('aside', { class: 'detail', id: 'detail', 'aria-label': 'Details' });

  container.textContent = '';
  container.append(el('div', { class: 'huelle' }, seitenleiste, inhalt, detail, untenleiste));
  return { inhalt: inhalt, detail: detail };
}

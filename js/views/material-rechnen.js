// js/views/material-rechnen.js
// Rechenhelfer für Material und Ausleihe. Gleiche Regeln wie apps-script/Ausleihe.gs.
// Festes Material: anzahl = Bestand, ausgeliehen = mitgenommen - zurueck - defekt.
// Verbrauchsmaterial: anzahl = aktueller Vorrat, es wird nichts als "draußen" gezählt.

import { istFalsch } from '../schema.js';
import { getName } from '../store.js';

export function zahl(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

export function runden(n) {
  return Math.round(n * 100) / 100;
}

export function istVerbrauch(m) {
  return String(m.typ || '').trim().toLowerCase() === 'verbrauch';
}

// Pro Material: mitgenommen minus zurueck minus defekt
export function ausgeliehen(ausleihen) {
  const m = {};
  ausleihen.forEach(function (a) {
    const id = String(a.material_id);
    if (a.art === 'mitgenommen') m[id] = (m[id] || 0) + zahl(a.anzahl);
    else if (a.art === 'zurueck' || a.art === 'defekt') m[id] = (m[id] || 0) - zahl(a.anzahl);
  });
  Object.keys(m).forEach(function (id) { m[id] = runden(m[id]); });
  return m;
}

// Ergänzt: _verfuegbar, _draussen, _verbrauch
export function mitVerfuegbar(m, out) {
  const verbrauch = istVerbrauch(m);
  const hat = !(m.anzahl === '' || m.anzahl === undefined || m.anzahl === null);
  const draussen = verbrauch ? 0 : (out[String(m.id)] || 0);
  let v = '';
  if (hat) v = verbrauch ? runden(zahl(m.anzahl)) : runden(zahl(m.anzahl) - draussen);
  return Object.assign({}, m, { _verfuegbar: v, _draussen: draussen, _verbrauch: verbrauch });
}

// Darf dieses Material für die Aktion ausgewählt werden? z kommt aus mitVerfuegbar.
// art: 'mitgenommen', 'zurueck' oder 'vormerken'
export function auswaehlbar(z, art) {
  if (art === 'vormerken') return !istFalsch(z.aktiv);
  if (art === 'mitgenommen') {
    if (istFalsch(z.aktiv)) return false;
    if (z._verbrauch) return z._verfuegbar !== '' && z._verfuegbar > 0;
    return z._verfuegbar === '' || z._verfuegbar > 0;
  }
  return z._verbrauch ? true : z._draussen > 0;
}

// Namen für die Vorschläge: dein Name plus alle aus früheren Buchungen
export function personenAus(ausleihen) {
  const liste = [];
  const merke = function (p) {
    const t = String(p || '').trim();
    if (t && liste.indexOf(t) < 0) liste.push(t);
  };
  merke(getName());
  ausleihen.forEach(function (a) { merke(a.person); });
  liste.sort(function (a, b) { return a.localeCompare(b, 'de'); });
  return liste;
}

export function zeitText(iso) {
  return new Date(iso).toLocaleString('de-DE');
}

// { materialId: { projektId: menge } }, projektId '' = ohne Projekt (wie bAusgeliehenProjekt im Skript)
export function ausgeliehenProjekt(ausleihen) {
  const m = {};
  ausleihen.forEach(function (a) {
    const id = String(a.material_id);
    const pid = String(a.projekt_id === undefined || a.projekt_id === null ? '' : a.projekt_id).trim();
    let d;
    if (a.art === 'mitgenommen') d = zahl(a.anzahl);
    else if (a.art === 'zurueck' || a.art === 'defekt') d = -zahl(a.anzahl);
    else return;
    if (!m[id]) m[id] = {};
    m[id][pid] = runden((m[id][pid] || 0) + d);
  });
  return m;
}

// "Demo: 2, ohne Projekt: 1". Leer, wenn nichts mit Projekt ausgeliehen ist.
export function herkunftText(o, titel) {
  const ids = Object.keys(o || {}).filter(function (p) { return o[p] > 0; });
  if (!ids.some(function (p) { return p !== ''; })) return '';
  return ids.map(function (p) {
    return (p ? (titel[p] || 'Projekt') : 'ohne Projekt') + ': ' + o[p];
  }).join(', ');
}

// Rückgabe: festes Material wird pro Herkunft (Projekt oder "ohne Projekt") zu einer eigenen Zeile.
export function nachHerkunft(items, pp, titel) {
  const liste = [];
  const sk = function (p) { return p ? (titel[p] || '?') : '~'; };
  items.forEach(function (z) {
    if (z._verbrauch) { liste.push(z); return; }
    const o = pp[String(z.id)] || {};
    Object.keys(o).filter(function (p) { return o[p] > 0; })
      .sort(function (a, b) { return sk(a).localeCompare(sk(b), 'de'); })
      .forEach(function (p) {
        liste.push(Object.assign({}, z, {
          _pid: p,
          _draussen: o[p],
          _herkunft: p ? 'Projekt ' + (titel[p] || '?') : 'ohne Projekt'
        }));
      });
  });
  return liste;
}

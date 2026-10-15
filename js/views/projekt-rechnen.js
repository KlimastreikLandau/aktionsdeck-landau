// js/views/projekt-rechnen.js
// Rechenhelfer für Projekte: Status, Fortschritt (aus den ToDos), Sortierung, Terminzeile.

import { istWahr } from '../schema.js';
import { normDatum, datumText } from './todos-rechnen.js';

const STATUS_TEXT = {
  planung: 'Planung',
  aktiv: 'Aktiv',
  erledigt: 'Erledigt',
  archiviert: 'Archiviert'
};

export function statusText(s) {
  return STATUS_TEXT[String(s || '').trim()] || 'Planung';
}

// erledigt und archiviert zählen beide als "abgeschlossen" (stehen im Archiv)
export function istAbgeschlossen(p) {
  const s = String(p.status || '').trim();
  return s === 'erledigt' || s === 'archiviert';
}

// Fortschritt = erledigte ToDos / alle ToDos des Projekts
export function fortschritt(projektId, todos) {
  const id = String(projektId);
  const liste = (todos || []).filter(function (t) {
    return String(t.projekt_id || '').trim() === id;
  });
  const erledigt = liste.filter(function (t) { return istWahr(t.erledigt); }).length;
  const gesamt = liste.length;
  return {
    gesamt: gesamt,
    erledigt: erledigt,
    offen: gesamt - erledigt,
    prozent: gesamt ? Math.round(erledigt * 100 / gesamt) : 0
  };
}

export function fortschrittText(f) {
  if (!f.gesamt) return 'Noch keine ToDos';
  return f.erledigt + ' von ' + f.gesamt + ' erledigt · ' + f.prozent + ' %';
}

// Laufende: Aktionsdatum aufsteigend. Abgeschlossene: neueste zuerst. Ohne Datum zuletzt.
export function sortiereProjekte(liste, abgeschlossen) {
  return liste.slice().sort(function (a, b) {
    const da = normDatum(a.aktionsdatum);
    const db = normDatum(b.aktionsdatum);
    if (da !== db) {
      if (!da) return 1;
      if (!db) return -1;
      if (abgeschlossen) return da < db ? 1 : -1;
      return da < db ? -1 : 1;
    }
    return String(a.titel).localeCompare(String(b.titel), 'de');
  });
}

// "Aktion 12.09.2026 · Landau"
export function terminText(p) {
  return [
    p.aktionsdatum ? 'Aktion ' + datumText(p.aktionsdatum) : '',
    p.ort
  ].filter(Boolean).join(' · ');
}

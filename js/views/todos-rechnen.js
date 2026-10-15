// js/views/todos-rechnen.js
// Rechenhelfer für ToDos: Datum, Fälligkeit, Sortierung, Filter.
// Wird vom Reiter ToDos benutzt und später auch vom Start-Dashboard (3.4) und von den Projekten (4.3).

import { istWahr } from '../schema.js';

const PRIO_TEXT = { hoch: 'Hoch', normal: 'Normal', niedrig: 'Niedrig' };
const PRIO_RANG = { hoch: 0, normal: 1, niedrig: 2 };

export function datumText(s) {
  const t = String(s || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t.split('-').reverse().join('.') : String(s || '');
}

export function prioText(p) {
  return PRIO_TEXT[String(p || '').trim()] || '';
}

export function kurz(text, max) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

// Lokales Datum als JJJJ-MM-TT
export function iso(d) {
  const zz = function (n) { return (n < 10 ? '0' : '') + n; };
  return d.getFullYear() + '-' + zz(d.getMonth() + 1) + '-' + zz(d.getDate());
}

export function heuteIso() {
  return iso(new Date());
}

// Sonntag dieser Woche
export function wochenEnde() {
  const d = new Date();
  const tag = d.getDay(); // 0 = Sonntag
  d.setDate(d.getDate() + (tag === 0 ? 0 : 7 - tag));
  return iso(d);
}

export function datumVon(t) {
  const s = String(t.faellig_am || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

// '' | 'ueberfaellig' | 'heute' (nur für offene ToDos)
export function faelligStatus(t) {
  if (istWahr(t.erledigt)) return '';
  const d = datumVon(t);
  if (!d) return '';
  const h = heuteIso();
  if (d < h) return 'ueberfaellig';
  if (d === h) return 'heute';
  return '';
}

export function faelligText(t) {
  const d = datumText(t.faellig_am);
  if (!d) return '';
  const st = faelligStatus(t);
  if (st === 'ueberfaellig') return d + ' (überfällig)';
  if (st === 'heute') return d + ' (heute)';
  return d;
}

function rang(t) {
  const r = PRIO_RANG[String(t.prioritaet || '').trim()];
  return r === undefined ? 1 : r;
}

// Offene zuerst, dann Fälligkeit (ohne Datum zuletzt), dann Priorität, dann Anlegedatum
export function sortieren(liste) {
  return liste.slice().sort(function (a, b) {
    const ea = istWahr(a.erledigt);
    const eb = istWahr(b.erledigt);
    if (ea !== eb) return ea ? 1 : -1;
    const fa = datumVon(a);
    const fb = datumVon(b);
    if (fa !== fb) {
      if (!fa) return 1;
      if (!fb) return -1;
      return fa < fb ? -1 : 1;
    }
    if (rang(a) !== rang(b)) return rang(a) - rang(b);
    return String(a.erstellt_am || '').localeCompare(String(b.erstellt_am || ''));
  });
}

export function istMeins(t, name) {
  const n = String(name || '').trim().toLowerCase();
  if (!n) return false;
  return String(t.verantwortlich || '').toLowerCase().indexOf(n) >= 0;
}

// f: { q, wer ('' | '__leer' | Name), faellig ('' | ueberfaellig | heute | woche | ohne),
//      prio ('' | hoch | normal | niedrig), meine (true/false), name }
export function treffer(t, f) {
  const offen = !istWahr(t.erledigt);
  const d = datumVon(t);

  if (f.q) {
    const heu = [t.text, t.verantwortlich, prioText(t.prioritaet), datumText(t.faellig_am)]
      .join(' ').toLowerCase();
    if (heu.indexOf(f.q) < 0) return false;
  }
  const wer = String(t.verantwortlich || '').trim();
  if (f.wer === '__leer') {
    if (wer) return false;
  } else if (f.wer && wer !== f.wer) {
    return false;
  }
  if (f.prio && (String(t.prioritaet || '').trim() || 'normal') !== f.prio) return false;
  if (f.meine && !istMeins(t, f.name)) return false;

  const h = heuteIso();
  if (f.faellig === 'ueberfaellig') return offen && !!d && d < h;
  if (f.faellig === 'heute') return offen && d === h;
  if (f.faellig === 'woche') return offen && !!d && d >= h && d <= wochenEnde();
  if (f.faellig === 'ohne') return !d;
  return true;
}

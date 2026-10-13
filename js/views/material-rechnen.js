// js/views/material-rechnen.js
// Kleine Rechenhelfer für Material und Ausleihe.
// Verfügbar = anzahl - Summe mitgenommen + Summe zurueck.

export function zahl(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

export function runden(n) {
  return Math.round(n * 100) / 100;
}

// Pro Material: Summe zurueck minus Summe mitgenommen
export function bewegung(ausleihen) {
  const m = {};
  ausleihen.forEach(function (a) {
    const id = String(a.material_id);
    if (a.art === 'mitgenommen') m[id] = (m[id] || 0) - zahl(a.anzahl);
    else if (a.art === 'zurueck') m[id] = (m[id] || 0) + zahl(a.anzahl);
  });
  return m;
}

export function mitVerfuegbar(m, bew) {
  const v = m.anzahl === '' || m.anzahl === undefined
    ? ''
    : runden(zahl(m.anzahl) + (bew[String(m.id)] || 0));
  return Object.assign({}, m, { _verfuegbar: v });
}

export function zeitText(iso) {
  return new Date(iso).toLocaleString('de-DE');
}

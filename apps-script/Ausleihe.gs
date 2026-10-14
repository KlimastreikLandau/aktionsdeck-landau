// Ausleihe.gs – Aktion "buchen": mehrere Materialien auf einmal mitnehmen oder zurückgeben.
// Läuft in einer Sperre, prüft die Mengen selbst und passt "anzahl" im Tab Material an.
//
// Aufruf: { aktion:'buchen', art:'mitgenommen'|'zurueck', person, datum, projekt_id, notiz,
//           positionen:[{ material_id, anzahl, defekt }] }
//
// Festes Material (typ fest oder leer): anzahl = Bestand. Ausgeliehen = mitgenommen - zurueck - defekt.
//   Mitnehmen nur bis (Bestand - ausgeliehen). "defekt" gibt es nur bei der Rückgabe, es senkt den Bestand.
//   Bei der Rückgabe ist "anzahl" die Gesamtzahl, "defekt" der Teil davon, der kaputt ist.
// Verbrauchsmaterial (typ verbrauch): anzahl = aktueller Vorrat.
//   Mitnehmen senkt anzahl. Rückgabe ist der Rest und erhöht anzahl.

function bRunde(n) {
  return Math.round(n * 100) / 100;
}

function bTyp(z) {
  return String(z.typ || '').trim().toLowerCase() === 'verbrauch' ? 'verbrauch' : 'fest';
}

// Pflichtzahl größer als 0
function bZahl(v, wo) {
  var n = Number(String(v === undefined || v === null ? '' : v).replace(',', '.'));
  if (!isFinite(n) || n <= 0 || n > 1000000) {
    fehler('ungueltig', wo + ' muss eine Zahl größer als 0 sein.');
  }
  return bRunde(n);
}

// Freiwillige Zahl (leer = 0)
function bDefekt(v, wo) {
  if (v === undefined || v === null || String(v).trim() === '') return 0;
  var n = Number(String(v).replace(',', '.'));
  if (!isFinite(n) || n < 0 || n > 1000000) {
    fehler('ungueltig', wo + ' muss eine Zahl von 0 an sein.');
  }
  return bRunde(n);
}

// Pro Material: mitgenommen minus zurueck minus defekt (nur diese Gruppe)
function bAusgeliehen(zeilen, gid) {
  var m = {};
  zeilen.forEach(function (a) {
    if (String(a.gruppe_id) !== String(gid) || truthy(a.geloescht)) return;
    var id = String(a.material_id);
    var n = Number(a.anzahl);
    if (isNaN(n)) n = 0;
    if (a.art === 'mitgenommen') m[id] = (m[id] || 0) + n;
    else if (a.art === 'zurueck' || a.art === 'defekt') m[id] = (m[id] || 0) - n;
  });
  Object.keys(m).forEach(function (id) { m[id] = bRunde(m[id]); });
  return m;
}

function aktionBuchen(ctx, p) {
  var art = p.art;
  if (art !== 'mitgenommen' && art !== 'zurueck') {
    fehler('ungueltig', 'Die Art muss "mitgenommen" oder "zurueck" sein.');
  }
  if (!Array.isArray(p.positionen) || p.positionen.length < 1 || p.positionen.length > 100) {
    fehler('ungueltig', 'Die Liste muss 1 bis 100 Materialien haben.');
  }
  var person = typisieren(p.person, 'person').trim();
  if (!person) fehler('ungueltig', 'Bitte eine Person angeben.');
  var datum = typisieren(p.datum, 'datum').trim() || jetzt().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) fehler('ungueltig', 'Das Datum muss so aussehen: 2026-05-31.');
  var projekt = typisieren(p.projekt_id, 'projekt_id').trim();
  var notiz = typisieren(p.notiz, 'notiz');
  var anzeige = anzeigename(p);

  return mitSperre(function () {
    var mat = lies('Material');
    pruefeKopf('Material', mat.kopf);
    var ausl = lies('Ausleihe');
    pruefeKopf('Ausleihe', ausl.kopf);
    var draussen = bAusgeliehen(ausl.zeilen, ctx.gruppe_id);

    // 1) Alles prüfen und planen. Geschrieben wird erst danach.
    var gesehen = {};
    var plan = [];
    p.positionen.forEach(function (pos) {
      if (!pos || typeof pos !== 'object') fehler('ungueltig', 'Eine Zeile der Liste ist ungültig.');
      var id = String(pos.material_id === undefined || pos.material_id === null ? '' : pos.material_id);
      if (gesehen[id]) fehler('ungueltig', 'Ein Material steht doppelt in der Liste.');
      gesehen[id] = true;

      var z = eintragFinden(mat, ctx, id);
      var name = String(z.name);
      var n = bZahl(pos.anzahl, 'Die Anzahl bei "' + name + '"');
      var d = bDefekt(pos.defekt, 'Der Wert "defekt" bei "' + name + '"');
      var typ = bTyp(z);
      var hatBestand = String(z.anzahl).trim() !== '' && !isNaN(Number(z.anzahl));
      var bestand = hatBestand ? Number(z.anzahl) : 0;
      var inaktiv = z.aktiv === false || String(z.aktiv).toUpperCase() === 'FALSE';
      var out = draussen[id] || 0;

      var eintrag = { id: id, z: z, neu: null, buchungen: [] };

      if (art === 'mitgenommen') {
        if (d > 0) fehler('ungueltig', '"Defekt" gibt es nur bei der Rückgabe ("' + name + '").');
        if (inaktiv) fehler('ungueltig', '"' + name + '" ist nicht aktiv und kann nicht mitgenommen werden.');
        if (typ === 'fest') {
          if (hatBestand && n > bRunde(bestand - out)) {
            fehler('zuwenig', 'Von "' + name + '" sind nur ' + bRunde(bestand - out) + ' verfügbar.');
          }
        } else {
          if (!hatBestand || n > bestand) {
            fehler('zuwenig', 'Von "' + name + '" sind nur ' + (hatBestand ? bestand : 0) + ' da.');
          }
          eintrag.neu = bRunde(bestand - n);
        }
        eintrag.buchungen.push({ art: 'mitgenommen', anzahl: n });
      } else {
        if (d > n) fehler('ungueltig', 'Bei "' + name + '" darf "davon defekt" nicht größer sein als die Anzahl.');
        if (typ === 'fest') {
          if (n > out) fehler('zuwenig', 'Von "' + name + '" sind nur ' + out + ' ausgeliehen.');
          if (n - d > 0) eintrag.buchungen.push({ art: 'zurueck', anzahl: bRunde(n - d) });
          if (d > 0) {
            eintrag.buchungen.push({ art: 'defekt', anzahl: d });
            if (hatBestand) eintrag.neu = Math.max(0, bRunde(bestand - d));
          }
        } else {
          if (d > 0) fehler('ungueltig', 'Bei Verbrauchsmaterial ("' + name + '") gibt es kein "defekt".');
          eintrag.neu = bRunde(bestand + n);
          eintrag.buchungen.push({ art: 'zurueck', anzahl: n });
        }
      }
      plan.push(eintrag);
    });

    // 2) Ausleihe-Zeilen anhängen
    var zeit = jetzt();
    var eintraege = [];
    plan.forEach(function (pl) {
      pl.buchungen.forEach(function (b) {
        eintraege.push(neuerEintrag('Ausleihe', ctx, {
          material_id: pl.id,
          projekt_id: projekt,
          person: person,
          art: b.art,
          anzahl: b.anzahl,
          datum: datum,
          notiz: notiz
        }, anzeige, zeit));
      });
    });
    anhaengen(ausl.sh, eintraege.map(function (o) { return zeilenArray(ausl.kopf, o); }));

    // 3) anzahl im Tab Material anpassen
    var spAnzahl = mat.kopf.indexOf('anzahl') + 1;
    var spAm = mat.kopf.indexOf('geaendert_am') + 1;
    var spVon = mat.kopf.indexOf('geaendert_von') + 1;
    var geaendert = [];
    plan.forEach(function (pl) {
      if (pl.neu === null) return;
      mat.sh.getRange(pl.z._zeile, spAnzahl).setValue(pl.neu);
      mat.sh.getRange(pl.z._zeile, spAm).setValue(zeit);
      mat.sh.getRange(pl.z._zeile, spVon).setValue(schuetzen(anzeige));
      geaendert.push({ id: pl.id, anzahl: pl.neu });
    });

    protokoll(ctx, 'buchen', 'Ausleihe', eintraege.map(function (o) { return o.id; }), anzeige);
    if (geaendert.length) {
      protokoll(ctx, 'update', 'Material', geaendert.map(function (g) { return g.id; }), anzeige);
    }
    return { eintraege: eintraege, material: geaendert };
  });
}

// ---- Tests für den Editor (Funktion auswählen, dann "Ausführen") ----

function testMaterial() {
  var g = lies('Gruppen').zeilen[0];
  var m = lies('Material').zeilen.filter(function (z) {
    return String(z.gruppe_id) === String(g.gruppe_id) && !truthy(z.geloescht) && Number(z.anzahl) >= 1;
  })[0];
  return { ctx: { gruppe_id: g.gruppe_id }, m: m };
}

// Bucht 1 Stück mit und gleich wieder zurück. Ergebnis steht im Ausführungsprotokoll.
function testenBuchen() {
  var t = testMaterial();
  if (!t.m) { Logger.log('Kein Material mit Anzahl ab 1 in der ersten Gruppe gefunden.'); return; }
  var r1 = aktionBuchen(t.ctx, {
    art: 'mitgenommen', person: 'Test', anzeigename: 'Test (Editor)',
    positionen: [{ material_id: t.m.id, anzahl: 1 }]
  });
  Logger.log('Mitnahme ' + t.m.name + ': ' + r1.eintraege.length + ' Zeile(n), Anzahl geändert: ' + JSON.stringify(r1.material));
  var r2 = aktionBuchen(t.ctx, {
    art: 'zurueck', person: 'Test', anzeigename: 'Test (Editor)',
    positionen: [{ material_id: t.m.id, anzahl: 1 }]
  });
  Logger.log('Rückgabe ' + t.m.name + ': ' + r2.eintraege.length + ' Zeile(n), Anzahl geändert: ' + JSON.stringify(r2.material));
}

// Versucht viel zu viel mitzunehmen. Es muss eine Fehlermeldung kommen.
function testenBuchenZuViel() {
  var t = testMaterial();
  if (!t.m) { Logger.log('Kein Material mit Anzahl ab 1 in der ersten Gruppe gefunden.'); return; }
  try {
    aktionBuchen(t.ctx, {
      art: 'mitgenommen', person: 'Test', anzeigename: 'Test (Editor)',
      positionen: [{ material_id: t.m.id, anzahl: 999999 }]
    });
    Logger.log('FEHLER: Die Buchung wurde nicht abgelehnt!');
  } catch (e) {
    Logger.log('Gut, abgelehnt mit: ' + e.message);
  }
}

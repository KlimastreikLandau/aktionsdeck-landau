// Ausleihe.gs – Aktion "buchen": mehrere Materialien auf einmal mitnehmen oder zurückgeben.
// Läuft in einer Sperre, prüft die Mengen selbst und passt "anzahl" im Tab Material an.
//
// Aufruf: { aktion:'buchen', art:'mitgenommen'|'zurueck', person, datum, projekt_id, notiz,
//           positionen:[{ material_id, anzahl, defekt, projekt_id }] }
//   projekt_id je Position (freiwillig) gilt vor dem projekt_id der ganzen Buchung. Leer = ohne Projekt.
//
// Festes Material (typ fest oder leer): anzahl = Bestand. Ausgeliehen = mitgenommen - zurueck - defekt.
//   Mitnehmen nur bis (Bestand - ausgeliehen insgesamt). "defekt" gibt es nur bei der Rückgabe, es senkt den Bestand.
//   Bei der Rückgabe ist "anzahl" die Gesamtzahl, "defekt" der Teil davon, der kaputt ist.
//   Rückgabe wird PRO PROJEKT geprüft: Es kann nur zurück, was für genau dieses Projekt
//   (oder "ohne Projekt") ausgeliehen wurde. Alte Buchungen ohne Projekt zählen als "ohne Projekt".
// Verbrauchsmaterial (typ verbrauch): anzahl = aktueller Vorrat.
//   Mitnehmen senkt anzahl. Rückgabe ist der Rest und erhöht anzahl.
// Ein Material darf mehrfach in einer Buchung stehen, aber nur einmal je Projekt.
// Für abgeschlossene Projekte (erledigt, archiviert) kann nichts mitgenommen werden, nur zurückgegeben.

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

// Pro Material und Projekt: mitgenommen minus zurueck minus defekt (nur diese Gruppe).
// Ergebnis: { materialId: { projektId: menge } }. projektId '' = ohne Projekt.
function bAusgeliehenProjekt(zeilen, gid) {
  var m = {};
  zeilen.forEach(function (a) {
    if (String(a.gruppe_id) !== String(gid) || truthy(a.geloescht)) return;
    var id = String(a.material_id);
    var pid = String(a.projekt_id === undefined || a.projekt_id === null ? '' : a.projekt_id).trim();
    var n = Number(a.anzahl);
    if (isNaN(n)) n = 0;
    var d;
    if (a.art === 'mitgenommen') d = n;
    else if (a.art === 'zurueck' || a.art === 'defekt') d = -n;
    else return;
    if (!m[id]) m[id] = {};
    m[id][pid] = (m[id][pid] || 0) + d;
  });
  Object.keys(m).forEach(function (id) {
    Object.keys(m[id]).forEach(function (pid) { m[id][pid] = bRunde(m[id][pid]); });
  });
  return m;
}

// Summe über alle Projekte (wie früher: mitgenommen minus zurueck minus defekt)
function bGesamt(proProjekt) {
  var s = 0;
  Object.keys(proProjekt).forEach(function (pid) { s += proProjekt[pid]; });
  return bRunde(s);
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
  var standardProjekt = typisieren(p.projekt_id, 'projekt_id').trim();
  var notiz = typisieren(p.notiz, 'notiz');
  var anzeige = anzeigename(p);

  return mitSperre(function () {
    var mat = lies('Material');
    pruefeKopf('Material', mat.kopf);
    var ausl = lies('Ausleihe');
    pruefeKopf('Ausleihe', ausl.kopf);
    var projekte = lies('Projekte');
    pruefeKopf('Projekte', projekte.kopf);
    var draussen = bAusgeliehenProjekt(ausl.zeilen, ctx.gruppe_id);

    // 1) Alles prüfen und planen. Geschrieben wird erst danach.
    var gesehen = {};
    var stand = {};   // je Material: laufender Stand innerhalb dieser Buchung
    var reihe = [];   // Material-IDs in der Reihenfolge des ersten Auftretens
    var plan = [];

    p.positionen.forEach(function (pos) {
      if (!pos || typeof pos !== 'object') fehler('ungueltig', 'Eine Zeile der Liste ist ungültig.');
      var id = String(pos.material_id === undefined || pos.material_id === null ? '' : pos.material_id);
      var pid = (pos.projekt_id === undefined || pos.projekt_id === null)
        ? standardProjekt
        : typisieren(pos.projekt_id, 'projekt_id').trim();
      var schluessel = id + '|' + pid;
      if (gesehen[schluessel]) fehler('ungueltig', 'Ein Material steht für dasselbe Projekt doppelt in der Liste.');
      gesehen[schluessel] = true;

      var z = eintragFinden(mat, ctx, id);
      var name = String(z.name);
      var projektZ = pid ? projektAus(projekte, ctx, pid) : null;
      var wo = projektZ ? 'Projekt "' + String(projektZ.titel) + '"' : 'ohne Projekt';
      var n = bZahl(pos.anzahl, 'Die Anzahl bei "' + name + '"');
      var d = bDefekt(pos.defekt, 'Der Wert "defekt" bei "' + name + '"');

      if (!stand[id]) {
        var hatB = String(z.anzahl).trim() !== '' && !isNaN(Number(z.anzahl));
        stand[id] = {
          z: z,
          typ: bTyp(z),
          hatBestand: hatB,
          bestand: hatB ? Number(z.anzahl) : 0,
          out: bGesamt(draussen[id] || {}),
          geaendert: false
        };
        reihe.push(id);
      }
      var s = stand[id];
      var inaktiv = z.aktiv === false || String(z.aktiv).toUpperCase() === 'FALSE';
      var eintrag = { id: id, pid: pid, buchungen: [] };

      if (art === 'mitgenommen') {
        if (d > 0) fehler('ungueltig', '"Defekt" gibt es nur bei der Rückgabe ("' + name + '").');
        if (inaktiv) fehler('ungueltig', '"' + name + '" ist nicht aktiv und kann nicht mitgenommen werden.');
        if (projektZ) {
          var st = String(projektZ.status || '').trim();
          if (st === 'erledigt' || st === 'archiviert') {
            fehler('ungueltig', 'Das Projekt "' + String(projektZ.titel) + '" ist abgeschlossen. Dafür kann nichts mitgenommen werden.');
          }
        }
        if (s.typ === 'fest') {
          var frei = bRunde(s.bestand - s.out);
          if (s.hatBestand && n > frei) {
            fehler('zuwenig', 'Von "' + name + '" sind nur ' + Math.max(0, frei) + ' verfügbar.');
          }
          s.out = bRunde(s.out + n);
        } else {
          if (!s.hatBestand || n > s.bestand) {
            fehler('zuwenig', 'Von "' + name + '" sind nur ' + (s.hatBestand ? s.bestand : 0) + ' da.');
          }
          s.bestand = bRunde(s.bestand - n);
          s.geaendert = true;
        }
        eintrag.buchungen.push({ art: 'mitgenommen', anzahl: n });
      } else {
        if (d > n) fehler('ungueltig', 'Bei "' + name + '" darf "davon defekt" nicht größer sein als die Anzahl.');
        if (s.typ === 'fest') {
          var imProjekt = Math.max(0, bRunde((draussen[id] || {})[pid] || 0));
          if (n > imProjekt) {
            fehler('zuwenig', (pid ? 'Für ' + wo : 'Ohne Projekt') + ' sind von "' + name + '" nur ' + imProjekt + ' ausgeliehen.');
          }
          if (n - d > 0) eintrag.buchungen.push({ art: 'zurueck', anzahl: bRunde(n - d) });
          if (d > 0) {
            eintrag.buchungen.push({ art: 'defekt', anzahl: d });
            if (s.hatBestand) {
              s.bestand = Math.max(0, bRunde(s.bestand - d));
              s.geaendert = true;
            }
          }
          s.out = bRunde(s.out - n);
        } else {
          if (d > 0) fehler('ungueltig', 'Bei Verbrauchsmaterial ("' + name + '") gibt es kein "defekt".');
          s.bestand = bRunde(s.bestand + n);
          s.geaendert = true;
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
          projekt_id: pl.pid,
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
    reihe.forEach(function (id) {
      var s = stand[id];
      if (!s.geaendert) return;
      var neu = bRunde(s.bestand);
      mat.sh.getRange(s.z._zeile, spAnzahl).setValue(neu);
      mat.sh.getRange(s.z._zeile, spAm).setValue(zeit);
      mat.sh.getRange(s.z._zeile, spVon).setValue(schuetzen(anzeige));
      geaendert.push({ id: id, anzahl: neu });
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

// Mit Projekt: 1 Stück festes Material für das erste Projekt der Gruppe mitnehmen,
// Rückgabe "ohne Projekt" muss abgelehnt werden, Rückgabe fürs Projekt muss klappen.
function testenBuchenProjekt() {
  var g = lies('Gruppen').zeilen[0];
  var ctx = { gruppe_id: g.gruppe_id };
  var m = lies('Material').zeilen.filter(function (z) {
    return String(z.gruppe_id) === String(g.gruppe_id) && !truthy(z.geloescht) &&
      bTyp(z) === 'fest' && Number(z.anzahl) >= 1 && String(z.aktiv).toUpperCase() !== 'FALSE';
  })[0];
  if (!m) { Logger.log('Kein festes Material mit Anzahl ab 1 in der ersten Gruppe gefunden.'); return; }
  var pr = lies('Projekte').zeilen.filter(function (z) {
    return String(z.gruppe_id) === String(g.gruppe_id) && !truthy(z.geloescht) &&
      ['erledigt', 'archiviert'].indexOf(String(z.status).trim()) < 0;
  })[0];
  if (!pr) { Logger.log('Kein offenes Projekt in der ersten Gruppe gefunden (z. B. ptest1 im Tab Projekte).'); return; }

  try {
    aktionBuchen(ctx, {
      art: 'mitgenommen', person: 'Test', anzeigename: 'Test (Editor)', projekt_id: pr.id,
      positionen: [{ material_id: m.id, anzahl: 1 }]
    });
    Logger.log('1) Mitnahme ' + m.name + ' für Projekt ' + pr.titel + ': OK');
  } catch (e) {
    Logger.log('1) FEHLER bei der Mitnahme: ' + e.message);
    return;
  }

  try {
    aktionBuchen(ctx, {
      art: 'zurueck', person: 'Test', anzeigename: 'Test (Editor)',
      positionen: [{ material_id: m.id, anzahl: 1 }]
    });
    Logger.log('2) FEHLER: Rückgabe ohne Projekt wurde nicht abgelehnt!');
  } catch (e2) {
    Logger.log('2) Gut, abgelehnt mit: ' + e2.message);
  }

  try {
    aktionBuchen(ctx, {
      art: 'zurueck', person: 'Test', anzeigename: 'Test (Editor)',
      positionen: [{ material_id: m.id, anzahl: 1, projekt_id: pr.id }]
    });
    Logger.log('3) Rückgabe fürs Projekt: OK');
  } catch (e3) {
    Logger.log('3) FEHLER bei der Rückgabe fürs Projekt: ' + e3.message);
  }
}

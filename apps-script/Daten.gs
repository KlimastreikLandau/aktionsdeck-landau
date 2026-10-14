// Daten.gs – bootstrap, list, create, update, delete, batchCreate.
// Jeder Schreibzugriff läuft in einer Sperre. Es sieht nur Daten der eigenen Gruppe.

function tabelleCheck(name) {
  if (typeof name !== 'string' || !TABELLEN.hasOwnProperty(name)) fehler('ungueltig', 'Unbekannte Tabelle.');
  return name;
}

function nurWennAenderbar(tab) {
  if (NUR_ANHAENGEN.indexOf(tab) >= 0) {
    fehler('ungueltig', 'In "' + tab + '" wird nur angehängt, nichts geändert oder gelöscht.');
  }
}

// Ausleihe wird nur über die Aktion "buchen" geschrieben (dort werden die Mengen geprüft).
function nurPerBuchen(tab) {
  if (tab === 'Ausleihe') {
    fehler('ungueltig', 'Die Ausleihe wird nur über "buchen" geschrieben.');
  }
}

function pruefeFelder(tab, daten) {
  if (!daten || typeof daten !== 'object' || Array.isArray(daten)) fehler('ungueltig', 'Daten fehlen.');
  Object.keys(daten).forEach(function (k) {
    if (TABELLEN[tab].indexOf(k) < 0) fehler('ungueltig', 'Unbekanntes Feld: ' + k);
  });
}

function neuerEintrag(tab, ctx, daten, anzeige, zeit) {
  pruefeFelder(tab, daten);
  var o = {
    id: 'i' + Utilities.getUuid().replace(/-/g, '').slice(0, 12),
    gruppe_id: ctx.gruppe_id,
    erstellt_am: zeit, erstellt_von: anzeige,
    geaendert_am: zeit, geaendert_von: anzeige,
    geloescht: false
  };
  TABELLEN[tab].forEach(function (sp) { o[sp] = typisieren(daten[sp], sp); });
  return o;
}

function zeilenArray(kopf, o) {
  return kopf.map(function (k) { return schuetzen(o[k] === undefined ? '' : o[k]); });
}

function eintragFinden(t, ctx, id) {
  for (var i = 0; i < t.zeilen.length; i++) {
    var z = t.zeilen[i];
    if (String(z.id) === String(id) && String(z.gruppe_id) === String(ctx.gruppe_id) && !truthy(z.geloescht)) return z;
  }
  fehler('nicht_gefunden', 'Eintrag nicht gefunden (vielleicht wurde er gelöscht).');
}

function konfliktPruefen(z, bekannt) {
  if (bekannt === undefined || bekannt === null) return;
  if (String(bekannt) !== String(z.geaendert_am)) {
    fehler('konflikt', 'Jemand anderes hat diesen Eintrag inzwischen geändert.', { aktuell: sauber(z) });
  }
}

// ---- Lesen ----

function listeFuerGruppe(tab, gid, seit) {
  return lies(tab).zeilen.filter(function (z) {
    if (String(z.gruppe_id) !== String(gid)) return false;
    if (seit) return String(z.geaendert_am) >= seit;   // inkl. gelöschter, damit die App sie entfernen kann
    return !truthy(z.geloescht);
  }).map(sauber);
}

function aktionBootstrap(ctx, p) {
  var zeit = jetzt();
  return {
    gruppe: gruppeOeffentlich(ctx.gruppe),
    zugang_id: ctx.zugang_id,
    serverzeit: zeit,
    personen: listeFuerGruppe('Personen', ctx.gruppe_id, ''),
    einstellungen: lies('Einstellungen').zeilen.map(sauber)
  };
}

function aktionList(ctx, p) {
  var tab = tabelleCheck(p.tabelle);
  var zeit = jetzt();
  var seit = p.seit ? String(p.seit) : '';
  return { zeilen: listeFuerGruppe(tab, ctx.gruppe_id, seit), serverzeit: zeit };
}

// ---- Schreiben ----

function aktionCreate(ctx, p) {
  var tab = tabelleCheck(p.tabelle);
  nurPerBuchen(tab);
  var anzeige = anzeigename(p);
  return mitSperre(function () {
    var sh = blatt(tab);
    var kopf = kopfLesen(sh);
    pruefeKopf(tab, kopf);
    var o = neuerEintrag(tab, ctx, p.daten, anzeige, jetzt());
    anhaengen(sh, [zeilenArray(kopf, o)]);
    protokoll(ctx, 'create', tab, [o.id], anzeige);
    return o;
  });
}

function aktionBatchCreate(ctx, p) {
  var tab = tabelleCheck(p.tabelle);
  nurPerBuchen(tab);
  var anzeige = anzeigename(p);
  if (!Array.isArray(p.liste) || p.liste.length < 1 || p.liste.length > 200) {
    fehler('ungueltig', 'Die Liste muss 1 bis 200 Einträge haben.');
  }
  return mitSperre(function () {
    var sh = blatt(tab);
    var kopf = kopfLesen(sh);
    pruefeKopf(tab, kopf);
    var zeit = jetzt();
    var eintraege = p.liste.map(function (d) { return neuerEintrag(tab, ctx, d, anzeige, zeit); });
    anhaengen(sh, eintraege.map(function (o) { return zeilenArray(kopf, o); }));
    protokoll(ctx, 'batchCreate', tab, eintraege.map(function (o) { return o.id; }), anzeige);
    return eintraege;
  });
}

function aktionUpdate(ctx, p) {
  var tab = tabelleCheck(p.tabelle);
  nurWennAenderbar(tab);
  var anzeige = anzeigename(p);
  return mitSperre(function () {
    var t = lies(tab);
    pruefeKopf(tab, t.kopf);
    var z = eintragFinden(t, ctx, p.id);
    konfliktPruefen(z, p.bekannt);
    pruefeFelder(tab, p.daten);

    // nur geänderte Felder
    var neu = {};
    Object.keys(p.daten).forEach(function (sp) {
      var wert = typisieren(p.daten[sp], sp);
      if (String(wert) !== String(z[sp])) neu[sp] = wert;
    });
    if (!Object.keys(neu).length) return { eintrag: sauber(z), geaendert: false };

    var zeit = jetzt();
    neu.geaendert_am = zeit;
    neu.geaendert_von = anzeige;
    Object.keys(neu).forEach(function (sp) {
      t.sh.getRange(z._zeile, t.kopf.indexOf(sp) + 1).setValue(schuetzen(neu[sp]));
      z[sp] = neu[sp];
    });
    protokoll(ctx, 'update', tab, [z.id], anzeige);
    return { eintrag: sauber(z), geaendert: true };
  });
}

// Weiches Löschen: geloescht = TRUE
function aktionDelete(ctx, p) {
  var tab = tabelleCheck(p.tabelle);
  nurWennAenderbar(tab);
  var anzeige = anzeigename(p);
  return mitSperre(function () {
    var t = lies(tab);
    pruefeKopf(tab, t.kopf);
    var z = eintragFinden(t, ctx, p.id);
    konfliktPruefen(z, p.bekannt);
    var zeit = jetzt();
    var neu = { geloescht: true, geaendert_am: zeit, geaendert_von: anzeige };
    Object.keys(neu).forEach(function (sp) {
      t.sh.getRange(z._zeile, t.kopf.indexOf(sp) + 1).setValue(schuetzen(neu[sp]));
      z[sp] = neu[sp];
    });
    protokoll(ctx, 'delete', tab, [z.id], anzeige);
    return { eintrag: sauber(z) };
  });
}

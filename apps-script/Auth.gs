// Auth.gs – Gruppen, Login, Token, Sperre bei Fehlversuchen.

var MAX_FEHLVERSUCHE = 8;
var FENSTER_MS = 15 * 60 * 1000;
var SPERRE_MS = 15 * 60 * 1000;
var TOKEN_TAGE = 14;

function gruppeSuchen(kennung, nurId) {
  var k = String(kennung || '').trim().toLowerCase();
  if (!k) return null;
  var zeilen = lies('Gruppen').zeilen;
  for (var i = 0; i < zeilen.length; i++) {
    var z = zeilen[i];
    if (!truthy(z.aktiv)) continue;
    if (String(z.gruppe_id).toLowerCase() === k) return z;
    if (!nurId && String(z.kurzname).toLowerCase() === k) return z;
  }
  return null;
}

function gruppeOeffentlich(z) {
  return { gruppe_id: z.gruppe_id, name: z.name, kurzname: z.kurzname, farbe: z.farbe };
}

// API "gruppen" (ohne Login): nur Name, Kurzname, Farbe
function aktionGruppen(p) {
  var liste = lies('Gruppen').zeilen.filter(function (z) { return truthy(z.aktiv); });
  liste.sort(function (a, b) { return Number(a.sortierung) - Number(b.sortierung); });
  return liste.map(gruppeOeffentlich);
}

function zugangGueltig(z) {
  if (!truthy(z.aktiv)) return false;
  if (!z.gueltig_bis) return true;
  return String(z.gueltig_bis).slice(0, 10) >= jetzt().slice(0, 10);
}

function zugangFinden(gid, pin) {
  var zeilen = lies('Zugang').zeilen;
  for (var i = 0; i < zeilen.length; i++) {
    var z = zeilen[i];
    if (String(z.gruppe_id) !== String(gid) || !zugangGueltig(z)) continue;
    if (z.pin_salt && z.pin_hash && gleich(pinHash(String(z.pin_salt), pin), z.pin_hash)) return z;
  }
  return null;
}

// ---- Sperre pro Gruppe ----

function pruefeSperre(gid) {
  var bis = Number(PropertiesService.getScriptProperties().getProperty('sperre_' + gid) || 0);
  if (bis > Date.now()) {
    var min = Math.ceil((bis - Date.now()) / 60000);
    fehler('gesperrt', 'Zu viele Fehlversuche. Bitte in ca. ' + min + ' Minuten noch einmal versuchen.');
  }
}

// Gibt true zurück, wenn die Gruppe jetzt gesperrt wurde
function fehlversuchMerken(gid) {
  var props = PropertiesService.getScriptProperties();
  var jetztMs = Date.now();
  var liste = JSON.parse(props.getProperty('fail_' + gid) || '[]')
    .filter(function (t) { return jetztMs - t < FENSTER_MS; });
  liste.push(jetztMs);
  var gesperrt = liste.length >= MAX_FEHLVERSUCHE;
  if (gesperrt) {
    props.setProperty('sperre_' + gid, String(jetztMs + SPERRE_MS));
    liste = [];
  }
  props.setProperty('fail_' + gid, JSON.stringify(liste));
  return gesperrt;
}

// ---- Login ----

function aktionLogin(p) {
  var g = gruppeSuchen(p.gruppe, false);
  if (!g) fehler('login', 'Gruppe nicht gefunden.');
  var pin = String(p.pin === undefined || p.pin === null ? '' : p.pin).slice(0, 200);
  var anzeige = anzeigename(p);
  var ctx = { gruppe_id: g.gruppe_id };

  return mitSperre(function () {
    pruefeSperre(g.gruppe_id);
    var z = zugangFinden(g.gruppe_id, pin);
    if (!z) {
      var gesperrt = fehlversuchMerken(g.gruppe_id);
      protokoll(ctx, 'login_fehler', '', [''], anzeige);
      if (gesperrt) fehler('gesperrt', 'Zu viele Fehlversuche. Die Gruppe ist 15 Minuten gesperrt.');
      fehler('login', 'PIN falsch.');
    }
    PropertiesService.getScriptProperties().deleteProperty('fail_' + g.gruppe_id);
    protokoll(ctx, 'login', '', [''], anzeige);
    return {
      token: tokenAusstellen(g.gruppe_id, z.zugang_id),
      gruppe: gruppeOeffentlich(g),
      zugang_id: z.zugang_id
    };
  });
}

// ---- Token (HMAC-signiert, 14 Tage) ----

function tokenAusstellen(gid, zid) {
  var daten = { g: gid, z: zid, exp: Date.now() + TOKEN_TAGE * 86400000 };
  var teil = Utilities.base64EncodeWebSafe(JSON.stringify(daten));
  return teil + '.' + signiere(teil);
}

// Prüft Signatur, Ablauf, Gruppe und Zugang. Gibt {gruppe, gruppe_id, zugang_id} zurück.
function tokenPruefen(token) {
  var weg = 'Bitte neu anmelden.';
  if (typeof token !== 'string') fehler('auth', weg);
  var teile = token.split('.');
  if (teile.length !== 2 || !gleich(signiere(teile[0]), teile[1])) fehler('auth', weg);
  var d;
  try {
    d = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(teile[0])).getDataAsString());
  } catch (e) { fehler('auth', weg); }
  if (!d || !d.exp || d.exp < Date.now()) fehler('auth', 'Die Anmeldung ist abgelaufen. Bitte neu anmelden.');

  var g = gruppeSuchen(d.g, true);
  if (!g) fehler('auth', weg);
  var zeilen = lies('Zugang').zeilen;
  for (var i = 0; i < zeilen.length; i++) {
    var z = zeilen[i];
    if (String(z.zugang_id) === String(d.z) && String(z.gruppe_id) === String(g.gruppe_id) && zugangGueltig(z)) {
      return { gruppe: g, gruppe_id: g.gruppe_id, zugang_id: z.zugang_id };
    }
  }
  fehler('auth', weg);
}

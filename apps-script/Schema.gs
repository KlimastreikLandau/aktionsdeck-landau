// Schema.gs – Beschreibung aller Tabs.
// Neue Tabelle = nur einen Eintrag in TABELLEN ergänzen (und später in js/schema.js).

var BASIS = ['id', 'gruppe_id', 'erstellt_am', 'erstellt_von',
             'geaendert_am', 'geaendert_von', 'geloescht'];

// Daten-Tabs: nur die eigenen Spalten (BASIS kommt automatisch davor)
var TABELLEN = {
  Personen: ['name', 'aktiv'],
  Material: ['name', 'kategorie', 'unterkategorie', 'anzahl', 'einheit', 'ort', 'foto_id', 'notiz', 'aktiv'],
  Ausleihe: ['material_id', 'projekt_id', 'person', 'art', 'anzahl', 'datum', 'notiz'],
  ToDos: ['projekt_id', 'post_id', 'text', 'verantwortlich', 'faellig_am', 'erledigt', 'erledigt_am', 'erledigt_von', 'prioritaet', 'sortierung'],
  Projekte: ['titel', 'beschreibung', 'ort', 'status', 'start_datum', 'aktionsdatum', 'deadline', 'budget_geplant'],
  Meilensteine: ['projekt_id', 'titel', 'datum', 'verantwortlich', 'erledigt'],
  Projekt_Team: ['projekt_id', 'person', 'zustaendigkeit'],
  Projekt_Material: ['projekt_id', 'material_id', 'name', 'kategorie', 'menge', 'beschaffung', 'beschafft', 'notiz'],
  Finanzen: ['projekt_id', 'projekt_material_id', 'posten', 'art', 'menge', 'einzelpreis', 'betrag_geplant', 'betrag_tatsaechlich', 'bezahlt', 'bezahlt_von', 'datum', 'beleg_id'],
  Posts: ['projekt_id', 'titel', 'plattform', 'format', 'text', 'medien_id', 'veroeffentlichung_am', 'status', 'verantwortlich'],
  Vorlagen_ToDo: ['vorlage_name', 'schritt_text', 'tage_vorher', 'verantwortlich']
};

// System-Tabs (über die API nicht direkt änderbar)
var SYSTEM = {
  Gruppen: ['gruppe_id', 'name', 'kurzname', 'farbe', 'sortierung', 'aktiv'],
  Zugang: ['zugang_id', 'gruppe_id', 'pin_salt', 'pin_hash', 'aktiv', 'gueltig_bis'],
  Einstellungen: ['schluessel', 'wert'],
  Log: ['zeit', 'gruppe_id', 'aktion', 'tabelle', 'datensatz_id', 'anzeigename']
};

// Tabs, in die nur angehängt wird (kein Ändern, kein Löschen)
var NUR_ANHAENGEN = ['Ausleihe'];

// Spaltentypen: alles andere ist Text
var ZAHL_SPALTEN = ['anzahl', 'menge', 'einzelpreis', 'betrag_geplant',
                    'betrag_tatsaechlich', 'budget_geplant', 'sortierung', 'tage_vorher'];
var BOOL_SPALTEN = ['aktiv', 'geloescht', 'erledigt', 'beschafft', 'bezahlt'];

function spaltenTyp(sp) {
  if (ZAHL_SPALTEN.indexOf(sp) >= 0) return 'zahl';
  if (BOOL_SPALTEN.indexOf(sp) >= 0) return 'bool';
  return 'text';
}

function spaltenListe(tab) {
  if (SYSTEM.hasOwnProperty(tab)) return SYSTEM[tab];
  return BASIS.concat(TABELLEN[tab]);
}

// EINMAL ausführen: stellt Text-Spalten auf "Nur Text", damit Google
// keine IDs, Zeitstempel oder Datumswerte selbst umwandelt.
function formatieren() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var namen = Object.keys(SYSTEM).concat(Object.keys(TABELLEN));
  namen.forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) return;
    if (sh.getMaxRows() < 2) sh.insertRowsAfter(1, 998);
    var kopf = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    kopf.forEach(function (sp, i) {
      if (spaltenTyp(String(sp)) === 'text') {
        sh.getRange(2, i + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@');
      }
    });
  });
  Logger.log('Formatierung fertig.');
} 

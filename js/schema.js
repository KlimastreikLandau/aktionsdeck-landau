// js/schema.js
// Beschreibung der Tabs für die Oberfläche. Gegenstück zu Schema.gs.
// Neue Tabelle = nur einen Eintrag in SCHEMA ergänzen.

export const SCHEMA = {
  Material: {
    titel: 'Material',
    felder: [
      { name: 'name', label: 'Name', typ: 'text', pflicht: true },
      { name: 'kategorie', label: 'Kategorie', typ: 'text' },
      { name: 'unterkategorie', label: 'Unterkategorie', typ: 'text' },
      { name: 'typ', label: 'Art (fest = Pavillon, verbrauch = Flyer)', typ: 'auswahl', optionen: ['fest', 'verbrauch'] },
      { name: 'anzahl', label: 'Anzahl', typ: 'zahl' },
      { name: 'einheit', label: 'Einheit', typ: 'text' },
      { name: 'ort', label: 'Ort', typ: 'text' },
      { name: 'foto_id', label: 'Foto', typ: 'foto' },
      { name: 'notiz', label: 'Notiz', typ: 'langtext' },
      { name: 'aktiv', label: 'Aktiv', typ: 'bool' }
    ]
  },
  Ausleihe: {
    titel: 'Ausleihe',
    felder: [
      { name: 'material_id', label: 'Material', typ: 'text', pflicht: true },
      { name: 'projekt_id', label: 'Projekt', typ: 'text' },
      { name: 'person', label: 'Person', typ: 'text' },
      { name: 'art', label: 'Art', typ: 'auswahl', optionen: ['mitgenommen', 'zurueck', 'defekt'] },
      { name: 'anzahl', label: 'Anzahl', typ: 'zahl', pflicht: true },
      { name: 'datum', label: 'Datum', typ: 'text' },
      { name: 'notiz', label: 'Notiz', typ: 'langtext' }
    ]
  },
  ToDos: {
    titel: 'ToDos',
    felder: [
      { name: 'text', label: 'Titel', typ: 'text', pflicht: true },
      { name: 'details', label: 'Weitere Informationen (freiwillig)', typ: 'langtext' },
      { name: 'verantwortlich', label: 'Verantwortlich (leer = Hut noch frei)', typ: 'text' },
      { name: 'faellig_am', label: 'Fällig am', typ: 'datum' },
      { name: 'prioritaet', label: 'Priorität', typ: 'auswahl', optionen: ['hoch', 'normal', 'niedrig'] }
    ]
  },
  Projekte: {
    titel: 'Projekte',
    felder: [
      { name: 'titel', label: 'Titel', typ: 'text', pflicht: true },
      { name: 'beschreibung', label: 'Beschreibung', typ: 'langtext' },
      { name: 'ort', label: 'Ort', typ: 'text' },
      { name: 'aktionsart', label: 'Aktionsart (z. B. Demo, Infostand)', typ: 'text' },
      { name: 'status', label: 'Status', typ: 'auswahl', optionen: ['planung', 'aktiv', 'erledigt', 'archiviert'] },
      { name: 'start_datum', label: 'Start', typ: 'datum' },
      { name: 'aktionsdatum', label: 'Aktionsdatum', typ: 'datum' },
      { name: 'deadline', label: 'Deadline', typ: 'datum' },
      { name: 'budget_geplant', label: 'Geplantes Budget (€)', typ: 'zahl' }
    ]
  },
  Meilensteine: {
    titel: 'Meilensteine',
    felder: [
      { name: 'titel', label: 'Titel', typ: 'text', pflicht: true },
      { name: 'datum', label: 'Datum', typ: 'datum' },
      { name: 'verantwortlich', label: 'Verantwortlich', typ: 'text' }
    ]
  },
  Projekt_Team: {
    titel: 'Team',
    felder: [
      { name: 'person', label: 'Person', typ: 'text', pflicht: true },
      { name: 'zustaendigkeit', label: 'Hut (Zuständigkeit)', typ: 'text' }
    ]
  },
  Projekt_Material: {
    titel: 'Material im Projekt',
    felder: [
      { name: 'name', label: 'Name', typ: 'text', pflicht: true },
      { name: 'kategorie', label: 'Kategorie', typ: 'text' },
      { name: 'menge', label: 'Menge', typ: 'zahl', pflicht: true },
      { name: 'beschaffung', label: 'Beschaffung', typ: 'auswahl', optionen: ['vorhanden', 'kaufen', 'mieten', 'leihen'] },
      { name: 'notiz', label: 'Notiz', typ: 'langtext' }
    ]
  },
  Finanzen: {
    titel: 'Finanzen',
    felder: [
      { name: 'posten', label: 'Posten', typ: 'text', pflicht: true },
      { name: 'art', label: 'Art', typ: 'auswahl', optionen: ['kauf', 'miete', 'sonstiges'] },
      { name: 'menge', label: 'Menge', typ: 'zahl' },
      { name: 'einzelpreis', label: 'Einzelpreis (€)', typ: 'zahl' },
      { name: 'betrag_geplant', label: 'Geplant (€)', typ: 'zahl' },
      { name: 'betrag_tatsaechlich', label: 'Tatsächlich (€)', typ: 'zahl' },
      { name: 'bezahlt_von', label: 'Bezahlt von', typ: 'text' },
      { name: 'datum', label: 'Datum', typ: 'datum' },
      { name: 'beleg_id', label: 'Beleg / Hinweis (z. B. Link, keine Kontonummern)', typ: 'text' }
    ]
  },
  Protokolle: {
    titel: 'Protokoll',
    felder: [
      { name: 'datum', label: 'Datum', typ: 'datum' },
      { name: 'titel', label: 'Titel', typ: 'text', pflicht: true },
      { name: 'teilnehmende', label: 'Teilnehmende', typ: 'text' },
      { name: 'text', label: 'Absprachen', typ: 'langtext' }
    ]
  },
  Learnings: {
    titel: 'Learnings',
    felder: [
      { name: 'aktionsart', label: 'Aktionsart (z. B. Demo, Infostand)', typ: 'text', pflicht: true },
      { name: 'text', label: 'Learning', typ: 'langtext', pflicht: true }
    ]
  },
  Kommentare: {
    titel: 'Kommentare',
    felder: [
      { name: 'text', label: 'Kommentar', typ: 'langtext', pflicht: true }
    ]
  },
  Umfragen: {
    titel: 'Umfragen',
    felder: [
      { name: 'frage', label: 'Frage', typ: 'text', pflicht: true },
      { name: 'optionen', label: 'Antworten (eine pro Zeile, mindestens zwei)', typ: 'langtext', pflicht: true },
      { name: 'ablauf_am', label: 'Frist (freiwillig, beendet wird von Hand)', typ: 'datum' },
      { name: 'mehrfach', label: 'Mehrere Antworten erlaubt', typ: 'bool' },
      { name: 'namentlich', label: 'Namentlich abstimmen (Namen stehen nach dem Beenden in der Auswertung)', typ: 'bool' }
    ]
  },
  Mitteilungen: {
    titel: 'Mitteilungen',
    felder: [
      { name: 'titel', label: 'Titel', typ: 'text', pflicht: true },
      { name: 'text', label: 'Text', typ: 'langtext' },
      { name: 'angeheftet', label: 'Angeheftet (nur angeheftete stehen direkt auf dem Start)', typ: 'bool' }
    ]
  },
  Ideen: {
    titel: 'Aktionsideen',
    felder: [
      { name: 'titel', label: 'Idee', typ: 'text', pflicht: true },
      { name: 'beschreibung', label: 'Beschreibung', typ: 'langtext' },
      { name: 'aktionsart', label: 'Aktionsart (z. B. Demo, Infostand)', typ: 'text' }
    ]
  }
};

// Das Sheet liefert Wahrheitswerte mal als true, mal als Text "TRUE".
export function istWahr(v) {
  return v === true || String(v).trim().toUpperCase() === 'TRUE';
}

export function istFalsch(v) {
  return v === false || String(v).trim().toUpperCase() === 'FALSE';
}

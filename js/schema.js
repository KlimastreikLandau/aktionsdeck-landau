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
      { name: 'text', label: 'Was ist zu tun?', typ: 'langtext', pflicht: true },
      { name: 'verantwortlich', label: 'Verantwortlich', typ: 'text' },
      { name: 'faellig_am', label: 'Fällig am', typ: 'datum' },
      { name: 'prioritaet', label: 'Priorität', typ: 'auswahl', optionen: ['hoch', 'normal', 'niedrig'] }
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

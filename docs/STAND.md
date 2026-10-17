# STAND – AktionsDeck Landau

Version der App: 0.25.0 (gleich in js/config.js und sw.js; Korrektur 4.7 kann 0.25.1 sein: beide Dateien prüfen)
Repo: https://github.com/KlimastreikLandau/aktionsdeck-landau
Seite: https://klimastreiklandau.github.io/aktionsdeck-landau/

## Erledigt
- Etappe 0 und 1 (Fundament), Etappe 2 Material und Ausleihe, Zwischenplan Z1 bis Z8, Etappe 3 ToDos.
- Etappe 4 komplett (0.18.0 bis 0.25.x): Projekte, ToDos und Meilensteine im Projekt, Meilenstein-Vorlagen (js/vorlagen.js, Dropdown im Formular, Fälligkeit je ToDo änderbar), Hüte, Material im Projekt mit Rückgabe pro Projekt, Finanzen, Planung und Abschluss, Learnings, Aufräumen.
- Das Sheet wurde komplett geleert (keine Testdaten mehr). Alle Prüfpunkte von 0.25.0 sind bestätigt.

## Nächste Schritte (Reihenfolge)
0. Neuer Chat: Version in js/config.js und sw.js prüfen, dann 4.7.1 (0.25.2) umsetzen:
   - Reiter Projekte: Übersicht "Laufende Projekte" und "Learnings nach Aktionsart" zweispaltig nebeneinander (Learnings rechts, am Handy untereinander).
   - Learnings-Übersicht: Text des Learnings fett, Projektname klein darunter.
   - Material: Hinweis "Auch vorgemerkt für ..." (projekt-material.js, Funktion andere) nennt nur AKTIVE Projekte. Vormerkungen in Planungsprojekten zählen nicht. Vormerkungen senken die Verfügbarkeit nie, nur die Ausleihe.
   - Start (js/views/start.js): Projekte mit Status Planung nicht mehr anzeigen (die Marke "Planung" und die Sortierung Aktiv vor Planung entfallen).
   - Vorschlagslisten (datalist in js/ui/form.js): höchstens 30 Einträge, Einträge auf 40 Zeichen kürzen. Projekt und Material bleiben Dropdowns (nur Vorhandenes). Personen und Aktionsarten bleiben frei mit Vorschlägen.
   - Entscheidung offen: Aktionsideen-Speicher (neuer Tab Ideen, Aufklapper unter den Learnings, Knopf "Als Projekt starten" legt Projekt mit Status planung an) gleich in 4.7.1 oder als erster Teil von Etappe 5.
1. Etappe 5: Start als Zentrale (siehe Plan).
2. Danach Etappen 6 bis 11 (siehe Plan).
Neue docs/STAND.md liefert Claude nur auf Aufforderung.

## Plan Etappen 5 bis 11
Neue Reiter: Start, Projekte, ToDos, Material, Mobi, Veranstaltungen, Team, Wiki. "Posts" wird Mobi, "Hilfe" wird Wiki, der Reiter Kalender entfällt (Kalender steckt in Mobi und Veranstaltungen). Untere Leiste am Handy bleibt: Start, Projekte, ToDos, Material, Mehr. Auf dem Start-Dashboard entfallen die Kacheln Material, Kalender, Posts.
- Etappe 5 Start als Zentrale: Umfragen ganz oben (Frage, Antworten, Ablaufdatum, Ergebnis). Schwarzes Brett (Mitteilungen, z. B. Plenumszeit, anheftbar). Pinnwand unter den Kacheln Projekte und ToDos. Kommentare zu ToDos, Mobi-Einträgen u. a. (Tab Kommentare braucht zwei neue Spalten, z. B. bezug_art und bezug_id, also neue Bereitstellung). Aktionsideen-Speicher.
- Etappe 6 Veranstaltungen und Kalender: Liste und Kalenderansicht, getrennt nach Gruppe und intern/extern. Gespeist aus Veranstaltungen, Aktionsterminen, Meilensteinen, ToDo-Fristen (berechnet). Öffentlich ohne PIN: nur ausdrücklich als öffentlich markierte Einträge (eigene Seite, Seitenleiste bei der Gruppenwahl).
- Etappe 7 Mobi: Planung je Projekt, Meilenstein-Vorlage "Mobi", Analyse (Zielgruppe, Art der Werbung), Uploadplan als Liste und im Kalender mit markierten Deadlines.
- Etappe 8 Protokoll, Reden, Learnings: Dauerprotokoll Variante B (Formular in der App, Entwurf laufend auf dem Gerät gesichert, beim Speichern an das Drive-Dokument anhängen, Vorschläge für ToDos zum Abhaken); Variante A (Dokument auslesen, Vorschläge) später kombinierbar. Reden-Archiv mit Link zum Drive-Dokument, Probelesen über die Kommentare aus Etappe 5. Learnings aus dem Protokoll als Vorschlag.
- Etappe 9 Team: Reiter Team, Hüte (offene ToDos) pro Person, Kapazität 1 bis 10 mit Gültigkeitsdatum, Diagramm "Berg" (erledigt und offen je Person, Linie für die Kapa-Grenze). Angaben sind für die Gruppe sichtbar, Zuordnung über den Anzeigenamen.
- Etappe 10 Wiki und öffentliche Seiten: Wiki mit Bereich nur mit PIN (App-Anleitung, Skillshare) und öffentlichem Bereich. Impressum, Info, Datenschutz (Texte aus 6.1).
- Etappe 11 Komfort: OpenCollective-Kontostand (nur Klimastreik Landau, https://opencollective.com/klimastreik-landau, einmal pro Woche per Skript; erst testen, noch keine Zusage). Erinnerungen und Push so planen, dass sie später auf Push oder E-Mail aufsetzen können (Umfragen, überfällige ToDos, Pinnwand-Kommentare). Sicherung, Übersicht und Export, Dunkelmodus, Feinschliff, GitHub-Actions-Versionen anheben.
- Neue Sheet-Tabs für spätere Etappen: Umfragen, Umfrage_Antworten, Mitteilungen, Ideen, Veranstaltungen, Mobi_Plan, Reden, Kapazitaet, Wiki. Jede Etappe nennt vorher, was im Sheet und Skript zu ergänzen ist und wann neu bereitgestellt wird.

## Festlegungen Projekte (Etappe 4)
- Tabs und Spalten (Schema.gs und js/schema.js): Projekte (titel, beschreibung, ort, status planung|aktiv|erledigt|archiviert, start_datum, aktionsdatum, deadline, budget_geplant), Meilensteine (projekt_id, titel, datum, verantwortlich, erledigt), Projekt_Material (projekt_id, material_id, name, kategorie, menge, beschaffung vorhanden|kaufen|mieten|leihen, beschafft, notiz), Finanzen (projekt_id, projekt_material_id, posten, art, menge, einzelpreis, betrag_geplant, betrag_tatsaechlich, bezahlt, bezahlt_von, datum, beleg_id), Learnings (projekt_id, aktionsart, text), Protokolle, Kommentare, Posts, Vorlagen_ToDo, Projekt_Team (Projekt_Team wird nicht mehr benutzt, bleibt im Sheet).
- ToDos haben zusätzlich meilenstein_id.
- Skript: Aktionen listMehrere, projektLoeschen (prüft zuerst Material draußen, Fehlercode "draussen"; löscht weich alle abhängigen Tabs; Learnings bleiben erhalten), buchen mit projekt_id je Position (Rückgabe wird pro Projekt geprüft), delete auf Projekte gesperrt.
- Reiter Projekte (js/views/projekte.js): Übersicht "Laufende Projekte" (Planung steht dort nicht), Learnings-Aufklapper nach Aktionsart, Filter, Archiv-Knopf, aufklappbare Blöcke. Aktive oben, "In Planung" als Aufklapper ganz unten mit orangem gestricheltem Rahmen. Titelzeile im aufgeklappten Projekt: Abschließen/Wieder öffnen, Bearbeiten, Löschen (klein). Teile im Block: ToDos (mit Meilensteinen und "Offene Hüte"), Material, Finanzen, Learnings. Aufklapp-Zustand bleibt beim Reiterwechsel (Merker merk, an Token gebunden). Sprung per #/g/<kurzname>/projekte/<projekt-id>. Daten: listMehrere Projekte, ToDos, Meilensteine, Material, Ausleihe, Projekt_Material, Finanzen, Learnings; Zwischenspeicher gruppe_id:projekte.
- Abschließen: gesperrt, wenn festes Material für das Projekt draußen ist. Warnung (trotzdem möglich) bei offenen ToDos und nicht beschafftem Material. Status erledigt = Archiv. Verbrauchsmaterial sperrt nicht.
- Hüte: Ein Hut ist ein offenes ToDo OHNE Verantwortliche. Datei js/views/todos-hut.js (istOffenerHut, huetKnoepfe): "Hut übernehmen" (nicht bei eigenen ToDos) und "Weitergeben" (nur mit Verantwortlichen), sofortige Anzeige, Speichern im Hintergrund, Rückfall bei Fehler. Aufklapper "Offene Hüte" (Projekt) und "Noch offen" (Reiter ToDos) mit rotem Hintergrund. Start: je Projekt zwei Schalter "ToDos (n offen)" und "Hüte (n offen)". projekt-team.js wurde gelöscht.
- Meilenstein-Vorlagen: fest in js/vorlagen.js (Mobi, Pressearbeit, Genehmigung und Anmeldung, Material und Aufbau, Nachbereitung). tage_vorher = Tage vor dem Meilenstein-Datum (negativ = danach). Die Tage sind Platzhalter, nur die Mobi-Schritte stammen vom Nutzer; er meldet echte Meilensteine später. Dropdown "Vorlage" im Meilenstein-Formular, Fälligkeit je ToDo änderbar, Haken zum Abwählen.
- Material im Projekt (js/views/projekt-material.js): Positionen, Haken "beschafft", "Draußen für dieses Projekt" (Verbrauchsmaterial: "Mitgenommen"), "+ Aus Bestand", "+ Eigene Position", Ausleihen (schlägt fehlende Menge vor, zeigt "Vorgemerkt für dieses Projekt"), Zurückgeben. Komplett ausgeliehene Positionen sind grau und durchgestrichen (Haken gesperrt). Komplette Rückgabe löscht die Position aus der Projekt-Materialliste. Verbrauchsmaterial im Projekt mit 0 zurück = alles verbraucht, Position wird entfernt. Nach Buchungen im Reiter Material wird der Zwischenspeicher gruppe_id:projekte geleert.
- Reiter Material: Ausleihen mit Feld "Für Projekt"; Zurückgeben pro Herkunft in eigener Zeile; Detail zeigt "Gerade ausgeliehen: 3 (Demo: 2, ohne Projekt: 1)"; Daten per listMehrere.
- Finanzen (js/views/projekt-finanzen.js): Posten, Haken bezahlt, Summen Budget/Geplant/Tatsächlich/Rest, Geplant leer = Menge mal Einzelpreis, "Aus Material übernehmen" (kaufen/mieten, ohne doppelte). Geld läuft über OpenCollective, kein Foto-Upload für Belege.
- Learnings (js/views/projekt-learnings.js): Aktionsart frei mit Vorschlägen aus bisherigen Einträgen, Teil im Projekt und Übersicht nach Aktionsart.
- Aufräumen (apps-script/Aufraeumen.gs, nur Editor): aufraeumenTesten (zählt), aufraeumen (löscht geloescht=TRUE älter als 90 Tage und Log älter als 180 Tage), testzeilenAnzeigen. Einmal im Halbjahr ausführen. Keine neue Bereitstellung nötig.
- Löschen in der App = geloescht TRUE (nur ausgeblendet). Wirklich entfernt nur durch aufraeumen.

## Festlegungen ToDos (Etappe 3)
- Tab ToDos: id, gruppe_id, erstellt_am, erstellt_von, geaendert_am, geaendert_von, geloescht, projekt_id, post_id, text, verantwortlich, faellig_am, erledigt, erledigt_am, erledigt_von, prioritaet, sortierung, details, meilenstein_id.
- "text" = Titel, "details" = weitere Informationen. Reiter ToDos zeigt alle ToDos der Gruppe: offene oben, eigene Tabelle "Erledigt, letzte 2 Wochen", Knopf Archiv für ältere (Regel erledigt_am, sonst geaendert_am, 14 Tage).
- Datumsformate lesbar (normDatum). Überfällig rot (auch die Infozeile), heute orange.
- Filter: Suche, Verantwortlich, Fälligkeit, Priorität, Nur meine. Abhaken ohne Konfliktprüfung (todos-abhaken.js). Bearbeiten prüft Konflikt (bekannt = geaendert_am). Aktualisierung alle 45 Sekunden.
- Start-Kachel ToDos zeigt nur allgemeine ToDos (ohne projekt_id und post_id).
- Rechenhelfer js/views/todos-rechnen.js.

## Festlegungen Material und buchen
- Festes Material: anzahl = Bestand, ausgeliehen = mitgenommen - zurueck - defekt. Verbrauchsmaterial: anzahl = Vorrat, Mitnehmen senkt, Rückgabe erhöht, kein "defekt".
- buchen: { art, person, datum, projekt_id, notiz, positionen:[{material_id, anzahl, defekt, projekt_id}] }, max. 100. Fehlercodes: ungueltig, zuwenig, nicht_gefunden, beschaeftigt. Ausleihe wird nur über buchen geschrieben.
- Vormerken (material-vormerken.js): Zeile in Projekt_Material, nur Planung, senkt die Verfügbarkeit nicht.
- Foto-Upload: Browser verkleinert auf 1000 px, Skript prüft JPEG, speichert im Drive-Ordner FOTO_ORDNER_<gruppe_id>.

## Gruppen und Farben
- g1/fff, g2/gp, g3/kb. Logos icons/gruppen/<kurzname>.svg (Ersatz .png, dann icons/logo.svg). Gruppenliste liegt in localStorage.
- AktionsDeck Dunkelgrau #1a1e20, Dunkelgrün #368469. FFF #1b7340; GP #70bd1c; KB #165834 (außerdem #2fa142, #0894ad). Hintergrund #dfe8e4. CSS-Variablen --gruppe, --gruppe-text, --gruen, --gruen-hell, --hintergrund.

## Oberfläche (Stand)
- Reiter aktuell: Start, Projekte, ToDos, Material, Posts, Kalender, Hilfe (Umbenennung siehe Plan). Handy: Start, Projekte, ToDos, Material, Mehr.
- Meldungen (toast) mittig. Projekte und Material-Dialoge nutzen Fenster (js/ui/fenster.js). Reiter ToDos und Material nutzen den Detailbereich rechts.
- Start-Dashboard: Kacheln Projekte und ToDos fertig, Material/Posts/Kalender sind Platzhalter (entfallen laut Plan).

## Offen
- GitHub Actions: Warnungen (Node 20 veraltet). ubuntu-latest wechselt ab 19.10.2026 auf Ubuntu 26. Läuft, Action-Versionen in .github/workflows später anheben.
- Sicherheitstest 1.8 nur teilweise (Abmelden-Test und Sperre; Ergebnis nicht gemeldet).
- Mögliche Ursache für einmalige Fehler "Cannot read properties of undefined (reading 'forEach')": beschädigte Kopfzeile in einem Sheet-Tab.
- GitHub Pages hält Dateien bis zu ca. 10 Minuten im Zwischenspeicher: warten und zweimal neu laden.
- Der Reiter Projekte lädt sechs bis acht Tabellen auf einmal und kann langsam sein. Bei Bedarf Material und Finanzen erst beim Aufklappen laden.

## Dateiübersicht
- index.html, manifest.webmanifest, sw.js, icons/, css/ (base, layout, components; Blöcke bis 0.25.0 am Ende)
- apps-script/: Code.gs, Auth.gs, Daten.gs, Schema.gs, Util.gs, Ausleihe.gs, Upload.gs, Aufraeumen.gs (Setup.gs nur im Editor)
- js/: app.js, config.js, api.js, store.js, cache.js, schema.js, vorlagen.js
- js/ui/: dom, toast, modal, nav, table, detail, form, logo, kopf, bild, lightbox, fenster, balken
- js/views/: gruppen, login, start, mehr, info, hilfe, platzhalter, material, material-detail, material-rechnen, material-buchen, material-vormerken, todos, todos-rechnen, todos-abhaken, todos-hut, projekte, projekt-rechnen, projekt-todos, projekt-material, projekt-finanzen, projekt-learnings
- Noch nicht vorhanden: posts/mobi, kalender, Veranstaltungen, Team, Wiki, Protokoll.

## Hinweise
- config.js enthält die echte API_URL: nie ersetzen, nur VERSION ändern.
- Neue Dateien immer in sw.js (HUELLE) eintragen, gelöschte austragen. Dateien in HUELLE müssen im Repo existieren.
- Skript geändert = neue Bereitstellung (Bereitstellen, Bereitstellungen verwalten, Stift, Neue Version). Neue Sheet-Spalte oder neuer Tab: erst im Sheet ergänzen (Kopfzeile ohne unsichtbare Zeichen), dann Schema.gs (Editor und GitHub), dann formatieren() ausführen, dann neu bereitstellen.
- Skripteigenschaften (nur im Editor): TOKEN_GEHEIMNIS, FOTO_ORDNER_g1, g2, g3.
- Nach jedem Commit: Actions grün abwarten, Seite zweimal neu laden.
- Ein Syntaxfehler in einer Datei lässt den Reiter auf "Dieser Reiter ist noch in Arbeit" zurückfallen (app.js lädt jeden Reiter als Modul). Bei diesem Symptom zuerst die zuletzt geänderten Dateien auf fehlende oder doppelte Klammern prüfen, vor allem `});` und `}, s.token);`.
- In Util.gs gibt es schon eine Funktion aus(): in neuen Skriptdateien keine Variable so nennen.
- Zwischenspeicher je Reiter: ladeMitCache(key, ladeFn, anzeigen, zuerstCache), Schlüssel gruppe_id:<name>. Ältere Zwischenspeicher können neue Felder noch nicht enthalten: in zeigen() Fehlendes ergänzen.
- Formulare: js/ui/form.js (Feldtypen text, zahl, datum, langtext, auswahl, bool, foto; Datumsfeld öffnet per Klick den Kalender). Listen: zeigeListe in js/ui/table.js.
- Arbeitsweise im Chat: neue Dateien ganz, bei bestehenden Dateien nur die zitierten Änderungen (erste und letzte Zeile des Bereichs, vollständig mit Klammern und Semikolons), CSS ans Ende anhängen. Am Ende Prüfliste und Tabelle "Wenn etwas nicht klappt". Der Nutzer arbeitet nur im Browser, Konsole gesperrt, und sammelt Anmerkungen zur Anzeige.

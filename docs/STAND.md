# STAND – AktionsDeck Landau

Version der App: 0.26.3 (gleich in js/config.js und sw.js: beide Dateien prüfen)
Repo: https://github.com/KlimastreikLandau/aktionsdeck-landau
Seite: https://klimastreiklandau.github.io/aktionsdeck-landau/

## Erledigt
- Etappe 0 und 1 (Fundament), Etappe 2 Material und Ausleihe, Zwischenplan Z1 bis Z8, Etappe 3 ToDos.
- Etappe 4 komplett (0.18.0 bis 0.25.x): Projekte, ToDos und Meilensteine im Projekt, Meilenstein-Vorlagen, Hüte, Material im Projekt, Finanzen, Planung und Abschluss, Learnings, Aufräumen.
- Etappe 5 Start als Zentrale (0.26.0 bis 0.26.3): Umfragen, Schwarzes Brett, Pinnwand, Kommentare, Aktionsideen, Aktionsart, Korrekturen 4.7.1. Alle Prüfpunkte bis 0.26.2 bestätigt. 0.26.3 (Pinnwand "Als Mitteilung anheften", Handy-Knöpfe in einer Zeile, Suche unter "Nicht angeheftet", "Ergebnis kopieren") ist noch zu prüfen.
- Das Sheet wurde vor 0.26.0 komplett geleert (keine Testdaten). Danach sind beim Testen von Etappe 5 neue Testeinträge entstanden (Umfragen, Mitteilungen, Kommentare, Ideen): vor dem Echtbetrieb im Sheet löschen.

## Nächste Schritte (Reihenfolge)
0. Neuer Chat: Version in js/config.js und sw.js prüfen, 0.26.3 prüfen lassen (Prüfliste), Anmerkungen des Nutzers sammeln.
1. Schritt 5.10b "Was ist neu seit meinem letzten Besuch?" (Vorschlag, Entscheidung offen): Neue Datei js/ui/neu-seit.js (Fenster), zwei Funktionen in js/store.js (Zeitpunkt des letzten Besuchs im Gerät, pro Gerät nicht pro Person), Aufruf und Knopf "Was ist neu? (n)" in js/views/start.js. Quelle: listMehrere mit "seit" (kann das Skript schon, inkl. gelöschter Einträge). Eigene Änderungen (erstellt_von/geaendert_von = Anzeigename) werden ausgeblendet. Quellen-Vorschlag: ToDos, Mitteilungen, Umfragen, Kommentare, Projekte (Material eher nicht). Offene Fragen an den Nutzer: automatisch beim Start oder nur per Knopf mit Zahl (Empfehlung Knopf), welche Quellen, wann gilt "gelesen". Kein Skript, keine neue Spalte nötig.
2. Etappe 6 Veranstaltungen und Kalender (siehe Plan). Dort auch: Veranstaltungen und gruppeninterne Termine (Teambuilding) als Mitteilung auf das Schwarze Brett heften (Knopf "An Schwarzes Brett anheften", legt eine Mitteilung an, wie bei den Pinnwand-Kommentaren). Optional: Kommentar-Zahl auch auf dem Start bei den ToDos (Nutzer sagt: erstmal nicht nötig).
3. Danach Etappen 7 bis 11 (siehe Plan).
Neue docs/STAND.md liefert Claude nur auf Aufforderung.

## Plan Etappen 6 bis 11
Neue Reiter: Start, Projekte, ToDos, Material, Mobi, Veranstaltungen, Team, Wiki. "Posts" wird Mobi, "Hilfe" wird Wiki, der Reiter Kalender entfällt (Kalender steckt in Mobi und Veranstaltungen). Untere Leiste am Handy bleibt: Start, Projekte, ToDos, Material, Mehr. Auf dem Start-Dashboard sind die Kacheln Material, Kalender, Posts schon entfallen.
- Etappe 6 Veranstaltungen und Kalender: Liste und Kalenderansicht, getrennt nach Gruppe und intern/extern. Gespeist aus Veranstaltungen, Aktionsterminen, Meilensteinen, ToDo-Fristen (berechnet). Öffentlich ohne PIN: nur ausdrücklich als öffentlich markierte Einträge (eigene Seite, Seitenleiste bei der Gruppenwahl). Fremde (nicht gruppen-organisierte) Veranstaltungen und interne Termine lassen sich an das Schwarze Brett heften.
- Etappe 7 Mobi: Planung je Projekt, Meilenstein-Vorlage "Mobi", Analyse (Zielgruppe, Art der Werbung), Uploadplan als Liste und im Kalender mit markierten Deadlines. Kommentare mit Zahl-Markierung wie bei ToDos (baueKommentare, kommentarZahlen, kommentarMarke).
- Etappe 8 Protokoll, Reden, Learnings: Dauerprotokoll Variante B (Formular in der App, Entwurf laufend auf dem Gerät gesichert, beim Speichern an das Drive-Dokument anhängen, Vorschläge für ToDos zum Abhaken); Variante A später kombinierbar. Reden-Archiv mit Link zum Drive-Dokument, Probelesen über die Kommentare. Learnings aus dem Protokoll als Vorschlag. Im Protokoll lassen sich Mitteilungen/Kommentare per Symbol oder Tag einbinden (Wunsch des Nutzers).
- Etappe 9 Team: Reiter Team, Hüte pro Person, Kapazität 1 bis 10 mit Gültigkeitsdatum, Diagramm "Berg". Angaben sind für die Gruppe sichtbar, Zuordnung über den Anzeigenamen.
- Etappe 10 Wiki und öffentliche Seiten: Wiki mit Bereich nur mit PIN (App-Anleitung, Skillshare) und öffentlichem Bereich. Impressum, Info, Datenschutz (Texte aus 6.1).
- Etappe 11 Komfort: OpenCollective-Kontostand (nur Klimastreik Landau, https://opencollective.com/klimastreik-landau, einmal pro Woche per Skript; erst testen, noch keine Zusage). Erinnerungen und Push so planen, dass sie später auf Push oder E-Mail aufsetzen können (Umfragen, überfällige ToDos, Pinnwand-Kommentare). Sicherung, Übersicht und Export, Dunkelmodus, Feinschliff, GitHub-Actions-Versionen anheben.
- Neue Sheet-Tabs für spätere Etappen: Veranstaltungen, Mobi_Plan, Reden, Kapazitaet, Wiki. Jede Etappe nennt vorher, was im Sheet und Skript zu ergänzen ist und wann neu bereitgestellt wird.

## Festlegungen Start als Zentrale (Etappe 5)
- Tabs und Spalten (Schema.gs und js/schema.js): Umfragen (frage, optionen, ablauf_am, mehrfach, beendet, namentlich), Umfrage_Antworten (umfrage_id, person, auswahl), Mitteilungen (titel, text, angeheftet), Ideen (titel, beschreibung, aktionsart, projekt_id), Kommentare (projekt_id, bezug_art, bezug_id, text, angeheftet), Projekte zusätzlich aktionsart. Die Spalte Kommentare.angeheftet wird seit 0.26.3 NICHT mehr benutzt (bleibt im Sheet). Kommentare gehören nicht mehr zu PROJEKT_PFLICHT (Pinnwand ohne Projekt). BOOL_SPALTEN enthält mehrfach, angeheftet, beendet, namentlich.
- Kommentare (js/ui/kommentare.js): baueKommentare({ ctx, token, art ('todo'|'pinnwand'|...), bezugId, projektId, titel, platzhalter, leerText, neuesteZuerst, max, beiAenderung, alsMitteilung }) gibt { el, laden } zurück. Kommentare liegen im Tab Kommentare mit bezug_art und bezug_id. Pinnwand auf dem Start (art pinnwand, bezugId leer, max 30) hat je Kommentar "Als Mitteilung anheften" (öffnet das Mitteilungs-Formular vorausgefüllt, angeheftet gesetzt) und "Löschen". ToDo-Kommentare: nur "Löschen". Im ToDo-Detail (todos.js) und im Bearbeiten-Fenster des ToDos im Projekt (projekt-todos.js), farbig mit Trennstrich abgesetzt. Kommentar-Zahl als Marke "💬 n" in der ToDo-Tabelle, den Karten und den ToDos im Projekt (todos-rechnen.js: kommentarZahlen, kommentarMarke). Auf dem Start bei den ToDos NICHT (Nutzer: nicht nötig).
- Umfragen (js/views/start-umfragen.js): Kachel "Umfragen" auf dem Start zeigt nur die laufenden Umfragen, je eine Zeile (Frage, Frist, Anzahl, "Du hast abgestimmt"). Klick öffnet ein Fenster (Abstimmen, Ergebnis mit Balken); es schließt per Esc, Schließen-Knopf oder Klick daneben (fenster.js: Option aussenKlick). Kachel ist ausgeblendet, wenn es keine laufende Umfrage gibt. Knopf "+ Umfrage" oben in der Zeile mit "Hallo Name". Beendet wird NUR von Hand (Spalte beendet): Knopf "Beenden" in der Zeile oder "Umfrage beenden" im Fenster, danach öffnet sich das Fenster mit dem Ergebnis. Frist (ablauf_am) beendet nichts: heute = ganzer Kasten orange, überfällig = ganzer Kasten rot, sonst leicht grün. Beendete Umfragen stehen im "Archiv (n)" (Knopf oben, eigene Ansicht auf dem Start, einzeln aufklappbar, Titel zeigt Personen und Frist; "Wieder öffnen" möglich). Beendete Umfragen: Ergebnis als Text ohne Balken (Antwort: n Stimmen, bei namentlich dahinter die Namen), Knopf "Ergebnis kopieren". Anonym ist Standard; Haken "Namentlich abstimmen" beim Anlegen (Namen nur in der Auswertung nach dem Beenden). Hat schon jemand abgestimmt, sind Antworten und "namentlich" nicht mehr änderbar. Eine Stimme je Anzeigename, änderbar solange die Umfrage läuft. Im Sheet steht der Name immer in Umfrage_Antworten.person. Das Ablaufdatum sperrt nur in der App, nicht im Skript (Nutzer: reicht).
- Schwarzes Brett (js/views/start-brett.js): Kachel zeigt nur ANGEHEFTETE Mitteilungen. Neue Mitteilungen sind angeheftet. Nicht angeheftete stehen im zugeklappten Aufklapper "Nicht angeheftet" (neueste 10, Suchfeld für alle). Kachel ist nur ausgeblendet, wenn es gar keine Mitteilung gibt. Umfragen und Brett stehen nebeneinander (Handy untereinander). Knopf "+ Mitteilung" oben in der Zeile mit "Hallo Name". Alle mit dem Gruppen-PIN dürfen alles löschen (Nutzer: okay).
- Start-Kopf: Zeile "Hallo Name" mit Knöpfen "+ Umfrage", "+ Mitteilung", "Archiv (n)"; am Handy stehen die Knöpfe in einer Zeile darunter. Darunter "Stand ..." (Zeit der letzten Aktualisierung der ToDos). Dann Umfragen und Brett, Kacheln Projekte und ToDos, ganz unten die Pinnwand.
- Aktionsideen (js/views/ideen.js): Aufklapper im Reiter Projekte unter den Learnings (rechts neben der Übersicht "Laufende Projekte", Handy untereinander). "Als Projekt starten" legt ein Projekt in Planung an (mit Beschreibung und Aktionsart), springt dorthin und klappt es auf. Die Idee BLEIBT in der Liste (Aktionen wiederholen sich), Tab Ideen.projekt_id wird nicht mehr gesetzt.
- Aktionsart: Feld im Projekt (Vorschläge aus Projekten, Learnings, Ideen). Im aufgeklappten Projekt stehen rechts neben den Projektdaten Toggler "Learnings" und "Aktionsideen" mit derselben Aktionsart. Ein neues Learning im Projekt hat die Aktionsart des Projekts vorbelegt.
- Learnings-Übersicht: Learning-Text fett, Projektname klein darunter.
- Projekt-Block am Handy: Knöpfe Abschließen/Bearbeiten/Löschen linksbündig unter dem Titel.
- Material: "Auch vorgemerkt für ..." nennt nur AKTIVE Projekte (Planung zählt nicht). Vormerkungen senken die Verfügbarkeit nie, nur die Ausleihe.
- Start: Projekte mit Status Planung stehen nicht in der Kachel Projekte.
- Vorschlagslisten (datalist in js/ui/form.js): höchstens 30 Einträge, je höchstens 40 Zeichen.

## Festlegungen Projekte (Etappe 4)
- Tabs und Spalten (Schema.gs und js/schema.js): Projekte (titel, beschreibung, ort, status planung|aktiv|erledigt|archiviert, start_datum, aktionsdatum, deadline, budget_geplant, aktionsart), Meilensteine (projekt_id, titel, datum, verantwortlich, erledigt), Projekt_Material (projekt_id, material_id, name, kategorie, menge, beschaffung vorhanden|kaufen|mieten|leihen, beschafft, notiz), Finanzen (projekt_id, projekt_material_id, posten, art, menge, einzelpreis, betrag_geplant, betrag_tatsaechlich, bezahlt, bezahlt_von, datum, beleg_id), Learnings (projekt_id, aktionsart, text), Protokolle, Posts, Vorlagen_ToDo, Projekt_Team (wird nicht mehr benutzt, bleibt im Sheet).
- ToDos haben zusätzlich meilenstein_id.
- Skript: Aktionen listMehrere, projektLoeschen (prüft zuerst Material draußen, Fehlercode "draussen"; löscht weich alle abhängigen Tabs; Learnings bleiben erhalten), buchen mit projekt_id je Position (Rückgabe wird pro Projekt geprüft), delete auf Projekte gesperrt.
- Reiter Projekte (js/views/projekte.js): Übersicht "Laufende Projekte" (Planung steht dort nicht), Learnings und Aktionsideen als Aufklapper, Filter, Archiv-Knopf, aufklappbare Blöcke. Aktive oben, "In Planung" als Aufklapper ganz unten mit orangem gestricheltem Rahmen. Titelzeile im aufgeklappten Projekt: Abschließen/Wieder öffnen, Bearbeiten, Löschen. Teile im Block: ToDos (mit Meilensteinen und "Offene Hüte"), Material, Finanzen, Learnings. Aufklapp-Zustand bleibt beim Reiterwechsel (Merker merk, an Token gebunden). Sprung per #/g/<kurzname>/projekte/<projekt-id>. Daten: listMehrere Projekte, ToDos, Meilensteine, Material, Ausleihe, Projekt_Material, Finanzen, Learnings, Ideen, Kommentare; Zwischenspeicher gruppe_id:projekte.
- Abschließen: gesperrt, wenn festes Material für das Projekt draußen ist. Warnung (trotzdem möglich) bei offenen ToDos und nicht beschafftem Material. Status erledigt = Archiv. Verbrauchsmaterial sperrt nicht.
- Hüte: Ein Hut ist ein offenes ToDo OHNE Verantwortliche. Datei js/views/todos-hut.js (istOffenerHut, huetKnoepfe). Aufklapper "Offene Hüte" (Projekt) und "Noch offen" (Reiter ToDos) mit rotem Hintergrund. Start: je Projekt zwei Schalter "ToDos (n offen)" und "Hüte (n offen)".
- Meilenstein-Vorlagen: fest in js/vorlagen.js (Mobi, Pressearbeit, Genehmigung und Anmeldung, Material und Aufbau, Nachbereitung). tage_vorher = Tage vor dem Meilenstein-Datum (negativ = danach). Die Tage sind Platzhalter, nur die Mobi-Schritte stammen vom Nutzer; er meldet echte Meilensteine später.
- Material im Projekt (js/views/projekt-material.js): Positionen, Haken "beschafft", "Draußen für dieses Projekt", "+ Aus Bestand", "+ Eigene Position", Ausleihen, Zurückgeben. Komplette Rückgabe löscht die Position aus der Projekt-Materialliste. Verbrauchsmaterial im Projekt mit 0 zurück = alles verbraucht.
- Finanzen (js/views/projekt-finanzen.js): Posten, Haken bezahlt, Summen, Geplant leer = Menge mal Einzelpreis, "Aus Material übernehmen". Geld läuft über OpenCollective, kein Foto-Upload für Belege.
- Learnings (js/views/projekt-learnings.js): Aktionsart frei mit Vorschlägen, Teil im Projekt und Übersicht nach Aktionsart.
- Aufräumen (apps-script/Aufraeumen.gs, nur Editor): aufraeumenTesten, aufraeumen (löscht geloescht=TRUE älter als 90 Tage und Log älter als 180 Tage), testzeilenAnzeigen. Einmal im Halbjahr. Keine neue Bereitstellung nötig.
- Löschen in der App = geloescht TRUE (nur ausgeblendet).

## Festlegungen ToDos (Etappe 3)
- Tab ToDos: id, gruppe_id, erstellt_am, erstellt_von, geaendert_am, geaendert_von, geloescht, projekt_id, post_id, text, verantwortlich, faellig_am, erledigt, erledigt_am, erledigt_von, prioritaet, sortierung, details, meilenstein_id.
- "text" = Titel, "details" = weitere Informationen. Reiter ToDos zeigt alle ToDos der Gruppe: offene oben, Tabelle "Erledigt, letzte 2 Wochen", Knopf Archiv für ältere (Regel erledigt_am, sonst geaendert_am, 14 Tage).
- Datumsformate lesbar (normDatum). Überfällig rot, heute orange.
- Filter: Suche, Verantwortlich, Fälligkeit, Priorität, Nur meine. Abhaken ohne Konfliktprüfung. Bearbeiten prüft Konflikt (bekannt = geaendert_am). Aktualisierung alle 45 Sekunden.
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
- Meldungen (toast) mittig. Projekte, Start und Material-Dialoge nutzen Fenster (js/ui/fenster.js, zeigeFenster(titel, inhalt, beiZu, { aussenKlick })). Reiter ToDos und Material nutzen den Detailbereich rechts.
- Start-Dashboard: Umfragen und Schwarzes Brett (nur wenn vorhanden), Kacheln Projekte und ToDos, Pinnwand.

## Offen
- GitHub Actions: Warnungen (Node 20 veraltet). ubuntu-latest wechselt ab 19.10.2026 auf Ubuntu 26. Läuft, Action-Versionen in .github/workflows später anheben.
- Sicherheitstest 1.8 nur teilweise (Abmelden-Test und Sperre; Ergebnis nicht gemeldet).
- Mögliche Ursache für einmalige Fehler "Cannot read properties of undefined (reading 'forEach')": beschädigte Kopfzeile in einem Sheet-Tab.
- GitHub Pages hält Dateien bis zu ca. 10 Minuten im Zwischenspeicher: warten und zweimal neu laden.
- Der Reiter Projekte lädt neun bis zehn Tabellen auf einmal und kann langsam sein. Bei Bedarf Material und Finanzen erst beim Aufklappen laden.
- Testdaten aus Etappe 5 im Sheet vor dem Echtbetrieb löschen.

## Dateiübersicht
- index.html, manifest.webmanifest, sw.js, icons/, css/ (base, layout, components; Blöcke bis 0.26.3 am Ende)
- apps-script/: Code.gs, Auth.gs, Daten.gs, Schema.gs, Util.gs, Ausleihe.gs, Upload.gs, Aufraeumen.gs (Setup.gs nur im Editor)
- js/: app.js, config.js, api.js, store.js, cache.js, schema.js, vorlagen.js
- js/ui/: dom, toast, modal, nav, table, detail, form, logo, kopf, bild, lightbox, fenster, balken, kommentare
- js/views/: gruppen, login, start, start-umfragen, start-brett, mehr, info, hilfe, platzhalter, material, material-detail, material-rechnen, material-buchen, material-vormerken, todos, todos-rechnen, todos-abhaken, todos-hut, projekte, projekt-rechnen, projekt-todos, projekt-material, projekt-finanzen, projekt-learnings, ideen
- Noch nicht vorhanden: posts/mobi, kalender, Veranstaltungen, Team, Wiki, Protokoll, "Was ist neu"-Fenster.

## Hinweise
- config.js enthält die echte API_URL: nie ersetzen, nur VERSION ändern.
- Neue Dateien immer in sw.js (HUELLE) eintragen, gelöschte austragen. Dateien in HUELLE müssen im Repo existieren.
- Skript geändert = neue Bereitstellung (Bereitstellen, Bereitstellungen verwalten, Stift, Neue Version). Neue Sheet-Spalte oder neuer Tab: erst im Sheet ergänzen (Kopfzeile von Hand tippen, ohne unsichtbare Zeichen), dann Schema.gs (Editor und GitHub), dann formatieren() ausführen (nur bei neuen Text-Spalten nötig), dann neu bereitstellen.
- Skripteigenschaften (nur im Editor): TOKEN_GEHEIMNIS, FOTO_ORDNER_g1, g2, g3.
- Nach jedem Commit: Actions grün abwarten, Seite zweimal neu laden.
- Ein Syntaxfehler in einer Datei lässt den Reiter auf "Dieser Reiter ist noch in Arbeit" zurückfallen (app.js lädt jeden Reiter als Modul). Bei diesem Symptom zuerst die zuletzt geänderten Dateien auf fehlende oder doppelte Klammern prüfen, vor allem `});` und `}, s.token);`.
- In Util.gs gibt es schon eine Funktion aus(): in neuen Skriptdateien keine Variable so nennen.
- Zwischenspeicher je Reiter: ladeMitCache(key, ladeFn, anzeigen, zuerstCache), Schlüssel gruppe_id:<name> (Start: :todos, :projekteliste, :startextra). Ältere Zwischenspeicher können neue Felder noch nicht enthalten: in zeigen() Fehlendes ergänzen.
- Formulare: js/ui/form.js (Feldtypen text, zahl, datum, langtext, auswahl, bool, foto; Datumsfeld öffnet per Klick den Kalender). Listen: zeigeListe in js/ui/table.js.
- Arbeitsweise im Chat: neue Dateien ganz, bei bestehenden Dateien nur die zitierten Änderungen (erste und letzte Zeile des Bereichs, vollständig mit Klammern und Semikolons), CSS ans Ende anhängen. Am Ende Prüfliste und Tabelle "Wenn etwas nicht klappt". Der Nutzer arbeitet nur im Browser, Konsole gesperrt, und sammelt Anmerkungen zur Anzeige.

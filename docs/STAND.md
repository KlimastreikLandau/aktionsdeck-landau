# STAND – AktionsDeck Landau

Version der App: 0.20.1 (gleich in js/config.js und sw.js)
Repo: https://github.com/KlimastreikLandau/aktionsdeck-landau
Seite: https://klimastreiklandau.github.io/aktionsdeck-landau/

## Erledigt
- Etappe 0 und 1 (Fundament): Sheet, Skript, PIN-Login, Token, Gruppenwahl, Gerüst, Service Worker, Zwischenspeicher
- Etappe 2 Material und Ausleihe komplett
- Zwischenplan Z1 bis Z8 komplett (Farben, Icons/Logo/Startseite, Info-Seiten + Reiter Hilfe, Start-Dashboard, Materialart + buchen, Sammel-Ausleihe, Vormerken, Foto-Upload)
- Etappe 3 ToDos komplett (0.13.0 bis 0.17.1)
- Etappe 4.0 (0.18.0): Sheet und Skript vorbereitet, einmal neu bereitgestellt. Geprüft, ok.
- Etappe 4.1 (0.19.0): Reiter Projekte. Geprüft, ok.
- Etappe 4.2 (0.20.0) und Korrektur 4.2.1 (0.20.1): ToDos und Meilensteine im Projekt, Start-Kachel mit Schaltern, Status Aktiv/Planung getrennt, Spalte "Projekt" im Reiter ToDos. Bestätigt: Meilenstein-Auswahl im ToDo-Formular funktioniert. NOCH NICHT AUSDRÜCKLICH BESTÄTIGT: Start-Schalter je Projekt einzeln, Archiv-Zähler ("0 laufende Projekte · 1 im Archiv"), Planung getrennt von Aktiv, Spalte "Projekt" im Reiter ToDos, Wegfall von "Angelegt von/Zuletzt geändert" im Projektblock, Abhaken im Projekt.

## Nächste Schritte (Reihenfolge)
0. Neuer Chat: ZUERST die offenen Prüfpunkte von 0.20.1 beim Nutzer abfragen (siehe oben), dann weiter.
1. 0.20.2 Kleinigkeit: Datumsfelder in js/ui/form.js: Klick auf das ganze Feld öffnet den Kalender (input.showPicker() bei Klick/Fokus, in try/catch, Mini-Symbol bleibt als Rückfall). Gilt für alle Formulare.
2. Meilenstein-Vorlagen (siehe "Geplant: Meilenstein-Vorlagen"): Rückfragen klären, dann umsetzen. Vorschlag: als 4.2.2 vor 4.3, weil es zu den ToDos im Projekt gehört.
3. 4.3 Team und Hüte (0.21.0), neue Datei js/views/projekt-team.js (siehe unten)
4. 4.4 Material im Projekt (0.22.0), neue Datei js/views/projekt-material.js (siehe unten)
5. 4.5 Finanzen (0.23.0), neue Datei js/views/projekt-finanzen.js
6. 4.6 Protokoll, Kommentare, Abschließen (0.24.0), neue Datei js/views/projekt-protokoll.js (Kommentare ggf. eigene Datei)
7. Etappe 5: Posts und Kalender (Platzhalter im Projekt füllen), 5.3 Vorlagen für Vorlauf-ToDos
8. Etappe 6: Info-Texte (6.1), Sicherung (6.3), Übersicht/Export (6.4), Erinnerungen (6.5), Dunkelmodus (6.6)
Neue docs/STAND.md liefert Claude nur auf Aufforderung.

## Wünsche des Nutzers für Etappe 4 (verbindlich)
- Der Reiter Projekte ist EINE Seite: keine Unter-Reiter, kein Detailbereich rechts. Alles Bearbeiten in kleinen Fenstern (js/ui/fenster.js).
- Teile eines Projekts (Reihenfolge im aufgeklappten Block): Übersicht (inkl. Team und Hüte), ToDos (mit Meilensteinen), Materialliste, Social Media (Platzhalter bis Etappe 5), Kalender (Platzhalter bis Etappe 5), Finanzen, Absprachen-Protokoll, Kommentare.
- Reiter Start zeigt eine Kurzform der Projekte (Kachel). Reiter Projekte: oben Übersicht der laufenden Projekte, Sprung zum Projekt per Klick, Filter "nur dieses Projekt", Knopf Archiv.
- Falsch angelegte Projekte sind löschbar (projektLoeschen), dazugehörige Daten werden mitgelöscht. Nichts verwaist im Archiv.
- Fortschrittsbalken (Reiter Projekte, Start-Kachel) = erledigte / alle ToDos des Projekts. Kein Aufwand pro ToDo.
- ToDos im Projekt: ALLE ToDos des Projekts sichtbar, kein Filter, kein 14-Tage-Archiv. Erledigte grau und durchgestrichen. Zählzeile mit zahlenText(liste, name).
- Start-Kachel ToDos zeigt nur allgemeine ToDos (ohne projekt_id und post_id). Start-Kachel Projekte zeigt je Projekt einen Schalter "ToDos (n offen)" (einzeln auf-/zuklappbar, plus "Alle aufklappen/zuklappen").
- Meilenstein = Überkategorie für ToDos. Erreicht, wenn alle seine ToDos erledigt sind. Ohne ToDos: eigenes Häkchen. Beim Löschen bleiben die ToDos (ohne Verweis).
- Team = "Hüte": wer hat welche Zuständigkeit gerade auf, mit Zahl offener/überfälliger ToDos je Person im Projekt; unbesetzte Hüte ("noch frei"); "Weitere mit ToDos" (ohne Hut); "Hut weitergeben". Keine neue Spalte nötig.
- Status: Aktiv = laufend. Planung = Vorbereitung, im Reiter Projekte optisch getrennt unter "In Planung" (gestrichelter Strich), auf der Start-Kachel nach den aktiven mit Marke "Planung". Erledigt und Archiviert = Archiv (gleich behandelt). Status wird über "Bearbeiten" geändert; "Abschließen" mit Prüfung kommt in 4.6.
- Finanzen: Geld läuft über OpenCollective, in der PWA nur Übersicht "geplant / gekauft" (z. B. Bühne, Snacks). Arten im Formular: kauf, miete, sonstiges (Sheet kennt zusätzlich einnahme, spende, bleibt ungenutzt). KEIN Foto-Upload für Belege; Spalte beleg_id wird als Textfeld "Beleg / Hinweis" genutzt (Link, keine Kontonummern). Summen: geplant, tatsächlich, Rest zum Budget. Knopf "Aus Material übernehmen" legt Posten für Beschaffung kaufen/mieten an (ohne doppelte, merkt projekt_material_id).
- Anzeige im Projektblock: "Angelegt von" und "Zuletzt geändert" NICHT anzeigen.
- Nutzer sammelt Anmerkungen zur Anzeige und meldet sie gesammelt.

## Geplant: 4.4 Material im Projekt und Ausleihe mit Projektbezug
- Materialliste im Projekt: Menge, Beschaffung (vorhanden|kaufen|mieten|leihen), "beschafft"-Haken, "draußen für dieses Projekt".
- Material aus dem Bestand übernehmen (name, kategorie, menge, material_id) und eigene Positionen ohne material_id (z. B. "Bühne mieten").
- "Jetzt ausleihen" und "Zurückgeben" direkt im Projekt (buchen mit projekt_id). Hinweis, wenn Material auch für andere Projekte vorgemerkt ist. Vormerken ist nur Planung, entscheidend ist die echte Ausleihe.
- Reiter Material: beim Ausleihen freiwilliges Feld "Für Projekt". Beim Zurückgeben steht jedes Material pro Herkunft in einer eigenen Zeile ("Pavillon · Projekt Demo (draußen: 2)", "Pavillon · ohne Projekt (draußen: 1)"). Dort kann weiter alles zurückgegeben werden, die Rückgabe wird dem richtigen Projekt gutgeschrieben.
- Material-Detail: "Ausgeliehen: 3 (Demo: 2, ohne Projekt: 1)".
- App-Dateien: projekt-material.js (neu), material-buchen.js, material.js, material-detail.js, material-rechnen.js (ändern). Skript ist schon fertig (4.0), keine neue Bereitstellung nötig.
- Testen: Projekt löschen mit noch ausgeliehenem Material (Fehlercode "draussen") erst hier möglich.

## Geplant: Meilenstein-Vorlagen (Wunsch des Nutzers, noch nicht umgesetzt)
Idee: Bei "+ Meilenstein" im Projekt kann man eine Vorlage wählen oder etwas Neues eintragen. Beispiel Meilenstein "Mobi" mit ToDos: Plakate designen, Plakate drucken, Uploadplan erstellen, Instagram Posts erstellen, Instagram Post hochladen, Pressemitteilung schreiben ...
Vorschlag von Claude (zur Bestätigung im neuen Chat):
- Vorlagen liegen im Sheet (gruppeneigen, jede Gruppe hat ihre eigenen). Bestehender Tab Vorlagen_ToDo (vorlage_name, schritt_text, tage_vorher, verantwortlich) wird erweitert oder durch zwei Tabs ersetzt. Dafür wäre eine neue Spalte nötig (z. B. meilenstein_titel) und damit einmal neu bereitstellen. Alternative ohne Skriptänderung: Vorlagen zunächst fest in der App (js/vorlagen.js) hinterlegen, später ins Sheet.
- Beim Anwenden: Fenster mit Vorlagenwahl, Zieldatum des Meilensteins, dann Häkchenliste der ToDos zum Abwählen/Anpassen, dann batchCreate (Meilenstein zuerst, danach ToDos mit meilenstein_id und projekt_id). "tage_vorher" rechnet das Fälligkeitsdatum jedes ToDos aus dem Meilenstein-Datum zurück.
- Auch "Als Vorlage speichern" aus einem bestehenden Meilenstein wäre denkbar.
- Social-Media-ToDos in Vorlagen hängen davon ab, was Reiter Posts/Uploadplan später plant (Etappe 5). Erst allgemeine Texte nehmen.
Offene Rückfragen an den Nutzer:
1. Vorlagen fest in der App (schnell, kein Neu-Bereitstellen) oder im Sheet (selbst änderbar, einmal neu bereitstellen)?
2. Soll "tage_vorher" Fälligkeiten automatisch aus dem Meilenstein-Datum setzen?
3. Welche Start-Vorlagen sollen es geben (Vorschlag: Mobi, Pressearbeit, Genehmigung/Anmeldung, Material und Aufbau, Nachbereitung)?
4. Soll "+ Neu" bei Projekten ebenfalls Vorlagen anbieten (ganze Projekt-Vorlage mit mehreren Meilensteinen) oder nur "+ Meilenstein" im Projekt?

## Festlegungen Projekte (Etappe 4)
- Tabs und Spalten (Skript Schema.gs und js/schema.js): Projekte (titel, beschreibung, ort, status planung|aktiv|erledigt|archiviert, start_datum, aktionsdatum, deadline, budget_geplant), Meilensteine (projekt_id, titel, datum, verantwortlich, erledigt), Projekt_Team (projekt_id, person, zustaendigkeit), Projekt_Material (projekt_id, material_id, name, kategorie, menge, beschaffung, beschafft, notiz), Finanzen (projekt_id, projekt_material_id, posten, art, menge, einzelpreis, betrag_geplant, betrag_tatsaechlich, bezahlt, bezahlt_von, datum, beleg_id), Protokolle (projekt_id, datum, titel, teilnehmende, text), Kommentare (projekt_id, text), Posts (wie im Projektplan), Vorlagen_ToDo.
- ToDos haben zusätzlich die Spalte meilenstein_id (S1 im Sheet). Sie steht NICHT im Standard-Formular von js/schema.js; projekt-todos.js fügt eine Auswahl "Meilenstein" ein (Optionen { wert, label }), sobald es Meilensteine gibt.
- Skript (seit 4.0.5 bereitgestellt):
  - Neue Aktionen: listMehrere ({ tabellen:[...] } -> { tabellen:{Name:[...]}, serverzeit }), projektLoeschen ({ id, bekannt }).
  - projektLoeschen: in einer Sperre; prüft zuerst, ob für das Projekt noch Material draußen ist (Fehlercode "draussen" mit data.offen); löscht danach weich: Posts, ToDos (inkl. ToDos zu den Posts), Meilensteine, Projekt_Team, Projekt_Material, Finanzen, Protokolle, Kommentare, dann das Projekt. Ausleihe-Historie bleibt. Antwort { id, geloescht:{Tab:Anzahl} }.
  - delete auf Tab Projekte ist gesperrt (nur projektLoeschen). delete auf Meilensteine setzt bei den zugehörigen ToDos meilenstein_id leer.
  - Projekt-Pflicht (projekt_id gültig und aus eigener Gruppe) bei: Meilensteine, Projekt_Team, Projekt_Material, Finanzen, Protokolle, Kommentare. Bei ToDos und Posts freiwillig; ein ToDo mit meilenstein_id braucht ein Projekt, und der Meilenstein muss zu diesem Projekt gehören (bezugPruefen in Daten.gs, auch bei update).
  - Hilfsfunktion schreibeSpalten(t, zeilen, felder) in Daten.gs (schnelles Schreiben mehrerer Zeilen).
- buchen (Ausleihe.gs) mit Projektbezug: projekt_id je Position (gilt vor dem projekt_id der ganzen Buchung; leer = ohne Projekt). Ein Material darf mehrfach in einer Buchung stehen, aber nur einmal je Projekt. Mitnehmen: insgesamt bis (Bestand - ausgeliehen gesamt); für abgeschlossene Projekte (erledigt/archiviert) nichts mitnehmen. Rückgabe wird PRO PROJEKT geprüft (nur was für genau dieses Projekt oder "ohne Projekt" draußen ist; alte Buchungen ohne projekt_id zählen als "ohne Projekt"). Funktionen: bAusgeliehenProjekt, bGesamt. Editor-Tests: testenBuchen, testenBuchenZuViel, testenBuchenProjekt.
- Oberfläche Reiter Projekte (js/views/projekte.js): Übersicht oben (nur Modus laufend oder Archiv, gruppiert Aktiv / In Planung), Filter (Suche, Projektwahl), Archiv-Knopf mit Zahl, aufklappbare Blöcke (details), Aufklapp-Zustand bleibt beim Reiterwechsel (Merker merk mit Token). Sprung per Adresse #/g/<kurzname>/projekte/<projekt-id> (ctx.unter in app.js). Statuszeile: "n laufende Projekte · m im Archiv · Stand ...". Daten: listMehrere Projekte, ToDos, Meilensteine; Zwischenspeicher Schlüssel gruppe_id:projekte (schreibt beim Abhaken auch gruppe_id:todos).
- Projekt löschen: Abfrage nennt Zahlen je Teil (listMehrere über alle Teile). Bei Fehlercode "draussen": alert mit der Meldung.
- ToDos im Projekt (js/views/projekt-todos.js, baueTodoTeil(opt)): Zählzeile, "+ ToDo", "+ Meilenstein", Meilenstein-Blöcke (sortiert nach Datum, Balken, "Bis ...", überfällig rot/heute orange, erreicht grau), "Ohne Meilenstein" darunter. Bearbeiten/Löschen im Fenster (Löschen-Knopf unten im Fenster, Klasse fenster-loeschen). ToDo-Abhaken ohne Konfliktprüfung über todos-abhaken.js; Meilenstein-Häkchen (nur ohne ToDos) per update ohne bekannt. Teil klappt auf/zu, Zustand in merk.teile ("<id>:todos").
- Rechenhelfer js/views/projekt-rechnen.js: statusText, istAbgeschlossen, fortschritt, fortschrittText, sortiereProjekte, terminText, meilensteinStand, sortiereMeilensteine, meilensteinFaellig.
- Reiter ToDos (todos.js): lädt per listMehrere ToDos und Projekte (Zwischenspeicher gruppe_id:todos enthält { todos, projekte }), Spalte "Projekt" in Tabelle, "Projekt: ..." in Karten, Eintrag im Detail. start.js liest aus demselben Schlüssel nur .todos, das ist kompatibel.
- Start (start.js): Kachel Projekte (Zwischenspeicher gruppe_id:projekteliste), Schalter je Projekt (Merker projektOffen), Aktiv vor Planung, Marke "Planung".
- Neue UI-Bausteine: js/ui/fenster.js (zeigeFenster(titel, inhalt, beiZu) -> { schliessen }), js/ui/balken.js (fortschrittsBalken(prozent, text)). js/ui/form.js: Auswahl-Optionen dürfen { wert, label } sein.
- CSS-Blöcke am Ende von css/components.css: "Etappe 4.1", "Etappe 4.2", "Etappe 4.2.1".

## Festlegungen ToDos (Etappe 3)
- Tab ToDos (Spalten): id, gruppe_id, erstellt_am, erstellt_von, geaendert_am, geaendert_von, geloescht, projekt_id, post_id, text, verantwortlich, faellig_am, erledigt, erledigt_am, erledigt_von, prioritaet, sortierung, details, meilenstein_id
- "text" ist in der Oberfläche der TITEL. "details" ist "Weitere Informationen (freiwillig)". sortierung ist noch ungenutzt.
- Reiter ToDos zeigt ALLE ToDos der Gruppe (auch aus Projekten): oben offene, darunter eigene Tabelle "Erledigt, letzte 2 Wochen" (graue Kopfzeile), Knopf "Archiv (Zahl)" zeigt Erledigte, die vor mehr als 14 Tagen erledigt wurden. Im Archiv gibt es keine Zählzeile. Archiv-ToDos können wieder geöffnet werden.
- Archiv-Regel: Datum = erledigt_am, ist es nicht lesbar: geaendert_am. Archiv, wenn dieses Datum vor heute minus 14 Tagen liegt (istArchiv, archivGrenze in todos-rechnen.js).
- Datumsformate lesbar (normDatum): 2026-09-03, 03.09.2026, 03.09.26. Gilt auch für faellig_am.
- Sortierung offene: Fälligkeit (ohne Datum zuletzt), Priorität (hoch, normal, niedrig), Anlegedatum. Erledigte: zuletzt erledigt zuerst.
- Fälligkeit: überfällig = rot, heute = orange, zusätzlich als Text "(überfällig)" bzw. "(heute)". Nur für offene ToDos.
- Filter im Reiter ToDos: Suche (auch in details), Verantwortlich, Fälligkeit, Priorität, "Nur meine" (Anzeigename kommt in verantwortlich vor).
- Abhaken ohne Konfliktprüfung: js/views/todos-abhaken.js (abhakWerte, abhakenSpeichern) ändert nur erledigt, erledigt_am, erledigt_von. Wird von todos.js, start.js und projekt-todos.js benutzt. Bei Fehler springt das Häkchen zurück, Meldung. Kein Offline-Schreiben.
- Bearbeiten im Formular prüft Konflikt (bekannt = geaendert_am). Bei offenem Formular warnt die Aktualisierung einmal, wenn jemand anderes das ToDo geändert oder gelöscht hat (formPruefen).
- Aktualisierung alle 45 Sekunden (ctx.setzeRefresh); pausiert, solange ein Häkchen gespeichert wird.
- Start-Kachel ToDos: halbe Breite am PC, zeigt nur allgemeine ToDos (istAllgemein), offene (max. 10), Zählzeile, Kästchen zum Abhaken. "Erledigte anzeigen" nur letzte 2 Wochen.
- Rechenhelfer in js/views/todos-rechnen.js: normDatum, datumText, prioText, kurz, iso, heuteIso, wochenEnde, datumVon, faelligStatus, faelligText, sortieren, erledigtDatum, archivGrenze, istArchiv, sortiereErledigte, istAllgemein, istMeins, zahlenText, treffer.
- CSS-Klassen: erledigt, ueberfaellig, heute, auswahl-box, liste-erledigt, dash-todos, dash-zeile, kopf-knoepfe.
- Tabelle zeigeListe: 8. Parameter "haken" = Kästchen "erledigt".

## Festlegungen Material und buchen
- Festes Material (typ fest oder leer): anzahl = Bestand. Ausgeliehen = mitgenommen - zurueck - defekt. Verfügbar = anzahl - ausgeliehen. Defekt bei Rückgabe senkt anzahl.
- Verbrauchsmaterial (typ verbrauch): anzahl = aktueller Vorrat. Mitnehmen senkt anzahl, Rückgabe des Rests erhöht sie. Es wird nicht verfolgt, was draußen ist. Kein "defekt".
- buchen: { aktion, art mitgenommen|zurueck, person, datum, projekt_id, notiz, positionen:[{material_id, anzahl, defekt, projekt_id}] }. Bei Rückgabe ist anzahl die Gesamtzahl, defekt der kaputte Teil davon. Max. 100 Positionen. Inaktives Material kann nicht mitgenommen, aber zurückgegeben werden.
- Antwort: { eintraege, material:[{id, anzahl}] }. Fehlercodes: ungueltig, zuwenig, nicht_gefunden, beschaeftigt.
- Ausleihe wird NUR über buchen geschrieben (create/batchCreate/update/delete dafür gesperrt).
- AKTUELLER LÜCKENSTAND: Die App (material.js, material-buchen.js, material-rechnen.js) kennt den Projektbezug noch nicht (Skript schon). Rückgabe im Reiter Material schickt aktuell keine projekt_id mit und wird deshalb vom neuen Skript nur für "ohne Projekt" akzeptiert. Bis 4.4 gilt: Material, das mit projekt_id ausgeliehen wurde, lässt sich im Reiter Material nicht zurückgeben. Im Moment gibt es nur Testbuchungen mit Projekt (testenBuchenProjekt gibt sie selbst zurück). In 4.4 unbedingt zuerst die Rückgabe pro Herkunft einbauen.
- Auswahl-Modus in material.js: modus = 'mitgenommen' | 'zurueck' | 'vormerken'. Auswahl bleibt beim Reiterwechsel erhalten (Merker "merk", an Token gebunden).
- Vormerken: Projekt_Material-Zeile {projekt_id, material_id, name, kategorie, menge, beschaffung 'vorhanden'}. Gleiches Projekt + Material = update menge mit bekannt. Zeigt nur Projekte, die nicht erledigt/archiviert sind. Ohne offenes Projekt Hinweis "Lege zuerst im Reiter Projekte eins an."
- Foto-Upload: Browser verkleinert auf max. 1000 px (JPEG 0.8), Skript prüft JPEG-Kopf und Größe, speichert im Drive-Ordner der Gruppe (FOTO_ORDNER_<gruppe_id>), versucht Link-Freigabe. Im Sheet steht nur die foto_id.
- Dateien dürfen so lang sein, wie sie sein müssen. Nur aufteilen, wenn es für Rechnen oder Geschwindigkeit sinnvoll ist.

## Gruppen im Sheet (Tab Gruppen)
- g1 / kurzname fff, g2 / gp, g3 / kb. Namen im Sheet sind ausgeschrieben, Seitenleiste zeigt den Kurznamen in Großbuchstaben.
- Gruppenlogos: icons/gruppen/<kurzname>.svg (Ersatz: .png, dann icons/logo.svg), Dateinamen klein. fff und kb nur als PNG.
- Gruppenliste (öffentlich) wird in localStorage gemerkt (js/store.js).

## Farben
- AktionsDeck: Dunkelgrau #1a1e20, Dunkelgrün #368469
- FFF: #1b7340 (und Weiß); GP: #70bd1c (Schrift darauf automatisch dunkel); KB: Dunkelgrün #165834 (Hauptfarbe), Helleres Grün #2fa142, Blau #0894ad
- Im Sheet (Tab Gruppen, Spalte farbe) steht nur die Hauptfarbe. PINs stehen nie im Repo.
- CSS-Variablen: --gruppe, --gruppe-text (gesetzt in js/app.js), --gruen, --gruen-hell

## Oberfläche (Stand)
- Startseite: dunkelgrauer Balken (balken() in js/ui/kopf.js), Gruppenkacheln, drei Knöpfe Impressum / Info / Datenschutz (Texte kommen in 6.1)
- Anmeldung: Gruppenlogo + Name, PIN mit Auge
- Reiter-Reihenfolge: Start, Projekte, ToDos, Material, Posts, Kalender, Hilfe. Untere Leiste am Handy: Start, Projekte, ToDos, Material, Mehr.
- Handy: Detail legt einen Verlaufseintrag an, die Zurück-Taste schließt das Detail
- Meldungen (toast) erscheinen mittig im Bildschirm
- Start-Dashboard: Kacheln Projekte und ToDos fertig. Material, Posts, Kalender sind Platzhalter-Kacheln.
- Reiter Projekte und Material-Dialoge nutzen Fenster (modal), Reiter ToDos und Material nutzen weiter den Detailbereich rechts.

## Offen
- GitHub Actions zeigt nur Warnungen (Node 20 veraltet, ubuntu-latest wechselt ab 19.10.2026 auf Ubuntu 26). Läuft; Action-Versionen in .github/workflows später anheben.
- Testzeilen vor dem echten Einsatz löschen: Tab Projekte (ptest1 und weitere Testprojekte), Projekt_Material, Ausleihe (Zeilen mit Person "Test"), ToDos, Meilensteine
- Sicherheitstest 1.8 nur teilweise (Abmelden-Test und Sperre; Ergebnis nicht gemeldet)
- Mögliche Ursache für einmalige Fehler "Cannot read properties of undefined (reading 'forEach')": beschädigte Kopfzeile in einem Sheet-Tab (trat bei Kommentare auf, nach erneutem Einfügen der Kopfzeile behoben).
- GitHub Pages hält Dateien bis zu ca. 10 Minuten im Zwischenspeicher: nach Änderungen warten und zweimal neu laden (Beispiel: alte form.js zeigte "[object Object]").
- Etappe 6 später: Info-Texte (6.1), Sicherung (6.3), Übersicht/Export (6.4), Erinnerungen (6.5), Dunkelmodus (6.6)

## Dateiübersicht
- index.html, manifest.webmanifest, sw.js, icons/ (icon.svg, icon-192.png, icon-512.png, apple-touch-icon.png, logo.svg, gruppen/)
- css/: base.css, layout.css, components.css (Blöcke Z3, Z4, Z6, Z7/Z8, 0.12.1, Etappe 3, 3.4, 3.5, 4.1, 4.2, 4.2.1 am Ende)
- apps-script/: Code.gs, Auth.gs, Daten.gs, Schema.gs, Util.gs, Ausleihe.gs, Upload.gs (Setup.gs liegt nur im Editor)
- js/: app.js, config.js, api.js, store.js, cache.js, schema.js
- js/ui/: dom.js, toast.js, modal.js, nav.js, table.js, detail.js, form.js, logo.js, kopf.js, bild.js, lightbox.js, fenster.js, balken.js
- js/views/: gruppen.js, login.js, start.js, mehr.js, info.js, hilfe.js, platzhalter.js, material.js, material-detail.js, material-rechnen.js, material-buchen.js, material-vormerken.js, todos.js, todos-rechnen.js, todos-abhaken.js, projekte.js, projekt-rechnen.js, projekt-todos.js
- Noch nicht vorhanden: views/projekt-team.js, projekt-material.js, projekt-finanzen.js, projekt-protokoll.js, posts.js, kalender.js (Platzhalter wird gezeigt)

## Hinweise
- config.js enthält die echte API_URL: nie ersetzen, nur VERSION (und Schalter) ändern
- Neue Dateien immer auch in sw.js (HUELLE) eintragen, gelöschte austragen. Dateien in HUELLE müssen im Repo existieren, sonst wird die neue Version nicht installiert.
- Skript geändert = neue Bereitstellung (Bereitstellen → Bereitstellungen verwalten → Stift → Neue Version). URL bleibt. Neue Sheet-Spalte oder neuer Tab: erst im Sheet ergänzen (Kopfzeile prüfen, keine unsichtbaren Zeichen), dann Schema.gs (Editor und GitHub), dann formatieren() ausführen, dann neu bereitstellen.
- Skripteigenschaften (nur im Editor, nie im Repo): TOKEN_GEHEIMNIS, FOTO_ORDNER_g1, FOTO_ORDNER_g2, FOTO_ORDNER_g3
- Nach jedem Commit: Actions grün abwarten, Seite zweimal neu laden
- Formulare: js/ui/form.js. Neue Tabelle = Eintrag in Schema.gs und js/schema.js
- Listen: zeigeListe(container, zeilen, spalten, karte, onKlick, leerText, auswahl, haken) in js/ui/table.js. Hinweis: titelVon in table.js liest nur name oder text (für Meilensteine/Projekte mit "titel" bei Bedarf erweitern, falls dort Checkboxen über zeigeListe laufen).
- Konflikt (bekannt = geaendert_am): Formular zeigt Hinweis; offene Formulare werden bei der Aktualisierung nicht überschrieben
- Inaktiv = aktiv FALSE. Gelöscht = geloescht TRUE, nur im Sheet rückgängig zu machen
- Gruppenlogo: gruppenLogo(kurzname, klasse) aus js/ui/logo.js
- Öffentliche Seiten: OEFFENTLICH und oeffentlicheLinks() in js/ui/nav.js; Route #/info/<seite>
- In Util.gs gibt es schon eine Funktion namens aus(): in neuen Skriptdateien keine Variable so nennen
- Zwischenspeicher je Reiter: ladeMitCache(key, ladeFn, anzeigen, zuerstCache) in js/cache.js, Schlüssel gruppe_id:<name>. Ältere Zwischenspeicher können neue Felder noch nicht enthalten: in zeigen() Fehlendes ergänzen (wie in projekte.js und todos.js).
- Arbeitsweise im Chat: ganze Dateien zum Einfügen, Schrittnummer und Pfad nennen, am Ende Prüfliste und Tabelle "Wenn etwas nicht klappt". Der Nutzer arbeitet nur im Browser, Konsole gesperrt.

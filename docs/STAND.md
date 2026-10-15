# STAND – AktionsDeck Landau

Version der App: 0.17.1 (gleich in js/config.js und sw.js)
Repo: https://github.com/KlimastreikLandau/aktionsdeck-landau
Seite: https://klimastreiklandau.github.io/aktionsdeck-landau/

## Erledigt
- Etappe 0 und 1 (Fundament): Sheet, Skript, PIN-Login, Token, Gruppenwahl, Gerüst, Service Worker, Zwischenspeicher
- Etappe 2 Material und Ausleihe komplett (inkl. 2.5 Test): Liste, Suche, Filter, Details mit Foto, Anlegen/Ändern/Löschen, Sammel-Ausleihe, Vormerken für Projekte, Foto-Upload
- Zwischenplan Z1 bis Z8 komplett (Farben, Icons/Logo/Startseite, Info-Seiten + Reiter Hilfe, Start-Dashboard, Materialart + buchen, Sammel-Ausleihe, Vormerken, Foto-Upload)
- Etappe 3 ToDos komplett (0.13.0 bis 0.17.1): Liste, Anlegen/Ändern/Löschen, Abhaken, Filter, Fälligkeit, Konfliktwarnung, Start-Kachel, Titel + weitere Informationen, Erledigt-Tabelle, Archiv
- Test von 0.17.1 durch den Nutzer: Änderungen 0.17.0 und 0.17.1 wurden gemeldet und korrigiert; letzte Prüfliste noch nicht ausdrücklich bestätigt

## Nächste Schritte
- Neuer Chat: ZUERST einen Plan für Etappe 4 (Projekte) mit allen geplanten Features erstellen, dann umsetzen (4.1 Projekte · 4.2 Meilensteine und Team · 4.3 ToDos im Projekt · 4.4 Material übernehmen · 4.5 Finanzen · 4.6 Abhaken und Archiv)
- Etappe 4.4: im Projekt "Jetzt ausleihen" aus Projekt_Material über buchen mit projekt_id (ohne in den Reiter Material zu gehen)
- Dashboard (Start): Kachel Projekte in Etappe 4, Posts/Kalender in Etappe 5

## Wünsche des Nutzers für Etappe 4 (aus Etappe 3)
- Im Projekt gibt es den Teil "ToDos": dort stehen ALLE zum Projekt gehörenden ToDos (projekt_id), ohne Filter sichtbar. Erledigte grau und durchgestrichen.
- Dort auch die Zählzeile "3 offen · 1 überfällig · 1 heute fällig · 3 für dich": fertige Funktion zahlenText(liste, name) in js/views/todos-rechnen.js
- Die Start-Kachel ToDos zeigt nur allgemeine ToDos (ohne projekt_id und post_id). ToDos aus Projekten stehen nur im Projekt (und im Reiter ToDos).
- Zu klären im Plan: Archiv-Regel (14 Tage) auch für Projekt-ToDos? Wiederverwendung von todos-abhaken.js und der Erledigt-Darstellung.

## Festlegungen ToDos (Etappe 3)
- Tab ToDos (Spalten): id, gruppe_id, erstellt_am, erstellt_von, geaendert_am, geaendert_von, geloescht, projekt_id, post_id, text, verantwortlich, faellig_am, erledigt, erledigt_am, erledigt_von, prioritaet, sortierung, details
- "text" ist in der Oberfläche der TITEL. "details" ist "Weitere Informationen (freiwillig)". In Schema.gs und js/schema.js eingetragen. sortierung ist noch ungenutzt.
- Reiter ToDos zeigt ALLE ToDos der Gruppe (auch aus Projekten), nie versteckt: oben offene, darunter eigene Tabelle "Erledigt, letzte 2 Wochen" (graue Kopfzeile), Knopf "Archiv (Zahl)" zeigt Erledigte, die vor mehr als 14 Tagen erledigt wurden. Im Archiv gibt es keine Zählzeile. Archiv-ToDos können wieder geöffnet werden.
- Archiv-Regel: Datum = erledigt_am, ist es nicht lesbar: geaendert_am. Archiv, wenn dieses Datum vor heute minus 14 Tagen liegt (istArchiv, archivGrenze in todos-rechnen.js).
- Datumsformate lesbar (normDatum): 2026-09-03, 03.09.2026, 03.09.26. Gilt auch für faellig_am.
- Sortierung offene: Fälligkeit (ohne Datum zuletzt), Priorität (hoch, normal, niedrig), Anlegedatum. Erledigte: zuletzt erledigt zuerst.
- Fälligkeit: überfällig = rot, heute = orange, zusätzlich als Text "(überfällig)" bzw. "(heute)". Nur für offene ToDos.
- Filter im Reiter ToDos: Suche (auch in details), Verantwortlich, Fälligkeit (überfällig, heute, diese Woche, ohne Datum), Priorität, "Nur meine" (Anzeigename kommt in verantwortlich vor).
- Abhaken ohne Konfliktprüfung: js/views/todos-abhaken.js (abhakWerte, abhakenSpeichern) ändert nur erledigt, erledigt_am, erledigt_von. Wird von todos.js und start.js benutzt. Bei Fehler springt das Häkchen zurück, Meldung. Kein Offline-Schreiben.
- Bearbeiten im Formular prüft Konflikt (bekannt = geaendert_am). Bei offenem Formular warnt die Aktualisierung einmal, wenn jemand anderes das ToDo geändert oder gelöscht hat (formPruefen). Eigenes Abhaken stört das Formular nicht.
- Aktualisierung alle 45 Sekunden (ctx.setzeRefresh); pausiert, solange ein Häkchen gespeichert wird. Offenes Formular wird nie überschrieben.
- Start-Kachel ToDos: halbe Breite am PC (2 Spalten), Handy volle Breite. Kopfzeile: "ToDos" + Button "Alle ToDos →" links, "Erledigte anzeigen" rechts. Zeigt nur allgemeine ToDos (istAllgemein: projekt_id und post_id leer), offene (max. 10), Zählzeile, Kästchen zum Abhaken. "Erledigte anzeigen" zeigt nur Erledigte der letzten 2 Wochen (nicht das Archiv). Gleicher Zwischenspeicher wie der Reiter (Schlüssel gruppe_id:todos).
- Rechenhelfer in js/views/todos-rechnen.js: normDatum, datumText, prioText, kurz, iso, heuteIso, wochenEnde, datumVon, faelligStatus, faelligText, sortieren, erledigtDatum, archivGrenze, istArchiv, sortiereErledigte, istAllgemein, istMeins, zahlenText, treffer.
- CSS-Klassen: erledigt, ueberfaellig, heute (Zeilen und Karten), auswahl-box (graue Häkchen bei erledigt), liste-erledigt, dash-todos, dash-zeile, kopf-knoepfe.
- Tabelle zeigeListe: 8. Parameter "haken" = Kästchen "erledigt" (Klick auf Zeile öffnet weiter das Detail).

## Festlegungen Material und buchen
- Festes Material (typ fest oder leer): anzahl = Bestand. Ausgeliehen = mitgenommen - zurueck - defekt. Verfügbar = anzahl - ausgeliehen. Mitnehmen nur bis Verfügbar (ohne Anzahl keine Prüfung). Defekt bei Rückgabe senkt anzahl.
- Verbrauchsmaterial (typ verbrauch): anzahl = aktueller Vorrat. Mitnehmen senkt anzahl, Rückgabe des Rests erhöht sie (keine Obergrenze). Es wird nicht verfolgt, was draußen ist: Rückgabeliste zeigt alle Verbrauchsmaterialien. Kein "defekt". Neuer Vorrat über Bearbeiten.
- buchen: { aktion, art mitgenommen|zurueck, person, datum (JJJJ-MM-TT, leer = heute), projekt_id, notiz, positionen:[{material_id, anzahl, defekt}] }. Bei Rückgabe ist anzahl die Gesamtzahl, defekt der kaputte Teil davon (zwei Zeilen: zurueck und defekt).
- buchen läuft in einer Sperre, prüft zuerst alles, schreibt danach. Max. 100 Positionen, ein Material nur einmal pro Buchung. Inaktives Material kann nicht mitgenommen, aber zurückgegeben werden.
- Antwort: { eintraege: [...], material: [{id, anzahl}] }. Fehlercodes: ungueltig, zuwenig, nicht_gefunden, beschaeftigt.
- Ausleihe wird NUR über buchen geschrieben (create/batchCreate/update/delete dafür gesperrt, nurPerBuchen/nurWennAenderbar in Daten.gs).
- App prüft vorab dieselben Regeln (js/views/material-rechnen.js, material-buchen.js). Das Skript ist maßgeblich.
- Auswahl-Modus in material.js: modus = 'mitgenommen' | 'zurueck' | 'vormerken'. Auswahl bleibt beim Reiterwechsel erhalten (Merker "merk", an Token gebunden); wird gelöscht bei Abbrechen, nach Buchen, bei neuer Anmeldung.
- zeigeBuchenDialog(opt): opt.neuLaden(), opt.frisch(), opt.onFertig(). zeigeVormerkDialog(opt): opt.items, opt.onFertig().
- Vormerken: Projekt_Material-Zeile {projekt_id, material_id, name, kategorie, menge, beschaffung 'vorhanden'}. Gleiches Projekt + Material schon da = update menge mit bekannt. Vormerken zeigt nur Projekte mit status nicht erledigt/archiviert. Bis Etappe 4 gibt es keine Projekte (Testzeile ptest1 im Tab Projekte nötig zum Testen).
- Foto-Upload: Browser verkleinert auf max. 1000 px (JPEG 0.8), Skript prüft JPEG-Kopf und Größe, speichert im Drive-Ordner der Gruppe (Skripteigenschaft FOTO_ORDNER_<gruppe_id>, z. B. FOTO_ORDNER_g1; ohne Eintrag Fehlermeldung), versucht Link-Freigabe. Im Sheet steht nur die foto_id. Detail zeigt Foto per drive.google.com/thumbnail; Klick öffnet Großansicht (lightbox).
- Dateien dürfen so lang sein, wie sie sein müssen. Nur aufteilen, wenn es für Rechnen oder Geschwindigkeit sinnvoll ist (z. B. Rechenhelfer oder selten geladene Teile).

## Gruppen im Sheet (Tab Gruppen)
- g1 / kurzname fff, g2 / gp, g3 / kb. Namen im Sheet sind ausgeschrieben (Startseite zeigt sie), Seitenleiste zeigt den Kurznamen in Großbuchstaben.
- Gruppenlogos: icons/gruppen/<kurzname>.svg (Ersatz: .png, dann icons/logo.svg), Dateinamen klein. Liegen SVG und PNG nebeneinander, gewinnt die SVG. fff und kb nur als PNG.
- Gruppenliste (öffentlich) wird in localStorage gemerkt (js/store.js), Startseite zeigt sie sofort und aktualisiert im Hintergrund.

## Farben
- AktionsDeck: Dunkelgrau #1a1e20, Dunkelgrün #368469
- FFF: #1b7340 (und Weiß); GP: #70bd1c (und Weiß, Schrift darauf automatisch dunkel); KB: Dunkelgrün #165834 (Hauptfarbe), Helleres Grün #2fa142, Blau #0894ad (und Weiß) – Nebenfarben fürs Dashboard später
- Im Sheet (Tab Gruppen, Spalte farbe) steht nur die Hauptfarbe (# plus 6 Zeichen). PINs stehen nie im Repo.
- CSS-Variablen: --gruppe, --gruppe-text (gesetzt in js/app.js), --gruen, --gruen-hell

## Oberfläche (Stand)
- Startseite: dunkelgrauer Balken (balken() in js/ui/kopf.js, Logo ohne Rahmen), Gruppenkacheln (PC) / Karten (Handy) mit farbiger Unterkante, drei Knöpfe Impressum / Info / Datenschutz (Texte kommen in 6.1)
- Anmeldung: Gruppenlogo + Name, PIN mit Auge
- Reiter-Reihenfolge: Start, Projekte, ToDos, Material, Posts, Kalender, Hilfe. Untere Leiste am Handy: Start, Projekte, ToDos, Material, Mehr. Hilfe nur mit PIN (Platzhalter)
- Handy: Detail legt einen Verlaufseintrag an, die Zurück-Taste schließt das Detail und bleibt im Reiter
- Meldungen (toast) erscheinen mittig im Bildschirm
- Start-Dashboard: Kachel ToDos fertig (siehe oben). Projekte, Material, Posts, Kalender sind noch Platzhalter-Kacheln.

## Offen
- GitHub Actions zeigt nur Warnungen (Node 20 veraltet, ubuntu-latest wechselt ab 19.10.2026 auf Ubuntu 26). Läuft; Action-Versionen in .github/workflows später anheben.
- Testzeilen (Tab Projekte ptest1, Projekt_Material, Ausleihe, ToDos) vor dem echten Einsatz löschen
- Sicherheitstest 1.8 nur teilweise (Abmelden-Test und Sperre standen in der Prüfliste 3.4; Ergebnis nicht gemeldet)
- js/ui/lightbox.js fehlt in der Liste HUELLE in sw.js (wird nur online geladen). Bei Gelegenheit eintragen.
- Etappe 6 später: Info-Texte (6.1), Sicherung (6.3), Übersicht/Export (6.4), Erinnerungen (6.5), Dunkelmodus (6.6)

## Dateiübersicht
- index.html, manifest.webmanifest, sw.js, icons/ (icon.svg, icon-192.png, icon-512.png, apple-touch-icon.png, logo.svg, gruppen/)
- css/: base.css, layout.css, components.css (Blöcke Z3, Z4, Z6, Z7/Z8, 0.12.1, Etappe 3, 3.4, 3.5 am Ende)
- apps-script/: Code.gs, Auth.gs, Daten.gs, Schema.gs, Util.gs, Ausleihe.gs, Upload.gs (Setup.gs liegt nur im Editor)
- js/: app.js, config.js, api.js, store.js, cache.js, schema.js
- js/ui/: dom.js, toast.js, modal.js, nav.js, table.js, detail.js, form.js, logo.js, kopf.js, bild.js, lightbox.js
- js/views/: gruppen.js, login.js, start.js, mehr.js, info.js, hilfe.js, platzhalter.js, material.js, material-detail.js, material-rechnen.js, material-buchen.js, material-vormerken.js, todos.js, todos-rechnen.js, todos-abhaken.js
- Noch nicht vorhanden: views/projekte.js, posts.js, kalender.js (Platzhalter wird gezeigt)

## Hinweise
- config.js enthält die echte API_URL: nie ersetzen, nur VERSION (und Schalter) ändern
- Neue Dateien immer auch in sw.js (HUELLE) eintragen, gelöschte austragen. Dateien in HUELLE müssen im Repo existieren, sonst wird die neue Version nicht installiert.
- Skript geändert = neue Bereitstellung (Bereitstellen → Bereitstellungen verwalten → Stift → Neue Version). URL bleibt. Neue Sheet-Spalte: erst Spalte im Sheet ergänzen, dann Schema.gs (Editor und GitHub), dann formatieren() ausführen, dann neu bereitstellen.
- Skripteigenschaften (nur im Editor, nie im Repo): TOKEN_GEHEIMNIS, FOTO_ORDNER_g1, FOTO_ORDNER_g2, FOTO_ORDNER_g3
- Nach jedem Commit: Actions grün abwarten, Seite zweimal neu laden (der Service Worker prüft Dateien immer neu)
- Formulare: js/ui/form.js. Neue Tabelle = Eintrag in Schema.gs und js/schema.js
- Listen: zeigeListe(container, zeilen, spalten, karte, onKlick, leerText, auswahl, haken) in js/ui/table.js
- Konflikt (bekannt = geaendert_am): Formular zeigt Hinweis; offene Formulare werden bei der Aktualisierung nicht überschrieben
- Inaktiv = aktiv FALSE. Gelöscht = geloescht TRUE, nur im Sheet rückgängig zu machen
- Gruppenlogo: gruppenLogo(kurzname, klasse) aus js/ui/logo.js
- Öffentliche Seiten: OEFFENTLICH und oeffentlicheLinks() in js/ui/nav.js; Route #/info/<seite>
- In Util.gs gibt es schon eine Funktion namens aus(): in neuen Skriptdateien keine Variable so nennen
- Zwischenspeicher je Reiter: ladeMitCache(key, ladeFn, anzeigen, zuerstCache) in js/cache.js, Schlüssel gruppe_id:<name>

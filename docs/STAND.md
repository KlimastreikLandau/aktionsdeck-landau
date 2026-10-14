# STAND – AktionsDeck Landau

Version der App: 0.12.1 (gleich in js/config.js und sw.js)
Repo: https://github.com/KlimastreikLandau/aktionsdeck-landau
Seite: https://klimastreiklandau.github.io/aktionsdeck-landau/

## Erledigt
- Etappe 0 und 1 (Fundament): Sheet, Skript, PIN-Login, Token, Gruppenwahl, Gerüst, Service Worker, Zwischenspeicher
- Etappe 2 Material und Ausleihe komplett: Liste, Suche, Kategorie- und Status-Filter, Details mit Foto, Anlegen/Ändern/Löschen, Sammel-Ausleihe (Ausleihen/Zurückgeben mit Checkboxen), Vormerken für Projekte, Foto-Upload
- Zwischenplan Z1 bis Z8 komplett (Farben, Icons/Logo/Startseite, Info-Seiten + Reiter Hilfe, Start-Dashboard-Platzhalter, Materialart + buchen, Sammel-Ausleihe, Vormerken, Foto-Upload)
- 0.12.1: Seitenleiste Logo links + Kurzname rechts; Meldungen (Toast) mittig im Bildschirm; Foto im Detail anklickbar (große Ansicht, js/ui/lightbox.js); Foto-Upload je Gruppe in eigenen Ordner; Service Worker holt Dateien mit cache:'no-cache' (kein alter Stand mehr durch den 10-Minuten-Zwischenspeicher von GitHub Pages)
- Test von 0.12.1 durch den Nutzer: offen (siehe Prüfliste im letzten Chat)

## Nächste Schritte
- Neuer Chat: ZUERST einen Plan für Etappe 3 (ToDos) mit allen geplanten Features erstellen, dann umsetzen (3.1 Liste und Anlegen · 3.2 Abhaken und Ausblenden · 3.3 Fälligkeit, Verantwortliche, Filter · 3.4 Aktualisierung und Konflikte)
- Dashboard (Start) mit Kacheln füllen (ToDos in Etappe 3, Projekte Etappe 4, Posts/Kalender Etappe 5)
- Etappe 4.4: im Projekt "Jetzt ausleihen" aus Projekt_Material über buchen mit projekt_id (ohne in den Reiter Material zu gehen)

## Hinweise für Etappe 3 (ToDos)
- Tab ToDos im Sheet (Spalten): id, gruppe_id, erstellt_am, erstellt_von, geaendert_am, geaendert_von, geloescht, projekt_id, post_id, text, verantwortlich, faellig_am, erledigt, erledigt_am, erledigt_von, prioritaet, sortierung
- In Schema.gs ist ToDos schon als Tabelle eingetragen; in js/schema.js fehlt der Eintrag (SCHEMA.ToDos) noch
- Reiter-Datei: js/views/todos.js (bisher Platzhalter). Reiter ist in config.js features.todos = true
- Vorhandene Bausteine zum Wiederverwenden: zeigeListe (js/ui/table.js, mit optionaler Auswahl), zeigeDetail/schliesseDetail (js/ui/detail.js), baueFormular (js/ui/form.js, Typen text, zahl, langtext, auswahl, bool, foto, datum), ladeMitCache (js/cache.js), Konflikt über "bekannt" = geaendert_am, toast, ctx.setzeRefresh
- Personen-Tab (name, aktiv) existiert; "verantwortlich" könnte daraus oder aus Namen früherer Einträge vorgeschlagen werden (Datalist)
- Anzeigename des Geräts: getName() (js/store.js)
- Projekte gibt es erst in Etappe 4: ToDos mit projekt_id/post_id sind vorbereitet, aber noch ohne Projektbezug nutzbar
- Vorlagen für Vorlauf-ToDos kommen erst in 5.3 (Tab Vorlagen_ToDo)

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
- Vormerken: Projekt_Material-Zeile {projekt_id, material_id, name, kategorie, menge, beschaffung 'vorhanden'}. Gleiches Projekt + Material schon da = update menge mit bekannt. Es gibt bis Etappe 4 keine Projekte (Testzeile ptest1 im Tab Projekte nötig zum Testen).
- Foto-Upload: Browser verkleinert auf max. 1000 px (JPEG 0.8), Skript prüft JPEG-Kopf und Größe, speichert im Drive-Ordner der Gruppe (Skripteigenschaft FOTO_ORDNER_<gruppe_id>, z. B. FOTO_ORDNER_g1; ohne Eintrag Fehlermeldung), versucht Link-Freigabe. Im Sheet steht nur die foto_id. Detail zeigt Foto per drive.google.com/thumbnail; Klick öffnet Großansicht (lightbox).
- Zusammengehörige Dateien nicht aufteilen, 300-Zeilen-Grenze gilt nicht mehr.

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

## Offen
- GitHub Actions zeigt nur Warnungen (Node 20 veraltet, ubuntu-latest wechselt ab 19.10.2026 auf Ubuntu 26). Läuft; Action-Versionen in .github/workflows später anheben.
- Testzeilen (Tab Projekte ptest1, Projekt_Material, Ausleihe) vor dem echten Einsatz löschen
- Dashboard (Start) ist Platzhalter
- Etappe 6 später: Info-Texte (6.1), Sicherung (6.3), Übersicht/Export (6.4), Erinnerungen (6.5), Dunkelmodus (6.6)

## Dateiübersicht
- index.html, manifest.webmanifest, sw.js, icons/ (icon.svg, icon-192.png, icon-512.png, apple-touch-icon.png, logo.svg, gruppen/)
- css/: base.css, layout.css, components.css (Blöcke Z3, Z4, Z6, Z7/Z8, 0.12.1 am Ende)
- apps-script/: Code.gs, Auth.gs, Daten.gs, Schema.gs, Util.gs, Ausleihe.gs, Upload.gs (Setup.gs liegt nur im Editor)
- js/: app.js, config.js, api.js, store.js, cache.js, schema.js
- js/ui/: dom.js, toast.js, modal.js, nav.js, table.js, detail.js, form.js, logo.js, kopf.js, bild.js, lightbox.js
- js/views/: gruppen.js, login.js, start.js, mehr.js, info.js, hilfe.js, platzhalter.js, material.js, material-detail.js, material-rechnen.js, material-buchen.js, material-vormerken.js
- Noch nicht vorhanden: views/todos.js, projekte.js, posts.js, kalender.js (Platzhalter wird gezeigt)

## Hinweise
- config.js enthält die echte API_URL: nie ersetzen, nur VERSION (und Schalter) ändern
- Neue Dateien immer auch in sw.js (HUELLE) eintragen, gelöschte austragen. Dateien in HUELLE müssen im Repo existieren, sonst wird die neue Version nicht installiert.
- Skript geändert = neue Bereitstellung (Bereitstellen → Bereitstellungen verwalten → Stift → Neue Version). URL bleibt.
- Skripteigenschaften (nur im Editor, nie im Repo): TOKEN_GEHEIMNIS, FOTO_ORDNER_g1, FOTO_ORDNER_g2, FOTO_ORDNER_g3
- Nach jedem Commit: Actions grün abwarten, Seite neu laden (der Service Worker prüft Dateien jetzt immer neu)
- Formulare: js/ui/form.js. Neue Tabelle = Eintrag in Schema.gs und js/schema.js
- Listen: zeigeListe(container, zeilen, spalten, karte, onKlick, leerText, auswahl) in js/ui/table.js
- Konflikt (bekannt = geaendert_am): Formular zeigt Hinweis; offene Formulare werden bei der Aktualisierung nicht überschrieben
- Inaktiv = aktiv FALSE. Gelöscht = geloescht TRUE, nur im Sheet rückgängig zu machen
- Gruppenlogo: gruppenLogo(kurzname, klasse) aus js/ui/logo.js
- Öffentliche Seiten: OEFFENTLICH und oeffentlicheLinks() in js/ui/nav.js; Route #/info/<seite>
- In Util.gs gibt es schon eine Funktion namens aus(): in neuen Skriptdateien keine Variable so nennen

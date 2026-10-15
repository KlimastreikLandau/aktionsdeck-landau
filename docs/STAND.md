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
- Reiter ToDos zeigt ALLE ToDos der Gruppe (auch aus Projekten), nie versteckt: oben offene, darunter

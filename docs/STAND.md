# Stand AktionsDeck Landau

Erledigt bis Schritt: 2.2 (Version 0.5.0). Nächster Schritt: 2.3 Anlegen und Ändern.
Repo: https://github.com/KlimastreikLandau/aktionsdeck-landau
Seite: https://klimastreiklandau.github.io/aktionsdeck-landau/
Plan: siehe Projektbeschreibung (Aufbau, Tabs, Schritte 0 bis 6).

## Arbeitsweise (vom Nutzer gewünscht)
- Antworten auf Deutsch, einfache Worte, immer Dateipfad und Schrittnummer
- Ganze Dateien zum Einfügen. Der Nutzer arbeitet nur im Browser (GitHub-Webeditor, Sheet, Apps-Script-Editor)
- Kurz sagen, wo geklickt wird. Höchstens eine Rückfrage am Ende
- Reiter-Dateien in sw.js (HUELLE) eintragen, VERSION in js/config.js UND sw.js gleich hochzählen
- Test 1.8.1 (Konsole) wurde übersprungen, weil die Konsole gesperrt ist. Sicherheit ist ungetestet.
  Test mit zwei Geräten kommt in 2.5. Eine Testseite im Repo wäre eine Alternative.

## Apps-Script (im Sheet, Kopie in apps-script/)
- Code.gs: doPost liest JSON, Feld "aktion", ruft verteile(p)
- Schema.gs: BASIS-Spalten, TABELLEN (Daten-Tabs), SYSTEM (Gruppen, Zugang, Einstellungen, Log),
  NUR_ANHAENGEN = ['Ausleihe'], Zahl- und Bool-Spalten
- Util.gs: jetzt(), fehler(code,text,data), lies(tab), anhaengen(), typisieren(), schuetzen() (Hochkomma),
  pinHash(salt,pin) = SHA-256 von "salt:pin", signiere() nutzt Skripteigenschaft TOKEN_GEHEIMNIS,
  mitSperre(fn), anzeigename(p), protokoll()
- Auth.gs: aktionGruppen, aktionLogin (Feld "gruppe" = gruppe_id oder kurzname, "pin"),
  Token HMAC 14 Tage, Sperre 8 Fehlversuche / 15 Min, tokenPruefen(token)
- Daten.gs: bootstrap, list, create, update, delete (weich), batchCreate
- Setup.gs: einmalig setupPins() (PINs eintippen, Hash nach Tab Zugang)
- Bereitstellung: Web-App, Ausführen als Besitzer, Zugriff Jeder. Nach Code-Änderung:
  Bereitstellen, Bereitstellungen verwalten, Stift, Neue Version (URL bleibt gleich)

## API
- POST, Content-Type text/plain, JSON-Feld "aktion" (nicht "action")
- login: { gruppe, pin } -> { token, gruppe, zugang_id }
- Alle anderen Aufrufe: Feld "token"; "anzeigename" schickt js/api.js automatisch mit
- list: { tabelle, seit? } -> { zeilen, serverzeit }  (mit "seit" auch gelöschte Zeilen)
- create: { tabelle, daten } -> neuer Eintrag. update: { tabelle, id, daten, bekannt } -> { eintrag, geaendert }
- delete: { tabelle, id, bekannt? } (weich). batchCreate: { tabelle, liste } (1 bis 200)
- bootstrap -> { gruppe, zugang_id, serverzeit, personen, einstellungen }
- Antwort: { ok, data, error, code }. Codes: auth, login, gesperrt, ungueltig, konflikt (data.aktuell),
  nicht_gefunden, beschaeftigt, intern
- Ausleihe: nur anhängen (create/batchCreate), kein update/delete

## Web-App (js/)
- config.js: VERSION, API_URL, features, REFRESH_SEKUNDEN (45)
- api.js: api(aktion, params, token); Fehler-Objekt hat e.code, e.data
- store.js: getSession/setSession/clearSession (localStorage), getName/setName
- cache.js: IndexedDB. ladeMitCache(key, ladeFn, anzeigen(daten,{aktuell,stand}), zuerstCache), cacheLeeren()
- schema.js: SCHEMA (Material, Ausleihe mit felder[name,label,typ,pflicht,optionen]), istWahr(), istFalsch()
- app.js: Routing #/g/<kurzname>/<reiter>, #/info ohne Login, Name-Abfrage, Auto-Aktualisierung.
  ctx: neuLaden, abmelden, nameAendern, behandleFehler(e), setzeRefresh(fn), session, tab, detail, version
  Reiter laden per import('./views/<reiter>.js'), sonst views/platzhalter.js
- ui/dom.js: el(tag, eigenschaften, ...kinder), leeren(container) (nur textContent)
- ui/toast.js: toast(text). ui/modal.js: frageName(aktuell, darfAbbrechen)
- ui/nav.js: TABS, sichtbareTabs(), tabLabel(), baueGeruest() (Seitenleiste PC, untere Leiste Handy)
- ui/table.js: zeigeListe(container, zeilen, spalten, karte, onKlick, leerText) (Tabelle PC, Karten Handy)
- ui/detail.js: zeigeDetail(panel, titel, inhalt, beiZu, neu), schliesseDetail(panel)
- views/gruppen.js, login.js, start.js, mehr.js, info.js (Texte kommen in 6.1), platzhalter.js
- views/material.js: Liste, Suche, Kategorie-Filter, Verfügbar (anzahl - mitgenommen + zurueck), Detail bei Klick
- views/material-detail.js: fotoId(), baueDetail(m, verlauf) (Foto von drive.google.com/thumbnail, letzte 10 Ausleihen)
- sw.js: Cache "aktionsdeck-<VERSION>", Liste HUELLE pflegen
- css/base.css, layout.css (Gerüst, Detailbereich), components.css (Knöpfe, Karten, Listen, Detail)

## Sheet / Testdaten
- Tab Material: Testzeilen m1 (Banner groß, mit foto_id), m2 Megafon, m3 Plakatkarton (gruppe_id = FFF)
- Tab Ausleihe: ggf. Testzeile a1 löschen
- Gruppen: Fridays for Future (FFF), Greenpeace, Klimabündnis. PINs gesetzt (Nutzer hat sie notiert)

## Offen und bekannt
- Nutzer meldet: Anzeige ist noch etwas fehlerhaft. Er sammelt Anmerkungen und meldet sie gesammelt später
- 2.3 Anlegen und Ändern (Formular, update mit "bekannt" = geaendert_am, Konflikt-Hinweis, weich löschen)
- 2.4 Ausleihe (anhängen, Rückgabe). 2.5 Test mit zwei Geräten
- Für 2.3 im neuen Chat einfügen: js/schema.js, js/views/material.js, js/views/material-detail.js, js/ui/detail.js

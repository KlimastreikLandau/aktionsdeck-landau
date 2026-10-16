// js/views/projekt-team.js
// Teil "Team und Hüte" eines Projekts.
// Ein Hut ist eine Zuständigkeit (z. B. Presse). Gespeichert im Tab Projekt_Team (person, zustaendigkeit).
// Eine Zeile ohne Person ist ein freier Hut. Niemand wird zugeteilt: jede Person trägt sich selbst ein
// oder gibt den Hut weiter. Zahlen (offen/überfällig) kommen aus den ToDos dieses Projekts.
//
// opt: { ctx, token, projekt, holeDaten() -> { todos, team }, offen, beiToggle(offen), neuLaden() -> Promise }

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';
import { istWahr } from '../schema.js';
import { faelligStatus, istMeins } from './todos-rechnen.js';

const FELDER = [
  { name: 'person', label: 'Person (leer lassen = Hut ist noch frei)', typ: 'text' },
  { name: 'zustaendigkeit', label: 'Hut (Zuständigkeit), z. B. Presse', typ: 'text' }
];

function txt(v) {
  return String(v === undefined || v === null ? '' : v).trim();
}

function gleichText(a, b) {
  return txt(a).toLowerCase() === txt(b).toLowerCase();
}

// "Anna, Ben und Chris" -> ['Anna', 'Ben', 'Chris']
function splitNamen(v) {
  return txt(v).split(/[,;]|\sund\s|\s&\s/).map(txt).filter(Boolean);
}

export function baueTeamTeil(opt) {
  const ctx = opt.ctx;
  const pid = String(opt.projekt.id);

  function daten() { return opt.holeDaten(); }

  const alleTeam = daten().team || [];
  const team = alleTeam.filter(function (r) { return txt(r.projekt_id) === pid; });
  const offeneTodos = daten().todos.filter(function (t) {
    return txt(t.projekt_id) === pid && !istWahr(t.erledigt);
  });

  // ---- Zahlen und Vorschläge ----

  function zahlen(name) {
    const mein = offeneTodos.filter(function (t) { return istMeins(t, name); });
    return {
      offen: mein.length,
      ueber: mein.filter(function (t) { return faelligStatus(t) === 'ueberfaellig'; }).length
    };
  }

  function zahlenText(z) {
    return z.offen + ' offen' + (z.ueber ? ' · ' + z.ueber + ' überfällig' : '');
  }

  // Vorschläge aus Namen, die schon in der App vorkommen. Nichts wird fest zugeteilt.
  function personenVorschlaege() {
    const liste = [];
    const merke = function (n) {
      const k = txt(n);
      if (k && liste.indexOf(k) < 0) liste.push(k);
    };
    merke(getName());
    alleTeam.forEach(function (r) { merke(r.person); });
    daten().todos.forEach(function (t) { splitNamen(t.verantwortlich).forEach(merke); });
    liste.sort(function (a, b) { return a.localeCompare(b, 'de'); });
    return liste;
  }

  // Hüte, die in der Gruppe schon einmal benutzt wurden (nur als Vorschlag)
  function hutVorschlaege() {
    const liste = [];
    alleTeam.forEach(function (r) {
      const h = txt(r.zustaendigkeit);
      if (h && !liste.some(function (x) { return gleichText(x, h); })) liste.push(h);
    });
    liste.sort(function (a, b) { return a.localeCompare(b, 'de'); });
    return liste;
  }

  // ---- Gruppieren ----

  const huete = [];
  const ohneHut = [];
  team.forEach(function (r) {
    const h = txt(r.zustaendigkeit);
    if (!h) {
      if (txt(r.person)) ohneHut.push(r);
      return;
    }
    let g = huete.find(function (x) { return gleichText(x.name, h); });
    if (!g) {
      g = { name: h, zeilen: [] };
      huete.push(g);
    }
    g.zeilen.push(r);
  });
  huete.sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });

  const bekannt = team.map(function (r) { return txt(r.person).toLowerCase(); }).filter(Boolean);
  const weitere = [];
  offeneTodos.forEach(function (t) {
    splitNamen(t.verantwortlich).forEach(function (n) {
      const k = n.toLowerCase();
      if (bekannt.indexOf(k) >= 0) return;
      if (weitere.some(function (w) { return w.toLowerCase() === k; })) return;
      weitere.push(n);
    });
  });
  weitere.sort(function (a, b) { return a.localeCompare(b, 'de'); });

  const personenAnzahl = bekannt.filter(function (k, i) { return bekannt.indexOf(k) === i; }).length;
  const freieHuete = huete.filter(function (g) {
    return g.zeilen.every(function (r) { return !txt(r.person); });
  }).length;

  // ---- Fehler und Fenster ----

  function fehlerFuer(e) {
    if (e.code === 'konflikt') {
      opt.neuLaden();
      return new Error('Jemand anderes hat diesen Eintrag gerade geändert. ' +
        'Klicke auf „Abbrechen“ und öffne ihn noch einmal.');
    }
    if (e.code === 'nicht_gefunden') {
      opt.neuLaden();
      return new Error('Diesen Eintrag gibt es nicht mehr. Klicke auf „Abbrechen“.');
    }
    return e;
  }

  function formFenster(titel, form, loeschen) {
    const inhalt = el('div', null, form);
    if (loeschen) {
      inhalt.append(el('div', { class: 'fenster-loeschen' },
        el('button', { class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen', onclick: loeschen })
      ));
    }
    return zeigeFenster(titel, inhalt);
  }

  // ---- Person oder Hut anlegen und ändern (r = null heißt neu, vorgabe = Startwerte) ----

  function teamFormZeigen(r, vorgabe) {
    let fenster = null;
    const form = baueFormular(FELDER, r || vorgabe || {}, {
      speichernText: r ? 'Speichern' : 'Anlegen',
      vorschlaege: { person: personenVorschlaege(), zustaendigkeit: hutVorschlaege() },
      onSpeichern: function (d) { return teamSpeichern(r, d, fenster); },
      onAbbrechen: function () { fenster.schliessen(); }
    });
    fenster = formFenster(
      r ? 'Team bearbeiten' : 'Person oder Hut hinzufügen',
      form,
      r ? function () { teamLoeschen(r, fenster); } : null
    );
  }

  async function teamSpeichern(r, d, fenster) {
    if (!d.person && !d.zustaendigkeit) {
      throw new Error('Bitte eine Person oder einen Hut eintragen.');
    }
    d.projekt_id = pid;
    try {
      if (!r) {
        await api('create', { tabelle: 'Projekt_Team', daten: d }, opt.token);
        fenster.schliessen();
        toast('Eintrag angelegt.');
      } else {
        const res = await api('update', {
          tabelle: 'Projekt_Team', id: r.id, daten: d, bekannt: r.geaendert_am
        }, opt.token);
        fenster.schliessen();
        toast(res.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      }
      opt.beiToggle(true);
      await opt.neuLaden();
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      throw fehlerFuer(e);
    }
  }

  async function teamLoeschen(r, fenster) {
    const was = txt(r.zustaendigkeit)
      ? 'Hut „' + txt(r.zustaendigkeit) + '“' + (txt(r.person) ? ' von ' + txt(r.person) : '')
      : txt(r.person);
    if (!window.confirm('Diesen Eintrag wirklich löschen?\n\n' + was)) return;
    try {
      await api('delete', { tabelle: 'Projekt_Team', id: r.id, bekannt: r.geaendert_am }, opt.token);
      fenster.schliessen();
      toast('Gelöscht.');
      await opt.neuLaden();
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        toast('Jemand anderes hat dies gerade geändert. Bitte neu öffnen.');
        opt.neuLaden();
      } else {
        toast(e.message);
      }
    }
  }

  // ---- Hut weitergeben, besetzen, übernehmen ----

  async function personSetzen(r, name, fenster, text) {
    try {
      const res = await api('update', {
        tabelle: 'Projekt_Team', id: r.id, daten: { person: name }, bekannt: r.geaendert_am
      }, opt.token);
      if (fenster) fenster.schliessen();
      toast(res.geaendert ? text : 'Nichts geändert.');
      opt.beiToggle(true);
      await opt.neuLaden();
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      throw fehlerFuer(e);
    }
  }

  function weitergebenZeigen(r) {
    let fenster = null;
    const aktuell = txt(r.person);
    const form = baueFormular(
      [{ name: 'person', label: 'Neue Person (leer lassen = Hut wird frei)', typ: 'text' }],
      { person: '' },
      {
        speichernText: aktuell ? 'Weitergeben' : 'Eintragen',
        vorschlaege: { person: personenVorschlaege() },
        onSpeichern: function (d) {
          return personSetzen(r, d.person, fenster,
            d.person ? 'Hut an ' + d.person + ' gegeben.' : 'Hut ist jetzt frei.');
        },
        onAbbrechen: function () { fenster.schliessen(); }
      }
    );
    fenster = zeigeFenster(
      'Hut „' + txt(r.zustaendigkeit) + '“ ' + (aktuell ? 'weitergeben' : 'besetzen'),
      el('div', null,
        aktuell ? el('p', { class: 'leise', text: 'Aktuell hat ' + aktuell + ' diesen Hut.' }) : null,
        form
      )
    );
  }

  async function ichUebernehme(r) {
    const n = getName();
    if (!n) {
      toast('Bitte zuerst deinen Namen eintragen (Name ändern).');
      return;
    }
    try {
      await personSetzen(r, n, null, 'Du hast den Hut übernommen.');
    } catch (e) {
      toast(e.message);
    }
  }

  // ---- Zeichnen ----

  function knopf(text, hell, fn) {
    return el('button', {
      class: 'knopf' + (hell ? ' knopf-hell' : ''), type: 'button', text: text, onclick: fn
    });
  }

  function personZeile(r) {
    const person = txt(r.person);
    const hut = txt(r.zustaendigkeit);
    const text = el('div', { class: 'hut-person-text' });
    const knoepfe = el('div', { class: 'hut-knoepfe' });

    if (person) {
      const z = zahlen(person);
      text.append(
        el('strong', { text: person }),
        el('span', { class: 'leise hut-zahlen' + (z.ueber ? ' ueber' : ''), text: zahlenText(z) })
      );
      if (hut) knoepfe.append(knopf('Hut weitergeben', true, function () { weitergebenZeigen(r); }));
    } else {
      text.append(el('span', { class: 'leise', text: 'Noch niemand' }));
      knoepfe.append(
        knopf('Ich übernehme', false, function () { ichUebernehme(r); }),
        knopf('Person eintragen', true, function () { weitergebenZeigen(r); })
      );
    }
    knoepfe.append(knopf('Bearbeiten', true, function () { teamFormZeigen(r); }));
    return el('div', { class: 'hut-person' }, text, knoepfe);
  }

  function hutBlock(g) {
    const frei = g.zeilen.every(function (r) { return !txt(r.person); });
    const box = el('section', { class: 'hut' + (frei ? ' frei' : '') },
      el('div', { class: 'hut-titel' },
        el('strong', { text: '🎩 ' + g.name }),
        frei ? el('span', { class: 'status-marke status-planung', text: 'noch frei' }) : null
      )
    );
    g.zeilen.forEach(function (r) { box.append(personZeile(r)); });
    return box;
  }

  const body = el('div', { class: 'projekt-teil-body' },
    el('div', { class: 'teil-aktionen' },
      el('button', {
        class: 'knopf', type: 'button', text: '+ Person oder Hut',
        onclick: function () { teamFormZeigen(null, null); }
      })
    )
  );

  if (!huete.length && !ohneHut.length && !weitere.length) {
    body.append(el('p', {
      class: 'leise',
      text: 'Noch niemand im Team und noch kein Hut. Mit „+ Person oder Hut“ geht es los. ' +
        'Ein Hut ohne Person steht als „noch frei“ da, jede Person kann ihn selbst übernehmen.'
    }));
  }

  if (huete.length) {
    body.append(el('h3', { class: 'teil-titel-klein', text: 'Hüte' }));
    huete.forEach(function (g) { body.append(hutBlock(g)); });
  }

  if (ohneHut.length) {
    body.append(el('h3', { class: 'teil-titel-klein', text: 'Im Team ohne Hut' }));
    const box = el('section', { class: 'hut' });
    ohneHut.forEach(function (r) { box.append(personZeile(r)); });
    body.append(box);
  }

  if (weitere.length) {
    body.append(el('h3', { class: 'teil-titel-klein', text: 'Weitere mit ToDos (ohne Hut)' }));
    const box = el('section', { class: 'hut' });
    weitere.forEach(function (n) {
      const z = zahlen(n);
      box.append(el('div', { class: 'hut-person' },
        el('div', { class: 'hut-person-text' },
          el('strong', { text: n }),
          el('span', { class: 'leise hut-zahlen' + (z.ueber ? ' ueber' : ''), text: zahlenText(z) })
        ),
        el('div', { class: 'hut-knoepfe' },
          knopf('Zum Team', true, function () { teamFormZeigen(null, { person: n }); })
        )
      ));
    });
    body.append(box);
  }

  const kurzInfo = personenAnzahl + (personenAnzahl === 1 ? ' Person' : ' Personen') +
    (freieHuete ? ' · ' + freieHuete + (freieHuete === 1 ? ' Hut frei' : ' Hüte frei') : '');

  const teil = el('details', { class: 'projekt-teil' });
  if (opt.offen) teil.open = true;
  teil.addEventListener('toggle', function () { opt.beiToggle(teil.open); });
  teil.append(
    el('summary', null,
      el('span', { class: 'teil-pfeil', 'aria-hidden': 'true', text: '▸' }),
      el('strong', { text: 'Team und Hüte' }),
      el('span', { class: 'leise', text: kurzInfo })
    ),
    body
  );
  return teil;
}

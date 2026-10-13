// js/views/material.js
// Reiter Material: Liste mit Suche, Kategorie-Filter, Status-Filter, Verfügbar-Spalte,
// Details, Anlegen, Ändern und Löschen.
// Verfügbar = anzahl - Summe mitgenommen + Summe zurueck.

import { el, leeren } from '../ui/dom.js';
import { api } from '../api.js';
import { ladeMitCache } from '../cache.js';
import { zeigeListe } from '../ui/table.js';
import { zeigeDetail, schliesseDetail } from '../ui/detail.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { baueDetail, fotoId } from './material-detail.js';
import { istFalsch, SCHEMA } from '../schema.js';

function zahl(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

function runden(n) {
  return Math.round(n * 100) / 100;
}

// Pro Material: Summe zurueck minus Summe mitgenommen
function bewegung(ausleihen) {
  const m = {};
  ausleihen.forEach(function (a) {
    const id = String(a.material_id);
    if (a.art === 'mitgenommen') m[id] = (m[id] || 0) - zahl(a.anzahl);
    else if (a.art === 'zurueck') m[id] = (m[id] || 0) + zahl(a.anzahl);
  });
  return m;
}

function mitVerfuegbar(m, bew) {
  const v = m.anzahl === '' || m.anzahl === undefined
    ? ''
    : runden(zahl(m.anzahl) + (bew[String(m.id)] || 0));
  return Object.assign({}, m, { _verfuegbar: v });
}

function zeitText(iso) {
  return new Date(iso).toLocaleString('de-DE');
}

export async function render(container, ctx) {
  const s = ctx.session;
  leeren(container);

  let daten = { material: [], ausleihe: [] };
  let offenId = null;
  let formOffen = false;
  const status = el('p', { class: 'leise', text: 'Lade Daten …' });
  const suche = el('input', {
    class: 'feld', type: 'search', placeholder: 'Suchen …', 'aria-label': 'Suchen'
  });
  const kat = el('select', { class: 'feld', 'aria-label': 'Kategorie' });
  const stat = el('select', { class: 'feld', 'aria-label': 'Status' },
    el('option', { value: 'aktiv', text: 'Aktive' }),
    el('option', { value: 'inaktiv', text: 'Nicht aktive' }),
    el('option', { value: 'alle', text: 'Alle' })
  );
  const box = el('div');

  container.append(el('div', { class: 'seite' },
    el('div', { class: 'kopfzeile' },
      el('h1', { text: 'Material' }),
      el('button', {
        class: 'knopf',
        type: 'button',
        text: '+ Neu',
        onclick: function () { offenId = null; formZeigen(null); }
      })
    ),
    el('div', { class: 'filterzeile' }, suche, kat, stat),
    status,
    box
  ));

  // Alle verschiedenen Werte einer Spalte, sortiert
  function werteVon(feld) {
    const liste = [];
    daten.material.forEach(function (m) {
      const k = String(m[feld] || '').trim();
      if (k && liste.indexOf(k) < 0) liste.push(k);
    });
    liste.sort(function (a, b) { return a.localeCompare(b, 'de'); });
    return liste;
  }

  function kategorienAufbauen() {
    const gewaehlt = kat.value;
    const liste = werteVon('kategorie');
    leeren(kat);
    kat.append(el('option', { value: '', text: 'Alle Kategorien' }));
    liste.forEach(function (k) { kat.append(el('option', { value: k, text: k })); });
    kat.value = liste.indexOf(gewaehlt) >= 0 ? gewaehlt : '';
  }

  // ---- Detail ----

  function detailZeigen(id, neu) {
    const m = daten.material.find(function (x) { return String(x.id) === String(id); });
    if (!m) {
      offenId = null;
      schliesseDetail(ctx.detail);
      return;
    }
    const z = mitVerfuegbar(m, bewegung(daten.ausleihe));
    const verlauf = daten.ausleihe.filter(function (a) {
      return String(a.material_id) === String(m.id);
    });
    const inhalt = el('div', null,
      el('div', { class: 'detail-knoepfe' },
        el('button', {
          class: 'knopf', type: 'button', text: 'Bearbeiten',
          onclick: function () { formZeigen(m); }
        }),
        el('button', {
          class: 'knopf knopf-gefahr', type: 'button', text: 'Löschen',
          onclick: function () { loeschen(m); }
        })
      ),
      istFalsch(m.aktiv)
        ? el('p', { class: 'fehler', text: 'Dieses Material ist nicht aktiv. Zum Zurückholen: Bearbeiten und „Aktiv“ anhaken.' })
        : null,
      baueDetail(z, verlauf)
    );
    zeigeDetail(ctx.detail, String(m.name), inhalt, function () { offenId = null; }, neu);
  }

  // ---- Formular: m = null heißt neu anlegen ----

  function formZeigen(m) {
    formOffen = true;
    const neuAnlegen = !m;
    const form = baueFormular(SCHEMA.Material.felder, m || {}, {
      speichernText: neuAnlegen ? 'Anlegen' : 'Speichern',
      vorschlaege: {
        kategorie: werteVon('kategorie'),
        unterkategorie: werteVon('unterkategorie')
      },
      onSpeichern: function (d) { return speichern(m, d); },
      onAbbrechen: function () { formSchliessen(m); }
    });
    zeigeDetail(
      ctx.detail,
      neuAnlegen ? 'Neues Material' : 'Bearbeiten: ' + String(m.name),
      form,
      function () { formOffen = false; offenId = null; },
      true
    );
  }

  function formSchliessen(m) {
    formOffen = false;
    if (m) {
      offenId = m.id;
      detailZeigen(m.id, true);
    } else {
      offenId = null;
      schliesseDetail(ctx.detail);
    }
  }

  async function speichern(m, d) {
    const fid = fotoId(d.foto_id);
    if (d.foto_id && !fid) {
      throw new Error('Das Foto sieht nicht wie ein Google-Drive-Link oder eine Datei-ID aus.');
    }
    d.foto_id = fid;
    try {
      if (!m) {
        const o = await api('create', { tabelle: 'Material', daten: d }, s.token);
        formOffen = false;
        offenId = o.id;
        toast('Material angelegt.');
        await laden(false);
        detailZeigen(o.id, true);
        return;
      }
      const r = await api('update', {
        tabelle: 'Material', id: m.id, daten: d, bekannt: m.geaendert_am
      }, s.token);
      formOffen = false;
      offenId = m.id;
      toast(r.geaendert ? 'Änderung gespeichert.' : 'Nichts geändert.');
      await laden(false);
      detailZeigen(m.id, true);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        laden(false);
        throw new Error('Jemand anderes hat dieses Material gerade geändert. ' +
          'Klicke auf „Abbrechen“ und öffne es noch einmal.');
      }
      throw e;
    }
  }

  async function loeschen(m) {
    const frage = '„' + String(m.name) + '“ wirklich löschen? ' +
      'Das Material verschwindet aus der Liste. Die Ausleihe-Einträge bleiben erhalten. ' +
      'Tipp: Zum Ausblenden reicht es, „Aktiv“ abzuhaken.';
    if (!window.confirm(frage)) return;
    try {
      await api('delete', { tabelle: 'Material', id: m.id, bekannt: m.geaendert_am }, s.token);
      offenId = null;
      schliesseDetail(ctx.detail);
      toast('Gelöscht.');
      await laden(false);
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      if (e.code === 'konflikt') {
        toast('Jemand anderes hat dies gerade geändert. Bitte neu öffnen.');
        laden(false);
      } else {
        toast(e.message);
      }
    }
  }

  // ---- Liste ----

  function zeichne() {
    const bew = bewegung(daten.ausleihe);
    const q = suche.value.trim().toLowerCase();
    const k = kat.value;
    const st = stat.value;

    const zeilen = daten.material.filter(function (m) {
      const inaktiv = istFalsch(m.aktiv);
      if (st === 'aktiv' && inaktiv) return false;
      if (st === 'inaktiv' && !inaktiv) return false;
      if (k && String(m.kategorie || '').trim() !== k) return false;
      if (!q) return true;
      return [m.name, m.kategorie, m.unterkategorie, m.ort, m.notiz]
        .join(' ').toLowerCase().indexOf(q) >= 0;
    }).map(function (m) { return mitVerfuegbar(m, bew); });

    zeilen.sort(function (a, b) {
      return String(a.name).localeCompare(String(b.name), 'de');
    });

    zeigeListe(box, zeilen,
      [
        {
          name: 'name',
          label: 'Name',
          wert: function (z) {
            return String(z.name) + (istFalsch(z.aktiv) ? ' (nicht aktiv)' : '');
          }
        },
        { name: 'kategorie', label: 'Kategorie' },
        { name: 'ort', label: 'Ort' },
        { name: 'anzahl', label: 'Anzahl', zahl: true },
        { name: '_verfuegbar', label: 'Verfügbar', zahl: true }
      ],
      function (z) {
        const einheit = z.einheit ? ' ' + z.einheit : '';
        return {
          titel: String(z.name) + (istFalsch(z.aktiv) ? ' (nicht aktiv)' : ''),
          zeilen: [
            [z.kategorie, z.ort].filter(Boolean).join(' · '),
            z._verfuegbar === ''
              ? ''
              : 'Verfügbar: ' + z._verfuegbar + ' von ' + z.anzahl + einheit
          ]
        };
      },
      function (z) {
        formOffen = false;
        offenId = z.id;
        detailZeigen(z.id, true);
      },
      daten.material.length ? 'Nichts gefunden.' : 'Noch kein Material eingetragen.'
    );
  }

  function zeigen(neu, meta) {
    daten = neu;
    kategorienAufbauen();
    zeichne();
    // Ein offenes Formular wird bei der Aktualisierung nicht überschrieben.
    if (offenId && !formOffen) detailZeigen(offenId, false);
    status.className = 'leise';
    status.textContent = meta.aktuell
      ? daten.material.length + ' Einträge · Stand ' + zeitText(meta.stand)
      : 'Zwischengespeichert von ' + zeitText(meta.stand) + '. Aktualisiere …';
  }

  async function laden(zuerstCache) {
    try {
      const ok = await ladeMitCache(
        s.gruppe_id + ':material',
        async function () {
          const r = await Promise.all([
            api('list', { tabelle: 'Material' }, s.token),
            api('list', { tabelle: 'Ausleihe' }, s.token)
          ]);
          return { material: r[0].zeilen, ausleihe: r[1].zeilen };
        },
        zeigen,
        zuerstCache
      );
      if (!ok) {
        status.className = 'fehler';
        status.textContent = 'Keine Verbindung. Du siehst den letzten Stand.';
      }
    } catch (e) {
      if (ctx.behandleFehler(e)) return;
      status.className = 'fehler';
      status.textContent = 'Fehler: ' + e.message;
    }
  }

  suche.addEventListener('input', zeichne);
  kat.addEventListener('change', zeichne);
  stat.addEventListener('change', zeichne);
  ctx.setzeRefresh(function () { return laden(false); });
  await laden(true);
}

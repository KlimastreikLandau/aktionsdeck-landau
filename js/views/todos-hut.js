// js/views/todos-hut.js
// Hut = offenes ToDo ohne Verantwortliche. Knöpfe "Hut übernehmen" und "Weitergeben".
// Gemeinsam für den Reiter ToDos und den Teil ToDos im Projekt. Ohne Konfliktprüfung (wie Abhaken).
//
// o: { ctx, token, t (das ToDo), personen() -> Namensliste, fertig() }
// Das ToDo t wird nach dem Speichern direkt geändert, danach ruft die Stelle fertig() auf.

import { el } from '../ui/dom.js';
import { api } from '../api.js';
import { zeigeFenster } from '../ui/fenster.js';
import { baueFormular } from '../ui/form.js';
import { toast } from '../ui/toast.js';
import { getName } from '../store.js';
import { istWahr } from '../schema.js';

export function istOffenerHut(t) {
  return !istWahr(t.erledigt) && !String(t.verantwortlich || '').trim();
}

async function setzen(o, name) {
  const r = await api('update', {
    tabelle: 'ToDos', id: o.t.id, daten: { verantwortlich: name }
  }, o.token);
  if (r && r.eintrag) Object.assign(o.t, r.eintrag);
  else o.t.verantwortlich = name;
}

function weitergeben(o) {
  let fenster = null;
  const aktuell = String(o.t.verantwortlich || '').trim();
  const form = baueFormular(
    [{ name: 'person', label: 'Neue Person (leer lassen = Hut wird frei)', typ: 'text' }],
    { person: '' },
    {
      speichernText: 'Weitergeben',
      vorschlaege: { person: o.personen ? o.personen() : [] },
      onSpeichern: async function (d) {
        try {
          await setzen(o, d.person);
        } catch (e) {
          if (o.ctx.behandleFehler(e)) { fenster.schliessen(); return; }
          throw e;
        }
        fenster.schliessen();
        toast(d.person ? 'Hut an ' + d.person + ' gegeben.' : 'Hut ist jetzt frei.');
        o.fertig();
      },
      onAbbrechen: function () { fenster.schliessen(); }
    }
  );
  fenster = zeigeFenster('Hut weitergeben', el('div', null,
    aktuell ? el('p', { class: 'leise', text: 'Aktuell: ' + aktuell }) : null,
    form
  ));
}

export function huetKnoepfe(o) {
  const wer = String(o.t.verantwortlich || '').trim();
  const ich = getName();
  const meins = !!ich && wer.toLowerCase() === ich.toLowerCase();
  const box = el('div', { class: 'hut-knoepfe' });

  if (!meins) {
    box.append(el('button', {
      class: 'knopf', type: 'button', text: 'Hut übernehmen',
      onclick: async function () {
        if (!ich) { toast('Bitte zuerst deinen Namen eintragen (Name ändern).'); return; }
        try {
          await setzen(o, ich);
        } catch (e) {
          if (o.ctx.behandleFehler(e)) return;
          toast(e.code === 'nicht_gefunden' ? 'Dieses ToDo gibt es nicht mehr.' : e.message);
          return;
        }
        toast('Du hast den Hut übernommen.');
        o.fertig();
      }
    }));
  }
  box.append(el('button', {
    class: 'knopf knopf-hell', type: 'button', text: 'Weitergeben',
    onclick: function () { weitergeben(o); }
  }));
  return box;
}

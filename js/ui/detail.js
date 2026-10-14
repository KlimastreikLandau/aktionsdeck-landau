// js/ui/detail.js
// Detailbereich: rechts am PC, Vollbild am Handy (CSS: Klasse "offen").
// Am Handy legt das Detail einen Verlaufseintrag an: Die Zurück-Taste schließt dann das Detail.

import { el, leeren } from './dom.js';

let panelMitEintrag = null;
let beiZuMerken = null;

function istHandy() {
  return window.matchMedia('(max-width: 959px)').matches;
}

function sichtbarSchliessen(panel) {
  leeren(panel);
  panel.classList.remove('offen');
}

export function schliesseDetail(panel) {
  sichtbarSchliessen(panel);
  if (panelMitEintrag === panel) {
    panelMitEintrag = null;
    beiZuMerken = null;
    if (history.state && history.state.aktionsdeckDetail) history.back();
  }
}

// Zurück-Taste (oder Seitenwechsel): Detail schließen, Eintrag ist schon weg
window.addEventListener('popstate', function () {
  if (!panelMitEintrag) return;
  if (history.state && history.state.aktionsdeckDetail) return;
  const p = panelMitEintrag;
  const f = beiZuMerken;
  panelMitEintrag = null;
  beiZuMerken = null;
  sichtbarSchliessen(p);
  if (f) f();
});

// neu = true: nach oben scrollen. false: Scrollstand behalten (bei Aktualisierung).
export function zeigeDetail(panel, titel, inhalt, beiZu, neu) {
  const scroll = neu ? 0 : panel.scrollTop;
  leeren(panel);
  panel.classList.add('offen');
  panel.append(
    el('div', { class: 'detail-kopf' },
      el('button', {
        class: 'knopf knopf-hell',
        type: 'button',
        text: '← Zurück',
        onclick: function () {
          schliesseDetail(panel);
          if (beiZu) beiZu();
        }
      })
    ),
    el('h2', { text: titel }),
    inhalt
  );
  panel.scrollTop = scroll;

  if (panelMitEintrag === panel) {
    beiZuMerken = beiZu || null;
  } else if (istHandy()) {
    history.pushState({ aktionsdeckDetail: true }, '');
    panelMitEintrag = panel;
    beiZuMerken = beiZu || null;
  }
}

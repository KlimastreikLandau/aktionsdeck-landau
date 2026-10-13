// js/ui/detail.js
// Detailbereich: rechts am PC, Vollbild am Handy (CSS: Klasse "offen").

import { el, leeren } from './dom.js';

export function schliesseDetail(panel) {
  leeren(panel);
  panel.classList.remove('offen');
}

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
}

// js/app.js
// Startpunkt: Routing mit #/g/<kurzname>/<reiter>

import { VERSION } from './config.js';
import { api } from './api.js';
import { getSession } from './store.js';
import * as gruppenView from './views/gruppen.js';
import * as loginView from './views/login.js';
import * as startView from './views/start.js';

let gruppenListe = null;

async function ladeGruppen() {
  if (gruppenListe) return gruppenListe;
  try {
    gruppenListe = await api('gruppen');
    return gruppenListe;
  } catch (e) {
    console.warn('Gruppen laden fehlgeschlagen:', e);
    return null;
  }
}

function setzeFarbe(farbe) {
  const root = document.documentElement;
  if (farbe) root.style.setProperty('--gruppe', farbe);
  else root.style.removeProperty('--gruppe');
}

let laufNummer = 0;

async function route() {
  const nummer = ++laufNummer;
  const container = document.getElementById('app');
  const teile = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);

  const ctx = { ladeGruppen: ladeGruppen, neuLaden: route, version: VERSION };

  if (teile[0] === 'g' && teile[1]) {
    const gruppen = await ladeGruppen();
    if (nummer !== laufNummer) return;
    const g = gruppen && gruppen.find(function (x) { return x.kurzname === teile[1]; });
    if (!g) {
      setzeFarbe('');
      location.hash = '#/';
      return;
    }
    setzeFarbe(g.farbe);
    const s = getSession();
    if (!s || s.gruppe_id !== g.gruppe_id) {
      ctx.gruppe = g;
      loginView.render(container, ctx);
    } else {
      ctx.session = s;
      ctx.tab = teile[2] || 'start';
      startView.render(container, ctx);
    }
    return;
  }

  setzeFarbe('');
  gruppenView.render(container, ctx);
}

function serviceWorkerAnmelden() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function (e) {
      console.warn('Service Worker nicht angemeldet:', e);
    });
  }
}

window.addEventListener('hashchange', route);
route();
serviceWorkerAnmelden();

// js/app.js
// Startpunkt: Routing mit #/g/<kurzname>/<reiter>, Gerüst, Name, Aktualisierung.

import { VERSION, REFRESH_SEKUNDEN } from './config.js';
import { api } from './api.js';
import { getSession, clearSession, getName, setName } from './store.js';
import { cacheLeeren } from './cache.js';
import { baueGeruest, sichtbareTabs, tabLabel } from './ui/nav.js';
import { frageName } from './ui/modal.js';
import { toast } from './ui/toast.js';
import * as gruppenView from './views/gruppen.js';
import * as loginView from './views/login.js';
import * as infoView from './views/info.js';

let gruppenListe = null;
let refreshFn = null;
let laufNummer = 0;
let nameFrageOffen = false;
const geladeneViews = {};

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

// Lädt views/<reiter>.js. Gibt es die Datei noch nicht, kommt der Platzhalter.
async function ladeView(tab) {
  if (geladeneViews[tab]) return geladeneViews[tab];
  let modul;
  try {
    modul = await import('./views/' + tab + '.js');
  } catch (e) {
    modul = await import('./views/platzhalter.js');
  }
  geladeneViews[tab] = modul;
  return modul;
}

async function abmelden() {
  clearSession();
  await cacheLeeren();
  location.hash = '#/';
  route();
}

async function nameAendern() {
  const n = await frageName(getName(), true);
  if (n) {
    setName(n);
    toast('Name gespeichert.');
    route();
  }
}

// true = Fehler wurde behandelt (z. B. Anmeldung abgelaufen)
function behandleFehler(e) {
  if (e && e.code === 'auth') {
    toast(e.message);
    abmelden();
    return true;
  }
  return false;
}

async function nameSicherstellen() {
  if (getName() || nameFrageOffen) return;
  nameFrageOffen = true;
  const n = await frageName('', false);
  setName(n);
  nameFrageOffen = false;
}

async function route() {
  const nummer = ++laufNummer;
  refreshFn = null;
  const container = document.getElementById('app');
  const teile = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);

  const ctx = {
    ladeGruppen: ladeGruppen,
    neuLaden: route,
    version: VERSION,
    abmelden: abmelden,
    nameAendern: nameAendern,
    behandleFehler: behandleFehler,
    setzeRefresh: function (fn) { refreshFn = fn; }
  };

  // Info ohne Login
  if (teile[0] === 'info') {
    setzeFarbe('');
    infoView.render(container, ctx);
    return;
  }

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
      return;
    }

    ctx.session = s;
    const erlaubt = sichtbareTabs().map(function (t) { return t.id; }).concat('mehr');
    ctx.tab = erlaubt.indexOf(teile[2]) >= 0 ? teile[2] : 'start';
    ctx.tabLabel = tabLabel(ctx.tab);

    const geruest = baueGeruest(container, ctx);
    ctx.detail = geruest.detail;

    await nameSicherstellen();
    if (nummer !== laufNummer) return;

    const modul = await ladeView(ctx.tab);
    if (nummer !== laufNummer) return;
    try {
      await modul.render(geruest.inhalt, ctx);
    } catch (e) {
      if (!behandleFehler(e)) geruest.inhalt.textContent = 'Fehler: ' + e.message;
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

// Offene Seiten laden regelmäßig neu (nur wenn sichtbar und online)
setInterval(function () {
  if (refreshFn && document.visibilityState === 'visible' && navigator.onLine) refreshFn();
}, REFRESH_SEKUNDEN * 1000);

window.addEventListener('hashchange', route);
route();
serviceWorkerAnmelden();

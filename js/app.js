// js/app.js
// Startpunkt der App. In Schritt 1.6 kommen Routing, Login und Reiter dazu.

import { VERSION, API_URL } from './config.js';

function start() {
  const app = document.getElementById('app');
  app.textContent = '';

  const box = document.createElement('div');
  box.className = 'mitte';

  const titel = document.createElement('h1');
  titel.textContent = 'AktionsDeck Landau';

  const info = document.createElement('p');
  info.textContent = 'Die App läuft. Version ' + VERSION + '.';

  const api = document.createElement('p');
  api.textContent = API_URL.indexOf('HIER_') === 0
    ? 'Achtung: In js/config.js fehlt noch die Web-App-URL.'
    : 'Web-App-URL ist eingetragen.';

  box.append(titel, info, api);
  app.append(box);
}

function serviceWorkerAnmelden() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function (e) {
      console.warn('Service Worker nicht angemeldet:', e);
    });
  }
}

start();
serviceWorkerAnmelden();

// js/api.js
// Spricht mit dem Apps-Script. POST mit JSON als text/plain.
// Antwort: { ok, data, error, code }

import { API_URL } from './config.js';
import { getName } from './store.js';

export async function api(aktion, params, token) {
  const body = Object.assign({}, params || {}, { aktion: aktion });
  if (token) body.token = token;
  const name = getName();
  if (name && !body.anzeigename) body.anzeigename = name;

  let antwort;
  try {
    antwort = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body)
    });
  } catch (e) {
    const fehlerNetz = new Error('Keine Verbindung zum Server.');
    fehlerNetz.code = 'netz';
    throw fehlerNetz;
  }

  let json;
  try {
    json = await antwort.json();
  } catch (e) {
    const fehlerAntwort = new Error('Unerwartete Antwort vom Server.');
    fehlerAntwort.code = 'antwort';
    throw fehlerAntwort;
  }
  if (!json.ok) {
    const fehlerApi = new Error(json.error || 'Unbekannter Fehler.');
    fehlerApi.code = json.code || 'unbekannt';
    fehlerApi.data = json.data || null;
    throw fehlerApi;
  }
  return json.data;
}

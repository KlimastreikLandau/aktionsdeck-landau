// js/api.js
// Spricht mit dem Apps-Script. POST mit JSON als text/plain.
// Antwort: { ok, data, error }

import { API_URL } from './config.js';

export async function api(action, params, token) {
  const body = Object.assign({}, params || {}, { action: action });
  if (token) body.token = token;

  let antwort;
  try {
    antwort = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(body)
    });
  } catch (e) {
    throw new Error('Keine Verbindung zum Server.');
  }

  let json;
  try {
    json = await antwort.json();
  } catch (e) {
    throw new Error('Unerwartete Antwort vom Server.');
  }
  if (!json.ok) throw new Error(json.error || 'Unbekannter Fehler.');
  return json.data;
}

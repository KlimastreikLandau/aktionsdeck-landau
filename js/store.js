// js/store.js
// Merkt sich im Gerät: die Anmeldung (Token) und den Anzeigenamen.

const KEY = 'aktionsdeck_session';
const NAME_KEY = 'aktionsdeck_name';

export function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    return s && s.token ? s : null;
  } catch (e) {
    return null;
  }
}

export function setSession(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignorieren */ }
}

export function clearSession() {
  try { localStorage.removeItem(KEY); } catch (e) { /* ignorieren */ }
}

// Anzeigename bleibt auch nach dem Abmelden auf dem Gerät
export function getName() {
  try { return (localStorage.getItem(NAME_KEY) || '').trim(); } catch (e) { return ''; }
}

export function setName(n) {
  try { localStorage.setItem(NAME_KEY, String(n).trim().slice(0, 60)); } catch (e) { /* ignorieren */ }
}

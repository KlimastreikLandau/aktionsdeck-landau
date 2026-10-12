// js/store.js
// Merkt sich die Anmeldung im Gerät. Das Token ist signiert, enthält aber kein Geheimnis.

const KEY = 'aktionsdeck_session';

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

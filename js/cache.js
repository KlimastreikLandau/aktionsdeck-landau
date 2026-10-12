// js/cache.js
// Zwischenspeicher im Gerät (IndexedDB): sofort letzter Stand, dann Aktualisierung.

const DB_NAME = 'aktionsdeck';
const STORE = 'daten';

function oeffnen() {
  return new Promise(function (resolve, reject) {
    if (!('indexedDB' in window)) { reject(new Error('Kein IndexedDB')); return; }
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
    r.onsuccess = function () { resolve(r.result); };
    r.onerror = function () { reject(r.error); };
  });
}

function lauf(modus, aktion) {
  return oeffnen().then(function (db) {
    return new Promise(function (resolve, reject) {
      const tx = db.transaction(STORE, modus);
      const req = aktion(tx.objectStore(STORE));
      tx.oncomplete = function () { db.close(); resolve(req ? req.result : null); };
      tx.onerror = function () { db.close(); reject(tx.error); };
      tx.onabort = function () { db.close(); reject(tx.error); };
    });
  });
}

export function cacheGet(key) {
  return lauf('readonly', function (s) { return s.get(key); })
    .then(function (v) { return v === undefined ? null : v; })
    .catch(function () { return null; });
}

export function cacheSet(key, wert) {
  return lauf('readwrite', function (s) { return s.put(wert, key); })
    .catch(function () { return null; });
}

// Beim Abmelden: alles löschen (wichtig bei geteilten Geräten)
export function cacheLeeren() {
  return lauf('readwrite', function (s) { return s.clear(); })
    .catch(function () { return null; });
}

// Zeigt zuerst den gespeicherten Stand (wenn zuerstCache), lädt dann neu.
// anzeigen(daten, { aktuell: true|false, stand: ISO-Text })
// Gibt true zurück, wenn frisch geladen wurde. false = offline, alter Stand bleibt.
// Fehler "auth" und Fehler ohne gespeicherten Stand werden weitergegeben.
export async function ladeMitCache(key, ladeFn, anzeigen, zuerstCache) {
  const alt = await cacheGet(key);
  if (alt && zuerstCache) anzeigen(alt.daten, { aktuell: false, stand: alt.stand });
  try {
    const neu = await ladeFn();
    const stand = new Date().toISOString();
    await cacheSet(key, { daten: neu, stand: stand });
    anzeigen(neu, { aktuell: true, stand: stand });
    return true;
  } catch (e) {
    if (e && e.code === 'auth') throw e;
    if (!alt) throw e;
    return false;
  }
}

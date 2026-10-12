// js/ui/dom.js
// Baut Elemente sicher auf. Texte kommen immer über textContent, nie über innerHTML.

export function el(tag, eigenschaften, ...kinder) {
  const e = document.createElement(tag);
  const p = eigenschaften || {};
  Object.keys(p).forEach(function (k) {
    if (k === 'text') e.textContent = p[k];
    else if (k === 'class') e.className = p[k];
    else if (k.indexOf('on') === 0 && typeof p[k] === 'function') {
      e.addEventListener(k.slice(2), p[k]);
    } else e.setAttribute(k, p[k]);
  });
  kinder.forEach(function (kind) {
    if (kind === null || kind === undefined) return;
    e.append(kind);
  });
  return e;
}

export function leeren(container) {
  container.textContent = '';
}

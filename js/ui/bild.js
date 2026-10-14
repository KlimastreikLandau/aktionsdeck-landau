// js/ui/bild.js
// Verkleinert ein Foto im Browser (längste Seite max. 1000 px) und liefert JPEG als Base64-Text.

export function verkleinern(datei, maxPx, qualitaet) {
  const max = maxPx || 1000;
  const q = qualitaet || 0.8;
  return new Promise(function (resolve, reject) {
    if (!datei || !/^image\//.test(datei.type)) {
      reject(new Error('Das ist keine Bilddatei.'));
      return;
    }
    const url = URL.createObjectURL(datei);
    const img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(url);
      const f = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * f));
      const h = Math.max(1, Math.round(img.naturalHeight * f));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d');
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, w, h);
      g.drawImage(img, 0, 0, w, h);
      const teil = c.toDataURL('image/jpeg', q).split(',')[1];
      if (teil) resolve(teil);
      else reject(new Error('Das Bild konnte nicht verkleinert werden.'));
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error('Das Bild konnte nicht gelesen werden. Bitte ein JPEG oder PNG nehmen.'));
    };
    img.src = url;
  });
}

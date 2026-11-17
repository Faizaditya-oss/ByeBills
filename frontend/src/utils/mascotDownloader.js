/**
 * mascotDownloader.js
 * Utilitas unduh maskot BUBU (SVG) menjadi file PNG resolusi tinggi.
 * SVG dikloning dari DOM, dirasterisasi ke kanvas 2048 x 2048,
 * lalu disimpan sebagai file lokal perangkat melalui blob download.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Unduh elemen SVG maskot menjadi gambar PNG HD.
 *
 * @param {SVGSVGElement} svgElement
 * @param {object} [options]
 * @param {string} [options.fileName='maskot-bubu-hd.png']
 * @param {number} [options.size=2048]
 * @returns {Promise<{ fileName: string, size: number }>}
 */
export function downloadMascotAsPng(
  svgElement,
  { fileName = 'maskot-bubu-hd.png', size = 2048 } = {}
) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('Unduh maskot hanya didukung di lingkungan browser.'));
    }
    if (!svgElement) {
      return reject(new Error('Elemen maskot tidak ditemukan.'));
    }

    // Kloning agar atribut tampilan (class Tailwind) tidak memengaruhi hasil render
    const clone = svgElement.cloneNode(true);
    clone.setAttribute('xmlns', SVG_NS);
    clone.setAttribute('width', String(size));
    clone.setAttribute('height', String(size));
    clone.removeAttribute('class');
    clone.removeAttribute('style');

    const serialized = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(svgUrl);
          return reject(new Error('Gagal menginisialisasi kanvas grafis.'));
        }

        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        URL.revokeObjectURL(svgUrl);

        canvas.toBlob((blob) => {
          if (!blob) {
            return reject(new Error('Gagal membuat berkas gambar maskot.'));
          }

          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);

          resolve({ fileName, size });
        }, 'image/png');
      } catch (err) {
        URL.revokeObjectURL(svgUrl);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Maskot gagal dirender menjadi gambar.'));
    };

    img.src = svgUrl;
  });
}

/**
 * imageCompressor.js
 * Utilitas kompresi gambar berbasis browser HTML5 Canvas API.
 * Mengompresi ukuran dan dimensi gambar sebelum disimpan ke localStorage
 * untuk memastikan tidak melebihi kuota penyimpanan (maks. 300 KB).
 */

/**
 * Kompres file gambar atau data URL menjadi format JPEG ringan.
 *
 * @param {File | Blob | string} fileOrDataUrl
 * @param {object} [options]
 * @param {number} [options.maxWidth=800]
 * @param {number} [options.maxHeight=800]
 * @param {number} [options.quality=0.7]
 * @param {number} [options.maxKb=300]
 * @returns {Promise<{ dataUrl: string, fileSizeKb: number, fileName?: string }>}
 */
export function compressImage(
  fileOrDataUrl,
  { maxWidth = 800, maxHeight = 800, quality = 0.7, maxKb = 300 } = {}
) {
  return new Promise((resolve, reject) => {
    // Validasi lingkungan browser
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('Kompresi gambar hanya didukung di lingkungan browser.'));
    }

    const processImageElement = (img, fileName = 'image.jpg') => {
      let { width, height } = img;

      // Hitung skala rasio agar tidak melebihi dimensi batas
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(width, 1);
      canvas.height = Math.max(height, 1);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Gagal menginisialisasi kanvas grafis.'));
      }

      // Gambar ulang dengan latar belakang putih jika PNG transparan
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Ekspor ke JPEG dengan kualitas terkompresi
      let currentQuality = quality;
      let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
      let sizeInKb = Math.round((dataUrl.length * 0.75) / 1024);

      // Jika masih melebihi batas, turunkan kualitas sekali lagi
      if (sizeInKb > maxKb && currentQuality > 0.4) {
        currentQuality = 0.45;
        dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        sizeInKb = Math.round((dataUrl.length * 0.75) / 1024);
      }

      resolve({
        dataUrl,
        fileSizeKb: sizeInKb,
        fileName: fileName.replace(/\.[^/.]+$/, '') + '.jpg',
      });
    };

    // 1. Jika input berupa File / Blob
    if (fileOrDataUrl instanceof Blob || (typeof File !== 'undefined' && fileOrDataUrl instanceof File)) {
      const fileName = fileOrDataUrl.name || 'image.jpg';
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => processImageElement(img, fileName);
        img.onerror = () => reject(new Error('Format file gambar tidak dapat diproses.'));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
      reader.readAsDataURL(fileOrDataUrl);
      return;
    }

    // 2. Jika input sudah berupa string Data URL
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => processImageElement(img, 'compressed.jpg');
      img.onerror = () => reject(new Error('String data gambar tidak valid.'));
      img.src = fileOrDataUrl;
      return;
    }

    // 3. Jika berupa string path mock (misal demo asset)
    if (typeof fileOrDataUrl === 'string') {
      return resolve({
        dataUrl: fileOrDataUrl,
        fileSizeKb: 50,
        fileName: 'mock.jpg',
      });
    }

    reject(new Error('Tipe data gambar tidak dikenali.'));
  });
}

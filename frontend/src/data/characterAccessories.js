/**
 * characterAccessories.js
 * Katalog aksesori karakter profil BUBU yang dapat dibuka menggunakan sistem poin.
 */

export const ACCESSORY_SLOTS = {
  HAT: 'hat',
  GLASSES: 'glasses',
  EARS: 'ears',
  NECK: 'neck',
};

export const ACCESSORY_CATALOG = [
  {
    id: 'acc_hat_grad',
    name: 'Topi Toga Lulus Utang',
    slot: ACCESSORY_SLOTS.HAT,
    pointsCost: 60,
    description: 'Simbol kelulusan dari jeratan pinjol menuju kemandirian finansial.',
    tag: 'Eksklusif',
  },
  {
    id: 'acc_hat_cap',
    name: 'Topi Pejuang Sporty',
    slot: ACCESSORY_SLOTS.HAT,
    pointsCost: 35,
    description: 'Topi kasual penuh semangat untuk pejuang cicilan disiplin.',
    tag: 'Kasual',
  },
  {
    id: 'acc_hat_crown',
    name: 'Mahkota Bebas Finansial',
    slot: ACCESSORY_SLOTS.HAT,
    pointsCost: 80,
    description: 'Mahkota emas megah bagi pahlawan kemandirian finansial.',
    tag: 'Spesial',
  },
  {
    id: 'acc_glasses_smart',
    name: 'Kacamata Analis Bijak',
    slot: ACCESSORY_SLOTS.GLASSES,
    pointsCost: 30,
    description: 'Kacamata pintar untuk merencanakan anggaran dan bunga kredit.',
    tag: 'Populer',
  },
  {
    id: 'acc_glasses_sunglasses',
    name: 'Kacamata Hitam Percaya Diri',
    slot: ACCESSORY_SLOTS.GLASSES,
    pointsCost: 45,
    description: 'Kacamata hitam keren untuk melangkah mantap tanpa cemas.',
    tag: 'Keren',
  },
  {
    id: 'acc_headphone_focus',
    name: 'Headphone Fokus Anti-Stres',
    slot: ACCESSORY_SLOTS.EARS,
    pointsCost: 40,
    description: 'Meredam kebisingan penagihan, tetap tenang dan produktif.',
    tag: 'Audio',
  },
  {
    id: 'acc_scarf_emerald',
    name: 'Syal Pejuang Emerald',
    slot: ACCESSORY_SLOTS.NECK,
    pointsCost: 25,
    description: 'Syal hangat penenang batin di tengah perjuangan finansial.',
    tag: 'Hangat',
  },
  {
    id: 'acc_tie_bowtie',
    name: 'Dasi Kupu-Kupu Elegan',
    slot: ACCESSORY_SLOTS.NECK,
    pointsCost: 20,
    description: 'Dasi merah rapi untuk merayakan setiap milestone cicilan.',
    tag: 'Klasik',
  },
];

export function getAccessoryById(id) {
  return ACCESSORY_CATALOG.find((item) => item.id === id) || null;
}

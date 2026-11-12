import React from 'react';

/**
 * BubuCharacter
 * Komponen maskot vektor SVG interaktif untuk avatar profil pengguna BUBU.
 * Mendukung pemasangan aksesori dinamis (Topi, Kacamata, Headphone, Dasi/Syal).
 */
export default function BubuCharacter({
  equippedAccessories = [],
  size = 'md',
  className = '',
}) {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    xl: 'w-48 h-48',
  };

  const containerSize = sizeMap[size] || sizeMap.md;
  const equippedSet = new Set(equippedAccessories || []);

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${containerSize} ${className}`}>
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full drop-shadow-sm overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradien Tubuh Bubu */}
          <linearGradient id="bubuBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Gradien Sayap */}
          <linearGradient id="bubuWingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* Gradien Mahkota */}
          <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Gradien Kacamata Hitam */}
          <linearGradient id="shadesGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>
        </defs>

        {/* ─── BAYANGAN LANTAI ────────────────────────────────────────── */}
        <ellipse cx="100" cy="182" rx="46" ry="9" fill="#0F172A" opacity="0.08" />

        {/* ─── KAKI MASKOT ────────────────────────────────────────────── */}
        <ellipse cx="78" cy="173" rx="12" ry="6" fill="#F59E0B" />
        <ellipse cx="122" cy="173" rx="12" ry="6" fill="#F59E0B" />

        {/* ─── TELINGA / JAMBUL ───────────────────────────────────────── */}
        <path d="M 58 78 Q 42 46 74 64 Z" fill="#059669" />
        <path d="M 142 78 Q 158 46 126 64 Z" fill="#059669" />
        <path d="M 62 76 Q 52 56 70 68 Z" fill="#6EE7B7" opacity="0.6" />
        <path d="M 138 76 Q 148 56 130 68 Z" fill="#6EE7B7" opacity="0.6" />

        {/* ─── SAYAP KIRI & KANAN (DI BELAKANG TUBUH UTAMA) ───────────── */}
        <path
          d="M 48 102 Q 28 132 50 148 Q 58 130 55 110 Z"
          fill="url(#bubuWingGrad)"
        />
        <path
          d="M 152 102 Q 172 132 150 148 Q 142 130 145 110 Z"
          fill="url(#bubuWingGrad)"
        />

        {/* ─── TUBUH UTAMA MASKOT ─────────────────────────────────────── */}
        <ellipse cx="100" cy="116" rx="56" ry="60" fill="url(#bubuBodyGrad)" />

        {/* ─── PERUT (BELLY PATCH) ────────────────────────────────────── */}
        <ellipse cx="100" cy="126" rx="36" ry="40" fill="#ECFDF5" />
        <path
          d="M 90 114 Q 100 120 110 114"
          stroke="#A7F3D0"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 85 130 Q 100 137 115 130"
          stroke="#A7F3D0"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* ─── MATA BESAR & BERKILAU ──────────────────────────────────── */}
        {/* Mata Kiri */}
        <circle cx="78" cy="94" r="19" fill="#FFFFFF" />
        <circle cx="80" cy="94" r="11" fill="#1E293B" />
        <circle cx="83.5" cy="90.5" r="4.5" fill="#FFFFFF" />
        <circle cx="77" cy="97" r="2" fill="#FFFFFF" />

        {/* Mata Kanan */}
        <circle cx="122" cy="94" r="19" fill="#FFFFFF" />
        <circle cx="120" cy="94" r="11" fill="#1E293B" />
        <circle cx="123.5" cy="90.5" r="4.5" fill="#FFFFFF" />
        <circle cx="117" cy="97" r="2" fill="#FFFFFF" />

        {/* ─── PIPI MERONA ────────────────────────────────────────────── */}
        <ellipse cx="63" cy="108" rx="8" ry="4.5" fill="#FDA4AF" opacity="0.65" />
        <ellipse cx="137" cy="108" rx="8" ry="4.5" fill="#FDA4AF" opacity="0.65" />

        {/* ─── PARUH ORANYE ───────────────────────────────────────────── */}
        <polygon points="100,99 92,108 108,108" fill="#F59E0B" />
        <polygon points="100,103 94,108 106,108" fill="#D97706" opacity="0.4" />

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ─── LAYER AKSESORI (DITAMPILKAN JIKA EQUIPPED) ─────────────── */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        {/* 1. AKSESORI KACAMATA */}
        {equippedSet.has('acc_glasses_smart') && (
          <g id="acc-glasses-smart">
            {/* Bingkai Kacamata Kiri */}
            <circle cx="78" cy="94" r="19" fill="none" stroke="#1E293B" strokeWidth="3.5" />
            <circle cx="78" cy="94" r="16" fill="#38BDF8" opacity="0.15" />
            {/* Bingkai Kacamata Kanan */}
            <circle cx="122" cy="94" r="19" fill="none" stroke="#1E293B" strokeWidth="3.5" />
            <circle cx="122" cy="94" r="16" fill="#38BDF8" opacity="0.15" />
            {/* Jembatan Kacamata */}
            <path d="M 97 93 Q 100 89 103 93" fill="none" stroke="#1E293B" strokeWidth="3.5" strokeLinecap="round" />
            {/* Kilau Kaca */}
            <path d="M 72 85 L 82 85" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
            <path d="M 116 85 L 126 85" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
          </g>
        )}

        {equippedSet.has('acc_glasses_sunglasses') && (
          <g id="acc-glasses-sunglasses">
            {/* Kacamata Hitam Keren */}
            <path
              d="M 58 84 L 98 84 L 95 106 Q 78 112 60 104 Z"
              fill="url(#shadesGrad)"
              stroke="#0F172A"
              strokeWidth="2"
            />
            <path
              d="M 102 84 L 142 84 L 140 104 Q 122 112 105 106 Z"
              fill="url(#shadesGrad)"
              stroke="#0F172A"
              strokeWidth="2"
            />
            {/* Jembatan */}
            <rect x="96" y="85" width="8" height="3" fill="#0F172A" rx="1.5" />
            {/* Garis Kilau Refleksi */}
            <path d="M 64 88 L 78 104" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            <path d="M 108 88 L 122 104" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
          </g>
        )}

        {/* 2. AKSESORI LEHER (SYAL / DASI) */}
        {equippedSet.has('acc_scarf_emerald') && (
          <g id="acc-scarf-emerald">
            {/* Lingkaran Syal di Leher */}
            <path
              d="M 65 130 C 75 142, 125 142, 135 130 C 130 148, 70 148, 65 130 Z"
              fill="#047857"
              stroke="#065F46"
              strokeWidth="2"
            />
            {/* Ekor Syal Menggantung */}
            <path
              d="M 112 136 L 124 165 L 108 167 L 100 138 Z"
              fill="#059669"
              stroke="#065F46"
              strokeWidth="1.5"
            />
            {/* Garis-garis Rajut */}
            <line x1="110" y1="148" x2="120" y2="150" stroke="#A7F3D0" strokeWidth="2" />
            <line x1="106" y1="158" x2="117" y2="160" stroke="#A7F3D0" strokeWidth="2" />
          </g>
        )}

        {equippedSet.has('acc_tie_bowtie') && (
          <g id="acc-tie-bowtie">
            {/* Sayap Dasi Kupu Kupu */}
            <polygon points="100,128 85,120 85,136" fill="#DC2626" stroke="#B91C1C" strokeWidth="1.5" />
            <polygon points="100,128 115,120 115,136" fill="#DC2626" stroke="#B91C1C" strokeWidth="1.5" />
            {/* Simpul Tengah */}
            <circle cx="100" cy="128" r="4.5" fill="#EF4444" stroke="#B91C1C" strokeWidth="1" />
          </g>
        )}

        {/* 3. AKSESORI TELINGA (HEADPHONE) */}
        {equippedSet.has('acc_headphone_focus') && (
          <g id="acc-headphone-focus">
            {/* Bando Lengkung di Atas Kepala */}
            <path
              d="M 46 95 C 45 42, 155 42, 154 95"
              fill="none"
              stroke="#4338CA"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M 46 95 C 45 42, 155 42, 154 95"
              fill="none"
              stroke="#6366F1"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Earcup Kiri */}
            <ellipse cx="44" cy="95" rx="7.5" ry="15" fill="#312E81" />
            <ellipse cx="45" cy="95" rx="4" ry="11" fill="#06B6D4" />
            {/* Earcup Kanan */}
            <ellipse cx="156" cy="95" rx="7.5" ry="15" fill="#312E81" />
            <ellipse cx="155" cy="95" rx="4" ry="11" fill="#06B6D4" />
          </g>
        )}

        {/* 4. AKSESORI TOPI (PALING ATAS) */}
        {equippedSet.has('acc_hat_grad') && (
          <g id="acc-hat-grad">
            {/* Topi Toga Wisuda / Lulus Utang */}
            <ellipse cx="100" cy="62" rx="30" ry="7" fill="#1E293B" />
            {/* Papan Persegi Belah Ketupat */}
            <polygon points="100,40 148,53 100,66 52,53" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
            {/* Kancing Tengah */}
            <circle cx="100" cy="53" r="3.5" fill="#F59E0B" />
            {/* Tali Tassel */}
            <path d="M 100 53 Q 75 58 68 76" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
            <polygon points="68,76 64,88 72,88" fill="#F59E0B" />
          </g>
        )}

        {equippedSet.has('acc_hat_cap') && (
          <g id="acc-hat-cap">
            {/* Kubah Topi Sporty */}
            <path d="M 64 68 C 64 42, 136 42, 136 68 Z" fill="#2563EB" />
            {/* Garis Panel */}
            <path d="M 100 44 L 100 68" stroke="#1D4ED8" strokeWidth="2" />
            {/* Lidah / Brim Topi */}
            <path d="M 60 67 Q 100 82 144 64 Q 100 70 60 67 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="1.5" />
            {/* Kancing Atas */}
            <circle cx="100" cy="44" r="3" fill="#DC2626" />
          </g>
        )}

        {equippedSet.has('acc_hat_crown') && (
          <g id="acc-hat-crown">
            {/* Mahkota Emas Bebas Hutang */}
            <polygon
              points="68,64 74,40 88,52 100,32 112,52 126,40 132,64"
              fill="url(#crownGrad)"
              stroke="#D97706"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <rect x="68" y="61" width="64" height="6" fill="#F59E0B" rx="2" stroke="#B45309" strokeWidth="1" />
            {/* Permata */}
            <circle cx="100" cy="42" r="3" fill="#EF4444" stroke="#991B1B" strokeWidth="0.8" />
            <circle cx="81" cy="48" r="2.5" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="0.8" />
            <circle cx="119" cy="48" r="2.5" fill="#10B981" stroke="#047857" strokeWidth="0.8" />
          </g>
        )}
      </svg>
    </div>
  );
}

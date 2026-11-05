// src/components/GFilesLogo.jsx
// The GFiles mark: a calculator with a gift bow, in a file folder with a magnifying glass.
export default function GFilesLogo({ size = 48 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 280 280"
      aria-hidden="true"
      style={{ overflow: "visible", flex: "none" }}
    >
      <rect x="20" y="92" width="240" height="168" rx="18" fill="#E3AB4E" />
      <rect x="28" y="74" width="96" height="34" rx="12" fill="#E3AB4E" />
      <rect x="70" y="30" width="140" height="190" rx="30" fill="#2BB5A0" />
      <path d="M140 32 C116 -4 92 16 140 32 Z" fill="#FF6F5B" />
      <path d="M140 32 C164 -4 188 16 140 32 Z" fill="#FF6F5B" />
      <circle cx="140" cy="31" r="8" fill="#D9503D" />
      <rect x="86" y="48" width="108" height="46" rx="15" fill="#E6FBF5" />
      <circle cx="120" cy="66" r="4.5" fill="#2E2250" />
      <circle cx="160" cy="66" r="4.5" fill="#2E2250" />
      <circle cx="106" cy="78" r="5" fill="#FFB3A7" />
      <circle cx="174" cy="78" r="5" fill="#FFB3A7" />
      <path d="M126 75 Q140 89 154 75" fill="none" stroke="#2E2250" strokeWidth="4" strokeLinecap="round" />
      <rect x="86" y="108" width="22" height="20" rx="8" fill="#FFFFFF" />
      <rect x="114" y="108" width="22" height="20" rx="8" fill="#FFFFFF" />
      <rect x="142" y="108" width="22" height="20" rx="8" fill="#FFFFFF" />
      <rect x="170" y="108" width="24" height="20" rx="8" fill="#FFD45C" />
      <rect x="86" y="134" width="22" height="20" rx="8" fill="#FFFFFF" />
      <rect x="114" y="134" width="22" height="20" rx="8" fill="#FFFFFF" />
      <rect x="142" y="134" width="22" height="20" rx="8" fill="#FFFFFF" />
      <rect x="20" y="152" width="240" height="108" rx="18" fill="#F6CD7B" />
      <rect x="96" y="184" width="88" height="42" rx="10" fill="#FFFFFF" />
      <text x="140" y="215" textAnchor="middle" fontFamily="Fredoka, sans-serif" fontWeight="700" fontSize="30" fill="#2E2250">G</text>
      <circle cx="216" cy="120" r="27" fill="#FFFFFF" fillOpacity="0.35" stroke="#2E2250" strokeWidth="7" />
      <path d="M236 141 L260 168" stroke="#2E2250" strokeWidth="10" strokeLinecap="round" />
    </svg>
  )
}

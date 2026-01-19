export default function VolunteerIllustration() {
  return (
    <svg
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto"
    >
      {/* Background abstract shape */}
      <path
        d="M 50 80 Q 80 60, 120 80 T 200 80 Q 220 90, 220 120 L 220 180 Q 220 200, 200 200 L 80 200 Q 60 200, 60 180 L 60 100 Q 60 80, 80 80 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="text-neutral-300"
      />

      {/* Heart symbol */}
      <path
        d="M 150 130 C 150 120, 140 115, 135 115 C 125 115, 120 125, 120 135 C 120 150, 150 170, 150 170 C 150 170, 180 150, 180 135 C 180 125, 175 115, 165 115 C 160 115, 150 120, 150 130 Z"
        fill="currentColor"
        className="text-rose-400"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* Helping hand - left */}
      <path
        d="M 100 180 L 90 200 Q 85 210, 90 215 L 95 220 L 100 225 L 105 225 L 110 220 L 115 215 L 118 210"
        fill="#D4A574"
        stroke="currentColor"
        strokeWidth="2"
        className="text-neutral-800"
      />

      {/* Fingers - left hand */}
      <path
        d="M 95 220 L 92 212 M 100 225 L 100 215 M 105 225 L 107 215 M 110 220 L 112 212"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-neutral-700"
      />

      {/* Helping hand - right */}
      <path
        d="M 200 180 L 210 200 Q 215 210, 210 215 L 205 220 L 200 225 L 195 225 L 190 220 L 185 215 L 182 210"
        fill="#D4A574"
        stroke="currentColor"
        strokeWidth="2"
        className="text-neutral-800"
      />

      {/* Fingers - right hand */}
      <path
        d="M 205 220 L 208 212 M 200 225 L 200 215 M 195 225 L 193 215 M 190 220 L 188 212"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="text-neutral-700"
      />

      {/* Person silhouette - left */}
      <ellipse cx="110" cy="245" rx="12" ry="15" fill="currentColor" className="text-neutral-800" />
      <rect
        x="100"
        y="255"
        width="20"
        height="30"
        rx="4"
        fill="currentColor"
        className="text-neutral-700"
      />

      {/* Person silhouette - center */}
      <ellipse cx="150" cy="240" rx="14" ry="17" fill="currentColor" className="text-neutral-800" />
      <rect
        x="138"
        y="252"
        width="24"
        height="35"
        rx="4"
        fill="currentColor"
        className="text-neutral-700"
      />

      {/* Person silhouette - right */}
      <ellipse cx="190" cy="245" rx="12" ry="15" fill="currentColor" className="text-neutral-800" />
      <rect
        x="180"
        y="255"
        width="20"
        height="30"
        rx="4"
        fill="currentColor"
        className="text-neutral-700"
      />

      {/* Connection lines between people */}
      <path
        d="M 120 265 Q 135 260, 145 265"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="text-neutral-400"
        strokeDasharray="4 4"
      />
      <path
        d="M 162 265 Q 176 260, 185 265"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="text-neutral-400"
        strokeDasharray="4 4"
      />

      {/* Decorative circles */}
      <circle cx="70" cy="100" r="4" fill="currentColor" className="text-yellow-400" />
      <circle cx="230" cy="110" r="4" fill="currentColor" className="text-yellow-400" />
      <circle cx="85" cy="140" r="3" fill="currentColor" className="text-rose-300" />
      <circle cx="215" cy="145" r="3" fill="currentColor" className="text-rose-300" />
    </svg>
  )
}

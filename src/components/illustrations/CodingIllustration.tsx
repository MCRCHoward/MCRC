export default function CodingIllustration() {
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

      {/* Browser window */}
      <rect
        x="100"
        y="120"
        width="140"
        height="100"
        rx="8"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="white"
        className="text-neutral-900"
      />

      {/* Browser dots */}
      <circle cx="112" cy="132" r="3" fill="currentColor" className="text-neutral-400" />
      <circle cx="124" cy="132" r="3" fill="currentColor" className="text-neutral-400" />
      <circle cx="136" cy="132" r="3" fill="currentColor" className="text-neutral-400" />

      {/* Code brackets */}
      <text
        x="120"
        y="170"
        fontSize="32"
        fontWeight="600"
        fill="currentColor"
        className="text-neutral-900"
        fontFamily="monospace"
      >
        {'</>'}
      </text>

      {/* Code lines */}
      <line x1="115" y1="185" x2="165" y2="185" stroke="currentColor" strokeWidth="2" className="text-neutral-300" />
      <line x1="115" y1="195" x2="145" y2="195" stroke="currentColor" strokeWidth="2" className="text-neutral-300" />
      <line x1="115" y1="205" x2="155" y2="205" stroke="currentColor" strokeWidth="2" className="text-neutral-300" />

      {/* Grid pattern on person */}
      <defs>
        <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M 0 0 L 4 0 M 0 0 L 0 4" stroke="currentColor" strokeWidth="0.5" className="text-neutral-400" />
        </pattern>
      </defs>

      {/* Person silhouette */}
      <path
        d="M 180 200 L 180 230 Q 180 240, 190 240 L 240 240 Q 250 240, 250 230 L 250 200 Q 250 190, 240 190 L 190 190 Q 180 190, 180 200 Z"
        fill="url(#grid)"
        stroke="currentColor"
        strokeWidth="2"
        className="text-neutral-800"
      />

      {/* Person head/hair */}
      <ellipse cx="215" cy="175" rx="20" ry="25" fill="currentColor" className="text-neutral-800" />
      
      {/* Hair detail */}
      <path
        d="M 195 165 Q 200 155, 215 160 Q 230 155, 235 165"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        className="text-neutral-900"
      />
      
      {/* Skin tone for hands/visible parts */}
      <ellipse cx="215" cy="180" rx="15" ry="18" fill="#D4A574" />

      {/* Arm holding paper */}
      <path
        d="M 230 200 L 250 180 Q 255 175, 260 180 L 265 190"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        className="text-neutral-800"
        strokeLinecap="round"
      />

      {/* Hand */}
      <circle cx="265" cy="195" r="6" fill="#D4A574" />
    </svg>
  )
}

interface VideoHeroProps {
  /** Main title text - supports splitting by colon for different font weights */
  title: string
  /** Subtitle/description text */
  subtitle: string
  /** Path to video file */
  videoSrc: string
  /** Fallback poster image if video doesn't load */
  posterSrc?: string
  /** Height of the hero section (default: 85vh) */
  height?: string
  /** Overlay opacity (0-1, default: 0.5) */
  overlayOpacity?: number
}

export function VideoHero({
  title,
  subtitle,
  videoSrc,
  posterSrc,
  height = '85vh',
  overlayOpacity = 0.5,
}: VideoHeroProps) {
  // Split title by colon to apply different font weights
  const titleParts = title.split(':')
  const hasColon = titleParts.length > 1 && titleParts[0] !== undefined
  const titleBold = hasColon && titleParts[0] ? titleParts[0].trim() : title
  const titleNormal = hasColon ? titleParts.slice(1).join(':').trim() : ''

  return (
    <section
      className="relative flex items-center justify-center overflow-hidden"
      style={{ height }}
    >
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={posterSrc}
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden="true"
      >
        <source src={videoSrc} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay for better text readability */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
        aria-hidden="true"
      />

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Title */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white drop-shadow-2xl sm:text-5xl md:text-6xl lg:text-7xl">
            {hasColon ? (
              <>
                <span className="font-bold">{titleBold}:</span>{' '}
                <span className="font-normal">{titleNormal}</span>
              </>
            ) : (
              <span className="font-bold">{title}</span>
            )}
          </h1>

          {/* Subtitle */}
          <div className="mx-auto max-w-3xl">
            <p className="text-lg leading-relaxed text-white drop-shadow-lg sm:text-xl md:text-2xl">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Scroll indicator (optional visual cue) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
        <svg
          className="h-6 w-6 text-white drop-shadow-lg"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </section>
  )
}


import Image from 'next/image'
import { cn } from '@/utilities/ui'

export interface TwoColPhotoSectionProps {
  /** Section title */
  title: string
  /** Section subtitle/description */
  subtitle: string
  /** Image configuration */
  image: {
    src: string
    alt: string
  }
  /** Image position (default: left) */
  imagePosition?: 'left' | 'right'
  /** Show decorative gradient background (default: false) */
  showGradient?: boolean
  /** Additional className for the section */
  className?: string
}

export function TwoColPhotoSection({
  title,
  subtitle,
  image,
  imagePosition = 'left',
  showGradient = false,
  className,
}: TwoColPhotoSectionProps) {
  return (
    <section className={cn('overflow-hidden bg-white py-24 sm:py-32', className)}>
      <div className="relative isolate">
        {/* Optional Gradient Background */}
        {showGradient && (
          <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-16 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
          >
            <div
              style={{
                clipPath:
                  'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
              }}
              className="aspect-[1318/752] w-[82.375rem] flex-none bg-gradient-to-r from-secondary to-primary opacity-25"
            />
          </div>
        )}

        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div
            className={cn(
              'mx-auto flex max-w-2xl flex-col gap-8 md:gap-12 lg:gap-16 bg-card px-6 py-16 shadow-lg ring-1 ring-border sm:rounded-3xl sm:p-8 lg:mx-0 lg:max-w-none lg:items-center lg:py-20 xl:px-20',
              imagePosition === 'left' ? 'lg:flex-row' : 'lg:flex-row-reverse'
            )}
          >
            {/* Image */}
            <div className="relative h-96 w-full flex-none rounded-2xl overflow-hidden lg:aspect-square lg:h-auto lg:max-w-sm">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 400px"
                priority
              />
            </div>

            {/* Content */}
            <div className="w-full flex-auto">
              <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground leading-tight">
                {title}
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-foreground">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


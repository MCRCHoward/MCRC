import { ArrowUpRight, LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/utilities/ui'

export interface FeatureCard {
  /** Icon component from lucide-react */
  icon: LucideIcon
  /** Title text for the feature card */
  title: string
  /** Optional description text */
  description?: string
}

export interface TwoColFeatureGridProps {
  /** Main heading */
  title: string
  /** Description text below the title */
  description: string
  /** Optional second paragragh */
  description2?: string
  /** Optional CTA button configuration */
  button?: {
    text: string
    href: string
    /** Custom background color (default: secondary brand color) */
    bgColor?: string
    /** Custom hover background color */
    hoverBgColor?: string
  }
  /** Array of feature cards to display in the grid */
  features: FeatureCard[]
  /** Custom background color for the container (default: tertiary) */
  containerBgColor?: string
  /** Custom accent color for icons (default: secondary brand color) */
  accentColor?: string
  /** Additional className for the section */
  className?: string
}

export function TwoColFeatureGrid({
  title,
  description,
  description2,
  button,
  features,
  containerBgColor = 'bg-tertiary',
  accentColor,
  className,
}: TwoColFeatureGridProps) {
  // Use secondary brand color as default accent (rgb(255, 223, 181))
  const defaultAccentColor = accentColor || 'rgb(255, 223, 181)'
  // Calculate hover color - slightly darker than accent color
  const hoverBgColor = button?.hoverBgColor || 'rgb(245, 210, 165)'

  return (
    <section
      className={cn('bg-white flex items-center justify-center min-h-screen p-4', className)}
    >
      <div
        className={cn(
          'rounded-[3rem] p-10 md:p-16 w-full container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center',
          containerBgColor,
        )}
      >
        {/* Left Column: Title, Description, and Button */}
        <div className="space-y-6 md:space-y-8 max-w-lg">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight md:leading-tight">
            {title}
          </h2>
          <p className="text-foreground text-base md:text-lg lg:text-xl leading-relaxed md:leading-relaxed">
            {description}
          </p>
          {description2 && (
            <p className="text-foreground text-base md:text-lg lg:text-xl leading-relaxed md:leading-relaxed">
              {description2}
            </p>
          )}

          {button && (
            <Link
              href={button.href}
              className="group transition-colors text-secondary-foreground font-semibold text-base md:text-lg px-4 py-3 pl-6 rounded-full inline-flex items-center gap-4 mt-4 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-tertiary"
              style={{
                backgroundColor: button.bgColor || defaultAccentColor,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverBgColor
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = button.bgColor || defaultAccentColor
              }}
            >
              <span>{button.text}</span>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground group-hover:rotate-45 transition-transform duration-300">
                <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />
              </div>
            </Link>
          )}
        </div>

        {/* Right Column: Feature Grid */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            const isThreeItems = features.length === 3
            const isThirdItem = isThreeItems && index === 2

            return (
              <div
                key={index}
                className={cn(
                  'bg-white p-6 md:p-8 lg:p-10 rounded-3xl flex flex-col justify-center items-center text-center shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 h-[240px] md:h-[260px] lg:h-[280px]',
                  isThirdItem && 'col-span-2',
                )}
                tabIndex={0}
                role="article"
                aria-label={feature.title}
              >
                <div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-full mb-4 md:mb-5 flex items-center justify-center"
                  style={{ backgroundColor: defaultAccentColor }}
                >
                  <IconComponent
                    className="w-6 h-6 md:w-7 md:h-7 text-secondary-foreground"
                    aria-hidden="true"
                  />
                </div>
                <span className="font-semibold text-foreground text-base md:text-lg lg:text-xl leading-snug">
                  {feature.title}
                </span>
                {feature.description && (
                  <p className="text-foreground text-sm md:text-base lg:text-lg mt-2 md:mt-3 leading-relaxed opacity-90">
                    {feature.description}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

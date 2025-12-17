'use client'

import { LucideIcon, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/utilities/ui'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export interface AccordionItemType {
  /** Unique identifier for the accordion item */
  id: string
  /** Icon component from lucide-react */
  icon: LucideIcon
  /** Title text for the accordion item */
  title: string
  /** Content text displayed when expanded */
  content: string
}

export interface TwoColAccordionWithImagesProps {
  /** Optional badge configuration */
  badge?: {
    text: string
    icon?: LucideIcon
  }
  /** Main heading */
  title: string
  /** Optional word in title to style differently (italic primary color) */
  titleStyledWord?: string
  /** Description text below the title */
  description: string
  /** Array of accordion items */
  items: AccordionItemType[]
  /** Images configuration for right column */
  images: {
    main: {
      src: string
      alt: string
    }
    secondary: {
      src: string
      alt: string
    }
  }
  /** Additional className for the section */
  className?: string
}

export function TwoColAccordionWithImages({
  badge,
  title,
  titleStyledWord,
  description,
  items,
  images,
  className,
}: TwoColAccordionWithImagesProps) {
  // Split title to style specific word
  const renderTitle = () => {
    if (!titleStyledWord) {
      return (
        <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">{title}</h2>
      )
    }

    const parts = title.split(titleStyledWord)
    return (
      <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
        {parts[0]}
        <span className="italic text-primary">{titleStyledWord}</span>
        {parts[1]}
      </h2>
    )
  }

  return (
    <section className={cn('bg-white py-16', className)}>
      <div className="container mx-auto px-4">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(auto,34rem)] gap-8 lg:gap-[5%] items-start">
          {/* Left Column: Content & Accordion */}
          <div className="space-y-6">
            {/* Badge */}
            {badge && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tertiary text-secondary-foreground">
                {badge.icon && <badge.icon className="w-4 h-4" />}
                <span className="text-sm font-medium">{badge.text}</span>
              </div>
            )}

            {/* Title */}
            {renderTitle()}

            {/* Description */}
            <p className="text-foreground text-base md:text-lg leading-relaxed max-w-2xl">
              {description}
            </p>

            {/* Accordion */}
            <div className="pt-4">
              <Accordion type="single" collapsible className="space-y-4">
                {items.map((item) => {
                  const IconComponent = item.icon
                  return (
                    <AccordionItem
                      key={item.id}
                      value={item.id}
                      className="bg-tertiary rounded-xl border-none"
                    >
                      <AccordionTrigger className="w-full px-6 py-5 hover:no-underline [&[data-state=open]>div>div:last-child>svg]:rotate-180">
                        <div className="flex items-center gap-4 flex-1 text-left">
                          {/* Left Icon Circle */}
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shrink-0">
                            <IconComponent
                              className="w-5 h-5 text-primary-foreground"
                              aria-hidden="true"
                            />
                          </div>
                          {/* Title */}
                          <span className="font-semibold text-foreground text-base md:text-lg">
                            {item.title}
                          </span>
                        </div>
                        {/* Right Chevron Circle
                        <div className="w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center shrink-0">
                          <ChevronDown className="w-4 h-4 text-slate-900 transition-transform duration-200" aria-hidden="true" />
                        </div> */}
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-5 pt-0">
                        <p className="text-foreground text-sm md:text-base pl-14 leading-relaxed">
                          {item.content}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </div>
          </div>

          {/* Right Column: Images */}
          <div className="grid grid-cols-[1.5fr_1fr] gap-4 md:gap-6 h-full">
            {/* Main Image */}
            <div className="relative w-full min-h-[48rem] rounded-xl overflow-clip">
              <Image
                src={images.main.src}
                alt={images.main.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 34rem"
                priority
              />
            </div>

            {/* Secondary Image Column */}
            <div className="flex flex-col justify-between items-end">
              <div className="relative w-full h-[32rem] rounded-xl overflow-clip">
                <Image
                  src={images.secondary.src}
                  alt={images.secondary.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 30vw, 15rem"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

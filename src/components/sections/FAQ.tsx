import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface FaqItem {
  id: string
  question: string
  answer?: string
  list?: string[]
}

interface FAQProps {
  heading?: string
  subheading?: string
  subheadingBullets?: string[]
  items?: FaqItem[]
}

const FAQ = ({ 
  heading = 'Frequently asked questions', 
  subheading, 
  subheadingBullets,
  items 
}: FAQProps) => {
  return (
    <section className="my-32">
      <div className="container space-y-8">
        <div className="mx-auto flex max-w-3xl flex-col text-left md:text-center space-y-4">
          <h2 className="mb-3 text-3xl font-semibold md:mb-4 lg:mb-6 lg:text-4xl">{heading}</h2>
          {subheading && (
            <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
              {subheading}
            </p>
          )}
          {subheadingBullets && subheadingBullets.length > 0 && (
            <ul className="text-muted-foreground text-base lg:text-lg leading-relaxed space-y-2 text-left mx-auto max-w-2xl">
              {subheadingBullets.map((bullet, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <span className="flex-1">{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Accordion type="single" collapsible className="mx-auto w-full lg:max-w-3xl">
          {items?.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="transition-opacity duration-200 hover:no-underline hover:opacity-60">
                <div className="font-medium sm:py-1 lg:py-2 lg:text-lg">{item.question}</div>
              </AccordionTrigger>
              <AccordionContent className="sm:mb-1 lg:mb-2">
                <div className="text-muted-foreground lg:text-lg">
                  {item.list ? (
                    <ul className="list-disc pl-5">
                      {item.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>{item.answer}</p>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

export { FAQ }

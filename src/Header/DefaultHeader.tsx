'use client'

import {
  AppWindow,
  ArrowRight,
  ArrowRightLeft,
  Book,
  Calendar,
  Globe,
  Lightbulb,
  Menu,
  Mic,
  Newspaper,
  Play,
  PlayCircle,
  Pyramid,
  Rocket,
  Sunset,
  Trees,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Fragment, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/utilities/ui'
import { defaultMenuItems, defaultLogo, defaultAuth, type MenuItem } from './menu-data'

// --- Types and Data ---
interface NavbarProps {
  logo?: { url: string; src: string; alt: string; title: string }
  menu?: MenuItem[]
  auth?: { login: { title: string; url: string }; signup: { title: string; url: string } }
}

interface Topic {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

const resources: MenuItem[] = [
  {
    title: 'Events & Webinars',
    description: 'Learn from industry experts.',
    url: '#',
    icon: Calendar,
  },
  {
    title: 'Past Recordings',
    description: 'Listen to past webinars and events.',
    url: '#',
    icon: Mic,
  },
  {
    title: 'Blog',
    description: 'Latest updates and best practices.',
    url: '/blog',
    icon: Newspaper,
  },
  {
    title: 'Video Tutorials',
    description: 'Get started with guided videos.',
    url: '#',
    icon: PlayCircle,
  },
  {
    title: 'Knowledge Base',
    description: 'Detailed guides and documentation.',
    url: '#',
    icon: Book,
  },
  {
    title: 'Success Stories',
    description: 'How our services have helped others.',
    url: '#',
    icon: Lightbulb,
  },
]

const topicGroups: { title: string; topics: Topic[] }[] = [
  {
    title: 'Learning Resources',
    topics: [
      { title: 'Getting Started Guide', url: '/get-started', icon: Globe },
      { title: 'Updates', url: '#', icon: Rocket },
      { title: 'Best Practices', url: '#', icon: Pyramid },
      { title: 'Apply to Become a Partner', url: '#', icon: ArrowRightLeft },
      { title: 'Partner Resources', url: '#', icon: AppWindow },
    ],
  },
  {
    title: 'Community',
    topics: [{ title: 'Community Forum', url: '#', icon: Play }],
  },
]

// --- Component for the Resources dropdown content ---
const ResourcesMenu = () => (
  <div className="grid gap-y-12 md:grid-cols-2 md:gap-x-6 lg:grid-cols-4 lg:gap-6">
    <div className="col-span-1">
      <Link
        href="#"
        className="group relative flex h-full flex-row overflow-hidden rounded-lg bg-primary p-0 text-primary-foreground lg:rounded-xl"
      >
        <div className="relative z-10 flex w-full flex-col-reverse text-left">
          <div className="relative z-20 flex flex-col px-6 pt-6 pb-[14rem] md:pt-40 md:pb-6">
            <div className="mt-auto flex items-center space-x-1 text-xs">
              Resource Center
              <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-1" />
            </div>
            <p className="mt-2 text-xs">
              Access guides, tutorials, and best practices to assist you in your journey.
            </p>
          </div>
          <div className="absolute inset-0">
            <Image
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-4.svg"
              alt="placeholder"
              className="h-full w-full object-cover object-center invert"
              width={500}
              height={500}
            />
          </div>
          <div className="absolute inset-x-0 top-0 z-10 h-[60%] bg-[linear-gradient(hsl(var(--primary))_50%,transparent)] md:top-auto md:bottom-[-10%] md:h-[50%] md:bg-[linear-gradient(transparent,hsl(var(--primary))_50%)]"></div>
        </div>
      </Link>
    </div>
    <div className="lg:col-span-2 lg:flex lg:flex-col">
      <div>
        <div className="mb-4 border-border pb-3 text-left md:mb-6 lg:border-b">
          <strong className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Featured Resources
          </strong>
        </div>
      </div>
      <menu className="grid gap-y-4 lg:h-full lg:grid-cols-2 lg:gap-6">
        {resources.map((resource) => (
          <li key={resource.title}>
            <NavigationMenuLink asChild>
              <Link
                href={resource.url}
                className="group flex flex-row items-center space-x-4 rounded-md border-border bg-accent px-6 py-5 text-left md:space-x-5 lg:border lg:bg-background lg:p-5"
              >
                {resource.icon && (
                  <div className="text-primary">
                    <resource.icon className="size-5 shrink-0" />
                  </div>
                )}
                <div className="ml-4 flex-1">
                  <div className="font-medium text-foreground/85 group-hover:text-foreground">
                    {resource.title}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground group-hover:text-foreground">
                    {resource.description}
                  </p>
                </div>
                <ArrowRight className="hidden size-4 transition-transform group-hover:translate-x-1 lg:block" />
              </Link>
            </NavigationMenuLink>
          </li>
        ))}
      </menu>
    </div>
    <div className="col-span-1 md:col-span-2 lg:col-span-1">
      {topicGroups.map((group) => (
        <Fragment key={group.title}>
          <div className="mb-4 border-border pb-3 text-left md:col-span-2 md:mb-7 lg:border-b">
            <strong className="text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {group.title}
            </strong>
          </div>
          <menu className="mb-7 grid md:grid-cols-2 md:gap-x-6 lg:grid-cols-1 lg:gap-x-0">
            {group.topics.map((topic: Topic) => (
              <li key={topic.title}>
                <NavigationMenuLink asChild>
                  <Link
                    href={topic.url}
                    className="group flex flex-row items-center space-x-6 border-b border-border py-5 text-left sm:py-8 lg:space-x-4 lg:border-0 lg:py-0"
                  >
                    <div className="flex aspect-square size-9 shrink-0 items-center justify-center">
                      {topic.icon && <topic.icon className="size-5" />}
                    </div>
                    <div className="flex-1 text-xs font-medium text-foreground/85 group-hover:text-foreground md:text-sm">
                      {topic.title}
                    </div>
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 lg:hidden" />
                  </Link>
                </NavigationMenuLink>
              </li>
            ))}
          </menu>
        </Fragment>
      ))}
    </div>
  </div>
)

// --- Main Header Component ---
export function DefaultHeader({
  logo = defaultLogo,
  menu = defaultMenuItems,
  auth = defaultAuth,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const SubMenuLink = ({ item }: { item: MenuItem }) => {
    const Icon = item.icon
    return (
      <Link
        href={item.url}
        onClick={() => setIsMobileMenuOpen(false)}
        className="flex flex-row items-start gap-4 rounded-md p-3 text-left leading-none no-underline transition-colors outline-none hover:bg-muted"
      >
        {Icon && (
          <div className="mt-0.5 text-primary">
            <Icon className="size-5 shrink-0" />
          </div>
        )}
        <div>
          <div className="font-semibold">{item.title}</div>
          {item.description && (
            <p className="text-sm leading-snug text-muted-foreground">{item.description}</p>
          )}
        </div>
      </Link>
    )
  }

  return (
    <header
      className={cn(
        'fixed left-0 top-0 z-50 w-full transition-all duration-300',
        isScrolled ? 'md:py-3' : 'md:py-6',
      )}
    >
      <div className="container">
        <div
          className={cn(
            'relative mx-auto bg-background transition-shadow duration-300 md:rounded-lg',
            isScrolled ? 'shadow-lg' : 'shadow-sm',
          )}
        >
          <nav className="relative z-10 flex items-center justify-between px-4 py-3 md:py-2">
            <Link href={logo.url} className="flex items-center gap-2">
              <Image src={logo.src} alt={logo.alt} width={32} height={32} />
              <span className="hidden font-semibold sm:inline-block">{logo.title}</span>
            </Link>

            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList>
                {menu.map((item) =>
                  item.title === 'Resources' ? (
                    <NavigationMenuItem key={item.title}>
                      <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                      {/* Note: Positioning classes have been removed as requested */}
                      <NavigationMenuContent className="min-w-[calc(100vw-4rem)] p-12 2xl:min-w-[calc(1400px-4rem)]">
                        <ResourcesMenu />
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ) : item.items ? (
                    <NavigationMenuItem key={item.title}>
                      <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                          {item.items.map((subItem) => (
                            <li key={subItem.title}>
                              <NavigationMenuLink asChild>
                                <SubMenuLink item={subItem} />
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ) : (
                    // --- CORRECTED: Modern Link Pattern ---
                    <NavigationMenuItem key={item.title}>
                      <NavigationMenuLink asChild active={pathname === item.url}>
                        <Link
                          href={item.url}
                          className={cn(navigationMenuTriggerStyle(), 'lg:p-2')}
                        >
                          {item.title}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ),
                )}
              </NavigationMenuList>
            </NavigationMenu>

            <div className="hidden lg:flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={auth.login.url}>{auth.login.title}</Link>
              </Button>
              <Button asChild size="sm">
                <Link href={auth.signup.url}>{auth.signup.title}</Link>
              </Button>
            </div>

            <div className="lg:hidden">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="size-5" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent className="flex w-full flex-col sm:max-w-sm">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Main Menu</SheetTitle>
                    <Link
                      href={logo.url}
                      className="flex items-center gap-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Image src={logo.src} alt={logo.alt} width={32} height={32} />
                      <span className="font-semibold">{logo.title}</span>
                    </Link>
                  </SheetHeader>
                  <nav className="flex flex-col gap-6 pt-6">
                    <Accordion type="single" collapsible className="w-full">
                      {menu.map((item) =>
                        item.items || item.title === 'Resources' ? (
                          <AccordionItem key={item.title} value={item.title}>
                            <AccordionTrigger className="text-md font-semibold hover:no-underline">
                              {item.title}
                            </AccordionTrigger>
                            <AccordionContent className="pt-2">
                              <div className="flex flex-col gap-1">
                                {(item.title === 'Resources' ? resources : item.items)?.map(
                                  (subItem) => (
                                    <SubMenuLink key={subItem.title} item={subItem} />
                                  ),
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ) : (
                          <Link
                            key={item.title}
                            href={item.url}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              'flex w-full border-b py-4 text-md font-semibold',
                              pathname === item.url && 'text-primary',
                            )}
                          >
                            {item.title}
                          </Link>
                        ),
                      )}
                    </Accordion>
                  </nav>
                  <div className="mt-auto flex flex-col gap-2 pt-6">
                    <Button asChild variant="outline" size="lg">
                      <Link href={auth.login.url}>{auth.login.title}</Link>
                    </Button>
                    <Button asChild size="lg">
                      <Link href={auth.signup.url}>{auth.signup.title}</Link>
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}

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
import { Fragment } from 'react'
import Image from 'next/image'
import Link from 'next/link'

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
} from '@/components/ui/navigation-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { defaultMenuItems, defaultLogo, defaultAuth } from './menu-data'

// --- Types and Data ---
interface MenuItem {
  title: string
  url: string
  description?: string
  icon?: React.ReactNode
  items?: MenuItem[]
}

interface NavbarProps {
  logo?: { url: string; src: string; alt: string; title: string }
  menu?: MenuItem[]
  auth?: { login: { title: string; url: string }; signup: { title: string; url: string } }
}

// --- Data for the Resources Menu ---
const resources: MenuItem[] = [
  {
    title: 'Events & Webinars',
    description: 'Learn from industry experts.',
    url: '/events',
    icon: <Calendar className="size-5 shrink-0" />,
  },
  {
    title: 'Past Recordings',
    description: 'Listen to past webinars and events.',
    url: '#',
    icon: <Mic className="size-5 shrink-0" />,
  },
  {
    title: 'Blog',
    description: 'Latest updates and best practices.',
    url: '/blog',
    icon: <Newspaper className="size-5 shrink-0" />,
  },
  {
    title: 'Video Tutorials',
    description: 'Get started with guided videos.',
    url: '#',
    icon: <PlayCircle className="size-5 shrink-0" />,
  },
  {
    title: 'Knowledge Base',
    description: 'Detailed guides and documentation.',
    url: '#',
    icon: <Book className="size-5 shrink-0" />,
  },
  {
    title: 'Success Stories',
    description: 'How our services have helped others.',
    url: '#',
    icon: <Lightbulb className="size-5 shrink-0" />,
  },
]

const topicGroups = [
  {
    title: 'Learning Resources',
    topics: [
      { title: 'Getting Started Guide', url: '#', icon: Globe },
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
            <div className="mt-auto flex items-center text-xs">
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
                <div className="text-primary">{resource.icon}</div>
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
            {group.topics.map((topic) => (
              <li key={topic.title}>
                <NavigationMenuLink asChild>
                  <Link
                    href={topic.url}
                    className="group flex flex-row items-center space-x-6 border-b border-border py-5 text-left sm:py-8 lg:space-x-4 lg:border-0 lg:py-0"
                  >
                    <div className="flex aspect-square size-9 shrink-0 items-center justify-center">
                      <topic.icon className="size-5" />
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

// Main Header Component for the Homepage
export function HomepageHeader({
  logo = defaultLogo,
  menu = defaultMenuItems,
  auth = defaultAuth,
}: NavbarProps) {
  // --- Encapsulated helper components ---
  const SubMenuLink = ({ item }: { item: MenuItem }) => (
    <Link
      href={item.url}
      className="flex flex-row gap-4 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-muted"
    >
      <div className="text-primary">{item.icon}</div>
      <div>
        <div className="text-sm font-semibold">{item.title}</div>
        {item.description && (
          <p className="text-sm leading-snug text-muted-foreground">{item.description}</p>
        )}
      </div>
    </Link>
  )

  const renderMenuItem = (item: MenuItem) => {
    // --- UPDATED: Special case for the new 'Resources' menu ---
    if (item.title === 'Resources') {
      return (
        <NavigationMenuItem key={item.title}>
          <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
          <NavigationMenuContent className="min-w-[calc(100vw-4rem)] p-12 2xl:min-w-[calc(1400px-4rem)]">
            <ResourcesMenu />
          </NavigationMenuContent>
        </NavigationMenuItem>
      )
    }

    if (item.items) {
      return (
        <NavigationMenuItem key={item.title}>
          <NavigationMenuTrigger>{item.title}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
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
      )
    }

    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuLink asChild>
          <Link href={item.url}>{item.title}</Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    )
  }

  const renderMobileMenuItem = (item: MenuItem) => {
    // --- UPDATED: Special case for 'Resources' in mobile ---
    if (item.title === 'Resources') {
      return (
        <AccordionItem key={item.title} value={item.title} className="border-b-0">
          <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
            {item.title}
          </AccordionTrigger>
          <AccordionContent className="mt-2">
            <div className="flex flex-col gap-1">
              {resources.map((subItem) => (
                <SubMenuLink key={subItem.title} item={subItem} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )
    }

    if (item.items) {
      return (
        <AccordionItem key={item.title} value={item.title} className="border-b-0">
          <AccordionTrigger className="text-md py-0 font-semibold hover:no-underline">
            {item.title}
          </AccordionTrigger>
          <AccordionContent className="mt-2">
            <div className="flex flex-col gap-1">
              {item.items.map((subItem) => (
                <SubMenuLink key={subItem.title} item={subItem} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )
    }

    return (
      <Link key={item.title} href={item.url} className="block border-b py-4 text-md font-semibold">
        {item.title}
      </Link>
    )
  }

  return (
    <section className="py-4 z-50 relative bg-background">
      <div className="container">
        {/* Desktop Menu */}
        <nav className="hidden justify-between lg:flex">
          <div className="flex items-center gap-6">
            <Link href={logo.url} className="flex items-center gap-2">
              <Image src={logo.src} className="max-h-8" alt={logo.alt} width={32} height={32} />
              <span className="text-lg font-semibold tracking-tighter">{logo.title}</span>
            </Link>
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {menu.map((item) => (
                    <span key={item.title} className="lg:p-2">
                      {renderMenuItem(item)}
                    </span>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={auth.login.url}>{auth.login.title}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={auth.signup.url}>{auth.signup.title}</Link>
            </Button>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className="block lg:hidden">
          <div className="flex items-center justify-between">
            <Link href={logo.url} className="flex items-center gap-2">
              <Image src={logo.src} className="max-h-8" alt={logo.alt} width={32} height={32} />
            </Link>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>
                    <Link href={logo.url} className="flex items-center gap-2">
                      <Image
                        src={logo.src}
                        className="max-h-8"
                        alt={logo.alt}
                        width={32}
                        height={32}
                      />
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 p-4">
                  <Accordion type="single" collapsible className="w-full">
                    {menu.map((item) => renderMobileMenuItem(item))}
                  </Accordion>
                  <div className="flex flex-col gap-3">
                    <Button asChild variant="outline">
                      <Link href={auth.login.url}>{auth.login.title}</Link>
                    </Button>
                    <Button asChild>
                      <Link href={auth.signup.url}>{auth.signup.title}</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </section>
  )
}

import {
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
} from 'react-icons/fa'

import Image from 'next/image'
import Link from 'next/link'
import { NewsletterForm } from '@/components/newsletter'

interface FooterLink {
  name: string
  href: string
  icon?: React.ReactNode
}

const sections = [
  {
    title: 'Pages',
    links: [
      { name: 'Home', href: '/' },
      { name: 'About', href: '/about' },
      { name: 'Services', href: '/services' },
      { name: 'Contact', href: '/contact' },
    ] as FooterLink[],
  },
  {
    title: 'Resources',
    links: [
      { name: 'Donate', href: '/donate' },
      { name: 'Blog', href: '/blog' },
      { name: 'Events', href: '/events' },
    ] as FooterLink[],
  },
  {
    title: 'Our Location',
    links: [
      {
        name: '9770 Patuxent Woods Drive, Columbia, MD 21046, Suite 306',
        href: 'https://maps.app.goo.gl/9770PatuxentWoodsDriveSuite306ColumbiaMD21046',
        icon: <FaMapMarkerAlt />,
      },
      { name: '(443) 518-7693', href: 'tel:+14435187693', icon: <FaPhone /> },
      { name: 'info@mcrchoward.org', href: 'mailto:info@mcrchoward.org', icon: <FaEnvelope /> },
    ] as FooterLink[],
  },
]

interface Footer3Props {
  logo?: {
    url: string
    src: string
    alt: string
    title: string
    icon?: React.ReactNode
  }
}
const Footer = ({
  logo = {
    url: '/',
    src: '/images/logo/mcrc-logo.png',
    alt: 'logo',
    title: 'MCRC Howard County',
    icon: <FaMapMarkerAlt />,
  },
}: Footer3Props) => {
  return (
    <section className="pt-16 pb-32 bg-tertiary text-tertiary-foreground">
      <div className="container">
        <footer>
          {/* Logo */}
          <div className="flex items-center gap-2 lg:justify-start">
            <Link href={logo.url} className="flex items-center gap-2">
              <Image
                src={logo.src}
                alt={logo.alt}
                title={logo.title}
                className="h-12"
                width={48}
                height={48}
              />
              <h3 className="font-bold text-2xl">
                <span className="text-blue">MCRC</span> Howard County
              </h3>
            </Link>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-4">
            {sections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                <h3 className="mb-4 font-bold">{section.title}</h3>
                <ul className="space-y-4 text-muted-foreground">
                  {section.links.map((link, linkIdx) => (
                    <li
                      key={linkIdx}
                      className="font-medium flex hover:text-primary hover:underline"
                    >
                      {link.icon && <span className="mr-2 mt-1">{link.icon}</span>}
                      <Link href={link.href}>{link.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="lg:col-span-2 xl:col-span-1">
              <Link
                href="https://app.candid.org/profile/9653121/mediation-and-conflict-resolution-center-61-1822581"
                target="_blank"
              >
                <Image
                  src="/images/awards/candid-seal-platinum-2025.png"
                  alt="logo"
                  width={100}
                  height={100}
                />
              </Link>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <h5 className="text-sm font-medium mt-4">Subscribe to our newsletter</h5>
                <NewsletterForm showNames={true} variant="default" />
                <p className="mt-1 text-xs text-muted-foreground">
                  By submitting, you agree to our
                  <Link href="/privacy-policy" className="ml-1 text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-24 flex flex-col flex-wrap justify-between gap-4 border-t pt-8 text-sm font-medium text-muted-foreground md:flex-row md:items-center">
            <p>© {new Date().getFullYear()} MCRC Howard County. All rights reserved.</p>
            <ul className="flex gap-4">
              <li className="whitespace-nowrap underline hover:text-primary">
                <Link href="/terms-of-service">Terms and Conditions</Link>
              </li>
              <li className="whitespace-nowrap underline hover:text-primary">
                <Link href="/privacy-policy">Privacy Policy</Link>
              </li>
            </ul>
          </div>
        </footer>
      </div>
    </section>
  )
}

export { Footer }

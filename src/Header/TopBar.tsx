'use client'
import { Mail, MapPin, Facebook, Instagram, Youtube } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function TopBar() {
  const pathname = usePathname()
  const isHomePage = pathname === '/'

  if (!isHomePage) return null

  return (
    <section className="hidden md:block w-full text-muted-foreground border-b border-border text-xs ">
      <div className="container flex items-center justify-between py-1.5">
        {/* Left content: Address and Email */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded bg-secondary p-1">
              <MapPin className="w-4 h-4 text-primary" aria-hidden="true" />
            </span>
            <span className="top-bar-content">
              9770 Patuxent Woods Drive, Columbia, MD 21046, Suite 306
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded bg-secondary p-1">
              <Mail className="w-4 h-4 text-primary" aria-hidden="true" />
            </span>
            <span className="top-bar-content">info@mcrchoward.org</span>
          </div>
        </div>
        {/* Right content: Social Icons */}
        <div className="flex items-center gap-2">
          <a
            href="https://www.facebook.com/MCRCHoCo"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="social-link bg-accent rounded-full p-1 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Facebook className="w-4 h-4" />
          </a>
          <a
            href="https://www.instagram.com/talk.it.out.hoco/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="social-link bg-accent rounded-full p-1 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Instagram className="w-4 h-4" />
          </a>
          <a
            href="https://www.youtube.com/@mediationandconflictresolu9121/videos"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="social-link bg-accent rounded-full p-1 hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Youtube className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  )
}

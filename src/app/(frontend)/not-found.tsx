import Link from 'next/link'
import React from 'react'
import { FileQuestion, Home, Mail, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="container py-28">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <FileQuestion className="h-16 w-16 text-muted-foreground" strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="mb-4 text-6xl font-bold tracking-tight">404</h1>
        <h2 className="mb-4 text-2xl font-semibold">Page Not Found</h2>
        <p className="mb-8 text-lg text-muted-foreground">
          The page you are looking for does not exist or has been moved. Let&apos;s get you back on
          track.
        </p>

        <div className="mb-8 flex flex-wrap justify-center gap-4">
          <Button asChild variant="default" size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/contact">
              <Mail className="mr-2 h-4 w-4" />
              Contact Us
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/blog">
              <Search className="mr-2 h-4 w-4" />
              Browse Blog
            </Link>
          </Button>
        </div>

        <Card className="mt-8 text-left">
          <CardHeader>
            <CardTitle>Popular Pages</CardTitle>
            <CardDescription>You might be looking for one of these:</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-primary hover:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-primary hover:underline">
                  Our Services
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-primary hover:underline">
                  Blog & Resources
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-primary hover:underline">
                  Events & Workshops
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-primary hover:underline">
                  Contact Us
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

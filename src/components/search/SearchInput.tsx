'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useState, useEffect } from 'react'
import { Search as SearchIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'

interface SearchInputProps {
  className?: string
  defaultValue?: string
}

export function SearchInput({ className, defaultValue = '' }: SearchInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(defaultValue)

  // Sync with URL on mount and when URL changes (back/forward navigation)
  useEffect(() => {
    const urlQuery = searchParams.get('q') || ''
    setQuery(urlQuery)
  }, [searchParams])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      const trimmedQuery = query.trim()

      if (trimmedQuery) {
        params.set('q', trimmedQuery)
      } else {
        params.delete('q')
      }

      // Update URL without causing full page reload
      router.push(`/search?${params.toString()}`, { scroll: false })
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  return (
    <form onSubmit={handleSubmit} className={cn('relative w-full', className)}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search posts..."
          value={query}
          onChange={handleChange}
          className="w-full pl-10 pr-24"
          disabled={isPending}
          aria-label="Search posts"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2"
          disabled={isPending || !query.trim()}
        >
          {isPending ? 'Searching...' : 'Search'}
        </Button>
      </div>
    </form>
  )
}

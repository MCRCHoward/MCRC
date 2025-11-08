'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, User } from 'lucide-react'
import { cn } from '@/utilities/ui'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { User as UserType } from '@/types'

interface AuthorSelectProps {
  authors: UserType[]
  selectedAuthorIds: string[]
  onSelectionChange: (authorIds: string[]) => void
  disabled?: boolean
}

/**
 * Multi-select component for choosing blog post authors
 */
export function AuthorSelect({
  authors,
  selectedAuthorIds,
  onSelectionChange,
  disabled = false,
}: AuthorSelectProps) {
  const [open, setOpen] = React.useState(false)

  const toggleAuthor = (authorId: string) => {
    const newSelection = selectedAuthorIds.includes(authorId)
      ? selectedAuthorIds.filter((id) => id !== authorId)
      : [...selectedAuthorIds, authorId]
    onSelectionChange(newSelection)
  }

  const selectedAuthors = authors.filter((author) => selectedAuthorIds.includes(author.id))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">
              {selectedAuthors.length === 0
                ? 'Select authors...'
                : selectedAuthors.length === 1
                  ? selectedAuthors[0]?.name || 'Selected'
                  : `${selectedAuthors.length} authors selected`}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search authors..." />
          <CommandList>
            <CommandEmpty>No authors found.</CommandEmpty>
            <CommandGroup>
              {authors.map((author) => {
                const isSelected = selectedAuthorIds.includes(author.id)
                return (
                  <CommandItem
                    key={author.id}
                    value={author.id}
                    onSelect={() => toggleAuthor(author.id)}
                  >
                    <Check
                      className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')}
                    />
                    <div className="flex flex-col">
                      <span>{author.name || author.email || 'Unknown'}</span>
                      {author.email && author.name && (
                        <span className="text-xs text-muted-foreground">{author.email}</span>
                      )}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Display component for selected authors (chips/badges)
 */
export function AuthorChips({
  authors,
  selectedAuthorIds,
  onRemove,
}: {
  authors: UserType[]
  selectedAuthorIds: string[]
  onRemove?: (authorId: string) => void
}) {
  const selectedAuthors = authors.filter((author) => selectedAuthorIds.includes(author.id))

  if (selectedAuthors.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {selectedAuthors.map((author) => (
        <div
          key={author.id}
          className="flex items-center gap-2 rounded-md border bg-muted px-2 py-1 text-sm"
        >
          <User className="h-3 w-3 opacity-50" />
          <span>{author.name || author.email || 'Unknown'}</span>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(author.id)}
              className="ml-1 rounded-sm opacity-70 hover:opacity-100"
              aria-label={`Remove ${author.name || author.email}`}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

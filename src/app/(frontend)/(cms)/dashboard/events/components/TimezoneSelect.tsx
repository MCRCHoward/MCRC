'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Clock } from 'lucide-react'
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
import { cn } from '@/utilities/ui'

interface TimezoneOption {
  value: string
  label: string
  offset: string
  region: string
}

// Get all supported timezones and group them
function getTimezones(): TimezoneOption[] {
  try {
    const timezones = Intl.supportedValuesOf('timeZone')
    return timezones.map((tz) => {
      const date = new Date()
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'shortOffset',
      })
      const parts = formatter.formatToParts(date)
      const offset = parts.find((p) => p.type === 'timeZoneName')?.value || ''

      // Extract region (first part before /)
      const region = tz.split('/')[0] || 'Other'
      const city = tz.split('/').slice(1).join(' / ') || tz

      return {
        value: tz,
        label: city.replace(/_/g, ' '),
        offset,
        region,
      }
    })
  } catch {
    // Fallback if Intl.supportedValuesOf is not available
    return [
      { value: 'America/New_York', label: 'New York', offset: 'EST', region: 'America' },
      { value: 'America/Chicago', label: 'Chicago', offset: 'CST', region: 'America' },
      { value: 'America/Denver', label: 'Denver', offset: 'MST', region: 'America' },
      { value: 'America/Los_Angeles', label: 'Los Angeles', offset: 'PST', region: 'America' },
      { value: 'UTC', label: 'UTC', offset: 'UTC', region: 'Other' },
    ]
  }
}

interface TimezoneSelectProps {
  value?: string
  onValueChange: (value: string) => void
  className?: string
}

export function TimezoneSelect({ value, onValueChange, className }: TimezoneSelectProps) {
  const [open, setOpen] = React.useState(false)
  const timezones = React.useMemo(() => getTimezones(), [])
  const [searchQuery, setSearchQuery] = React.useState('')

  // Group timezones by region
  const groupedTimezones = React.useMemo(() => {
    const grouped: Record<string, TimezoneOption[]> = {}
    timezones.forEach((tz) => {
      if (!grouped[tz.region]) {
        grouped[tz.region] = []
      }
      grouped[tz.region].push(tz)
    })
    return grouped
  }, [timezones])

  // Filter based on search
  const filteredGroups = React.useMemo(() => {
    if (!searchQuery) return groupedTimezones

    const query = searchQuery.toLowerCase()
    const filtered: Record<string, TimezoneOption[]> = {}

    Object.entries(groupedTimezones).forEach(([region, tzs]) => {
      const matching = tzs.filter(
        (tz) =>
          tz.label.toLowerCase().includes(query) ||
          tz.value.toLowerCase().includes(query) ||
          tz.offset.toLowerCase().includes(query),
      )
      if (matching.length > 0) {
        filtered[region] = matching
      }
    })

    return filtered
  }, [groupedTimezones, searchQuery])

  const selectedTimezone = timezones.find((tz) => tz.value === value)
  const displayValue = selectedTimezone
    ? `${selectedTimezone.label} (${selectedTimezone.offset})`
    : 'Select timezone...'

  // Get current time in selected timezone
  const currentTime = React.useMemo(() => {
    if (!value) return ''
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: value,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date())
    } catch {
      return ''
    }
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{displayValue}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search timezone..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            {Object.entries(filteredGroups).map(([region, tzs]) => (
              <CommandGroup key={region} heading={region}>
                {tzs.map((tz) => (
                  <CommandItem
                    key={tz.value}
                    value={tz.value}
                    onSelect={() => {
                      onValueChange(tz.value)
                      setOpen(false)
                      setSearchQuery('')
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === tz.value ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{tz.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {tz.offset} {value === tz.value && currentTime && `• ${currentTime}`}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}


'use client'

import { useCallback, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  useGooglePlacesAutocomplete,
  type ParsedAddress,
} from '@/hooks/useGooglePlacesAutocomplete'
import type { EventFormValues } from './eventFormSchema'

interface AddressAutocompleteProps {
  disabled?: boolean
}

export function AddressAutocomplete({ disabled }: AddressAutocompleteProps) {
  const { control, setValue } = useFormContext<EventFormValues>()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handlePlaceSelect = useCallback(
    (address: ParsedAddress) => {
      setValue('addressLine1', address.addressLine1, { shouldValidate: true })
      setValue('city', address.city, { shouldValidate: true })
      setValue('state', address.state, { shouldValidate: true })
      setValue('postalCode', address.postalCode, { shouldValidate: true })
      setValue('country', address.country, { shouldValidate: true })
    },
    [setValue],
  )

  const { isLoaded, isInitializing } = useGooglePlacesAutocomplete({
    inputRef,
    onPlaceSelect: handlePlaceSelect,
    enabled: !disabled,
  })

  return (
    <>
      <FormField
        control={control}
        name="addressLine1"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Address line 1
              {isInitializing && (
                <Loader2 className="ml-2 inline h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  ref={(element) => {
                    inputRef.current = element
                    if (typeof field.ref === 'function') {
                      field.ref(element)
                    }
                  }}
                  placeholder="Start typing your address..."
                  aria-label="Address line 1 with autocomplete"
                  disabled={disabled || !isLoaded}
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e)
                    setValue('addressLine1', e.target.value, { shouldValidate: true })
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                />
                {!isLoaded && (
                  <div className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="addressLine2"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Address line 2</FormLabel>
            <FormControl>
              <Input placeholder="Address line 2" disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="city"
        render={({ field }) => (
          <FormItem>
            <FormLabel>City</FormLabel>
            <FormControl>
              <Input placeholder="City" disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="state"
        render={({ field }) => (
          <FormItem>
            <FormLabel>State/Province</FormLabel>
            <FormControl>
              <Input placeholder="State/Province" disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="postalCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Postal code</FormLabel>
            <FormControl>
              <Input placeholder="Postal code" disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="country"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Country</FormLabel>
            <FormControl>
              <Input placeholder="Country" disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

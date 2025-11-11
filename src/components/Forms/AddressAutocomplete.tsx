'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Loader2 } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

/**
 * Google Maps Places Autocomplete Integration
 *
 * ⚠️ DEPRECATION WARNING: This component uses the legacy `google.maps.places.Autocomplete` API.
 * As of March 1st, 2025, this API is not available to new customers. Google recommends
 * migrating to `google.maps.places.PlaceAutocompleteElement` (Places API New).
 *
 * The legacy API will continue to work for existing customers and receive bug fixes,
 * but new features will not be added. At least 12 months notice will be given before
 * support is discontinued.
 *
 * TODO: Migrate to PlaceAutocompleteElement when ready
 * Migration Guide: https://developers.google.com/maps/documentation/javascript/places-migration-overview
 * Legacy API Info: https://developers.google.com/maps/legacy
 *
 * If you see errors about "legacy API not enabled", ensure the Places API is enabled
 * in Google Cloud Console: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
 */

// Extend Window interface for Google Maps types
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: { types?: string[] },
          ) => {
            addListener: (event: string, callback: () => void) => void
            getPlace: () => {
              address_components?: Array<{
                long_name: string
                short_name: string
                types: string[]
              }>
              formatted_address?: string
            }
          }
        }
      }
    }
  }
}

// Type for Google Places Autocomplete
type GooglePlacesAutocomplete = {
  addListener: (event: string, callback: () => void) => void
  getPlace: () => {
    address_components?: Array<{
      long_name: string
      short_name: string
      types: string[]
    }>
    formatted_address?: string
  }
}

interface completeProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  streetAddressFieldName: string
  cityFieldName: string
  stateFieldName: string
  zipCodeFieldName: string
  streetAddressLabel?: string
  cityLabel?: string
  stateLabel?: string
  zipCodeLabel?: string
  streetAddressDescription?: string
  disabled?: boolean
  className?: string
}

/**
 * Parses Google Places address components and extracts address parts
 */
function parseAddressComponents(
  addressComponents: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>,
): {
  streetNumber: string
  streetName: string
  city: string
  state: string
  zipCode: string
} {
  const result = {
    streetNumber: '',
    streetName: '',
    city: '',
    state: '',
    zipCode: '',
  }

  for (const component of addressComponents) {
    const types = component.types

    if (types.includes('street_number')) {
      result.streetNumber = component.long_name
    } else if (types.includes('route')) {
      result.streetName = component.long_name
    } else if (types.includes('locality')) {
      result.city = component.long_name
    } else if (types.includes('administrative_area_level_1')) {
      result.state = component.short_name // Use short name for state (e.g., "MD" instead of "Maryland")
    } else if (types.includes('postal_code')) {
      result.zipCode = component.long_name
    }
  }

  return result
}

export function AddressAutocomplete({
  form,
  streetAddressFieldName,
  cityFieldName,
  stateFieldName,
  zipCodeFieldName,
  streetAddressLabel = 'Street Address',
  cityLabel = 'City',
  stateLabel = 'State',
  zipCodeLabel = 'Zip Code',
  streetAddressDescription,
  disabled = false,
  className,
}: completeProps) {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = React.useState(false)
  const [isInitializing, setIsInitializing] = React.useState(false)
  const autocompleteRef = React.useRef<GooglePlacesAutocomplete | null>(null)
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  // Check if Google Maps is loaded
  React.useEffect(() => {
    const checkGoogleMaps = () => {
      if (typeof window !== 'undefined' && window.google?.maps?.places) {
        setIsGoogleMapsLoaded(true)
        return true
      }
      return false
    }

    // Check immediately
    if (checkGoogleMaps()) {
      return
    }

    // Poll for Google Maps to load (in case script loads after component mounts)
    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  // Initialize autocomplete when Google Maps is loaded
  React.useEffect(() => {
    if (!isGoogleMapsLoaded || !inputRef.current || disabled) {
      return
    }

    if (autocompleteRef.current) {
      return // Already initialized
    }

    setIsInitializing(true)

    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'], // Restrict to addresses only
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()

        if (!place.address_components) {
          setIsInitializing(false)
          return
        }

        const addressParts = parseAddressComponents(place.address_components)

        // Set form values
        const streetAddress = [addressParts.streetNumber, addressParts.streetName]
          .filter(Boolean)
          .join(' ')

        form.setValue(streetAddressFieldName, streetAddress, { shouldValidate: true })
        form.setValue(cityFieldName, addressParts.city, { shouldValidate: true })
        form.setValue(stateFieldName, addressParts.state, { shouldValidate: true })
        form.setValue(zipCodeFieldName, addressParts.zipCode, { shouldValidate: true })

        setIsInitializing(false)
      })

      autocompleteRef.current = autocomplete
      setIsInitializing(false)
    } catch (error) {
      console.error('[complete] Error initializing Google Places:', error)
      setIsInitializing(false)
    }

    return () => {
      if (autocompleteRef.current) {
        // Cleanup if needed
        autocompleteRef.current = null
      }
    }
  }, [
    isGoogleMapsLoaded,
    disabled,
    form,
    streetAddressFieldName,
    cityFieldName,
    stateFieldName,
    zipCodeFieldName,
  ])

  return (
    <div className={className}>
      {/* Street Address with Autocomplete */}
      <FormField
        control={form.control}
        name={streetAddressFieldName}
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>
              {streetAddressLabel} *
              {isInitializing && (
                <Loader2 className="ml-2 inline h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  ref={(e) => {
                    inputRef.current = e
                    // Call field.ref if it's a function
                    if (typeof field.ref === 'function') {
                      field.ref(e)
                    }
                  }}
                  placeholder="Start typing your address..."
                  aria-label="Street address with autocomplete"
                  disabled={disabled || !isGoogleMapsLoaded}
                  value={field.value || ''}
                  onChange={(e) => {
                    field.onChange(e)
                    form.setValue(streetAddressFieldName, e.target.value, { shouldValidate: true })
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                />
                {!isGoogleMapsLoaded && (
                  <div className="absolute inset-0 flex items-center justify-end pr-3 pointer-events-none">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </FormControl>
            {streetAddressDescription && (
              <FormDescription>{streetAddressDescription}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      {/* City */}
      <FormField
        control={form.control}
        name={cityFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{cityLabel} *</FormLabel>
            <FormControl>
              <Input placeholder="City" aria-label="City" disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* State */}
      <FormField
        control={form.control}
        name={stateFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{stateLabel} *</FormLabel>
            <FormControl>
              <Input placeholder="State" aria-label="State" disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Zip Code */}
      <FormField
        control={form.control}
        name={zipCodeFieldName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{zipCodeLabel} *</FormLabel>
            <FormControl>
              <Input placeholder="Zip Code" aria-label="Zip code" disabled={disabled} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

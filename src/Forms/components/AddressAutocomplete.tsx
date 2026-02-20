'use client'

import { useCallback, useRef } from 'react'
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
import type { FieldValues, Path, PathValue, UseFormReturn } from 'react-hook-form'
import {
  useGooglePlacesAutocomplete,
  type ParsedAddress,
} from '@/hooks/useGooglePlacesAutocomplete'

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

interface AddressAutocompleteProps<T extends FieldValues = FieldValues> {
  form: UseFormReturn<T>
  streetAddressFieldName: Path<T>
  cityFieldName: Path<T>
  stateFieldName: Path<T>
  zipCodeFieldName: Path<T>
  streetAddressLabel?: string
  cityLabel?: string
  stateLabel?: string
  zipCodeLabel?: string
  streetAddressDescription?: string
  disabled?: boolean
  className?: string
}

export function AddressAutocomplete<T extends FieldValues = FieldValues>({
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
}: AddressAutocompleteProps<T>) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handlePlaceSelect = useCallback(
    (address: ParsedAddress) => {
      form.setValue(
        streetAddressFieldName,
        address.addressLine1 as PathValue<T, typeof streetAddressFieldName>,
        { shouldValidate: true },
      )
      form.setValue(cityFieldName, address.city as PathValue<T, typeof cityFieldName>, {
        shouldValidate: true,
      })
      form.setValue(stateFieldName, address.state as PathValue<T, typeof stateFieldName>, {
        shouldValidate: true,
      })
      form.setValue(
        zipCodeFieldName,
        address.postalCode as PathValue<T, typeof zipCodeFieldName>,
        { shouldValidate: true },
      )
    },
    [form, streetAddressFieldName, cityFieldName, stateFieldName, zipCodeFieldName],
  )

  const { isLoaded: isGoogleMapsLoaded, isInitializing } = useGooglePlacesAutocomplete({
    inputRef,
    onPlaceSelect: handlePlaceSelect,
    enabled: !disabled,
  })

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
                    form.setValue(
                      streetAddressFieldName,
                      e.target.value as PathValue<T, typeof streetAddressFieldName>,
                      { shouldValidate: true },
                    )
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

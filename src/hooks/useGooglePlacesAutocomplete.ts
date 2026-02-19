'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

interface GoogleAddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

interface GoogleAutocompletePlace {
  address_components?: GoogleAddressComponent[]
}

interface GooglePlacesAutocomplete {
  addListener: (event: string, callback: () => void) => void
  getPlace: () => GoogleAutocompletePlace
}

interface GoogleMapsWindow {
  google?: {
    maps?: {
      places?: {
        Autocomplete: new (
          input: HTMLInputElement,
          options?: { types?: string[] },
        ) => GooglePlacesAutocomplete
      }
    }
  }
}

export interface ParsedAddress {
  addressLine1: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface UseGooglePlacesAutocompleteOptions {
  inputRef: RefObject<HTMLInputElement | null>
  onPlaceSelect: (address: ParsedAddress) => void
  enabled?: boolean
}

export interface UseGooglePlacesAutocompleteResult {
  isLoaded: boolean
  isInitializing: boolean
}

function parseAddressComponents(
  addressComponents: GoogleAddressComponent[],
): ParsedAddress {
  let streetNumber = ''
  let streetName = ''
  let city = ''
  let state = ''
  let postalCode = ''
  let country = ''

  for (const component of addressComponents) {
    const types = component.types

    if (types.includes('street_number')) {
      streetNumber = component.long_name
    } else if (types.includes('route')) {
      streetName = component.long_name
    } else if (types.includes('locality')) {
      city = component.long_name
    } else if (types.includes('administrative_area_level_1')) {
      state = component.short_name
    } else if (types.includes('postal_code')) {
      postalCode = component.long_name
    } else if (types.includes('country')) {
      country = component.long_name
    }
  }

  return {
    addressLine1: [streetNumber, streetName].filter(Boolean).join(' '),
    city,
    state,
    postalCode,
    country,
  }
}

export function useGooglePlacesAutocomplete({
  inputRef,
  onPlaceSelect,
  enabled = true,
}: UseGooglePlacesAutocompleteOptions): UseGooglePlacesAutocompleteResult {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const autocompleteRef = useRef<GooglePlacesAutocomplete | null>(null)
  const onPlaceSelectRef = useRef(onPlaceSelect)

  useEffect(() => {
    onPlaceSelectRef.current = onPlaceSelect
  }, [onPlaceSelect])

  useEffect(() => {
    const checkGoogleMaps = () => {
      const places = (window as Window & GoogleMapsWindow).google?.maps?.places
      if (typeof window !== 'undefined' && places) {
        setIsLoaded(true)
        return true
      }
      return false
    }

    if (checkGoogleMaps()) {
      return
    }

    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!enabled || !isLoaded || !inputRef.current) {
      return
    }

    if (autocompleteRef.current) {
      return
    }

    setIsInitializing(true)
    try {
      const autocompleteCtor = (window as Window & GoogleMapsWindow).google?.maps?.places
        ?.Autocomplete
      if (!autocompleteCtor) {
        setIsInitializing(false)
        return
      }

      const autocomplete = new autocompleteCtor(inputRef.current, {
        types: ['address'],
      })

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (!place.address_components) {
          setIsInitializing(false)
          return
        }

        const parsed = parseAddressComponents(place.address_components)
        onPlaceSelectRef.current(parsed)
        setIsInitializing(false)
      })

      autocompleteRef.current = autocomplete
      setIsInitializing(false)
    } catch (error) {
      console.error('[useGooglePlacesAutocomplete] Error initializing:', error)
      setIsInitializing(false)
    }

    return () => {
      if (autocompleteRef.current) {
        autocompleteRef.current = null
      }
    }
  }, [enabled, inputRef, isLoaded])

  return {
    isLoaded,
    isInitializing,
  }
}

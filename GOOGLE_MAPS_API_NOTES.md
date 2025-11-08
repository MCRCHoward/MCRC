# Google Maps API Integration Notes

## Current Implementation

This project uses Google Maps Places Autocomplete for address input fields. The implementation uses the **legacy** `google.maps.places.Autocomplete` API.

## Console Warnings Explained

### 1. "Google Maps JavaScript API has been loaded directly without loading=async"

**Status**: ✅ **FIXED**

- Added `&loading=async` parameter to the Google Maps API URL
- Next.js `Script` component with `strategy="lazyOnload"` handles async loading
- This warning should no longer appear

### 2. "google.maps.places.Autocomplete is not available to new customers"

**Status**: ⚠️ **INFORMATIONAL WARNING**

This is an informational warning from Google. The legacy API:
- ✅ **Will continue to work** for existing implementations
- ✅ **Will receive bug fixes** for major regressions
- ⚠️ **Will not receive new features**
- ⚠️ **May be discontinued** with at least 12 months notice

**Current Status**: The legacy API is working correctly. This warning can be safely ignored for now.

**Future Migration**: When ready, migrate to `google.maps.places.PlaceAutocompleteElement` (Places API New).

- Migration Guide: https://developers.google.com/maps/documentation/javascript/places-migration-overview
- Legacy API Info: https://developers.google.com/maps/legacy

### 3. "You're calling a legacy API, which is not enabled for your project"

**Status**: ⚠️ **REQUIRES ACTION**

This error indicates that the Places API (New) needs to be enabled in Google Cloud Console, OR the legacy Places API needs to be properly configured.

**Resolution Steps**:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project** (the one associated with your API key)
3. **Navigate to APIs & Services > Library**
4. **Enable the Places API**:
   - Search for "Places API"
   - Enable "Places API" (the legacy version)
   - OR enable "Places API (New)" if you want to migrate to the new API
5. **Verify API Key Restrictions**:
   - Go to APIs & Services > Credentials
   - Click on your API key
   - Under "API restrictions", ensure "Places API" is allowed
   - Under "Application restrictions", ensure your domain is allowed

**Note**: The legacy Places API should work with the current implementation. If you see this error, it's likely a configuration issue in Google Cloud Console.

## Files Using Google Maps API

- `src/app/(frontend)/layout.tsx` - Script loading
- `src/components/Forms/AddressAutocomplete.tsx` - Autocomplete component
- `src/app/(frontend)/(cms)/dashboard/events/EventForm.tsx` - Event address autocomplete
- `src/app/(frontend)/(cms)/dashboard/events/new/page.tsx` - Event address autocomplete

## Environment Variable

Required: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

Set this in your `.env.local` file or deployment environment variables.

## Testing

To verify the Google Maps API is working:

1. Navigate to a form with address fields (e.g., `/services/mediation/request`)
2. Start typing an address in the "Street Address" field
3. You should see autocomplete suggestions appear
4. Selecting a suggestion should auto-populate city, state, and zip code fields

## Troubleshooting

### Autocomplete not appearing
- Check browser console for errors
- Verify `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set
- Verify Places API is enabled in Google Cloud Console
- Check API key restrictions allow your domain

### "Legacy API not enabled" error
- Enable Places API in Google Cloud Console
- Verify API key has Places API in its allowed APIs list
- Check API key restrictions match your domain

### Script loading warnings
- The `&loading=async` parameter has been added to the script URL
- Next.js Script component handles async loading automatically
- These warnings should be resolved

## Future Migration to Places API (New)

When ready to migrate to the new API:

1. Review migration guide: https://developers.google.com/maps/documentation/javascript/places-migration-overview
2. Enable "Places API (New)" in Google Cloud Console
3. Update `AddressAutocomplete.tsx` to use `PlaceAutocompleteElement` instead of `Autocomplete`
4. Update type definitions accordingly
5. Test thoroughly before deploying

The new API provides:
- Better performance
- More features
- Active development and support
- Better TypeScript support


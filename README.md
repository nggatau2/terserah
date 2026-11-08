# TERSRH

TERSRH is an Android-first date planner built with Expo SDK 58 and React Native. It also runs in a desktop browser.

## Run the sample version

Open PowerShell in this folder and run:

```powershell
npm.cmd ci
npm.cmd run web
```

Open the address printed by Expo. Use the existing preview at http://localhost:8081 if it is already running.

For Android, install the SDK 58 version of [Expo Go](https://expo.dev/go), run `npm.cmd start`, and scan its QR code in Expo Go from a phone on the same Wi-Fi. If another preview uses port 8081, Expo may offer another port. Keep the terminal running during the session.

- **New Plan** starts with participants and interests. Enter an interest and press Enter or tap Add interest. Pick a date, time, and area, then select up to five places within 3 km.
- **Quick Discovery** opens location immediately. Search a sample area or use GPS to find places within 5 km. Dates and times are optional.
- **Help Me Decide** uses selected stops when present, or the filtered list otherwise. Try Again excludes the previous result when there is another option. Choose This Place confirms the single pick and opens review.
- **Final review** lets you reorder or remove stops, enter arrival times, and save a named plan. The default timezone is Asia/Jakarta. Enter another IANA timezone such as Asia/Makassar to plan there. End time must be on the same day.
- **Plans** and **History** use device storage, or browser storage in the web preview. Use Edit plan to change a saved itinerary. Use Mark completed or Archive plan to move it to History. Passing the scheduled date leaves a plan in Plans.

Sample mode is active by default. It uses fictional venues, category illustrations, and a schematic map. It works anywhere by searching Menteng, Kemang, Kota Tua, or Senopati. If you use GPS outside the sample region, the app may show no results.

## Enable Google Maps and Places

The app uses two separate Google keys. The Places key stays in the Node process. The Embed key is visible to the map iframe and should be restricted to the Places bridge page's web origin.

1. In a Google Cloud project with billing enabled, enable **Places API (New)** and **Maps Embed API**.
2. Create a server key restricted to Places API (New) and to the server's egress IP where applicable. Create a separate Maps Embed API key with HTTP referrer restrictions for the bridge origin you will use, such as `http://localhost:8787/*` for the local web test.
3. Set the following variables in a terminal from your approved secret store, then start the bridge.

| Variable | Value |
|---|---|
| GOOGLE_PLACES_KEY | Server key for Places API (New) |
| GOOGLE_MAPS_EMBED_KEY | Referrer-restricted Embed API key |
| PLACES_PUBLIC_URL | Optional public base URL for map and photo links. Defaults to http://localhost:8787 |
| PLACES_ALLOWED_ORIGINS | Optional comma-separated browser origins. Defaults to http://localhost:8081 and http://127.0.0.1:8081 |
| PLACES_HOST / PLACES_PORT | Optional listen address and port. Defaults to 127.0.0.1:8787 |

```powershell
npm.cmd run places
```

4. Start Expo in a second terminal with the **bridge URL**, which is public configuration.

```powershell
$env:EXPO_PUBLIC_PLACES_URL = 'http://localhost:8787'
npm.cmd run web
```

For a physical Android device, use an HTTPS bridge URL reachable from the phone and configure PLACES_PUBLIC_URL to match. Localhost on a phone points back to the phone. Use the deployed bridge origin in the Embed key's restrictions, and set the browser origin allowlist for any web preview you use. Restart Expo when changing EXPO_PUBLIC_PLACES_URL. Clear it and restart to return to sample mode.

The bridge implements debounced Google autocomplete, Place Details, Nearby Search, a photo redirect, and an interactive Google Maps embed. A selected Google place ID can mark the chosen search location. The Google map shows the search area, while the app's filtered checklist handles venue selection. Live search requires a working internet connection. Saved Google plans keep place IDs and user itinerary data, and refresh Google venue details when needed. If the provider is unavailable, the saved plan and its timing remain accessible.

The bridge is for local development and binds to loopback by default. Before exposing it beyond a trusted environment, place it behind authenticated access, set quotas, and configure published terms and privacy information. Google keys and quota setup follow the [Google Maps Platform security guidance](https://developers.google.com/maps/api-security-best-practices) and [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies).

## Project files and checks

- `src/app/` contains the Expo Router screens for Plans, History, participants, schedule, location, discovery, review, and plan details.
- `src/ui.tsx`, `src/home.tsx`, `src/map-panel.tsx`, and the picker/map platform files contain the shared interface.
- `src/model.ts`, `src/state.tsx`, and `src/places-provider.ts` handle plan data, storage, and venue retrieval. `src/planner.ts` provides the sample catalog and distance and shuffle utilities.
- `server/places.mjs` is the optional Google bridge.
- `tests/` covers ranking, time validation, persistence shape, and the browser workflows.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npx.cmd playwright install chromium
npm.cmd run test:flow
npx.cmd expo-doctor
npx.cmd expo export --platform android
```

Run the browser suite in sample mode. The browser tests simulate GPS and the Android export verifies the bundle. Testing Google with actual keys and exercising GPS and the native pickers on a physical Android device are still required. The UI follows the written mockup descriptions because the mockup image files were unavailable. Plans are local to the device or browser profile, and drafts are kept while navigating within the session.

# TeRSeraH

A first Android date planner built with React Native, TypeScript, and Expo SDK 58.

## Run on your Android phone

1. Install [Expo Go](https://expo.dev/go). Choose Android / SDK 58 there if the Play Store version reports a version mismatch.
2. Open PowerShell in this folder (the folder containing package.json).
3. Run `npm ci` if dependencies are missing. They are already installed on this computer.
4. Run `npm start`.
5. Keep your phone and computer on the same Wi-Fi. Open Expo Go and scan the QR code printed in the terminal.
6. Leave the terminal running while using the app. Ctrl+C stops the server.

For a computer preview, run `npm run web` and open the localhost address Expo prints. The browser uses the same app code, but does not replace a real Android check.

If the phone cannot connect, check Windows Firewall allows Node on your private network. An optional alternative is `npx expo start --tunnel`; this uses an internet tunnel service. No tunnel or cloud build was started for this milestone.

## Try the main flow

1. Leave **Plan ahead · 3 km** selected and pick a sample area.
2. Rename the two people. Tap each person's interests to toggle them. Try **+ Add person**.
3. Tap **Choose stop 1**. Places liked by more people appear first. Choose a place.
4. Tap **Surprise us · fill all slots** to fill the slots with unique random places.
5. **Shuffle stop** replaces one place, excluding the current place and other selected stops. **Choose stop** lets you select manually.
6. Add destination slots up to five. Remove any unwanted stop.
7. Tap **Review our date** to see the itinerary in slot order.
8. Try **Quick discovery · 5 km**, then **Use my location**. Grant location permission. Outside the sample areas, an empty result is expected. **Try Menteng demo** works anywhere without GPS.

Changing area or discovery mode starts a fresh plan. Interests reorder recommendations but do not replace chosen stops. Shuffling chooses any eligible nearby place, rather than filtering by interests.

## Why this approach

React Native gives us Android UI using JavaScript/TypeScript. Expo handles development setup, so you can start on a phone without Android Studio. TypeScript catches some mistakes before the app runs.

Sample data avoids API keys, bills, servers, and login setup. There are 36 fictional venues across Menteng, Kemang, and Kota Tua. These are useful for testing the experience, not planning a real outing. Planned dates use 3 km from the selected area's center. Quick discovery uses 5 km from GPS or an explicitly selected demo location. Distances are straight-line distances, not driving or walking routes.

This version has one screen and a review section. It keeps names, interests, and the plan in memory; closing or reloading resets them. There is no saved plan, calendar/date picker, booking, route optimization, account, or sync yet. GPS is requested only when you tap the location button; the app does not transmit coordinates to a places service.

## Where to edit

- `App.tsx`: the screen, buttons, and current plan.
- `src/planner.ts`: sample places, distances, ranking, and random selection.
- `app.json`: app name, Android identifier, and location configuration.
- `tests/planner.test.ts`: logic checks.
- `tests/ui/flow.spec.ts`: phone-sized browser flow checks.

## Run checks

```powershell
npm run typecheck
npm test
npm run lint
npx expo-doctor
npx playwright install chromium
npm run test:flow
```

The browser tests use a 393 × 852 viewport and simulated location. They cover manual choice, interest changes, adding/removing people, five unique stops, shuffling, review, area changes, denied permission, and empty results. They do not prove real Android GPS, keyboard behavior, or phone connectivity. Android bundling was checked with `npx expo export --platform android`; this produces a bundle, not an APK.

## Git milestones

Git is local to this folder; no remote repository or upload was created. Run `git log --oneline` to inspect commits and `git diff` to see unsaved changes.

- Initial Expo scaffold commit.
- `milestone-1-working-planner`: app and sample catalog.
- `milestone-2-verified-demo`: checks and these instructions.

## Next steps

First try the app on your Android phone. Then add local plan saving, followed by real venue search and arbitrary area search. A live places provider needs configuration, attribution, error handling, and billing controls. Secret server keys must stay out of the app. A standalone APK/store release also needs signing and a separate build; Expo Go provides a development preview.

Dependency audit currently reports 12 moderate entries including development dependencies, or five with development dependencies omitted, with no high or critical entries. The latter entries come through Expo build/development tooling (glob/minimatch). The proposed automatic fix downgrades Expo across major versions, so it was not applied. Recheck compatible fixes before release.

The Expo lint wrapper rejected the installed ESLint version despite installing it itself. `npm run lint` invokes ESLint directly with Expo's generated config; that check passes.

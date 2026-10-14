# Cycle — Period tracker

A privacy-conscious, mobile-first period tracker built with React, TypeScript, Firebase Authentication, and Cloud Firestore. Estimates are informational and are not medically validated.

## Getting started

Requirements: Node.js 20+, npm, and a Firebase project.

1. Install dependencies with `npm install`.
2. Create a Firebase web app and copy `.env.example` to `.env.local`.
3. Fill in `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID`.
4. In Firebase Console, enable Google as an Authentication provider and add your local and production hostnames to the authorized domains.
5. Start the development server with `npm run dev`.

If Firebase is not configured, the app displays setup guidance rather than presenting a fake signed-in or offline account.

## Architecture

- `src/domain/cycle/` contains pure cycle and calendar-date calculations. Period dates are `YYYY-MM-DD` strings, and calculations use local calendar dates rather than UTC timestamps.
- `src/services/periodRepository.ts` owns the user's Firestore period collection operations.
- `src/app/AuthContext.tsx` restores Google Authentication state, creates the minimal user document, and handles desktop popup and mobile redirect sign-in.
- `src/features/` contains the login and tracker screens.
- `firestore.rules` restricts access to each signed-in user's own records and validates fields, date values, and timestamp invariants.
- `vite-plugin-pwa` generates the application manifest and service worker. Only the application shell/static assets are precached; Firestore responses are not cached.

Period duration is inclusive. Cycle length is the number of calendar days between starts. Estimates use up to the six most recent plausible intervals (15–45 days); records with invalid dates, duplicate starts, overlaps, or implausible intervals are excluded and surfaced for review. With fewer than two usable starts, the app shows a clearly labeled 28-day preliminary estimate. Actual records and calculated estimates remain separate.

## Local Firebase emulator

The Firestore emulator is configured on port `8080`. Run it locally with:

```sh
npx firebase emulators:start --only firestore --project demo-c-tracker
```

## Production deployment

Production hosting uses Firebase Hosting and publishes the Vite build from `dist/`. The hosting configuration serves the app as a single-page application, applies security headers, and gives fingerprinted build assets long-lived caching while keeping the entry point and service worker revalidatable.

1. Create or select the production Firebase project. In Firebase Console, enable Google Authentication, create the Cloud Firestore database, and add the production Hosting domain to Authentication's authorized domains.
2. Sign in to Firebase CLI and select the production project:

   ```sh
   npx firebase login
   npx firebase use --add
   ```

   Select the production project and save it under a `prod` alias. The generated `.firebaserc` is local project selection; do not commit it unless the repository is intentionally being tied to that project.
3. Create `.env.production.local` from `.env.example` and set the production web app's `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID`. Ensure `VITE_FIREBASE_PROJECT_ID` matches the project saved under the `prod` alias. These are browser-side Firebase configuration values, not server secrets; restrict the API key to the production app as appropriate in Google Cloud.
4. Deploy the Hosting site and the repository's Firestore rules and indexes:

   ```sh
   npm run deploy:prod
   ```

   The script builds before deploying and explicitly targets the `prod` alias. It deploys Hosting, Firestore rules, and indexes; it does not provision Firebase products or deploy database contents.

## Build

```sh
npm run build
```

The reference UI is designed for narrow phone screens and uses an installable PWA manifest. On iOS, use Safari's **Share → Add to Home Screen**; on Android, use the browser's install option.

# Project instructions

- Make focused changes and follow the existing React and TypeScript patterns. Keep TypeScript strict and avoid adding dependencies unless necessary.
- Keep cycle calculations pure in `src/domain/cycle/`; keep Firestore operations in `src/services/`; put screen-specific UI in `src/features/`.
- Represent period dates as local calendar `YYYY-MM-DD` strings. Do not convert these dates through UTC timestamps.
- Preserve the app's privacy-conscious behavior. Do not add fake signed-in, offline, or Firestore data fallbacks, and never expose secrets or personal data.
- Before finishing, run `npm run build` only for big changes and report any checks that could not be run.

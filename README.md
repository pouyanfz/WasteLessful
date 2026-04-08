# Wasteless

How many times have you thrown out food you forgot you had? Wasteless helps you track items across locations, monitor expiry dates, manage quantities, and build shopping lists so nothing goes to waste.

## Features

- Track food and household items across multiple locations (Home, Office, Cabin, etc.)
- Monitor expiry dates with color-coded status (fresh, expiring soon, expired)
- Manage quantities with a progress bar and one-tap reduce
- Shopping list with links back to the items that triggered them
- Share groups with roommates or partners for real-time sync
- Works offline as an installable PWA
- Anonymous mode — no account needed to get started

## Tech Stack

- **Frontend** — React + Vite + TypeScript + Tailwind CSS
- **Database** — Firebase Firestore (with offline persistence)
- **Auth** — Firebase Authentication (anonymous → Google / email upgrade)
- **Hosting** — Firebase Hosting
- **PWA** — vite-plugin-pwa

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore and Authentication enabled

### Installation

```bash
git clone https://github.com/your-username/wasteless.git
cd wasteless
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Fill in the values from your Firebase project settings.

### Run locally

```bash
npm run dev
```

### Run tests

```bash
npm run test
```

### Deploy

```bash
npm run build
npx firebase-tools deploy
```

## Project Status

Currently in active development.

- [x] Project setup
- [ ] TypeScript types + mock data + unit tests
- [ ] UI with mock data
- [ ] Firebase integration
- [ ] Authentication
- [ ] PWA
- [ ] Deploy

## License

MIT